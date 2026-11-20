// 복습 탭: 오늘 복습할 단어 + 복습 탑(맞힌 단어마다 단어가 적힌 브릭) + 내 단어
import { useEffect, useState } from 'react';
import { quiet } from '../lib/api.js';
import { useStore } from '../lib/store.js';
import { speedOf } from '../lib/speed.js';
import { dayTone } from '../lib/progress.js';
import { dailyCognate } from '../content/build.js';
import { speak, unlock } from '../lib/speech.js';
import Brick, { brickBox } from '../components/Brick.jsx';
import WordQuiz, { WORD_BRICK } from '../components/WordQuiz.jsx';
import { TopBar, Tabs, Play, Back, Sheet } from '../components/ui.jsx';

function WordTower({ bricks, total }) {
  const show = bricks.slice(-10);
  const box = brickBox(WORD_BRICK);
  const height = Math.max(110, show.length * WORD_BRICK.h + box.lift + 20);
  return (
    <div className="plate" style={{ boxShadow: 'none' }}>
      {show.length === 0 ? (
        <p className="small" style={{ padding: '24px 0', textAlign: 'center' }}>단어를 맞히면 그 단어가 적힌 브릭이 여기에 쌓여요.</p>
      ) : (
        <div style={{ position: 'relative', height }} role="img" aria-label={`복습 탑, 맞힌 단어 ${total}개`}>
          <div style={{ position: 'absolute', left: '50%', bottom: 4, width: 150, height: 10, marginLeft: -75, borderRadius: 3, background: '#E2CB9C', border: '2px solid #24324A' }} />
          {show.map((b, i) => (
            <div key={i} style={{ position: 'absolute', left: `calc(50% - ${box.w / 2}px)`, top: height - 14 - i * WORD_BRICK.h - box.lift }}>
              <Brick tone={dayTone(b.day)} label={b.ko} {...WORD_BRICK} />
            </div>
          ))}
        </div>
      )}
      {total > show.length && <p className="small muted" style={{ textAlign: 'center', marginTop: 6 }}>위쪽 10개만 보여요 · 모두 {total}개</p>}
    </div>
  );
}

export default function Review() {
  const st = useStore();
  const [words, setWords] = useState(null);
  const [tower, setTower] = useState({ bricks: [], total: 0 });
  const [prog, setProg] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [done, setDone] = useState(null);
  const [list, setList] = useState(false);
  const load = () => {
    quiet('/words').then((w) => setWords(w || []));
    quiet('/review-tower').then((t) => t && setTower(t));
    quiet('/progress').then(setProg);
  };
  useEffect(load, [st.user?.id]);

  const sp = speedOf(prog?.speed);
  const today = new Date().toLocaleDateString('sv-SE');
  const due = (words || []).filter((w) => w.dueDay <= today);
  const leftToday = Math.max(0, sp.review - (prog?.answersToday || 0));
  const batch = due.slice(0, leftToday || Math.min(5, due.length));
  const cog = dailyCognate();

  if (quiz) {
    return (
      <div className="page">
        <div className="talk-top">
          <button className="icon-btn" onClick={() => { setQuiz(null); load(); }} aria-label="복습 그만하기"><Back /></button>
          <div className="ttl">단어 복습</div>
          <span style={{ width: 44 }} />
        </div>
        {done ? (
          <div className="result" style={{ marginTop: 20 }}>
            <h3>복습 끝!</h3>
            <p className="small muted">{done.ok.length + done.wrong.length}개 중 {done.ok.length}개를 맞혀서 복습 탑에 {done.ok.length}층이 쌓였어요.{done.wrong.length ? ' 틀린 단어는 내일 다시 나와요.' : ''}</p>
            <button className="ob-btn coral" onClick={() => { setQuiz(null); setDone(null); load(); }}><span className="t">복습 탑 보기</span></button>
          </div>
        ) : (
          <WordQuiz words={quiz} onDone={setDone} shadow />
        )}
      </div>
    );
  }

  return (
    <div className="page has-tabs">
      <TopBar />
      <div className="title-row">
        <h1>복습</h1>
        <span className="small muted">맞힌 단어 {tower.total}개</span>
      </div>

      <div className="card strong">
        <h2 style={{ fontSize: 21 }}>오늘 복습할 단어 {due.length}개</h2>
        <p className="small muted" style={{ marginTop: 2 }}>
          쌓는 속도 {sp.label}: 하루 {sp.review}개 · 오늘 {Math.min(prog?.answersToday || 0, 999)}개 했어요
        </p>
        {due.length > 0 ? (
          <button className="ob-btn coral wide" onClick={() => { unlock(); setDone(null); setQuiz(batch); }}>
            <span className="t">{leftToday ? `복습 시작 (${batch.length}개)` : `더 하기 (${batch.length}개)`}</span>
            {!leftToday && <span className="s">오늘 몫은 다 했어요. 더 해도 좋아요</span>}
          </button>
        ) : (
          <p className="small" style={{ marginTop: 8 }}>{(words || []).length ? '오늘 복습은 다 했어요. 내일 또 만나요.' : '대화를 하나 끝내면 단어가 여기에 쌓여요.'}</p>
        )}
      </div>

      <h2 style={{ fontSize: 20, marginTop: 4 }}>복습 탑</h2>
      <WordTower bricks={tower.bricks} total={tower.total} />

      <div className="home-cards">
        <button className="mini-card" onClick={() => setList(true)} disabled={!(words || []).length}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 17 }}>내 단어</span>
          <span className="small">{(words || []).length}개 · 눌러서 모두 보기</span>
        </button>
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

      <Tabs />
      {list && (
        <Sheet title={`내 단어 ${(words || []).length}개`} onClose={() => setList(false)} labelId="words-title">
          <div className="word-row" style={{ marginTop: 14 }}>
            {(words || []).map((w) => (
              <button key={w.key} className="word-chip" onClick={() => speak(w.say, 0.85)} aria-label={`${w.ko}, ${w.mean}, 들어 보기`}>
                <span className="play-dot sm"><Play size={10} /></span>
                <span style={{ minWidth: 0 }}>
                  <span className="w">{w.ko}</span>
                  <span className="m">{w.mean}{w.dueDay <= today ? ' · 오늘' : ''}</span>
                </span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
