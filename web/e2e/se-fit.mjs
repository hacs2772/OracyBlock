// 아이폰 SE(320×568)에서 상대 말 + 뜻 보기 5개가 한 화면에 들어오는지 (CLAUDE.md "휴대폰 먼저")
// 대사가 긴 차례까지 대화를 해 나가서, 마지막 뜻 보기가 화면 아래를 넘지 않는지 봐요. BROWSER=webkit 이면 아이폰 SE 사파리 엔진
import { talkById } from '../src/content/build.js';

const pw = await import(process.env.PW || 'playwright');
const lib = pw.default || pw;
const ENGINE = process.env.BROWSER || 'chromium';
const BASE = process.env.BASE || 'http://localhost:4173';
// 대사·뜻 보기가 가장 긴 차례들 (대화 id, 차례 번호)
const CASES = [['onsen2', 6], ['shrine', 2], ['bar2', 4], ['sado', 4], ['nomikai', 0], ['yatai', 2], ['sakagura', 0]];
const SCREEN = ENGINE === 'webkit' ? { ...lib.devices['iPhone SE'] } : { viewport: { width: 320, height: 568 }, deviceScaleFactor: 2 };
const fail = [];
const b = await lib[ENGINE].launch();
for (const [id, stop] of CASES) {
  const talk = talkById(id);
  const ctx = await b.newContext(SCREEN);
  await ctx.addInitScript(() => localStorage.getItem('oracy.v1') || localStorage.setItem('oracy.v1', JSON.stringify({ visitorId: 'sefit-' + Date.now(), seenTour: true, seenGame: true, seenCheck: true, seenIntro: true, introDay: new Date().toLocaleDateString('sv-SE'), seenHelp: { learn: true, review: true, tower: true, shop: true }, settings: { preWords: 0 } })));
  const p = await ctx.newPage();
  await p.goto(BASE + '/talk/' + id);
  await p.waitForTimeout(1500);
  let last = -1;
  let measured = false;
  for (let guard = 0; guard < 40 && !measured; guard++) {
    if (await p.locator('.opt.mint').count()) {
      const said = (await p.locator('.tk-b.them.guess .tk-main').innerText()).replace(/반말/, '').trim();
      const s = talk.steps.find((x) => x.idx > last && x.type === 'them' && (x.line.ko === said || x.alts.some((a) => a.ko === said)));
      if (!s) { fail.push(`${id}: 상대 말을 못 찾음`); break; }
      last = s.idx;
      if (s.idx >= stop) {
        await p.waitForTimeout(500);
        const r = await p.evaluate(() => {
          const opts = [...document.querySelectorAll('.opt.mint')];
          const bottom = Math.max(...opts.map((o) => o.getBoundingClientRect().bottom));
          return { n: opts.length, bottom: Math.round(bottom), h: window.innerHeight, wide: document.documentElement.scrollWidth > window.innerWidth + 1 };
        });
        if (r.n !== 5) fail.push(`${id}:${s.idx} 뜻 보기 ${r.n}개`);
        if (r.bottom > r.h) fail.push(`${id}:${s.idx} 마지막 뜻 보기가 화면 밖 (${r.bottom} > ${r.h})`);
        if (r.wide) fail.push(`${id}:${s.idx} 가로로 넘침`);
        console.log(`${id}:${s.idx} 보기 ${r.n}개 · 아래 ${r.bottom}/${r.h}`);
        measured = true;
        break;
      }
      const M = ((s.line.ko === said ? null : s.alts.find((a) => a.ko === said)) || s.line).mean;
      const texts = (await p.locator('.opt.mint').allInnerTexts()).map((t) => t.trim());
      await p.locator('.opt.mint').nth(texts.indexOf(M)).click();
      await p.waitForTimeout(500);
      await p.getByRole('button', { name: '대답하러 가기' }).click();
      await p.waitForTimeout(350);
      continue;
    }
    const me = talk.steps[last + 1];
    if (!me || me.type !== 'me') break;
    last = me.idx;
    const shown = (await p.locator('.opt').allInnerTexts()).map((t) => t.trim());
    const ok = me.options.find((o) => shown.includes(o.natural.ko));
    if (!ok) { fail.push(`${id}: 맞는 대답이 보기에 없음`); break; }
    await p.locator('.opt').nth(shown.indexOf(ok.natural.ko)).click();
    await p.waitForTimeout(600);
    for (let k = 0; k < 2; k++) {
      const n = p.locator('.result .ob-btn.coral');
      if (await n.count()) { await n.first().click(); await p.waitForTimeout(350); }
    }
  }
  if (!measured && !fail.some((f) => f.startsWith(id))) fail.push(`${id}: ${stop}번 차례까지 못 감 (가지가 다른 길로 갔을 수 있어요)`);
  await ctx.close();
}
await b.close();
console.log(`[${ENGINE} SE] ` + (fail.length ? '✗ ' + fail.join('\n✗ ') : `긴 차례 ${CASES.length}곳 모두 한 화면에 들어와요`));
process.exit(fail.length ? 1 : 0);
