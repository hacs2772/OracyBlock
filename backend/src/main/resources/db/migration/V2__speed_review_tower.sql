-- V2: 쌓는 속도, 복습 탑, 공부한 날 순위
-- owner_pref: 기록 주인마다 쌓는 속도 (slow 하루 1개 · normal 3개 · fast 5개). changed_at = 마지막으로 바꾼 때 (3일에 한 번)
CREATE TABLE owner_pref (
    owner      VARCHAR(80) PRIMARY KEY,
    speed      VARCHAR(10) NOT NULL DEFAULT 'normal',
    changed_at TIMESTAMPTZ,
    CONSTRAINT chk_pref_speed CHECK (speed IN ('slow', 'normal', 'fast'))
);

-- 대화를 끝낸 그때의 하루 최대 브릭 수 (속도를 바꿔도 지난 날은 그대로)
ALTER TABLE play ADD COLUMN day_cap INT NOT NULL DEFAULT 3;

-- 복습 탑: 맞힌 단어마다 브릭 1개 (브릭에 단어가 적혀요)
ALTER TABLE word_answer ADD COLUMN word_key VARCHAR(80);
ALTER TABLE word_answer ADD COLUMN ko VARCHAR(80);
ALTER TABLE word_answer ADD COLUMN day DATE;
UPDATE word_answer SET day = (at AT TIME ZONE 'Asia/Seoul')::date;
ALTER TABLE word_answer ALTER COLUMN day SET NOT NULL;
CREATE INDEX idx_word_answer_owner ON word_answer(owner, at);
