// 화면 오류 모으기 (concept 11-26): 오류가 나면 서버에 조용히 보내요. 관리자 화면 "화면 오류"에서 봐요
// 한 번 열 때 8번까지, 같은 오류는 한 번만. 브라우저 확장·광고 차단기처럼 우리 코드가 아닌 오류는 빼요
import { quiet } from './api.js';

/* global __BUILD__ */
const BUILD = typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev';
const sent = new Set();
let count = 0;
const NOISE = [/ResizeObserver loop/i, /^Script error\.?$/i, /chrome-extension:|moz-extension:|safari-extension:/i, /Non-Error promise rejection captured/i, /AbortError/i, /Load failed$/i, /Failed to fetch$/i, /NetworkError when attempting/i];

export function reportError(err, kind = 'error') {
  try {
    const message = String(err?.message || err || '').slice(0, 300).trim();
    const stack = String(err?.stack || '').slice(0, 4000);
    if (!message || NOISE.some((re) => re.test(message) || re.test(stack))) return;
    const key = kind + message;
    if (sent.has(key) || count >= 8) return;
    sent.add(key);
    count += 1;
    quiet('/errors', { method: 'POST', body: { message, stack, kind, page: location.pathname, build: BUILD } });
  } catch {
    /* 오류 보고가 또 오류를 내면 안 돼요 */
  }
}

export function watchErrors() {
  window.addEventListener('error', (e) => reportError(e.error || e.message, 'error'));
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason, 'promise'));
}
