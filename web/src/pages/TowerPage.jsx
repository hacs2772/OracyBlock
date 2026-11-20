// 내 탑: 대화 하나 = 브릭 1개 (하루 최대는 쌓는 속도만큼). 순위는 공부한 날 수
// 이틀 넘게 쉬면 꼭대기 브릭에 금이 가고 흔들려요. 대화나 복습 하나면 다시 단단해져요. 일주일을 쉬면 브릭 1개가 떨어져요
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quiet } from '../lib/api.js';
import { useStore } from '../lib/store.js';
import { speedOf } from '../lib/speed.js';
import { LEVEL_SCALE } from '../content/build.js';
import { dayTone, WEEK_TONE, WEEK_NAME } from '../lib/progress.js';
import Brick from '../components/Brick.jsx';
import { TopBar, Sheet, Tabs } from '../components/ui.jsx';

const dayNum = (s) => Math.round(new Date(s + 'T00:00:00Z').getTime() / 864e5);

/** 공부한 날을 따라가며 탑을 쌓고, 오래 쉰 만큼 떨어뜨리고, 지금 쉬는 중이면 금이 가요 */
export function buildTower(bricks, activeDays, today) {
  const byDay = new Map();
  for (const b of bricks) {
    if (!byDay.has(b.day)) byDay.set(b.day, []);
    byDay.get(b.day).push(b);
  }
  const stack = [];
  let fallen = 0;
  let prev = null;
  const drop = (gap) => {
    for (let k = 0; k < Math.floor(gap / 7) && stack.length; k++) {
      stack.pop();
      fallen++;
    }
  };
  for (const d of activeDays) {
    if (prev != null) drop(dayNum(d) - dayNum(prev) - 1);
    stack.push(...(byDay.get(d) || []));
    prev = d;
  }
  let rest = 0;
  if (prev != null) {
    rest = dayNum(today) - dayNum(prev) - 1; // 마지막으로 공부한 날과 오늘 사이에 통째로 쉰 날
    drop(rest);
  }
  return { stack, fallen, rest, crack: rest >= 2 && stack.length > 0 };
}

function Pyramid({ stack, crack }) {
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
    <div style={{ position: 'relative', height, width: '100%' }} role="img" aria-label={`내 탑, ${stack.length}층${crack ? ', 꼭대기에 금이 갔어요' : ''}`}>
      <div style={{ position: 'absolute', left: '50%', bottom: 0, width: 180, height: 10, marginLeft: -90, borderRadius: 3, background: '#E2CB9C', border: '2px solid #24324A' }} />
      {placed.map((b) => {
        const w = 4 * b.sz.pitch;
        const lift = 5 + b.sz.studH + b.sz.depth + b.sz.h;
        const top = crack && b.i === placed.length - 1;
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
  const t = tower ? buildTower(tower.bricks, tower.activeDays, tower.todayDate) : { stack: [], fallen: 0, rest: 0, crack: false };
  const days = tower?.activeDays?.length ?? 0;

  return (
    <div className="page has-tabs">
      <TopBar />
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
      {t.crack && (
        <p className="note warn">{t.rest}일 쉬어서 꼭대기 브릭에 금이 갔어요. 대화나 복습 하나만 하면 다시 단단해져요.</p>
      )}
      <div className="plate" style={{ boxShadow: 'none' }}>
        {t.stack.length ? <Pyramid stack={t.stack} crack={t.crack} /> : <p className="small" style={{ padding: '30px 0', textAlign: 'center' }}>대화를 하나 끝내면 첫 브릭이 쌓여요.</p>}
      </div>
      {t.fallen > 0 && <p className="small muted">오래 쉬는 동안 브릭 {t.fallen}개가 떨어졌어요.</p>}
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
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>대화 하나를 끝낼 때마다 브릭이 1개 쌓여요. 하루에 쌓을 수 있는 수는 쌓는 속도에 따라 달라요 (느긋하게 1개 · 보통 3개 · 빠르게 5개). 더 많이 하면 레벨이 높은 대화부터 쌓여요.</p>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>이틀 넘게 쉬면 꼭대기 브릭에 금이 가고 흔들려요. 대화나 복습을 하나만 해도 다시 단단해져요. 일주일을 통째로 쉬면 브릭 1개가 떨어져요.</p>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>순위는 브릭 수가 아니라 공부한 날 수로 매겨요. 쌓는 속도가 달라도 공평하게요.</p>
          <Link to="/me" className="ob-btn wide"><span className="t">쌓는 속도 바꾸기</span></Link>
          <button className="ob-btn coral wide" onClick={() => setInfo(false)}><span className="t">알겠어요</span></button>
        </Sheet>
      )}
    </div>
  );
}
