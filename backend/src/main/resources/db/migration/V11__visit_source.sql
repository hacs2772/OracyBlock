-- V11: 처음 온 사람이 어디서 왔는지 (링크의 ?from=이름, 없으면 눌러 온 사이트 주소). 기기마다 처음 한 번만
CREATE TABLE visit_source (
    visitor_id VARCHAR(64) PRIMARY KEY,
    src        VARCHAR(40),
    ref        VARCHAR(80),
    at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE visit_source IS '처음 온 기기가 어디서 왔는지 (src = 링크의 ?from=, ref = 눌러 온 사이트). 관리자 "어디서 왔나요"용';
CREATE VIEW s_source AS SELECT * FROM visit_source WHERE visitor_id NOT IN (SELECT visitor_id FROM admin_visitor);
