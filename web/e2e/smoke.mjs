// 실제로 켜서 해 보기 (GitHub 자동 검사 e2e): 대화 하나를 끝까지 하고, 홈 · 복습 · 상점 · 내 탑 · 학습 · 장소 페이지가 열리는지,
// 미션 보상이 들어오는지, 가입하면 둘러보며 쌓은 탑·브릭이 계정으로 옮겨지는지, 다른 기기에서 로그인해도 보이는지
// 로컬: BASE=http://localhost:8090 PW=/opt/node-tools/node_modules/playwright/index.js node e2e/smoke.mjs
import { GAME_TALKS } from '../src/content/build.js';

const pw = await import(process.env.PW || 'playwright');
const lib = pw.default || pw;
// BROWSER=webkit 이면 아이폰 사파리와 같은 엔진(WebKit) + 아이폰 화면으로 해 봐요
const ENGINE = process.env.BROWSER || 'chromium';
const SCREEN = ENGINE === 'webkit' ? { ...lib.devices['iPhone 13'] } : { viewport: { width: 390, height: 844 } };
const BASE = process.env.BASE || 'http://localhost:4173';
const fail = [];
const errs = [];
const b = await lib[ENGINE].launch();
const ctx = await b.newContext(SCREEN);
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

// 3. 미션 보상: 받을 수 있는 걸 다 받고, 모은 브릭이 그 합과 같은지
await p.goto(BASE + '/shop');
await shows('오늘의 미션');
// 제목은 먼저 뜨고 미션 줄(받기 버튼)은 서버 답을 받은 뒤에 떠요
await p.locator('button.sp-get').first().waitFor({ timeout: 10000 }).catch(() => {});
let got = 0;
for (let k = 0; k < 6; k++) {
  const btn = p.locator('button.sp-get:not([disabled])').first();
  if (!(await btn.count())) break;
  got += Number(((await btn.innerText()).match(/\+(\d+)/) || [])[1] || 0);
  await btn.click();
  await p.waitForTimeout(900);
}
if (!got) fail.push('대화를 끝냈는데 받을 미션 보상이 없음');
const bricks = async () => Number((await p.locator('.sp-num').innerText()).trim());
if ((await bricks()) !== got) fail.push(`미션 보상 ${got}개를 받았는데 모은 브릭이 ${await bricks()}개`);

// 4. 가입: 둘러보며 쌓은 탑과 브릭이 계정으로 옮겨지는지
const mail = `e2e${Date.now()}@example.com`;
const pass = 'e2e-pass-1234';
await p.goto(BASE + '/login');
await p.getByRole('tab', { name: '회원가입' }).click();
await p.fill('#au-nick', 'e2e' + String(Date.now()).slice(-6));
await p.fill('#au-mail', mail);
await p.fill('#au-pw', pass);
await p.locator('label.check input[type=checkbox]').check();
await p.getByRole('button', { name: '가입하고 시작하기' }).click();
await p.waitForTimeout(2000);
await p.goto(BASE + '/tower');
if (!(await shows('내 탑 1층'))) fail.push('가입했더니 탑이 1층이 아님 (기록이 계정으로 안 옮겨짐)');
await p.goto(BASE + '/shop');
await shows('오늘의 미션');
// 모은 브릭 수는 서버 답이 온 뒤에 바뀌어요 (처음엔 0). 10초까지 기다려요
const settled = await p.waitForFunction((n) => Number(document.querySelector('.sp-num')?.innerText.trim()) === n, got, { timeout: 10000 }).then(() => true, () => false);
if (!settled) fail.push(`가입했더니 브릭이 ${await bricks()}개 (원래 ${got}개)`);

// 5. 다른 기기에서 로그인: 같은 탑이 보이는지
const ctx2 = await b.newContext(SCREEN);
await ctx2.addInitScript(() => localStorage.getItem('oracy.v1') || localStorage.setItem('oracy.v1', JSON.stringify({ visitorId: 'e2e-other-' + Date.now(), seenTour: true, seenGame: true, seenCheck: true, seenIntro: true, introDay: new Date().toLocaleDateString('sv-SE'), seenHelp: { learn: true, review: true, tower: true, shop: true } })));
const q = await ctx2.newPage();
q.on('pageerror', (e) => errs.push(e.message));
await q.goto(BASE + '/login');
await q.getByRole('tab', { name: '로그인' }).click();
await q.fill('#au-mail', mail);
await q.fill('#au-pw', pass);
await q.getByRole('button', { name: '로그인', exact: true }).click();
await q.waitForTimeout(2000);
await q.goto(BASE + '/tower');
if (!(await q.waitForFunction(() => document.body.innerText.includes('내 탑 1층'), null, { timeout: 10000 }).then(() => true, () => false))) fail.push('다른 기기에서 로그인했더니 탑이 1층이 아님');

await b.close();
if (errs.length) fail.push('화면 오류: ' + errs.join(' / '));
console.log(`[${ENGINE}] ` + (fail.length ? '✗ ' + fail.join('\n✗ ') : `대화 하나 완성 · 화면 7개 · 미션 보상 ${got}브릭 · 가입하면 탑·브릭이 옮겨짐 · 다른 기기 로그인 · 오류 없음`));
process.exit(fail.length ? 1 : 0);
