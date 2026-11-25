// 인터넷이 끊기면 위에 한 줄 (concept 11-27). 다시 이어지면 저절로 사라져요
import { useEffect, useState } from 'react';

export default function OfflineBar() {
  const [off, setOff] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  useEffect(() => {
    const on = () => setOff(false);
    const down = () => setOff(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', down);
    };
  }, []);
  if (!off) return null;
  return <div className="note warn ol-bar" role="status">인터넷이 끊겼어요. 연습은 그대로 돼요. 끝낸 대화는 오늘 안에 다시 이어지면 저장해요.</div>;
}
