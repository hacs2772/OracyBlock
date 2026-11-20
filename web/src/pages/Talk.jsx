// 대화 화면: 상대 말 뜻 맞히기 → 내 차례(말하기 → 쓰기 → 고르기) → 대화 끝
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { talkById, judge, talkWords, LEVEL_SCALE, LEVEL_RATE, RESCUE_LINES, ASK_AGAIN } from '../content/build.js';
import { speak, stopSpeaking, listen, stopListening, canListen, MIC_ERRORS, sfx, unlock } from '../lib/speech.js';
import { api, quiet } from '../lib/api.js';
import { store, useStore } from '../lib/store.js';
import Brick from '../components/Brick.jsx';
import { Stack, Play, Close, Mic, Refresh, Ja } from '../components/ui.jsx';
import { countCorrect } from '../lib/progress.js';

const STAGE_TONE = { speak: 'coral', write: 'sky', choose: 'stone' };

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

  useEffect(() => {
    if (!talk) return undefined;
    api('/plays', { method: 'POST', body: { talkId: talk.id, level } })
      .then((r) => { playId.current = r?.id || null; })
      .catch(() => {});
    return () => {
      timers.current.forEach(clearTimeout);
      stopSpeaking();
      stopListening();
    };
  }, [talk, level]);

  const step = talk?.steps[si];
  const steps = talk?.steps || [];
  const size = sizeFor(level, steps.length + 1);

  // 새 차례가 되면 상대 말을 들려줘요
  useEffect(() => {
    if (!step || done) return;
    if (step.type === 'them') {
      setPh({ set: 0, wrong: 0, hint: false, solved: false, fb: '', shake: -1, n: 0 });
      later(350, () => speak(step.line.ja, rate));
    } else {
      setPh({ view: store.s.settings.quiet || !canListen ? 'write' : 'mic', hint: false, typed: '', set: 0, result: null, listening: false, fb: '', shake: -1, n: 0, micNote: !canListen ? MIC_ERRORS.unsupported : '' });
    }
  }, [si, done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!talk) {
    return (
      <div className="page">
        <p>대화를 찾지 못했어요.</p>
        <Link to="/" className="ob-btn"><span className="t">여행 판으로</span></Link>
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

  // ---------- 내 차례 ----------
  const meResult = (kind, stage, extra = {}) => {
    const hinted = ph.hint && stage !== 'choose';
    const fixing = ph.result?.kind === 'near' && ph.result.placed;
    if (fixing && kind !== 'ok' && kind !== 'near') {
      setPh({ ...ph, listening: false, fb: '아직 안 맞아요. 아래 단어로 다시 해 보세요.' });
      return;
    }
    if (kind === 'ok' || kind === 'near') {
      const tilt = kind === 'near' || hinted;
      if (fixing) {
        // 비뚤어진 브릭을 다시 대답해서 바로 세우기
        if (kind === 'ok' && !hinted) {
          setBricks((b) => b.map((x, i) => (i === b.length - 1 ? { ...x, tilt: false, cls: 'b-stand', tone: STAGE_TONE[stage], shine: stage !== 'choose' } : x)));
          sfx('snap');
          setPh({ ...ph, result: { kind: 'fixed', stage, ...extra }, listening: false, fb: '' });
          return;
        }
        setPh({ ...ph, listening: false, fb: kind === 'near' ? '아직 비뚤어요. 아래 단어로 말해 보세요.' : '힌트를 써서 아직 비뚤어요.' });
        return;
      }
      stats.current[stage + 'N']++;
      stats.current[kind === 'ok' ? 'okN' : 'nearN']++;
      if (hinted) stats.current.hints++;
      place({ tone: STAGE_TONE[stage], shine: stage !== 'choose', tilt });
      setPh({ ...ph, result: { kind: kind === 'ok' && hinted ? 'hintok' : kind, stage, placed: true, ...extra }, listening: false, fb: '' });
      return;
    }
    if (kind === 'rescue') {
      stats.current.rescueN++;
      setPh({ ...ph, listening: false, result: null, typed: '', fb: `괜찮아요. ${partner}가 천천히 다시 말해 줬어요.` });
      later(400, () => speak(prevThem.line.ja, rate * 0.7));
      return;
    }
    if (kind === 'korean') {
      setPh({ ...ph, listening: false, fb: `일본어 소리로 써 보세요. "${extra.word.mean}"은 ${extra.word.ko}예요.` });
      return;
    }
    if (stage === 'speak') {
      setPh({ ...ph, listening: false, result: { kind: 'fail1', stage, ...extra } });
      return;
    }
    if (stage === 'write') {
      fly('sky', true);
      setPh({ ...ph, listening: false, result: { kind: 'off2', stage, ...extra }, typed: '' });
      return;
    }
    fly('stone', false);
    setPh({ ...ph, listening: false, shake: extra.i, n: ph.n + 1, fb: '퉁! 이 대답은 튕겨 나가요. 다시 골라 보세요.' });
  };

  const micTap = async () => {
    unlock();
    if (ph.listening) {
      stopListening();
      return;
    }
    setPh((p) => ({ ...p, listening: true, fb: '', result: p.result?.kind === 'near' ? p.result : null }));
    try {
      const heard = await listen();
      const r = judge(step, { heard });
      meResult(r.kind, 'speak', { heard: heard[0], option: r.option, near: r.near, words: r.words });
    } catch (e) {
      setPh((p) => ({ ...p, listening: false, result: p.result?.kind === 'near' ? p.result : { kind: 'fail1', stage: 'speak', micErr: MIC_ERRORS[e?.code] || '' } }));
    }
  };
  const submitTyped = () => {
    const r = judge(step, { typed: ph.typed });
    if (r.kind === 'none') {
      setPh({ ...ph, fb: '한글 발음으로 써 주세요. 예: ' + step.hintWords[0].ko });
      return;
    }
    meResult(r.kind, 'write', { typed: ph.typed, option: r.option, near: r.near, words: r.words, word: r.word });
  };
  const pickAnswer = (o, i) => {
    if (ph.result?.placed && ph.result.kind !== 'near') return;
    if (o.kind === 'ok') meResult('ok', 'choose', { option: o.option, picked: o.ko });
    else if (o.kind === 'near') meResult('near', 'choose', { near: o.near, picked: o.ko });
    else meResult('off', 'choose', { i });
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
      if (last?.tilt) stats.current.fixes.push({ turnIdx: step.idx, kind: 'tilt', prev: ph.result?.heard || ph.result?.typed || ph.result?.picked || '' });
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
        if (!body.crooked && level === lv && c >= 3 && lv < 2) setLevelUp(lv + 1);
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
        <Link className="icon-btn" to="/" aria-label="여행 판으로 나가기"><Close /></Link>
        <div className="ttl">
          {talk.place}
          <div className="small muted" style={{ fontFamily: 'var(--body)' }}>{partner} · {talk.partnerDesc} · Lv{level}</div>
        </div>
        <span style={{ width: 44 }} aria-hidden="true" />
      </div>

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
          <button className="icon-btn" onClick={() => { unlock(); speak(shownLine.ja, rate); }} aria-label={`${partner} 말 다시 듣기`}>
            <span className="play-dot"><Play /></span>
          </button>
        </div>
      )}

      {!done && step?.type === 'them' && (
        <ThemPanel step={step} ph={ph} setPh={setPh} partner={partner} rate={rate} pick={pickMeaning} refresh={refreshMeaning} next={() => setSi(si + 1)} />
      )}

      {!done && step?.type === 'me' && (
        <MePanel step={step} ph={ph} setPh={setPh} partner={partner} micTap={micTap} submitTyped={submitTyped} pickAnswer={pickAnswer} goNext={goNext} isLast={si + 1 >= steps.length} nextIsThem={steps[si + 1]?.type === 'them'} />
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
            <button className="ob-btn coral" onClick={() => nav('/')}><span className="t">여행 판으로</span></button>
          </div>
        </div>
      )}
    </div>
  );
}

function ThemPanel({ step, ph, setPh, partner, rate, pick, refresh, next }) {
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
        <button className="pill" onClick={() => { unlock(); speak(step.line.ja, rate); }}><span className="play-dot sm"><Play size={10} /></span>듣기</button>
        <button className="pill" onClick={() => { unlock(); speak(step.line.ja, rate * 0.7); }}><span className="play-dot sm"><Play size={10} /></span>느리게</button>
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

function MePanel({ step, ph, setPh, partner, micTap, submitTyped, pickAnswer, goNext, isLast, nextIsThem }) {
  const r = ph.result;
  const nextLabel = isLast ? '대화 마무리' : nextIsThem ? `${partner} 말 듣기` : '다음';
  const hintRow = (
    <>
      <button className="link-btn" onClick={() => setPh({ ...ph, hint: !ph.hint })} aria-expanded={ph.hint}>{ph.hint ? '힌트 닫기' : '힌트 보기 (쓰면 비뚤게 쌓여요)'}</button>
      {ph.hint && <div className="hint-box">힌트 단어: {step.hintWords.map((w) => w.ko).join(' · ')}</div>}
    </>
  );

  if (r && (r.kind === 'ok' || r.kind === 'hintok' || r.kind === 'near' || r.kind === 'fixed')) {
    const opt = r.option != null ? step.options[r.option] : null;
    const near = r.near;
    const title = { ok: '딸깍! 딱 맞아요', hintok: '툭. 힌트로 맞혔어요', near: r.stage === 'write' ? '애매한 대답이에요' : '툭. 통하긴 했어요', fixed: '스르륵, 바로 섰어요' }[r.kind];
    const sub = {
      ok: r.stage === 'choose' ? '골라서 대답하면 돌 브릭이 쌓여요. 다음엔 말로 해 봐요.' : '단어가 통했어요.',
      hintok: '다음엔 힌트 없이 해 봐요!',
      near: '살짝 어긋나서 비뚤게 얹혔어요.',
      fixed: '비뚤어진 브릭이 바로 섰어요.',
    }[r.kind];
    const said = r.heard || r.typed || r.picked;
    return (
      <div className="result">
        <h3>{title}</h3>
        <p className="small muted">{sub}{said ? ` 내 대답: ${said}` : ''}</p>
        {r.kind === 'near' && near && (
          <>
            <p style={{ fontSize: 14, lineHeight: 1.55 }}>{near.why}</p>
            <div className="small" style={{ fontWeight: 700 }}>이 단어로 바꾸면 딱 맞아요</div>
            {near.fix.map((w) => <BigWord key={w.key} w={w} />)}
            {ph.fb && <p className="fb">{ph.fb}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {canListen && <button className="ob-btn sm coral row" onClick={micTap}><Mic size={18} /><span className={'t' + (ph.listening ? ' pulse' : '')}>{ph.listening ? '듣고 있어요' : '다시 말해서 세우기'}</span></button>}
              <button className="ob-btn sm" onClick={() => setPh({ ...ph, view: 'write', fixMode: true })}><span className="t">써서 세우기</span></button>
            </div>
            {ph.fixMode && (
              <div style={{ display: 'flex', gap: 8 }}>
                <label className="sr-only" htmlFor="fix-type">한글 발음으로 쓰기</label>
                <input id="fix-type" className="type-input" value={ph.typed} onChange={(e) => setPh({ ...ph, typed: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && submitTyped()} placeholder={'예: ' + near.fix[0].ko} autoComplete="off" />
                <button className="ob-btn sm" style={{ marginTop: 0, minHeight: 50 }} onClick={submitTyped}><span className="t">세우기</span></button>
              </div>
            )}
            <button className="link-btn" onClick={goNext}>이대로 {isLast ? '마무리할래요' : '넘어갈래요'}</button>
          </>
        )}
        {r.kind !== 'near' && opt && (
          <>
            <div style={{ padding: '6px 10px', borderRadius: 10, background: '#F4E9D2' }}>
              <div style={{ fontWeight: 700 }}>{opt.natural.ko}</div>
              <Ja>{opt.natural.ja}</Ja>
              <div style={{ fontSize: 13 }}>{opt.natural.mean}</div>
            </div>
            <div className="small" style={{ fontWeight: 700 }}>통한 단어</div>
            {opt.words.slice(0, 2).map((w) => <BigWord key={w.key} w={w} />)}
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
        {r.kind !== 'near' && <button className="ob-btn coral" onClick={goNext}><span className="t">{ph.reacted || !opt?.react ? nextLabel : `${partner} 반응 듣기`}</span></button>}
      </div>
    );
  }

  if (r?.kind === 'fail1') {
    return (
      <div className="result">
        <h3>잘 못 알아들었어요</h3>
        <p className="small muted">{r.micErr || (r.heard ? `들린 말: ${r.heard}` : '소리가 잘 안 들렸어요.')} 튕기지는 않아요.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {canListen && <button className="ob-btn sm coral" onClick={() => { setPh({ ...ph, result: null }); }}><span className="t">다시 말하기</span></button>}
          <button className="ob-btn sm" onClick={() => setPh({ ...ph, result: null, view: 'write' })}><span className="t">글자로 대답</span></button>
          <button className="ob-btn sm" onClick={() => setPh({ ...ph, result: null, view: 'choose' })}><span className="t">골라서 대답</span></button>
        </div>
      </div>
    );
  }
  if (r?.kind === 'off2') {
    return (
      <div className="result">
        <h3>퉁! 튕겨 나갔어요</h3>
        <p className="small muted">"{r.typed}"은 {partner}의 말과 안 맞아요. 다시 써 보거나 골라서 대답해요.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button className="ob-btn sm coral" onClick={() => setPh({ ...ph, result: null })}><span className="t">다시 쓰기</span></button>
          <button className="ob-btn sm" onClick={() => setPh({ ...ph, result: null, view: 'choose' })}><span className="t">골라서 대답</span></button>
        </div>
      </div>
    );
  }

  if (ph.view === 'mic') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
        <h2 style={{ fontSize: 22 }}>{partner}에게 말로 대답해 보세요</h2>
        <p className="small muted">단어 하나만 말해도 딱 맞아요</p>
        {ph.fb && <p className="fb">{ph.fb}</p>}
        <button className="ob-btn coral mic-btn" onClick={micTap} aria-label={ph.listening ? '듣고 있어요, 누르면 멈춰요' : '눌러서 말하기'}>
          <Mic size={40} />
          <span className={'t' + (ph.listening ? ' pulse' : '')} style={{ fontSize: 22 }}>{ph.listening ? '듣고 있어요' : '눌러서 말하기'}</span>
        </button>
        <div>{hintRow}</div>
        <button className="ob-btn" style={{ alignSelf: 'center', minWidth: 220 }} onClick={() => { stopListening(); setPh({ ...ph, view: 'write', listening: false }); }}><span className="t">지금은 말할 수 없어요</span><span className="s">글자로 대답할게요</span></button>
      </div>
    );
  }

  if (ph.view === 'write') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ fontSize: 22 }}>일본어 소리를 한글로 써 보세요</h2>
        <p className="small muted">예: {step.hintWords[0].ko} · 단어 하나만 써도 돼요{ph.micNote ? ` · ${ph.micNote}` : ''}</p>
        {ph.fb && <p className="fb" aria-live="polite">{ph.fb}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <label className="sr-only" htmlFor="me-type">한글 발음으로 쓰기</label>
          <input id="me-type" className="type-input" value={ph.typed} onChange={(e) => setPh({ ...ph, typed: e.target.value, fb: '' })} onKeyDown={(e) => e.key === 'Enter' && submitTyped()} placeholder="여기에 써요" autoComplete="off" />
          <button className="ob-btn sm coral" style={{ marginTop: 0, minHeight: 50 }} onClick={submitTyped}><span className="t">세우기</span></button>
        </div>
        <div>{hintRow}</div>
        <div className="cry">
          <Brick tone="stone" studs={2} pitch={14} h={18} depth={8} studH={4} />
          <span>그래도 어려우면 골라서 대답해요. 고르면 칙칙한 돌 브릭이 쌓여요.</span>
        </div>
        <button className="ob-btn" onClick={() => setPh({ ...ph, view: 'choose', fb: '' })}><span className="t">골라서 대답하기</span></button>
        {canListen && <button className="link-btn" onClick={() => setPh({ ...ph, view: 'mic', fb: '' })}>말로 대답할래요</button>}
      </div>
    );
  }

  const set = step.choose[ph.set || 0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2 style={{ fontSize: 22 }}>어떻게 대답할까요?</h2>
      {ph.fb && <p className="fb" aria-live="polite">{ph.fb}</p>}
      <div className="opts">
        {set.map((o, i) => (
          <div className="opt-row" key={(ph.set || 0) + o.ko}>
            <button className={'opt stone' + (ph.shake === i ? ' shake-' + (ph.n % 2) : '')} onClick={() => pickAnswer(o, i)}>{o.ko}</button>
            <button className="icon-btn" onClick={() => speak(o.ja, 0.9)} aria-label={`${o.ko} 들어 보기`}><span className="play-dot sm"><Play size={10} /></span></button>
          </div>
        ))}
      </div>
      <button className="refresh" onClick={() => setPh({ ...ph, set: ph.set ? 0 : 1, shake: -1, fb: '' })}><Refresh />{ph.set ? '앞 4개 다시 보기' : '여기엔 맞는 대답이 없어요'}</button>
      <button className="link-btn" onClick={() => setPh({ ...ph, view: 'write', fb: '' })}>글자로 대답할래요</button>
    </div>
  );
}

export { WordChip, BigWord };
// 쓰지 않는 값 경고 막기
void RESCUE_LINES;
void ASK_AGAIN;
