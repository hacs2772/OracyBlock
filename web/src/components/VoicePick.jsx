// 목소리 고르기 (concept 11-24): 이 휴대폰에 있는 일본어 목소리 중 하나. 누르면 들어 보고 바로 바뀌어요
import { useEffect, useState } from 'react';
import { store, useStore } from '../lib/store.js';
import { jaVoices, voiceInfo, onVoices, speak, unlock, canSpeak, iosNeedsBetterVoice } from '../lib/speech.js';
import { Play } from './ui.jsx';

const SAMPLE = 'こんにちは。日本は初めてですか？';

export default function VoicePick() {
  const st = useStore();
  const [list, setList] = useState(() => jaVoices());
  useEffect(() => onVoices(() => setList(jaVoices())), []);
  if (!canSpeak || !list.length) return null;
  const want = st.settings.voice;
  const nowUri = (want && list.some((v) => v.voiceURI === want) ? want : '') || '';
  const pick = (uri, v) => {
    store.setSettings({ voice: uri });
    unlock();
    speak(SAMPLE, 1, v || null);
  };
  const rows = [{ uri: '', label: '자동', sub: `추천: ${voiceInfo(list[0]).name}`, v: null }, ...list.slice(0, 6).map((v) => {
    const i = voiceInfo(v);
    return { uri: v.voiceURI, label: i.name, sub: [i.tag, i.online ? '인터넷 필요' : ''].filter(Boolean).join(' · '), v };
  })];
  return (
    <div className="set-col">
      <span className="set-name" id="set-voice">목소리<small>눌러서 들어 보고 마음에 드는 걸 골라요</small></span>
      <div className="vp-list" role="radiogroup" aria-labelledby="set-voice">
        {rows.map((r) => {
          const on = r.uri === nowUri;
          return (
            <button key={r.uri || 'auto'} className={'vp-row' + (on ? ' on' : '')} role="radio" aria-checked={on} onClick={() => pick(r.uri, r.v)}>
              <span className="play-dot sm"><Play size={10} /></span>
              <span className="vp-t"><b>{r.label}</b>{r.sub && <span className="small muted">{r.sub}</span>}</span>
              {on && <span className="chip dark">지금</span>}
            </button>
          );
        })}
      </div>
      {iosNeedsBetterVoice() && (
        <p className="small muted" style={{ marginTop: 8, lineHeight: 1.5 }}>
          더 자연스러운 목소리: 아이폰 설정 › 손쉬운 사용 › 읽기 및 말하기 › 음성 › 일본어에서 "향상된" 목소리를 받은 뒤 이 화면을 다시 열어 주세요.
        </p>
      )}
    </div>
  );
}
