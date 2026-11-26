// OracyBlock 게임에 맞게 대사(talks.js)를 다듬어요.
// - 레벨과 장소
// - 상대 말 뜻 맞히기: 5지선다 (뜻이 비슷한 말은 틀린 보기로 안 넣어요)
// - 내 대답 판정: 딱 맞음 / 어긋남 / 살리는 말 / 튕김
// - 골라서 대답하기: 5개 이상 (맞는 대답 모두)
import { TALKS, word, COGNATES, ASK_AGAIN } from './talks.js';

export { COGNATES, ASK_AGAIN };

/** 대화마다 레벨 (Lv1~5) */
const LEVEL_OF = {
  plane: 1, izakaya: 1, onsen: 1, guesthouse: 1, park: 1, taxi: 1,
  shinkansen: 2, bar: 2, festival: 2, farewell: 2,
  izakaya2: 3, guesthouse2: 3, onsen2: 3, bar2: 3, shinkansen2: 3, park2: 3,
  konbini: 1, photo: 1, ramen: 2, busstop: 2, hotel: 2, laundry: 3,
  gate: 1, cafe: 1, hairsalon: 2, platform: 2,
  izakaya3: 4, karaoke: 4, skilift: 4, baseball: 4,
  osaka: 5, nomikai: 5, guesthouse3: 5,
  drugstore: 2, sushi: 3, hanami: 4, lost: 4, ryokan: 5, shrine: 5,
  okonomiyaki: 3, omiyage: 3, arcade: 4, ashiyu: 5,
  highway: 4, aquarium: 4, sauna: 5, ferry: 5,
  rain: 2, catcafe: 2, summit: 3, ekiben: 3,
};
export const READY_LEVELS = [1, 2, 3, 4, 5];
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
  'plane:11': [
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
  'izakaya:7': [
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

/** 예/아니오 질문에 "하이(네)"만 해도 통하는 대답 (몇 번째 대답인지). 사용자 피드백: "료꼬-데스까?"에 "하이"가 튕겼음 */
const YES = {
  'plane:1': 0, 'plane:5': 0, 'plane:11': 0, 'izakaya:1': 0, 'izakaya:7': 1, 'shinkansen:1': 0, 'shinkansen:7': 1,
  'park:3': 0, 'park:7': 0, 'festival:5': 0, 'izakaya2:5': 0, 'guesthouse2:7': 0, 'guesthouse2:9': 0,
  'onsen2:1': 0, 'onsen2:5': 0, 'park2:1': 0,
};
const YES_WORD = ['はい|ええ|うん', '하이', '네'];
const KOREAN_YES = /^(네|넹|넵|예|응|어|ㅇㅇ|웅)[.!~]*$/;

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
    // 일본어 소리 대신 한국어 뜻을 썼을 때 (예: "한국", "네") → 튕기지 않고 알려 줘요
    const raw = String(input.typed).replace(/\s/g, '');
    if (turn.yes && KOREAN_YES.test(raw)) return { kind: 'korean', word: word(YES_WORD) };
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

// 반말 표시: 존댓말 끝(です·ます·でしょう…)이 없고, 문장이 반말 끝(だ·の·よ·ね·る·た·い·て…)으로 끝날 때만.
// "どちらまで？" "ご注文は？" "良い旅を！"처럼 끝이 없는 짧은 말은 반말로 치지 않아요 (사용자 신고: 기사님 말이 반말로 나옴)
const POLITE = /(です|ます|でした|ました|ません|ましょう|ください|でしょう|ございます|いらっしゃいませ)/;
const CASUAL_END = /(だ|だよ|だね|よね|じゃん|の|かい|んだ|ね|よ|さ|わ|な|や|る|た|い|う|て|ろ|ぞ|ぜ|って|っけ|ちゃって|しな|みな|いき|みて)$/;
const isCasual = (ja) => {
  const t = String(ja || '').replace(/うます|ますぎ/g, '');
  if (POLITE.test(t)) return false;
  return t.split(/[。！？!?]/).map((x) => x.trim().replace(/[〜ー…ぁぃぅぇぉっ]+$/, '')).filter(Boolean).some((x) => CASUAL_END.test(x));
};
export { isCasual };

// ---------- 대화 만들기 ----------

const ALL_THEM = TALKS.flatMap((t) => t.turns.filter((x) => x.them).map((x) => ({ talk: t.id, line: x.them })));
// 내 대답마다 바로 앞 상대 말(q)도 같이: 비슷한 질문의 대답은 "상관없는 대답"으로 쓰지 않아요
const ALL_ME = TALKS.flatMap((t) => t.turns.flatMap((x, j) => {
  if (!x.me) return [];
  const q = [...t.turns.slice(0, j)].reverse().find((y) => y.them)?.them;
  return x.me.map((o) => ({ talk: t.id, o, q }));
}));

/**
 * 보기 고르기 규칙 (concept 11-22)
 * - "뜻이 같은 말"은 틀린 보기로 절대 안 넣어요 (사용자 신고: "어디 가요?"에 "어디까지 가세요?"를 골랐는데 튕김)
 *   같은 말 = 뜻 글자가 같거나, 직접 적은 짝(ALSO_SIMILAR), 또는 낱말마다 첫 글자를 모았을 때 60% 넘게 겹침
 *   ("어디 가요?" {어,가} = "어디까지 가세요?" {어,가})
 * - 대신 **헷갈리는 말**을 먼저 넣어요: 같은 핵심 단어가 들리지만 뜻이 다른 말("어디서 왔어요?"),
 *   같은 장면의 다른 말, 소리·모양이 비슷한 대답
 */
const STEM_SKIP = new Set(['그럼', '그래', '좋네', '아니', '이거', '여기', '저기', '그쪽', '정말', '진짜', '요즘', '조금', '오늘', '근데', '아이', '오오', '우와', '어서', '자,']);
const words = (ko) => String(ko || '').replace(/[?!.,~…()·]/g, ' ').split(/\s+/).filter((w) => w.length >= 1);
const heads = (ko) => new Set(words(ko).filter((w) => !STEM_SKIP.has(w.slice(0, 2)) && w.length >= 2).map((w) => w[0]));
const kanaOf = (line) => new Set((line?.keys || []).map((k) => (k.key || k[0] || '').split('|')[0]).filter((k) => !['から', 'まで', 'の', 'は', 'も', 'で', 'に'].includes(k)));
const jac = (a, b) => {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n / (a.size + b.size - n);
};
// 말 줄기 규칙으로 못 잡는 같은 뜻 (직접 적어 둬요)
const ALSO_SIMILAR = [
  // 뜻이 사실상 같은 말 묶음 (사람이 읽고 고름). 같은 묶음끼리는 서로 틀린 보기로 나오지 않아요
  ['다음엔 뭐 부를래?', '한 곡 더 가자! 뭐가 좋아?'],
  ['뭘로 하시겠어요?', '어서 와! 뭘로 할래?', '어서 와요! 뭐부터 쥘까요?'],
  ['그럼 좋은 여행 하세요!', '좋네요. 즐거운 여행 되세요!', '즐겁게 다녀와!', '아, 곧 나고야네. 그럼 좋은 여행 되세요!', '좋은 여행 되길 바라. 조심히 가거라', '오늘 만나서 좋았어! 즐겁게 보내!', '그럼 즐겁게 보내세요!', '교토, 즐겁게 다녀와!', '만나서 좋았어! 여행 즐겁게 해!', '즐거운 여행이 되면 좋겠네요', '좋은 여행 하거라. 조심히 가', '슬슬 나고야네. 그럼 좋은 여행 되세요!', '감사합니다. 교토 즐겁게 보내세요', '자, 슬슬 숙소로 돌아갈까. 좋은 여행 해', '즐거웠어! 여행 즐겁게 해', '자, 이제 곧 도착해. 조심하고 좋은 여행 해', '아, 섬이 보이네. 즐기다 와', '그럼 저희는 펭귄 보러 갈게요. 즐겁게 보세요', '아, 딸이 불러서 이만. 좋은 하루 보내세요', '그럼 저는 이만. 좋은 여행 되세요', '조심히 가세요. 즐겁게 보내세요', '아, 이제 타야 해서요. 좋은 여행 되세요!', '그럼 서로 즐거운 여행 해요', '그럼 좋은 하루 보내세요!'],
  ['어디서 왔어? 일본어 잘하네', '어디 사람이야? 일본어 잘하네', '어디서 왔어? 이 근처엔 한국 사람도 늘었지', '어디서 왔어? 한국 사람?', '보아하니 여행인가? 어디서 왔어?', '관광 온 사람? 어느 나라에서?'],
  ['아, 이제 타야 해서요. 좋은 여행 되세요!', '아, 끝났나 봐요. 그럼 먼저 갈게요!', '아, 이제 가 봐야 해요. 또 어디선가 봬요', '그럼 먼저 실례할게요', '그럼 저희는 펭귄 보러 갈게요. 즐겁게 보세요', '그럼 저는 이만. 좋은 여행 되세요', '아, 딸이 불러서 이만. 좋은 하루 보내세요'],
  ['보아하니 여행인가? 어디서 왔어?', '관광 온 사람? 어느 나라에서?', '일본엔 일로? 여행으로?'],
  ['어디서 왔어? 일본어 잘하네', '어디 사람이야? 일본어 잘하네', '일본어 잘하네. 어디서 배웠어?', '일본어 잘하네. 일본에 살았었어?', '근데 일본어 잘하지 않아? 진짜로?'],
  ['감사합니다. 또 오세요!', '수고하셨어요. 또 오세요!', '좋네요. 또 오세요', '또 일본에 오세요', '또 일본 와. 기다릴게', '오사카 즐겨! 또 와!', '고마워! 또 와', '또 놀러 와. 기다릴게', '또 놀러 오세요', '감사합니다! 또 기다릴게요', '고마워! 또 와!', '또 들러! 조심히 가!'],
  ['좋아, 건배하자!', '좋았어, 건배하자!', '슬슬 다시 건배할까!', '좋아, 한 번 더 건배하자!', '그럼 건배할까!', '자, 다시 한 번 건배!'],
  ['자, 도착했어요', '자, 도착! 여기야'],
  ['조심히 가!', '됐어! 그럼 조심히 가~', '그럼 조심해! 아래에서 또 봐!', '좋은 여행 되길 바라. 조심히 가거라', '수고하셨어요. 조심히 가세요!', '그럼 조심히 가세요', '괜찮아 괜찮아! 조심히 가~', '또 들러! 조심히 가!', '그럼 먼저 갈게. 조심히 가', '조심히 다녀오세요'],
  ['그럼 편히 지내세요', '부디 편히 쉬세요'],
];
/** 뜻이 사실상 같아서 틀린 보기로 쓰면 안 되는 말 */
export function similar(a, b) {
  if (!a || !b) return false;
  if (a.mean === b.mean) return true;
  if (ALSO_SIMILAR.some((g) => g.includes(a.mean) && g.includes(b.mean))) return true;
  if (jac(heads(a.mean), heads(b.mean)) >= 0.6) return true;
  // 한쪽 뜻이 다른 쪽에 거의 다 들어 있으면("그럼 좋은 여행 하세요!" ⊂ "곧 나고야네. 그럼 좋은 여행 해요!") 같은 말
  const x = bigrams(a.mean), y = bigrams(b.mean);
  const small = x.size <= y.size ? x : y, big = small === x ? y : x;
  const inside = (sm, bg) => { let hit = 0; for (const g of sm) if (bg.has(g)) hit++; return hit / Math.max(1, sm.size); };
  if (small.size >= 4 && inside(small, big) >= 0.6) return true;
  const ha = heads(a.mean), hb = heads(b.mean);
  const hs = ha.size <= hb.size ? ha : hb, hl = hs === ha ? hb : ha;
  return hs.size >= 3 && inside(hs, hl) >= 0.75;
}
/** 헷갈리는 정도 (높을수록 먼저 보기로): 같은 핵심 단어 > 같은 장면 > 뜻 글자 일부 겹침 */
function confusable(line, x, sameTalk) {
  let n = 0;
  const ka = kanaOf(line);
  for (const k of kanaOf(x)) if (ka.has(k)) n += 3;
  if (sameTalk) n += 2;
  n += 2 * jac(heads(line.mean), heads(x.mean));
  return n;
}
/** 두 한글 발음이 얼마나 비슷하게 생겼는지 (두 글자씩 겹침) */
const bigrams = (s) => {
  const t = String(s || '').replace(/[\s,.!?~\-…]/g, '');
  const out = new Set();
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2));
  return out;
};

/**
 * 모양 맞추기 (사용자 의견: "딱 봐도 아닌" 보기는 안 돼요. 길이·물음·말투가 다르면 바로 티가 나요)
 * 정답과 같은 모양인 말만 틀린 보기로: 물음표/느낌표/평서문, 문장 수, 길이(0.65~1.5배), 존댓말/반말(한국어 뜻 끝)
 */
const shapeOf = (ko) => {
  const t = String(ko || '').trim();
  const parts = t.match(/[^.?!~]+[.?!~]*/g) || [];
  const sentences = parts.map((x) => x.trim()).filter((x) => /[가-힣A-Za-z0-9]/.test(x));
  const endOf = (x) => (/\?\s*$/.test(x) ? '?' : /!\s*$/.test(x) ? '!' : '.');
  const politeOf = (x) => /(요|니다|세요|까|죠)$/.test(x.replace(/[^가-힣]+$/, ''));
  return {
    end: endOf(t),
    marks: sentences.map(endOf).join(''),
    n: sentences.length,
    len: t.replace(/[\s,.?!~…-]/g, '').length,
    polite: sentences.some(politeOf),
    casual: sentences.some((x) => !politeOf(x)),
  };
};
/** 모양이 얼마나 맞는지. 단계마다 하나씩 풀어 줘요: 0 다 맞음 → 1 길이 조금 → 2 문장 수 → 3 말투 */
function shapeGap(a, b) {
  const x = shapeOf(a), y = shapeOf(b);
  const ratio = Math.max(x.len, y.len) / Math.max(1, Math.min(x.len, y.len));
  return { end: x.end !== y.end, marks: x.marks !== y.marks, n: x.n !== y.n, ratio, polite: x.polite !== y.polite || x.casual !== y.casual };
}
const fits = (g, level) =>
  !g.end && (level >= 3 || !g.polite) && (level >= 2 || (!g.n && !g.marks)) && g.ratio <= (level === 0 ? 1.5 : level === 1 ? 1.9 : 2.4);

/** 상대 말 뜻 맞히기: 보기 5개 = 정답 1 + 모양이 같고 헷갈리는 말 4 (뜻이 같은 말은 빼고) */
function meaningSets(talk, idx, line, exclude = []) {
  const rnd = seeded(talk.id + ':' + idx + (exclude.length ? ':' + line.mean : ''));
  // exclude = 같은 차례의 원래 뜻·다른 말투 뜻 (사실상 같은 말이라 틀린 보기로 쓰면 안 돼요)
  const cands = ALL_THEM.filter((x) => x.line !== line && !similar(line, x.line) && !exclude.includes(x.line.mean) && !exclude.some((m) => similar({ mean: m }, x.line)))
    .map((x) => {
      const g = shapeGap(line.mean, x.line.mean);
      return { line: x.line, g, score: confusable(line, x.line, x.talk === talk.id) - g.ratio + rnd() * 1.2 };
    })
    .sort((p, q) => q.score - p.score);
  const pool = [];
  for (let level = 0; level <= 3 && pool.length < 4; level++) {
    for (const c of cands) {
      if (pool.length >= 4) break;
      if (!fits(c.g, level) || pool.includes(c.line) || pool.some((p) => similar(p, c.line))) continue;
      pool.push(c.line);
    }
  }
  // 내가 놓친 단어가 들어간 말을 대화 화면에서 바꿔 끼울 수 있게 몇 개 더 (concept 11-23)
  const spareMeanings = [];
  for (const c of cands) {
    if (spareMeanings.length >= 8) break;
    if (!fits(c.g, 1) || pool.includes(c.line) || !c.line.keys?.length) continue;
    if ([...pool, ...spareMeanings.map((x) => x.line)].some((p) => similar(p, c.line))) continue;
    spareMeanings.push({ line: c.line, mean: c.line.mean, keys: c.line.keys.map((k) => k.key) });
  }
  return { meanings: shuffle([line.mean, ...pool.map((p) => p.mean)], rnd), spareMeanings: spareMeanings.map(({ mean, keys }) => ({ mean, keys })) };
}

/**
 * 골라서 대답하기: 보기 5개를 한 번에. "답정너"가 아니게 **맞는 대답을 모두** 넣고 (하고 싶은 말을 골라요),
 * 어색한 대답(어긋남)과 상관없는 대답을 섞어요. 상관없는 대답은 비슷한 질문에 대한 대답에서 가져오지 않아요
 */
/** 뜻의 말 줄기 (두 글자): "올게요" → "올게", "가족이랑" → "가족". 네·아뇨 같은 짧은 맞장구는 빼요 */
const STEM_FREE = new Set(['아뇨', '아니', '그래', '그러', '정말', '진짜', '오늘', '그럼']);
const meanStems = (mean) => words(mean).filter((w) => w.length >= 2).map((w) => w.slice(0, 2)).filter((w) => !STEM_FREE.has(w));
/** 사람이 읽어 보고 "이것도 맞는 대답"이라 본 것: 틀린 보기로 쓰지 않아요 (뜻으로 적어요) */
const NOT_WRONG = {
  'okonomiyaki:3': ['해 볼게!'], 'okonomiyaki:9': ['먹어 볼게요!'], 'omiyage:3': ['뭐가 추천이에요?', '먹어 볼게요!'],
  'omiyage:7': ['조금만 넣어 주세요'], 'ashiyu:9': ['신세 많이 졌어요!'],
  'highway:1': ['네, 기분 좋았어요'], 'highway:5': ['배불러요'], 'highway:9': ['즐거웠어요'],
  'aquarium:3': ['대단하네요!', '최고예요!'], 'aquarium:7': ['네, 혼자예요', '네, 부모님이랑요'], 'aquarium:9': ['건강하세요!', '신세 많이 졌어요!', '좋네요!'],
  'sauna:3': ['알겠어요'], 'sauna:5': ['네, 부모님이랑요'], 'sauna:7': ['좋네요!', '하이볼이에요'], 'sauna:9': ['또 올게요!'],
  'ferry:1': ['네, 여행이에요'], 'rain:5': ['네, 여행이에요', '여행이에요', '반대쪽에서요'], 'catcafe:5': ['정말이네요'], 'ekiben:3': ['맡길게요'], 'ekiben:9': ['네, 즐거운 시간 보내세요!', '신세 많이 졌어요!', '건강하세요!'], 'ferry:3': ['좋으셨겠어요'], 'ferry:7': ['네, 서울에서 왔어요'], 'ferry:9': ['신세 많이 졌어요!', '꼭 또 올게요!'],
  'plane:5': ['별로 안 봐요'], 'guesthouse:9': ['응, 꼭!'], 'izakaya:1': ['네, 부모님이랑요'],
  'onsen:1': ['즐거웠어요'], 'shinkansen:1': ['그래도 돼? 부탁해!'], 'shinkansen:3': ['출장이에요', '둘 다예요'],
  'park:1': ['조금 뜨거워요'], 'bar:9': ['최고였어요!'], 'farewell:5': ['감사합니다'],
  'onsen2:1': ['네, 여행이에요'], 'onsen2:3': ['힘드시겠네요'], 'photo:9': ['정말 덥네요'],
  'ramen:9': ['먹어 볼게요!'], 'gate:3': ['시부야가 좋았어요'], 'cafe:9': ['응, 잘 자!'],
  'skilift:1': ['정말 예쁘다!'], 'skilift:7': ['가 볼게!'], 'baseball:3': ['네, 아주 좋아해요'],
  'baseball:7': ['네, 아주 좋아해요'], 'osaka:1': ['맛있어요?'], 'osaka:7': ['먹어 볼게요!', '또 올게요!', '네, 또 올게요!', '잘 먹겠습니다!'],
  'guesthouse3:5': ['가 보고 싶어!'], 'konbini:7': ['어, 진짜요?', '이거 뭐예요?', '그래요?'], 'izakaya:5': ['네, 괜찮아요'],
  'ramen:5': ['네, 괜찮아요'], 'hotel:9': ['신세 좀 질게요'], 'skilift:5': ['괜찮아? 고마워!'],
  'osaka:3': ['대단하네요!'], 'hairsalon:7': ['최고였어요!', '대단하네요!'], 'photo:11': ['덕분에 살았어!'],
  'sushi:11': ['최고였어요!'], 'hanami:1': ['진짜? 기쁘다!', '잘 부탁해!'], 'hanami:5': ['먹어 볼게요!'],
  'hanami:11': ['네, 한 잔만요!'], 'lost:9': ['다행이다!'], 'ryokan:1': ['정말 예쁘네요', '수고 많으세요'],
  'shrine:1': ['아직 모르겠어요'], 'shrine:11': ['신세 많이 졌어요!', '네, 또 올게요!'], 'cafe:5': ['이거 뭐예요?'],
  'hairsalon:5': ['네, 여행이에요'], 'skilift:9': ['좋다!'],
};
/** 어디에 써도 대개 통하는 맞장구·인사: 틀린 보기로 쓰면 맞는 말을 틀렸다고 하게 돼요 */
const ANY_OK = new Set([
  '네, 맞아요', '맞아요', '그러네요', '감사합니다', '감사합니다!', '감사해요', '고마워요', '고마워요!', '고마워!', '꼭이요!', '응, 꼭!',
  '아주 좋아요!', '좋아요!', '네, 좋아요', '또 만나요!', '또 봐요!', '안녕히 가세요!', '안녕히 주무세요', '좋아요, 건배!', '건배!', '건배해요!',
]);

/** 글자로 거의 같은 말 (한쪽이 다른 쪽을 품거나, 두 글자 묶음이 절반 넘게 겹침) */
const plainKo = (ko) => String(ko || '').replace(/[\s,.!?~\-…ー]/g, '');
function nearSame(a, b) {
  const x = plainKo(a), y = plainKo(b);
  if (!x || !y) return false;
  if (x.includes(y) || y.includes(x)) return true;
  return jac(bigrams(x), bigrams(y)) >= 0.45;
}

function chooseSets(talk, idx, options, near, q) {
  const rnd = seeded('me:' + talk.id + ':' + idx);
  const ok = options.map((o, i) => ({ kind: 'ok', option: i, ja: o.natural.ja, ko: o.natural.ko, mean: o.natural.mean }));
  const nearOpts = near.filter((n) => n.say).map((n) => ({ kind: 'near', near: n, ja: n.say[0], ko: n.say[1], mean: n.say[2] }));
  const used = new Set([...ok, ...nearOpts].map((x) => x.ko));
  const okKana = new Set(options.flatMap((o) => o.words.map((w) => w.key)));
  const okGrams = options.map((o) => bigrams(o.natural.ko));
  // 상관없는 대답도 "모양이 비슷한 것"(…까라 키마시따, …데스)부터: 소리만 듣고 고르면 헷갈리게
  // 보기에 보이는 건 한글 발음이라, 모양(물음·길이)은 한글 발음으로, 말투는 일본어(です·ます)로 맞춰요
  const okPolite = options.some((o) => POLITE.test(o.natural.ja));
  const gapTo = (x) => {
    const gs = options.map((o) => shapeGap(o.natural.ko, x.o.natural.ko));
    const best = gs.reduce((m, g) => (g.ratio < m.ratio ? g : m), gs[0]);
    return { ...best, polite: POLITE.test(x.o.natural.ja) !== okPolite };
  };
  const cands = ALL_ME.filter((x) => x.talk !== talk.id && !similar(q, x.q) && !x.o.words.some((w) => okKana.has(w.key)))
    .map((x) => {
      const g = gapTo(x);
      return { x, g, score: 3 * Math.max(...okGrams.map((gr) => jac(gr, bigrams(x.o.natural.ko)))) - g.ratio + rnd() * 0.6 };
    })
    .sort((p, r) => r.score - p.score);
  const offs = [];
  // 틀린 보기가 정답(이나 다른 보기)과 거의 같은 말이면 안 돼요: "아리가또- 고자이마스" ↔ "다이죠-부데스, 아리가또- 고자이마스"
  const shown = [...ok, ...nearOpts].map((y) => y.ko);
  const tooClose = (ko) => shown.some((y) => nearSame(y, ko));
  // 헷갈리는 건 "소리"여야지 "뜻"이면 안 돼요. 뜻에 정답과 같은 말이 들어 있으면 사실 맞는 대답일 수 있어서 빼요
  // ("교토에 가요" 정답 옆에 "가마쿠라에 가요", "다음엔 가족이랑 올게요" 옆에 "다음엔 겨울에 올게요")
  const okStems = new Set(options.flatMap((o) => meanStems(o.natural.mean)));
  const banned = new Set(NOT_WRONG[talk.id + ':' + idx] || []);
  const meansRight = (mean) => banned.has(mean) || ANY_OK.has(mean) || meanStems(mean).some((w) => okStems.has(w));
  for (let level = 0; level <= 3 && offs.length < 4; level++) {
    for (const { x, g } of cands) {
      if (offs.length >= 4) break;
      if (!fits(g, level) || used.has(x.o.natural.ko) || tooClose(x.o.natural.ko) || meansRight(x.o.natural.mean)) continue;
      shown.push(x.o.natural.ko);
      used.add(x.o.natural.ko);
      offs.push({ kind: 'off', ja: x.o.natural.ja, ko: x.o.natural.ko, mean: x.o.natural.mean });
    }
  }
  const spares = [];
  for (const { x, g } of cands) {
    if (spares.length >= 8) break;
    if (!fits(g, 1) || used.has(x.o.natural.ko) || tooClose(x.o.natural.ko) || meansRight(x.o.natural.mean)) continue;
    used.add(x.o.natural.ko);
    shown.push(x.o.natural.ko);
    spares.push({ kind: 'off', ja: x.o.natural.ja, ko: x.o.natural.ko, mean: x.o.natural.mean, keys: x.o.words.map((w) => w.key) });
  }
  const picked = [...ok, ...nearOpts.slice(0, Math.max(0, 4 - ok.length))];
  return { choose: shuffle([...picked, ...offs].slice(0, Math.max(5, picked.length + 1)), rnd), spares };
}

function buildTalk(t) {
  const level = LEVEL_OF[t.id] || 1;
  const steps = [];
  t.turns.forEach((turn, idx) => {
    if (turn.them) {
      const line = turn.them;
      steps.push({
        type: 'them', idx, line, when: turn.when || null,
        // 다른 말투가 자기 뜻을 가지면 뜻 보기도 따로 만들어요 (concept 11-31)
        alts: (line.alt || []).map((a) => (a.ownMean ? { ...a, ...meaningSets(t, idx, { ...line, ja: a.ja, ko: a.ko, mean: a.mean, keys: a.keys }, [line.mean, ...(line.alt || []).map((b) => b.mean)]) } : a)),
        casual: isCasual(line.ja),
        keys: line.keys,
        ...meaningSets(t, idx, line),
      });
    } else if (turn.me) {
      const near = (NEAR[t.id + ':' + idx] || []).map((n) => ({ ...n, words: n.words.map(word), fix: n.fix.map(word) }));
      const yes = YES[t.id + ':' + idx];
      const options = yes == null ? turn.me : turn.me.map((o, i) => (i === yes ? { ...o, words: [...o.words, word(YES_WORD)] } : o));
      steps.push({
        type: 'me', idx, options, near, yes: yes != null, when: turn.when || null,
        hintWords: options.flatMap((o) => o.words.slice(0, 1)),
        ...chooseSets(t, idx, options, near, [...t.turns.slice(0, idx)].reverse().find((y) => y.them)?.them),
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
    const list = s.type === 'them' ? [...s.keys, ...s.alts.flatMap((a) => a.keys)] : s.options.flatMap((o) => o.words);
    for (const w of list) if (!map.has(w.key)) map.set(w.key, w);
  }
  return [...map.values()];
}

/** 조사처럼 혼자서는 뜻이 약한 단어는 복습 단어로 쓰지 않아요 (대화 중 힌트로는 그대로 써요) */
const NOT_REVIEW = new Set(['から', 'まで', 'で', 'に', 'は', 'が', 'を', 'の', 'と', 'も', 'へ', 'ね', 'よ', 'か']);
export const isReviewWord = (w) => !NOT_REVIEW.has(w.say);

/** 복습용 단어 뜻 보기 (정답 + 뜻이 비슷하지 않은 다른 단어 뜻 4개) */
const ALL_WORDS = (() => {
  const map = new Map();
  for (const t of GAME_TALKS) for (const w of talkWords(t)) if (isReviewWord(w) && !map.has(w.mean)) map.set(w.mean, w);
  return [...map.values()];
})();
export function wordChoices(w, salt = '') {
  const rnd = seeded('w:' + w.key + salt);
  // 소리가 비슷한 단어(첫 글자·두 글자 겹침)부터 틀린 보기로. 뜻이 같은 단어는 빼요
  const g = bigrams(w.ko);
  // 한쪽 뜻이 다른 쪽을 품으면("돌아가다" ⊂ "돌아가 버리다", "좋았다" ⊂ "기분 좋았다") 문법 차이라 빼요. 있다/없다처럼 뜻이 뒤집히는 건 남겨요
  const plain = (m) => String(m).replace(/\s*\(.*\)/, '').replace(/[^가-힣0-9]/g, '');
  const grammarOnly = (a, b) => {
    const x = plain(a), y = plain(b);
    if (!x || !y || x === y) return x === y;
    const [sm, bg] = x.length <= y.length ? [x, y] : [y, x];
    const stem = sm.replace(/(다|요|어요|아요)$/, '');
    return bg.includes(stem) && stem.length >= 2 && !/(없|안|못|더)/.test(bg.replace(stem, ''));
  };
  const cands = ALL_WORDS.filter((x) => x.mean !== w.mean && x.key !== w.key && !similar({ mean: w.mean }, { mean: x.mean }) && !grammarOnly(w.mean, x.mean))
    .map((x) => {
      // 뜻 모양: 움직임·상태 말(…다, …요, …해)끼리, 이름 말끼리. 길이도 비슷하게
      const verbish = (m) => /(다|요|해|어|아|워|와|지|자)(\s*\(.*\))?$/.test(m);
      const sameKind = verbish(w.mean) === verbish(x.mean);
      const lenGap = Math.abs(w.mean.length - x.mean.length);
      return { x, score: (x.ko[0] === w.ko[0] ? 2 : 0) + 3 * jac(g, bigrams(x.ko)) + (sameKind ? 3 : -3) - lenGap * 0.4 + rnd() * 1.2 };
    })
    .sort((p, q) => q.score - p.score);
  const picked = [];
  for (const { x } of cands) {
    if (picked.length >= 4) break;
    if (picked.some((p) => similar({ mean: p.mean }, { mean: x.mean }))) continue;
    picked.push(x);
  }
  return shuffle([w.mean, ...picked.map((x) => x.mean)], rnd);
}

export function dailyCognate(d = new Date()) {
  const day = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5);
  return COGNATES[day % COGNATES.length];
}

/**
 * 내가 놓친 단어 섞기 (concept 11-23): 틀린 보기 하나를 "내가 놓친 단어가 들어간 말"로 바꿔요.
 * 정답·어긋난 대답은 그대로. 놓친 단어가 없거나 바꿀 말이 없으면 그대로 둬요
 */
export function mixMissed(step, missedKeys) {
  if (!step || !missedKeys?.size) return step;
  if (step.type === 'them') {
    const sp = (step.spareMeanings || []).find((x) => x.keys.some((k) => missedKeys.has(k)) && !step.meanings.includes(x.mean));
    if (!sp) return step;
    const out = [...step.meanings];
    const i = out.findIndex((m) => m !== step.line.mean);
    out[i] = sp.mean;
    return { ...step, meanings: out, mixed: sp.keys.find((k) => missedKeys.has(k)) };
  }
  const sp = (step.spares || []).find((x) => x.keys.some((k) => missedKeys.has(k)) && !step.choose.some((c) => c.ko === x.ko));
  if (!sp) return step;
  const out = [...step.choose];
  const i = out.findIndex((c) => c.kind === 'off');
  if (i < 0) return step;
  out[i] = sp;
  return { ...step, choose: out, mixed: sp.keys.find((k) => missedKeys.has(k)) };
}
