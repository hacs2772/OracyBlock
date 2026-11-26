// 상점 꾸미기 자리 (화면 없이). 서버 ShopService.ITEMS의 slot과 같아야 해요 (서버 테스트 TowerRulesTest가 확인)
/** 꾸미기가 끼워지는 자리 (서버 ShopService.ITEMS의 slot과 같아요). 자리마다 하나만 */
export const SLOT_OF = {
  flag: 'top', lantern: 'top', sakura: 'top', umbrella: 'top', daruma: 'top',
  tatami: 'base', sakuraplate: 'base', gold: 'base',
  petals: 'bg', sunset: 'bg', night: 'bg',
};
export const LOOK_COUNT = Object.keys(SLOT_OF).length;

/** 쓰는 꾸미기 목록 → 자리마다 하나 ({ top, base, bg }). 둘이 겹치면 나중 것 (로그인 때 합쳐진 경우) */
export function pickLooks(looks = []) {
  const out = {};
  for (const id of looks) if (SLOT_OF[id]) out[SLOT_OF[id]] = id;
  return out;
}
