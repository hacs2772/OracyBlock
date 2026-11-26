// 내 탑 계산 (화면 없이). 서버 PushService(알림)의 TowerCalc와 같은 규칙이에요 (backend 테스트가 이 파일과 맞는지 확인해요)
import { speedOf, speedByCap, restEffect } from './speed.js';

export const dayNum = (s) => Math.round(new Date(s + 'T00:00:00Z').getTime() / 864e5);

/**
 * 공부한 날을 따라가며 탑을 쌓고, 쉰 날만큼 금 가고 떨어뜨려요. 지난번 쉰 동안은 그때의 속도로, 지금 쉬는 중이면 지금 속도로.
 * guardDays(방어권·쉬어가기권으로 지켜진 날)는 공부한 날처럼 쉰 날을 끊어 줘요 (브릭은 안 쌓여요)
 */
export function buildTower(bricks, activeDays, today, nowSpeed, guardDays = []) {
  const byDay = new Map();
  for (const b of bricks) {
    if (!byDay.has(b.day)) byDay.set(b.day, []);
    byDay.get(b.day).push(b);
  }
  const stack = [];
  let fallen = 0;
  let prev = null;
  let thenSpeed = null;
  const drop = (n) => {
    for (let k = 0; k < n && stack.length; k++) {
      stack.pop();
      fallen++;
    }
  };
  const guards = (guardDays || []).map((g) => (typeof g === 'string' ? g : g.day)).filter((g) => g < today);
  const days = [...new Set([...activeDays, ...guards])].sort();
  for (const d of days) {
    if (prev != null) drop(restEffect(dayNum(d) - dayNum(prev) - 1, speedOf(thenSpeed || nowSpeed)).fallen);
    const list = byDay.get(d) || [];
    stack.push(...list);
    for (const b of list) thenSpeed = speedByCap(b.cap) || thenSpeed;
    prev = d;
  }
  let rest = 0;
  let cracks = 0;
  let fallIn = null;
  let capped = false;
  if (prev != null) {
    rest = dayNum(today) - dayNum(prev) - 1; // 마지막으로 공부한 날과 오늘 사이에 통째로 쉰 날
    const e = restEffect(rest, speedOf(nowSpeed));
    drop(e.fallen);
    cracks = Math.min(e.cracks, stack.length);
    fallIn = cracks ? e.fallIn : null;
    capped = e.capped;
  }
  return { stack, fallen, rest, cracks, fallIn, capped };
}
