-- V3: 문의하기 (asmrBlock처럼). contact = 답장 받을 이메일 등 (선택), is_done = 관리자가 처리했는지
ALTER TABLE feedback ADD COLUMN contact VARCHAR(100);
ALTER TABLE feedback ADD COLUMN is_done BOOLEAN NOT NULL DEFAULT false;
