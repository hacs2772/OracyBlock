// 소개 페이지 (웹 시안 Web.dc.html 그대로): 처음 온 사람의 oracyblock.com, 그리고 /about
// 휴대폰과 PC 둘 다. "무료로 시작하기"를 누르면 여행 판으로 들어가요
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GAME_TALKS } from '../content/build.js';
import { speak, sfx, unlock } from '../lib/speech.js';
import { store } from '../lib/store.js';
import { SPEEDS, SPEED_KEYS } from '../lib/speed.js';
import Brick, { brickBox } from '../components/Brick.jsx';
import { LogoMark, Play, Refresh, Tabs } from '../components/ui.jsx';

const ANS = '뭐 마시고 있어요?';
const SETS = [
  ['혼자 왔어요?', '어디서 왔어요?', ANS, '여기 자주 와요?'],
  ['뭐 먹고 있어요?', '맥주 좋아해요?', '한 잔 더 할래요?', '여기 맛있죠?'],
];
const DEMO = { studs: 4, pitch: 20, h: 22, depth: 11, studH: 5 };
const DAYC = ['#29B6A5', '#FF7967', '#FFC857', '#6BB8E8', '#A792E0', '#8CCB6E', '#F49AC1'];

function Demo() {
  const [st, setSt] = useState({ set: 0, wrong: [], mode: 'idle', busy: false, done: false, k: 0, note: '', shake: -1 });
  const box = brickBox(DEMO);
  const X = 19 + 5 + 3 * DEMO.pitch;
  const plateTop = 128;
  const at = (i) => ({ position: 'absolute', left: X - 5, top: plateTop - i * DEMO.h - box.lift });
  const rows = [{ tone: 'mint' }, { tone: 'coral', shine: true }];

  const pick = (label, i) => {
    if (st.busy || st.done) return;
    unlock();
    const k = st.k ? 0 : 1;
    if (label === ANS) {
      sfx('snap', 0.36);
      setSt({ ...st, mode: 'ok', k, busy: true, note: '' });
      setTimeout(() => setSt((s) => ({ ...s, busy: false, done: true })), 700);
    } else {
      sfx('bounce', 0.4);
      setSt({ ...st, mode: 'no', k, busy: true, note: '' });
      setTimeout(() => {
        setSt((s) => {
          const wrong = [...s.wrong, s.set + '-' + i];
          if (wrong.length === 1) speak('何飲んでるの？', 0.7);
          return { ...s, busy: false, wrong };
        });
      }, 1150);
    }
  };
  const refresh = () => {
    if (st.busy || st.done) return;
    if (SETS[st.set].includes(ANS)) {
      sfx('thud');
      setSt({ ...st, shake: st.shake === 0 ? 1 : 0, note: '이 4개 안에 있어요! 다시 들어 보세요' });
    } else setSt({ ...st, set: st.set ? 0 : 1, note: '' });
  };
  let msg = '무슨 뜻일까요? 맞는 브릭을 끼워 보세요';
  if (st.note) msg = st.note;
  else if (st.mode === 'no' && st.busy) msg = '퉁! 저 멀리 튕겨 나갔어요';
  else if (st.wrong.length === 1 && !st.done) msg = '느리게 한 번 더 들려줄게요';
  if (st.mode === 'ok') msg = `딸깍! "${ANS}"였어요`;
  const moving = st.mode === 'ok' || (st.mode === 'no' && st.busy);

  return (
    <div id="try" className="lp-demo">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 22 }}>직접 끼워 보기</span>
        <button className="lp-play" onClick={() => { unlock(); speak('何飲んでるの？', 1); }}><span className="play-dot" style={{ width: 32, height: 32 }}><Play /></span>듣기</button>
      </div>
      <div className="bubble" style={{ marginTop: 10 }}>
        <div style={{ flex: 1 }}>
          <div className="small muted"><b style={{ color: '#24324A' }}>이자카야 옆자리 사람</b> 반말</div>
          <div className="ko" style={{ fontSize: 18 }}>나니 논데루노?</div>
          <div lang="ja" className="ja">何飲んでるの？</div>
        </div>
      </div>
      <div style={{ position: 'relative', width: 260, height: 150, margin: '6px auto 0' }} aria-hidden="true">
        <div style={{ position: 'absolute', left: 19, top: plateTop - (5 + 5 + 11) }}><Brick tone="plate" studs={10} pitch={20} h={11} depth={11} studH={5} /></div>
        {rows.map((r, i) => <div key={i} style={at(i)}><Brick tone={r.tone} shine={r.shine} {...DEMO} /></div>)}
        {!moving && !st.done && <div style={at(2)}><Brick tone="mint" ghost {...DEMO} /></div>}
        {(moving || st.done) && (
          <div key={st.k + st.mode} className={'lp-a ' + (st.mode === 'ok' ? 'lp-drop' : 'lp-bounce')} style={at(2)}>
            <Brick tone="mint" {...DEMO} />
          </div>
        )}
      </div>
      <p aria-live="polite" style={{ margin: '4px 0 6px', minHeight: 22, textAlign: 'center', fontFamily: 'var(--display)', fontSize: 19 }}>{msg}</p>
      {!st.done ? (
        <>
          <div className={st.note ? 'shake-' + st.shake : ''} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SETS[st.set].map((label, i) => (
              <button key={st.set + label} className="lp-opt" disabled={st.wrong.includes(st.set + '-' + i)} onClick={() => pick(label, i)} aria-label={label}>
                <Brick tone="mint" w={250} studs={5} h={32} depth={10} studH={5} label={label} />
              </button>
            ))}
          </div>
          <button className="refresh" style={{ width: '100%', marginTop: 8 }} disabled={st.busy} onClick={refresh}><Refresh />{st.set ? '앞 4개 다시 보기' : '여기엔 맞는 뜻이 없어요'}</button>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px', fontFamily: 'var(--display)', fontSize: 17 }}>꼭 들어야 할 단어</p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
            {[['논데루', '마시고 있어', 'のんでる'], ['나니', '뭐', 'なに']].map(([ko, mean, ja]) => (
              <button key={ko} className="lp-play" onClick={() => speak(ja, 0.85)} aria-label={`${ko}, ${mean}, 들어 보기`}>
                <span className="play-dot" style={{ width: 32, height: 32 }}><Play /></span>{ko}<span style={{ fontWeight: 400 }}>{mean}</span>
              </button>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.6 }}>다음은 내 차례예요. "비-루!" 단어 하나만 말해도 브릭이 바로 위에 쌓여요.</p>
          <button className="lp-play" style={{ marginTop: 8, padding: '0 14px' }} onClick={() => setSt({ set: 0, wrong: [], mode: 'idle', busy: false, done: false, k: 0, note: '', shake: -1 })}>다시 해 보기</button>
        </div>
      )}
    </div>
  );
}

function Pyramid() {
  const lv = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5];
  const SC = { 1: 1, 2: 0.82, 3: 0.66, 4: 0.52, 5: 0.42 };
  let y = 214;
  return (
    <div style={{ position: 'relative', width: 240, height: 240, borderRadius: 16, border: '2px solid #E2CFA9', background: '#F4E9D2' }} aria-hidden="true">
      <div style={{ position: 'absolute', left: 120 - (8 * 18 + 9) / 2 - 5, top: 214 - (5 + 4 + 9) }}><Brick tone="plate" studs={8} pitch={18} h={8} depth={9} studH={4} /></div>
      {lv.map((l, i) => {
        const s = SC[l];
        const sz = { studs: 4, pitch: 16 * s, h: 14 * s, depth: 9 * s, studH: Math.max(2, Math.round(4 * s)) };
        const W = 4 * sz.pitch;
        const pos = { position: 'absolute', left: 120 - (W + sz.depth) / 2 - 5, top: y - (5 + sz.studH + sz.depth + sz.h) };
        y -= sz.h;
        return <div key={i} style={pos}><Brick tone={DAYC[i % 7]} {...sz} /></div>;
      })}
      <span style={{ position: 'absolute', right: 12, top: 12, fontFamily: 'var(--display)', fontSize: 16 }}>고수</span>
      <span style={{ position: 'absolute', right: 12, bottom: 10, fontFamily: 'var(--display)', fontSize: 16 }}>Lv1</span>
    </div>
  );
}

const TIERS = [
  { name: '딱 맞음', say: '"비-루!" "하이보-루데스"', desc: '핵심 단어가 들어 있으면 딱 맞아요. 바로 위에 일자로 쌓여요.', style: { left: 40, top: 52 } },
  { name: '어긋남', say: '(가리키며) "코레!" (이거!)', desc: '통하긴 하지만 핵심 단어가 빠졌어요. 비뚤게 얹히고, 이유와 바꿀 단어를 알려 줘요.', style: { left: 50, top: 47, transform: 'rotate(7deg)', transformOrigin: '50% 92%' } },
  { name: '틀림', say: '"오이시-!" (맛있어요!)', desc: '질문과 상관없는 말이에요. 저 멀리 튕겨 나가요.', style: { left: 112, top: -8, transform: 'rotate(38deg) scale(.8)' }, lines: true },
];
const WAYS = [
  { name: '말로 대답', desc: '마이크를 눌러 말해요. 반짝이는 코랄 브릭이 쌓여요.', tone: 'coral', shine: true },
  { name: '글자로 대답', desc: '한글 발음으로 써요. "비-루"처럼 단어 하나면 돼요. 반짝이는 하늘 브릭.', tone: 'sky', shine: true },
  { name: '골라서 대답', desc: '한글 발음 보기 중에서 골라요. 칙칙한 돌 브릭이 쌓여요.', tone: 'stone' },
  { name: '힌트를 쓰면', desc: '맞혀도 살짝 비뚤게 쌓여요. 다음엔 힌트 없이 해 봐요.', tone: 'coral', shine: true, tilt: true },
];
const TOPICS = ['#자기소개', '#여행', '#음식·술', '#고향', '#날씨', '#작별 인사'];
const RANKS = [['토모', 6], ['곰', 5], ['나', 4, true], ['스시', 3], ['민트', 2]];

export default function Landing() {
  const nav = useNavigate();
  const start = () => {
    unlock();
    store.set({ seenIntro: true });
    nav('/');
    window.scrollTo(0, 0);
  };
  return (
    <div className="lp">
      <div className="lp-wrap">
        <header className="lp-head">
          <Link to="/about" className="logo" aria-label="OracyBlock 소개">
            <LogoMark size={40} />
            <span className="logo-text" style={{ fontSize: 28 }}>Oracy<b>Block</b></span>
          </Link>
          <nav className="lp-nav" aria-label="소개 메뉴">
            <Link className="lp-hide-sm" to="/" onClick={() => store.set({ seenIntro: true })}>여행 판</Link>
            <a className="lp-hide-sm" href="#try">대화해 보기</a>
            <a className="lp-hide-sm" href="#bricks">브릭 이야기</a>
            <a className="lp-hide-sm" href="#tower">내 탑과 순위</a>
            <Link to="/login">로그인</Link>
            <button className="ob-btn sm coral lp-hide-sm" onClick={start}><span className="t">무료로 시작</span></button>
          </nav>
        </header>

        <section className="lp-hero">
          <div style={{ flex: '1 1 440px', minWidth: 0 }}>
            <h1 className="lp-h1">Hear it. Say it.<br />No reading required.</h1>
            <p className="lp-sub">듣고, 말하고, 읽기 공부는 생략.</p>
            <p className="lp-p" style={{ maxWidth: 520, fontSize: 17 }}>일본 여행에서 옆자리 사람이 말을 걸어올 때. 다 알아듣지 못해도 괜찮아요. 들리는 단어로 뜻을 맞히고, 단어 하나로 대답하면서 스몰토크를 이어 가요.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginTop: 26 }}>
              <button className="ob-btn coral" style={{ minWidth: 240 }} onClick={start}><span className="t">무료로 시작하기</span><span className="s">가입 없이 바로 대화해 보기</span></button>
              <Link to="/login" style={{ fontSize: 15, fontWeight: 500, textUnderlineOffset: 3 }}>이미 계정이 있어요 · 로그인</Link>
            </div>
            <p className="small muted" style={{ marginTop: 22, fontSize: 13, lineHeight: 1.6 }}>휴대폰 브라우저에서 oracyblock.com을 열고 홈 화면에 추가하면 앱처럼 쓸 수 있어요. 지금은 일본어부터, 영어와 중국어는 준비 중이에요.</p>
          </div>
          <Demo />
        </section>

        <section id="bricks" className="lp-sec">
          <h2 className="lp-h2">단어 하나면 통해요</h2>
          <p className="lp-p">문법보다 단어가 먼저예요. 핵심 단어가 들어 있으면 브릭이 바로 위에 딱 맞게 쌓여요. 어색하면 비뚤게 얹히고, 왜 그런지 알려 드려요. 상관없는 말이면 저 멀리 튕겨 나가요.</p>
          <div className="plate" style={{ marginTop: 28, padding: '22px clamp(14px,3vw,32px) 28px' }}>
            <div className="bubble" style={{ display: 'inline-flex', fontSize: 15 }}><span><b>나니 논데루노?</b> <span className="muted">뭐 마시고 있어요?</span></span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 18 }}>
              {TIERS.map((t) => (
                <div key={t.name} style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: 200, height: 150 }} aria-hidden="true">
                    <div style={{ position: 'absolute', left: 20, top: 96 }}><Brick tone="plate" studs={6} pitch={20} h={11} depth={11} studH={5} /></div>
                    <div style={{ position: 'absolute', left: 40, top: 74 }}><Brick tone="mint" {...DEMO} /></div>
                    <div style={{ position: 'absolute', ...t.style }}><Brick tone="coral" shine {...DEMO} /></div>
                    {t.lines && (
                      <svg width="40" height="40" viewBox="0 0 40 40" style={{ position: 'absolute', left: 84, top: 34 }}><path d="M6 30c4-6 4-14 0-20M14 34c6-9 6-21 0-30" fill="none" stroke="#24324A" strokeWidth="2" strokeLinecap="round" /></svg>
                    )}
                  </div>
                  <p style={{ margin: '6px 0 0', fontFamily: 'var(--display)', fontSize: 24 }}>{t.name}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700 }}>{t.say}</p>
                  <p className="muted" style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.6, maxWidth: 260 }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-sec">
          <h2 className="lp-h2">말이 안 나와도 괜찮아요</h2>
          <p className="lp-p">이어폰이 없거나 소리를 낼 수 없을 땐 한글 발음으로 써서 대답하고, 그래도 어려우면 골라서 대답해요. 대신 어떻게 대답했는지에 따라 쌓이는 브릭이 달라져요.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 28px', marginTop: 28 }}>
            {WAYS.map((w) => (
              <div key={w.name} style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6 }}>
                <div style={{ height: 76, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} aria-hidden="true">
                  <div style={w.tilt ? { transform: 'rotate(7deg)', transformOrigin: '50% 90%' } : null}><Brick tone={w.tone} shine={w.shine} studs={4} pitch={20} h={26} depth={12} studH={6} /></div>
                </div>
                <p style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 22 }}>{w.name}</p>
                <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, maxWidth: 230 }}>{w.desc}</p>
              </div>
            ))}
          </div>
          <div className="cry" style={{ marginTop: 26, maxWidth: 560, fontSize: 15 }}>
            <svg width="70" height="64" viewBox="0 0 70 64" aria-hidden="true" style={{ flexShrink: 0, overflow: 'visible', strokeLinejoin: 'round' }}>
              <rect x="16" y="10" width="11" height="7" rx="2" fill="#B8B1A4" stroke="#24324A" strokeWidth="2" />
              <rect x="43" y="10" width="11" height="7" rx="2" fill="#B8B1A4" stroke="#24324A" strokeWidth="2" />
              <rect x="8" y="16" width="54" height="40" rx="4" fill="#B8B1A4" stroke="#24324A" strokeWidth="2" />
              <rect x="10" y="47" width="50" height="7" fill="#9C9587" />
              <path d="M20 27l7-3M50 27l-7-3" fill="none" stroke="#24324A" strokeWidth="2" strokeLinecap="round" />
              <circle cx="25" cy="33" r="2.6" fill="#24324A" />
              <circle cx="45" cy="33" r="2.6" fill="#24324A" />
              <path d="M29 46q6-6 12 0" fill="none" stroke="#24324A" strokeWidth="2" strokeLinecap="round" />
              <path className="lp-tear" d="M25 37q-3 5 0 7q3-2 0-7z" fill="#8FD3F4" stroke="#24324A" strokeWidth="1" />
              <path className="lp-tear" d="M45 37q-3 5 0 7q3-2 0-7z" fill="#8FD3F4" stroke="#24324A" strokeWidth="1" style={{ animationDelay: '.6s' }} />
            </svg>
            <span>골라서 대답하면 브릭이 칙칙해서 울어요. 다음엔 말로 대답해서 반짝이게 해 주세요.</span>
          </div>
        </section>

        <section id="tower" className="lp-sec lp-row">
          <div style={{ flex: '1 1 360px', minWidth: 0, maxWidth: 520 }}>
            <h2 className="lp-h2">매일 쌓는 내 탑</h2>
            <p className="lp-p">대화를 하나 끝낼 때마다 브릭이 하나씩 쌓여요. 하루에 몇 개까지 쌓을지는 내가 골라요 ({SPEED_KEYS.map((k) => `${SPEEDS[k].label} ${SPEEDS[k].bricks}개`).join(' · ')}). 어려운 대화일수록 브릭이 얇아져서, 얇은 브릭이 높이 쌓일수록 고수예요.</p>
            <p className="lp-p" style={{ marginTop: 10 }}>빨리 쌓은 탑은 쉬는 날에 빨리 흔들려요. 금이 가도 대화나 복습 하나면 다시 단단해져요. 맞힌 단어는 단어가 적힌 브릭으로 복습 탑에 쌓여요.</p>
            <p className="lp-p" style={{ marginTop: 10 }}>순위는 브릭 수가 아니라 <b>공부한 날 수</b>로 매겨요. 얼마나 꾸준히 했는지를 겨뤄요.</p>
          </div>
          <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
            <Pyramid />
            <div style={{ width: 260, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} aria-label="순위 예시">
              <p style={{ margin: '0 0 8px', fontFamily: 'var(--display)', fontSize: 19 }}>이번 주 꾸준함 순위</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6, height: 130, borderBottom: '3px solid #E2CB9C' }}>
                {RANKS.map(([name, days, me], i) => (
                  <div key={name} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{days}일</span>
                    <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', ...(me ? { outline: '3px solid #FF7967', outlineOffset: 4, borderRadius: 4 } : null) }}>
                      {Array.from({ length: days }, (_, s) => (
                        <div key={s} style={{ width: 34, height: 14, background: DAYC[(i * 2 + s) % 7], border: '2px solid #24324A', borderRadius: 3, marginTop: -2 }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginTop: 4 }}>
                {RANKS.map(([name, , me]) => <div key={name} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 12, ...(me ? { fontWeight: 700, color: '#B9473A' } : null) }}>{name}</div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="lp-sec">
          <h2 className="lp-h2">옆자리에서 시작하는 이야기</h2>
          <p className="lp-p">메뉴판은 사진 번역 앱이나 AI에 맡기고, 우리는 옆에 앉은 사람과의 대화를 연습해요. 글자를 외우거나 읽는 시험은 없어요. 상대 말은 한글 발음으로 보여 드려요.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 12px', marginTop: 24 }}>
            {GAME_TALKS.map((t, i) => <span key={t.id} className="lp-chip" style={{ background: ['#29B6A5', '#FF7967', '#FFC857', '#FFFFFF'][i % 4] }}>{t.place}</span>)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
            {TOPICS.map((t) => <span key={t} className="lp-tag">{t}</span>)}
          </div>
        </section>

        <section className="lp-sec lp-row" style={{ justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 380px', minWidth: 0 }}>
            <h2 className="lp-h2" style={{ fontSize: 'clamp(30px,3.2vw,40px)' }}>오늘 첫 대화를 쌓아 보세요</h2>
            <p className="lp-p">가입 없이 바로 해 볼 수 있어요. 가입하면 내 탑과 기록이 저장되고 순위에 참여할 수 있어요. 무료예요.</p>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button className="ob-btn coral" style={{ minWidth: 220 }} onClick={start}><span className="t">무료로 시작하기</span><span className="s">가입 없이 바로</span></button>
            <Link className="ob-btn" to="/login" style={{ minWidth: 150 }}><span className="t">로그인</span><span className="s">기록 이어 하기</span></Link>
          </div>
        </section>

        <footer className="lp-foot">
          <span><b style={{ color: '#24324A' }}>OracyBlock</b> oracyblock.com</span>
          <span style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}><Link to="/terms">이용약관</Link><Link to="/privacy">개인정보 처리방침</Link><Link to="/me">의견 보내기</Link></span>
          <span>같은 브릭 가족 <a href="https://asmrblock.com">ASMR Block</a></span>
        </footer>
      </div>
      <Tabs className="lp-tabs" />
    </div>
  );
}
