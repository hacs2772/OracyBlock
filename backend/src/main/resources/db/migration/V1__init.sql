-- OracyBlock 첫 테이블
-- owner = 기록 주인: 로그인한 사람 'u:12', 가입 안 한 사람(기기) 'v:방문자번호'. 가입·로그인하면 'v:'를 'u:'로 옮겨요

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    nickname      VARCHAR(20)  NOT NULL,
    role          VARCHAR(10)  NOT NULL DEFAULT 'USER',
    level         INT          NOT NULL DEFAULT 1,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_seen_at  TIMESTAMPTZ
);
COMMENT ON TABLE users IS '가입한 사람 (이메일은 소문자로 저장)';

CREATE TABLE visit_day (
    visitor_id VARCHAR(64) NOT NULL,
    day        DATE        NOT NULL,
    user_id    BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    hits       INT         NOT NULL DEFAULT 1,
    first_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (visitor_id, day)
);
COMMENT ON TABLE visit_day IS '사이트에 들어온 날 (기기마다 하루 한 줄, 한국 날짜). 관리자 통계용';
CREATE INDEX idx_visit_day_day ON visit_day(day);

CREATE TABLE play (
    id          BIGSERIAL PRIMARY KEY,
    owner       VARCHAR(80) NOT NULL,
    user_id     BIGINT      REFERENCES users(id) ON DELETE CASCADE,
    visitor_id  VARCHAR(64) NOT NULL,
    talk_id     VARCHAR(40) NOT NULL,
    level       INT         NOT NULL,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    day         DATE,
    crooked     BOOLEAN,
    bounces     INT NOT NULL DEFAULT 0,
    hints       INT NOT NULL DEFAULT 0,
    speak_n     INT NOT NULL DEFAULT 0,
    write_n     INT NOT NULL DEFAULT 0,
    choose_n    INT NOT NULL DEFAULT 0,
    ok_n        INT NOT NULL DEFAULT 0,
    near_n      INT NOT NULL DEFAULT 0,
    rescue_n    INT NOT NULL DEFAULT 0,
    bricks      TEXT
);
COMMENT ON TABLE play IS '대화 한 번 (시작하면 생기고, 끝내면 finished_at·결과가 채워짐). day = 끝낸 한국 날짜';
CREATE INDEX idx_play_owner ON play(owner, finished_at DESC);
CREATE INDEX idx_play_user_day ON play(user_id, day);

CREATE TABLE fix_item (
    id         BIGSERIAL PRIMARY KEY,
    owner      VARCHAR(80) NOT NULL,
    play_id    BIGINT      NOT NULL REFERENCES play(id) ON DELETE CASCADE,
    turn_idx   INT         NOT NULL,
    kind       VARCHAR(8)  NOT NULL,
    prev       VARCHAR(200) NOT NULL DEFAULT '',
    fixed_how  VARCHAR(10),
    fixed_at   TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_fix_kind CHECK (kind IN ('hole', 'tilt'))
);
COMMENT ON TABLE fix_item IS '고칠 곳: hole = 구멍 난 돌기(놓친 단어), tilt = 비뚤어진 브릭(어긋난 대답)';
CREATE INDEX idx_fix_owner ON fix_item(owner) WHERE fixed_at IS NULL;

CREATE TABLE word (
    owner      VARCHAR(80)  NOT NULL,
    word_key   VARCHAR(80)  NOT NULL,
    ko         VARCHAR(80)  NOT NULL,
    mean       VARCHAR(120) NOT NULL,
    say        VARCHAR(80)  NOT NULL,
    stage      INT          NOT NULL DEFAULT 0,
    due_day    DATE         NOT NULL,
    missed     INT          NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (owner, word_key)
);
COMMENT ON TABLE word IS '내 단어 (간격 반복 복습: stage 0~4 → 1·3·7·14·30일 뒤)';

CREATE TABLE word_answer (
    id     BIGSERIAL PRIMARY KEY,
    owner  VARCHAR(80) NOT NULL,
    ok     BOOLEAN     NOT NULL,
    at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feedback (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    visitor_id VARCHAR(64),
    message    TEXT NOT NULL,
    page       VARCHAR(40),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 관리자 통계에서 관리자(운영자 본인) 기기는 빼요
CREATE VIEW admin_visitor AS
    SELECT DISTINCT visitor_id FROM visit_day v JOIN users u ON u.id = v.user_id WHERE u.role = 'ADMIN'
    UNION
    SELECT DISTINCT visitor_id FROM play p JOIN users u ON u.id = p.user_id WHERE u.role = 'ADMIN';
CREATE VIEW s_visit AS SELECT * FROM visit_day WHERE visitor_id NOT IN (SELECT visitor_id FROM admin_visitor);
CREATE VIEW s_play AS SELECT * FROM play WHERE visitor_id NOT IN (SELECT visitor_id FROM admin_visitor);
