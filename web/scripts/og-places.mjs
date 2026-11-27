// 장소 소개 페이지(/places/<id>/)를 카톡·SNS에 공유할 때 뜨는 그림 (1200×630)
// node scripts/og-places.mjs [id …] → public/og/places/<id>.png  (브라우저가 필요해서 빌드 때가 아니라 대화를 더할 때 한 번 돌려요)
// 그림이 없는 장소는 places-pages.mjs가 기본 og-image.png를 써요
// 만든 뒤 색을 96개로 줄여 저장하면 4.2MB → 1.2MB (67개). 파이썬 PIL: Image.open(f).convert('RGB').quantize(96, dither=0).save(f, optimize=True)
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { GAME_TALKS } from '../src/content/build.js';

const pw = await import(process.env.PW || 'playwright');
const { chromium } = pw.default || pw;
const fontDir = new URL('../node_modules/@fontsource/do-hyeon/files/', import.meta.url);
const faces = readdirSync(fontDir).filter((f) => f.endsWith('400-normal.woff2'))
  .map((f) => `@font-face{font-family:DH;src:url(data:font/woff2;base64,${readFileSync(new URL(f, fontDir)).toString('base64')}) format('woff2')}`).join('');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const TONES = ['#29B6A5', '#FF7967', '#5AB0E6', '#FFC857'];
const brick = (x, y, c, w = 120) => `<g transform="translate(${x},${y})"><polygon points="0,22 22,0 ${w + 22},0 ${w},22" fill="${c}" stroke="#24324A" stroke-width="4" stroke-linejoin="round"/><rect x="0" y="22" width="${w}" height="46" fill="${c}" stroke="#24324A" stroke-width="4"/><polygon points="${w},22 ${w + 22},0 ${w + 22},46 ${w},68" fill="${c}" stroke="#24324A" stroke-width="4" stroke-linejoin="round"/><rect x="2" y="54" width="${w - 4}" height="12" fill="rgba(0,0,0,.18)"/></g>`;
const LOGO = '<svg width="56" height="50" viewBox="0 0 34 30"><g stroke="#24324A" stroke-width="2" stroke-linejoin="round" fill="#FF7967"><path d="M8 8V4.5A1.5 1.5 0 0 1 9.5 3h4A1.5 1.5 0 0 1 15 4.5V8"/><path d="M19 8V4.5A1.5 1.5 0 0 1 20.5 3h4A1.5 1.5 0 0 1 26 4.5V8"/><path d="M4 7h26a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H13l-6 5v-5H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/></g><path d="M9 13.5v3M13 12v6M17 13v4M21 11.5v7M25 13.5v3" fill="none" stroke="#24324A" stroke-width="2" stroke-linecap="round"/></svg>';

/** 첫 상대 말: 너무 길면 첫 문장만 */
function firstLine(t) {
  const s = t.steps.find((x) => x.type === 'them');
  if (s.line.ko.length <= 24) return { ko: s.line.ko, ja: s.line.ja };
  // 한글 발음이 길면 한글·일본어 모두 첫 문장만. 마침표로 끝나면 떼고 "…"
  const first = (txt, re) => {
    const one = txt.split(re)[0].trim();
    return /[?？!！]$/.test(one) ? one : one.replace(/[.。]$/, '') + '…';
  };
  return { ko: first(s.line.ko, /(?<=[?!.])\s/), ja: first(s.line.ja, /(?<=[。？！])/) };
}

function html(t) {
  const l = firstLine(t);
  const n = 2 + t.level; // 레벨이 높을수록 탑이 높아요
  const tower = Array.from({ length: n }, (_, i) => brick(80, 430 - i * 50, TONES[(i + t.level) % TONES.length])).join('');
  return `<html><head><style>${faces}
  body{margin:0;width:1200px;height:630px;background:#FFF9F0;font-family:DH,sans-serif;color:#24324A;position:relative;overflow:hidden}
  .dots{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(36,50,74,.07) 4px,transparent 5px);background-size:36px 36px}
  .bub{position:absolute;left:80px;top:330px;width:700px;padding:22px 30px;background:#fff;border:4px solid #1B776C;border-radius:8px 34px 34px 34px}
  .ko{font-size:46px;line-height:1.2}.ja{font-family:'Noto Sans CJK JP','IPAGothic',sans-serif;font-size:24px;color:#6B7587;margin-top:8px}
  </style></head><body><div class="dots"></div>
  <div style="position:absolute;left:80px;top:56px;display:flex;align-items:center;gap:12px">${LOGO}<span style="font-size:44px">Oracy<span style="color:#E0533F">Block</span></span></div>
  <div style="position:absolute;left:82px;top:142px;font-size:84px;line-height:1.1;max-width:760px">${esc(t.place)}</div>
  <div style="position:absolute;left:86px;top:252px;font-size:34px;color:#B9473A">일본어 회화 Lv${t.level} · ${esc(t.partnerDesc || t.partner)}${t.casualTalk ? ' · 반말' : ''}</div>
  <div class="bub"><div class="ko">${esc(l.ko)}</div><div class="ja">${esc(l.ja)}</div></div>
  <svg width="300" height="540" style="position:absolute;right:60px;bottom:30px">${tower}<rect x="20" y="498" width="260" height="20" rx="5" fill="#E2CB9C" stroke="#24324A" stroke-width="4"/></svg>
  </body></html>`;
}

const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const outArg = process.argv.find((a) => a.startsWith('--out='));
const out = outArg ? new URL(`file://${outArg.slice(6).replace(/\/?$/, '/')}`) : new URL('../public/og/places/', import.meta.url);
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
const list = GAME_TALKS.filter((t) => !ids.length || ids.includes(t.id));
for (const t of list) {
  await p.setContent(html(t));
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: new URL(`${t.id}.png`, out).pathname, type: 'png' });
}
await b.close();
console.log(`공유 그림 ${list.length}개 → ${out.pathname}`);
