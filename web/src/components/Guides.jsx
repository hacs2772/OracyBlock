// 안내 팝업 두 가지: 처음 온 사람 안내(6장) · 게임 방법(3장)
import { useState } from 'react';
import Brick from './Brick.jsx';
import { Stack } from './ui.jsx';
import { LEVEL_SCALE } from '../content/build.js';

const S = { studs: 4, pitch: 18, h: 20, depth: 10, studH: 5 };

function Bubble({ x, y, w, text }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="34" rx="10" fill="#fff" stroke="#24324A" strokeWidth="2" />
      <text x={x + w / 2} y={y + 22} textAnchor="middle" fontSize="14" fontFamily="var(--display)" fill="#24324A">{text}</text>
    </g>
  );
}

const ART = {
  talk: (
    <div style={{ position: 'relative', width: 300, height: 230 }}>
      <svg width="300" height="230" style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden="true">
        <Bubble x={10} y={20} w={120} text="칸코쿠까라?" />
        <Bubble x={170} y={58} w={120} text="하이! 소-데스" />
        <rect x="10" y="196" width="280" height="12" rx="3" fill="#E2CB9C" stroke="#24324A" strokeWidth="2" />
      </svg>
      <div style={{ position: 'absolute', left: 30, top: 0 }}><Stack bricks={[{ tone: 'mint' }, { tone: 'mint' }]} size={S} baseY={196} height={230} width={110} /></div>
      <div style={{ position: 'absolute', left: 170, top: 0 }}><Stack bricks={[{ tone: 'coral', shine: true }, { tone: 'coral', shine: true }]} size={S} baseY={196} height={230} width={110} /></div>
    </div>
  ),
  goal: (
    <div style={{ position: 'relative', width: 300, height: 240 }}>
      <svg width="300" height="240" style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden="true">
        <line x1="10" y1="96" x2="290" y2="96" stroke="#E0533F" strokeWidth="2" strokeDasharray="6 5" />
        <text x="290" y="88" textAnchor="end" fontSize="15" fontFamily="var(--display)" fill="#B9473A">스몰토크</text>
        <line x1="10" y1="30" x2="290" y2="30" stroke="#9AA3B2" strokeWidth="2" strokeDasharray="3 5" />
        <text x="290" y="22" textAnchor="end" fontSize="13" fill="#4A566B">현지인처럼</text>
      </svg>
      <div className="drop" style={{ position: 'absolute', left: 90, top: 0 }}>
        <Stack bricks={[{ tone: 'mint' }, { tone: 'coral', shine: true }, { tone: 'mint' }, { tone: 'sky', shine: true }, { tone: 'mint' }, { tone: 'yellow' }]} size={S} baseY={226} height={240} width={110} plate={6} />
      </div>
    </div>
  ),
  focus: (
    <div style={{ position: 'relative', width: 300, height: 230 }}>
      <svg width="300" height="230" style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden="true">
        <rect x="6" y="80" width="78" height="44" rx="10" fill="#E3F6F3" stroke="#24324A" strokeWidth="2" />
        <text x="45" y="108" textAnchor="middle" fontSize="18" fontFamily="var(--display)" fill="#24324A">듣기</text>
        <rect x="216" y="80" width="78" height="44" rx="10" fill="#FFE1DB" stroke="#24324A" strokeWidth="2" />
        <text x="255" y="108" textAnchor="middle" fontSize="18" fontFamily="var(--display)" fill="#24324A">말하기</text>
        <path d="M88 92 H104" stroke="#24324A" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M98 86 L106 92 L98 98" fill="none" stroke="#24324A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M212 112 H196" stroke="#24324A" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M202 106 L194 112 L202 118" fill="none" stroke="#24324A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="150" y="226" textAnchor="middle" fontSize="13" fill="#4A566B">쌓이는 대화 능력</text>
      </svg>
      <div style={{ position: 'absolute', left: 104, top: 0 }}>
        <Stack bricks={[{ tone: 'mint' }, { tone: 'coral', shine: true }, { tone: 'mint' }, { tone: 'coral', shine: true }, { tone: 'mint' }]} size={{ ...S, pitch: 16 }} baseY={196} height={210} width={100} x0={12} />
      </div>
    </div>
  ),
  noread: (
    <svg width="280" height="200" viewBox="0 0 280 200" aria-hidden="true">
      <rect x="30" y="50" width="220" height="100" rx="12" fill="#fff" stroke="#24324A" strokeWidth="2" />
      <text x="140" y="112" textAnchor="middle" fontSize="40" fontFamily="var(--display)" fill="#4A566B">Reading</text>
      <path d="M50 40 L230 160 M230 40 L50 160" stroke="#E0533F" strokeWidth="10" strokeLinecap="round" />
    </svg>
  ),
  menu: (
    <svg width="280" height="220" viewBox="0 0 280 220" aria-hidden="true">
      <rect x="140" y="20" width="120" height="170" rx="8" fill="#FFF3D6" stroke="#24324A" strokeWidth="2" />
      <text x="200" y="48" textAnchor="middle" fontSize="16" fill="#24324A">お品書き</text>
      {[70, 92, 114, 136, 158].map((y) => (
        <line key={y} x1="156" y1={y} x2="244" y2={y} stroke="#9AA3B2" strokeWidth="3" strokeLinecap="round" />
      ))}
      <circle cx="70" cy="80" r="24" fill="#fff" stroke="#24324A" strokeWidth="2" />
      <path d="M60 78 h4 M76 78 h4 M62 92 q8 6 16 0" stroke="#24324A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M70 104 V170 M70 120 L40 100 M70 120 L110 70" stroke="#24324A" strokeWidth="3" strokeLinecap="round" />
      <text x="114" y="64" fontSize="26" fontFamily="var(--display)" fill="#E0533F">?</text>
    </svg>
  ),
  app: (
    <div style={{ position: 'relative', width: 300, height: 220 }}>
      <svg width="300" height="220" style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden="true">
        <rect x="40" y="16" width="110" height="190" rx="16" fill="#fff" stroke="#24324A" strokeWidth="2.4" />
        <rect x="52" y="40" width="86" height="120" rx="6" fill="#FFF3D6" stroke="#24324A" strokeWidth="1.6" />
        {[60, 80, 100, 120, 140].map((y) => (
          <line key={y} x1="62" y1={y} x2="128" y2={y} stroke="#29B6A5" strokeWidth="3" strokeLinecap="round" />
        ))}
        <circle cx="95" cy="182" r="10" fill="#FF7967" stroke="#24324A" strokeWidth="2" />
        <text x="95" y="34" textAnchor="middle" fontSize="11" fill="#4A566B">번역</text>
        <rect x="170" y="174" width="120" height="10" rx="3" fill="#E2CB9C" stroke="#24324A" strokeWidth="2" />
        <circle cx="216" cy="140" r="2" fill="#24324A" />
        <circle cx="236" cy="140" r="2" fill="#24324A" />
        <path d="M216 154 h20" stroke="#24324A" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', left: 178, top: 92 }}><Brick tone="stone" {...S} /></div>
    </div>
  ),
  brick: (
    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end' }}>
      {[['coral', true, false, '말로'], ['sky', true, false, '글자로'], ['stone', false, false, '골라서'], ['coral', true, true, '힌트·어색']].map(([t, sh, tilt, l]) => (
        <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={tilt ? { transform: 'rotate(6deg)' } : null}><Brick tone={t} shine={sh} studs={2} pitch={18} h={22} depth={9} studH={5} /></div>
          <span style={{ fontSize: 12 }}>{l}</span>
        </div>
      ))}
    </div>
  ),
  how: (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 260 }}>
      <div className="bubble"><div style={{ flex: 1 }}><div className="ko">나니 논데루노?</div><div className="ja">何飲んでるの？</div></div></div>
      <div className="opt mint" style={{ pointerEvents: 'none' }}>뭐 마시고 있어요?</div>
      <div className="ob-btn coral row" style={{ pointerEvents: 'none' }}><span className="t">말로 대답: 비-루!</span></div>
    </div>
  ),
};

/** 레벨이 오를수록 얇아지는 브릭 (피라미드) */
ART.thin = (
  <div style={{ position: 'relative', width: 260, height: 230 }}>
    {(() => {
      const out = [];
      let y = 214;
      [1, 1, 2, 2, 3, 3, 4, 4, 5, 5].forEach((lv, i) => {
        const k = LEVEL_SCALE[lv];
        const sz = { studs: 4, pitch: 18 * k, h: 20 * k, depth: 10 * k, studH: 5 * k };
        const lift = 5 + sz.studH + sz.depth + sz.h;
        const w = 4 * sz.pitch;
        out.push(
          <div key={i} style={{ position: 'absolute', left: 130 - w / 2 - 5, top: y - lift }}>
            <Brick tone={['mint', 'coral', 'yellow', 'sky', '#A792E0'][lv - 1]} {...sz} />
          </div>,
        );
        y -= sz.h;
      });
      return out;
    })()}
    <span style={{ position: 'absolute', right: 0, top: 30, fontFamily: 'var(--display)', fontSize: 16, color: '#B9473A' }}>고수</span>
  </div>
);

export const INTRO = [
  { t: '옆 사람과 스몰토크하려고 만들었어요', b: '일본 여행에서 옆자리 사람이 말을 걸어올 때, 알아듣고 짧게 대답하는 연습을 해요.', art: 'talk' },
  { t: '목표는 적당한 스몰토크예요', b: '최종 목표는 현지인 같은 대화지만, 우리가 먼저 갈 곳은 부담 없는 스몰토크예요.', art: 'goal' },
  { t: '오로지 대화에만 집중해요', b: '듣고 말하며 주고받을수록 대화 능력이 한 층씩 쌓여요. 문법보다 단어가 먼저예요.', art: 'focus' },
  { t: '읽기 공부는 하지 않아요', b: '글자를 외우거나 읽는 시험이 없어요. 상대 말은 한글 발음으로 보여 줘요.', art: 'noread' },
  { t: '그럼 글자를 읽고 싶을 땐요?', b: '메뉴판이나 안내문 같은 거요!', art: 'menu' },
  { t: '그건 번역 앱에 맡기세요', b: '메뉴판은 사진 번역 앱이나 AI에게 찍어서 물어보면 돼요. 우리는 글자를 읽어 주지 않아요.', art: 'app' },
];
export const GAME = [
  { t: '브릭이 내 대답을 보여 줘요', b: '말하거나 써서 대답하면 반짝이는 브릭, 골라서 대답하면 칙칙한 돌 브릭이 쌓여요. 힌트를 쓰거나 어색하게 대답하면 살짝 비뚤게 쌓여요.', art: 'brick' },
  { t: '어려울수록 브릭이 얇아져요', b: '레벨이 오르면 대화가 어려워지고 브릭은 얇고 작아져요. 얇은 브릭이 높이 쌓일수록 고수예요.', art: 'thin' },
  { t: '이렇게 해요', b: '상대 말을 듣고 뜻 브릭을 끼운 다음, 말로 대답해요. 말하기 어려우면 글자로, 그래도 어려우면 골라서 대답해도 돼요.', art: 'how' },
];

export function Guide({ slides, label, doneLabel, onDone, skipLabel = '건너뛰기' }) {
  const [i, setI] = useState(0);
  const s = slides[i];
  const last = i === slides.length - 1;
  return (
    <>
      <div className="dim" aria-hidden="true" />
      <div className="guide" role="dialog" aria-modal="true" aria-labelledby="guide-title">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="small muted">
            {label} · {i + 1}/{slides.length}
          </span>
          <button className="link-btn" onClick={onDone}>{skipLabel}</button>
        </div>
        <div className="guide-art" key={i}>{ART[s.art]}</div>
        <h2 id="guide-title">{s.t}</h2>
        <p>{s.b}</p>
        <div className="dots" aria-hidden="true">
          {slides.map((_, j) => <span key={j} className={j === i ? 'on' : ''} />)}
        </div>
        <div className="guide-foot">
          <button className="link-btn" style={{ visibility: i ? 'visible' : 'hidden' }} onClick={() => setI(i - 1)}>이전</button>
          {last ? (
            <button className="ob-btn coral" style={{ minWidth: 170 }} onClick={onDone}><span className="t">{doneLabel}</span></button>
          ) : (
            <button className="ob-btn coral" style={{ minWidth: 140 }} onClick={() => setI(i + 1)}><span className="t">다음</span></button>
          )}
        </div>
      </div>
    </>
  );
}
