// 카톡 같은 앱 안 브라우저로 열면 위에 띠를 띄워요: 거기선 마이크·소리가 잘 안 될 수 있어서 크롬·사파리로 안내
import { useState } from 'react';

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
export const inKakao = /KAKAOTALK/i.test(ua);
export const inApp = inKakao || /Instagram|FBAN|FBAV|Line\/|NAVER\(inapp|DaumApps|everytimeApp/i.test(ua);
const android = /Android/i.test(ua);

function openOutside() {
  const url = window.location.href;
  if (inKakao) {
    window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
  } else if (android) {
    window.location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
  }
}

export default function InAppBanner() {
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem('oracy.inapp') === '1';
    } catch {
      return false;
    }
  });
  const [copied, setCopied] = useState(false);
  if (!inApp || hidden) return null;
  const close = () => {
    setHidden(true);
    try {
      sessionStorage.setItem('oracy.inapp', '1');
    } catch {
      /* 무시 */
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="inapp" role="region" aria-label="브라우저 안내">
      <p>
        <b>{inKakao ? '카톡 안에서 열었어요.' : '앱 안에서 열었어요.'}</b> 여기선 일본어 소리가 안 나올 수 있어요. 크롬이나 사파리로 열어 주세요.
        {!android && <> 화면 아래 메뉴(점 세 개나 공유 버튼) → <b>"다른 브라우저로 열기"</b>.</>}
      </p>
      <div className="inapp-btns">
        {android && <button className="ob-btn sm coral" onClick={openOutside}><span className="t">크롬으로 열기</span></button>}
        <button className="ob-btn sm" onClick={copy}><span className="t">{copied ? '복사했어요' : '주소 복사'}</span></button>
        <button className="link-btn" onClick={close}>닫기</button>
      </div>
    </div>
  );
}
