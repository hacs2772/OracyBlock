import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Talk from './pages/Talk.jsx';
import Fix from './pages/Fix.jsx';
import TowerPage from './pages/TowerPage.jsx';
import Me from './pages/Me.jsx';
import Auth from './pages/Auth.jsx';
import Admin from './pages/Admin.jsx';
import Legal from './pages/Legal.jsx';
import { Toaster } from './components/ui.jsx';
import { Guide, INTRO } from './components/Guides.jsx';
import { store, useStore } from './lib/store.js';
import { quiet } from './lib/api.js';
import { unlock } from './lib/speech.js';

export default function App() {
  const st = useStore();
  const { pathname } = useLocation();

  // 하루에 한 번 "왔어요" 남기기 (관리자 통계) + 로그인 정보 새로 받기
  useEffect(() => {
    quiet('/visit', { method: 'POST', body: {} });
    if (st.token) quiet('/me').then((u) => u && store.set({ user: u, level: u.level || st.level }));
  }, [st.token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app" onPointerDown={unlock}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/talk/:id" element={<Talk />} />
        <Route path="/fix" element={<Fix />} />
        <Route path="/tower" element={<TowerPage />} />
        <Route path="/me" element={<Me />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/terms" element={<Legal kind="terms" />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
        <Route path="*" element={<Home />} />
      </Routes>
      {!st.seenIntro && pathname === '/' && (
        <Guide slides={INTRO} label="처음 오셨나요" doneLabel="시작하기" onDone={() => store.set({ seenIntro: true })} />
      )}
      <Toaster />
    </div>
  );
}
