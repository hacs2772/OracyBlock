// 대사 자동 검사: node scripts/check-talks.mjs (또는 npm run check)
// 문제(✗)가 있으면 실패, 확인할 것(△)은 알려만 줘요
import { GAME_TALKS, talkWords, isReviewWord } from '../src/content/build.js';

const errors = [];
const warns = [];
const flat = (s) => String(s || '').replace(/[\s,.!?~\-、。「」]/g, '');
// 일본어는 "~るんです"처럼 끝소리가 ㄴ으로 붙어요 (쯔꾸루 → 쯔꾸룬데스까). 마지막 글자에 ㄴ 받침이 붙은 것도 같은 단어로 봐요
const withN = (w) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 === 0 ? w.slice(0, -1) + String.fromCharCode(0xac00 + c + 4) : w;
};
const has = (line, w) => flat(line).includes(flat(w)) || flat(line).includes(withN(flat(w)));

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

// 복습에서 빼는 단어 (조사처럼 혼자서는 뜻이 약한 것)
const skipped = new Set();
for (const t of GAME_TALKS) for (const w of talkWords(t)) if (!isReviewWord(w)) skipped.add(`${w.ko}(${w.mean})`);

const words = new Set(GAME_TALKS.flatMap((t) => talkWords(t).map((w) => w.key)));
console.log(`대화 ${GAME_TALKS.length}개 · 단어 ${words.size}개 · 복습에서 빼는 단어: ${[...skipped].join(', ') || '없음'}`);
for (const w of warns) console.log('△ ' + w);
for (const e of errors) console.log('✗ ' + e);
console.log(errors.length ? `문제 ${errors.length}개` : '문제 없음', warns.length ? `· 확인할 것 ${warns.length}개` : '');
process.exit(errors.length ? 1 : 0);
