// 고치기: 단어 복습 + 구멍 난 돌기·비뚤어진 브릭 다시 만들기
import { useEffect, useMemo, useState } from 'react';
import { talkById, wordChoices, judge } from '../content/build.js';
import { api, quiet } from '../lib/api.js';
import { parseBricks } from '../lib/progress.js';
import { speak, unlock, sfx, listen, canListen, stopListening } from '../lib/speech.js';
import { Logo, Stack, Play, Back, Mic, Ja, toast } from '../components/ui.jsx';
import { BigWord } from './Talk.jsx';

const MINI = { studs: 4, pitch: 9, h: 11, depth: 6, studH: 3 };
const BIG = { studs: 4, pitch: 14, h: 16, depth: 8, studH: 4 };
const STEPS_DAYS = [1, 3, 7, 14, 30];

export default function Fix() {
  const [data, setData] = useState(null);
  const [mode, setMode] = useState(null); // { type: 'words' } | { type: 'fix', group }
  const load = () => Promise.all([quiet('/words'), quiet('/fixes')]).then(([w, f]) => setData({ words: w || [], groups: f || [] }));
  useEffect(() => {
    load();
  }, []);

  if (mode?.type === 'words') return <WordQuiz words={mode.words} onExit={() => { setMode(null); load(); }} />;
  if (mode?.type === 'fix') return <Remake group={mode.group} onExit={() => { setMode(null); load(); }} />;

  const words = data?.words || [];
  const today = new Date().toLocaleDateString('sv-SE');
  const due = words.filter((w) => w.dueDay <= today);
  const groups = data?.groups || [];
  const openCount = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="page has-tabs">
      <div className="top-row"><Logo /></div>
      <div className="title-row">
        <h1>고치기</h1>
        <span className="small muted">복습 {due.length} · 고칠 곳 {openCount}</span>
      </div>

      <div className="card strong">
        <h2 style={{ fontSize: 21 }}>오늘 복습할 단어 {due.length}개</h2>
        <p className="small muted" style={{ marginTop: 2 }}>소리를 듣고 뜻을 골라요. 맞히면 3일 뒤, 7일 뒤처럼 점점 멀리 다시 나와요.</p>
        {due.length > 0 ? (
          <button className="ob-btn coral wide" onClick={() => { unlock(); setMode({ type: 'words', words: due.slice(0, 10) }); }}><span className="t">복습 시작 ({Math.min(10, due.length)}개)</span></button>
        ) : (
          <p className="small" style={{ marginTop: 8 }}>{words.length ? '오늘 복습은 다 했어요.' : '대화를 하나 끝내면 단어가 여기에 쌓여요.'}</p>
        )}
      </div>

      <h2 style={{ fontSize: 20, marginTop: 6 }}>고칠 곳</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }} className="small muted">
        <span>구멍 난 돌기 = 놓친 단어</span>
        <span>비뚤어진 브릭 = 어긋난 대답</span>
      </div>
      {groups.length === 0 && <p className="small">고칠 곳이 없어요. 탑이 단단해요!</p>}
      {groups.map((g) => {
        const t = talkById(g.talkId);
        if (!t) return null;
        const holes = g.items.filter((x) => x.kind === 'hole').length;
        const tilts = g.items.length - holes;
        const bricks = parseBricks(g.bricks).slice(-9);
        return (
          <div className="card fix-card" key={g.playId}>
            <Stack bricks={bricks} size={MINI} x0={14} baseY={110} height={116} width={74} plate={6} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
              <span style={{ fontFamily: 'var(--display)', fontSize: 19, lineHeight: 1.15 }}>{t.place}</span>
              <span className="small muted">{new Date(g.finishedAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} · Lv{g.level}</span>
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {holes > 0 && <span className="chip">놓친 단어 {holes}</span>}
                {tilts > 0 && <span className="chip">비뚤어진 브릭 {tilts}</span>}
              </span>
              <button className="ob-btn sm coral" onClick={() => { unlock(); setMode({ type: 'fix', group: g }); }}><span className="t">다시 만들기</span></button>
            </div>
          </div>
        );
      })}

      {words.length > 0 && (
        <>
          <h2 style={{ fontSize: 20, marginTop: 6 }}>내 단어 {words.length}개</h2>
          <div className="word-row" style={{ marginTop: 8 }}>
            {words.map((w) => (
              <button key={w.key} className="word-chip" onClick={() => { unlock(); speak(w.say, 0.85); }} aria-label={`${w.ko}, ${w.mean}, 들어 보기`}>
                <span className="play-dot sm"><Play size={10} /></span>
                <span style={{ minWidth: 0 }}>
                  <span className="w">{w.ko}</span>
                  <span className="m">{w.mean}{w.dueDay <= today ? ' · 오늘' : ''}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function WordQuiz({ words, onExit }) {
  const [i, setI] = useState(0);
  const [state, setState] = useState({ picked: null, n: 0, okCount: 0 });
  const w = words[i];
  const choices = useMemo(() => (w ? wordChoices({ ...w, variants: [w.say] }, ':' + i) : []), [w, i]);
  useEffect(() => {
    if (w) setTimeout(() => speak(w.say, 0.85), 250);
  }, [w]);
  if (!w) {
    return (
      <div className="page">
        <div className="result" style={{ marginTop: 40 }}>
          <h3>복습 끝!</h3>
          <p className="small muted">{words.length}개 중 {state.okCount}개를 바로 알아들었어요. 틀린 단어는 내일 다시 나와요.</p>
          <button className="ob-btn coral" onClick={onExit}><span className="t">고치기로</span></button>
        </div>
      </div>
    );
  }
  const pick = (m) => {
    if (state.picked) return;
    const ok = m === w.mean;
    sfx(ok ? 'snap' : 'thud');
    quiet('/words/result', { method: 'POST', body: { key: w.key, ok } });
    setState({ ...state, picked: m, ok, okCount: state.okCount + (ok ? 1 : 0), n: state.n + 1 });
    speak(w.say, 0.85);
  };
  const nextDays = state.ok ? STEPS_DAYS[Math.min(STEPS_DAYS.length - 1, (w.stage || 0) + 1)] : 1;
  return (
    <div className="page">
      <div className="talk-top">
        <button className="icon-btn" onClick={onExit} aria-label="복습 그만하기"><Back /></button>
        <div className="ttl">단어 복습</div>
        <span style={{ width: 44, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{i + 1}/{words.length}</span>
      </div>
      <div className="card strong" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
        <button className="icon-btn" style={{ width: 56, height: 56 }} onClick={() => speak(w.say, 0.85)} aria-label="다시 듣기">
          <span className="play-dot" style={{ width: 50, height: 50 }}><Play size={18} /></span>
        </button>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 34, lineHeight: 1.05 }}>{w.ko}</div>
          <Ja>{w.say}</Ja>
        </div>
      </div>
      <h2 style={{ fontSize: 21 }}>무슨 뜻일까요?</h2>
      <div className="opts">
        {choices.map((m) => {
          const mark = state.picked && (m === w.mean ? { background: '#DDF3EF' } : m === state.picked ? { background: '#FFE1DB' } : null);
          return (
            <button key={m} className={'opt' + (state.picked === m && !state.ok ? ' shake-' + (state.n % 2) : '')} style={mark || undefined} onClick={() => pick(m)}>{m}</button>
          );
        })}
      </div>
      {state.picked && (
        <div className="result">
          <h3>{state.ok ? '딸깍! 맞아요' : '아쉬워요'}</h3>
          <BigWord w={{ ...w, variants: [w.say] }} />
          <p className="small muted">{state.ok ? `${nextDays}일 뒤에 한 번 더 들려 드려요.` : '내일 다시 들려 드려요.'}</p>
          <button className="ob-btn coral" onClick={() => { setI(i + 1); setState({ ...state, picked: null }); }}><span className="t">{i + 1 < words.length ? '다음 단어' : '복습 마치기'}</span></button>
        </div>
      )}
    </div>
  );
}

function Remake({ group, onExit }) {
  const talk = talkById(group.talkId);
  const [bricks, setBricks] = useState(() => parseBricks(group.bricks));
  const [items, setItems] = useState(group.items);
  const [k, setK] = useState(0);
  const [ph, setPh] = useState({ fb: '', n: 0, shake: -1, solved: null, listening: false });
  const item = items[k];
  const step = item ? talk.steps[item.turnIdx] : null;
  const them = step?.type === 'them' ? step : talk.steps[(item?.turnIdx || 1) - 1];

  useEffect(() => {
    if (them) setTimeout(() => speak(them.line.ja, 0.9), 300);
    return () => stopListening();
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) {
    return (
      <div className="page">
        <div className="result" style={{ marginTop: 40 }}>
          <h3>다 고쳤어요</h3>
          <p className="small muted">고친 탑은 단단해졌지만, 레벨 추천에 쓰는 올바른 탑으로는 세지 않아요.</p>
          <button className="ob-btn coral" onClick={onExit}><span className="t">고치기로</span></button>
        </div>
      </div>
    );
  }

  const solve = async (how) => {
    const nb = bricks.map((b, i) => {
      if (i !== item.turnIdx) return b;
      if (item.kind === 'hole') return { ...b, missing: '', cls: 'b-pop' };
      return { ...b, tilt: false, cls: 'b-stand', ...(how === 'choose' ? { tone: 'stone', shine: false } : {}) };
    });
    setBricks(nb);
    sfx('snap');
    setPh({ ...ph, solved: how, fb: '', listening: false });
    try {
      await api(`/fixes/${item.id}`, { method: 'POST', body: { how, bricks: JSON.stringify(nb.map((b) => ({ t: b.tone, s: b.shine ? 1 : 0, k: b.tilt ? 1 : 0, m: b.missing || '' }))) } });
    } catch (e) {
      toast(e.message);
    }
  };
  const miss = (i, text) => {
    sfx('thud');
    setPh({ ...ph, shake: i, n: ph.n + 1, fb: text, listening: false });
  };
  const next = () => {
    setItems(items);
    setK(k + 1);
    setBricks((b) => b.map((x) => ({ ...x, cls: '' })));
    setPh({ fb: '', n: 0, shake: -1, solved: null, listening: false });
  };

  const options = item.kind === 'hole' ? step.sets[step.answerSet] : (() => {
    const all = step.choose.flat().filter((o, i, arr) => arr.findIndex((x) => x.ko === o.ko) === i);
    const pick = [...all.filter((o) => o.kind === 'ok').slice(0, 1), ...all.filter((o) => o.kind !== 'ok')].slice(0, 4);
    return pick.sort((x, y) => (x.ko < y.ko ? -1 : 1));
  })();
  const mic = async () => {
    if (ph.listening) return stopListening();
    setPh({ ...ph, listening: true, fb: '' });
    try {
      const heard = await listen();
      const r = judge(step, { heard });
      if (r.kind === 'ok') solve('speak');
      else miss(-1, r.kind === 'near' ? '아직 비뚤어요. 다른 단어로 말해 보세요.' : `잘 못 알아들었어요 (들린 말: ${heard[0]}). 골라서 대답해도 돼요.`);
    } catch {
      miss(-1, '소리가 안 들렸어요. 골라서 대답해도 돼요.');
    }
  };
  const optWords = item.kind === 'tilt' ? step.options[0].words : step.keys;
  const markLeft = 'calc(50% + ' + (BIG.pitch * 2 + 20) + 'px)';
  const baseY = 180;
  const ptrTop = baseY - item.turnIdx * BIG.h - BIG.h / 2 - 22;

  return (
    <div className="page" style={{ gap: 10 }}>
      <div className="talk-top">
        <button className="icon-btn" onClick={onExit} aria-label="고치기 목록으로"><Back /></button>
        <div className="ttl">{talk.place}<div className="small muted" style={{ fontFamily: 'var(--body)' }}>{talk.partner} · Lv{group.level}</div></div>
        <span style={{ width: 44, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{k + 1}/{items.length}</span>
      </div>
      <div className="stage plate" style={{ boxShadow: 'none', padding: 0, height: 200 }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, marginLeft: -(BIG.pitch * 2 + 14) }}>
          <Stack bricks={bricks} size={BIG} x0={20} baseY={baseY} height={200} width={120} plate={6} />
        </div>
        <div className="ptr" style={{ left: markLeft, top: Math.max(4, ptrTop), color: ph.solved ? '#1B776C' : '#E0533F' }}>
          <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><path d="M21 7H3M8 2L3 7l5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>{ph.solved ? (item.kind === 'hole' ? '채워졌어요' : '바로 섰어요') : item.kind === 'hole' ? '놓친 단어' : '어긋난 대답'}</span>
        </div>
      </div>
      <div className="bubble">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="small muted">{talk.partner}</div>
          <div className="ko">{them.line.ko}{them.casual && <span className="tag-casual">반말</span>}</div>
          <Ja>{them.line.ja}</Ja>
          {(item.kind === 'tilt' || ph.solved) && <div className="mean">{them.line.mean}</div>}
        </div>
        <button className="icon-btn" onClick={() => speak(them.line.ja, 0.9)} aria-label="다시 듣기"><span className="play-dot"><Play /></span></button>
      </div>
      {item.kind === 'tilt' && item.prev && <p className="small muted">지난번 내 대답: <b style={{ color: '#24324A' }}>{item.prev}</b></p>}

      {!ph.solved && (
        <>
          <h2 style={{ fontSize: 21 }}>{item.kind === 'hole' ? '무슨 뜻일까요?' : '이번엔 딱 맞게 대답해 볼까요?'}</h2>
          {ph.fb && <p className="fb">{ph.fb}</p>}
          {item.kind === 'tilt' && canListen && (
            <button className="ob-btn coral row" style={{ minHeight: 54 }} onClick={mic}><Mic /><span className={'t' + (ph.listening ? ' pulse' : '')}>{ph.listening ? '듣고 있어요' : '말로 다시 대답'}</span></button>
          )}
          {item.kind === 'tilt' && <p className="small muted">어려우면 골라서 대답해요. 고르면 돌 브릭이 돼요.</p>}
          <div className="opts">
            {options.map((o, i) => {
              const text = item.kind === 'hole' ? o : o.ko;
              return (
                <div className="opt-row" key={text}>
                  <button
                    className={'opt ' + (item.kind === 'hole' ? 'mint' : 'stone') + (ph.shake === i ? ' shake-' + (ph.n % 2) : '')}
                    onClick={() => {
                      if (item.kind === 'hole') return o === them.line.mean ? solve('hear') : miss(i, '아쉬워요. 한 번 더 들어 보고 골라 보세요.');
                      if (o.kind === 'ok') return solve('choose');
                      return miss(i, o.kind === 'near' ? '이것도 비뚤게 얹혀요. 다른 걸 골라 보세요.' : '이 대답은 튕겨 나가요. 다시 골라 보세요.');
                    }}
                  >
                    {text}
                  </button>
                  {item.kind === 'tilt' && <button className="icon-btn" onClick={() => speak(o.ja, 0.9)} aria-label={`${o.ko} 들어 보기`}><span className="play-dot sm"><Play size={10} /></span></button>}
                </div>
              );
            })}
          </div>
        </>
      )}
      {ph.solved && (
        <div className="result">
          <h3>{item.kind === 'hole' ? '딸깍! 돌기가 채워졌어요' : ph.solved === 'speak' ? '스르륵, 바로 섰어요' : '바로 섰어요'}</h3>
          <p className="small muted">{ph.solved === 'choose' ? '골라서 고친 브릭은 돌 브릭이 돼요. 다음엔 말로 해 봐요.' : '이 단어는 며칠 뒤에 한 번 더 들려 드려요.'}</p>
          {optWords.slice(0, 2).map((w) => <BigWord key={w.key} w={w} />)}
          <button className="ob-btn coral" onClick={next}><span className="t">{k + 1 < items.length ? '다음 고칠 곳' : '다 고쳤어요'}</span></button>
        </div>
      )}
    </div>
  );
}
