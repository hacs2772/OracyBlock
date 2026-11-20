// "이 문장 이상해요": 대사마다 신고 → 관리자 화면 "대사 신고"에 대사별로 모여요 (concept 11-8)
// 고르는 화면이 좁아지지 않게, 대답한 다음 결과 칸 맨 아래에만 둬요
import { useState } from 'react';
import { quiet } from '../lib/api.js';
import { Sheet, toast } from './ui.jsx';

const REASONS = {
  them: [['mean', '뜻이 틀려요'], ['ja', '일본어가 어색해요'], ['ko', '한글 발음이 이상해요'], ['etc', '다른 문제예요']],
  me: [['answer', '맞는 대답인데 튕겼어요'], ['ja', '일본어가 어색해요'], ['ko', '한글 발음이 이상해요'], ['mean', '뜻이 틀려요'], ['etc', '다른 문제예요']],
};

export default function LineReport({ talkId, turnIdx, line, kind = 'them' }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const send = async () => {
    setSending(true);
    const r = await quiet('/line-report', { method: 'POST', body: { talkId, turnIdx, reason, note: note.trim(), line } });
    setSending(false);
    if (!r) return toast('보내지 못했어요. 잠시 뒤에 다시 해 주세요.');
    setOpen(false);
    setSent(true);
    toast('고마워요! 확인하고 고칠게요.');
    return null;
  };
  if (sent) return <span className="small muted lr-sent">신고했어요. 고마워요!</span>;
  return (
    <>
      <button className="link-btn lr-open" onClick={() => setOpen(true)}>이 문장 이상해요</button>
      {open && (
        <Sheet title="어디가 이상해요?" onClose={() => setOpen(false)} labelId="lr-title">
          <p className="small muted" style={{ marginTop: 4 }}>{line}</p>
          <div className="lr-reasons" role="radiogroup" aria-label="이상한 곳">
            {REASONS[kind].map(([k, label]) => (
              <button key={k} role="radio" aria-checked={reason === k} className={'lr-reason' + (reason === k ? ' on' : '')} onClick={() => setReason(k)}>{label}</button>
            ))}
          </div>
          <label className="sr-only" htmlFor="lr-note">더 적을 말</label>
          <textarea id="lr-note" className="input" style={{ height: 76, marginTop: 10 }} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="더 적을 말이 있으면 (선택). 예: 이렇게 말하는 게 자연스러워요" />
          <button className="ob-btn coral wide" style={{ marginTop: 12 }} disabled={!reason || sending} onClick={send}><span className="t">{sending ? '보내는 중' : '보내기'}</span></button>
        </Sheet>
      )}
    </>
  );
}
