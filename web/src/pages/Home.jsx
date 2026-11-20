// 학습: 오늘 할 일 · 대화 고르기 · 레벨 · 게임 방법
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { talksAtLevel, talkById, READY_LEVELS, ALL_LEVELS, LEVEL_DESC, LEVEL_SCALE } from '../content/build.js';
import { quiet } from '../lib/api.js';
import { store, useStore } from '../lib/store.js';
import { countCorrect, tooHard, latestByTalk, parseBricks } from '../lib/progress.js';
import { unlock } from '../lib/speech.js';
import { speedOf } from '../lib/speed.js';
import Brick from '../components/Brick.jsx';
import { TopBar, Question, Sheet, Stack, Tabs } from '../components/ui.jsx';
import WordQuiz, { BigWordRow } from '../components/WordQuiz.jsx';
import TowerAlert from '../components/TowerAlert.jsx';
import SoundCheck from '../components/SoundCheck.jsx';
import { loadResume, resumeIds } from '../lib/resume.js';
import { Guide, GAME } from '../components/Guides.jsx';

const MINI = { studs: 4, pitch: 9, h: 11, depth: 6, studH: 3 };
const LV_TONE = ['#29B6A5', '#FF7967', '#FFC857', '#6BB8E8', '#A792E0'];

export default function Home() {
  const st = useStore();
  const nav = useNavigate();
  const [prog, setProg] = useState(null);
  const [lvOpen, setLvOpen] = useState(false);
  const [guide, setGuide] = useState(null); // { next: 대화 id } 이면 다 본 뒤 그 대화로
  const [fixes, setFixes] = useState([]);
  const [tower, setTower] = useState(null);
  const [check, setCheck] = useState(null); // 첫 대화 전 소리·마이크 확인 { next }
  const [spotSheet, setSpotSheet] = useState(null); // 고칠 곳이 있는 장소를 눌렀을 때
  const [pre, setPre] = useState(null); // 대화 전 단어 맞혀 보기 { talkId, words, done }
  const level = st.level;

  useEffect(() => {
    quiet('/progress').then((p) => p && setProg(p));
    quiet('/fixes').then((f) => f && setFixes(f));
    quiet('/tower').then(setTower);
  }, [st.user?.id]);

  const plays = prog?.plays || [];
  const talks = talksAtLevel(level);
  const latest = latestByTalk(plays.filter((p) => p.level === level));
  const correct = countCorrect(plays, level);
  const hard = tooHard(plays, level);
  const maxReady = Math.max(...READY_LEVELS);
  const resumable = new Set(resumeIds());
  const next = talks.find((t) => resumable.has(t.id)) || talks.find((t) => !latest.has(t.id)) || talks.find((t) => latest.get(t.id)?.crooked) || talks[0];
  const fixCount = new Map();
  for (const g of fixes) fixCount.set(g.talkId, (fixCount.get(g.talkId) || 0) + g.items.length);
  const openFixes = fixes.reduce((n, g) => n + g.items.length, 0);
  const sp = speedOf(prog?.speed);
  const preCount = st.settings.preWords == null ? sp.pre : st.settings.preWords;
  const doneCount = talks.filter((t) => latest.has(t.id)).length;
  const rec = hard && level > 1 ? level - 1 : correct >= 3 && level < maxReady ? level + 1 : null;

  const progressText = correct >= 3
    ? (level < maxReady ? `올바른 탑 3개 완성 · Lv${level + 1}를 추천해요` : '올바른 탑 3개 완성 · 다음 레벨은 준비 중이에요')
    : level < maxReady ? `올바른 탑 ${correct}/3 · ${3 - correct}개 더 쌓으면 Lv${level + 1} 추천` : `올바른 탑 ${correct}/3`;

  // 오늘 할 일: 대화 → 단어 복습 → (있으면) 고치기
  const cap = prog?.dayCap || sp.bricks || 1;
  const fin = prog?.finishedToday || 0;
  const due = prog?.wordsDue || 0;
  const answered = prog?.answersToday || 0;
  const nextLabel = next ? (resumable.has(next.id) ? '이어서' : '시작') : '';
  const todos = [
    {
      key: 'talk',
      done: fin >= cap,
      title: fin >= cap ? '대화하기 끝' : `대화하기 · ${next?.place || ''}`,
      desc: fin >= cap
        ? `오늘 탑 브릭 ${cap}개를 다 쌓았어요. 더 해도 좋아요.`
        : `상대 말을 듣고 대답을 골라요. 오늘 탑 브릭 ${fin}/${cap}`,
      btn: fin >= cap ? '한 번 더' : nextLabel,
      go: next ? () => start(next.id) : null,
    },
    {
      key: 'review',
      done: due === 0 && answered > 0,
      none: due === 0 && answered === 0,
      title: due > 0 ? `단어 복습 · ${due}개` : answered > 0 ? '단어 복습 끝' : '단어 복습',
      desc: due > 0 ? '들어 보고 뜻을 골라요. 맞히면 복습 탑이 올라가요.' : answered > 0 ? '오늘 복습할 단어를 다 했어요.' : fin > 0 ? '오늘 만난 단어는 내일부터 복습해요.' : '오늘은 복습할 단어가 없어요. 대화하면 생겨요.',
      btn: '복습',
      go: due > 0 ? () => nav('/review') : null,
    },
  ];
  if (openFixes > 0) {
    todos.push({ key: 'fix', done: false, title: `고치기 · ${openFixes}곳`, desc: '놓친 단어와 비뚤어진 브릭을 다시 만들어요.', btn: '고치기', go: () => nav('/fix') });
  }
  const todoDone = todos.filter((t) => t.done).length;
  const todoNow = todos.find((t) => !t.done && !t.none && t.go)?.key; // 지금 할 차례 = 버튼을 산호색으로
  const todoAll = todos.filter((t) => !t.none).length;

  const go = (id) => {
    unlock();
    nav('/talk/' + id);
  };
  // 대화 전에 복습할 단어가 있으면 먼저 몇 개 맞혀 봐요 (건너뛸 수 있음)
  // 처음 "시작하기": 게임 방법 3장 → 소리·마이크 확인 → (복습할 단어가 있으면) 단어 맞혀 보기 → 대화
  const start = async (id) => {
    unlock();
    setSpotSheet(null);
    if (!store.s.seenGame) return setGuide({ next: id });
    if (!store.s.seenCheck) return setCheck({ next: id });
    if (loadResume(id)) return go(id); // 하던 대화는 바로 이어서
    if (!preCount || !prog?.wordsDue) return go(id);
    const words = await quiet('/words');
    const today = new Date().toLocaleDateString('sv-SE');
    const due = (words || []).filter((w) => w.dueDay <= today).slice(0, preCount);
    if (!due.length) return go(id);
    setPre({ talkId: id, words: due, done: null });
  };
  const tapSpot = (id) => {
    if (fixCount.get(id)) setSpotSheet(id);
    else start(id);
  };
  const setLevel = (n) => {
    store.set({ level: n });
    if (st.user) quiet('/me', { method: 'PUT', body: { level: n } });
    setLvOpen(false);
  };

  return (
    <div className="page has-tabs">
      <TopBar>
        <button className="icon-btn" onClick={() => setGuide({ next: null })} aria-label="게임 방법 보기"><Question /></button>
      </TopBar>
      <TowerAlert tower={tower} speed={prog?.speed} />
      <h1 className="learn-h1">학습</h1>

      <section className="card strong todo-card" aria-labelledby="todo-title">
        <div className="todo-head">
          <h2 id="todo-title">오늘 할 일</h2>
          <span className="small muted">{todoDone}/{todoAll} 끝</span>
        </div>
        {todos.map((t) => (
          <div key={t.key} className={'todo-row' + (t.done ? ' done' : '') + (t.none ? ' none' : '')}>
            <TodoMark kind={t.key} done={t.done} none={t.none} />
            <div className="todo-txt">
              <b>{t.title}</b>
              <span className="small">{t.desc}</span>
            </div>
            {t.go && (
              <button className={'ob-btn sm todo-go' + (t.key === todoNow ? ' coral' : '')} onClick={t.go}>
                <span className="t">{t.btn}</span>
              </button>
            )}
          </div>
        ))}
      </section>

      <div className="title-row" style={{ marginTop: 6 }}>
        <h2 className="learn-h2">대화 고르기</h2>
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
            const saved = resumable.has(t.id) ? loadResume(t.id) : null;
            const bricks = saved ? [...saved.bricks, { tone: 'coral', ghost: true }] : p ? parseBricks(p.bricks) : [{ tone: 'mint', ghost: true }];
            const now = next && t.id === next.id && (!p || resumable.has(t.id));
            const status = resumable.has(t.id) ? '대화 중' : p ? (p.crooked ? '완성' : '완성 · 올바른 탑') : now ? '다음 차례' : '아직';
            const color = saved ? '#B9473A' : p ? (p.crooked ? '#8A5A1A' : '#1B776C') : now ? '#B9473A' : '#4A566B';
            const show = bricks.slice(-8);
            return (
              <button key={t.id} className={'spot' + (now ? ' now' : '')} onClick={() => tapSpot(t.id)} aria-label={`${t.place}, ${status}${fixCount.get(t.id) ? `, 고칠 곳 ${fixCount.get(t.id)}개` : ''}`}>
                <Stack bricks={show} size={MINI} x0={28} baseY={96} height={100} width={98} />
                <span className="spot-name">{t.place}</span>
                <span className="spot-st" style={{ color, fontWeight: p || now ? 700 : 400 }}>{status}</span>
                {fixCount.get(t.id) > 0 && <span className="chip" style={{ fontSize: 11, padding: '0 6px', background: '#FFE1DB', borderColor: '#FF7967' }}>고칠 곳 {fixCount.get(t.id)}</span>}
              </button>
            );
          })}
        </div>
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
      <Tabs />
      {spotSheet && (
        <Sheet title={talkById(spotSheet)?.place} onClose={() => setSpotSheet(null)} labelId="spot-title">
          <p className="small muted" style={{ marginTop: 4 }}>이 대화에 고칠 곳이 {fixCount.get(spotSheet)}개 있어요.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
            <button className="ob-btn coral" onClick={() => nav('/fix?talk=' + spotSheet)}><span className="t">고치기</span></button>
            <button className="ob-btn" onClick={() => start(spotSheet)}><span className="t">대화 다시 하기</span></button>
          </div>
        </Sheet>
      )}
      {pre && (
        <Sheet title="대화 전에 단어 맞혀 보기" onClose={() => setPre(null)} labelId="pre-title">
          {!pre.done ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="small muted">복습할 단어 {pre.words.length}개만 먼저 맞혀 볼까요?</p>
                <button className="link-btn" onClick={() => go(pre.talkId)}>건너뛰기</button>
              </div>
              <WordQuiz words={pre.words} lastLabel="다 맞혀 봤어요" onDone={(r) => (r.wrong.length ? setPre({ ...pre, done: r }) : go(pre.talkId))} />
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              <p style={{ fontSize: 14, lineHeight: 1.55 }}>{pre.done.wrong.length}개를 놓쳤어요. 복습 탭에서 마저 해 보면 대화가 더 잘 들려요.</p>
              {pre.done.wrong.map((w) => <BigWordRow key={w.key} w={w} />)}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button className="ob-btn coral" onClick={() => nav('/review')}><span className="t">복습하러 가기</span></button>
                <button className="ob-btn" onClick={() => go(pre.talkId)}><span className="t">대화 시작</span></button>
              </div>
            </div>
          )}
        </Sheet>
      )}
      {check && (
        <SoundCheck
          onDone={() => {
            const next = check.next;
            setCheck(null);
            if (next) start(next);
          }}
          onClose={() => setCheck(null)}
        />
      )}
      {guide && (
        <Guide
          slides={GAME}
          label="게임 방법"
          doneLabel={guide.next ? '대화 시작' : '알겠어요'}
          skipLabel={guide.next ? '건너뛰기' : '닫기'}
          onDone={() => {
            const next = guide.next;
            setGuide(null);
            store.set({ seenGame: true });
            if (next) start(next);
          }}
        />
      )}
    </div>
  );
}

/** 오늘 할 일 왼쪽 네모: 할 일마다 다른 그림, 끝나면 체크 */
function TodoMark({ kind, done, none }) {
  const fill = none ? '#F4E9D2' : done ? '#29B6A5' : kind === 'talk' ? '#FF7967' : kind === 'review' ? '#FFC857' : '#FFE1DB';
  return (
    <span className="todo-mark" style={{ background: fill }} aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#24324A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {done ? (
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        ) : kind === 'talk' ? (
          <path d="M4 6h16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 17h-9l-4.5 3.5V17H4a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 4 6z" />
        ) : kind === 'review' ? (
          <>
            <rect x="3" y="12" width="18" height="8" rx="1.5" />
            <path d="M7 12v-2.5h3V12M14 12v-2.5h3V12" />
          </>
        ) : (
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.3-3.3a6 6 0 0 1-7.9 7.9l-6.4 6.4a2.1 2.1 0 0 1-3-3l6.4-6.4a6 6 0 0 1 7.9-7.9l-3.3 3.3z" />
        )}
      </svg>
    </span>
  );
}
