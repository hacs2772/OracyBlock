// 비스듬히 본 브릭 하나 (테두리 모양 B). 시안의 Brick.dc.html을 그대로 옮겼어요.
const NAVY = '#24324A';
export const TONES = { mint: '#29B6A5', coral: '#FF7967', sky: '#5AB0E6', stone: '#B8B1A4', yellow: '#FFC857', plate: '#E2CB9C', white: '#FFFFFF' };

function hx(h) {
  let s = String(h).replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}
export function mix(a, b, t) {
  const x = hx(a);
  const y = hx(b);
  return '#' + x.map((v, i) => {
    const n = Math.max(0, Math.min(255, Math.round(v + (y[i] - v) * t)));
    return (n < 16 ? '0' : '') + n.toString(16);
  }).join('');
}
const f = (v) => Math.round(v * 10) / 10;
const pts = (a) => a.map((q) => f(q[0]) + ',' + f(q[1])).join(' ');

/** 브릭 그림의 바깥 크기 (쌓을 때 위치 계산에 씀) */
export function brickBox({ studs = 4, pitch = 22, h = 26, depth = 12, studH = 6, sideStud = false }) {
  const W = studs * pitch;
  return { w: W + depth + 10 + (sideStud ? 10 : 0), h: h + depth + studH + 10 + 3, lift: 5 + studH + depth + h };
}

export default function Brick({ tone = 'coral', studs = 4, pitch = 22, h = 26, depth = 12, studH = 6, ghost = false, sideStud = false, shine = false, missing = '', label = '', crack = false, className = '', style }) {
  const raw = TONES[tone] || (/^#[0-9a-f]{6}$/i.test(tone) ? tone : TONES.coral);
  const n = Math.max(1, studs);
  const H = h;
  const T = depth;
  const sh = studH;
  const W = n * pitch;
  const p = W / n;
  const pad = 5;
  const ox = pad;
  const oy = pad + sh;
  const bw = W + T + pad * 2 + (sideStud ? 10 : 0);
  const bh = H + T + sh + pad * 2 + 3;
  const front = [[ox, oy + T], [ox + W, oy + T], [ox + W, oy + T + H], [ox, oy + T + H]];
  const top = [[ox, oy + T], [ox + T, oy], [ox + W + T, oy], [ox + W, oy + T]];
  const side = [[ox + W, oy + T], [ox + W + T, oy], [ox + W + T, oy + H], [ox + W, oy + T + H]];
  const sil = [[ox, oy + T + 3], [ox + T, oy + 3], [ox + W + T, oy + 3], [ox + W + T, oy + H + 3], [ox + W, oy + T + H + 3], [ox, oy + T + H + 3]];
  const bandY = oy + T + H * 0.76;
  const band = [[ox + 1, bandY], [ox + W - 1, bandY], [ox + W - 1, oy + T + H - 1], [ox + 1, oy + T + H - 1]];
  const kcy = oy + T / 2 + H / 2;
  const kx0 = ox + W + T / 2;
  const kx1 = ox + W + T + 6;
  const knob = sideStud ? `M${f(kx0)},${f(kcy - 5)} L${f(kx1)},${f(kcy - 5)} A3 5 0 0 1 ${f(kx1)},${f(kcy + 5)} L${f(kx0)},${f(kcy + 5)} Z` : '';
  let c;
  let strokeStyle;
  let studSide;
  let studTop;
  let studStroke;
  let studSw;
  if (ghost) {
    const line = mix(raw, '#000000', 0.12);
    c = { top: 'rgba(255,255,255,0.4)', front: 'rgba(255,255,255,0.4)', side: 'rgba(255,255,255,0.25)', band: 'none', shadow: 'none', sTop: line, sFront: line, sSide: line };
    strokeStyle = { strokeWidth: 2, strokeDasharray: '5 4', strokeLinejoin: 'round' };
    studSide = 'none';
    studTop = 'none';
    studStroke = line;
    studSw = { strokeWidth: 1.5, strokeDasharray: '3 3' };
  } else {
    const t = mix(raw, '#FFFFFF', 0.3);
    const s = mix(raw, '#000000', 0.18);
    c = { top: t, front: raw, side: s, band: mix(raw, '#000000', 0.2), shadow: 'rgba(36,50,74,0.3)', sTop: NAVY, sFront: NAVY, sSide: NAVY };
    strokeStyle = { strokeWidth: 2, strokeLinejoin: 'round' };
    studSide = mix(raw, '#000000', 0.12);
    studTop = mix(raw, '#FFFFFF', 0.32);
    studStroke = NAVY;
    studSw = { strokeWidth: 1.6 };
  }
  const glow = shine && !ghost;
  const gx = ox + Math.max(12, W * 0.14);
  const gy = oy + T + 3;
  const gh = H * 0.68;
  const hole = mix(raw, '#000000', 0.42);
  const miss = new Set(String(missing || '').split(',').map((x) => x.trim()).filter((x) => x !== '').map(Number));
  const studList = [];
  for (let i = 0; i < n; i++) {
    const cx = ox + p * (i + 0.5) + T * 0.5;
    const cy = oy + T * 0.5;
    const rx = Math.min(p * 0.3, 8.5);
    const ry = rx * 0.46;
    const m = 3;
    const sw = 2 * rx + 2 * m;
    const shh = sh + 2 * ry + 2 * m;
    const lcx = rx + m;
    const cyT = ry + m;
    const cyB = ry + m + sh;
    const isMiss = miss.has(i);
    const flat = ghost || isMiss;
    const body = flat ? '' : `M${f(lcx - rx)},${f(cyT)} L${f(lcx - rx)},${f(cyB)} A${f(rx)} ${f(ry)} 0 0 0 ${f(lcx + rx)},${f(cyB)} L${f(lcx + rx)},${f(cyT)} Z`;
    studList.push(
      <svg key={i} viewBox={`0 0 ${f(sw)} ${f(shh)}`} width={f(sw)} height={f(shh)} style={{ position: 'absolute', left: f(cx - rx - m), top: f(cy - sh - ry - m), overflow: 'visible' }} aria-hidden="true">
        {body && <path d={body} fill={studSide} stroke={studStroke} style={studSw} />}
        <ellipse cx={f(lcx)} cy={f(flat ? cyB : cyT)} rx={f(rx)} ry={f(ry)} fill={isMiss ? hole : studTop} stroke={studStroke} style={isMiss ? { strokeWidth: 1.2 } : studSw} />
      </svg>,
    );
  }
  const fs = Math.round(Math.min(H * 0.56, 17));
  return (
    <div className={className} style={{ position: 'relative', flexShrink: 0, width: f(bw), height: f(bh), ...style }}>
      <svg viewBox={`0 0 ${f(bw)} ${f(bh)}`} width={f(bw)} height={f(bh)} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} aria-hidden="true">
        {!ghost && <polygon points={pts(sil)} fill={c.shadow} />}
        {knob && <path d={knob} fill={c.side} stroke={c.sSide} style={strokeStyle} />}
        <polygon points={pts(side)} fill={c.side} stroke={c.sSide} style={strokeStyle} />
        <polygon points={pts(front)} fill={c.front} stroke={c.sFront} style={strokeStyle} />
        {!ghost && <polygon points={pts(band)} fill={c.band} />}
        <polygon points={pts(top)} fill={c.top} stroke={c.sTop} style={strokeStyle} />
        {glow && (
          <>
            <polyline points={pts([[ox + 4, oy + T + 3], [ox + W - 4, oy + T + 3]])} fill="none" stroke="rgba(255,255,255,0.8)" style={{ strokeWidth: 2, strokeLinecap: 'round' }} />
            <polygon points={pts([[gx, gy], [gx + 6, gy], [gx - 4, gy + gh], [gx - 10, gy + gh]])} fill="#FFFFFF" opacity="0.6" />
            <polygon points={pts([[gx + 10, gy], [gx + 13, gy], [gx + 3, gy + gh], [gx, gy + gh]])} fill="#FFFFFF" opacity="0.45" />
          </>
        )}
        {crack && (
          <polyline
            points={pts([[ox + W * 0.3, oy + T], [ox + W * 0.38, oy + T + H * 0.35], [ox + W * 0.3, oy + T + H * 0.55], [ox + W * 0.42, oy + T + H]])}
            fill="none"
            stroke={NAVY}
            style={{ strokeWidth: 1.8, strokeLinejoin: 'round', strokeLinecap: 'round' }}
          />
        )}
        {crack && <polyline points={pts([[ox + W * 0.38, oy + T + H * 0.35], [ox + W * 0.5, oy + T + H * 0.3]])} fill="none" stroke={NAVY} style={{ strokeWidth: 1.4, strokeLinecap: 'round' }} />}
      </svg>
      {studList}
      {label && (
        <div style={{ position: 'absolute', left: ox, top: oy + T, width: W, height: H * 0.76, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', boxSizing: 'border-box', fontFamily: 'var(--display)', fontSize: fs, lineHeight: 1, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', pointerEvents: 'none' }}>{label}</div>
      )}
    </div>
  );
}
