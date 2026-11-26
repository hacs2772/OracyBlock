// 속도 검사 (GitHub 자동 검사에서도 돌아요): 대사가 늘어도 앱이 열릴 때 멈추지 않게
// 2026-11-26: 대사 묶음을 읽을 때 모든 보기를 한꺼번에 만들어 7.7초 멈춘 일이 있었어요 (concept 11-50)
// 기준을 넘으면 실패해요. 넘으면 build.js에서 한꺼번에 계산하는 곳이 생겼는지 봐요
import { performance } from 'node:perf_hooks';

const LOAD_MS = 300; // 대사 묶음 읽기 (앱을 열 때)
const TALK_MS = 300; // 대화 하나의 보기 만들기 (대화를 열 때)

let t = performance.now();
const { GAME_TALKS } = await import('../src/content/build.js');
const load = performance.now() - t;

let worst = { id: '', ms: 0 };
for (const talk of GAME_TALKS) {
  t = performance.now();
  for (const s of talk.steps) {
    if (s.type === 'them') {
      void s.meanings;
      for (const a of s.alts) void a.meanings;
    } else void s.choose;
  }
  const ms = performance.now() - t;
  if (ms > worst.ms) worst = { id: talk.id, ms };
}

const fails = [];
if (load > LOAD_MS) fails.push(`대사 묶음 읽기 ${load.toFixed(0)}ms (기준 ${LOAD_MS}ms)`);
if (worst.ms > TALK_MS) fails.push(`대화 하나 보기 만들기 ${worst.id} ${worst.ms.toFixed(0)}ms (기준 ${TALK_MS}ms)`);
console.log(`대사 묶음 읽기 ${load.toFixed(0)}ms · 가장 느린 대화 ${worst.id} ${worst.ms.toFixed(0)}ms (대화 ${GAME_TALKS.length}개)`);
for (const f of fails) console.log('✗ ' + f);
process.exit(fails.length ? 1 : 0);
