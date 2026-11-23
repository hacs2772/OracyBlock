// 첫 대화 전 소리 확인: "소리 안 나요"로 막히지 않게 한 번 확인해요 (말하기는 뺐어서 마이크 확인은 없어요)
// 내 정보 "소리 다시 확인"에서도 열 수 있어요
import { useState } from 'react';
import { speak, canSpeak, hasJaVoice, listen, canListen, stopListening, MIC_ERRORS, unlock } from '../lib/speech.js';
import { store } from '../lib/store.js';
import { Sheet, Mic, Play } from './ui.jsx';

const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

export default function SoundCheck({ onDone, onClose }) {
  const [step, setStep] = useState('sound'); // sound → mic
  const [heard, setHeard] = useState(null); // null | 'yes' | 'no'
  const [mic, setMic] = useState({ state: 'idle', text: '' });
  const finish = () => {
    store.set({ seenCheck: true });
    onDone?.();
  };
  const play = () => {
    unlock();
    speak('こんにちは。よろしくね。', 0.9);
  };
  const tryMic = async () => {
    unlock();
    if (mic.state === 'listen') return stopListening();
    setMic({ state: 'listen', text: '' });
    try {
      const alts = await listen({ maxMs: 6000 });
      setMic({ state: 'ok', text: alts[0] });
    } catch (e) {
      setMic({ state: 'error', text: MIC_ERRORS[e?.code] || '마이크를 쓸 수 없어요.' });
    }
  };
  const noMic = () => {
    store.setSettings({ quiet: true });
    finish();
  };

  return (
    <Sheet title="소리가 들리나요?" onClose={onClose || finish} labelId="check-title">
      {step === 'sound' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
          <p className="small muted">대화는 일본어 소리를 듣고 시작해요. 무음 모드를 끄고 눌러 보세요.</p>
          {!canSpeak ? (
            <p className="note warn">이 브라우저는 소리를 낼 수 없어요. 크롬이나 사파리로 열어 주세요. 소리 없이도 한글 발음을 보며 할 수 있어요.</p>
          ) : (
            <button className="ob-btn coral row" style={{ minHeight: 58 }} onClick={play}>
              <span className="play-dot"><Play /></span><span className="t">소리 들어 보기</span>
            </button>
          )}
          {canSpeak && !hasJaVoice() && <p className="note warn">이 기기에 일본어 목소리가 없을 수 있어요. 아래 방법으로 받아 주세요.</p>}
          {heard !== 'no' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button className="ob-btn" onClick={finish}><span className="t">잘 들려요</span></button>
              <button className="ob-btn" onClick={() => setHeard('no')}><span className="t">안 들려요</span></button>
            </div>
          ) : (
            <>
              <div className="note" style={{ fontSize: 13, lineHeight: 1.6 }}>
                <b>이렇게 해 보세요</b>
                <br />1. 휴대폰 옆의 무음 스위치(벨소리)를 꺼요
                <br />2. 소리 크기를 올려요
                {isIOS ? (
                  <><br />3. 설정 → 손쉬운 사용 → 읽기 및 말하기 → 음성 → 일본어 목소리 받기</>
                ) : (
                  <><br />3. 설정 → 일반 → 텍스트 음성 변환(TTS) → 언어를 일본어로, 음성 데이터 받기</>
                )}
                <br />4. 카톡 안에서 열었다면 크롬·사파리로 다시 열기
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button className="ob-btn" onClick={play}><span className="t">다시 들어 보기</span></button>
                <button className="ob-btn" onClick={finish}><span className="t">소리 없이 할게요</span></button>
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
