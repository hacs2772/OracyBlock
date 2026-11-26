// 실제로 켜서 해 보기 (GitHub 자동 검사 e2e): 대화 하나를 끝까지 하고, 홈 · 복습 · 상점 · 내 탑 · 학습 · 장소 페이지가 열리는지
// 로컬: BASE=http://localhost:8090 PW=/opt/node-tools/node_modules/playwright/index.js node e2e/smoke.mjs
import { GAME_TALKS } from '../src/content/build.js';

const pw = await import(process.env.PW || 'playwright');
const { chromium } = pw.default || pw;
const BASE = process.env.BASE || 'http://localhost:4173';
const fail = [];
const errs = [];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => {
  if (!localStorage.getItem('oracy.v1')) localStorage.setItem('oracy.v1', JSON.stringify({ visitorId: 'e2e-' + Date.now(), seenTour: true, seenGame: true, seenCheck: true, seenIntro: true, introDay: new Date().toLocaleDateString('sv-SE'), seenHelp: { learn: true, review: true, tower: true, shop: true }, settings: { preWords: 0 } }));
});
const p = await ctx.newPage();
p.on('pageerror', (e) => errs.push(e.message));

// 1. 대화 하나 끝까지
const talk = GAME_TALKS.find((t) => t.id === 'konbini');
await p.goto(BASE + '/talk/' + talk.id);
await p.waitForTimeout(1500);
let last = -1;
for (let guard = 0; guard < 40; guard++) {
  if (await p.getByRole('heading', { name: '대화 하나 완성!' }).count()) break;
  if (await p.locator('.opt.mint').count()) {
    const said = (await p.locator('.tk-b.them.guess .tk-main').innerText()).replace(/반말/, '').trim();
    const s = talk.steps.find((x) => x.idx > last && x.type === 'them' && (x.line.ko === said || x.alts.some((a) => a.ko === said)));
    if (!s) { fail.push('상대 말을 대사에서 못 찾음: ' + said); break; }
    last = s.idx;
    const M = ((s.line.ko === said ? null : s.alts.find((a) => a.ko === said)) || s.line).mean;
    const texts = (await p.locator('.opt.mint').allInnerTexts()).map((t) => t.trim());
    if (texts.length !== 5) fail.push(`뜻 보기가 ${texts.length}개`);
    if (!texts.includes(M)) { fail.push('정답 뜻이 보기에 없음: ' + M); break; }
    await p.locator('.opt.mint').nth(texts.indexOf(M)).click();
    await p.waitForTimeout(600);
    await p.getByRole('button', { name: '대답하러 가기' }).click();
    await p.waitForTimeout(400);
    continue;
  }
  const me = talk.steps[last + 1];
  if (!me || me.type !== 'me') { fail.push('내 차례를 못 찾음'); break; }
  last = me.idx;
  const shown = (await p.locator('.opt').allInnerTexts()).map((t) => t.trim());
  const ok = me.options.find((o) => shown.includes(o.natural.ko));
  if (!ok) { fail.push('맞는 대답이 보기에 없음'); break; }
  await p.locator('.opt').nth(shown.indexOf(ok.natural.ko)).click();
  await p.waitForTimeout(700);
  for (let k = 0; k < 2; k++) {
    const n = p.locator('.result .ob-btn.coral');
    if (await n.count()) { await n.first().click(); await p.waitForTimeout(400); }
  }
}
await p.waitForTimeout(3000); // 끝낸 기록이 서버에 가는 시간
if (!(await p.getByRole('heading', { name: '대화 하나 완성!' }).count())) fail.push('대화가 끝나지 않음');

// 2. 다른 화면들
const pages = [['/', '내 탑'], ['/review', '복습'], ['/shop', '상점'], ['/tower', '내 탑'], ['/learn', '학습'], ['/places/', '장소별 일본어 회화'], ['/places/konbini/', '편의점']];
/** 글자가 보일 때까지 기다려요 (화면은 따로 받아서 조금 늦게 떠요) */
const shows = (text, ms = 10000) => p.waitForFunction((t) => document.body.innerText.includes(t), text, { timeout: ms }).then(() => true, () => false);
for (const [path, text] of pages) {
  await p.goto(BASE + path);
  if (!(await shows(text))) fail.push(`${path} 에 "${text}"가 안 보임`);
  if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail.push(`${path} 가로로 넘침`);
}
// 내 탑이 1층 쌓였는지 (서버 기록까지)
await p.goto(BASE + '/tower');
if (!(await shows('내 탑 1층'))) fail.push('대화를 끝냈는데 내 탑이 1층이 아님: ' + (await p.locator('body').innerText()).match(/내 탑 \d+층/)?.[0]);

await b.close();
if (errs.length) fail.push('화면 오류: ' + errs.join(' / '));
console.log(fail.length ? '✗ ' + fail.join('\n✗ ') : '대화 하나 완성 · 화면 7개 확인 · 오류 없음');
process.exit(fail.length ? 1 : 0);
