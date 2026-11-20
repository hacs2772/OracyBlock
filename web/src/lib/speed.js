// 쌓는 속도: 하루에 얼마나 쌓을지. 빨리 쌓을수록 쉬는 날에 빨리 흔들려요 (빨리 쌓은 탑은 부실하니까)
// crackAfter: 며칠 쉬면 첫 금 / maxCracks: 한 번에 금 가는 브릭 수 / fallAfter: 금이 다 찬 뒤 며칠 지나면 떨어짐
export const SPEEDS = {
  slow: { label: '느긋하게', bricks: 1, pre: 3, review: 5, time: '하루 5분쯤', crackAfter: 3, maxCracks: 1, fallAfter: 5 },
  normal: { label: '보통', bricks: 2, pre: 3, review: 10, time: '하루 15분쯤', crackAfter: 2, maxCracks: 1, fallAfter: 2 },
  fast: { label: '빠르게', bricks: 3, pre: 5, review: 20, time: '하루 30분쯤', crackAfter: 1, maxCracks: 2, fallAfter: 1 },
};
export const SPEED_KEYS = ['slow', 'normal', 'fast'];
export const speedOf = (k) => SPEEDS[k] || SPEEDS.normal;
/** 대화를 끝냈을 때의 하루 최대(서버 day_cap)로 그때의 속도를 알아내요 */
export const speedByCap = (cap) => SPEED_KEYS.find((k) => SPEEDS[k].bricks === cap) || null;
/** 쉬는 날이 g일 이어졌을 때: 떨어진 브릭 수, 지금 금 간 브릭 수, 다음에 떨어지기까지 남은 날 */
export function restEffect(g, sp) {
  const cycle = sp.crackAfter + (sp.maxCracks - 1) + sp.fallAfter;
  if (g <= 0) return { fallen: 0, cracks: 0, fallIn: null };
  const rem = g % cycle;
  const cracks = rem >= sp.crackAfter ? Math.min(sp.maxCracks, rem - sp.crackAfter + 1) : 0;
  return { fallen: Math.floor(g / cycle) * sp.maxCracks, cracks, fallIn: cracks ? cycle - rem : null };
}
/** 화면에 보여 줄 한 줄 설명 */
export const crackRule = (sp) => `${sp.crackAfter === 1 ? '하루만 쉬어도' : sp.crackAfter + '일 쉬면'} 금${sp.maxCracks > 1 ? ` (최대 ${sp.maxCracks}개)` : ''}, 그 뒤 ${sp.fallAfter}일이면 떨어져요`;
