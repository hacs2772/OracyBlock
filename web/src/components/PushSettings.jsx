// 내 정보 › 알림 (concept 11-32): 켜기·끄기, 시간(7~10시), 받을 알림 종류. 하루 한 번까지만
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.js';
import { quiet } from '../lib/api.js';
import { pushState, currentSub, enablePush, disablePush, updatePush, DEFAULT_PUSH } from '../lib/push.js';
import { toast } from './ui.jsx';

const HOURS = [19, 20, 21, 22];
const KINDS = [
  ['day', '그날 아직 안 쌓았을 때'],
  ['crack', '탑에 금이 가거나 브릭이 떨어지기 전'],
  ['meet', '다시 만날 사람이 있을 때'],
];

export default function PushSettings() {
  const st = useStore();
  const pref = { ...DEFAULT_PUSH, ...(st.settings.push || {}) };
  const [on, setOn] = useState(!!pref.on);
  const [busy, setBusy] = useState(false);
  const state = pushState();

  // 이 기기가 정말 구독 중인지 서버와 맞춰요 (다른 기기에서 켠 것과 섞이지 않게)
  useEffect(() => {
    currentSub().then((sub) => {
      if (!sub) return setOn(false);
      quiet('/push/mine', { method: 'POST', body: { endpoint: sub.endpoint } }).then((m) => setOn(!!m?.on));
    });
  }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      if (on) {
        await disablePush();
        setOn(false);
        toast('알림을 껐어요');
      } else {
        await enablePush(pref);
        setOn(true);
        toast(`${pref.hour - 12}시에 알려 드릴게요`);
      }
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  };
  const change = (next) => updatePush({ hour: next.hour, kinds: next.kinds }).catch((e) => toast(e.message));

  return (
    <>
      <h2 className="set-h2">알림</h2>
      <div className="set-card">
        <div className="set-row">
          <span className="set-name">휴대폰 알림<small>하루 한 번까지만, 그날 공부했으면 안 보내요</small></span>
          <button className={'switch' + (on ? ' on' : '')} role="switch" aria-checked={on} aria-label="휴대폰 알림" disabled={busy || state !== 'ok'} onClick={toggle}><i /></button>
        </div>
        {state === 'ios-home' && <p className="small muted" style={{ padding: '0 0 10px' }}>아이폰은 이 사이트를 홈 화면에 추가한 뒤(공유 버튼 › 홈 화면에 추가), 홈 화면에서 열면 켤 수 있어요.</p>}
        {state === 'blocked' && <p className="small" style={{ padding: '0 0 10px', color: '#B9473A' }}>이 브라우저에서 알림을 막아 뒀어요. 휴대폰 설정에서 이 사이트 알림을 허락해 주세요.</p>}
        {state === 'no' && <p className="small muted" style={{ padding: '0 0 10px' }}>이 브라우저는 알림을 받을 수 없어요. 크롬이나 사파리로 열어 주세요.</p>}
        {on && (
          <>
            <div className="set-col">
              <span className="set-name" id="set-push-hour">알려 줄 시간 (저녁)</span>
              <div className="segs" role="group" aria-labelledby="set-push-hour">
                {HOURS.map((h) => (
                  <button key={h} className={'seg' + (pref.hour === h ? ' on' : '')} aria-pressed={pref.hour === h} onClick={() => change({ ...pref, hour: h })}>{h - 12}시</button>
                ))}
              </div>
            </div>
            <div className="set-col">
              <span className="set-name">이럴 때 알려 줘요</span>
              <div className="ps-kinds">
                {KINDS.map(([k, label]) => (
                  <label key={k} className="check">
                    <input type="checkbox" checked={pref.kinds.includes(k)} onChange={(e) => change({ ...pref, kinds: e.target.checked ? [...pref.kinds, k] : pref.kinds.filter((x) => x !== k) })} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
