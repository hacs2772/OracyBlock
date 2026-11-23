-- V7: 상점·미션 (concept 11-21). 재화 이름은 "브릭"
CREATE TABLE wallet (
    owner      VARCHAR(80) PRIMARY KEY,
    bricks     INT         NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 브릭이 들어오고 나간 기록. 미션 보상은 같은 이유로 두 번 못 받아요 (m:미션:날짜)
CREATE TABLE wallet_log (
    id         BIGSERIAL   PRIMARY KEY,
    owner      VARCHAR(80) NOT NULL,
    delta      INT         NOT NULL,
    reason     VARCHAR(60) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_wallet_mission ON wallet_log(owner, reason) WHERE reason LIKE 'm:%';
-- 가진 물건 (쓰는 것: shield 방어권 · rest 쉬어가기권 / 꾸미기: flag · lantern · gold, equipped = 쓰는 중)
CREATE TABLE inventory (
    owner    VARCHAR(80) NOT NULL,
    item     VARCHAR(20) NOT NULL,
    qty      INT         NOT NULL DEFAULT 0,
    equipped BOOLEAN     NOT NULL DEFAULT false,
    PRIMARY KEY (owner, item)
);
-- 지켜진 날: 방어권(shield, 쉰 날에 저절로) · 쉬어가기권(rest, 미리 고른 날). 탑 계산에서 공부한 날처럼 쳐요 (브릭은 안 쌓임)
CREATE TABLE guard_day (
    owner VARCHAR(80) NOT NULL,
    day   DATE        NOT NULL,
    kind  VARCHAR(10) NOT NULL,
    PRIMARY KEY (owner, day)
);
