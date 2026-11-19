// 내 탑과 순위: 대화 하나 = 브릭 1개, 하루 최대 3개 (어려운 대화 순)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quiet } from '../lib/api.js';
import { useStore } from '../lib/store.js';
import { LEVEL_SCALE } from '../content/build.js';
import { dayTone, WEEK_TONE, WEEK_NAME } from '../lib/progress.js';
import Brick from '../components/Brick.jsx';
import { Logo, Sheet } from '../components/ui.jsx';

function Pyramid({ bricks }) {
  // 아래(오래된 것)부터 위로. 레벨이 높을수록 작은 브릭
  let y = 0;
  const placed = bricks.map((b, i) => {
    const k = LEVEL_SCALE[b.level] || 1;
    const sz = { studs: 4, pitch: 22 * k, h: 16 * k, depth: 9 * k, studH: Math.max(3, 5 * k) };
    const out = { ...b, sz, bottom: y, i };
    y += sz.h;
    return out;
  });
  const height = Math.max(120, y + 40);
  return (
    <div style={{ position: 'relative', height, width: '100%' }} role="img" aria-label={`내 탑, 브릭 ${bricks.length}개`}>
      <div style={{ position: 'absolute', left: '50%', bottom: 0, width: 180, height: 10, marginLeft: -90, borderRadius: 3, background: '#E2CB9C', border: '2px solid #24324A' }} />
      {placed.map((b) => {
        const w = 4 * b.sz.pitch;
        const lift = 5 + b.sz.studH + b.sz.depth + b.sz.h;
        return (
          <div key={b.i} style={{ position: 'absolute', left: `calc(50% - ${w / 2 + 5 + b.sz.depth / 2}px)`, top: height - 10 - b.bottom - lift }}>
            <Brick tone={dayTone(b.day)} {...b.sz} />
          </div>
        );
      })}
    </div>
  );
}

export default function TowerPage() {
  const st = useStore();
  const [tower, setTower] = useState(null);
  const [scope, setScope] = useState('week');
  const [rank, setRank] = useState(null);
  const [info, setInfo] = useState(false);
  useEffect(() => {
    quiet('/tower').then(setTower);
  }, [st.user?.id]);
  useEffect(() => {
    if (!st.user) return;
    setRank(null);
    quiet('/ranking?scope=' + scope).then(setRank);
  }, [scope, st.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const bricks = tower?.bricks || [];
  const today = tower?.today ?? 0;
  return (
    <div className="page has-tabs">
      <div className="top-row"><Logo /></div>
      <div className="title-row">
        <h1>내 탑</h1>
        <button className="link-btn" onClick={() => setInfo(true)}>? 쌓이는 방법</button>
      </div>
      <p className="small muted">브릭 {bricks.length}개 · 공부한 날 {tower?.days ?? 0}일 · 오늘 {today}/3</p>
      <div className="plate" style={{ boxShadow: 'none' }}>
        {bricks.length ? <Pyramid bricks={bricks} /> : <p className="small" style={{ padding: '30px 0', textAlign: 'center' }}>대화를 하나 끝내면 첫 브릭이 쌓여요.</p>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }} className="small muted" aria-label="요일마다 브릭 색">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: WEEK_TONE[d], border: '1.5px solid #24324A' }} />
            {WEEK_NAME[d]}
          </span>
        ))}
      </div>

      <h2 style={{ fontSize: 21, marginTop: 8 }}>순위</h2>
      {!st.user ? (
        <div className="card">
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>순위는 가입하면 볼 수 있어요. 지금까지 쌓은 탑은 가입하면 그대로 옮겨 드려요.</p>
          <Link to="/login" className="ob-btn coral"><span className="t">로그인 · 회원가입</span></Link>
        </div>
      ) : (
        <>
          <div className="segs" role="group" aria-label="순위 기간">
            <button className={'seg' + (scope === 'week' ? ' on' : '')} aria-pressed={scope === 'week'} onClick={() => setScope('week')}>이번 주</button>
            <button className={'seg' + (scope === 'all' ? ' on' : '')} aria-pressed={scope === 'all'} onClick={() => setScope('all')}>전체</button>
          </div>
          <p className="small muted">브릭 개수로 매겨요. {scope === 'week' ? '이번 주는 월요일마다 새로 시작해요 (최대 21개).' : ''}</p>
          <div className="card" style={{ padding: '4px 14px' }}>
            {(rank?.rows || []).length === 0 && <p className="small" style={{ padding: '10px 0' }}>아직 순위가 없어요. 첫 번째가 되어 보세요!</p>}
            {(rank?.rows || []).map((r, i) => (
              <div key={i} className="set-row" style={{ minHeight: 44, fontWeight: r.me ? 700 : 400, background: r.me ? '#FFF3D6' : undefined }}>
                <span style={{ width: 28, fontFamily: 'var(--display)', fontSize: 18 }}>{r.rank}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nickname}{r.me ? ' (나)' : ''}</span>
                <span>{r.bricks}개</span>
              </div>
            ))}
          </div>
          {rank?.mine && !rank.rows.some((r) => r.me) && <p className="small">내 순위: {rank.mine.rank}위 · {rank.mine.bricks}개</p>}
        </>
      )}

      {info && (
        <Sheet title="브릭은 이렇게 쌓여요" onClose={() => setInfo(false)} labelId="tw-info">
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>대화 하나를 끝낼 때마다 브릭이 1개 쌓여요. 하루에 최대 3개까지예요.</p>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>하루에 대화를 4개 넘게 끝내면, 레벨이 높은 대화부터 3개만 쌓여요. 레벨이 높을수록 브릭은 얇고 작아요.</p>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>쉬는 날이 있어도 탑은 그대로예요. 요일마다 브릭 색이 달라요.</p>
          <button className="ob-btn coral wide" onClick={() => setInfo(false)}><span className="t">알겠어요</span></button>
        </Sheet>
      )}
    </div>
  );
}
