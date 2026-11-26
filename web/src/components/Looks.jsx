// 상점 물건 그림과 내 탑 꾸미기 (concept 11-21)
import Brick from './Brick.jsx';

const N = '#24324A';

/** 재화 "브릭" 아이콘: 작은 코랄 브릭 하나 */
export function BrickCoin({ size = 18 }) {
  const k = size / 18;
  return <Brick tone="coral" studs={2} pitch={7 * k} h={8 * k} depth={4 * k} studH={Math.max(2, 3 * k)} />;
}

export function FlagTop({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M8 38V4" stroke={N} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M8 5h22l-6 7 6 7H8z" fill="#FF7967" stroke={N} strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

export function LanternTop({ size = 34 }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 40 46" aria-hidden="true">
      <path d="M20 2v6" stroke={N} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="13" y="8" width="14" height="4" rx="1.5" fill="#24324A" />
      <ellipse cx="20" cy="24" rx="13" ry="13" fill="#E0533F" stroke={N} strokeWidth="2.2" />
      <path d="M8 20h24M8 28h24" stroke="#B9473A" strokeWidth="1.6" />
      <rect x="13" y="36" width="14" height="4" rx="1.5" fill="#24324A" />
      <path d="M20 40v5" stroke="#FFC857" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

const v = (name) => ({ fill: `var(--${name})` });

export function SakuraTop({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      <path d="M22 43V24M22 30l-9-8M22 26l8-9" style={{ stroke: 'var(--wood)' }} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      {[[12, 20], [31, 15], [22, 12], [16, 9], [29, 25]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-3.6" rx="2.6" ry="3.6" style={v('sakura')} stroke={N} strokeWidth="1" transform={`rotate(${r})`} />)}
          <circle r="1.4" style={v('yellow')} />
        </g>
      ))}
    </svg>
  );
}

export function UmbrellaTop({ size = 46 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" aria-hidden="true">
      <path d="M23 45V14" style={{ stroke: 'var(--wood)' }} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M3 20C6 9 14 3 23 3s17 6 20 17c-3-2-6-2-8 0-2-2-6-2-8 0-2-2-6-2-8 0-2-2-6-2-8 0-2-2-5-2-8 0z" style={v('red')} stroke={N} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M23 3v17M13 6l-2 14M33 6l2 14" style={{ stroke: 'var(--coral-ink)' }} strokeWidth="1.4" />
      <circle cx="23" cy="3" r="2" style={v('yellow')} stroke={N} strokeWidth="1.4" />
    </svg>
  );
}

export function DarumaTop({ size = 40 }) {
  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 40 42" aria-hidden="true">
      <path d="M20 3c10 0 17 8 17 19 0 11-7 18-17 18S3 33 3 22C3 11 10 3 20 3z" style={v('red')} stroke={N} strokeWidth="2.2" />
      <ellipse cx="20" cy="18" rx="10" ry="8.5" style={v('star')} stroke={N} strokeWidth="1.8" />
      <circle cx="16" cy="17" r="2.2" style={v('star')} stroke={N} strokeWidth="1.4" />
      <circle cx="24" cy="17" r="2.2" style={v('navy')} />
      <path d="M17 22.5c2 1.4 4 1.4 6 0" stroke={N} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M12 32c4 3 12 3 16 0" style={{ stroke: 'var(--yellow)' }} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export { SLOT_OF, LOOK_COUNT, pickLooks } from '../lib/looks.js';
import { SLOT_OF } from '../lib/looks.js';

/** 꼭대기 장식: 그림 · 크기 · 브릭 윗면에서 얼마나 올라오는지(h) · 가운데에서 왼쪽으로 얼마나(dx) */
const TOPS = {
  flag: { Art: FlagTop, size: 40, h: 40, dx: -6 },
  lantern: { Art: LanternTop, size: 28, h: 44, dx: -14 },
  sakura: { Art: SakuraTop, size: 44, h: 44, dx: -22 },
  umbrella: { Art: UmbrellaTop, size: 46, h: 46, dx: -23 },
  daruma: { Art: DarumaTop, size: 38, h: 40, dx: -19 },
};
/** 꼭대기 장식이 차지하는 높이 (탑 칸 크기 계산용) */
export const topHeight = (id) => TOPS[id]?.h || 0;

/** 꼭대기 장식. bottom = 탑 맨 위(브릭 윗면)의 아래에서부터 위치 */
export function TopDecor({ id, bottom, scale = 1 }) {
  const t = TOPS[id];
  if (!t) return null;
  return (
    <div className="tw-top" style={{ position: 'absolute', left: '50%', bottom, marginLeft: t.dx * scale }}>
      <t.Art size={t.size * scale} />
    </div>
  );
}

/** 받침판 색 */
export function plateStyle(id) {
  if (id === 'gold') return { background: 'var(--gold)' };
  if (id === 'sakuraplate') return { background: 'var(--sakura-plate)' };
  if (id === 'tatami') return { background: 'repeating-linear-gradient(90deg, var(--tatami) 0 6px, var(--tatami-line) 6px 7px)', borderTopColor: 'var(--tatami-edge)', borderTopWidth: 3 };
  return { background: 'var(--plate-base)' };
}

const PETALS = [[6, 14, 20], [26, 34, -30], [48, 8, 40], [72, 28, 10], [12, 66, -10], [84, 70, 50], [60, 56, -40], [34, 80, 15]];
const STARS = [[8, 12], [22, 30], [38, 9], [62, 22], [18, 52], [80, 56], [50, 40]];
/** 탑 뒤 배경 (부모 칸을 꽉 채워요) */
export function Backdrop({ id }) {
  if (id === 'petals') return <div className="lk-bg petals" aria-hidden="true">{PETALS.map(([x, y, r], i) => <span key={i} className="lk-petal" style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg)` }} />)}</div>;
  if (id === 'sunset') return <div className="lk-bg sunset" aria-hidden="true"><span className="lk-sun" /></div>;
  if (id === 'night') return <div className="lk-bg night" aria-hidden="true"><span className="lk-moon" />{STARS.map(([x, y], i) => <span key={i} className="lk-star" style={{ left: `${x}%`, top: `${y}%` }} />)}</div>;
  return null;
}

/** 상점 물건 그림 */
export function ItemArt({ id }) {
  const B = { studs: 4, pitch: 16, h: 18, depth: 8, studH: 4 };
  const base = (tone) => <div style={{ position: 'absolute', left: 8, top: 24 }}><Brick tone={tone} {...B} /></div>;
  if (id === 'shield') {
    return (
      <div className="it-art">
        {base('coral')}
        <svg width="40" height="46" viewBox="0 0 40 46" style={{ position: 'absolute', right: 0, top: 0 }} aria-hidden="true"><path d="M20 3l15 6v12c0 11-7 18-15 22C12 39 5 32 5 21V9z" fill="#6BB8E8" stroke={N} strokeWidth="2.2" strokeLinejoin="round" /><path d="M13 22l5 5 9-10" fill="none" stroke={N} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    );
  }
  if (id === 'rest') {
    return (
      <div className="it-art">
        {base('mint')}
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ position: 'absolute', right: 2, top: 0 }} aria-hidden="true"><path d="M26 6a14 14 0 1 0 8 22 11 11 0 0 1-8-22z" fill="#FFC857" stroke={N} strokeWidth="2.2" strokeLinejoin="round" /></svg>
      </div>
    );
  }
  if (SLOT_OF[id] === 'top') {
    const tt = TOPS[id];
    return <div className="it-art">{base(id === 'flag' ? 'yellow' : id === 'umbrella' ? 'sky' : 'mint')}<div style={{ position: 'absolute', left: 40 + tt.dx, top: 24 - tt.h + 4 }}><tt.Art size={tt.size * 0.8} /></div></div>;
  }
  if (SLOT_OF[id] === 'bg') {
    return <div className="it-art it-art-bg"><Backdrop id={id} /><div style={{ position: 'absolute', left: 16, top: 22 }}><Brick tone="coral" {...B} /></div></div>;
  }
  return (
    <div className="it-art">
      <div style={{ position: 'absolute', left: 4, top: 40, width: 88, height: 12, borderRadius: 3, border: '2px solid #24324A', ...plateStyle(id) }} />
      <div style={{ position: 'absolute', left: 16, top: 6 }}><Brick tone="sky" {...B} /></div>
    </div>
  );
}

export const GOLD_PLATE = '#E9B949';
