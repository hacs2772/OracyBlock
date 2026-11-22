// 처음 온 사람이 지나간 단계를 기기마다 한 번씩 서버에 알려요 (관리자 "어디서 그만두나요", concept 11-25)
// about = 소개 웹을 봄 · cta = 시작 버튼 · guide = 게임 방법을 끝까지 보거나 건너뜀 · sound = 소리 확인을 끝냄
import { quiet } from './api.js';

const KEY = 'oracy.steps';
export function markStep(step) {
  try {
    const done = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (done.includes(step)) return;
    localStorage.setItem(KEY, JSON.stringify([...done, step]));
  } catch {
    /* 저장이 막혀도 그냥 보내요 */
  }
  quiet('/visit/step', { method: 'POST', body: { step } });
}
