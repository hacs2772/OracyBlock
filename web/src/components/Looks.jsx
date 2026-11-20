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
  if (id === 'flag') return <div className="it-art">{base('yellow')}<div style={{ position: 'absolute', left: 30, top: -8 }}><FlagTop size={38} /></div></div>;
  if (id === 'lantern') return <div className="it-art">{base('mint')}<div style={{ position: 'absolute', left: 30, top: -14 }}><LanternTop size={30} /></div></div>;
  return (
    <div className="it-art">
      <div style={{ position: 'absolute', left: 4, top: 40, width: 88, height: 12, borderRadius: 3, background: '#E9B949', border: '2px solid #24324A' }} />
      <div style={{ position: 'absolute', left: 16, top: 6 }}><Brick tone="sky" {...B} /></div>
    </div>
  );
}

export const GOLD_PLATE = '#E9B949';
