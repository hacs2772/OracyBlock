// 소개 페이지: 처음 온 사람의 oracyblock.com, 그리고 /about (concept 11-15)
// 휴대폰과 PC 둘 다. "무료로 시작하기"를 누르면 학습으로 들어가요
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GAME_TALKS } from '../content/build.js';
import { unlock } from '../lib/speech.js';
import { store, useStore } from '../lib/store.js';
import { LogoMark, Tabs } from '../components/ui.jsx';
import { openContact } from '../components/Contact.jsx';
import { INTRO, Guide } from '../components/Guides.jsx';
import { TALK_SLIDES, TOWER_SLIDES, REVIEW_SLIDES } from '../components/LandingSlides.jsx';
import Face from '../components/Face.jsx';
import { Stack } from '../components/ui.jsx';


/**
 * 첫 화면 오른쪽: 진짜 대화 화면처럼 저절로 흘러가는 짧은 대화 (concept 11-15)
 * 상대 말 (?) → 뜻을 알아듣고 민트 브릭 → 내 차례 (?) → 대답하고 코랄 브릭 → 다음 말 … → 꼭대기
 */
const LIVE = [
  { them: { ko: '나니 논데루노?', ja: '何飲んでるの？', mean: '뭐 마시고 있어요?' }, me: '비-루데스!' },
  { them: { ko: '이-네! 캄빠이 시요-!', ja: 'いいね！乾杯しよう！', mean: '좋네! 건배하자!' }, me: '캄빠이!' },
];
const LIVE_SIZE = { studs: 4, pitch: 20, h: 22, depth: 10, studH: 5 };
function LiveTalk() {
  const [n, setN] = useState(0); // 0~9 단계, 한 바퀴 돌면 처음부터
  useEffect(() => {
    const t = setTimeout(() => setN((x) => (x + 1) % 10), n === 9 ? 2600 : 1500);
    return () => clearTimeout(t);
  }, [n]);
  const turn = Math.min(1, Math.floor(n / 4));
  const k = n - turn * 4; // 0 상대 말(?) · 1 알아들음 · 2 내 차례(?) · 3 대답
  const L = LIVE[turn];
  const bricks = [];
  for (let i = 0; i <= turn; i++) {
    const kk = i < turn ? 4 : k;
    if (kk >= 1) bricks.push({ tone: 'mint', key: 'm' + i, cls: i === turn && kk === 1 ? 'b-drop' : '' });
    if (kk >= 3) bricks.push({ tone: 'coral', shine: true, key: 'c' + i, cls: i === turn && kk === 3 ? 'b-drop' : '' });
  }
  if (n >= 8) bricks.push({ tone: 'yellow', key: 'cap', cls: n === 8 ? 'b-drop' : '' });
  const ghost = n < 8 ? [{ tone: k === 0 || k === 1 ? 'mint' : 'coral', ghost: true, key: 'g' }] : [];
  const guess = k === 0 && n < 8;
  const showMe = (k >= 2 && n < 8) || (turn === 1 && k === 0 && n < 8);
  const meText = k >= 3 || (turn === 1 && k === 0) ? (turn === 1 && k === 0 ? LIVE[0].me : L.me) : null;
  return (
    <div className="lp-live" aria-label="대화 화면 미리 보기: 상대 말을 듣고 뜻을 맞히면 민트 브릭, 대답을 고르면 코랄 브릭이 쌓여요" role="img">
      <div className="tk-chat lp-live-chat">
        {turn === 1 && k === 0 && n < 8 && (
          <div className="tk-row me" key={'pm' + n}>
            <div className="tk-b me"><div className="tk-main">{LIVE[0].me}</div></div>
            <Face kind="me" size={40} />
          </div>
        )}
        {n < 8 ? (
          <div className="tk-row them" key={'t' + turn}>
            <Face kind="office" size={40} talking={guess} />
            <div className={'tk-b them' + (guess ? ' guess' : '')}>
              {k >= 2 ? (
                <>
                  <div className="tk-main">{L.them.mean}</div>
                  <div className="tk-sub">{L.them.ko}</div>
                </>
              ) : (
                <>
                  <div className="tk-main">{L.them.ko}</div>
                  <div className="ja">{L.them.ja}</div>
                  {k === 1 && <div className="tk-mean fade-up">{L.them.mean}</div>}
                </>
              )}
              {guess && <span className="tk-q">?</span>}
            </div>
          </div>
        ) : (
          <div className="tk-row them" key="end">
            <Face kind="office" size={40} />
            <div className="tk-b them"><div className="tk-main">대화 하나 완성!</div><div className="tk-sub">브릭 4개 + 꼭대기 1개</div></div>
          </div>
        )}
        {showMe && !(turn === 1 && k === 0) && (
          <div className="tk-row me" key={'me' + turn}>
            <div className={'tk-b me' + (meText == null ? ' ask' : '')}>
              {meText == null ? <span className="tk-ask">?</span> : <div className="tk-main">{meText}</div>}
            </div>
            <Face kind="me" size={40} />
          </div>
        )}
      </div>
      <div className="lp-live-stage plate">
        <div style={{ position: 'absolute', left: '50%', top: 0, marginLeft: -(LIVE_SIZE.pitch * 2 + 14) }}>
          <Stack bricks={[...bricks, ...ghost]} size={LIVE_SIZE} x0={20} baseY={176} height={190} width={160} plate={6} />
        </div>
        <span className="lp-live-say" key={'s' + n}>{k === 0 && n < 8 ? '무슨 뜻일까요?' : k === 1 && n < 8 ? '딸깍! 알아들었어요' : k === 2 && n < 8 ? '하고 싶은 대답을 골라요' : k === 3 && n < 8 ? '딸깍! 딱 맞아요' : ''}</span>
      </div>
    </div>
  );
}

/** 처음 안내 6장을 아래로 쭉: 화면에 들어올 때마다 그림이 다시 움직여요 */
function IntroRow({ s, i }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return setSeen(1);
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setSeen((x) => x + 1)), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className={'lp-intro-row' + (i % 2 ? ' flip' : '')} ref={ref}>
      <div className="lp-intro-art">
        {seen > 0 && <div key={seen} style={{ lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: s.art }} />}
      </div>
      <div className="lp-intro-txt">
        <h3>{s.t}</h3>
        <p>{s.b}</p>
      </div>
    </div>
  );
}

/** 설명 팝업 세 개를 여는 작은 브릭 버튼 (소개 웹 "베타로 시작하기" 아래 · 홈) */
export function HelpBricks({ onOpen }) {
  return (
    <div className="hb-row" role="group" aria-label="설명 보기">
      <button className="ob-btn sm hb-btn hb-talk" onClick={() => onOpen('talk')}><span className="t">사용 방법</span></button>
      <button className="ob-btn sm hb-btn hb-review" onClick={() => onOpen('review')}><span className="t">복습 방법</span></button>
      <button className="ob-btn sm hb-btn hb-tower" onClick={() => onOpen('tower')}><span className="t">내 탑과 순위</span></button>
    </div>
  );
}

const TOPICS = ['#자기소개', '#여행', '#음식·술', '#고향', '#일', '#가족', '#연애', '#취미', '#고민'];

export default function Landing() {
  const nav = useNavigate();
  const [pop, setPop] = useState(null); // 'talk' | 'review' | 'tower'
  const st = useStore();
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
            {st.user ? (
              <button className="ob-btn sm coral lp-headbtn" onClick={start}><span className="t">학습하러 가기</span></button>
            ) : (
              <>
                <Link className="ob-btn sm lp-headbtn" to="/login"><span className="t">로그인</span></Link>
                <button className="ob-btn sm coral lp-headbtn" onClick={start}><span className="t">베타로 시작</span></button>
              </>
            )}
          </nav>
        </header>

        <section className="lp-hero lp-hero-grid">
          <div className="lp-hero-top">
            <h1 className="lp-h1">Hear it. Say it.<br />No reading required.</h1>
            <p className="lp-sub">듣고, 말하고, 읽기 공부는 생략.</p>
          </div>
          <LiveTalk />
          <div className="lp-hero-bottom">
            <p className="lp-p" style={{ maxWidth: 520, fontSize: 17 }}>일본 여행에서 옆자리 사람이 말을 걸어올 때. 다 알아듣지 못해도 괜찮아요. 들리는 단어로 뜻을 맞히고, 하고 싶은 대답을 골라 쌓으면서 스몰토크를 이어 가요.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginTop: 26 }}>
              <button className="ob-btn coral" style={{ minWidth: 240 }} onClick={start}><span className="t">{st.user ? '학습하러 가기' : '베타로 시작하기'}</span><span className="s">{st.user ? `${st.user.nickname || ''} 님, 이어서 해요` : '무료 · 가입 없이 바로'}</span></button>
              {!st.user && <Link to="/login" style={{ fontSize: 15, fontWeight: 500, textUnderlineOffset: 3 }}>이미 계정이 있어요 · 로그인</Link>}
            </div>
            <HelpBricks onOpen={setPop} />
            <p className="small muted" style={{ marginTop: 22, fontSize: 13, lineHeight: 1.6 }}>휴대폰 브라우저에서 oracyblock.com을 열고 홈 화면에 추가하면 앱처럼 쓸 수 있어요. 지금은 일본어부터, 영어와 중국어는 준비 중이에요.</p>
          </div>
        </section>

        <section className="lp-sec lp-intro">
          {INTRO.map((x, i) => <IntroRow key={x.t} s={x} i={i} />)}
        </section>

        <section className="lp-sec">
          <h2 className="lp-h2">옆자리에서 시작하는 이야기</h2>
          <p className="lp-p">메뉴판은 사진 번역 앱이나 AI에 맡기고, 우리는 옆에 앉은 사람과의 대화를 연습해요. 글자를 외우거나 읽는 시험은 없어요. 상대 말은 한글 발음으로 보여 드려요.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 12px', marginTop: 24 }}>
            {[...new Set(GAME_TALKS.map((t) => t.place))].map((place, i) => <span key={place} className="lp-chip" style={{ background: ['#29B6A5', '#FF7967', '#FFC857', '#FFFFFF'][i % 4] }}>{place}</span>)}
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
          <span style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}><Link to="/terms">이용약관</Link><Link to="/privacy">개인정보 처리방침</Link><button className="link-btn" style={{ padding: 0, minHeight: 0, fontSize: 13, color: '#4A566B' }} onClick={openContact}>문의하기</button></span>
          <span>같은 브릭 가족 <a href="https://asmrblock.com">ASMR Block</a></span>
        </footer>
      </div>
      <Tabs className="lp-tabs" />
      {pop === 'talk' && <Guide slides={TALK_SLIDES} label="사용 방법" doneLabel="직접 해 보기" skipLabel="닫기" onSkip={() => setPop(null)} onDone={() => { setPop(null); start(); }} />}
      {pop === 'review' && <Guide slides={REVIEW_SLIDES} label="복습 방법" doneLabel="알겠어요" skipLabel="닫기" onDone={() => setPop(null)} />}
      {pop === 'tower' && <Guide slides={TOWER_SLIDES} label="내 탑과 순위" doneLabel="알겠어요" skipLabel="닫기" onDone={() => setPop(null)} />}
    </div>
  );
}
