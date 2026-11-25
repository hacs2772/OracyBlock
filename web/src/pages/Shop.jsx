// 상점·미션 (시안 B, concept 11-21): 위에 모은 브릭, [미션] [상점] 바꿔 보기
// 미션을 다 하면 [받기] → 브릭. 브릭으로 방어권 · 쉬어가기권 · 꾸미기를 사요
import { useEffect, useState } from 'react';
import { quiet, api } from '../lib/api.js';
import { TopBar, Tabs, Sheet, toast, Question } from '../components/ui.jsx';
import { store, useStore } from '../lib/store.js';
import { Guide } from '../components/Guides.jsx';
import { SHOP_SLIDES } from '../components/LandingSlides.jsx';
import Brick from '../components/Brick.jsx';
import { BrickCoin, ItemArt } from '../components/Looks.jsx';

const N = '#24324A';
const TONE = { talk: '#FF7967', review: '#FFC857', straight: '#29B6A5', newplace: '#A792E0', fix: '#F49AC1', week5: '#6BB8E8' };
const WEEK_NAME = ['일', '월', '화', '수', '목', '금', '토'];

/** 진행 표시: 막대 대신 작은 브릭이 채워져요 */
function Fill({ n, of, tone }) {
  return (
    <span className="sp-fill" aria-hidden="true">
      {Array.from({ length: of }, (_, i) => <i key={i} style={i < n ? { background: tone } : null} />)}
    </span>
  );
}

/** 상점 칸: 쓰는 물건 · 꼭대기 · 받침판 · 배경 (꾸미기는 자리마다 하나만, concept 11-38) */
const SECTIONS = [
  [null, '쓰는 물건', '탑을 지켜 줘요'],
  ['top', '꼭대기 장식', '하나만 달 수 있어요'],
  ['base', '받침판', '하나만 깔 수 있어요'],
  ['bg', '배경', '하나만 깔 수 있어요'],
];

function MissionRow({ m, onClaim, busy }) {
  const done = m.n >= m.target;
  const tone = TONE[m.id] || '#FFC857';
  return (
    <div className="sp-row">
      <span className="sp-ic" style={{ background: done ? '#29B6A5' : tone }}>
        {done ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={N} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        ) : (
          <Brick tone="white" studs={2} pitch={9} h={8} depth={4} studH={3} />
        )}
      </span>
      <div className="sp-txt">
        <b>{m.title}</b>
        <span className="small"><Fill n={m.n} of={m.target} tone={tone} /> {m.n}/{m.target}{m.kind === 'week' ? '일' : ''}</span>
      </div>
      {m.claimed ? (
        <span className="small muted sp-got">받았어요</span>
      ) : done ? (
        <button className="ob-btn sm coral sp-get" disabled={busy} onClick={() => onClaim(m)}><span className="t"><BrickCoin size={14} /> +{m.reward} 받기</span></button>
      ) : (
        <span className="sp-reward" aria-label={`보상 브릭 ${m.reward}개`}><BrickCoin size={14} /> +{m.reward}</span>
      )}
    </div>
  );
}

export default function Shop() {
  const st = useStore();
  const [d, setD] = useState(null);
  const [seg, setSeg] = useState('mission');
  const [busy, setBusy] = useState(false);
  const [buying, setBuying] = useState(null); // 살 물건 확인
  const [resting, setResting] = useState(false); // 쉬어가기권 날짜 고르기
  // 처음 들어오면 상점·미션 안내 팝업 (concept 11-33)
  const [help, setHelp] = useState(() => !st.seenHelp?.shop);
  const closeHelp = () => {
    setHelp(false);
    store.set({ seenHelp: { ...(store.s.seenHelp || {}), shop: true } });
  };

  const load = () => quiet('/shop').then((x) => x && setD(x));
  useEffect(() => {
    load();
  }, [st.user?.id]);

  const run = async (path, body, msg) => {
    setBusy(true);
    try {
      const x = await api('/shop/' + path, { method: 'POST', body });
      setD(x);
      if (msg) toast(msg);
      return true;
    } catch (e) {
      toast(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const missions = d?.missions || [];
  const daily = missions.filter((m) => m.kind === 'day');
  const weekly = missions.filter((m) => m.kind === 'week');
  const items = d?.items || [];
  const readyN = missions.filter((m) => !m.claimed && m.n >= m.target).length;
  const restDays = (d?.guardDays || []).filter((g) => g.kind === 'rest' && g.day >= (d?.today || ''));
  const shieldDays = (d?.guardDays || []).filter((g) => g.kind === 'shield');
  const nextDays = Array.from({ length: 8 }, (_, i) => {
    const t = new Date(Date.now() + i * 864e5);
    return { day: t.toLocaleDateString('sv-SE'), label: i === 0 ? '오늘' : i === 1 ? '내일' : `${t.getMonth() + 1}/${t.getDate()} (${WEEK_NAME[t.getDay()]})` };
  });

  return (
    <div className="page has-tabs">
      <TopBar>
        <button className="icon-btn" onClick={() => setHelp(true)} aria-label="상점·미션 안내 보기"><Question /></button>
      </TopBar>
      {help && <Guide slides={SHOP_SLIDES} label="상점·미션" doneLabel="알겠어요" skipLabel="닫기" onDone={closeHelp} />}
      <h1 className="learn-h1">상점·미션</h1>

      <div className="card strong sp-wallet">
        <BrickCoin size={34} />
        <div style={{ minWidth: 0 }}>
          <div className="small muted">모은 브릭</div>
          <div className="sp-num">{d ? d.bricks : '-'}</div>
        </div>
        <span className="small" style={{ marginLeft: 'auto', textAlign: 'right', lineHeight: 1.4 }}>미션을 끝내면<br />브릭을 받아요</span>
      </div>

      <div className="segs" role="group" aria-label="보기">
        <button className={'seg' + (seg === 'mission' ? ' on' : '')} aria-pressed={seg === 'mission'} onClick={() => setSeg('mission')}>
          미션{readyN > 0 && <span className="sp-dot" aria-label={`받을 보상 ${readyN}개`}>{readyN}</span>}
        </button>
        <button className={'seg' + (seg === 'shop' ? ' on' : '')} aria-pressed={seg === 'shop'} onClick={() => setSeg('shop')}>상점</button>
      </div>

      {seg === 'mission' ? (
        <>
          <div className="sp-h"><h2>오늘의 미션</h2><span className="small muted">자정에 바뀌어요</span></div>
          <div className="card sp-list">{daily.map((m) => <MissionRow key={m.id} m={m} busy={busy} onClaim={(x) => run('claim', { id: x.id }, `브릭 ${x.reward}개를 받았어요`)} />)}</div>
          <div className="sp-h"><h2>이번 주 미션</h2><span className="small muted">월요일마다 새로</span></div>
          <div className="card sp-list">{weekly.map((m) => <MissionRow key={m.id} m={m} busy={busy} onClaim={(x) => run('claim', { id: x.id }, `브릭 ${x.reward}개를 받았어요`)} />)}</div>
          {!st.user && <p className="small muted">가입하지 않아도 모을 수 있어요. 가입하면 모은 브릭과 물건이 계정으로 옮겨져요.</p>}
        </>
      ) : (
        <>
          <div className="sp-h"><h2>상점</h2><span className="small muted">모은 꾸미기 {items.filter((x) => x.look && x.qty > 0).length}/{items.filter((x) => x.look).length}</span></div>
          {SECTIONS.map(([slot, title, hint]) => {
            const list = items.filter((it) => (it.slot || null) === slot);
            if (!list.length) return null;
            return (
              <section key={slot || 'use'} className="sp-sec">
                <div className="sp-h sm"><h3>{title}</h3><span className="small muted">{hint}</span></div>
                <div className="sp-grid">
                  {list.map((it) => (
                    <div key={it.id} className="card sp-item">
                      <div className="sp-art"><ItemArt id={it.id} /></div>
                      <b>{it.name}</b>
                      <span className="small muted">{it.desc}</span>
                      {!it.look && it.qty > 0 && <span className="chip done" style={{ alignSelf: 'flex-start' }}>가지고 있어요 {it.qty}개</span>}
                      {it.id === 'rest' && it.qty > 0 && <button className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setResting(true)}>쉬는 날 고르기</button>}
                      {it.id === 'rest' && restDays.length > 0 && <span className="small">쉬는 날: {restDays.map((g) => g.day.slice(5).replace('-', '/')).join(', ')}</span>}
                      {it.id === 'shield' && shieldDays.length > 0 && <span className="small">지켜 준 날 {shieldDays.length}일</span>}
                      {it.look && it.qty > 0 ? (
                        <button className={'ob-btn sm sp-buy' + (it.equipped ? ' on' : '')} disabled={busy} onClick={() => run('equip', { id: it.id, on: !it.equipped }, it.equipped ? '내 탑에서 뺐어요' : it.slot === 'top' ? '내 탑에 달았어요' : '내 탑에 깔았어요')}>
                          <span className="t">{it.equipped ? '쓰는 중' : it.slot === 'top' ? '달기' : '깔기'}</span>
                        </button>
                      ) : (
                        <button className="ob-btn sm sp-buy" disabled={busy || (d && d.bricks < it.price)} onClick={() => setBuying(it)} aria-label={`${it.name}, 브릭 ${it.price}개로 사기`}>
                          <span className="t"><BrickCoin size={14} /> {it.price}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
          <p className="small muted">베타 동안 가격은 바뀔 수 있어요.</p>
        </>
      )}

      {buying && (
        <Sheet title={buying.name} onClose={() => setBuying(null)} labelId="buy-title">
          <div className="sp-art" style={{ marginTop: 6 }}><ItemArt id={buying.id} /></div>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>{buying.desc}</p>
          <p className="small muted">브릭 {buying.price}개를 써요. 남는 브릭 {Math.max(0, (d?.bricks || 0) - buying.price)}개</p>
          <button className="ob-btn coral wide" style={{ marginTop: 12 }} disabled={busy} onClick={async () => { if (await run('buy', { id: buying.id }, `${buying.name}을 샀어요`)) setBuying(null); }}>
            <span className="t">브릭 {buying.price}개로 사기</span>
          </button>
        </Sheet>
      )}
      {resting && (
        <Sheet title="쉬는 날 고르기" onClose={() => setResting(false)} labelId="rest-title">
          <p className="small muted" style={{ marginTop: 4 }}>고른 날은 공부하지 않아도 탑에 금이 가지 않아요. 쉬어가기권 1장을 써요.</p>
          <div className="sp-days">
            {nextDays.map((x) => {
              const taken = (d?.guardDays || []).some((g) => g.day === x.day);
              return (
                <button key={x.day} className="ob-btn sm" disabled={busy || taken} onClick={async () => { if (await run('rest', { day: x.day }, `${x.label}: 쉬어 가는 날로 정했어요`)) setResting(false); }}>
                  <span className="t">{taken ? `${x.label} 쉼` : x.label}</span>
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
      <Tabs />
    </div>
  );
}
