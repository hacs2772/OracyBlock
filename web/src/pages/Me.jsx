// 내 정보: 계정 · 설정 · 도움말 · 의견 보내기
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, quiet } from '../lib/api.js';
import { store, useStore } from '../lib/store.js';
import { listen, canListen, MIC_ERRORS, speak, unlock, canSpeak, hasJaVoice } from '../lib/speech.js';
import Brick from '../components/Brick.jsx';
import { TopBar, Chevron, Mic, Sheet, toast, Tabs } from '../components/ui.jsx';
import { SPEEDS, SPEED_KEYS, speedOf, crackRule } from '../lib/speed.js';
import { Guide, INTRO, GAME } from '../components/Guides.jsx';
import { openContact } from '../components/Contact.jsx';

function Switch({ on, label, onClick }) {
  return (
    <button className={'switch' + (on ? ' on' : '')} role="switch" aria-checked={on} aria-label={label} onClick={onClick}>
      <i />
    </button>
  );
}
function Segs({ value, options, onPick, labelId }) {
  return (
    <div className="segs" role="group" aria-labelledby={labelId}>
      {options.map(([v, l]) => (
        <button key={v} className={'seg' + (v === value ? ' on' : '')} aria-pressed={v === value} onClick={() => onPick(v)}>{l}</button>
      ))}
    </div>
  );
}

export default function Me() {
  const st = useStore();
  const nav = useNavigate();
  const s = st.settings;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [mic, setMic] = useState({ state: 'idle', text: '' });
  const [guide, setGuide] = useState(null);
  const [leave, setLeave] = useState(false);
  const user = st.user;
  const [pref, setPref] = useState(null);
  useEffect(() => {
    quiet('/pref').then(setPref);
  }, [user?.id]);
  const changeSpeed = async (k) => {
    if (pref?.speed === k) return;
    try {
      setPref(await api('/pref', { method: 'PUT', body: { speed: k } }));
      toast(`쌓는 속도를 "${SPEEDS[k].label}"로 바꿨어요.`);
    } catch (e) {
      toast(e.message);
    }
  };
  const sp = speedOf(pref?.speed);
  const preValue = s.preWords == null ? sp.pre : s.preWords;

  const saveNick = async () => {
    const v = draft.trim();
    if (v.length < 2) return toast('닉네임은 두 글자 이상이에요.');
    try {
      const u = await api('/me', { method: 'PUT', body: { nickname: v } });
      store.set({ user: u });
      setEditing(false);
    } catch (e) {
      toast(e.message);
    }
  };
  const micTest = async () => {
    unlock();
    setMic({ state: 'listen', text: '' });
    try {
      const heard = await listen();
      setMic({ state: 'done', text: heard[0] });
    } catch (e) {
      setMic({ state: 'error', text: MIC_ERRORS[e?.code] || '마이크를 쓸 수 없어요.' });
    }
  };
  const logout = () => {
    store.set({ token: '', user: null });
    toast('로그아웃했어요.');
  };
  const withdraw = async () => {
    try {
      await api('/me', { method: 'DELETE' });
      store.set({ token: '', user: null });
      setLeave(false);
      toast('탈퇴했어요. 그동안 고마웠어요.');
      nav('/');
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <div className="page has-tabs">
      <TopBar me={false} />
      <h1 style={{ fontSize: 28 }}>내 정보</h1>

      {user ? (
        <div className="card strong" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Brick tone="coral" shine studs={4} pitch={11} h={15} depth={7} studH={3} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <label className="sr-only" htmlFor="me-nick">새 닉네임</label>
                <input id="me-nick" className="input" style={{ height: 44 }} value={draft} maxLength={12} onChange={(e) => setDraft(e.target.value)} autoComplete="nickname" />
                <button className="ob-btn sm" style={{ marginTop: 0, minHeight: 44 }} onClick={saveNick}><span className="t">저장</span></button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 22, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nickname}</span>
                <button className="link-btn" style={{ fontSize: 12 }} onClick={() => { setDraft(user.nickname); setEditing(true); }}>바꾸기</button>
              </div>
            )}
            <div className="small muted">{user.email}</div>
            <div style={{ display: 'flex', gap: 5, marginTop: 6 }}><span className="chip dark">Lv{st.level}</span>{user.role === 'ADMIN' && <span className="chip">관리자</span>}</div>
          </div>
        </div>
      ) : (
        <div className="card strong">
          <h2 style={{ fontSize: 21 }}>로그인하면 탑과 순위가 남아요</h2>
          <p className="small muted" style={{ marginTop: 4 }}>지금은 둘러보는 중이에요. 이 기기에서 한 대화는 가입하면 그대로 옮겨 드려요.</p>
          <Link to="/login" className="ob-btn coral wide"><span className="t">로그인 · 회원가입</span></Link>
        </div>
      )}

      {user?.role === 'ADMIN' && (
        <Link to="/admin" className="ob-btn yellow wide"><span className="t">관리자 화면</span><span className="s">몇 명이 들어왔는지, 얼마나 했는지</span></Link>
      )}

      <h2 className="set-h2">레벨</h2>
      <div className="set-card">
        <div className="set-row">
          <span className="set-name">지금 레벨 Lv{st.level}<small>여행 판의 레벨 카드에서 바꿔요</small></span>
          <Link className="ob-btn sm" to="/"><span style={{ fontSize: 13, fontWeight: 700 }}>바꾸기</span></Link>
        </div>
      </div>

      <h2 className="set-h2">쌓는 속도</h2>
      <div className="set-card" style={{ padding: '10px 12px' }}>
        <p className="small muted" style={{ marginBottom: 8 }}>하루에 얼마나 쌓을지 골라요. 빨리 쌓을수록 쉬는 날에 빨리 흔들려요. 레벨(얼마나 어렵게)과는 따로예요. 3일에 한 번 바꿀 수 있어요.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="radiogroup" aria-label="쌓는 속도">
          {SPEED_KEYS.map((k) => {
            const o = SPEEDS[k];
            const on = (pref?.speed || 'normal') === k;
            const locked = !on && !!pref?.nextChangeAt;
            return (
              <button key={k} className={'speed-opt' + (on ? ' on' : '')} role="radio" aria-checked={on} disabled={locked} onClick={() => changeSpeed(k)}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 19, minWidth: 64 }}>{o.label}</span>
                <span className="small" style={{ flex: 1 }}>하루 브릭 {o.bricks}개 · 복습 단어 {o.review}개<br /><span className="muted">{crackRule(o)}</span></span>
                {on && <span className="chip dark">지금</span>}
              </button>
            );
          })}
        </div>
        {pref?.nextChangeAt && <p className="small muted" style={{ marginTop: 8 }}>{new Date(pref.nextChangeAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}부터 다시 바꿀 수 있어요.</p>}
        <div className="set-col" style={{ paddingBottom: 2 }}>
          <span className="set-name" id="set-pre">대화 전에 단어 맞혀 보기<small>복습할 단어가 있을 때만 떠요. 건너뛸 수 있어요</small></span>
          <Segs labelId="set-pre" value={preValue} options={[[0, '끄기'], [3, '3개'], [5, '5개']]} onPick={(v) => store.setSettings({ preWords: v })} />
        </div>
      </div>

      <h2 className="set-h2">듣기</h2>
      <div className="set-card">
        <div className="set-col">
          <span className="set-name" id="set-speed">말 빠르기</span>
          <Segs labelId="set-speed" value={s.speed} options={[['slow', '느리게'], ['normal', '보통'], ['fast', '빠르게']]} onPick={(v) => { store.setSettings({ speed: v }); unlock(); speak('こんにちは'); }} />
        </div>
        <div className="set-row">
          <span className="set-name">한글 발음 보기<small>상대 말에 한글로 소리를 적어 줘요</small></span>
          <Switch on={s.kana} label="한글 발음 보기" onClick={() => store.setSettings({ kana: !s.kana })} />
        </div>
        <div className="set-col">
          <span className="set-name" id="set-ja">일본어 글자<small>한글 발음 아래에 작게 보여 줘요</small></span>
          <Segs labelId="set-ja" value={s.ja} options={[['faint', '흐리게'], ['clear', '진하게'], ['hide', '안 보기']]} onPick={(v) => store.setSettings({ ja: v })} />
        </div>
        {canSpeak && !hasJaVoice() && <p className="small" style={{ padding: '0 0 10px', color: '#B9473A' }}>이 기기에 일본어 목소리가 없을 수 있어요. 휴대폰 설정에서 일본어 음성을 받아 주세요.</p>}
      </div>

      <h2 className="set-h2">말하기</h2>
      <div className="set-card">
        <div className="set-row">
          <span className="set-name">조용한 곳에서<small>내 차례를 말하기 대신 글자로 시작해요</small></span>
          <Switch on={s.quiet} label="조용한 곳에서, 글자로 시작" onClick={() => store.setSettings({ quiet: !s.quiet })} />
        </div>
        <div className="set-col">
          <span className="set-name">마이크 시험<small>버튼을 누르고 "콘니찌와"라고 말해 보세요</small></span>
          {canListen ? (
            <button className="ob-btn row" style={{ minHeight: 50 }} onClick={micTest} disabled={mic.state === 'listen'}>
              <Mic size={22} /><span className={'t' + (mic.state === 'listen' ? ' pulse' : '')}>{mic.state === 'listen' ? '듣고 있어요' : '마이크 시험하기'}</span>
            </button>
          ) : (
            <p className="small" style={{ color: '#B9473A' }}>{MIC_ERRORS.unsupported}</p>
          )}
          {mic.state === 'done' && <p role="status" className="note" style={{ background: '#DDF3EF', borderColor: '#29B6A5' }}><b>잘 들려요.</b> "{mic.text}"로 알아들었어요.</p>}
          {mic.state === 'error' && <p role="status" className="note warn">{mic.text}</p>}
        </div>
      </div>

      <h2 className="set-h2">소리와 진동</h2>
      <div className="set-card">
        <div className="set-row">
          <span className="set-name">효과음<small>딸깍, 툭, 퉁 소리</small></span>
          <Switch on={s.sfx} label="효과음" onClick={() => store.setSettings({ sfx: !s.sfx })} />
        </div>
        <div className="set-row">
          <span className="set-name">진동<small>안드로이드 휴대폰에서만 돼요</small></span>
          <Switch on={s.vib} label="진동" onClick={() => store.setSettings({ vib: !s.vib })} />
        </div>
      </div>

      <h2 className="set-h2">도움말</h2>
      <div className="set-card">
        <Link className="go-row" to="/about">OracyBlock 소개 페이지<Chevron /></Link>
        <button className="go-row" onClick={() => setGuide('intro')}>처음 온 사람 안내 다시 보기<Chevron /></button>
        <button className="go-row" onClick={() => setGuide('game')}>게임 방법 다시 보기<Chevron /></button>
        <button className="go-row" onClick={openContact}>문의하기 · 의견 보내기<Chevron /></button>
        <Link className="go-row" to="/terms">이용약관<Chevron /></Link>
        <Link className="go-row" to="/privacy">개인정보 처리방침<Chevron /></Link>
      </div>

      {user && (
        <>
          <button className="ob-btn wide" style={{ marginTop: 18 }} onClick={logout}><span className="t">로그아웃</span></button>
          <div style={{ textAlign: 'center' }}><button className="link-btn small muted" onClick={() => setLeave(true)}>회원 탈퇴</button></div>
        </>
      )}

      <Tabs />
      {guide === 'intro' && <Guide slides={INTRO} label="처음 온 사람 안내" doneLabel="닫기" skipLabel="닫기" onDone={() => setGuide(null)} />}
      {guide === 'game' && <Guide slides={GAME} label="게임 방법" doneLabel="알겠어요" skipLabel="닫기" onDone={() => setGuide(null)} />}
      {leave && (
        <Sheet title="정말 탈퇴할까요?" onClose={() => setLeave(false)} labelId="leave-title">
          <p style={{ fontSize: 14, lineHeight: 1.55, marginTop: 6 }}>쌓은 탑, 대화 기록, 순위가 모두 지워지고 되돌릴 수 없어요.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            <button className="ob-btn" onClick={() => setLeave(false)}><span className="t">그만두기</span></button>
            <button className="ob-btn" style={{ background: '#F3D4CF' }} onClick={withdraw}><span className="t" style={{ color: '#9B2A20' }}>탈퇴하기</span></button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
