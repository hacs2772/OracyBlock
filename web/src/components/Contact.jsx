// 문의하기 (asmrBlock처럼): 어디서든 여는 문의 창. 위쪽 머리줄(TopBar)의 말풍선 아이콘으로 열고,
// 머리줄이 없는 화면(소개 웹·고치기 등)에만 오른쪽 아래 작은 버튼이 떠요 (아래 탭 화면에서 글자를 가리지 않게)
// 열기: openContact() / 관리자 화면 맨 아래 "문의"에서 보고 처리 완료 표시
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { quiet } from '../lib/api.js';
import { useStore } from '../lib/store.js';
import { Sheet, toast } from './ui.jsx';

import { setContactOpener, openContact } from '../lib/contact.js';

export { openContact };

const Bubble = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#24324A" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="#FFC857" />
    <path d="M8 10h8M8 13h5" strokeLinecap="round" />
  </svg>
);

export default function Contact() {
  const st = useStore();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);
  useEffect(() => {
    setContactOpener(setOpen);
    return () => setContactOpener(null);
  }, []);
  useEffect(() => {
    if (open && st.user?.email && !contact) setContact(st.user.email);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // 대화하는 중·관리자 화면에서는 버튼을 숨겨요 (대화에 집중)
  // 머리줄이 있는 화면(홈·학습·복습·내 탑·상점·내 정보)은 머리줄의 말풍선 아이콘으로 열어요
  const topBar = ['/', '/learn', '/review', '/tower', '/shop', '/me'].includes(pathname);
  const hideFab = topBar || pathname.startsWith('/talk') || pathname.startsWith('/admin') || pathname.startsWith('/login');
  const withTabs = ['/', '/learn', '/about', '/review', '/tower', '/shop', '/me'].includes(pathname);

  const send = async () => {
    if (msg.trim().length < 2) return toast('두 글자 이상 적어 주세요.');
    setSending(true);
    const r = await quiet('/feedback', { method: 'POST', body: { message: msg.trim(), contact: contact.trim(), page: pathname } });
    setSending(false);
    if (!r) return toast('보내지 못했어요. 잠시 뒤에 다시 해 주세요.');
    setMsg('');
    setOpen(false);
    toast('고마워요! 잘 받았어요.');
    return null;
  };

  return (
    <>
      {!hideFab && (
        <button className={'contact-fab' + (withTabs ? ' above-tabs' : '')} onClick={() => setOpen(true)} aria-label="문의하기">
          <Bubble />
          <span className="contact-fab-t">문의</span>
        </button>
      )}
      {open && (
        <Sheet title="문의하기 · 의견 보내기" onClose={() => setOpen(false)} labelId="contact-title">
          <p className="small muted" style={{ marginTop: 4 }}>불편한 점, 틀린 발음, 바라는 것 무엇이든 좋아요. 만든 사람이 직접 읽어요.</p>
          <label className="sr-only" htmlFor="contact-msg">문의 내용</label>
          <textarea id="contact-msg" className="input" style={{ marginTop: 10 }} maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="예: 이자카야 대화에서 소리가 안 나요" />
          <div className="field" style={{ marginTop: 10 }}>
            <label htmlFor="contact-mail">답장 받을 이메일 (선택)</label>
            <input id="contact-mail" className="input" type="email" inputMode="email" maxLength={100} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="답장이 필요할 때만 적어 주세요" autoComplete="email" />
          </div>
          <p className="help">지금 보고 있던 화면도 함께 보내져서 문제를 찾기 쉬워요.</p>
          <button className="ob-btn coral wide" disabled={sending || msg.trim().length < 2} onClick={send}><span className="t">{sending ? '보내는 중' : '보내기'}</span></button>
        </Sheet>
      )}
    </>
  );
}
