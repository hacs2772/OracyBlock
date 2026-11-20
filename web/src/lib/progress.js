// 서버에서 받은 대화 기록으로 여행 판·레벨 추천을 계산해요
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
