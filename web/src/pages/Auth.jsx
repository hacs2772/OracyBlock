// 로그인 · 회원가입 (이메일 + 비밀번호). 가입 없이 둘러보기도 가능
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, quiet, setLogin } from '../lib/api.js';
import { SPEEDS, SPEED_KEYS, crackRule } from '../lib/speed.js';
import Brick from '../components/Brick.jsx';
import { Close, toast } from '../components/ui.jsx';

export default function Auth() {
  const nav = useNavigate();
  const [tab, setTab] = useState('join');
  const [f, setF] = useState({ nick: '', mail: '', pw: '', agree: false, speed: 'normal' });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const join = tab === 'join';
  const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.mail.trim());
  const nickOk = f.nick.trim().length >= 2;
  const pwOk = join ? f.pw.length >= 8 : f.pw.length > 0;
  const bad = { nick: tried && join && !nickOk, mail: tried && !mailOk, pw: tried && !pwOk, agree: tried && join && !f.agree };

  const submit = async (e) => {
    e.preventDefault();
    setTried(true);
    setErr('');
    if (!mailOk || !pwOk || (join && (!nickOk || !f.agree))) return;
    setBusy(true);
    try {
      const res = await api(join ? '/auth/signup' : '/auth/login', {
        method: 'POST',
        body: join ? { nickname: f.nick.trim(), email: f.mail.trim(), password: f.pw } : { email: f.mail.trim(), password: f.pw },
      });
      setLogin(res);
      if (join) await quiet('/pref', { method: 'PUT', body: { speed: f.speed } });
      toast(join ? `${res.user.nickname} 님, 환영해요!` : '로그인했어요.');
      nav('/');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };
  const set = (k) => (e) => setF({ ...f, [k]: k === 'agree' ? e.target.checked : e.target.value });

  return (
    <div className="page">
      <div className="talk-top">
        <Link className="icon-btn" to="/" aria-label="닫고 학습으로"><Close /></Link>
        <span className="logo-text" style={{ fontSize: 22 }}>Oracy<b>Block</b></span>
        <span style={{ width: 44 }} aria-hidden="true" />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 6 }}>
        <div style={{ position: 'relative', width: 64, height: 68, flexShrink: 0 }} aria-hidden="true">
          <div style={{ position: 'absolute', left: 0, top: 32 }}><Brick tone="mint" pitch={11} h={13} depth={7} studH={3} /></div>
          <div style={{ position: 'absolute', left: 0, top: 19 }}><Brick tone="coral" shine pitch={11} h={13} depth={7} studH={3} /></div>
          <div style={{ position: 'absolute', left: 0, top: 6 }}><Brick tone="yellow" pitch={11} h={13} depth={7} studH={3} /></div>
        </div>
        <div>
          <h1 style={{ fontSize: 27, lineHeight: 1.15 }}>{join ? '가입하고 내 탑을 쌓아요' : '다시 만나서 반가워요'}</h1>
          <p className="small muted" style={{ marginTop: 3, fontSize: 13 }}>대화 기록과 내 탑, 순위가 저장돼요.</p>
        </div>
      </div>
      <div className="seg2" role="tablist" aria-label="로그인 또는 회원가입" style={{ marginTop: 10 }}>
        <button role="tab" aria-selected={!join} className={!join ? 'on' : ''} onClick={() => { setTab('login'); setTried(false); setErr(''); }}>로그인</button>
        <button role="tab" aria-selected={join} className={join ? 'on' : ''} onClick={() => { setTab('join'); setTried(false); setErr(''); }}>회원가입</button>
      </div>
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
        {join && (
          <div className="field">
            <label htmlFor="au-nick">닉네임</label>
            <input id="au-nick" className={'input' + (bad.nick ? ' bad' : '')} value={f.nick} onChange={set('nick')} maxLength={12} autoComplete="nickname" placeholder="예: 오사카가자" />
            <p className={bad.nick ? 'err' : 'help'}>{bad.nick ? '두 글자 이상 적어 주세요.' : '순위에 보이는 이름이에요. 나중에 바꿀 수 있어요.'}</p>
          </div>
        )}
        <div className="field">
          <label htmlFor="au-mail">이메일</label>
          <input id="au-mail" type="email" inputMode="email" className={'input' + (bad.mail ? ' bad' : '')} value={f.mail} onChange={set('mail')} autoComplete="email" placeholder="you@example.com" />
          {bad.mail && <p className="err">{f.mail ? '이메일 모양이 아니에요. 다시 확인해 주세요.' : '이메일을 적어 주세요.'}</p>}
        </div>
        <div className="field">
          <label htmlFor="au-pw">비밀번호</label>
          <input id="au-pw" type="password" className={'input' + (bad.pw ? ' bad' : '')} value={f.pw} onChange={set('pw')} autoComplete={join ? 'new-password' : 'current-password'} />
          {join ? <p className={bad.pw ? 'err' : 'help'}>{bad.pw ? '8자 이상으로 적어 주세요.' : '8자 이상'}</p> : bad.pw && <p className="err">비밀번호를 적어 주세요.</p>}
        </div>
        {join && (
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>하루에 얼마나 쌓을까요?</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SPEED_KEYS.map((k) => (
                <button type="button" key={k} className={'speed-opt' + (f.speed === k ? ' on' : '')} aria-pressed={f.speed === k} onClick={() => setF({ ...f, speed: k })}>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 18, minWidth: 64 }}>{SPEEDS[k].label}</span>
                  <span className="small" style={{ flex: 1 }}>하루 브릭 {SPEEDS[k].bricks}개 · 복습 {SPEEDS[k].review}개<br /><span className="muted">{crackRule(SPEEDS[k])}</span></span>
                </button>
              ))}
            </div>
            <p className="help">빨리 쌓을수록 쉬는 날에 빨리 흔들려요. 대화나 복습 하나면 금은 사라져요. 나중에 내 정보에서 바꿀 수 있어요 (3일에 한 번).</p>
          </fieldset>
        )}
        {join && (
          <>
            <label className="check"><input type="checkbox" checked={f.agree} onChange={set('agree')} /><span><Link to="/terms">이용약관</Link>과 <Link to="/privacy">개인정보 처리방침</Link>에 동의해요 (필수)</span></label>
            {bad.agree && <p className="err" style={{ marginTop: -6 }}>동의해야 가입할 수 있어요.</p>}
          </>
        )}
        {err && <p className="err" role="alert">{err}</p>}
        <button type="submit" className="ob-btn coral" disabled={busy} style={{ marginTop: 10 }}><span className="t">{join ? '가입하고 시작하기' : '로그인'}</span></button>
        {!join && <p className="small muted" style={{ textAlign: 'center' }}>비밀번호를 잊었다면 오른쪽 아래 "문의"로 알려 주세요.</p>}
      </form>
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="small muted" aria-hidden="true">
          <span style={{ flex: 1, height: 2, background: '#EADFCB' }} />또는<span style={{ flex: 1, height: 2, background: '#EADFCB' }} />
        </div>
        <Link className="ob-btn wide" to="/" style={{ marginTop: 16 }}><span className="t">가입 없이 둘러보기</span><span className="s">대화는 해 볼 수 있어요. 탑과 순위는 남지 않아요.</span></Link>
      </div>
    </div>
  );
}
