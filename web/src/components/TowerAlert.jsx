// 내 탑 알림: 오늘 밤까지 공부하지 않으면 금이 가거나 떨어질 때 미리 알려 줘요 (여행 판·내 탑 맨 위)
// 나중에 휴대폰 알림(웹 푸시)으로도 보낼 예정 (docs/concept.md)
import { Link } from 'react-router-dom';
import { speedOf, tonight } from '../lib/speed.js';
import { buildTower } from '../pages/TowerPage.jsx';

export default function TowerAlert({ tower, speed }) {
  if (!tower) return null;
  const t = buildTower(tower.bricks, tower.activeDays, tower.todayDate, speed);
  const w = t.capped ? null : tonight(t.rest, speedOf(speed), t.stack.length);
  if (!w) return null;
  return (
    <div className="note warn" role="status">
      <b>오늘 밤까지 공부하지 않으면</b> {w.kind === 'fall' ? `내 탑 브릭 ${w.n}개가 떨어져요.` : '내 탑 꼭대기에 금이 가요.'} 복습 하나나 대화 하나면 지킬 수 있어요.
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 14px', marginTop: 4 }}>
        <Link to="/review" style={{ fontWeight: 700 }}>복습하러 가기</Link>
        {speed !== 'slow' && <Link to="/me">쌓는 속도 낮추기</Link>}
      </div>
    </div>
  );
}
