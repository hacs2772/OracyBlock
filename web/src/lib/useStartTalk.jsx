// 대화 시작하기 (홈의 큰 버튼, 학습의 장소 칸이 같이 써요)
// 처음 "시작": 게임 방법 3장 → 소리 확인 → (복습할 단어가 있으면) 단어 맞혀 보기 → 대화. 하던 대화는 바로 이어서
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quiet } from './api.js';
import { store, useStore } from './store.js';
import { unlock } from './speech.js';
import { speedOf } from './speed.js';
import { loadResume } from './resume.js';
import { Sheet } from '../components/ui.jsx';
import WordQuiz, { BigWordRow } from '../components/WordQuiz.jsx';
import SoundCheck from '../components/SoundCheck.jsx';
import { Guide, GAME } from '../components/Guides.jsx';

export function useStartTalk(prog) {
  const st = useStore();
  const nav = useNavigate();
  const [guide, setGuide] = useState(null); // { next: 대화 id } 이면 다 본 뒤 그 대화로
  const [check, setCheck] = useState(null);
  const [pre, setPre] = useState(null); // 대화 전 단어 맞혀 보기 { talkId, words, done }
  const sp = speedOf(prog?.speed);
  const preCount = st.settings.preWords == null ? sp.pre : st.settings.preWords;

  const go = (id) => {
    unlock();
    nav('/talk/' + id);
  };
  const start = async (id) => {
    unlock();
    if (!store.s.seenGame) return setGuide({ next: id });
    if (!store.s.seenCheck) return setCheck({ next: id });
    if (loadResume(id)) return go(id);
    if (!preCount || !prog?.wordsDue) return go(id);
    const words = await quiet('/words');
    const today = new Date().toLocaleDateString('sv-SE');
    const due = (words || []).filter((w) => w.dueDay <= today).slice(0, preCount);
    if (!due.length) return go(id);
    setPre({ talkId: id, words: due, done: null });
    return null;
  };

  const overlays = (
    <>
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
    </>
  );
  return { start, showGuide: () => setGuide({ next: null }), overlays };
}
