// 소리: 브라우저에 들어 있는 음성 합성(듣기)·음성 인식(말하기)·효과음. 모두 무료예요.
import { store } from './store.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
export const canSpeak = !!synth && typeof window.SpeechSynthesisUtterance === 'function';

const SPEED = { slow: 0.75, normal: 1, fast: 1.15 };
const PREFERRED = [/google/i, /kyoko/i, /o-?ren/i, /nanami/i, /keita/i, /haruka/i, /ayumi/i, /otoya/i];

let voices = [];
function loadVoices() {
  if (!canSpeak) return;
  voices = synth.getVoices().filter((v) => /^ja([-_]|$)/i.test(v.lang));
}
if (canSpeak) {
  loadVoices();
  try {
    synth.addEventListener('voiceschanged', loadVoices);
  } catch {
    synth.onvoiceschanged = loadVoices;
  }
}
function pickVoice() {
  if (!voices.length) loadVoices();
  for (const re of PREFERRED) {
    const v = voices.find((x) => re.test(x.name));
    if (v) return v;
  }
  return voices.find((v) => v.localService) || voices[0] || null;
}
export const hasJaVoice = () => {
  if (!voices.length) loadVoices();
  return voices.length > 0;
};

let unlocked = false;
/** 아이폰은 첫 소리를 손가락으로 누른 순간에 내야 해요. 첫 탭에 조용히 한 번 열어 둬요 */
export function unlock() {
  if (unlocked || !canSpeak) return;
  unlocked = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    u.lang = 'ja-JP';
    synth.speak(u);
  } catch {
    /* 무시 */
  }
  ac();
}

/**
 * 휴대폰 음성이 한자를 잘못 읽기 쉬운 말은 읽기 전에 가나로 바꿔요 (화면 글자는 그대로).
 * 예: 一人 → ひとり (いちにん X), 三日 → みっか, 一杯 → いっぱい, 行った → いった (おこなった X).
 * 대사 정확도 검사(scripts/check-reading)에서 찾은 것들. 긴 말부터 바꿔요
 */
export const READ_AS = {
  一人旅: 'ひとりたび', 一人っ子: 'ひとりっこ', 一人: 'ひとり', 三日: 'みっか', 五日: 'いつか', 何日: 'なんにち',
  一杯: 'いっぱい', 三十分: 'さんじゅっぷん', 十分: 'じゅっぷん', 七時: 'しちじ', 何時: 'なんじ', 十一時: 'じゅういちじ',
  一回: 'いっかい', 二回目: 'にかいめ', 三回目: 'さんかいめ', 何回: 'なんかい', 三年目: 'さんねんめ', 何年目: 'なんねんめ',
  行った: 'いった', 行って: 'いって', 行く: 'いく', 行き: 'いき', 来たん: 'きたん', 来た: 'きた', 寄って: 'よって',
  この辺: 'このへん', 鶏肉: 'とりにく', かわいい盛り: 'かわいいざかり', 日本: 'にほん', 辛い: 'からい', 辛味噌: 'からみそ', 上手く: 'うまく', 上手: 'じょうず',
  今日: 'きょう', 明日: 'あした', 一緒: 'いっしょ', 一曲: 'いっきょく', 一枚: 'いちまい', 一番: 'いちばん', 一日: 'いちにち',
  飲み会: 'のみかい', 二次会: 'にじかい', 三次会: 'さんじかい', 就活: 'しゅうかつ', 前髪: 'まえがみ', 方: 'ほう',
};
const READ_KEYS = Object.keys(READ_AS).sort((a, b) => b.length - a.length);
export const toReading = (text) => READ_KEYS.reduce((t, k) => (t.includes(k) ? t.split(k).join(READ_AS[k]) : t), String(text || ''));

let seq = 0;
/** 일본어를 읽어요. rate는 1이 보통 (설정의 빠르기를 곱해요) */
export function speak(text, rate = 1) {
  if (!canSpeak || !text) return Promise.resolve(false);
  const my = ++seq;
  synth.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(toReading(text));
    u.lang = 'ja-JP';
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = Math.max(0.5, Math.min(1.6, rate * (SPEED[store.s.settings.speed] || 1)));
    let done = false;
    const fin = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      resolve(ok && my === seq);
    };
    u.onend = () => fin(true);
    u.onerror = () => fin(false);
    const guard = setTimeout(() => fin(true), 1800 + (text.length * 300) / u.rate);
    synth.speak(u);
    if (synth.paused) synth.resume();
  });
}
export function stopSpeaking() {
  seq++;
  if (canSpeak) synth.cancel();
}

// ---------- 말하기 (음성 인식) ----------

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const canListen = !!SR;
let activeRec = null;

/** 일본어로 들은 후보들을 돌려줘요. 실패하면 { code }로 거절 */
export function listen({ maxMs = 7000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!SR) return reject({ code: 'unsupported' });
    stopSpeaking();
    stopListening();
    let rec;
    try {
      rec = new SR();
    } catch {
      return reject({ code: 'unsupported' });
    }
    activeRec = rec;
    rec.lang = 'ja-JP';
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 5;
    let alts = null;
    let err = null;
    rec.onresult = (e) => {
      const r = e.results[0];
      if (r) alts = Array.from(r, (a) => a.transcript);
    };
    rec.onerror = (e) => {
      err = e.error;
    };
    rec.onend = () => {
      clearTimeout(timer);
      if (activeRec === rec) activeRec = null;
      if (alts && alts.length) resolve(alts);
      else reject({ code: err || 'no-speech' });
    };
    const timer = setTimeout(() => {
      try {
        rec.stop();
      } catch {
        /* 무시 */
      }
    }, maxMs);
    try {
      rec.start();
    } catch {
      clearTimeout(timer);
      activeRec = null;
      reject({ code: 'start-failed' });
    }
  });
}
export function stopListening() {
  const r = activeRec;
  activeRec = null;
  try {
    r?.abort();
  } catch {
    /* 무시 */
  }
}
export const MIC_ERRORS = {
  'no-speech': '소리가 안 들렸어요.',
  aborted: '소리가 안 들렸어요.',
  'not-allowed': '마이크 권한이 꺼져 있어요. 브라우저 설정에서 마이크를 허용해 주세요.',
  'service-not-allowed': '이 브라우저에서는 음성 인식을 쓸 수 없어요.',
  'audio-capture': '마이크를 찾을 수 없어요.',
  network: '음성 인식은 인터넷 연결이 필요해요.',
  'language-not-supported': '이 기기에서는 일본어 음성 인식이 안 돼요.',
  unsupported: '이 브라우저는 음성 인식을 지원하지 않아요. 크롬이나 사파리에서 열어 주세요.',
  'start-failed': '마이크를 시작하지 못했어요.',
};

// ---------- 효과음 (딸깍 · 툭 · 퉁 + 휘익) ----------

let ctx = null;
function ac() {
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx ||= new C();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}
function beep(f1, f2, dur, type, gain, delay = 0) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, t);
  o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.03);
}
function buzz(pattern, delay = 0) {
  if (!store.s.settings.vib || !navigator.vibrate) return;
  setTimeout(() => {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* 무시 */
    }
  }, delay * 1000);
}
/** kind: snap(딸깍) · tilt(툭) · bounce(퉁+휘익) · thud(흔들림) */
export function sfx(kind, delay = 0) {
  if (store.s.settings.sfx) {
    try {
      if (kind === 'snap') {
        beep(2600, 1400, 0.03, 'square', 0.07, delay);
        beep(1150, 700, 0.06, 'triangle', 0.22, delay + 0.01);
      } else if (kind === 'tilt') {
        beep(520, 300, 0.09, 'triangle', 0.25, delay);
        beep(900, 600, 0.04, 'square', 0.04, delay);
      } else if (kind === 'bounce') {
        beep(190, 120, 0.12, 'triangle', 0.32, delay);
        beep(320, 780, 0.2, 'sine', 0.12, delay + 0.08);
        beep(300, 1300, 0.34, 'sine', 0.07, delay + 0.16);
      } else {
        beep(220, 150, 0.11, 'triangle', 0.26, delay);
      }
    } catch {
      /* 무시 */
    }
  }
  buzz(kind === 'snap' ? 14 : kind === 'bounce' ? [30, 40, 30] : [10, 40, 10], delay);
}
