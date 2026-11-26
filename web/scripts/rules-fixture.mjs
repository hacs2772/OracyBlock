// 웹의 탑·다시 만날 사람 규칙으로 답을 만들어, 서버 테스트(TowerCalcTest · PushServiceTest)가 똑같이 계산하는지 비교해요.
// node scripts/rules-fixture.mjs (또는 npm run fixture) → backend/src/test/resources/rules-fixture.json
// 규칙(lib/speed.js · lib/tower.js · lib/progress.js)을 바꾸면 이걸 다시 돌리고, 서버(TowerCalc · PushService)도 같이 고쳐야 해요
import { writeFileSync } from 'node:fs';
import { SPEEDS, SPEED_KEYS, speedOf, restEffect, tonight } from '../src/lib/speed.js';
import { buildTower } from '../src/lib/tower.js';
import { dueMeets } from '../src/lib/progress.js';
import { GAME_TALKS } from '../src/content/build.js';

// 늘 같은 "무작위" (파일이 매번 똑같이 나오게)
let seed = 20261126;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};
const pick = (a) => a[Math.floor(rnd() * a.length)];
const day = (n) => new Date(Date.UTC(2026, 0, 1) + n * 864e5).toISOString().slice(0, 10);

const rest = [];
for (const k of SPEED_KEYS) for (let g = 0; g <= 30; g++) rest.push({ speed: k, g, ...restEffect(g, SPEEDS[k]) });

const towers = [];
for (let i = 0; i < 250; i++) {
  const span = 5 + Math.floor(rnd() * 60);
  const busy = 0.15 + rnd() * 0.8;
  const nowSpeed = pick(SPEED_KEYS);
  let speed = pick(SPEED_KEYS);
  const bricks = [];
  const activeDays = [];
  for (let d = 0; d < span; d++) {
    if (rnd() > busy) continue;
    if (rnd() < 0.1) speed = pick(SPEED_KEYS);
    activeDays.push(day(d));
    const n = Math.floor(rnd() * (SPEEDS[speed].bricks + 1)); // 복습만 한 날은 0개
    for (let k = 0; k < n; k++) bricks.push({ day: day(d), cap: SPEEDS[speed].bricks });
  }
  const today = day(span + Math.floor(rnd() * 14));
  const guardDays = [];
  for (let k = Math.floor(rnd() * 3); k > 0; k--) guardDays.push({ day: day(Math.floor(rnd() * (span + 14))) });
  const t = buildTower(bricks, activeDays, today, nowSpeed, guardDays);
  const w = t.capped ? null : tonight(t.rest, speedOf(nowSpeed), t.stack.length);
  towers.push({ bricks, activeDays, today, nowSpeed, guardDays: guardDays.map((g) => g.day), floors: t.stack.length, rest: t.rest, cracks: t.cracks, capped: t.capped, tonight: w ? w.kind : null });
}

const ids = GAME_TALKS.map((t) => t.id);
const meets = [];
for (let i = 0; i < 250; i++) {
  const plays = [];
  const talks = Array.from({ length: 1 + Math.floor(rnd() * 5) }, () => pick(ids));
  for (const id of talks) {
    let d = Math.floor(rnd() * 10);
    for (let k = Math.floor(rnd() * 7); k >= 0; k--) {
      plays.push({ talkId: id, day: day(d), crooked: rnd() < 0.25 });
      d += Math.floor(rnd() * 6);
    }
  }
  plays.sort((a, b) => (a.day < b.day ? 1 : -1)); // 서버 /progress처럼 새것부터
  const today = day(Math.floor(rnd() * 40));
  meets.push({ plays, today, due: dueMeets(plays, today).length });
}

const out = new URL('../../backend/src/test/resources/rules-fixture.json', import.meta.url);
writeFileSync(out, JSON.stringify({ rest, towers, meets }, null, 0) + '\n');
console.log(`rest ${rest.length} · towers ${towers.length} (tonight: ${towers.filter((t) => t.tonight).length}) · meets ${meets.length}`);
