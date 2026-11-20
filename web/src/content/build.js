// OracyBlock 게임에 맞게 대사(talks.js)를 다듬어요.
// - 레벨과 장소
// - 상대 말 뜻 맞히기: 4지선다 두 묶음 (정답은 한 묶음에만)
// - 내 대답 판정: 딱 맞음 / 어긋남 / 살리는 말 / 튕김
// - 골라서 대답하기: 4개 두 묶음
import { TALKS, word, COGNATES, ASK_AGAIN } from './talks.js';

export { COGNATES, ASK_AGAIN };

/** 대화마다 레벨. 지금은 Lv1·Lv2만 준비돼 있어요. */
const LEVEL_OF = {
  plane: 1, izakaya: 1, onsen: 1, guesthouse: 1, park: 1, taxi: 1,
  shinkansen: 2, bar: 2, festival: 2, farewell: 2,
  izakaya2: 3, guesthouse2: 3, onsen2: 3, bar2: 3, shinkansen2: 3, park2: 3,
};
export const READY_LEVELS = [1, 2, 3];
export const ALL_LEVELS = [1, 2, 3, 4, 5];
export const LEVEL_DESC = {
  1: '느린 말 · 짧은 질문 · 핵심 단어 1~2개',
  2: '보통 속도 · 핵심 단어 2~3개',
  3: '긴 문장 · 반말이 섞여요',
  4: '빠른 말 · 줄임말과 맞장구',
  5: '원어민 속도 · 힌트가 적어요',
};
/** 레벨이 오를수록 브릭이 얇고 작아져요 */
export const LEVEL_SCALE = { 1: 1, 2: 0.85, 3: 0.72, 4: 0.6, 5: 0.5 };
/** 레벨마다 말 빠르기 (설정의 빠르기에 곱해요) */
export const LEVEL_RATE = { 1: 0.85, 2: 1, 3: 1.05, 4: 1.12, 5: 1.2 };

/** 어긋남: 통하긴 하지만 외국인 티가 나는 대답. why = 왜 비뚤어졌는지, fix = 바꾸면 딱 맞는 단어 */
const NEAR = {
  'plane:5': [
    {
      words: [['はじめまして|初めまして', '하지메마시떼', '처음 뵙겠습니다']],
      why: '하지메마시떼는 "처음 뵙겠습니다"라는 인사예요. "처음이에요"는 하지메떼데스라고 해요.',
      fix: [['はじめて|初めて', '하지메떼', '처음']],
      say: ['はじめまして', '하지메마시떼', '처음 뵙겠습니다'],
    },
  ],
  'izakaya:1': [
    {
      words: [['ひとつ|一つ', '히또쯔', '한 개']],
      why: '히또쯔는 물건을 셀 때 "한 개"예요. 사람이 "혼자"일 때는 히또리라고 해요.',
      fix: [['ひとり|一人', '히또리', '혼자']],
      say: ['ひとつです', '히또쯔데스', '한 개예요'],
    },
  ],
  'izakaya:5': [
    {
      words: [['たべます|食べます', '타베마스', '먹어요 (앞으로)']],
      why: '타나카 씨는 "먹어 봤어요?"처럼 지난 일을 물었어요. 타베마스는 "먹어요"라서 때가 안 맞아요. 타베마시따(먹었어요)처럼 말하면 딱 맞아요.',
      fix: [['たべました|食べました', '타베마시따', '먹었어요'], ['まだ', '마다', '아직']],
      say: ['食べます', '타베마스', '먹어요'],
    },
    {
      words: [['たべる|食べる', '타베루', '먹어 (앞으로)']],
      why: '"먹어 봤어?"는 지난 일을 묻는 말이에요. 타베루는 "먹어"라서 때가 안 맞아요. 타베따(먹었어)로 말하면 딱 맞아요.',
      fix: [['たべた|食べた', '타베따', '먹었어'], ['まだ', '마다', '아직']],
      say: ['食べる', '타베루', '먹어'],
    },
    {
      words: [['おいしい|美味しい', '오이시-', '맛있어 (지금)']],
      why: '오이시-는 "지금 맛있다"는 말이에요. 먹어 봤는지를 물었으니 오이시깟따(맛있었어)처럼 지난 일로 말하면 딱 맞아요.',
      fix: [['おいしかった|美味しかった', '오이시깟따', '맛있었어'], ['たべた|食べた', '타베따', '먹었어']],
    },
  ],
  'izakaya2:3': [
    {
      words: [['しごと|仕事', '시고또', '일']],
      why: '"무슨 일 해?"에 "일이에요"라고 하면 대답이 안 돼요. 카이샤잉(회사원), 가꾸세-(학생)처럼 무슨 일인지 말하면 딱 맞아요.',
      fix: [['かいしゃいん|会社員', '카이샤잉', '회사원'], ['がくせい|学生', '가꾸세-', '학생']],
      say: ['仕事です', '시고또데스', '일이에요'],
    },
  ],
  'guesthouse2:3': [
    {
      words: [['ひとつ|一つ', '히또쯔', '한 개']],
      why: '히또쯔는 물건을 셀 때 "한 개"예요. 사람이 "혼자"일 때는 히또리라고 해요.',
      fix: [['ひとり|一人', '히또리', '혼자']],
      say: ['一つです', '히또쯔데스', '한 개예요'],
    },
  ],
  'onsen2:5': [
    {
      words: [['きょうだい|兄弟', '쿄-다이', '형제']],
      why: '"형제 있어?"에 "형제예요"라고 따라 하면 뜻이 안 통해요. 오또-또(남동생), 이모-또(여동생)처럼 누가 있는지 말하면 딱 맞아요.',
      fix: [['おとうと|弟', '오또-또', '남동생'], ['いもうと|妹', '이모-또', '여동생']],
      say: ['兄弟です', '쿄-다이데스', '형제예요'],
    },
  ],
  'park2:9': [
    {
      words: [['たのしい|楽しい', '타노시-', '즐거워 (지금)']],
      why: '얘기가 끝난 다음이라 "즐거웠어요"처럼 지난 일로 말하는 게 자연스러워요. 타노시깟따(즐거웠어)로 말하면 딱 맞아요.',
      fix: [['たのしかった|楽しかった', '타노시깟따', '즐거웠어']],
      say: ['楽しいです', '타노시-데스', '즐거워요'],
    },
  ],
  'farewell:3': [
    {
      words: [['たのしい|楽しい', '타노시-', '즐거워 (지금)']],
      why: '"어땠어?"는 지난 일을 묻는 말이에요. 타노시-는 "지금 즐거워"라서 살짝 어색해요. 타노시깟따(즐거웠어)로 말하면 딱 맞아요.',
      fix: [['たのしかった|楽しかった', '타노시깟따', '즐거웠어'], ['さいこう|最高', '사이꼬-', '최고']],
      say: ['楽しいです', '타노시-데스', '즐거워요'],
    },
  ],
};

/** 살리는 말: 브릭은 안 쌓이지만 튕기지도 않아요. 상대가 천천히 다시 말해 줘요 */
const RESCUE = [
  ['すみません', '스미마셍', '죄송해요'],
  ['にほんご|日本語', '니홍고', '일본어'],
  ['わからない|分からない|わかりません|分かりません', '와까라나이', '모르겠어요'],
  ['もういちど|もう一度|もういっかい|もう一回', '모-이찌도', '한 번 더'],
  ['ゆっくり', '육꾸리', '천천히'],
].map(word);
export const RESCUE_LINES = [
  { ja: 'すみません、日本語が苦手です', ko: '스미마셍, 니홍고가 니가떼데스', mean: '죄송해요, 일본어를 잘 못해요' },
  { ja: 'ゆっくり話してください', ko: '육꾸리 하나시떼 쿠다사이', mean: '천천히 말해 주세요' },
];

// ---------- 글자 맞추기 ----------

/** 한글 발음을 같은 모양으로 맞춰요 (된소리·거센소리 묶기, 받침 ㄴㅁㅇ → n, 촉음 받침 빼기, 장음 빼기) */
export function normKo(s) {
  const INI = ['k', 'k', 'n', 't', 't', 'r', 'm', 'p', 'p', 's', 's', '', 'c', 'c', 'c', 'k', 't', 'p', 'h'];
  const MED = ['a', 'e', 'ya', 'e', 'o', 'e', 'yo', 'e', 'o', 'wa', 'we', 'we', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'u', 'i', 'i'];
  const FIN = { 4: 'n', 5: 'n', 6: 'n', 16: 'n', 21: 'n' };
  let out = '';
  for (const ch of String(s || '')) {
    const c = ch.charCodeAt(0) - 0xac00;
    if (c < 0 || c > 11171) continue;
    out += INI[Math.floor(c / 588)] + MED[Math.floor((c % 588) / 28)] + (FIN[c % 28] || '');
  }
  return out;
}

const KANJI_DIGITS = { '〇': '0', 一: '1', 二: '2', 三: '3', 四: '4', 五: '5', 六: '6', 七: '7', 八: '8', 九: '9' };

/** 음성 인식 결과(일본어)를 같은 모양으로 */
export function normJa(s) {
  return (s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[〇一二三四五六七八九]/g, (c) => KANJI_DIGITS[c])
    .replace(/[\s、。,.!?！？「」『』・〜~ー\-…'"]/g, '');
}

/** 가나를 normKo와 같은 모양으로 (한글로 써도 가나와 비교할 수 있게) */
const KANA = (() => {
  const rows = {
    a: 'あかがさざただなはばぱまやらわ', i: 'いきぎしじちぢにひびぴみ り', u: 'うくぐすずつづぬふぶぷむゆる', e: 'えけげせぜてでねへべぺめ れ', o: 'おこごそぞとどのほぼぽもよろを',
  };
  const cons = { a: ['', 'k', 'k', 's', 'c', 't', 't', 'n', 'h', 'p', 'p', 'm', 'y', 'r', 'w'], i: ['', 'k', 'k', 's', 'c', 'c', 'c', 'n', 'h', 'p', 'p', 'm', '', 'r'], u: ['', 'k', 'k', 's', 'c', 'c', 'c', 'n', 'h', 'p', 'p', 'm', 'y', 'r'], e: ['', 'k', 'k', 's', 'c', 't', 't', 'n', 'h', 'p', 'p', 'm', '', 'r'], o: ['', 'k', 'k', 's', 'c', 't', 't', 'n', 'h', 'p', 'p', 'm', 'y', 'r', ''] };
  const m = {};
  for (const v of Object.keys(rows)) [...rows[v]].forEach((ch, i) => { if (ch !== ' ') m[ch] = cons[v][i] + v; });
  Object.assign(m, { ん: 'n', っ: '', ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o', ゃ: 'ya', ゅ: 'yu', ょ: 'yo', ゎ: 'wa' });
  return m;
})();
function kanaRoman(s) {
  let out = '';
  for (const ch of normJa(s)) {
    const r = KANA[ch];
    if (r == null) return '';
    if (/^y[auo]$/.test(r) && (ch === 'ゃ' || ch === 'ゅ' || ch === 'ょ') && out) out = out.replace(/i$/, '') + r;
    else if (ch.match(/[ぁぃぅぇぉ]/) && out) out = out.replace(/[aiueo]$/, '') + r;
    else out += r;
  }
  return out;
}
/** 장음·요음 차이 없애기 (오이시이 = 오이시-, 코- = こう, 챠 = 차) */
const loose = (r) => r.replace(/([cs])y/g, '$1').replace(/ou/g, 'o').replace(/ei/g, 'e').replace(/([aiueo])\1+/g, '$1');

const koKeys = (w) => {
  if (!w._ko) w._ko = [...new Set([loose(normKo(w.ko)), ...w.variants.map((v) => loose(kanaRoman(v)))].filter((k) => k.length >= 2))];
  return w._ko;
};
const hasKo = (typed, w) => koKeys(w).some((k) => typed.includes(k));
const hasJa = (heard, w) => w.variants.some((v) => {
  const n = normJa(v);
  return n && heard.some((h) => h.includes(n));
});

/**
 * 내 대답 판정. input = { typed } (한글 발음) 또는 { heard: [...] } (음성 인식 후보)
 * 돌려주는 값: { kind: 'ok'|'near'|'rescue'|'off'|'none', option?, near?, words? }
 */
export function judge(turn, input) {
  const typed = input.typed != null ? loose(normKo(input.typed)) : null;
  const heard = input.heard ? input.heard.map(normJa).filter(Boolean) : null;
  if ((typed != null && !typed) || (heard && !heard.length)) return { kind: 'none' };
  const hit = (w) => (typed != null ? hasKo(typed, w) : hasJa(heard, w));
  let best = null;
  turn.options.forEach((o, i) => {
    const got = o.words.filter(hit);
    if (got.length && (!best || got.length > best.words.length)) best = { kind: 'ok', option: i, words: got };
  });
  if (best) return best;
  for (const n of turn.near) {
    const got = n.words.filter(hit);
    if (got.length) return { kind: 'near', near: n, words: got };
  }
  if (RESCUE.some(hit)) return { kind: 'rescue' };
  if (typed != null) {
    // 일본어 소리 대신 한국어 뜻을 썼을 때 (예: "한국") → 튕기지 않고 알려 줘요
    const raw = String(input.typed).replace(/\s/g, '');
    for (const o of turn.options) for (const w of o.words) {
      const m = String(w.mean).replace(/\(.*?\)|\s/g, '');
      if (m.length >= 2 && raw.includes(m)) return { kind: 'korean', word: w };
    }
  }
  return { kind: 'off' };
}

// ---------- 섞기 (같은 대사는 늘 같은 보기) ----------

function seeded(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
function shuffle(list, rnd) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const isCasual = (ja) => !/(です|ます|でした|ました|ください|ません|ましょう|でしょうか)/.test(ja);

// ---------- 대화 만들기 ----------

const ALL_THEM = TALKS.flatMap((t) => t.turns.filter((x) => x.them).map((x) => ({ talk: t.id, line: x.them })));
const ALL_ME = TALKS.flatMap((t) => t.turns.filter((x) => x.me).flatMap((x) => x.me.map((o) => ({ talk: t.id, o }))));

function meaningSets(talk, idx, line) {
  const rnd = seeded(talk.id + ':' + idx);
  const same = shuffle(ALL_THEM.filter((x) => x.talk === talk.id && x.line !== line && x.line.mean !== line.mean), rnd);
  const other = shuffle(ALL_THEM.filter((x) => x.talk !== talk.id && x.line.mean !== line.mean), rnd);
  const seen = new Set([line.mean]);
  const pool = [];
  for (const x of [...same.slice(0, 3), ...other]) {
    if (pool.length >= 7) break;
    if (seen.has(x.line.mean)) continue;
    seen.add(x.line.mean);
    pool.push(x.line.mean);
  }
  const inFirst = rnd() < 0.55;
  const a = inFirst ? shuffle([line.mean, ...pool.slice(0, 3)], rnd) : pool.slice(0, 4);
  const b = inFirst ? pool.slice(3, 7) : shuffle([line.mean, ...pool.slice(4, 7)], rnd);
  return { sets: [a, b], answerSet: inFirst ? 0 : 1 };
}

function chooseSets(talk, idx, options, near) {
  const rnd = seeded('me:' + talk.id + ':' + idx);
  const ok = options.map((o, i) => ({ kind: 'ok', option: i, ja: o.natural.ja, ko: o.natural.ko }));
  const nearOpts = near.filter((n) => n.say).map((n) => ({ kind: 'near', near: n, ja: n.say[0], ko: n.say[1] }));
  const used = new Set([...ok, ...nearOpts].map((x) => x.ko));
  const offs = [];
  for (const x of shuffle(ALL_ME.filter((x) => x.talk !== talk.id), rnd)) {
    if (offs.length >= 8) break;
    if (used.has(x.o.natural.ko)) continue;
    used.add(x.o.natural.ko);
    offs.push({ kind: 'off', ja: x.o.natural.ja, ko: x.o.natural.ko });
  }
  let a = [ok[0], nearOpts[0], ...offs.slice(0, 4)].filter(Boolean).slice(0, 4);
  let b = [ok[1], nearOpts[1], ...offs.slice(4, 8)].filter(Boolean).slice(0, 4);
  if (ok.length === 1 && rnd() < 0.4) [a, b] = [b, a];
  return [shuffle(a, rnd), shuffle(b, rnd)];
}

function buildTalk(t) {
  const level = LEVEL_OF[t.id] || 1;
  const steps = [];
  t.turns.forEach((turn, idx) => {
    if (turn.them) {
      const line = turn.them;
      steps.push({
        type: 'them', idx, line,
        casual: isCasual(line.ja),
        keys: line.keys,
        ...meaningSets(t, idx, line),
      });
    } else if (turn.me) {
      const near = (NEAR[t.id + ':' + idx] || []).map((n) => ({ ...n, words: n.words.map(word), fix: n.fix.map(word) }));
      const options = turn.me;
      steps.push({
        type: 'me', idx, options, near,
        hintWords: options.flatMap((o) => o.words.slice(0, 1)),
        choose: chooseSets(t, idx, options, near),
      });
    }
  });
  return { ...t, level, steps, casualTalk: !t.polite };
}

export const GAME_TALKS = TALKS.map(buildTalk);
export const talkById = (id) => GAME_TALKS.find((t) => t.id === id) || null;
export const talksAtLevel = (lv) => GAME_TALKS.filter((t) => t.level === lv);

/** 대화의 모든 핵심 단어 (상대 말 + 내 대답) */
export function talkWords(talk) {
  const map = new Map();
  for (const s of talk.steps) {
    const list = s.type === 'them' ? s.keys : s.options.flatMap((o) => o.words);
    for (const w of list) if (!map.has(w.key)) map.set(w.key, w);
  }
  return [...map.values()];
}

/** 복습용 단어 뜻 보기 (정답 + 다른 단어 뜻 3개) */
const ALL_WORDS = (() => {
  const map = new Map();
  for (const t of GAME_TALKS) for (const w of talkWords(t)) if (!map.has(w.mean)) map.set(w.mean, w);
  return [...map.values()];
})();
export function wordChoices(w, salt = '') {
  const rnd = seeded('w:' + w.key + salt);
  const others = shuffle(ALL_WORDS.filter((x) => x.mean !== w.mean && x.key !== w.key), rnd).slice(0, 3).map((x) => x.mean);
  return shuffle([w.mean, ...others], rnd);
}

export function dailyCognate(d = new Date()) {
  const day = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5);
  return COGNATES[day % COGNATES.length];
}
