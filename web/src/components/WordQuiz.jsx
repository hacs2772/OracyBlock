// 단어 맞히기: 소리를 듣고 뜻 4개 중 고르기. 맞히면 복습 탑에 그 단어 브릭이 쌓여요
// 복습 탭과 "대화 전에 단어 3개"에서 같이 써요
import { useEffect, useMemo, useState } from 'react';
import { wordChoices } from '../content/build.js';
import { quiet } from '../lib/api.js';
import { speak, sfx } from '../lib/speech.js';
import { dayTone } from '../lib/progress.js';
import Brick from './Brick.jsx';
import { Play, Ja } from './ui.jsx';
import Shadow from './Shadow.jsx';

const STEPS_DAYS = [1, 3, 7, 14, 30];
export const WORD_BRICK = { studs: 4, pitch: 22, h: 22, depth: 10, studH: 5 };

export function BigWordRow({ w }) {
  return (
    <div className="word-big">
      <button className="icon-btn" style={{ width: 46, height: 46 }} onClick={() => speak(w.say, 0.8)} aria-label={`${w.ko} 들어 보기`}>
        <span className="play-dot" style={{ width: 40, height: 40 }}><Play size={14} /></span>
      </button>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span className="w">{w.ko}</span>
          <Ja>{w.say}</Ja>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{w.mean}</div>
      </div>
    </div>
  );
}

/** words: [{ key, ko, mean, say, stage }], onDone({ ok: [...], wrong: [...] }) */
export default function WordQuiz({ words, onDone, lastLabel = '복습 마치기', shadow = false }) {
  const [i, setI] = useState(0);
  const [st, setSt] = useState({ picked: null, ok: false, n: 0 });
  const [result, setResult] = useState({ ok: [], wrong: [] });
  const w = words[i];
  const choices = useMemo(() => (w ? wordChoices({ ...w, variants: [w.say] }, ':' + i) : []), [w, i]);
  useEffect(() => {
    if (!w) return undefined;
    const t = setTimeout(() => speak(w.say, 0.85), 250);
    return () => clearTimeout(t);
  }, [w]);
  if (!w) return null;

  const pick = (m) => {
    if (st.picked) return;
    const ok = m === w.mean;
    sfx(ok ? 'snap' : 'thud', ok ? 0.25 : 0);
    quiet('/words/result', { method: 'POST', body: { key: w.key, ok } });
    setSt({ picked: m, ok, n: st.n + 1 });
    setResult((r) => ({ ok: ok ? [...r.ok, w] : r.ok, wrong: ok ? r.wrong : [...r.wrong, w] }));
    speak(w.say, 0.85);
  };
  const next = () => {
    if (i + 1 >= words.length) {
      onDone(result);
      return;
    }
    setI(i + 1);
    setSt({ picked: null, ok: false, n: st.n });
  };
  const nextDays = STEPS_DAYS[Math.min(STEPS_DAYS.length - 1, (w.stage || 0) + 1)];
  const today = new Date().toLocaleDateString('sv-SE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="small muted" style={{ textAlign: 'right', fontWeight: 700 }}>{i + 1}/{words.length}</div>
      <div className="card strong" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
        <button className="icon-btn" style={{ width: 56, height: 56 }} onClick={() => speak(w.say, 0.85)} aria-label="다시 듣기">
          <span className="play-dot" style={{ width: 50, height: 50 }}><Play size={18} /></span>
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 32, lineHeight: 1.05 }}>{w.ko}</div>
          <Ja>{w.say}</Ja>
        </div>
      </div>
      <h2 style={{ fontSize: 21 }}>무슨 뜻일까요?</h2>
      <div className="opts">
        {choices.map((m) => {
          const mark = st.picked && (m === w.mean ? { background: '#DDF3EF' } : m === st.picked ? { background: '#FFE1DB' } : null);
          return (
            <button key={m} className={'opt' + (st.picked === m && !st.ok ? ' shake-' + (st.n % 2) : '')} style={mark || undefined} onClick={() => pick(m)} disabled={!!st.picked}>
              {m}
            </button>
          );
        })}
      </div>
      {st.picked && (
        <div className="result">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {st.ok && (
              <div className="b-drop" aria-hidden="true">
                <Brick tone={dayTone(today)} label={w.ko} {...WORD_BRICK} />
              </div>
            )}
            <div>
              <h3>{st.ok ? '딸깍! 맞아요' : '아쉬워요'}</h3>
              <p className="small muted">{st.ok ? `복습 탑에 "${w.ko}" 브릭이 쌓였어요. ${nextDays}일 뒤에 한 번 더 들려 드려요.` : '내일 다시 들려 드려요.'}</p>
            </div>
          </div>
          <BigWordRow w={w} />
          {shadow && <Shadow key={w.key} w={w} />}
          <button className="ob-btn coral" onClick={next}><span className="t">{i + 1 < words.length ? '다음 단어' : lastLabel}</span></button>
        </div>
      )}
    </div>
  );
}
