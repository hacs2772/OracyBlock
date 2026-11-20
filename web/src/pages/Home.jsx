// 홈 (시안 B, concept 11-16): 지금 할 것 하나만 크게
// 큰 칸 = 다음 대화 + [대화 시작] · 작은 한 줄 = 오늘 탑 n층 · 복습 단어 · 고칠 곳 · 미션 보상 · 작은 내 탑 + 이번 주 순위 · 사용 방법 / 내 탑과 순위
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quiet } from '../lib/api.js';
import { useStore } from '../lib/store.js';
import { freshFixes, nextTalk, dayTone } from '../lib/progress.js';
import { speedOf } from '../lib/speed.js';
import { loadResume } from '../lib/resume.js';
import { useStartTalk } from '../lib/useStartTalk.jsx';
import { TopBar, Question, Stack, Tabs } from '../components/ui.jsx';
import Face, { FACE_OF } from '../components/Face.jsx';
import TowerAlert from '../components/TowerAlert.jsx';
import { Guide } from '../components/Guides.jsx';
import { TALK_SLIDES, TOWER_SLIDES, REVIEW_SLIDES } from '../components/LandingSlides.jsx';
import { HelpBricks } from './Landing.jsx';
import { buildTower } from './TowerPage.jsx';
import { josa } from './Talk.jsx';

const MINI = { studs: 4, pitch: 9, h: 11, depth: 6, studH: 3 };

export default function Home() {
  const st = useStore();
  const [prog, setProg] = useState(null);
  const [fixes, setFixes] = useState([]);
  const [tower, setTower] = useState(null);
  const [rank, setRank] = useState(null);
  const [shop, setShop] = useState(null);
  const [pop, setPop] = useState(null); // 'talk' | 'tower'
  const level = st.level;

  useEffect(() => {
    quiet('/progress').then((p) => p && setProg(p));
    quiet('/fixes').then((f) => f && setFixes(freshFixes(f)));
    quiet('/tower').then(setTower);
    quiet('/shop').then(setShop);
    if (st.user) quiet('/ranking?scope=week').then(setRank);
  }, [st.user?.id]);

  const { start, showGuide, overlays } = useStartTalk(prog);
  const next = nextTalk(level, prog?.plays);
  const resuming = next && loadResume(next.id);
  const sp = speedOf(prog?.speed);
  const cap = prog?.dayCap || sp.bricks || 1;
  const fin = Math.min(tower?.today ?? prog?.finishedToday ?? 0, cap);
  const due = prog?.wordsDue || 0;
  const openFixes = fixes.reduce((n, g) => n + g.items.length, 0);
  const t = tower ? buildTower(tower.bricks, tower.activeDays, tower.todayDate, prog?.speed, tower.guardDays) : null;
  const floors = t?.stack.length || 0;
  const days = tower?.activeDays?.length ?? 0;
  const left = Math.max(0, cap - fin);
  // 작은 탑: 위쪽 7층 + 오늘 더 쌓을 수 있는 만큼 점선
  const mini = [...(t?.stack || []).slice(-7).map((b, i, arr) => ({ tone: dayTone(b.day), key: i, crack: i >= arr.length - (t?.cracks || 0) })), ...Array.from({ length: left }, (_, i) => ({ tone: 'coral', ghost: true, key: 'g' + i }))];
  const myRank = rank?.rows?.find((r) => r.me) || rank?.mine;
  const ready = (shop?.missions || []).filter((m) => !m.claimed && m.n >= m.target).length;

  return (
    <div className="page has-tabs">
      <TopBar>
        <button className="icon-btn" onClick={showGuide} aria-label="게임 방법 보기"><Question /></button>
      </TopBar>
      <TowerAlert tower={tower} speed={prog?.speed} />
      <h1 className="learn-h1">홈</h1>

      {next && (
        <div className="card strong hm-next">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Face kind={FACE_OF[next.id]} size={56} />
            <div style={{ minWidth: 0 }}>
              <div className="small muted">{resuming ? '하던 대화' : '다음 대화'} · Lv{level}</div>
              <div className="hm-place">{next.place}</div>
              <div className="small">{next.partner}{josa(next.partner, '이', '가')} 말을 걸어요</div>
            </div>
          </div>
          <button className="ob-btn coral wide" style={{ minHeight: 60, marginTop: 14 }} onClick={() => start(next.id)}>
            <span className="t">{resuming ? '이어서 하기' : '대화 시작'}</span>
          </button>
        </div>
      )}

      <div className="hm-line">
        <Link to="/tower">오늘 탑 <b>{fin}/{cap}층</b></Link>
        <span aria-hidden="true">·</span>
        <Link to="/review">복습 단어 <b>{due}개</b></Link>
        {openFixes > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <Link to="/fix">고칠 곳 <b>{openFixes}곳</b></Link>
          </>
        )}
        {ready > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <Link to="/shop" className="hm-ready">미션 보상 <b>{ready}개</b> 받기</Link>
          </>
        )}
      </div>

      <Link to="/tower" className="card hm-tower" aria-label={`내 탑 ${floors}층, 오늘 ${left}개 더 쌓을 수 있어요`}>
        <Stack bricks={mini.length ? mini : [{ tone: 'mint', ghost: true }]} size={MINI} x0={22} baseY={Math.max(70, mini.length * MINI.h + 22)} height={Math.max(76, mini.length * MINI.h + 26)} width={86} plate={6} />
        <div style={{ minWidth: 0 }}>
          <div className="hm-tower-t">내 탑 {floors}층</div>
          <div className="small">{left > 0 ? `오늘 ${left}개 더 쌓을 수 있어요 (점선)` : `오늘 몫 ${cap}개를 다 쌓았어요`}</div>
          <div className="small muted" style={{ marginTop: 4 }}>
            {st.user ? (myRank ? `이번 주 순위 ${myRank.rank}등 · 공부한 날 ${days}일` : `공부한 날 ${days}일`) : `공부한 날 ${days}일 · 가입하면 순위에 참여해요`}
          </div>
        </div>
      </Link>

      <HelpBricks onOpen={setPop} />

      <Tabs />
      {overlays}
      {pop === 'talk' && <Guide slides={TALK_SLIDES} label="사용 방법" doneLabel="알겠어요" skipLabel="닫기" onDone={() => setPop(null)} />}
      {pop === 'review' && <Guide slides={REVIEW_SLIDES} label="복습 방법" doneLabel="알겠어요" skipLabel="닫기" onDone={() => setPop(null)} />}
      {pop === 'tower' && <Guide slides={TOWER_SLIDES} label="내 탑과 순위" doneLabel="알겠어요" skipLabel="닫기" onDone={() => setPop(null)} />}
    </div>
  );
}
