// 소개 페이지 팝업 두 가지 (concept 11-15)
// - 사용 방법: 게임 방법 2장 + 대화 자세히 5장 (예전 "직접 끼워 보기"·"단어 하나면 통해요")
// - 내 탑과 순위: 5장 (얇은 브릭 장 포함) (예전 "매일 쌓는 내 탑")
// 그림은 진짜 브릭·얼굴 부품으로 그리고, 장이 바뀔 때마다 다시 움직여요 (Guide가 장마다 새로 그려요)
import Brick from './Brick.jsx';
import Face from './Face.jsx';
import { GAME } from './Guides.jsx';
import { BrickCoin, ItemArt } from './Looks.jsx';
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

// ---------- 복습 방법 (복습 탭에 처음 들어올 때, 소개 웹 "복습 방법") ----------
const W = { studs: 4, pitch: 22, h: 22, depth: 10, studH: 5 };

function ArtCollect() {
  const words = [['료꼬-', '#29B6A5'], ['비-루', '#FF7967'], ['캉코꾸', '#FFC857'], ['하지메떼', '#6BB8E8']];
  return (
    <div className="sl-art">
      <div style={at(12, 18)}><Face kind="auntie" size={46} /></div>
      <Bub left={66} top={14} width={150} d={0.1}><b>료꼬-데스까?</b></Bub>
      {words.map(([w, c], i) => (
        <div key={w} className="sl-drop" style={{ ...at(150 - i * 2, 196 - i * 22 - 26), ...delay(0.6 + i * 0.35) }}><Brick tone={c} label={w} {...W} /></div>
      ))}
      <span className="sl-say sl-fade" style={{ ...at(12, 120), ...delay(2.2) }}>대화 속 단어</span>
    </div>
  );
}

function ArtListen() {
  const opts = ['여행', '맥주', '처음', '한국', '일'];
  return (
    <div className="sl-art">
      <div className="sl-word sl-pop" style={{ ...at(20, 8), ...delay(0.1) }}>
        <span className="sl-play" /> <b>료꼬-</b> <span className="sl-ja">りょこう</span>
      </div>
      <div className="sl-wave" style={at(196, 18)} aria-hidden="true">
        {[8, 16, 24, 14, 20, 10].map((h, i) => <i key={i} style={{ height: h, ...delay(i * 0.08) }} />)}
      </div>
      {opts.map((o, i) => (
        <div key={o} className={'sl-opt sl-fade' + (i === 0 ? ' pick' : '')} style={{ ...at(20 + (i % 2) * 140, 76 + Math.floor(i / 2) * 44), width: 130, ...delay(0.4 + i * 0.12) }}>{o}</div>
      ))}
      <span className="sl-say sl-fade" style={{ ...at(170, 200), ...delay(1.6), color: '#1B776C' }}>딸깍!</span>
    </div>
  );
}

function ArtWordTower() {
  const list = [['료꼬-', '#29B6A5'], ['비-루', '#FF7967'], ['캉코꾸', '#FFC857'], ['하지메떼', '#6BB8E8'], ['오이시-', '#A792E0']];
  return (
    <div className="sl-art">
      <div style={at(84, 222)}><Brick tone="plate" studs={6} pitch={22} h={10} depth={10} studH={5} /></div>
      {list.map(([w, c], i) => (
        <div key={w} className="sl-drop" style={{ ...at(104, 222 - (i + 1) * 22 - 18), ...delay(0.2 + i * 0.35) }}><Brick tone={c} label={w} {...W} /></div>
      ))}
      <span className="sl-say sl-fade" style={{ ...at(8, 20), ...delay(2.1) }}>복습 탑 5층</span>
    </div>
  );
}

function ArtAgain() {
  const days = ['내일', '3일 뒤', '7일 뒤', '14일 뒤', '30일 뒤'];
  return (
    <div className="sl-art">
      <div className="sl-word sl-pop" style={{ ...at(20, 10), ...delay(0.1) }}><b>캉코꾸</b> <span className="sl-ja">한국</span></div>
      {days.map((d, i) => (
        <div key={d} className="sl-day sl-fade" style={{ ...at(20 + i * 56, 120 - i * 14), ...delay(0.5 + i * 0.3) }}>
          <span className="sl-day-dot" />
          {d}
        </div>
      ))}
      <div className="sl-note sl-fade" style={{ ...at(20, 190), ...delay(2.2) }}>맞힐수록 <b>더 나중에</b>, 틀리면 <b>내일</b> 다시</div>
    </div>
  );
}

function ArtShadow() {
  return (
    <div className="sl-art">
      <div className="sl-mic sl-pulse" style={at(24, 30)} aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#24324A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></svg>
      </div>
      <span className="sl-say sl-fade" style={{ ...at(104, 46), ...delay(0.3) }}>"료꼬-"</span>
      {[['원어민', '#29B6A5', 0.6], ['나', '#FF7967', 1.2]].map(([who, c, d], r) => (
        <div key={who} className="sl-lane sl-fade" style={{ ...at(20, 122 + r * 52), ...delay(d) }}>
          <b>{who}</b>
          <span className="sl-wave">{[10, 18, 24, 14, 22, 12, 20, 9, 16].map((h, i) => <i key={i} style={{ height: h, background: c, ...delay(i * 0.07) }} />)}</span>
        </div>
      ))}
    </div>
  );
}

export const REVIEW_SLIDES = [
  { t: '대화에서 만난 단어가 모여요', b: '대화를 하면 꼭 들어야 할 단어가 복습 목록에 들어와요. 놓친 단어는 다음 날 바로 나와요.', art: ArtCollect },
  { t: '듣고 뜻을 골라요', b: '단어를 들려주면 보기 5개 중에서 뜻을 골라요. 맞혀도 틀려도 단어를 크게 보여 주고 다시 들려줘요.', art: ArtListen },
  { t: '맞히면 복습 탑이 올라가요', b: '맞힌 단어는 단어가 적힌 브릭으로 복습 탑에 쌓여요. 날마다 색이 달라요.', art: ArtWordTower },
  { t: '잊을 때쯤 다시 들려줘요', b: '맞힐수록 더 나중에, 틀리면 내일 다시 나와요. 하루에 몇 개 할지는 쌓는 속도에 따라 달라요.', art: ArtAgain },
  { t: '따라 말해 봐도 좋아요', b: '뜻을 고른 다음 마이크를 누르고 따라 말하면, 원어민 소리와 내 소리를 번갈아 들려줘요. 점수는 없어요.', art: ArtShadow },
];

// ---------- 상점·미션 (처음 들어오면, concept 11-33) ----------
function ArtMission() {
  const rows = [['대화 1개 끝내기', 1, 1, '#FF7967', '+10'], ['단어 5개 복습하기', 3, 5, '#FFC857', '+10'], ['처음 가 보는 장소', 0, 1, '#A792E0', '+15']];
  return (
    <div className="sl-art">
      {rows.map(([t, n, of, c, r], i) => (
        <div key={t} className="sl-mrow sl-fade" style={{ ...at(10, 14 + i * 62), ...delay(0.15 + i * 0.25) }}>
          <b>{t}</b>
          <span className="sl-mfill">{Array.from({ length: of }, (_, k) => <i key={k} style={k < n ? { background: c } : null} />)}</span>
          <span className={'sl-mget' + (n >= of ? ' on' : '')}><BrickCoin size={14} /> {r}</span>
        </div>
      ))}
      <span className="sl-say sl-fade" style={{ ...at(0, 206, { width: 310, textAlign: 'center' }), ...delay(1.2), color: '#1B776C' }}>받기 → 브릭</span>
    </div>
  );
}
function ArtGuard() {
  return (
    <div className="sl-art">
      <div className="sl-item sl-pop" style={{ ...at(14, 20), ...delay(0.1) }}><ItemArt id="shield" /><b>방어권</b><span>금 가려는 날 1번 막아요</span></div>
      <div className="sl-item sl-pop" style={{ ...at(162, 20), ...delay(0.5) }}><ItemArt id="rest" /><b>쉬어가기권</b><span>고른 하루는 쉬어도 그대로</span></div>
      <span className="sl-say sl-fade" style={{ ...at(0, 214, { width: 310, textAlign: 'center' }), ...delay(1.2) }}>여행 가는 날, 바쁜 날에</span>
    </div>
  );
}
function ArtDecor() {
  return (
    <div className="sl-art">
      {['flag', 'lantern', 'gold'].map((id, i) => (
        <div key={id} className="sl-item small sl-pop" style={{ ...at(4 + i * 104, 40), ...delay(0.15 + i * 0.3) }}><ItemArt id={id} /></div>
      ))}
      <span className="sl-say sl-fade" style={{ ...at(0, 200, { width: 310, textAlign: 'center' }), ...delay(1.2) }}>내 탑 맨 위와 받침판을 꾸며요</span>
    </div>
  );
}
export const SHOP_SLIDES = [
  { t: '미션을 하면 브릭을 받아요', b: '날마다 바뀌는 오늘의 미션과 이번 주 미션이 있어요. 다 하면 [받기]를 눌러 브릭을 모아요.', art: ArtMission },
  { t: '브릭으로 탑을 지켜요', b: '방어권은 쉬다가 금이 가려는 날 저절로 한 번 막아 줘요. 쉬어가기권은 미리 고른 하루를 쉬어도 탑이 그대로예요.', art: ArtGuard },
  { t: '탑을 꾸며도 돼요', b: '깃발, 초롱, 금빛 받침판으로 내 탑을 꾸며요. 공유 카드에도 같이 나와요.', art: ArtDecor },
];
