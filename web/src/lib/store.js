// 이 기기에 남겨 두는 것: 설정, 로그인 토큰, 방문자 번호, 처음 안내를 봤는지
import { useSyncExternalStore } from 'react';

const KEY = 'oracy.v1';

const DEFAULTS = {
  visitorId: '',
  token: '',
  user: null, // { id, nickname, email, role, level }
  level: 1,
  seenIntro: false, // 소개 페이지에서 "무료로 시작하기"를 눌렀는지
  seenTour: false, // 처음 온 사람 안내 6장을 봤는지
  introDay: '', // 소개 탭을 마지막으로 본 날 (그날 처음 들어오면 소개 탭부터)
  seenGame: false,
  settings: {
    speed: 'normal', // slow | normal | fast
    kana: true, // 한글 발음 보기
    ja: 'faint', // faint | clear | hide
    quiet: false, // 내 차례를 글자로 시작
    sfx: true,
    vib: true,
  },
};

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULTS, ...raw, settings: { ...DEFAULTS.settings, ...(raw.settings || {}) } };
  } catch {
    return { ...DEFAULTS };
  }
}

function newId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

let state = load();
if (!state.visitorId) state.visitorId = newId();
const listeners = new Set();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* 사생활 보호 모드 등: 이번 방문 동안만 기억 */
  }
}
save();

export const store = {
  get s() {
    return state;
  },
  set(patch) {
    state = { ...state, ...patch };
    save();
    listeners.forEach((f) => f());
  },
  setSettings(patch) {
    store.set({ settings: { ...state.settings, ...patch } });
  },
  subscribe(f) {
    listeners.add(f);
    return () => listeners.delete(f);
  },
};

export function useStore() {
  return useSyncExternalStore(store.subscribe, () => state);
}

export const isAdmin = () => state.user?.role === 'ADMIN';
