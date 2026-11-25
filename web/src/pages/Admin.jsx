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
const REASON = { ja: '일본어 어색', ko: '한글 발음', mean: '뜻 틀림', answer: '대답 튕김', etc: '기타' };
const pct = (a, b) => (b ? Math.round((a * 100) / b) + '%' : '-');
const when = (s) => (s ? new Date(s).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-');

export default function Admin() {
  const st = useStore();
  const [d, setD] = useState(null);
  const [users, setUsers] = useState([]);
  const [fb, setFb] = useState([]);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [reps, setReps] = useState([]);
  const [turns, setTurns] = useState([]);
  const [errs, setErrs] = useState([]);
  const [openErr, setOpenErr] = useState(null);
  const repDone = (x) => {
    setReps((list) => list.filter((y) => !(y.talkId === x.talkId && y.turnIdx === x.turnIdx)));
    api('/admin/line-reports/done', { method: 'PUT', body: { talkId: x.talkId, turnIdx: x.turnIdx } }).catch((e) => setErr(e.message));
  };
  const markDone = (id, done) => {
    setFb((list) => list.map((x) => (x.id === id ? { ...x, done } : x)));
    api(`/admin/feedback/${id}`, { method: 'PUT', body: { done } }).catch((e) => setErr(e.message));
  };
  const [err, setErr] = useState('');
  const load = () => {
    setErr('');
    Promise.all([api('/admin/stats'), api('/admin/users'), api('/admin/feedback'), api('/admin/line-reports'), api('/admin/turns'), api('/admin/errors')])
      .then(([a, b, c, r, tt, ee]) => { setD(a); setUsers(b); setFb(c); setReps(r); setTurns(tt); setErrs(ee); })
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
          {d.openErrors > 0 && <a className="note warn" href="#errors" style={{ display: 'block', textDecoration: 'none' }}>확인 안 한 화면 오류가 <b>{d.openErrors}개</b> 있어요.</a>}
          {d.openReports > 0 && <a className="note warn" href="#reports" style={{ display: 'block', textDecoration: 'none' }}>신고된 대사가 <b>{d.openReports}개</b> 있어요.</a>}
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

          <h2 style={{ fontSize: 20 }}>어디서 왔나요 (최근 30일에 처음 온 사람)</h2>
          <p className="small muted" style={{ marginTop: -4 }}>글을 올릴 때 링크 끝에 <b>?from=이름</b>을 붙이면 그 이름으로 나와요 (예: oracyblock.com/?from=cafe1)</p>
          <div className="card adm-scroll" style={{ padding: '4px 12px' }}>
            <table className="adm-table">
              <thead><tr><th>온 곳</th><th>들어옴</th><th>대화 끝냄</th><th>다음에 또 옴</th></tr></thead>
              <tbody>
                {(d.sources || []).map((x) => (
                  <tr key={x.src || '-'}>
                    <td>{x.src || '주소로 바로 (또는 모름)'}</td>
                    <td>{x.came}</td>
                    <td>{x.finished}</td>
                    <td>{x.cameBack}</td>
                  </tr>
                ))}
                {!d.sources?.length && <tr><td colSpan={4} className="muted">아직 없어요</td></tr>}
              </tbody>
            </table>
          </div>

          <h2 style={{ fontSize: 20 }}>어디서 그만두나요 (최근 14일에 처음 온 사람)</h2>
          <Funnel f={d.funnel} />
          {d.stuck?.length > 0 && (
            <>
              <h2 style={{ fontSize: 20 }}>첫 대화를 못 끝낸 사람이 멈춘 곳</h2>
              <div className="card adm-scroll" style={{ padding: '4px 12px' }}>
                <table className="adm-table">
                  <thead><tr><th>대화</th><th>차례</th><th>그 차례</th><th>명</th></tr></thead>
                  <tbody>
                    {d.stuck.map((x) => {
                      const t = talkById(x.talkId);
                      const s0 = t?.steps[x.turnIdx];
                      const what = x.turnIdx < 0 ? '첫 말을 듣기 전' : !s0 ? '-' : s0.type === 'them' ? `상대: ${s0.line.ko} (${s0.line.mean})` : `내 대답: ${s0.options.map((o) => o.natural.ko).join(' / ')}`;
                      return (
                        <tr key={x.talkId + ':' + x.turnIdx}>
                          <td>{t?.place || x.talkId}</td>
                          <td>{x.turnIdx < 0 ? '-' : x.turnIdx + 1}</td>
                          <td style={{ minWidth: 180 }}>{what}</td>
                          <td>{x.n}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

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

      <div id="turns">
        <h2 style={{ fontSize: 20 }}>어려운 차례 ({turns.length})</h2>
        <p className="small muted">대사마다 몇 번 했는지, 평균 몇 번 튕겼는지, 두 번 튕겨 넘어간 비율이에요. 넘어감이 높은 대사부터 보여요. 대사가 어렵거나 보기가 헷갈리는 곳이에요.</p>
      </div>
      <div className="card" style={{ padding: '4px 10px', overflowX: 'auto' }}>
        {turns.length === 0 && <p className="small" style={{ padding: '10px 0' }}>아직 기록이 없어요. 대화를 끝내면 쌓여요.</p>}
        {turns.length > 0 && (
          <table className="adm-turns">
            <thead><tr><th>장소 · 차례</th><th>대사</th><th>횟수</th><th>평균 튕김</th><th>넘어감</th><th>힌트</th><th>어색</th></tr></thead>
            <tbody>
              {turns.map((x) => {
                const t = talkById(x.talkId);
                const s = t?.steps[x.turnIdx];
                const line = s ? (s.type === 'them' ? s.line.ko + ' (' + s.line.mean + ')' : '내 차례: ' + s.options.map((o) => o.natural.ko).join(' · ')) : '';
                return (
                  <tr key={x.talkId + ':' + x.turnIdx} className={Number(x.skipPct) >= 30 ? 'hot' : ''}>
                    <td>{t?.place || x.talkId} · {x.turnIdx + 1}</td>
                    <td>{line}</td>
                    <td>{x.n}</td>
                    <td>{x.avgWrong}</td>
                    <td>{x.skipPct}%</td>
                    <td>{x.hintPct}%</td>
                    <td>{x.nearPct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div id="errors">
        <h2 style={{ fontSize: 20 }}>화면 오류 · 확인 안 한 것 {errs.length}개</h2>
        <p className="small muted">사용자 화면에서 난 오류가 저절로 모여요 (최근 14일, 같은 오류는 한 줄). "멈춤"은 하얀 화면 대신 "다시 열기"가 뜬 경우예요. 고쳐서 올린 다음 "확인했어요"를 눌러요.</p>
      </div>
      {errs.map((x) => {
        const key = x.message + x.page;
        return (
          <div key={key} className="card">
            <div className="small muted">
              <span className={'chip' + (x.kind === 'crash' ? ' er-crash' : '')}>{x.kind === 'crash' ? '멈춤' : x.kind === 'promise' ? '불러오기' : '오류'}</span> {x.page} · {x.people}명 ({x.n}번) · 마지막 {x.last}{x.build ? ` · 판 ${x.build}` : ''}
            </div>
            <p className="er-msg">{x.message}</p>
            {x.ua && <p className="small muted" style={{ marginTop: 4 }}>{phoneOf(x.ua)}</p>}
            {x.stack && (
              <button className="link-btn" onClick={() => setOpenErr(openErr === key ? null : key)} aria-expanded={openErr === key}>{openErr === key ? '자세히 닫기' : '자세히'}</button>
            )}
            {openErr === key && <pre className="er-stack">{x.stack}</pre>}
            <button className="ob-btn sm" onClick={() => { setErrs(errs.filter((y) => y !== x)); api('/admin/errors/done', { method: 'PUT', body: { message: x.message, page: x.page } }).catch((e) => setErr(e.message)); }}><span className="t">확인했어요</span></button>
          </div>
        );
      })}

      <div id="reports">
        <h2 style={{ fontSize: 20 }}>대사 신고 · 처리 안 한 대사 {reps.length}개</h2>
        <p className="small muted">"이 문장 이상해요"로 들어온 신고를 대사마다 모았어요. 대사를 고쳐서 올린 다음 "고쳤어요"를 눌러요.</p>
      </div>
      {reps.map((x) => {
        const t = talkById(x.talkId);
        const s = t?.steps[x.turnIdx];
        const now = s ? (s.type === 'them' ? `${s.line.ko} / ${s.line.mean}` : `내 차례: ${s.options.map((o) => o.natural.ko).join(' · ')}`) : '';
        return (
          <div key={x.talkId + ':' + x.turnIdx} className="card">
            <div className="small muted">{t?.place || x.talkId} · {x.turnIdx + 1}번째 대사 · {x.people}명 ({x.n}번) · 마지막 {x.last}</div>
            <p style={{ fontSize: 14, lineHeight: 1.5, marginTop: 4 }}><b>{now}</b></p>
            {x.line && x.line !== now && <p className="small muted">신고한 화면: {x.line}</p>}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>{String(x.reasons || '').split(',').map((r) => <span key={r} className="chip">{REASON[r] || r}</span>)}</div>
            {x.notes && <p style={{ fontSize: 13, lineHeight: 1.5, marginTop: 6, whiteSpace: 'pre-wrap' }}>{x.notes}</p>}
            <button className="ob-btn sm" onClick={() => repDone(x)}><span className="t">고쳤어요</span></button>
          </div>
        );
      })}

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

/** 단계마다 몇 명 지나갔는지 막대로. 앞 단계보다 가장 많이 줄어든 곳을 붉게 (concept 11-25) */
function Funnel({ f }) {
  const rows = [
    ['처음 들어옴', f.came],
    ['소개 웹을 봄', f.about],
    ['시작 버튼을 누름', f.cta],
    ['게임 방법을 봄', f.guide],
    ['소리 확인을 끝냄', f.sound],
    ['대화를 시작함', f.started],
    ['대화 하나를 끝냄', f.finished],
    ['대화 두 개를 끝냄', f.finished2],
    ['가입함', f.joined],
  ];
  const drops = rows.map(([, v], i) => (i ? Math.max(0, rows[i - 1][1] - v) : 0));
  const worst = Math.max(...drops);
  const base = Math.max(1, f.came);
  return (
    <div className="card fn-card">
      {rows.map(([label, v], i) => (
        <div key={label} className={'fn-row' + (worst > 0 && drops[i] === worst ? ' worst' : '')}>
          <span className="fn-label">{label}</span>
          <span className="fn-bar"><i style={{ width: `${Math.round((100 * v) / base)}%` }} /></span>
          <span className="fn-num"><b>{v}</b> <span className="small muted">{Math.round((100 * v) / base)}%</span></span>
          {drops[i] > 0 && <span className="fn-drop small">-{drops[i]}</span>}
        </div>
      ))}
      <div className="fn-row">
        <span className="fn-label">다음 날 다시 옴</span>
        <span className="fn-bar"><i style={{ width: `${Math.round((100 * f.cameBack) / Math.max(1, f.canComeBack))}%` }} /></span>
        <span className="fn-num"><b>{f.cameBack}</b> <span className="small muted">/{f.canComeBack}</span></span>
      </div>
      <p className="small muted" style={{ marginTop: 6 }}>소개 웹·게임 방법·소리 확인은 이번에 새로 센 단계라, 그 전에 온 사람은 비어 있어요. 링크로 바로 들어온 사람은 소개 웹을 건너뛸 수 있어요.</p>
    </div>
  );
}

/** 기기 이름만 짧게: 아이폰 iOS 17 · 사파리 / 안드로이드 · 크롬 */
function phoneOf(ua) {
  const os = /iPhone|iPad/.test(ua) ? `아이폰 iOS ${(ua.match(/OS (\d+)/) || [])[1] || ''}` : /Android/.test(ua) ? `안드로이드 ${(ua.match(/Android (\d+)/) || [])[1] || ''}` : /Windows/.test(ua) ? '윈도우' : /Mac OS/.test(ua) ? '맥' : '기타';
  const br = /KAKAOTALK/i.test(ua) ? '카카오톡 안' : /NAVER/i.test(ua) ? '네이버 앱 안' : /Instagram/i.test(ua) ? '인스타그램 안' : /SamsungBrowser/.test(ua) ? '삼성 인터넷' : /Edg\//.test(ua) ? '엣지' : /CriOS|Chrome/.test(ua) ? '크롬' : /Safari/.test(ua) ? '사파리' : '';
  return [os.trim(), br].filter(Boolean).join(' · ');
}
