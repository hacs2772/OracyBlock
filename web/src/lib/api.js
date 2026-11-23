// 서버 부르기. 같은 주소의 /api/v1 로 불러요 (개발할 때는 vite가 넘겨 줌)
import { store } from './store.js';

const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'X-Visitor-Id': store.s.visitorId };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (store.s.token) headers.Authorization = 'Bearer ' + store.s.token;
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, '서버에 연결하지 못했어요. 인터넷을 확인해 주세요.');
  }
  if (res.status === 401 && store.s.token) {
    // 로그인이 끝났어요 (토큰 만료) → 둘러보기 상태로
    store.set({ token: '', user: null });
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) throw new ApiError(res.status, data?.message || '잠시 뒤에 다시 해 주세요.');
  return data;
}

/** 실패해도 화면은 계속 (기록 남기기 같은 것) */
export async function quiet(path, opts) {
  try {
    return await api(path, opts);
  } catch {
    return null;
  }
}

export function setLogin(res) {
  store.set({ token: res.token, user: res.user, level: res.user.level || store.s.level, seenIntro: true });
}
