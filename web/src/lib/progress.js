// 서버에서 받은 대화 기록으로 학습 화면·레벨 추천을 계산해요
import { talkById, talksAtLevel } from '../content/build.js';
import { resumeIds } from './resume.js';

export const parseBricks = (s) => {
  try {
    return (JSON.parse(s || '[]') || []).map((b) => ({ tone: b.t, shine: !!b.s, tilt: !!b.k, missing: b.m || '', gone: !!b.g }));
  } catch {
    return [];
  }
};

/** 이 레벨에서 비뚤어진 브릭 없이 쌓은 대화 수 (같은 대화를 여러 번 해도 1개). 고쳐서 바로 세운 건 안 쳐요 */
export function countCorrect(plays, level) {
  const ids = new Set((plays || []).filter((p) => p.level === level && !p.crooked).map((p) => p.talkId));
  return ids.size;
}

/** 튕긴 브릭이 잦은지 (임시 기준: 이 레벨의 최근 대화 2개가 모두 튕김 3번 이상) */
export function tooHard(plays, level) {
  const recent = (plays || []).filter((p) => p.level === level).slice(0, 2);
  return recent.length === 2 && recent.every((p) => p.bounces >= 3);
}

/** 대화마다 가장 최근 기록 */
export function latestByTalk(plays) {
  const m = new Map();
  for (const p of plays || []) if (!m.has(p.talkId)) m.set(p.talkId, p);
  return m;
}

export const WEEK_TONE = ['#F48FB1', '#29B6A5', '#FF7967', '#FFC857', '#5AB0E6', '#A792E0', '#7CC46B']; // 일 월 화 수 목 금 토
export const WEEK_NAME = ['일', '월', '화', '수', '목', '금', '토'];
export const dayTone = (day) => WEEK_TONE[new Date(day + 'T00:00:00').getDay()];

/**
 * 대사를 바꾸기 전(차례 수가 달라지기 전)에 생긴 고칠 곳은 차례 번호가 안 맞아서 빼요.
 * 브릭 수 = 차례 수 + 꼭대기 1개일 때만 지금 대사와 맞아요
 */
export function freshFixes(groups) {
  return (groups || []).filter((g) => {
    const t = talkById(g.talkId);
    return t && parseBricks(g.bricks).length === t.steps.length + 1;
  });
}

/** 다음에 할 대화: 하던 대화 → 아직 안 한 곳 → 비뚤어졌던 곳 → 첫 곳 (홈의 큰 버튼, 학습의 "다음 차례") */
export function nextTalk(level, plays) {
  const talks = talksAtLevel(level);
  const latest = latestByTalk((plays || []).filter((p) => p.level === level));
  const resumable = new Set(resumeIds());
  return talks.find((t) => resumable.has(t.id)) || talks.find((t) => !latest.has(t.id)) || talks.find((t) => latest.get(t.id)?.crooked) || talks[0];
}

/**
 * 다시 만나기 (concept 11-23): 한 번 끝낸 대화는 1일 · 3일 · 7일 뒤에 같은 사람을 다시 만나요.
 * 틀린 곳 없이 끝내면 다음 만남으로, 틀린 곳이 있으면 다음 날 한 번 더. 세 번 다 만나면 "단골"
 * 같은 날 여러 번 해도 하루로 쳐요. 날짜가 되기 전에 미리 한 건 세지 않아요
 */
export const MEET_GAP = [1, 3, 7];
const addDays = (day, n) => {
  const d = new Date(day + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('sv-SE');
};
export function meetPlan(plays) {
  const byTalk = new Map();
  for (const p of [...(plays || [])].reverse()) { // 오래된 것부터
    if (!p.day) continue;
    const days = byTalk.get(p.talkId) || new Map();
    days.set(p.day, (days.get(p.day) ?? false) || !p.crooked); // 그날 한 번이라도 바르게 끝냈는지
    byTalk.set(p.talkId, days);
  }
  const plan = new Map();
  for (const [talkId, days] of byTalk) {
    const list = [...days.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    let meets = 0;
    let due = addDays(list[0][0], MEET_GAP[0]);
    let last = list[0][0];
    for (const [day, ok] of list.slice(1)) {
      if (day < due) continue;
      last = day;
      if (!ok) { due = addDays(day, 1); continue; }
      meets += 1;
      if (meets >= MEET_GAP.length) break;
      due = addDays(day, MEET_GAP[meets]);
    }
    plan.set(talkId, { meets, due, last, regular: meets >= MEET_GAP.length });
  }
  return plan;
}
/** 오늘 다시 만날 사람: 날짜가 된 대화, 오래 기다린 순서로 */
export function dueMeets(plays, today = new Date().toLocaleDateString('sv-SE'), skip = []) {
  return [...meetPlan(plays).entries()]
    .filter(([id, m]) => !m.regular && m.due <= today && !skip.includes(id) && talkById(id))
    .sort((a, b) => (a[1].due < b[1].due ? -1 : 1))
    .map(([id, m]) => ({ talk: talkById(id), ...m, ago: Math.round((new Date(today) - new Date(m.last)) / 864e5) }));
}
