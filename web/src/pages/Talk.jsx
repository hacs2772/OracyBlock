// 대화 화면: 상대 말 뜻 맞히기 → 내 차례(말하기 → 쓰기 → 고르기) → 대화 끝
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { talkById, judge, talkWords, LEVEL_SCALE, LEVEL_RATE, RESCUE_LINES, ASK_AGAIN, READY_LEVELS } from '../content/build.js';
import { speak, stopSpeaking, listen, stopListening, canListen, MIC_ERRORS, sfx, unlock } from '../lib/speech.js';
import { api, quiet } from '../lib/api.js';
import { store, useStore } from '../lib/store.js';
import Brick from '../components/Brick.jsx';
import { Stack, Play, Close, Mic, Refresh, Ja, Sheet, Question } from '../components/ui.jsx';
import { Guide, GAME } from '../components/Guides.jsx';
import { countCorrect } from '../lib/progress.js';
import { loadResume, saveResume, clearResume } from '../lib/resume.js';

const STAGE_TONE = { speak: 'coral', write: 'sky', choose: 'stone' };

/** 받침에 맞게 "은/는", "이에요/예요" 고르기 */
export function josa(w, withB, withoutB) {
  const s = String(w || '').trim();
  const c = s.charCodeAt(s.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 ? withB : withoutB;
}

/** 튕기거나 못 알아들었을 때: "이 단어를 넣어 대답해 보세요" (대답마다 첫 단어, 크게 + 소리) */
function TryWords({ step }) {
  const seen = new Set();
  const words = step.options.map((o) => o.words[0]).filter((w) => !seen.has(w.key) && seen.add(w.key));
  return (
    <>
      <div className="small" style={{ fontWeight: 700 }}>이 단어를 넣어 대답해 보세요</div>
      {words.map((w) => <BigWord key={w.key} w={w} />)}
    </>
  );
}

function sizeFor(level, n) {
  const k = LEVEL_SCALE[level] || 1;
  const h = Math.max(11, Math.min(Math.round(22 * k), Math.floor(160 / Math.max(1, n))));
  return { studs: 4, pitch: Math.round(h * 0.95), h, depth: Math.round(h * 0.5), studH: Math.max(3, Math.round(h * 0.24)) };
}

function WordChip({ w, missed }) {
  return (
    <button className="word-chip" onClick={() => speak(w.say, 0.85)} aria-label={`${w.ko}, ${w.mean}, 들어 보기`}>
      <span className="play-dot sm"><Play size={10} /></span>
      <span style={{ minWidth: 0 }}>
        <span className="w">{w.ko}</span>
        <span className="m">{w.mean}</span>
      </span>
      {missed && <span className="miss-tag">놓친 단어</span>}
    </button>
  );
}

function BigWord({ w }) {
  return (
    <div className="word-big">
      <button className="icon-btn" style={{ width: 46, height: 46 }} onClick={() => speak(w.say, 0.8)} aria-label={`${w.ko} 들어 보기`}>
        <span className="play-dot" style={{ width: 40, height: 40 }}><Play size={14} /></span>
      </button>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span className="w">{w.ko}</span>
          <Ja>{w.variants?.[w.variants.length - 1] || w.say}</Ja>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{w.mean}</div>
      </div>
    </div>
  );
}

export default function Talk() {
  const { id } = useParams();
  const nav = useNavigate();
  const st = useStore();
  const talk = useMemo(() => talkById(id), [id]);
  const level = talk?.level || 1;
  const rate = LEVEL_RATE[level] || 1;

  const [si, setSi] = useState(0); // 몇 번째 차례
  const [bricks, setBricks] = useState([]);
  const [mover, setMover] = useState(null); // 튕겨 나가는 브릭
  const [ph, setPh] = useState({}); // 이번 차례 상태
  const [done, setDone] = useState(false);
  const stats = useRef({ bounces: 0, hints: 0, speakN: 0, writeN: 0, chooseN: 0, okN: 0, nearN: 0, rescueN: 0, missed: new Map(), fixes: [] });
  const playId = useRef(null);
  const timers = useRef([]);
  const later = (ms, fn) => timers.current.push(setTimeout(fn, ms));
  const [levelUp, setLevelUp] = useState(null);
  const [capNote, setCapNote] = useState(null);
  const [resumeAsk, setResumeAsk] = useState(() => loadResume(id)); // 중간에 나갔던 대화면 이어 할지 물어봐요
  const [needTap, setNeedTap] = useState(false); // 아이폰처럼 소리가 저절로 안 나면 "눌러서 들어 보세요"
  const [help, setHelp] = useState(false); // ? → 게임 방법 다시 보기

  const newPlay = () => {
    playId.current = null;
    api('/plays', { method: 'POST', body: { talkId: talk.id, level } })
      .then((r) => { playId.current = r?.id || null; })
      .catch(() => {});
  };
  const resume = () => {
    const r = resumeAsk;
    playId.current = r.playId || null;
    stats.current = { ...r.stats, missed: new Map((r.stats.missed || []).map((w) => [w.key, w])) };
    setBricks(r.bricks.map((b, i) => ({ ...b, cls: '', key: i })));
    setResumeAsk(null);
    setSi(r.si);
    if (!r.playId) newPlay();
  };
  const restart = () => {
    clearResume(talk.id);
    setResumeAsk(null);
    newPlay();
    later(300, () => speak(talk.steps[0].line.ja, rate));
  };

  useEffect(() => {
    if (!talk) return undefined;
    if (!resumeAsk) newPlay();
    return () => {
      timers.current.forEach(clearTimeout);
      stopSpeaking();
      stopListening();
    };
  }, [talk, level]);

  const step = talk?.steps[si];
  const steps = talk?.steps || [];
  const size = sizeFor(level, steps.length + 1);

  // 차례가 바뀔 때마다 이 기기에 기억해 둬요 (나갔다 와도 이어 하기)
  useEffect(() => {
    if (!talk || done || resumeAsk || si === 0) return;
    const s = stats.current;
    saveResume(talk.id, {
      playId: playId.current,
      si,
      bricks: bricks.map((b) => ({ tone: b.tone, shine: b.shine, tilt: b.tilt, missing: b.missing })),
      stats: { ...s, missed: [...s.missed.values()] },
    });
  }, [si]); // eslint-disable-line react-hooks/exhaustive-deps

  // 새 차례가 되면 상대 말을 들려줘요
  useEffect(() => {
    if (!step || done || resumeAsk) return;
    setNeedTap(false);
    if (step.type === 'them') {
      setPh({ set: 0, wrong: 0, hint: false, solved: false, fb: '', shake: -1, n: 0 });
      later(350, () => speak(step.line.ja, rate));
      // 아이폰은 누르지 않으면 소리가 안 날 때가 있어요 → 듣기 버튼을 반짝
      later(900, () => {
        const sy = window.speechSynthesis;
        if (sy && !sy.speaking && !sy.pending) setNeedTap(true);
      });
    } else {
      setPh({ hint: false, hintUsed: false, result: null, fb: '', shake: -1, n: 0, wrong: 0 });
    }
  }, [si, done, resumeAsk]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!talk) {
    return (
      <div className="page">
        <p>대화를 찾지 못했어요.</p>
        <Link to="/" className="ob-btn"><span className="t">학습으로</span></Link>
      </div>
    );
  }

  const partner = talk.partner;
  const prevThem = step?.type === 'me' ? steps[si - 1] : null;
  const shownLine = step?.type === 'them' ? step.line : prevThem?.line;
  const showMean = step?.type === 'me' || ph.solved;

  const place = (brick) => {
    setBricks((b) => [...b, { ...brick, cls: brick.tilt ? 'b-tilt' : 'b-drop', key: b.length }]);
    sfx(brick.tilt ? 'tilt' : 'snap', 0.3);
  };
  const fly = (tone, shine) => {
    setMover({ tone, shine, n: Date.now() });
    sfx('bounce', 0.3);
    stats.current.bounces++;
    later(950, () => setMover(null));
  };

  // ---------- 상대 말: 뜻 맞히기 ----------
  const pickMeaning = (m, i) => {
    if (ph.solved) return;
    if (m === step.line.mean) {
      const missed = ph.wrong > 0;
      if (missed) step.keys.forEach((w) => stats.current.missed.set(w.key, w));
      if (missed) stats.current.fixes.push({ turnIdx: step.idx, kind: 'hole', prev: '' });
      if (ph.hint) stats.current.hints++;
      place({ tone: 'mint', tilt: ph.hint, missing: missed ? '1' : '' });
      setPh({ ...ph, solved: true, fb: '' });
    } else {
      fly('mint', false);
      setPh({ ...ph, wrong: ph.wrong + 1, shake: i, n: ph.n + 1, fb: '퉁! 튕겨 나갔어요. 한 번 더 들어 보세요.' });
      later(1000, () => speak(step.line.ja, rate * 0.8));
    }
  };
  const refreshMeaning = () => {
    if (ph.solved) return;
    if (ph.set === step.answerSet) {
      setPh({ ...ph, wrong: ph.wrong + 1, shake: 99, n: ph.n + 1, fb: '이 4개 안에 있어요! 다시 들어 보세요.' });
      sfx('thud');
      return;
    }
    setPh({ ...ph, set: ph.set ? 0 : 1, fb: '', shake: -1 });
  };

  // ---------- 내 차례: 하고 싶은 대답을 골라요 (말하기·글자 입력은 뺐어요, concept 11-5) ----------
  const pickAnswer = (o, i) => {
    const r = ph.result;
    const fixing = r?.kind === 'near' && r.placed;
    if (r?.placed && !fixing) return;
    if (o.kind === 'ok') {
      if (fixing) {
        // 비뚤어진 브릭을 다시 골라 바로 세우기
        setBricks((b) => b.map((x, j) => (j === b.length - 1 ? { ...x, tilt: false, cls: 'b-stand' } : x)));
        sfx('snap');
        setPh({ ...ph, result: { kind: 'fixed', option: o.option, picked: o.ko, placed: true }, fb: '' });
        return;
      }
      stats.current.chooseN++;
      stats.current.okN++;
      if (ph.hintUsed) stats.current.hints++;
      place({ tone: 'coral', shine: true, tilt: !!ph.hintUsed });
      setPh({ ...ph, result: { kind: ph.hintUsed ? 'hintok' : 'ok', option: o.option, picked: o.ko, placed: true }, fb: '' });
      return;
    }
    if (o.kind === 'near') {
      if (fixing) {
        sfx('thud');
        setPh({ ...ph, shake: i, n: ph.n + 1, fb: '이것도 살짝 어색해요. 다른 대답을 골라 보세요.' });
        return;
      }
      stats.current.chooseN++;
      stats.current.nearN++;
      place({ tone: 'coral', shine: true, tilt: true });
      setPh({ ...ph, result: { kind: 'near', near: o.near, picked: o.ko, placed: true }, fb: '' });
      return;
    }
    if (fixing) {
      sfx('thud');
      setPh({ ...ph, shake: i, n: ph.n + 1, fb: '이 대답은 안 맞아요. 다른 걸 골라 보세요.' });
      return;
    }
    fly('coral', true);
    const wrong = (ph.wrong || 0) + 1;
    setPh({ ...ph, wrong, shake: i, n: ph.n + 1, fb: wrong >= 2 ? '퉁! 아래 단어가 들어간 대답을 골라 보세요.' : '퉁! 이 대답은 튕겨 나가요. 다른 걸 골라 보세요.' });
  };

  const goNext = () => {
    stopSpeaking();
    if (step.type === 'me') {
      const opt = ph.result?.option != null ? step.options[ph.result.option] : null;
      if (opt?.react && !ph.reacted && ph.result?.kind !== 'near') {
        setPh({ ...ph, reacted: true });
        speak(opt.react.ja, rate);
        return;
      }
      const last = bricks[bricks.length - 1];
      if (last?.tilt) stats.current.fixes.push({ turnIdx: step.idx, kind: 'tilt', prev: ph.result?.picked || '' });
    }
    if (si + 1 >= steps.length) finish();
    else setSi(si + 1);
  };

  const finish = async () => {
    const cap = { tone: 'yellow', cls: 'b-drop', key: 'cap' };
    const finalBricks = [...bricks, cap];
    setBricks(finalBricks);
    sfx('snap', 0.3);
    setDone(true);
    clearResume(talk.id);
    const s = stats.current;
    const words = talkWords(talk);
    const body = {
      crooked: finalBricks.some((b) => b.tilt),
      bounces: s.bounces, hints: s.hints, speakN: s.speakN, writeN: s.writeN, chooseN: s.chooseN, okN: s.okN, nearN: s.nearN, rescueN: s.rescueN,
      bricks: JSON.stringify(finalBricks.map((b) => ({ t: b.tone, s: b.shine ? 1 : 0, k: b.tilt ? 1 : 0, m: b.missing || '' }))),
      words: words.map((w) => ({ key: w.key, ko: w.ko, mean: w.mean, say: w.say, missed: s.missed.has(w.key) })),
      fixes: s.fixes,
    };
    if (playId.current) {
      await quiet(`/plays/${playId.current}/finish`, { method: 'POST', body });
      const prog = await quiet('/progress');
      if (prog) {
        if (prog.finishedToday > prog.dayCap) setCapNote({ cap: prog.dayCap, fast: prog.speed === 'fast' });
        const lv = store.s.level;
        const c = countCorrect(prog.plays, lv);
        if (!body.crooked && level === lv && c >= 3 && lv < Math.max(...READY_LEVELS)) setLevelUp(lv + 1);
      }
    }
  };

  // ---------- 그리기 ----------
  const shownBricks = bricks.map((b) => ({ ...b }));
  const ghost = !done && !mover ? [{ tone: step?.type === 'them' ? 'mint' : 'coral', ghost: true, key: 'ghost' }] : [];
  const stackList = [...shownBricks, ...ghost];
  const baseY = 194;

  const allWords = done ? talkWords(talk) : [];
  const correctNow = done && !bricks.some((b) => b.tilt);

  return (
    <div className="page" style={{ gap: 10 }}>
      <div className="talk-top">
        <Link className="icon-btn" to="/" aria-label="학습으로 나가기"><Close /></Link>
        <div className="ttl">
          {talk.place}
          <div className="small muted" style={{ fontFamily: 'var(--body)' }}>{partner} · {talk.partnerDesc} · Lv{level}</div>
        </div>
        <button className="icon-btn" onClick={() => setHelp(true)} aria-label="게임 방법 보기"><Question /></button>
      </div>
      {help && <Guide slides={GAME} label="게임 방법" doneLabel="알겠어요" skipLabel="닫기" onDone={() => setHelp(false)} />}

      <div className="stage plate" style={{ boxShadow: 'none', padding: 0 }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, marginLeft: -(size.pitch * 2 + 14) }}>
          <Stack bricks={stackList} size={size} x0={20} baseY={baseY} height={210} width={200} plate={6} label={`대화 탑, 브릭 ${bricks.length}개`} />
          {mover && (
            <div key={mover.n} className="b-fly" style={{ position: 'absolute', left: 15, top: baseY - bricks.length * size.h - (5 + size.studH + size.depth + size.h) }}>
              <Brick tone={mover.tone} shine={mover.shine} {...size} />
            </div>
          )}
        </div>
      </div>

      {!done && shownLine && (
        <div className="bubble">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="small muted">{partner}</div>
            {st.settings.kana && (
              <div className="ko">
                {shownLine.ko}
                {(step.type === 'them' ? step.casual : prevThem?.casual) && <span className="tag-casual">반말</span>}
              </div>
            )}
            <Ja>{shownLine.ja}</Ja>
            {showMean && <div className="mean fade-up">{shownLine.mean}</div>}
          </div>
          <button className={'icon-btn' + (needTap ? ' tap-ring' : '')} onClick={() => { unlock(); setNeedTap(false); speak(shownLine.ja, rate); }} aria-label={`${partner} 말 다시 듣기`}>
            <span className="play-dot"><Play /></span>
          </button>
        </div>
      )}
      {!done && needTap && <p className="small" style={{ color: '#B9473A', fontWeight: 700, marginTop: -4 }}>소리가 안 나오면 말풍선의 재생 버튼을 눌러 들어 보세요.</p>}
      {resumeAsk && (
        <Sheet title="이어서 할까요?" onClose={restart} labelId="resume-title">
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 6 }}>지난번에 {partner}와 하던 대화가 있어요. 브릭 {resumeAsk.bricks.length}개를 쌓았어요.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
            <button className="ob-btn coral" onClick={() => { unlock(); resume(); }}><span className="t">이어서 하기</span></button>
            <button className="ob-btn" onClick={() => { unlock(); restart(); }}><span className="t">처음부터</span></button>
          </div>
        </Sheet>
      )}

      {!done && step?.type === 'them' && (
        <ThemPanel step={step} ph={ph} setPh={setPh} partner={partner} rate={rate} pick={pickMeaning} refresh={refreshMeaning} next={() => setSi(si + 1)} onHear={() => setNeedTap(false)} />
      )}

      {!done && step?.type === 'me' && (
        <MePanel step={step} ph={ph} setPh={setPh} partner={partner} pickAnswer={pickAnswer} goNext={goNext} isLast={si + 1 >= steps.length} nextIsThem={steps[si + 1]?.type === 'them'} />
      )}

      {done && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 30 }}>대화 하나 완성!</h1>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              {partner}와 {steps.filter((x) => x.type === 'me').length}번 주고받았어요.{' '}
              {correctNow ? '비뚤어진 브릭 없는 올바른 탑이에요.' : '비뚤어진 곳은 고치기에서 다시 세울 수 있어요.'}
            </p>
          </div>
          {capNote && (
            <div className="note">
              오늘 브릭은 다 쌓았어요 (하루 {capNote.cap}개). 대화 연습과 단어는 그대로 남아요.
              {!capNote.fast && <> 더 빨리 쌓고 싶다면 <Link to="/me"><b>쌓는 속도</b></Link>를 올려 보세요.</>}
            </div>
          )}
          {levelUp && (
            <div className="note">
              Lv{store.s.level}에서 올바른 탑을 3개 쌓았어요. <b>Lv{levelUp}</b> 해 볼래요?
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="ob-btn sm yellow" onClick={() => { store.set({ level: levelUp }); quiet('/me', { method: 'PUT', body: { level: levelUp } }); setLevelUp(null); }}><span className="t">Lv{levelUp} 해 볼래요</span></button>
                <button className="link-btn" onClick={() => setLevelUp(null)}>지금 레벨에서 더 할래요</button>
              </div>
            </div>
          )}
          <div className="card">
            <h2 style={{ fontSize: 19 }}>오늘 대화의 단어</h2>
            <p className="small muted">누르면 들려줘요. 놓친 단어는 고치기에 다시 나와요.</p>
            <div className="word-row" style={{ marginTop: 14 }}>
              {allWords.map((w) => <WordChip key={w.key} w={w} missed={stats.current.missed.has(w.key)} />)}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button className="ob-btn" onClick={() => nav('/fix')}><span className="t">고치기</span></button>
            <button className="ob-btn coral" onClick={() => nav('/')}><span className="t">학습으로</span></button>
          </div>
        </div>
      )}
    </div>
  );
}

function ThemPanel({ step, ph, setPh, partner, rate, pick, refresh, next, onHear }) {
  const opts = step.sets[ph.set || 0] || [];
  if (ph.solved) {
    return (
      <div className="result">
        <h3>{ph.wrong ? '딸깍! 다시 듣고 알아들었어요' : ph.hint ? '툭. 힌트로 알아들었어요' : '딸깍! 알아들었어요'}</h3>
        {ph.wrong > 0 && <p className="small muted">놓친 단어는 구멍 난 돌기로 남아서 고치기에 다시 나와요.</p>}
        {ph.hint && !ph.wrong && <p className="small muted">힌트를 써서 브릭이 살짝 비뚤게 쌓였어요. 다음엔 힌트 없이 해 봐요!</p>}
        <div className="small" style={{ fontWeight: 700 }}>꼭 들어야 할 단어</div>
        {step.keys.map((w) => <BigWord key={w.key} w={w} />)}
        <button className="ob-btn coral" onClick={next}><span className="t">대답하러 가기</span></button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="bubble-tools">
        <button className="pill" onClick={() => { unlock(); onHear(); speak(step.line.ja, rate); }}><span className="play-dot sm"><Play size={10} /></span>듣기</button>
        <button className="pill" onClick={() => { unlock(); onHear(); speak(step.line.ja, rate * 0.7); }}><span className="play-dot sm"><Play size={10} /></span>느리게</button>
        <button className={'pill' + (ph.hint ? ' on' : '')} onClick={() => setPh({ ...ph, hint: true })} aria-expanded={ph.hint}>힌트</button>
      </div>
      {ph.hint ? (
        <div className="hint-box">힌트 단어: {step.keys.map((w) => `${w.ko}(${w.mean})`).join(' · ')}</div>
      ) : (
        <p className="small muted">어려우면 힌트를 눌러 보세요. 쓰면 브릭이 비뚤게 쌓여요.</p>
      )}
      <h2 style={{ fontSize: 21, marginTop: 2 }}>{partner}가 뭐라고 했을까요?</h2>
      {ph.fb && <p className="fb" aria-live="polite">{ph.fb}</p>}
      <div className={'opts' + (ph.shake === 99 ? ' shake-' + (ph.n % 2) : '')}>
        {opts.map((m, i) => (
          <button key={(ph.set || 0) + m} className={'opt mint' + (ph.shake === i ? ' shake-' + (ph.n % 2) : '')} onClick={() => pick(m, i)}>{m}</button>
        ))}
      </div>
      <button className="refresh" onClick={refresh}><Refresh />{ph.set ? '앞 4개 다시 보기' : '여기엔 맞는 뜻이 없어요'}</button>
    </div>
  );
}

function MePanel({ step, ph, setPh, partner, pickAnswer, goNext, isLast, nextIsThem }) {
  const r = ph.result;
  const nextLabel = isLast ? '대화 마무리' : nextIsThem ? `${partner} 말 듣기` : '다음';

  if (r && (r.kind === 'ok' || r.kind === 'hintok' || r.kind === 'fixed')) {
    const opt = r.option != null ? step.options[r.option] : null;
    const title = { ok: '딸깍! 딱 맞아요', hintok: '툭. 뜻을 보고 맞혔어요', fixed: '스르륵, 바로 섰어요' }[r.kind];
    const sub = { ok: '단어가 통했어요.', hintok: '뜻을 봐서 브릭이 살짝 비뚤게 쌓였어요. 다음엔 뜻 없이 골라 봐요!', fixed: '비뚤어진 브릭이 바로 섰어요.' }[r.kind];
    return (
      <div className="result">
        <h3>{title}</h3>
        <p className="small muted">{sub} 내 대답: {r.picked}</p>
        {opt && (
          <>
            <div style={{ padding: '6px 10px', borderRadius: 10, background: '#F4E9D2' }}>
              <div style={{ fontWeight: 700 }}>{opt.natural.ko}</div>
              <Ja>{opt.natural.ja}</Ja>
              <div style={{ fontSize: 13 }}>{opt.natural.mean}</div>
            </div>
            <div className="small" style={{ fontWeight: 700 }}>통한 단어</div>
            {opt.words.filter((w) => w.ko !== '하이').slice(0, 2).map((w) => <BigWord key={w.key} w={w} />)}
          </>
        )}
        {ph.reacted && opt?.react && (
          <div className="bubble">
            <div style={{ flex: 1 }}>
              <div className="ko">{opt.react.ko}</div>
              <Ja>{opt.react.ja}</Ja>
              <div className="mean">{opt.react.mean}</div>
            </div>
          </div>
        )}
        <button className="ob-btn coral" onClick={goNext}><span className="t">{ph.reacted || !opt?.react ? nextLabel : `${partner} 반응 듣기`}</span></button>
      </div>
    );
  }

  const near = r?.kind === 'near' ? r.near : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {near ? (
        <div className="result">
          <h3>툭. 통하긴 했어요</h3>
          <p className="small muted">살짝 어색해서 비뚤게 얹혔어요. 내 대답: {r.picked}</p>
          <p style={{ fontSize: 14, lineHeight: 1.55 }}>{near.why}</p>
          <div className="small" style={{ fontWeight: 700 }}>이 단어로 바꾸면 딱 맞아요</div>
          {near.fix.map((w) => <BigWord key={w.key} w={w} />)}
          <p className="small muted">아래에서 다시 골라 바로 세우거나, 이대로 넘어가도 돼요.</p>
          <button className="link-btn" onClick={goNext}>이대로 {isLast ? '마무리할래요' : '넘어갈래요'}</button>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: 22 }}>{partner}에게 뭐라고 대답할까요?</h2>
          <p className="small muted">하고 싶은 말을 골라요. 맞는 대답이 여러 개일 수 있어요. 재생 버튼으로 소리도 들어 보세요.</p>
        </>
      )}
      {ph.fb && <p className="fb" aria-live="polite">{ph.fb}</p>}
      {ph.wrong >= 2 && !near && <TryWords step={step} />}
      <div className="opts">
        {step.choose.map((o, i) => (
          <div className="opt-row" key={o.ko}>
            <button className={'opt' + (ph.shake === i ? ' shake-' + (ph.n % 2) : '')} onClick={() => pickAnswer(o, i)}>
              <span style={{ display: 'block' }}>
                {o.ko}
                {ph.hint && <span className="small muted" style={{ display: 'block', fontWeight: 400 }}>{o.mean}</span>}
              </span>
            </button>
            <button className="icon-btn" onClick={() => speak(o.ja, 0.9)} aria-label={`${o.ko} 들어 보기`}><span className="play-dot sm"><Play size={10} /></span></button>
          </div>
        ))}
      </div>
      {!near && (
        <button className="link-btn" onClick={() => setPh({ ...ph, hint: !ph.hint, hintUsed: true })} aria-expanded={ph.hint}>
          {ph.hint ? '뜻 숨기기' : '뜻 보기 (보면 브릭이 살짝 비뚤게 쌓여요)'}
        </button>
      )}
    </div>
  );
}

export { WordChip, BigWord };
// 쓰지 않는 값 경고 막기
void RESCUE_LINES;
void ASK_AGAIN;
