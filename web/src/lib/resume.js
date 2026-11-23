// 대화 이어 하기: 대화 중간에 나가도 쌓던 탑과 차례를 이 기기에 기억해 둬요 (3일 동안)
const KEY = 'oracy.resume';
const KEEP = 3 * 864e5;

function all() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {
    return {};
  }
}
function write(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj));
  } catch {
    /* 저장 못 하면 이어 하기만 안 돼요 */
  }
}
export function loadResume(talkId) {
  const r = all()[talkId];
  // 망가진 기록(다른 판에서 남은 것 등)은 이어 하지 않아요. 화면이 멈추지 않게
  if (!r || Date.now() - r.at > KEEP || !r.si || !Array.isArray(r.bricks) || !r.stats || typeof r.stats !== 'object') return null;
  return r;
}
export function saveResume(talkId, data) {
  write({ ...all(), [talkId]: { ...data, at: Date.now() } });
}
export function clearResume(talkId) {
  const a = all();
  delete a[talkId];
  write(a);
}
/** 이어 할 수 있는 대화 id 목록 */
export function resumeIds() {
  return Object.keys(all()).filter((id) => loadResume(id));
}
