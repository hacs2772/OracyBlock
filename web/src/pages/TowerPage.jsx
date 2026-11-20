// 내 탑: 대화 하나 = 브릭 1개 (하루 최대는 쌓는 속도만큼). 순위는 공부한 날 수
// 쉬는 날이 이어지면 꼭대기 브릭에 금이 가고, 오래 쉬면 떨어져요. 빨리 쌓을수록 빨리 흔들려요 (lib/speed.js)
// 대화나 복습을 하나만 해도 금은 모두 사라져요
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quiet } from '../lib/api.js';
import { store, useStore } from '../lib/store.js';
import { speedOf, speedByCap, restEffect, crackRule, SPEEDS, SPEED_KEYS, MAX_FALL } from '../lib/speed.js';
import TowerAlert from '../components/TowerAlert.jsx';
import { LEVEL_SCALE } from '../content/build.js';
import { dayTone, WEEK_TONE, WEEK_NAME } from '../lib/progress.js';
import Brick from '../components/Brick.jsx';
import { TopBar, Sheet, Tabs, Question } from '../components/ui.jsx';
import { FlagTop, LanternTop, GOLD_PLATE } from '../components/Looks.jsx';
import { Guide } from '../components/Guides.jsx';
import { TOWER_SLIDES } from '../components/LandingSlides.jsx';

const dayNum = (s) => Math.round(new Date(s + 'T00:00:00Z').getTime() / 864e5);

/**
 * 공부한 날을 따라가며 탑을 쌓고, 쉰 날만큼 금 가고 떨어뜨려요. 지난번 쉰 동안은 그때의 속도로, 지금 쉬는 중이면 지금 속도로.
 * guardDays(방어권·쉬어가기권으로 지켜진 날)는 공부한 날처럼 쉰 날을 끊어 줘요 (브릭은 안 쌓여요)
 */
export function buildTower(bricks, activeDays, today, nowSpeed, guardDays = []) {
  const byDay = new Map();
  for (const b of bricks) {
    if (!byDay.has(b.day)) byDay.set(b.day, []);
    byDay.get(b.day).push(b);
  }
  const stack = [];
  let fallen = 0;
  let prev = null;
  let thenSpeed = null;
  const drop = (n) => {
    for (let k = 0; k < n && stack.length; k++) {
      stack.pop();
      fallen++;
    }
  };
  const guards = (guardDays || []).map((g) => (typeof g === 'string' ? g : g.day)).filter((g) => g < today);
  const days = [...new Set([...activeDays, ...guards])].sort();
  for (const d of days) {
    if (prev != null) drop(restEffect(dayNum(d) - dayNum(prev) - 1, speedOf(thenSpeed || nowSpeed)).fallen);
    const list = byDay.get(d) || [];
    stack.push(...list);
    for (const b of list) thenSpeed = speedByCap(b.cap) || thenSpeed;
    prev = d;
  }
  let rest = 0;
  let cracks = 0;
  let fallIn = null;
  let capped = false;
  if (prev != null) {
    rest = dayNum(today) - dayNum(prev) - 1; // 마지막으로 공부한 날과 오늘 사이에 통째로 쉰 날
    const e = restEffect(rest, speedOf(nowSpeed));
    drop(e.fallen);
    cracks = Math.min(e.cracks, stack.length);
    fallIn = cracks ? e.fallIn : null;
    capped = e.capped;
  }
  return { stack, fallen, rest, cracks, fallIn, capped };
}

function Pyramid({ stack, cracks, looks = [] }) {
  let y = 0;
  const placed = stack.map((b, i) => {
    const k = LEVEL_SCALE[b.level] || 1;
    const sz = { studs: 4, pitch: 22 * k, h: 16 * k, depth: 9 * k, studH: Math.max(3, 5 * k) };
    const out = { ...b, sz, bottom: y, i };
    y += sz.h;
    return out;
  });
  const height = Math.max(120, y + 40);
  return (
    <div style={{ position: 'relative', height, width: '100%' }} role="img" aria-label={`내 탑, ${stack.length}층${cracks ? `, 브릭 ${cracks}개에 금이 갔어요` : ''}`}>
      <div style={{ position: 'absolute', left: '50%', bottom: 0, width: 180, height: 10, marginLeft: -90, borderRadius: 3, background: looks.includes('gold') ? GOLD_PLATE : '#E2CB9C', border: '2px solid #24324A' }} />
      {(looks.includes('flag') || looks.includes('lantern')) && (
        <div className="tw-top" style={{ position: 'absolute', left: '50%', top: height - 10 - y - (looks.includes('lantern') ? 44 : 40), marginLeft: looks.includes('flag') ? -6 : -14 }}>
          {looks.includes('lantern') ? <LanternTop size={28} /> : <FlagTop size={40} />}
        </div>
      )}
      {placed.map((b) => {
        const w = 4 * b.sz.pitch;
        const lift = 5 + b.sz.studH + b.sz.depth + b.sz.h;
        const top = b.i >= placed.length - cracks;
        return (
          <div key={b.i} className={top ? 'b-wobble' : ''} style={{ position: 'absolute', left: `calc(50% - ${w / 2 + 5 + b.sz.depth / 2}px)`, top: height - 10 - b.bottom - lift }}>
            <Brick tone={dayTone(b.day)} crack={top} {...b.sz} />
          </div>
        );
      })}
    </div>
  );
}

export default function TowerPage() {
  const st = useStore();
  // 처음 들어오면 내 탑과 순위 팝업
  const [help, setHelp] = useState(() => !st.seenHelp?.tower);
  const closeHelp = () => {
    setHelp(false);
    store.set({ seenHelp: { ...(store.s.seenHelp || {}), tower: true } });
  };
  const [tower, setTower] = useState(null);
  const [prog, setProg] = useState(null);
  const [scope, setScope] = useState('week');
  const [rank, setRank] = useState(null);
  const [info, setInfo] = useState(false);
  useEffect(() => {
    quiet('/tower').then(setTower);
    quiet('/progress').then(setProg);
  }, [st.user?.id]);
  useEffect(() => {
    if (!st.user) return;
    setRank(null);
    quiet('/ranking?scope=' + scope).then(setRank);
  }, [scope, st.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sp = speedOf(prog?.speed);
  const t = tower ? buildTower(tower.bricks, tower.activeDays, tower.todayDate, prog?.speed, tower.guardDays) : { stack: [], fallen: 0, rest: 0, cracks: 0, fallIn: null };
  const days = tower?.activeDays?.length ?? 0;

  return (
    <div className="page has-tabs">
      <TopBar>
        <button className="icon-btn" onClick={() => setHelp(true)} aria-label="내 탑과 순위 보기"><Question /></button>
      </TopBar>
      {help && <Guide slides={TOWER_SLIDES} label="내 탑과 순위" doneLabel="알겠어요" skipLabel="닫기" onDone={closeHelp} />}
      <div className="card strong" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Brick tone="coral" shine studs={3} pitch={11} h={15} depth={7} studH={3} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 21, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.user ? st.user.nickname : '둘러보는 중'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
            <span className="chip dark">Lv{st.level}</span>
            <span className="chip">쌓는 속도 {sp.label}</span>
            <span className="chip">공부한 날 {days}일</span>
          </div>
        </div>
      </div>

      <div className="title-row" style={{ marginTop: 4 }}>
        <h1>내 탑 {t.stack.length}층</h1>
        <button className="link-btn" onClick={() => setInfo(true)}>? 쌓이는 방법</button>
      </div>
      <p className="small muted">오늘 {tower?.today ?? 0}/{sp.bricks}개 · 하루 최대 {sp.bricks}개 ({sp.label})</p>
      <TowerAlert tower={tower} speed={prog?.speed} />
      {t.cracks > 0 && (
        <p className="note warn">{t.rest}일 쉬어서 브릭 {t.cracks}개에 금이 갔어요. {t.fallIn === 1 ? '오늘 밤' : t.fallIn === 2 ? '내일 밤' : `${t.fallIn - 1}일 뒤 밤`}까지 공부하지 않으면 떨어져요. 대화나 복습 하나만 하면 다시 단단해져요.</p>
      )}
      <div className="plate" style={{ boxShadow: 'none' }}>
        {t.stack.length ? <Pyramid stack={t.stack} cracks={t.cracks} looks={tower?.looks || []} /> : <p className="small" style={{ padding: '30px 0', textAlign: 'center' }}>대화를 하나 끝내면 첫 브릭이 쌓여요.</p>}
      </div>
      {t.fallen > 0 && <p className="small muted">쉬는 동안 브릭 {t.fallen}개가 떨어졌어요. 한 번 쉴 때 떨어지는 건 최대 {MAX_FALL}개까지예요.</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }} className="small muted" aria-label="요일마다 브릭 색">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: WEEK_TONE[d], border: '1.5px solid #24324A' }} />
            {WEEK_NAME[d]}
          </span>
        ))}
      </div>

      <h2 style={{ fontSize: 21, marginTop: 8 }}>순위</h2>
      <p className="small muted">얼마나 꾸준히 했는지로 매겨요. 대화나 복습을 하나라도 한 날이 1일이에요.</p>
      {!st.user ? (
        <div className="card">
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>순위는 가입하면 볼 수 있어요. 지금까지 쌓은 탑은 가입하면 그대로 옮겨 드려요.</p>
          <Link to="/login" className="ob-btn coral wide"><span className="t">로그인 · 회원가입</span></Link>
        </div>
      ) : (
        <>
          <div className="segs" role="group" aria-label="순위 기간">
            <button className={'seg' + (scope === 'week' ? ' on' : '')} aria-pressed={scope === 'week'} onClick={() => setScope('week')}>이번 주</button>
            <button className={'seg' + (scope === 'all' ? ' on' : '')} aria-pressed={scope === 'all'} onClick={() => setScope('all')}>전체</button>
          </div>
          {scope === 'week' && <p className="small muted">이번 주는 월요일마다 새로 시작해요 (최대 7일).</p>}
          <div className="card" style={{ padding: '4px 14px' }}>
            {(rank?.rows || []).length === 0 && <p className="small" style={{ padding: '10px 0' }}>아직 순위가 없어요. 첫 번째가 되어 보세요!</p>}
            {(rank?.rows || []).map((r, i) => (
              <div key={i} className="set-row" style={{ minHeight: 44, fontWeight: r.me ? 700 : 400, background: r.me ? '#FFF3D6' : undefined }}>
                <span style={{ width: 28, fontFamily: 'var(--display)', fontSize: 18 }}>{r.rank}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nickname}{r.me ? ' (나)' : ''}</span>
                <span>{r.days}일</span>
              </div>
            ))}
          </div>
          {rank?.mine && !rank.rows.some((r) => r.me) && <p className="small">내 순위: {rank.mine.rank}위 · {rank.mine.days}일</p>}
        </>
      )}

      <Tabs />
      {info && (
        <Sheet title="탑은 이렇게 쌓여요" onClose={() => setInfo(false)} labelId="tw-info">
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>대화 하나를 끝낼 때마다 브릭이 1개 쌓여요. 하루에 쌓을 수 있는 수는 쌓는 속도에 따라 달라요. 더 많이 하면 레벨이 높은 대화부터 쌓여요.</p>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>빨리 쌓은 탑은 빨리 흔들려요. 쉬는 날이 이어지면 꼭대기 브릭에 금이 가고, 그대로 두면 떨어져요. 대화나 복습을 하나만 해도 금은 모두 사라져요.</p>
          <div className="card" style={{ padding: '4px 12px', marginTop: 8 }}>
            {SPEED_KEYS.map((k) => (
              <div key={k} className="set-row" style={{ minHeight: 44, fontSize: 13 }}>
                <b style={{ minWidth: 58 }}>{SPEEDS[k].label}</b>
                <span style={{ flex: 1 }}>하루 {SPEEDS[k].bricks}개 · {crackRule(SPEEDS[k])}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>순위는 브릭 수가 아니라 공부한 날 수로 매겨요. 쌓는 속도가 달라도 공평하게요.</p>
          <Link to="/me" className="ob-btn wide"><span className="t">쌓는 속도 바꾸기</span></Link>
          <button className="ob-btn coral wide" onClick={() => setInfo(false)}><span className="t">알겠어요</span></button>
        </Sheet>
      )}
    </div>
  );
}
