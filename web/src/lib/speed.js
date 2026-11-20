// 쌓는 속도: 하루에 얼마나 쌓을지. 빨리 쌓을수록 쉬는 날에 빨리 흔들려요 (빨리 쌓은 탑은 부실하니까)
// crackAfter: 며칠째 쉬는 날부터 금이 가기 시작하는지 / maxCracks: 한꺼번에 금 가 있을 수 있는 브릭 수
// fallAfter: 금이 간 날부터 며칠째에 그 브릭이 떨어지는지
// 쉬는 날마다(crackAfter일째부터) 꼭대기부터 브릭이 하나씩 금 가고, 각자 금 간 날부터 fallAfter일째에 떨어져요
// 그날 일은 그날 밤에 정해져요: 오늘 안에 대화나 복습을 하나만 하면 금도 떨어짐도 없어요
export const SPEEDS = {
  slow: { label: '느긋하게', bricks: 1, pre: 3, review: 5, time: '하루 5분쯤', crackAfter: 3, maxCracks: 1, fallAfter: 4 },
  normal: { label: '보통', bricks: 2, pre: 3, review: 10, time: '하루 15분쯤', crackAfter: 2, maxCracks: 2, fallAfter: 2 },
  fast: { label: '빠르게', bricks: 3, pre: 5, review: 20, time: '하루 30분쯤', crackAfter: 1, maxCracks: 2, fallAfter: 1 },
};
export const SPEED_KEYS = ['slow', 'normal', 'fast'];
export const speedOf = (k) => SPEEDS[k] || SPEEDS.normal;
/** 대화를 끝냈을 때의 하루 최대(서버 day_cap)로 그때의 속도를 알아내요 */
export const speedByCap = (cap) => SPEED_KEYS.find((k) => SPEEDS[k].bricks === cap) || null;
/** 한 번 쉬는 동안 떨어질 수 있는 브릭은 최대 이만큼 (그 뒤로는 금도 떨어짐도 멈춰요) */
export const MAX_FALL = 5;

/** 쉬는 날이 g일 이어졌을 때: 떨어진 브릭 수, 지금 금 간 브릭 수, 꼭대기 금 간 브릭이 떨어지기까지 남은 날(1 = 오늘 밤) */
export function restEffect(g, sp) {
  const cracked = []; // 지금 금 가 있는 브릭이 금 간 날 (꼭대기부터)
  let fallen = 0;
  for (let d = 1; d <= g; d++) {
    while (cracked.length && d - cracked[0] >= sp.fallAfter) {
      cracked.shift();
      fallen++;
    }
    if (fallen >= MAX_FALL) return { fallen: MAX_FALL, cracks: 0, fallIn: null, capped: true };
    if (d >= sp.crackAfter && cracked.length < sp.maxCracks) cracked.push(d);
  }
  return { fallen, cracks: cracked.length, fallIn: cracked.length ? cracked[0] + sp.fallAfter - g : null, capped: false };
}
/** 오늘 밤까지 공부하지 않으면 무슨 일이 생기는지 (rest = 어제까지 통째로 쉰 날, 오늘 공부했으면 -1) */
export function tonight(rest, sp, floors) {
  if (rest < 0 || floors <= 0) return null;
  const now = restEffect(rest, sp);
  const next = restEffect(rest + 1, sp);
  const fall = Math.min(next.fallen - now.fallen, floors - now.fallen);
  if (fall > 0) return { kind: 'fall', n: fall };
  if (next.cracks > now.cracks) return { kind: 'crack', n: next.cracks - now.cracks };
  return null;
}

/** 화면에 보여 줄 한 줄 설명 */
export const crackRule = (sp) => `${sp.crackAfter === 1 ? '하루만 쉬어도' : sp.crackAfter + '일째 쉬면'} 금 (한꺼번에 최대 ${sp.maxCracks}개), 금 간 뒤 ${sp.fallAfter}일째 떨어져요`;
