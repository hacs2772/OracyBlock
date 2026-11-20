// 따라 말하기 (복습에서 단어를 맞힌 뒤, 선택): 원어민 소리 듣고 → 내 목소리 녹음 → 번갈아 듣기
// 점수는 매기지 않아요. 녹음은 서버로 보내지 않고 이 화면에서만 들어요 (concept 11-7)
import { useEffect, useRef, useState } from 'react';
import { speak, stopSpeaking } from '../lib/speech.js';
import { Play, Mic } from './ui.jsx';

const MAX_MS = 3500;
export const canRecord = typeof window !== 'undefined' && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia;

/** 녹음한 소리를 막대 38개로 */
async function barsOf(blob) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = new AC();
    const buf = await ac.decodeAudioData(await blob.arrayBuffer());
    const d = buf.getChannelData(0);
    const n = 38;
    const step = Math.floor(d.length / n) || 1;
    const out = [];
    for (let i = 0; i < n; i++) {
      let m = 0;
      for (let j = i * step; j < (i + 1) * step && j < d.length; j += 16) m = Math.max(m, Math.abs(d[j]));
      out.push(m);
    }
    ac.close?.();
    const top = Math.max(...out, 0.01);
    return out.map((v) => v / top);
  } catch {
    return null;
  }
}

export default function Shadow({ w }) {
  const [state, setState] = useState('idle'); // idle · rec · done · nomic
  const [url, setUrl] = useState(null);
  const [bars, setBars] = useState(null);
  const rec = useRef(null);
  const audio = useRef(null);
  const timer = useRef(null);

  useEffect(() => () => {
    clearTimeout(timer.current);
    try { rec.current?.state === 'recording' && rec.current.stop(); } catch { /* 이미 멈춤 */ }
    audio.current?.pause();
  }, []);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  const playMe = () => new Promise((res) => {
    if (!url) return res();
    const a = audio.current || (audio.current = new Audio());
    a.src = url;
    a.onended = res;
    a.onerror = res;
    a.play().catch(res);
  });
  // 원어민 → 나 → 원어민
  const compare = async () => {
    stopSpeaking();
    await speak(w.say, 0.85);
    await playMe();
    await speak(w.say, 0.85);
  };

  const start = async () => {
    if (state === 'rec') return rec.current?.stop();
    stopSpeaking();
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState('nomic');
      return;
    }
    const chunks = [];
    const mr = new MediaRecorder(stream);
    rec.current = mr;
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    mr.onstop = async () => {
      clearTimeout(timer.current);
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
      setUrl(URL.createObjectURL(blob));
      setBars(await barsOf(blob));
      setState('done');
    };
    mr.start();
    setState('rec');
    timer.current = setTimeout(() => mr.state === 'recording' && mr.stop(), MAX_MS);
  };

  // 녹음이 끝나면 바로 번갈아 들려줘요
  useEffect(() => {
    if (state === 'done' && url) compare();
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!canRecord) return null;
  return (
    <div className="sh-wrap">
      <div className="sh-h">한 번 따라 말해 볼까요?</div>
      <div className="sh-row">
        <button className={'sh-mic' + (state === 'rec' ? ' rec' : '')} onClick={start} aria-label={state === 'rec' ? '녹음 멈추기' : `${w.ko} 따라 말하기 녹음`}>
          <Mic size={28} />
        </button>
        <div className="small" style={{ lineHeight: 1.5, minWidth: 0 }}>
          {state === 'rec' ? (
            <><b>듣고 있어요.</b> 다 말하면 한 번 더 눌러요.</>
          ) : state === 'nomic' ? (
            <span style={{ color: '#B9473A', fontWeight: 700 }}>마이크를 쓸 수 없어요. 건너뛰어도 괜찮아요.</span>
          ) : (
            <>누르고 <b>{w.ko}</b>{state === 'done' ? ' 다시 말해 봐요.' : '라고 말해요.'}<br /><span className="muted">녹음은 서버로 보내지 않아요.</span></>
          )}
        </div>
      </div>
      <div className="sh-lane">
        <b>원어민</b>
        <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => speak(w.say, 0.85)} aria-label={`원어민 ${w.ko} 듣기`}><span className="play-dot sm"><Play size={10} /></span></button>
        <span className="sh-word">{w.ko}</span>
      </div>
      <div className="sh-lane">
        <b>나</b>
        <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={playMe} disabled={!url} aria-label="내 목소리 듣기"><span className="play-dot sm coral"><Play size={10} /></span></button>
        {bars ? (
          <span className="sh-wave" aria-hidden="true">{bars.map((v, i) => <i key={i} style={{ height: 4 + Math.round(v * 22) }} />)}</span>
        ) : (
          <span className="small muted">{url ? '녹음했어요' : '아직 녹음 전이에요'}</span>
        )}
      </div>
      {url && <button className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={compare}>원어민 → 나 → 원어민 다시 듣기</button>}
    </div>
  );
}
