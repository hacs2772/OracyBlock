-- V5: 대사 신고 ("이 문장 이상해요"). 같은 대사(talk_id + turn_idx)끼리 모아서 관리자 화면에 보여 줘요
CREATE TABLE line_report (
    id         BIGSERIAL PRIMARY KEY,
    owner      VARCHAR(80)  NOT NULL,
    talk_id    VARCHAR(40)  NOT NULL,
    turn_idx   INT          NOT NULL,
    reason     VARCHAR(12)  NOT NULL,
    note       VARCHAR(500),
    line_text  VARCHAR(300),
    is_done    BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_report_reason CHECK (reason IN ('ja', 'ko', 'mean', 'answer', 'etc'))
);
CREATE INDEX idx_line_report_open ON line_report(is_done, talk_id, turn_idx);
