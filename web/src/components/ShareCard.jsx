// 내 탑 자랑하기 (시안 B, concept 11-30): 정사각형 카드 = 왼쪽 내 탑 · 오른쪽 층수와 작은 숫자 3개 · 아래 로고
// [보내기]는 휴대폰 공유 창(카톡·인스타 등), 안 되는 브라우저는 사진 저장으로. 카드 → 사진은 html-to-image (열 때만 받아요)
import { useRef, useState } from 'react';
import Brick from './Brick.jsx';
import { LogoMark, Sheet, toast } from './ui.jsx';
import { pickLooks, TopDecor, topHeight, plateStyle, Backdrop } from './Looks.jsx';
import { LEVEL_SCALE } from '../content/build.js';
import { dayTone } from '../lib/progress.js';

const PLATE_H = 282; // 탑 칸 높이 (카드 360 - 위아래 여백 - 로고 줄)

/** 카드 안의 탑: 칸에 맞게 줄여요 (층이 아주 많아도 한 칸 안에) */
function CardTower({ stack, looks = [] }) {
  let y = 0;
  const placed = stack.map((b, i) => {
    const k = LEVEL_SCALE[b.level] || 1;
    const sz = { studs: 4, pitch: 22 * k, h: 16 * k, depth: 9 * k, studH: Math.max(3, 5 * k) };
    const out = { ...b, sz, bottom: y, i };
    y += sz.h;
    return out;
  });
  const lk = pickLooks(looks);
  const top = lk.top ? topHeight(lk.top) + 4 : 14;
  const fit = Math.min(1, (PLATE_H - 24) / Math.max(1, y + top + 20));
  const height = y + top + 20;
  return (
    <div className="sc-tower">
      <Backdrop id={lk.bg} />
      <div style={{ position: 'absolute', left: '50%', bottom: 8, width: 120, height, marginLeft: -60, transform: `scale(${fit})`, transformOrigin: 'bottom center' }}>
        <div style={{ position: 'absolute', left: -10, right: -10, bottom: 0, height: 9, borderRadius: 3, border: '2px solid #24324A', ...plateStyle(lk.base) }} />
        {lk.top && <TopDecor id={lk.top} bottom={9 + y + 4} />}
        {placed.map((b) => {
          const w = 4 * b.sz.pitch;
          return (
            <div key={b.i} style={{ position: 'absolute', left: `calc(50% - ${w / 2 + 5 + b.sz.depth / 2}px)`, bottom: 9 + b.bottom }}>
              <Brick tone={dayTone(b.day)} {...b.sz} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 정사각형 카드 (360×360, 사진은 3배 = 1080×1080) */
export function ShareCardB({ stack, looks, days, talks, third }) {
  return (
    <div className="sc-card">
      <CardTower stack={stack} looks={looks} />
      <div className="sc-side">
        <div className="sc-big">{stack.length}층</div>
        <div className="sc-sub">하루 하나씩 쌓은 내 탑</div>
        <div className="sc-chips">
          <span className="sc-chip mint">{days}일 공부</span>
          <span className="sc-chip coral">{talks}번 대화</span>
          {third && <span className="sc-chip yellow">{third}</span>}
        </div>
      </div>
      <div className="sc-brand">
        <LogoMark size={22} />
        <span className="sc-brand-t">Oracy<b>Block</b></span>
        <span className="sc-url">oracyblock.com</span>
      </div>
    </div>
  );
}

async function toPng(node) {
  const { toBlob } = await import('html-to-image');
  if (document.fonts?.ready) await document.fonts.ready;
  const blob = await toBlob(node, { pixelRatio: 3, cacheBust: true, width: 360, height: 360, style: { transform: 'none', margin: '0' } });
  if (!blob) throw new Error('사진을 만들지 못했어요');
  return new File([blob], 'oracyblock-tower.png', { type: 'image/png' });
}
function save(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** 내 탑 화면의 "내 탑 자랑하기" 시트 */
export default function ShareSheet({ onClose, ...card }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const run = async (how) => {
    setBusy(true);
    try {
      const file = await toPng(ref.current.firstChild); // 줄여 보인 미리보기가 아니라 카드 그대로 (1080×1080)
      if (how === 'share' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `일본어로 말 걸어 오면 알아듣는 연습, 내 탑 ${card.stack.length}층!`, url: 'https://oracyblock.com' }).catch((e) => {
          if (e?.name !== 'AbortError') throw e;
        });
      } else {
        save(file);
        if (how === 'share') toast('이 브라우저는 바로 보내기가 안 돼서 사진으로 저장했어요');
      }
    } catch (e) {
      toast(e.message || '사진을 만들지 못했어요');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title="내 탑 자랑하기" onClose={onClose} labelId="share-title">
      <p className="small muted" style={{ marginTop: 2 }}>사진으로 만들어 친구에게 보내거나 올릴 수 있어요.</p>
      <div className="sc-preview">
        <div className="sc-scale"><div ref={ref}><ShareCardB {...card} /></div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <button className="ob-btn" disabled={busy} onClick={() => run('save')}><span className="t">사진 저장</span></button>
        <button className="ob-btn coral" disabled={busy} onClick={() => run('share')}><span className="t">{busy ? '만드는 중…' : '보내기'}</span></button>
      </div>
    </Sheet>
  );
}
