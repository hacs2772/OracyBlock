// 관리자 화면: 몇 명이 들어왔는지, 얼마나 했는지, 어디서 그만두는지, 의견
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useStore } from '../lib/store.js';
import { talkById } from '../content/build.js';
import { Back } from '../components/ui.jsx';

function Num({ label, value, sub }) {
  return (
    <div className="card" style={{ padding: '10px 12px' }}>
      <div className="small muted">{label}</div>
      <div className="adm-num">{value ?? '-'}</div>
      {sub && <div className="small muted">{sub}</div>}
    </div>
  );
}
const pct = (a, b) => (b ? Math.round((a * 100) / b) + '%' : '-');
const when = (s) => (s ? new Date(s).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-');

export default function Admin() {
  const st = useStore();
  const [d, setD] = useState(null);
  const [users, setUsers] = useState([]);
  const [fb, setFb] = useState([]);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const markDone = (id, done) => {
    setFb((list) => list.map((x) => (x.id === id ? { ...x, done } : x)));
    api(`/admin/feedback/${id}`, { method: 'PUT', body: { done } }).catch((e) => setErr(e.message));
  };
  const [err, setErr] = useState('');
  const load = () => {
    setErr('');
    Promise.all([api('/admin/stats'), api('/admin/users'), api('/admin/feedback')])
      .then(([a, b, c]) => { setD(a); setUsers(b); setFb(c); })
      .catch((e) => setErr(e.status === 403 || e.status === 401 ? '관리자 계정으로 로그인해야 볼 수 있어요.' : e.message));
  };
  useEffect(load, [st.user?.id]);

  if (st.user?.role !== 'ADMIN') {
    return (
      <div className="page">
        <p>관리자 계정으로 로그인해야 볼 수 있어요.</p>
        <Link className="ob-btn coral" to="/login"><span className="t">로그인</span></Link>
      </div>
    );
  }
  const maxV = Math.max(1, ...(d?.days || []).map((x) => x.visitors));
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="talk-top">
        <Link className="icon-btn" to="/me" aria-label="내 정보로"><Back /></Link>
        <div className="ttl">관리자</div>
        <button className="link-btn" onClick={load}>새로고침</button>
      </div>
      {err && <p className="err">{err}</p>}
      {d && (
        <>
          <p className="small muted">날짜는 한국 시간이에요. 관리자 계정은 숫자에서 뺐어요. 방문자 = 기기 하나(브라우저 하나)를 한 명으로 세요.</p>
          {d.openFeedback > 0 && <a className="note warn" href="#contact" style={{ display: 'block', textDecoration: 'none' }}>처리 안 한 문의가 <b>{d.openFeedback}개</b> 있어요. 맨 아래에서 볼 수 있어요.</a>}
          <h2 style={{ fontSize: 20 }}>사람</h2>
          <div className="adm-grid">
            <Num label="오늘 방문자" value={d.people.visitorsToday} sub={`어제 ${d.people.visitorsYesterday}`} />
            <Num label="최근 7일 방문자" value={d.people.visitors7d} sub={`전체 ${d.people.visitorsTotal}`} />
            <Num label="가입한 사람" value={d.people.members} sub={`오늘 +${d.people.membersToday} · 7일 +${d.people.members7d}`} />
            <Num label="다음 날 이후 다시 온 사람" value={pct(d.people.cameBack, d.people.canComeBack)} sub={`${d.people.cameBack}/${d.people.canComeBack}명 (최근 14일)`} />
          </div>
          <h2 style={{ fontSize: 20 }}>대화</h2>
          <div className="adm-grid">
            <Num label="오늘 시작한 대화" value={d.plays.startedToday} sub={`끝까지 ${d.plays.finishedToday}`} />
            <Num label="전체 끝낸 대화" value={d.plays.finishedTotal} sub={`시작 ${d.plays.startedTotal} · 완주 ${pct(d.plays.finishedTotal, d.plays.startedTotal)}`} />
            <Num label="대답 방법 (말/글/고르기)" value={`${d.plays.speakN}/${d.plays.writeN}/${d.plays.chooseN}`} sub={`말로 ${pct(d.plays.speakN, d.plays.speakN + d.plays.writeN + d.plays.chooseN)}`} />
            <Num label="단어 복습 · 고친 곳" value={`${d.review.wordAnswers} · ${d.review.fixesDone}`} sub={`복습 정답률 ${pct(d.review.wordOk, d.review.wordAnswers)}`} />
          </div>

          <h2 style={{ fontSize: 20 }}>최근 14일</h2>
          <div className="card adm-scroll" style={{ padding: '4px 12px' }}>
            <table className="adm-table">
              <thead><tr><th>날짜</th><th>방문자</th><th></th><th>가입</th><th>시작</th><th>끝냄</th></tr></thead>
              <tbody>
                {d.days.map((x) => (
                  <tr key={x.day}>
                    <td>{x.day.slice(5)}</td>
                    <td>{x.visitors}</td>
                    <td style={{ width: '30%' }}><div className="bar" style={{ width: (x.visitors / maxV) * 100 + '%' }} /></td>
                    <td>{x.signups}</td>
                    <td>{x.started}</td>
                    <td>{x.finished}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ fontSize: 20 }}>어디서 그만두나요 (최근 14일에 처음 온 사람)</h2>
          <div className="card" style={{ padding: '4px 12px' }}>
            {[
              ['처음 들어옴', d.funnel.came],
              ['대화를 시작함', d.funnel.started],
              ['대화 하나를 끝냄', d.funnel.finished],
              ['가입함', d.funnel.joined],
              ['다음 날 이후 다시 옴', d.funnel.cameBack],
            ].map(([l, v]) => (
              <div key={l} className="set-row" style={{ minHeight: 40 }}>
                <span>{l}</span>
                <span><b>{v}</b> <span className="small muted">{pct(v, d.funnel.came)}</span></span>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 20 }}>대화별</h2>
          <div className="card adm-scroll" style={{ padding: '4px 12px' }}>
            <table className="adm-table">
              <thead><tr><th>대화</th><th>시작</th><th>끝냄</th><th>올바른 탑</th><th>평균 튕김</th></tr></thead>
              <tbody>
                {d.talks.map((x) => (
                  <tr key={x.talkId}>
                    <td>{talkById(x.talkId)?.place || x.talkId}</td>
                    <td>{x.started}</td>
                    <td>{x.finished}</td>
                    <td>{x.correct}</td>
                    <td>{x.avgBounces}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 style={{ fontSize: 20 }}>가입한 사람 (최근 100명)</h2>
      <div className="card adm-scroll" style={{ padding: '4px 12px' }}>
        <table className="adm-table">
          <thead><tr><th>닉네임</th><th>이메일</th><th>가입</th><th>마지막</th><th>끝낸 대화</th><th>Lv</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.nickname}{u.role === 'ADMIN' ? ' (관리자)' : ''}</td>
                <td>{u.email}</td>
                <td>{when(u.createdAt)}</td>
                <td>{when(u.lastSeenAt)}</td>
                <td>{u.finished}</td>
                <td>{u.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div id="contact" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 20 }}>문의 · 의견 ({fb.length}) · 처리 안 함 {fb.filter((x) => !x.done).length}</h2>
        <label className="check" style={{ fontSize: 13 }}><input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />처리 안 한 것만</label>
      </div>
      {fb.filter((x) => !onlyOpen || !x.done).map((x) => (
        <div key={x.id} className="card" style={x.done ? { opacity: 0.6 } : null}>
          <div className="small muted">
            {when(x.createdAt)} · {x.nickname ? `${x.nickname} (${x.email})` : '둘러보는 사람'}{x.page ? ` · 보낸 화면 ${x.page}` : ''}
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap', marginTop: 4 }}>{x.message}</p>
          {x.contact && <p className="small" style={{ marginTop: 6 }}>답장 받을 곳: <a href={`mailto:${x.contact}`}><b>{x.contact}</b></a></p>}
          <label className="check" style={{ marginTop: 8, fontSize: 13 }}>
            <input type="checkbox" checked={!!x.done} onChange={(e) => markDone(x.id, e.target.checked)} />처리 완료
          </label>
        </div>
      ))}
    </div>
  );
}
