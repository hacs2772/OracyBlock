// 끝낸 대화를 서버에 못 보냈을 때 (지하철·비행기 모드) 이 기기에 두었다가, 인터넷이 다시 이어지면 보내요.
// 탑은 날짜별로 쌓이니까 같은 날 안에서만 다시 보내요 (다음 날 보내면 엉뚱한 날에 쌓여요)
import { api, ApiError } from './api.js';

const KEY = 'oracy.outbox';
const today = () => new Date().toLocaleDateString('sv-SE');

function read() {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}
function write(a) {
  try {
    if (a.length) localStorage.setItem(KEY, JSON.stringify(a.slice(-5)));
    else localStorage.removeItem(KEY);
  } catch {
    /* 저장 못 하면 다시 보내기만 안 돼요 */
  }
}

/** 인터넷 문제(연결 안 됨·서버가 잠깐 꺼짐)면 true: 나중에 다시 보낼 만해요 */
const retryable = (e) => e instanceof ApiError && (e.status === 0 || e.status >= 500);

async function send(item) {
  let id = item.playId;
  if (!id) {
    const r = await api('/plays', { method: 'POST', body: { talkId: item.talkId, level: item.level } });
    id = r?.id;
    if (!id) throw new ApiError(0, '');
  }
  await api(`/plays/${id}/finish`, { method: 'POST', body: item.body });
  return id;
}

/** 대화 끝: 바로 보내 보고, 인터넷 문제면 기기에 두어요. 보냈으면 true */
export async function finishPlay(item) {
  try {
    await send(item);
    return true;
  } catch (e) {
    if (retryable(e)) write([...read(), { ...item, day: today() }]);
    return false;
  }
}

let flushing = false;
/** 기기에 둔 것 다시 보내기 (앱을 열 때, 인터넷이 다시 이어질 때). 하나라도 보냈으면 true */
export async function flushOutbox() {
  if (flushing) return false;
  flushing = true;
  let sent = false;
  try {
    const keep = [];
    for (const item of read()) {
      if (item.day !== today()) continue; // 지난날 것은 버려요
      try {
        await send(item);
        sent = true;
      } catch (e) {
        if (retryable(e)) keep.push(item);
      }
    }
    write(keep);
  } finally {
    flushing = false;
  }
  return sent;
}

export const outboxCount = () => read().filter((x) => x.day === today()).length;
