// 처음 온 사람이 어디서 왔는지 (관리자 "어디서 왔나요"). 글을 올릴 때 링크 끝에 ?from=이름 을 붙여요 (docs/deploy.md)
// 이름이 없으면 눌러 온 사이트 주소. 기기마다 처음 한 번만 보내요
import { quiet } from './api.js';

const KEY = 'oracy.src';
let first = null;

/** 페이지를 열자마자 (첫 화면으로 옮겨 가기 전에) 읽어 둬요 */
export function catchSource() {
  try {
    const u = new URL(window.location.href);
    const src = u.searchParams.get('from') || '';
    let ref = '';
    try {
      ref = document.referrer ? new URL(document.referrer).hostname : '';
    } catch {
      ref = '';
    }
    if (ref === window.location.hostname) ref = '';
    first = { src, ref };
    if (src) {
      // 주소창에서 ?from= 은 지워요 (이 사람이 링크를 다시 나눠도 처음 온 곳이 섞이지 않게)
      u.searchParams.delete('from');
      window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash);
    }
  } catch {
    first = null;
  }
}

/** 방문 기록 뒤에 한 번 보내요 */
export function sendSource() {
  let sent = false;
  try {
    sent = localStorage.getItem(KEY) === '1';
  } catch {
    sent = false;
  }
  if (sent || !first) return;
  quiet('/visit/source', { method: 'POST', body: first }).then((r) => {
    if (!r) return;
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* 다음에 다시 보내도 서버는 처음 것만 남겨요 */
    }
  });
}
