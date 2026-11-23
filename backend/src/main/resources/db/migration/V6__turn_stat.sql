-- V6: 차례별 기록 (대화를 끝낼 때 한 번에). 관리자 화면 "어려운 차례"에서 어느 대사에서 많이 튕기는지 봐요
CREATE TABLE turn_stat (
    id        BIGSERIAL PRIMARY KEY,
    play_id   BIGINT      NOT NULL REFERENCES play(id) ON DELETE CASCADE,
    talk_id   VARCHAR(40) NOT NULL,
    turn_idx  INT         NOT NULL,
    wrong     SMALLINT    NOT NULL DEFAULT 0,  -- 튕긴 횟수
    skipped   BOOLEAN     NOT NULL DEFAULT false, -- 두 번 튕겨 넘어감
    hint      BOOLEAN     NOT NULL DEFAULT false, -- 힌트를 봄
    near      BOOLEAN     NOT NULL DEFAULT false  -- 어색한 대답을 고름
);
CREATE INDEX idx_turn_stat_talk ON turn_stat(talk_id, turn_idx);
