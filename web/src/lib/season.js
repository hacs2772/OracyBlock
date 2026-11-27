// 계절 대화 (concept 11-62): 지금 달에 맞는 대화를 홈 "다음 대화" 아래 한 줄로 권해요
// 권하는 것 = 지금 달에 맞고 + 내 레벨 이하 + 최근 SEASON_DAYS일 안에 끝내지 않은 대화. 그중 내 레벨에 가장 가까운 것 하나
import { GAME_TALKS } from '../content/build.js';

/** 대화마다 어울리는 달 (1~12). 여기 없는 대화는 계절과 상관없어요 */
export const SEASON_TALKS = {
  sakura: [3, 4], hanami: [3, 4], ichigo: [2, 3, 4, 5],
  kakigori: [6, 7, 8, 9], yukata: [6, 7, 8], beach: [6, 7, 8, 9], festival: [7, 8], hanabi: [7, 8],
  tsukimi: [9, 10], momiji: [10, 11], yakiimo: [10, 11, 12, 1, 2],
  illumi: [11, 12], kotatsu: [12, 1, 2], skilift: [12, 1, 2, 3], yuki: [1, 2], hatsumode: [12, 1],
  snowbus: [12, 1, 2], skirental: [12, 1, 2, 3], sansou: [7, 8, 9, 10],
};
/** 한 번 끝낸 계절 대화는 이만큼 지나야 다시 권해요 (한 계절 ≈ 3달) */
export const SEASON_DAYS = 90;

/** 달 → 계절 이름 · 꾸밈 이름 */
export function seasonOf(month) {
  if (month >= 3 && month <= 5) return { key: 'spring', name: '봄' };
  if (month >= 6 && month <= 8) return { key: 'summer', name: '여름' };
  if (month >= 9 && month <= 11) return { key: 'autumn', name: '가을' };
  return { key: 'winter', name: '겨울' };
}

const dayNum = (d) => Math.floor(Date.parse(`${d}T00:00:00Z`) / 864e5);

/**
 * 지금 권할 계절 대화 하나 (없으면 null)
 * plays: 서버 /progress의 끝낸 대화 [{ talkId, day }], skip: 이미 홈에 보이는 대화 id (다음 대화 · 다시 만날 사람)
 */
export function seasonPick(level, plays, today = new Date().toLocaleDateString('sv-SE'), skip = []) {
  const month = Number(today.slice(5, 7));
  const recent = new Set((plays || []).filter((p) => p.day && dayNum(today) - dayNum(p.day) < SEASON_DAYS).map((p) => p.talkId));
  const pick = GAME_TALKS
    .filter((t) => SEASON_TALKS[t.id]?.includes(month) && t.level <= level && !recent.has(t.id) && !skip.includes(t.id))
    .sort((a, b) => b.level - a.level)[0];
  return pick ? { talk: pick, month, ...seasonOf(month) } : null;
}
