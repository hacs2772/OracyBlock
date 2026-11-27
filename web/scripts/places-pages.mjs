// 검색에 나오는 장소별 소개 페이지를 만들어요 (빌드 뒤에 저절로: npm run build)
// dist/places/index.html (장소 목록) + dist/places/<대화 id>/index.html (대화 미리보기 · 꼭 들어야 할 단어 · 직접 해 보기)
// 앱은 자바스크립트로 그려서 검색 로봇이 잘 못 읽어요. 이 페이지들은 글자만 있는 가벼운 HTML이에요 (스크립트 없음, CSP에 맞게)
// 사이트맵(dist/sitemap.xml)에도 더해요
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { GAME_TALKS, talkWords, isReviewWord } from '../src/content/build.js';

const SITE = 'https://oracyblock.com';
const dist = new URL('../dist/', import.meta.url);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const today = new Date().toISOString().slice(0, 10);

// 색은 앱(styles.css :root)과 같게
const CSS = `:root{--navy:#24324a;--ink2:#4a566b;--faint:#6b7587;--cream:#fff9f0;--line:#eadfcb;--plate:#f4e9d2;--coral:#ff7967;--mint-bg:#ddf3ef;--yellow-bg:#fff3d6}
*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--navy);font:16px/1.6 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',system-ui,sans-serif}
main{max-width:640px;margin:0 auto;padding:20px 16px 48px}a{color:inherit}
.top{display:inline-block;font-weight:800;font-size:20px;text-decoration:none}.top b{color:#e0533f}
h1{font-size:28px;line-height:1.25;margin:22px 0 6px}h2{font-size:20px;margin:28px 0 10px}
.sub{color:var(--ink2);margin:0}.chip{display:inline-block;padding:2px 10px;border:1.5px solid var(--line);border-radius:999px;font-size:13px;color:var(--ink2);margin-top:8px}
.say{border:2px solid var(--line);border-radius:14px;background:#fff;padding:12px 14px;margin:10px 0}.say.me{background:var(--mint-bg);border-color:#bfe6de;margin-left:28px}
.who{font-size:12px;color:var(--faint)}.ko{font-size:19px;font-weight:700}.ja{font-size:13px;color:var(--faint)}.say.me .ja{color:var(--ink2)}.mean{font-size:14px;color:var(--ink2)}
.words{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}.w{background:var(--yellow-bg);border-radius:12px;padding:8px 12px}.w b{display:block;font-size:18px}.w span{font-size:13px;color:var(--ink2)}
.cta{display:block;text-align:center;margin:28px 0 8px;padding:14px;border:2.5px solid var(--navy);border-radius:14px;background:var(--coral);box-shadow:0 4px 0 var(--navy);font-size:19px;font-weight:800;text-decoration:none}
.more{display:flex;flex-wrap:wrap;gap:8px}.more a{padding:6px 12px;border:1.5px solid var(--line);border-radius:999px;background:#fff;font-size:14px;text-decoration:none}
.lv{margin-top:18px}.foot{margin-top:36px;font-size:13px;color:var(--ink2)}`;

/** 검색 결과에 "홈 › 장소별 일본어 회화 › 장소"로 보이게 (구조화 데이터). 스크립트가 아니라 글자 묶음이라 CSP와 상관없어요 */
function crumbs(trail) {
  const items = trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path }));
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items }).replace(/</g, '\\u003c')}</script>`;
}

function page({ title, desc, path, body, trail }) {
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${SITE}${path}">
<meta property="og:type" content="article"><meta property="og:site_name" content="OracyBlock"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${path}"><meta property="og:image" content="${SITE}/og-image.png">
<link rel="icon" href="/icons/favicon.svg" type="image/svg+xml"><style>${CSS}</style>${trail ? crumbs(trail) : ''}</head>
<body><main><a class="top" href="/">Oracy<b>Block</b></a>${body}
<p class="foot">OracyBlock · 일본 여행 옆자리 스몰토크를 듣고 대답하는 연습. 읽기 공부 없이 한글 발음으로, 무료.<br><a href="/places/">장소 전체 보기</a> · <a href="/about">소개</a></p></main></body></html>
`;
}

/** 첫 가지를 따라 상대 말 n개와 내 대답 (끝까지 다 보여 주지 않아요) */
function preview(t, n = 3) {
  const out = [];
  const tags = [];
  let them = 0;
  for (const s of t.steps) {
    if (s.when && !tags.includes(s.when)) continue;
    if (s.type === 'them') {
      if (them >= n) break;
      them++;
      out.push({ who: t.partner, ko: s.line.ko, ja: s.line.ja, mean: s.line.mean, me: false });
    } else {
      const o = s.options[0];
      if (o.go) tags.push(o.go);
      out.push({ who: '나', ko: o.natural.ko, ja: o.natural.ja, mean: o.natural.mean, me: true });
    }
  }
  return out;
}

const byLevel = new Map();
for (const t of GAME_TALKS) byLevel.set(t.level, [...(byLevel.get(t.level) || []), t]);
const urls = [];

for (const t of GAME_TALKS) {
  const path = `/places/${t.id}/`;
  const words = talkWords(t).filter(isReviewWord).slice(0, 12);
  const lines = preview(t);
  const others = (byLevel.get(t.level) || []).filter((x) => x.id !== t.id);
  const body = `
<h1>${esc(t.place)} 일본어 회화</h1>
<p class="sub">${esc(t.scene)}</p>
<span class="chip">Lv${t.level} · ${esc(t.partnerDesc || t.partner)}${t.casualTalk ? ' · 반말' : ''}</span>
<h2>대화 미리보기</h2>
${lines.map((l) => `<div class="say${l.me ? ' me' : ''}"><div class="who">${esc(l.who)}</div><div class="ko">${esc(l.ko)}</div><div class="ja">${esc(l.ja)}</div><div class="mean">${esc(l.mean)}</div></div>`).join('\n')}
<p class="sub">이어지는 대화는 직접 들으면서 해 봐요. 상대 말을 듣고 뜻을 맞히고, 하고 싶은 대답을 골라 브릭을 쌓아요.</p>
<a class="cta" href="/talk/${esc(t.id)}?from=places">직접 대화해 보기</a>
<h2>꼭 들어야 할 단어</h2>
<div class="words">${words.map((w) => `<div class="w"><b>${esc(w.ko)}</b><span>${esc(w.mean)} · ${esc(w.variants?.[1] || w.key)}</span></div>`).join('')}</div>
${others.length ? `<h2>같은 레벨의 다른 대화</h2><div class="more">${others.map((o) => `<a href="/places/${esc(o.id)}/">${esc(o.place)}</a>`).join('')}</div>` : ''}`;
  const desc = `${t.place}에서 ${t.partner}와 나누는 일본어 스몰토크. 일본어 글자를 몰라도 한글 발음으로 듣고 대답해요. 꼭 들어야 할 단어 ${words.length}개와 대화 미리보기.`;
  const dir = new URL(`places/${t.id}/`, dist);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('index.html', dir), page({ title: `${t.place} 일본어 회화 Lv${t.level} · ${t.partner}와 스몰토크 | OracyBlock`, desc, path, body, trail: [['OracyBlock', '/'], ['장소별 일본어 회화', '/places/'], [t.place, path]] }));
  urls.push(path);
}

// 장소 목록
const list = [...byLevel.entries()].sort((a, b) => a[0] - b[0]).map(([lv, ts]) => `<div class="lv"><h2>Lv${lv}</h2><div class="more">${ts.map((t) => `<a href="/places/${esc(t.id)}/">${esc(t.place)}</a>`).join('')}</div></div>`).join('\n');
mkdirSync(new URL('places/', dist), { recursive: true });
writeFileSync(new URL('places/index.html', dist), page({
  title: '일본 여행 장소별 일본어 회화 | OracyBlock',
  desc: `비행기 옆자리, 이자카야, 온천, 신칸센까지 ${GAME_TALKS.length}가지 장소에서 옆자리 사람과 나누는 일본어 스몰토크. 한글 발음으로 듣고 대답해요.`,
  path: '/places/',
  trail: [['OracyBlock', '/'], ['장소별 일본어 회화', '/places/']],
  body: `<h1>장소별 일본어 회화</h1><p class="sub">일본 여행에서 옆자리 사람이 말을 걸어오는 ${GAME_TALKS.length}가지 장면. 레벨이 오를수록 길고 빨라져요.</p>${list}<a class="cta" href="/?from=places">처음부터 해 보기</a>`,
}));
urls.unshift('/places/');

// 사이트맵: public/sitemap.xml 에 장소 페이지를 더해요
const base = readFileSync(new URL('sitemap.xml', dist), 'utf8');
const extra = urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${u === '/places/' ? '0.8' : '0.6'}</priority></url>`).join('\n');
writeFileSync(new URL('sitemap.xml', dist), base.replace('</urlset>', `${extra}\n</urlset>`));
console.log(`장소 페이지 ${GAME_TALKS.length}개 + 목록 · 사이트맵 ${urls.length}줄 더함`);
