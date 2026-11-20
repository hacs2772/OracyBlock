// 소개 페이지 팝업 두 가지 (concept 11-15)
// - 사용 방법: 게임 방법 2장 + 대화 자세히 5장 (예전 "직접 끼워 보기"·"단어 하나면 통해요")
// - 내 탑과 순위: 5장 (얇은 브릭 장 포함) (예전 "매일 쌓는 내 탑")
// 그림은 진짜 브릭·얼굴 부품으로 그리고, 장이 바뀔 때마다 다시 움직여요 (Guide가 장마다 새로 그려요)
import Brick from './Brick.jsx';
import Face from './Face.jsx';
import { GAME } from './Guides.jsx';
import { SPEEDS, SPEED_KEYS } from '../lib/speed.js';

const B = { studs: 4, pitch: 24, h: 26, depth: 12, studH: 6 };
const S = { studs: 4, pitch: 14, h: 15, depth: 7, studH: 4 };
const DAYC = ['#29B6A5', '#FF7967', '#FFC857', '#6BB8E8', '#A792E0', '#8CCB6E', '#F49AC1'];

const at = (left, top, extra) => ({ position: 'absolute', left, top, ...extra });
const delay = (s) => ({ animationDelay: s + 's' });

function Plate({ left = 70, top = 210, studs = 7 }) {
  return <div style={at(left, top)}><Brick tone="plate" studs={studs} pitch={24} h={11} depth={12} studH={6} /></div>;
}
function Bub({ children, left, top, width, tone = 'them', d = 0, q = false }) {
  return (
    <div className={'sl-bub ' + tone + ' sl-pop'} style={{ ...at(left, top), width, ...delay(d) }}>
      {children}
      {q && <span className="sl-q sl-pulse" style={delay(d + 0.4)}>?</span>}
    </div>
  );
}

function ArtHear() {
  return (
    <div className="sl-art">
      <div style={at(12, 40)}><Face kind="office" size={54} talking /></div>
      <Bub left={74} top={30} width={210} d={0.2} q>
        <b>나니 논데루노?</b>
        <span className="sl-ja">何飲んでるの？</span>
      </Bub>
      <div className="sl-wave" style={at(74, 112)} aria-hidden="true">
        {[8, 16, 24, 14, 20, 10, 18, 12].map((h, i) => <i key={i} style={{ height: h, ...delay(i * 0.08) }} />)}
      </div>
      <Plate top={214} />
      <div className="sl-fade" style={{ ...at(124, 150), ...delay(1.1) }}><Brick tone="mint" ghost {...B} /></div>
    </div>
  );
}

function ArtMeaning() {
  const opts = ['어디서 왔어요?', '뭐 마시고 있어요?', '혼자 왔어요?'];
  return (
    <div className="sl-art">
      <div className="sl-fade" style={at(10, 6)}>
        <span className="sl-chip on">나니 = 뭐</span> <span className="sl-chip on" style={{ marginLeft: 4 }}>논데루 = 마시고 있어</span>
      </div>
      {opts.map((o, i) => (
        <div key={o} className={'sl-opt sl-fade' + (i === 1 ? ' pick' : '')} style={{ ...at(10, 44 + i * 38), ...delay(0.2 + i * 0.12) }}>{o}</div>
      ))}
      <Plate left={176} top={214} studs={4} />
      <div className="sl-drop" style={{ ...at(190, 152), ...delay(1.3) }}><Brick tone="mint" {...S} pitch={20} h={22} depth={10} /></div>
      <span className="sl-say sl-fade" style={{ ...at(170, 112), ...delay(1.8) }}>딸깍!</span>
    </div>
  );
}

function ArtWord() {
  return (
    <div className="sl-art">
      <div style={at(232, 36)}><Face kind="me" size={54} /></div>
      <Bub left={56} top={30} width={168} tone="me" d={0.2}>
        <b>비-루데스!</b>
        <span className="sl-sub">"비-루"만 말해도 통해요</span>
      </Bub>
      <Plate top={214} />
      <div style={at(124, 166)}><Brick tone="mint" {...B} /></div>
      <div className="sl-drop" style={{ ...at(124, 140), ...delay(0.9) }}><Brick tone="coral" shine {...B} /></div>
      <span className="sl-say sl-fade" style={{ ...at(12, 150), ...delay(1.5), color: '#B9473A' }}>딱 맞음</span>
    </div>
  );
}

function ArtTilt() {
  return (
    <div className="sl-art">
      <Bub left={20} top={14} width={270} tone="me" d={0.1}>
        <b>코레!</b> <span className="sl-sub">(가리키며 "이거!")</span>
      </Bub>
      <Plate top={214} />
      <div style={at(124, 166)}><Brick tone="mint" {...B} /></div>
      <div style={{ ...at(124, 140), transform: 'translate(6px,-3px) rotate(7deg)', transformOrigin: '50% 92%' }}>
        <div className="sl-drop" style={delay(0.6)}><Brick tone="coral" shine {...B} /></div>
      </div>
      <div className="sl-note sl-fade" style={{ ...at(16, 74), ...delay(1.4) }}>
        통하긴 해요. <b>비-루</b>라고 하면 딱 맞아요
      </div>
    </div>
  );
}

function ArtBounce() {
  return (
    <div className="sl-art">
      <Plate top={214} />
      <div style={at(124, 166)}><Brick tone="mint" {...B} /></div>
      <div className="lp-a lp-bounce" style={{ ...at(124, 140), ...delay(0.2) }}><Brick tone="coral" shine {...B} /></div>
      <div className="lp-a lp-bounce" style={{ ...at(124, 140), ...delay(1.5) }}><Brick tone="coral" shine {...B} /></div>
      <span className="sl-say sl-fade" style={{ ...at(30, 60), ...delay(0.6), color: '#E0533F' }}>퉁!</span>
      <span className="sl-say sl-fade" style={{ ...at(70, 96), ...delay(1.9), color: '#E0533F' }}>퉁!</span>
      <div className="sl-note sl-fade" style={{ ...at(150, 70), width: 150, ...delay(2.6) }}>
        두 번이면 <b>답을 보고</b> 넘어가요
      </div>
    </div>
  );
}

export const TALK_MORE = [
  { t: '상대가 먼저 말을 걸어요', b: '말풍선에 한글 발음이 나와요. 다 못 알아들어도 괜찮아요. 빨간 ?가 뜨면 뜻을 맞힐 차례예요.', art: ArtHear },
  { t: '들리는 단어로 뜻을 골라요', b: '"나니(뭐)", "논데루(마시고 있어)"만 들려도 충분해요. 보기 5개 중에서 고르면 민트 브릭이 끼워져요.', art: ArtMeaning },
  { t: '단어 하나면 통해요', b: '하고 싶은 대답을 골라요. 핵심 단어가 들어 있으면 반짝이는 브릭이 딱 맞게 쌓여요. 맞는 대답은 여러 개예요.', art: ArtWord },
  { t: '어색하면 비뚤게 쌓여요', b: '통하긴 하지만 어색한 대답이면 비뚤게 얹혀요. 왜 어색한지, 무슨 단어로 바꾸면 되는지 알려 줘요.', art: ArtTilt },
  { t: '상관없는 말은 튕겨 나가요', b: '두 번 튕기면 답을 보여 주고 넘어가요. 빠진 자리는 고치기에서 다시 끼울 수 있어요.', art: ArtBounce },
];
// 어려울수록 얇아지는 브릭(GAME[1])은 내 탑과 순위 쪽으로 옮겼어요
export const TALK_SLIDES = [GAME[0], GAME[2], ...TALK_MORE];

// ---------- 내 탑과 순위 ----------

function ArtGrow() {
  const list = [0, 1, 2, 3, 4, 5];
  return (
    <div className="sl-art">
      <Plate top={226} />
      {list.map((i) => (
        <div key={i} className="sl-drop" style={{ ...at(124, 196 - i * 26 - 4), ...delay(0.2 + i * 0.35) }}><Brick tone={DAYC[i]} {...B} /></div>
      ))}
      <span className="sl-say sl-fade" style={{ ...at(16, 4), ...delay(2.4) }}>대화 하나 = 브릭 하나</span>
    </div>
  );
}

function ArtSpeed() {
  return (
    <div className="sl-art">
      {SPEED_KEYS.map((k, c) => (
        <div key={k} className="sl-fade" style={{ ...at(8 + c * 102, 30), width: 96, ...delay(0.2 + c * 0.25) }}>
          <div style={{ position: 'relative', height: 172 }}>
            <div style={at(14, 146)}><Brick tone="plate" studs={4} pitch={16} h={8} depth={8} studH={4} /></div>
            {Array.from({ length: SPEEDS[k].bricks }, (_, i) => (
              <div key={i} className="sl-drop" style={{ ...at(18, 122 - i * 18), ...delay(0.6 + c * 0.25 + i * 0.25) }}><Brick tone={DAYC[c * 2 + i]} studs={4} pitch={14} h={18} depth={8} studH={4} /></div>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--display)', fontSize: 18 }}>{SPEEDS[k].label}</div>
          <div style={{ textAlign: 'center', fontSize: 13 }}>하루 {SPEEDS[k].bricks}개</div>
        </div>
      ))}
    </div>
  );
}

function ArtCrack() {
  return (
    <div className="sl-art">
      <Plate top={214} />
      <div style={at(124, 166)}><Brick tone="mint" {...B} /></div>
      <div style={at(124, 140)}><Brick tone="coral" {...B} /></div>
      <div className="sl-out" style={{ ...at(124, 140), ...delay(2.2) }}><Brick tone="coral" crack {...B} /></div>
      <div style={at(124, 114)}><Brick tone="yellow" {...B} /></div>
      <span className="sl-say sl-fade" style={{ ...at(10, 40), ...delay(0.4), color: '#E0533F' }}>쉬는 날: 쩍</span>
      <div className="sl-note sl-fade" style={{ ...at(150, 20), width: 150, ...delay(1.6) }}>대화나 복습 <b>하나면</b></div>
      <span className="sl-say sl-fade" style={{ ...at(14, 150), ...delay(2.4), color: '#1B776C' }}>단단!</span>
    </div>
  );
}

const RANKS = [['토모', 6], ['곰', 5], ['나', 4, true], ['스시', 3], ['민트', 2]];
function ArtRank() {
  return (
    <div className="sl-art" style={{ padding: '24px 20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, height: 170, borderBottom: '3px solid #E2CB9C' }}>
        {RANKS.map(([name, days, me], i) => (
          <div key={name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span className="sl-fade" style={{ fontSize: 13, fontWeight: 700, ...delay(0.3 + days * 0.18) }}>{days}일</span>
            <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', ...(me ? { outline: '3px solid #FF7967', outlineOffset: 4, borderRadius: 4 } : null) }}>
              {Array.from({ length: days }, (_, s) => (
                <div key={s} className="sl-drop" style={{ width: 40, height: 18, background: DAYC[(i * 2 + s) % 7], border: '2px solid #24324A', borderRadius: 3, marginTop: -2, ...delay(0.1 + s * 0.18) }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
        {RANKS.map(([name, , me]) => <div key={name} style={{ flex: 1, textAlign: 'center', fontSize: 14, ...(me ? { fontWeight: 700, color: '#B9473A' } : null) }}>{name}</div>)}
      </div>
    </div>
  );
}

const speedText = SPEED_KEYS.map((k) => `${SPEEDS[k].label} ${SPEEDS[k].bricks}개`).join(', ');
export const TOWER_SLIDES = [
  { t: '대화 하나에 브릭 하나', b: '대화를 끝낼 때마다 내 탑에 브릭이 하나씩 쌓여요. 맞힌 단어는 복습 탑에 단어 브릭으로 따로 쌓여요.', art: ArtGrow },
  { ...GAME[1] },
  { t: '하루에 몇 개 쌓을지 골라요', b: `${speedText}. 내 생활에 맞게 고르고, 3일에 한 번 바꿀 수 있어요.`, art: ArtSpeed },
  { t: '쉬면 금이 가요', b: '빨리 쌓은 탑일수록 쉬는 날 빨리 흔들려요. 금이 가도 대화나 복습 하나면 다시 단단해져요.', art: ArtCrack },
  { t: '순위는 공부한 날 수로', b: '브릭 수가 아니라 얼마나 꾸준히 했는지를 겨뤄요.', art: ArtRank },
];
