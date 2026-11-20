-- 대답을 두 번 튕겨서 못 쌓고 넘어간 자리(skip)도 고치기에 넣어요
ALTER TABLE fix_item DROP CONSTRAINT chk_fix_kind;
ALTER TABLE fix_item ADD CONSTRAINT chk_fix_kind CHECK (kind IN ('hole', 'tilt', 'skip'));
