-- V8: 처음 온 사람이 어디서 그만두는지 (concept 11-25)
-- 기기마다 처음 한 번만 남기는 단계: about(소개 웹을 봄) · cta(시작 버튼을 누름) · guide(게임 방법을 끝까지 보거나 건너뜀) · sound(소리 확인을 끝냄)
CREATE TABLE visit_step (
    visitor_id VARCHAR(64) NOT NULL,
    step       VARCHAR(20) NOT NULL,
    at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (visitor_id, step)
);
COMMENT ON TABLE visit_step IS '처음 온 사람이 지나간 단계 (기기마다 단계별 한 줄). 관리자 "어디서 그만두나요"용';
CREATE VIEW s_step AS SELECT * FROM visit_step WHERE visitor_id NOT IN (SELECT visitor_id FROM admin_visitor);

-- 끝내지 못한 대화가 몇 번째 차례에서 멈췄는지
ALTER TABLE play ADD COLUMN last_turn INT;
COMMENT ON COLUMN play.last_turn IS '대화 중 마지막으로 간 차례 번호 (끝내지 못한 대화가 어디서 멈췄는지)';
CREATE OR REPLACE VIEW s_play AS SELECT * FROM play WHERE visitor_id NOT IN (SELECT visitor_id FROM admin_visitor);
