// 일본인 검수용 표 뽑기: node scripts/export-talks.mjs → docs/review/talks-review.csv
// 엑셀·구글 시트에서 바로 열려요 (UTF-8 BOM). "확인" 칸에 O/X, "고칠 말" 칸에 자연스러운 일본어를 적어 받으면 돼요
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_TALKS } from '../src/content/build.js';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../../docs/review/talks-review.csv');
const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const rows = [['번호', '레벨', '장소', '차례', '누가', '종류', '일본어', '한글 발음', '뜻(한국어)', '가지', '확인(O/X)', '고칠 말 / 메모']];
let n = 0;
for (const t of GAME_TALKS) {
  for (const s of t.steps) {
    const turn = s.idx + 1;
    const br = s.when || '';
    if (s.type === 'them') {
      rows.push([++n, t.level, t.place, turn, t.partner, '상대 말', s.line.ja, s.line.ko, s.line.mean, br, '', '']);
      for (const a of s.alts || []) rows.push([++n, t.level, t.place, turn, t.partner, '상대 말 (다른 말투)', a.ja, a.ko, s.line.mean, br, '', '']);
    } else {
      for (const o of s.options) {
        rows.push([++n, t.level, t.place, turn, '나', '맞는 대답', o.natural.ja, o.natural.ko, o.natural.mean, br, '', '']);
        if (o.react) rows.push([++n, t.level, t.place, turn, t.partner, '상대 반응', o.react.ja, o.react.ko, o.react.mean, br, '', '']);
      }
      for (const nr of s.near || []) if (nr.say) rows.push([++n, t.level, t.place, turn, '나', '어색한 대답 (일부러)', nr.say[0], nr.say[1], nr.say[2], br, '', '']);
    }
  }
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, '﻿' + rows.map((r) => r.map(q).join(',')).join('\r\n') + '\r\n');
console.log(`검수용 표: ${out} (${n}줄, 대화 ${GAME_TALKS.length}개)`);
