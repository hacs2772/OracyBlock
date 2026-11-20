// 첫 대화 전 소리·마이크 확인: "소리 안 나요", "마이크가 안 돼요"로 막히지 않게 한 번 확인해요
// 내 정보 "소리·마이크 다시 확인"에서도 열 수 있어요
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
    <Sheet title={step === 'sound' ? '소리가 들리나요?' : '마이크도 확인해요'} onClose={onClose || finish} labelId="check-title">
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
              <button className="ob-btn" onClick={() => setStep('mic')}><span className="t">잘 들려요</span></button>
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
                <button className="ob-btn" onClick={() => setStep('mic')}><span className="t">소리 없이 할게요</span></button>
              </div>
            </>
          )}
        </div>
      )}
      {step === 'mic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
          {!canListen ? (
            <>
              <p className="note warn">이 브라우저는 마이크로 대답하기가 안 돼요. 대신 한글 발음으로 써서 대답하게 해 둘게요. 크롬이나 사파리에서는 말로도 할 수 있어요.</p>
              <button className="ob-btn coral" onClick={noMic}><span className="t">알겠어요</span></button>
            </>
          ) : (
            <>
              <p className="small muted">버튼을 누르고 <b>"콘니찌와"</b>라고 말해 보세요. 마이크 허용 창이 뜨면 허용을 눌러요.</p>
              <button className="ob-btn coral row" style={{ minHeight: 58 }} onClick={tryMic}>
                <Mic /><span className={'t' + (mic.state === 'listen' ? ' pulse' : '')}>{mic.state === 'listen' ? '듣고 있어요' : '눌러서 말하기'}</span>
              </button>
              {mic.state === 'ok' && <p className="note" style={{ background: '#DDF3EF', borderColor: '#29B6A5' }} role="status"><b>잘 들려요.</b> "{mic.text}"로 알아들었어요.</p>}
              {mic.state === 'error' && (
                <p className="note warn" role="status">
                  {mic.text}
                  <br />주소창 왼쪽의 자물쇠(또는 aA) → 마이크 → 허용으로 바꾼 뒤 다시 눌러 보세요.
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button className="ob-btn" onClick={noMic}><span className="t">말 없이 할게요</span><span className="s">글자로 대답</span></button>
                <button className="ob-btn coral" onClick={finish} disabled={mic.state === 'listen'}><span className="t">{mic.state === 'ok' ? '대화 시작' : '그냥 할게요'}</span></button>
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
