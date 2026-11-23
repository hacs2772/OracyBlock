-- V10: 휴대폰 알림 (웹 푸시, concept 11-32)
-- 서버가 처음 켜질 때 만든 알림 열쇠(VAPID) 같은 작은 설정값
CREATE TABLE app_kv (
    k VARCHAR(40) PRIMARY KEY,
    v TEXT NOT NULL
);
-- 휴대폰 하나 = 한 줄. 하루 한 번, 고른 시간(한국 시각)에만 보내요
CREATE TABLE push_sub (
    id         BIGSERIAL PRIMARY KEY,
    owner      VARCHAR(80)  NOT NULL,
    endpoint   TEXT         NOT NULL UNIQUE,
    p256dh     VARCHAR(200) NOT NULL,
    auth       VARCHAR(100) NOT NULL,
    hour       INT          NOT NULL DEFAULT 21,
    kinds      VARCHAR(40)  NOT NULL DEFAULT 'day,crack,meet',
    last_day   DATE,
    fails      INT          NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE push_sub IS '휴대폰 알림 받는 기기. kinds = day(그날 안 쌓음) · crack(탑에 금/떨어짐) · meet(다시 만날 사람)';
CREATE INDEX idx_push_sub_hour ON push_sub(hour);
CREATE INDEX idx_push_sub_owner ON push_sub(owner);
