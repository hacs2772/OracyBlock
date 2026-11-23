// 일본인 검수용 표 뽑기: node scripts/export-talks.mjs → docs/review/talks-review.csv
// 엑셀·구글 시트에서 바로 열려요 (UTF-8 BOM). "확인" 칸에 O/X, "고칠 말" 칸에 자연스러운 일본어를 적어 받으면 돼요
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_TALKS } from '../src/content/build.js';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../../docs/review/talks-review.csv');
const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const ai = []; // AI 검수용 (대화 단위로 묶어서 나눠요)
const rows = [['번호', '레벨', '장소', '차례', '누가', '종류', '일본어', '한글 발음', '뜻(한국어)', '가지', '확인(O/X)', '고칠 말 / 메모']];
let n = 0;
for (const t of GAME_TALKS) {
  const start = rows.length;
  for (const s of t.steps) {
    const turn = s.idx + 1;
    const br = s.when || '';
    if (s.type === 'them') {
      rows.push([++n, t.level, t.place, turn, t.partner, '상대 말', s.line.ja, s.line.ko, s.line.mean, br, '', '']);
      for (const a of s.alts || []) rows.push([++n, t.level, t.place, turn, t.partner, '상대 말 (다른 말투)', a.ja, a.ko, a.mean || s.line.mean, br, '', '']);
    } else {
      for (const o of s.options) {
        rows.push([++n, t.level, t.place, turn, '나', '맞는 대답', o.natural.ja, o.natural.ko, o.natural.mean, br, '', '']);
        if (o.react) rows.push([++n, t.level, t.place, turn, t.partner, '상대 반응', o.react.ja, o.react.ko, o.react.mean, br, '', '']);
      }
      for (const nr of s.near || []) if (nr.say) rows.push([++n, t.level, t.place, turn, '나', '어색한 대답 (일부러)', nr.say[0], nr.say[1], nr.say[2], br, '', '']);
    }
  }
  ai.push({ t, rows: rows.slice(start) });
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, '﻿' + rows.map((r) => r.map(q).join(',')).join('\r\n') + '\r\n');
console.log(`검수용 표: ${out} (${n}줄, 대화 ${GAME_TALKS.length}개)`);

// ---------- 무료 AI 검수용 나눔 파일 (concept 11-29) ----------
// docs/review/ai/part-01.txt … : 파일 하나를 통째로 복사해 AI 채팅에 붙여 넣으면 돼요 (질문 + 대사 약 100줄)
const PROMPT = `너는 일본에서 나고 자란 일본어 원어민이고, 한국어도 잘해. 아래는 한국 여행자가 일본에서 옆자리 사람과 스몰토크하는 연습용 대사야.
각 줄: 번호 | 누가 | 종류 | 일본어 | 한글 발음 | 한국어 뜻

이렇게 봐 줘:
1. 일본어가 그 상황에서 실제로 쓰기에 어색하거나 틀린 줄 (원어민이 이렇게 말하지 않는 것)
2. 한국어 뜻이 일본어와 다르게 옮겨진 줄
3. "맞는 대답"이 바로 앞 상대 말에 대한 대답으로 안 맞는 줄
4. 한글 발음이 일본어 소리와 크게 다른 줄

이건 일부러 이렇게 적은 거라 지적하지 마:
- 한글 발음 표기 규칙: 긴 소리는 "-" (예: 료꼬-), 말 중간 か·た행은 된소리 (예: 데스까, 이따), つ=쯔, ち=찌, っ는 받침 (예: 잇떼, 익까이), ん은 뒤 소리에 따라 ㄴ·ㅁ·ㅇ
- "어색한 대답 (일부러)"는 일부러 틀리게 넣은 대답이야. 진짜로 어색한지만 봐 줘
- 반말·존댓말이 섞인 건 상대에 맞춘 거야 (편의점 점원은 존댓말, 친구는 반말)

답은 문제가 있는 줄만, 아래 표로 적어 줘. 확실하지 않으면 적지 마. 문제가 하나도 없으면 "문제 없음"이라고만 적어 줘.
| 번호 | 문제 (일본어/뜻/대답/발음) | 고칠 말 | 이유 (짧게) |
`;
const aiDir = resolve(here, '../../docs/review/ai');
mkdirSync(aiDir, { recursive: true });
const parts = [];
let cur = [];
for (const g of ai) {
  if (cur.length && cur.reduce((m, x) => m + x.rows.length, 0) + g.rows.length > 110) {
    parts.push(cur);
    cur = [];
  }
  cur.push(g);
}
if (cur.length) parts.push(cur);
parts.forEach((part, i) => {
  const body = part.map((g) => {
    const head = `\n### ${g.t.place} (Lv${g.t.level}) · 상대: ${g.t.partner}, ${g.t.partnerDesc} · 상황: ${g.t.scene || ''}`;
    return [head, ...g.rows.map((r) => [r[0], r[4], r[5] + (r[9] ? ` (가지:${r[9]})` : ''), r[6], r[7], r[8]].join(' | '))].join('\n');
  }).join('\n');
  writeFileSync(resolve(aiDir, `part-${String(i + 1).padStart(2, '0')}.txt`), PROMPT + body + '\n');
});
console.log(`AI 검수용: ${aiDir} (${parts.length}개 파일)`);
