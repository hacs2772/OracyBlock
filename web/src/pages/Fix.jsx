// 고치기 (학습에서 들어와요): 구멍 난 돌기·비뚤어진 브릭·빠진 대답이 있는 대화를 다시 만들기
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { talkById, judge } from '../content/build.js';
import { api, quiet } from '../lib/api.js';
import { parseBricks, freshFixes } from '../lib/progress.js';
import { speak, unlock, sfx, listen, canListen, stopListening } from '../lib/speech.js';
import { Stack, Play, Back, Mic, Ja, toast } from '../components/ui.jsx';
import { BigWord } from './Talk.jsx';

const MINI = { studs: 4, pitch: 9, h: 11, depth: 6, studH: 3 };
const BIG = { studs: 4, pitch: 14, h: 16, depth: 8, studH: 4 };

export default function Fix() {
  const [groups, setGroups] = useState(null);
  const [mode, setMode] = useState(null);
  const load = () => quiet('/fixes').then((f) => setGroups(freshFixes(f)));
  useEffect(() => {
    load();
  }, []);
  // 여행 판에서 장소를 골라 들어오면 (/fix?talk=izakaya) 그 대화부터 바로
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get('talk');
    if (want && groups && !mode) {
      const g = groups.find((x) => x.talkId === want);
      if (g) setMode({ group: g });
    }
  }, [groups]); // eslint-disable-line react-hooks/exhaustive-deps

  if (mode) return <Remake group={mode.group} onExit={() => { setMode(null); window.history.replaceState(null, '', '/fix'); load(); }} />;

  const list = groups || [];
  const openCount = list.reduce((n, g) => n + g.items.length, 0);
  return (
    <div className="page">
      <div className="talk-top">
        <Link className="icon-btn" to="/" aria-label="학습으로"><Back /></Link>
        <div className="ttl">고치기</div>
        <span style={{ width: 44 }} />
      </div>
      <p className="small muted">고칠 곳 {openCount}개 · 구멍 난 돌기 = 놓친 단어, 비뚤어진 브릭 = 어긋난 대답, 빠진 대답 = 두 번 튕긴 차례. 고쳐도 레벨 추천에 쓰는 올바른 탑으로는 세지 않아요.</p>
      {groups && list.length === 0 && <p className="card small">고칠 곳이 없어요. 탑이 단단해요!</p>}
      {list.map((g) => {
        const t = talkById(g.talkId);
        if (!t) return null;
        const holes = g.items.filter((x) => x.kind === 'hole').length;
        const skipThem = g.items.filter((x) => x.kind === 'skip' && t.steps[x.turnIdx]?.type === 'them').length;
        const skips = g.items.filter((x) => x.kind === 'skip').length - skipThem;
        const tilts = g.items.length - holes - skips - skipThem;
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
                {skipThem > 0 && <span className="chip">빠진 뜻 {skipThem}</span>}
                {skips > 0 && <span className="chip">빠진 대답 {skips}</span>}
              </span>
              <button className="ob-btn sm coral" onClick={() => { unlock(); setMode({ group: g }); }}><span className="t">다시 만들기</span></button>
            </div>
          </div>
        );
      })}
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
  // 뜻 맞히기를 두 번 튕겨 빠진 자리(them + skip)는 "무슨 뜻일까요?"로 다시 끼워요
  const asMean = item && (item.kind === 'hole' || step?.type === 'them');
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
      if (item.kind === 'skip') return step.type === 'them' ? { tone: 'mint', cls: 'b-drop' } : { tone: 'coral', shine: true, cls: 'b-drop' };
      return { ...b, tilt: false, cls: 'b-stand' };
    });
    setBricks(nb);
    sfx('snap');
    setPh({ ...ph, solved: how, fb: '', listening: false });
    try {
      await api(`/fixes/${item.id}`, { method: 'POST', body: { how, bricks: JSON.stringify(nb.map((b) => ({ t: b.tone, s: b.shine ? 1 : 0, k: b.tilt ? 1 : 0, m: b.missing || '', ...(b.gone ? { g: 1 } : {}) }))) } });
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

  // 대화 화면과 같은 보기 (맞는 대답은 모두 들어 있어요)
  const options = asMean ? step.sets[step.answerSet] : step.choose;
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
  const optWords = asMean ? step.keys : step.options[0].words;
  // 브릭이 많으면 무대(높이 200)에 다 들어가게 얇게
  const vis = bricks.filter((b) => !b.gone).length;
  const h = Math.max(9, Math.min(BIG.h, Math.floor(168 / Math.max(1, vis))));
  const SZ = h === BIG.h ? BIG : { studs: 4, pitch: Math.round(h * 0.9), h, depth: Math.round(h * 0.5), studH: Math.max(3, Math.round(h * 0.25)) };
  const markLeft = 'calc(50% + ' + (SZ.pitch * 2 + 20) + 'px)';
  const baseY = 180;
  const below = bricks.slice(0, item.turnIdx).filter((b) => !b.gone).length; // 빠진 자리는 안 그려서 그 아래 브릭 수로
  const ptrTop = baseY - below * SZ.h - SZ.h / 2 - 22;

  return (
    <div className="page" style={{ gap: 10 }}>
      <div className="talk-top">
        <button className="icon-btn" onClick={onExit} aria-label="고치기 목록으로"><Back /></button>
        <div className="ttl">{talk.place}<div className="small muted" style={{ fontFamily: 'var(--body)' }}>{talk.partner} · Lv{group.level}</div></div>
        <span style={{ width: 44, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{k + 1}/{items.length}</span>
      </div>
      <div className="stage plate" style={{ boxShadow: 'none', padding: 0, height: 200 }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, marginLeft: -(SZ.pitch * 2 + 14) }}>
          <Stack bricks={bricks} size={SZ} x0={20} baseY={baseY} height={200} width={120} plate={6} />
        </div>
        <div className="ptr" style={{ left: markLeft, top: Math.max(4, ptrTop), color: ph.solved ? '#1B776C' : '#E0533F' }}>
          <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><path d="M21 7H3M8 2L3 7l5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>{ph.solved ? { hole: '채워졌어요', tilt: '바로 섰어요', skip: '끼워졌어요' }[item.kind] : (asMean && item.kind === 'skip' ? '빠진 뜻' : { hole: '놓친 단어', tilt: '어긋난 대답', skip: '빠진 대답' }[item.kind])}</span>
        </div>
      </div>
      <div className="bubble">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="small muted">{talk.partner}</div>
          <div className="ko">{them.line.ko}{them.casual && <span className="tag-casual">반말</span>}</div>
          <Ja>{them.line.ja}</Ja>
          {(!asMean || ph.solved) && <div className="mean">{them.line.mean}</div>}
        </div>
        <button className="icon-btn" onClick={() => speak(them.line.ja, 0.9)} aria-label="다시 듣기"><span className="play-dot"><Play /></span></button>
      </div>
      {!asMean && item.prev && <p className="small muted">{item.kind === 'skip' ? '지난번에 튕긴 대답' : '지난번 내 대답'}: <b style={{ color: '#24324A' }}>{item.prev}</b></p>}

      {!ph.solved && (
        <>
          <h2 style={{ fontSize: 21 }}>{asMean ? '무슨 뜻일까요?' : item.kind === 'skip' ? '이번엔 맞는 대답을 골라 볼까요?' : '이번엔 딱 맞게 대답해 볼까요?'}</h2>
          {ph.fb && <p className="fb">{ph.fb}</p>}
          
          <div className="opts">
            {options.map((o, i) => {
              const text = asMean ? o : o.ko;
              return (
                <div className="opt-row" key={text}>
                  <button
                    className={'opt ' + (asMean ? 'mint' : '') + (ph.shake === i ? ' shake-' + (ph.n % 2) : '')}
                    onClick={() => {
                      if (asMean) return o === them.line.mean ? solve('hear') : miss(i, '아쉬워요. 한 번 더 들어 보고 골라 보세요.');
                      if (o.kind === 'ok') return solve('choose');
                      return miss(i, o.kind === 'near' ? '이것도 비뚤게 얹혀요. 다른 걸 골라 보세요.' : '이 대답은 튕겨 나가요. 다시 골라 보세요.');
                    }}
                  >
                    {text}
                  </button>
                  {!asMean && <button className="icon-btn" onClick={() => speak(o.ja, 0.9)} aria-label={`${o.ko} 들어 보기`}><span className="play-dot sm"><Play size={10} /></span></button>}
                </div>
              );
            })}
          </div>
        </>
      )}
      {ph.solved && (
        <div className="result">
          <h3>{{ hole: '딸깍! 돌기가 채워졌어요', tilt: '스르륵, 바로 섰어요', skip: '딸깍! 빠진 자리에 끼웠어요' }[item.kind]}</h3>
          <p className="small muted">이 단어는 며칠 뒤에 한 번 더 들려 드려요.</p>
          {optWords.slice(0, 2).map((w) => <BigWord key={w.key} w={w} />)}
          <button className="ob-btn coral" onClick={next}><span className="t">{k + 1 < items.length ? '다음 고칠 곳' : '다 고쳤어요'}</span></button>
        </div>
      )}
    </div>
  );
}
