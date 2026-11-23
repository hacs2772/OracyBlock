// 휴대폰 알림 켜기·끄기 (concept 11-32). 무료 웹 푸시: 브라우저 기본 기능 + 서버의 공개 열쇠
// 아이폰은 사이트를 "홈 화면에 추가"해서 연 경우에만 돼요 (애플 제한)
import { api, quiet } from './api.js';
import { store } from './store.js';

const isIOS = () => typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent);
const standalone = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true);

/** 'ok' = 켤 수 있어요 · 'ios-home' = 아이폰인데 홈 화면에 추가해야 해요 · 'no' = 이 브라우저는 안 돼요 · 'blocked' = 알림을 막아 뒀어요 */
export function pushState() {
  if (typeof window === 'undefined') return 'no';
  if (isIOS() && !standalone()) return 'ios-home';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'no';
  if (Notification.permission === 'denied') return 'blocked';
  return 'ok';
}

const b64 = (s) => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

async function reg() {
  return navigator.serviceWorker.ready;
}
export async function currentSub() {
  if (pushState() !== 'ok') return null;
  try {
    return await (await reg()).pushManager.getSubscription();
  } catch {
    return null;
  }
}

export const DEFAULT_PUSH = { hour: 21, kinds: ['day', 'crack', 'meet'] };

/** 알림 켜기: 허락 묻기 → 구독 → 서버에 저장 (서버가 시험 알림을 하나 보내요) */
export async function enablePush(pref = DEFAULT_PUSH) {
  if (pushState() !== 'ok') throw new Error('이 브라우저에서는 알림을 켤 수 없어요.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('알림이 허락되지 않았어요. 휴대폰 설정에서 이 사이트 알림을 허락해 주세요.');
  const { key } = await api('/push/key');
  const r = await reg();
  let sub = await r.pushManager.getSubscription();
  if (!sub) sub = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) });
  const j = sub.toJSON();
  await api('/push/sub', { method: 'POST', body: { endpoint: j.endpoint, keys: j.keys, hour: pref.hour, kinds: pref.kinds } });
  store.setSettings({ push: { on: true, hour: pref.hour, kinds: pref.kinds } });
  return true;
}

export async function updatePush(pref) {
  const sub = await currentSub();
  store.setSettings({ push: { on: !!sub, hour: pref.hour, kinds: pref.kinds } });
  if (sub) await api('/push/sub', { method: 'PUT', body: { endpoint: sub.endpoint, hour: pref.hour, kinds: pref.kinds } });
}

export async function disablePush() {
  const sub = await currentSub();
  if (sub) {
    quiet('/push/off', { method: 'POST', body: { endpoint: sub.endpoint } });
    await sub.unsubscribe().catch(() => {});
  }
  store.setSettings({ push: { ...(store.s.settings.push || DEFAULT_PUSH), on: false } });
}

/** 대화 끝 "알림 받기" 카드를 보여 줄지: 아직 안 켰고, "나중에"를 누른 지 7일이 지났을 때 */
export function shouldAskPush() {
  const st = pushState();
  if (st === 'no' || st === 'blocked') return false;
  if (store.s.settings.push?.on) return false;
  const later = store.s.pushLater;
  return !later || Date.now() - later > 7 * 864e5;
}
