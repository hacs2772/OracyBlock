// 대사 자동 검사: node scripts/check-talks.mjs (또는 npm run check)
// 문제(✗)가 있으면 실패, 확인할 것(△)은 알려만 줘요
import { GAME_TALKS, talkWords, isReviewWord } from '../src/content/build.js';
import { SEASON_TALKS } from '../src/lib/season.js';

const errors = [];
const warns = [];
const flat = (s) => String(s || '').replace(/[\s,.!?~\-、。「」]/g, '');
// 일본어는 끝소리가 붙어서 줄어요: "~るんです"(쯔꾸루 → 쯔꾸룬데스까, ㄴ), "~って"(노미까이 → 노미까잇떼, ㅅ).
// 마지막 글자에 ㄴ·ㅅ 받침이 붙은 것도 같은 단어로 봐요
const withJong = (w, j) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 === 0 ? w.slice(0, -1) + String.fromCharCode(0xac00 + c + j) : w;
};
const has = (line, w) => [0, 4, 19].some((j) => flat(line).includes(j ? withJong(flat(w), j) : flat(w)));

for (const t of GAME_TALKS) {
  for (const s of t.steps) {
    const at = `${t.id}:${s.idx}`;
    if (s.type === 'them') {
      const l = s.line;
      if (!l.ja || !l.ko || !l.mean) errors.push(`${at} 상대 말에 일본어·한글 발음·뜻 중 빈 것이 있어요`);
      if (!s.keys?.length) errors.push(`${at} 핵심 단어가 없어요`);
      for (const k of s.keys || []) if (!has(l.ko, k.ko)) errors.push(`${at} 핵심 단어 "${k.ko}"가 "${l.ko}" 안에 없어요`);
      for (const a of s.alts || []) {
        if (!a.ja || !a.ko) errors.push(`${at} 다른 말투에 일본어·한글 발음이 비었어요`);
        for (const k of a.keys) if (!has(a.ko, k.ko)) errors.push(`${at} 다른 말투의 핵심 단어 "${k.ko}"가 "${a.ko}" 안에 없어요`);
        if (a.ownMean) {
          // 자기 뜻을 가진 다른 말투: 뜻 보기 5개에 그 뜻이 있어야 해요
          if (!a.meanings?.includes(a.mean)) errors.push(`${at} 다른 말투 "${a.ko}"의 뜻 보기에 정답이 없어요`);
          if (a.meanings?.length !== 5 || new Set(a.meanings).size !== 5) errors.push(`${at} 다른 말투 "${a.ko}"의 뜻 보기가 5개가 아니거나 겹쳐요`);
          const sibs = [l.mean, ...s.alts.map((b) => b.mean)].filter((m) => m !== a.mean);
          if (a.meanings?.some((m) => sibs.includes(m))) errors.push(`${at} 다른 말투 "${a.ko}"의 틀린 보기에 같은 차례의 뜻이 섞였어요`);
        }
      }
      if (!s.meanings.includes(l.mean)) errors.push(`${at} 뜻 보기에 정답이 없어요`);
      if (s.meanings.length !== 5) errors.push(`${at} 뜻 보기가 5개가 아니에요 (${s.meanings.length})`);
      if (new Set(s.meanings).size !== s.meanings.length) errors.push(`${at} 뜻 보기에 같은 뜻이 두 번 있어요`);
    } else {
      const seen = new Set();
      for (const o of s.options) {
        const [ja, ko, mean] = [o.natural.ja, o.natural.ko, o.natural.mean];
        if (!ja || !ko || !mean) errors.push(`${at} 대답 "${o.intent}"에 빈 칸이 있어요`);
        if (!o.words.length) errors.push(`${at} 대답 "${ko}"에 핵심 단어가 없어요`);
        if (!o.words.some((w) => has(ko, w.ko))) errors.push(`${at} 대답 "${ko}"에 핵심 단어(${o.words.map((w) => w.ko).join('/')})가 안 들어 있어요`);
        if (seen.has(ko)) errors.push(`${at} 같은 대답 "${ko}"가 두 번 있어요`);
        seen.add(ko);
      }
      const okN = s.choose.filter((c) => c.kind === 'ok').length;
      if (okN !== s.options.length) errors.push(`${at} 보기 4개에 맞는 대답이 다 들어가지 않았어요`);
      if (!s.choose.some((c) => c.kind === 'off')) errors.push(`${at} 보기에 상관없는 대답이 없어요`);
      if (s.choose.length < 5) errors.push(`${at} 대답 보기가 5개보다 적어요 (${s.choose.length})`);
    }
  }
}

// 가지: when 꼬리표는 앞쪽 대답의 go로 만들어져야 하고, go는 어딘가에서 쓰여야 해요. 가지마다 상대 말 → 내 대답 차례가 맞아야 해요
for (const t of GAME_TALKS) {
  const made = new Set();
  const used = new Set(t.steps.map((s) => s.when).filter(Boolean));
  for (const s of t.steps) {
    if (s.when && !made.has(s.when)) errors.push(`${t.id}:${s.idx} 꼬리표 "${s.when}"를 만드는 대답이 앞에 없어요`);
    if (s.type === 'me') for (const o of s.options) if (o.go) made.add(o.go);
    if (s.type === 'me') {
      const prev = t.steps[s.idx - 1];
      if (!prev || prev.type !== 'them' || prev.when !== s.when) errors.push(`${t.id}:${s.idx} 내 대답 앞에 같은 가지의 상대 말이 없어요`);
    }
  }
  for (const g of made) if (!used.has(g)) warns.push(`${t.id} 꼬리표 "${g}"를 쓰는 차례가 없어요`);
}

// 같은 일본어 단어를 다른 한글 발음으로 적은 곳 (예: 韓国 캉코꾸 / 칸코쿠)
const spell = new Map();
for (const t of GAME_TALKS) {
  for (const w of talkWords(t)) {
    const k = w.say;
    if (!spell.has(k)) spell.set(k, new Map());
    const m = spell.get(k);
    m.set(w.ko, [...(m.get(w.ko) || []), t.id]);
  }
}
for (const [k, m] of spell) if (m.size > 1) warns.push(`${k} 한글 발음이 여러 가지예요: ${[...m].map(([ko, ids]) => `${ko}(${[...new Set(ids)].join(',')})`).join(' / ')}`);

// 같은 한자 단어는 어느 줄에서나 같은 한글 발음으로 (핵심 단어로 쓴 발음이 그 단어가 든 다른 줄에도 있어야 해요)
// 한 글자 한자(方·今·道 등)는 다른 단어 안에 들어 있거나 읽는 법이 여러 개라 빼요. 읽는 법이 다른 말은 SPELL_OK에 적어요
const SPELL_OK = new Set([
  '両親|はい、両親とです', // 료-신또 (ん 뒤 と)
  '好き|娘が魚好きで、もう三回目なんですよ。', // 사까나즈끼 (붙으면 즈끼)
  '下り|わしは先に下りるよ。また山で会おう。', // 下りる = 오리루 (내려가다), 下り = 쿠다리 (내리막)
  '気をつけて|お疲れさまでした。お気をつけて！', '気をつけて|お気をつけて、いってらっしゃいませ。', // 오끼오 (お가 붙어서)
]);
const kanjiWords = new Map();
const allLines = [];
for (const t of GAME_TALKS) for (const s of t.steps) {
  const ws = s.type === 'them' ? [...s.keys, ...s.alts.flatMap((a) => a.keys)] : s.options.flatMap((o) => o.words);
  for (const w of ws) {
    const kanji = (w.variants || []).find((v) => /[\u4e00-\u9fff]/.test(v));
    if (kanji && [...kanji].length > 1) kanjiWords.set(kanji, new Set([...(kanjiWords.get(kanji) || []), w.ko]));
  }
  if (s.type === 'them') allLines.push(...[s.line, ...s.alts].map((l) => ({ ja: l.ja, ko: l.ko, at: `${t.id}:${s.idx}` })));
  else allLines.push(...s.options.map((o) => ({ ja: o.natural.ja, ko: o.natural.ko, at: `${t.id}:${s.idx}` })));
}
const kw = [...kanjiWords.entries()];
for (const l of allLines) {
  for (const [kanji, kos] of kw) {
    if (!l.ja.includes(kanji) || SPELL_OK.has(`${kanji}|${l.ja}`)) continue;
    if (kw.some(([k2]) => k2 !== kanji && k2.includes(kanji) && l.ja.includes(k2))) continue; // 더 긴 단어 안 (日本 ⊂ 日本語)
    if (![...kos].some((ko) => has(l.ko, ko))) errors.push(`${l.at} "${kanji}"를 다른 줄에서는 ${[...kos].join('/')}(으)로 썼는데 여기는 "${l.ko}"예요`);
  }
}

// 복습에서 빼는 단어 (조사처럼 혼자서는 뜻이 약한 것)
const skipped = new Set();
for (const t of GAME_TALKS) for (const w of talkWords(t)) if (!isReviewWord(w)) skipped.add(`${w.ko}(${w.mean})`);

const words = new Set(GAME_TALKS.flatMap((t) => talkWords(t).map((w) => w.key)));
console.log(`대화 ${GAME_TALKS.length}개 · 단어 ${words.size}개 · 복습에서 빼는 단어: ${[...skipped].join(', ') || '없음'}`);
for (const w of warns) console.log('△ ' + w);
for (const e of errors) console.log('✗ ' + e);
// 계절 대화 표 (lib/season.js): 있는 대화 · 1~12월만
for (const [id, months] of Object.entries(SEASON_TALKS)) {
  if (!GAME_TALKS.some((t) => t.id === id)) errors.push(`계절 대화 "${id}"가 대화 목록에 없어요 (lib/season.js)`);
  if (!months.length || months.some((m) => !Number.isInteger(m) || m < 1 || m > 12)) errors.push(`계절 대화 "${id}"의 달이 이상해요: ${months}`);
}
console.log(errors.length ? `문제 ${errors.length}개` : '문제 없음', warns.length ? `· 확인할 것 ${warns.length}개` : '');
process.exit(errors.length ? 1 : 0);
