import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Brick, { brickBox } from './Brick.jsx';
import { store } from '../lib/store.js';

export function LogoMark({ size = 34 }) {
  return (
    <svg width={size} height={(size * 30) / 34} viewBox="0 0 34 30" aria-hidden="true" style={{ strokeLinejoin: 'round' }}>
      <path d="M8 8V4.5A1.5 1.5 0 0 1 9.5 3h4A1.5 1.5 0 0 1 15 4.5V8" fill="#FF7967" stroke="#24324A" strokeWidth="2" />
      <path d="M19 8V4.5A1.5 1.5 0 0 1 20.5 3h4A1.5 1.5 0 0 1 26 4.5V8" fill="#FF7967" stroke="#24324A" strokeWidth="2" />
      <path d="M4 7h26a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H13l-6 5v-5H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" fill="#FF7967" stroke="#24324A" strokeWidth="2" />
      <path d="M9 13.5v3M13 12v6M17 13v4M21 11.5v7M25 13.5v3" fill="none" stroke="#24324A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="OracyBlock 학습">
      <LogoMark />
      <span className="logo-text">
        Oracy<b>Block</b>
      </span>
    </Link>
  );
}

export const Play = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#24324A" aria-hidden="true">
    <polygon points="7 4 20 12 7 20 7 4" />
  </svg>
);
export const Close = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#24324A" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const Back = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#24324A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const Mic = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#24324A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
  </svg>
);
export const Refresh = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#24324A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
    <path d="M4 3v5h5" />
    <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
    <path d="M20 21v-5h-5" />
  </svg>
);
export const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A566B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 5l7 7-7 7" />
  </svg>
);
export const Question = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#24324A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.3-2.7 4" />
    <path d="M12 17.4v.2" />
  </svg>
);

const TAB_ICONS = {
  home: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="8" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="16" cy="12" r="1.6" />
    </svg>
  ),
  fix: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  tower: (c) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="15" width="16" height="6" rx="1" />
      <rect x="6" y="9" width="12" height="6" rx="1" />
      <rect x="8" y="3" width="8" height="6" rx="1" />
    </svg>
  ),
  intro: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M17 9h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1v2l-3-2" />
      <path d="M9.5 10.5h.01M9.5 13v.5" />
    </svg>
  ),
  review: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="13" width="18" height="7" rx="1.5" />
      <path d="M7 13v-2M17 13v-2" />
      <path d="M8 4h8M12 4v5" />
    </svg>
  ),
  me: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" />
    </svg>
  ),
};
const TABS = [
  ['/about', 'intro', '소개'],
  ['/', 'home', '학습'],
  ['/review', 'review', '복습'],
  ['/tower', 'tower', '내 탑'],
];
export function Tabs({ className = '' }) {
  const { pathname } = useLocation();
  return (
    <nav className={'tabs ' + className} aria-label="메뉴">
      {TABS.map(([to, icon, label]) => {
        const on = to === '/' ? pathname === '/' : pathname.startsWith(to);
        return (
          <Link key={to} to={to} className={'tab' + (on ? ' on' : '')} aria-current={on ? 'page' : undefined}>
            <span className="tab-brick">{TAB_ICONS[icon](on ? '#24324A' : '#4A566B')}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** 맨 위 줄: 로고 + (오른쪽) 더 넣을 버튼 + 내 정보 */
export function TopBar({ children, me = true }) {
  return (
    <div className="top-row">
      <Logo />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {children}
        {me && (
          <Link to="/me" className="icon-btn" aria-label="내 정보와 설정">
            {TAB_ICONS.me('#24324A')}
          </Link>
        )}
      </div>
    </div>
  );
}

export function Sheet({ title, onClose, children, labelId = 'sheet-title' }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <>
      <div className="dim" onClick={onClose} aria-hidden="true" />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={labelId}>
        <div className="sheet-head">
          <h2 id={labelId}>{title}</h2>
          {onClose && (
            <button className="icon-btn" onClick={onClose} aria-label="닫기">
              <Close />
            </button>
          )}
        </div>
        {children}
      </div>
    </>
  );
}

/** 브릭을 아래부터 쌓아 그려요. bricks: [{ tone, shine, tilt, missing, ghost, side, cls }] */
export function Stack({ bricks, size, x0 = 20, baseY, height, plate = 0, width = '100%', label }) {
  const box = brickBox(size);
  return (
    <div style={{ position: 'relative', width, height }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {plate > 0 && (
        <div style={{ position: 'absolute', left: x0 - 5 - size.pitch, top: baseY - (5 + size.studH + size.depth) }}>
          <Brick tone="plate" studs={plate} pitch={size.pitch} h={Math.max(5, Math.round(size.h * 0.45))} depth={size.depth} studH={size.studH} />
        </div>
      )}
      {bricks.map((b, i) => {
        const tilt = b.tilt ? { transform: 'translate(4px,-2px) rotate(5deg)', transformOrigin: '50% 90%' } : null;
        return (
          <div key={b.key ?? i} className={b.cls || ''} style={{ position: 'absolute', left: x0 - 5, top: baseY - i * size.h - box.lift, ...tilt }}>
            <Brick tone={b.tone} shine={b.shine} missing={b.missing} ghost={b.ghost} sideStud={b.side} {...size} />
          </div>
        );
      })}
    </div>
  );
}

let toastSet = null;
export function toast(msg) {
  toastSet?.(msg);
}
export function Toaster() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    toastSet = (m) => setMsg(m);
    return () => {
      toastSet = null;
    };
  }, []);
  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(() => setMsg(''), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  return msg ? (
    <div className="toast" role="status">
      {msg}
    </div>
  ) : null;
}

/** 설정에 맞게 일본어 글자 보이기 */
export function Ja({ children }) {
  const mode = store.s.settings.ja;
  if (mode === 'hide') return null;
  return (
    <div lang="ja" className={'ja' + (mode === 'clear' ? ' clear' : '')}>
      {children}
    </div>
  );
}
