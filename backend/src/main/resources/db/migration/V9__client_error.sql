-- V9: 화면 오류 모으기 (concept 11-26). 같은 날 같은 화면·같은 오류는 한 줄로 묶고 횟수만 올려요
CREATE TABLE client_error (
    id         BIGSERIAL PRIMARY KEY,
    day        DATE         NOT NULL,
    page       VARCHAR(120) NOT NULL,
    message    VARCHAR(300) NOT NULL,
    kind       VARCHAR(20)  NOT NULL,
    stack      TEXT,
    ua         VARCHAR(300),
    build      VARCHAR(40),
    visitor_id VARCHAR(64),
    n          INT          NOT NULL DEFAULT 1,
    first_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    is_done    BOOLEAN      NOT NULL DEFAULT false,
    UNIQUE (day, page, message)
);
COMMENT ON TABLE client_error IS '사용자 화면에서 난 오류 (관리자 화면 "화면 오류"). kind = crash(화면이 멈춤) · error · promise';
CREATE INDEX idx_client_error_open ON client_error(is_done, last_at DESC);
