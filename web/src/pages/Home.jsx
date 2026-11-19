// 내 여행 판: 장소 고르기 · 레벨 · 게임 방법
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { talksAtLevel, READY_LEVELS, ALL_LEVELS, LEVEL_DESC, LEVEL_SCALE, dailyCognate } from '../content/build.js';
import { quiet } from '../lib/api.js';
import { store, useStore } from '../lib/store.js';
import { countCorrect, tooHard, latestByTalk, parseBricks } from '../lib/progress.js';
import { speak, unlock } from '../lib/speech.js';
import Brick from '../components/Brick.jsx';
import { Logo, Question, Sheet, Stack, Play } from '../components/ui.jsx';
import { Guide, GAME } from '../components/Guides.jsx';

const MINI = { studs: 4, pitch: 9, h: 11, depth: 6, studH: 3 };
const LV_TONE = ['#29B6A5', '#FF7967', '#FFC857', '#6BB8E8', '#A792E0'];

export default function Home() {
  const st = useStore();
  const nav = useNavigate();
  const [prog, setProg] = useState(null);
  const [lvOpen, setLvOpen] = useState(false);
  const [guide, setGuide] = useState(!st.seenGame && st.seenIntro);
  const level = st.level;

  useEffect(() => {
    quiet('/progress').then((p) => p && setProg(p));
  }, [st.user?.id]);
  useEffect(() => {
    if (st.seenIntro && !st.seenGame) setGuide(true);
  }, [st.seenIntro, st.seenGame]);

  const plays = prog?.plays || [];
  const talks = talksAtLevel(level);
  const latest = latestByTalk(plays.filter((p) => p.level === level));
  const correct = countCorrect(plays, level);
  const hard = tooHard(plays, level);
  const maxReady = Math.max(...READY_LEVELS);
  const next = talks.find((t) => !latest.has(t.id)) || talks.find((t) => latest.get(t.id)?.crooked) || talks[0];
  const cog = dailyCognate();
  const doneCount = talks.filter((t) => latest.has(t.id)).length;
  const rec = hard && level > 1 ? level - 1 : correct >= 3 && level < maxReady ? level + 1 : null;

  const progressText = correct >= 3
    ? (level < maxReady ? `올바른 탑 3개 완성 · Lv${level + 1}를 추천해요` : '올바른 탑 3개 완성 · 다음 레벨은 준비 중이에요')
    : level < maxReady ? `올바른 탑 ${correct}/3 · ${3 - correct}개 더 쌓으면 Lv${level + 1} 추천` : `올바른 탑 ${correct}/3`;

  const start = (id) => {
    unlock();
    nav('/talk/' + id);
  };
  const setLevel = (n) => {
    store.set({ level: n });
    if (st.user) quiet('/me', { method: 'PUT', body: { level: n } });
    setLvOpen(false);
  };

  return (
    <div className="page has-tabs">
      <div className="top-row">
        <Logo />
        <button className="icon-btn" onClick={() => setGuide(true)} aria-label="게임 방법 보기"><Question /></button>
      </div>
      <div className="title-row">
        <h1>내 여행 판</h1>
        <span className="small muted">완성 {doneCount}곳 · 남은 곳 {talks.length - doneCount}곳</span>
      </div>

      <div className="card strong lv-card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52 }}>
          <span className="small muted" style={{ fontSize: 11 }}>지금 레벨</span>
          <span style={{ fontFamily: 'var(--display)', fontSize: 28, lineHeight: 1 }}>Lv{level}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 5 }} aria-label={`올바르게 쌓은 탑 ${Math.min(correct, 3)}개 중 3개`} role="img">
            {[0, 1, 2].map((i) => {
              const on = i < correct;
              const sw = { strokeWidth: 1.6, strokeDasharray: on ? undefined : '3 2' };
              const s = on ? '#24324A' : '#9AA3B2';
              return (
                <svg key={i} width="24" height="26" viewBox="0 0 24 26" aria-hidden="true">
                  <rect x="5" y="2" width="5" height="4" rx="1" fill={on ? '#FF7967' : 'none'} stroke={s} style={sw} />
                  <rect x="14" y="2" width="5" height="4" rx="1" fill={on ? '#FF7967' : 'none'} stroke={s} style={sw} />
                  <rect x="2" y="6" width="20" height="9" rx="2" fill={on ? '#FF7967' : 'none'} stroke={s} style={sw} />
                  <rect x="2" y="15" width="20" height="9" rx="2" fill={on ? '#29B6A5' : 'none'} stroke={s} style={sw} />
                </svg>
              );
            })}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.35, marginTop: 2 }}>{progressText}</div>
        </div>
        <button className="ob-btn sm" onClick={() => setLvOpen(true)}><span style={{ fontSize: 13, fontWeight: 700 }}>바꾸기</span></button>
      </div>
      {rec && (
        <button className="note" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setLvOpen(true)}>
          {rec < level ? '최근 튕겨 나간 브릭이 많아요. 한 단계 내려가 볼까요?' : `Lv${rec} 해 볼래요?`} <u>레벨 고르기</u>
        </button>
      )}

      <div className="plate">
        <div className="spots">
          {talks.map((t) => {
            const p = latest.get(t.id);
            const bricks = p ? parseBricks(p.bricks) : [{ tone: 'mint', ghost: true }];
            const now = next && t.id === next.id && !p;
            const status = p ? (p.crooked ? '완성 · 비뚤어진 곳' : '완성 · 올바른 탑') : now ? '다음 차례' : '아직';
            const color = p ? (p.crooked ? '#8A5A1A' : '#1B776C') : now ? '#B9473A' : '#4A566B';
            const show = bricks.slice(-8);
            return (
              <button key={t.id} className={'spot' + (now ? ' now' : '')} onClick={() => start(t.id)} aria-label={`${t.place}, ${status}`}>
                <Stack bricks={show} size={MINI} x0={28} baseY={96} height={100} width={98} />
                <span className="spot-name">{t.place}</span>
                <span className="spot-st" style={{ color, fontWeight: p || now ? 700 : 400 }}>{status}</span>
              </button>
            );
          })}
        </div>
      </div>

      {next && (
        <button className="ob-btn coral wide" style={{ minHeight: 62, marginTop: 12 }} onClick={() => start(next.id)}>
          <span className="t">{next.place} {latest.has(next.id) ? '다시 하기' : '시작하기'}</span>
          <span className="s">Lv{level} · {next.partner}와 대화</span>
        </button>
      )}

      <div className="home-cards">
        <Link className="mini-card" to="/fix">
          <span style={{ fontFamily: 'var(--display)', fontSize: 17 }}>고치기 · 복습</span>
          <span className="small">복습할 단어 {prog?.wordsDue ?? 0}개 · 고칠 곳 {prog?.fixesOpen ?? 0}개</span>
          {(prog?.wordsDue || prog?.fixesOpen) ? <span className="small" style={{ color: '#B9473A', fontWeight: 700 }}>오늘 할 차례예요</span> : <span className="small muted">대화를 하면 생겨요</span>}
        </Link>
        <button className="mini-card" onClick={() => { unlock(); speak(cog.say, 0.85); }} aria-label={`오늘의 닮은 단어, ${cog.ko}, ${cog.like}, 들어 보기`}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 17 }}>오늘의 닮은 단어</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: 'var(--display)', fontSize: 21, lineHeight: 1.1 }}>{cog.ko}</span>
              <span className="small">≈ {cog.like}</span>
            </span>
            <span className="play-dot"><Play size={13} /></span>
          </span>
        </button>
      </div>

      {lvOpen && (
        <Sheet title="레벨 고르기" onClose={() => setLvOpen(false)} labelId="lv-title">
          <p className={'note' + (hard ? ' warn' : '')} style={{ marginTop: 6 }}>
            {hard ? '최근 튕겨 나간 브릭이 많아요. 한 단계 내려가서 탑을 다시 단단하게 쌓아 볼까요?' : `Lv${level}에서 비뚤어진 브릭 없이 탑을 3개 쌓으면 Lv${level + 1}를 추천해 드려요.`}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {ALL_LEVELS.map((n) => {
              const ready = READY_LEVELS.includes(n);
              const k = LEVEL_SCALE[n];
              const isNow = n === level;
              const tag = isNow ? '지금' : n === rec ? '추천' : !ready ? '준비 중' : '';
              return (
                <button key={n} className={'lv-row' + (isNow ? ' on' : '')} disabled={!ready} onClick={() => setLevel(n)} aria-pressed={isNow}>
                  <span style={{ width: 56, height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', flexShrink: 0 }}>
                    <Brick tone={LV_TONE[n - 1]} studs={4} pitch={12 * k} h={13 * k} depth={7 * k} studH={3} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 19 }}>Lv{n}</b>
                    <span className="small muted" style={{ display: 'block' }}>{LEVEL_DESC[n]}</span>
                  </span>
                  {tag && <span className={'chip' + (isNow ? ' dark' : '')}>{tag}</span>}
                </button>
              );
            })}
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>레벨이 오를수록 말이 빨라지고 문장이 길어져요. 브릭은 얇아져요. 언제든 바꿀 수 있어요.</p>
        </Sheet>
      )}
      {guide && <Guide slides={GAME} label="게임 방법" doneLabel="알겠어요" skipLabel="닫기" onDone={() => { setGuide(false); store.set({ seenGame: true }); }} />}
    </div>
  );
}
