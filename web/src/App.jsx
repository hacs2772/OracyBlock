import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Talk from './pages/Talk.jsx';
import Fix from './pages/Fix.jsx';
import Review from './pages/Review.jsx';
import TowerPage from './pages/TowerPage.jsx';
import Me from './pages/Me.jsx';
import Auth from './pages/Auth.jsx';
import Admin from './pages/Admin.jsx';
import Legal from './pages/Legal.jsx';
import Landing from './pages/Landing.jsx';
import { Guide, INTRO } from './components/Guides.jsx';
import { Toaster } from './components/ui.jsx';
import Contact from './components/Contact.jsx';
import InAppBanner from './components/InAppBanner.jsx';
import { store, useStore } from './lib/store.js';
import { quiet } from './lib/api.js';
import { unlock } from './lib/speech.js';

export default function App() {
  const st = useStore();
  const { pathname } = useLocation();
  // 베타 동안: 그날 처음 oracyblock.com에 들어오면 소개 탭부터 (하루 한 번). 그다음부터는 바로 여행 판
  const today = new Date().toLocaleDateString('sv-SE');
  const introToday = pathname === '/' && st.introDay !== today;
  useEffect(() => {
    if (pathname === '/about' && st.introDay !== today) store.set({ introDay: today });
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  const isLanding = pathname === '/about';
  // 처음 온 사람 안내 6장(움직이는 그림)은 꼭 한 번 저절로 떠요 (소개 페이지나 여행 판 위에). 게임 방법 3장은 첫 대화를 시작할 때
  const showTour = !st.seenTour && (pathname === '/' || pathname === '/about');

  // 하루에 한 번 "왔어요" 남기기 (관리자 통계) + 로그인 정보 새로 받기
  useEffect(() => {
    quiet('/visit', { method: 'POST', body: {} });
    if (st.token) quiet('/me').then((u) => u && store.set({ user: u, level: u.level || st.level }));
  }, [st.token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={isLanding ? 'app-wide' : 'app'} onPointerDown={unlock}>
      <InAppBanner />
      <Routes>
        <Route path="/" element={introToday ? <Navigate to="/about" replace /> : <Home />} />
        <Route path="/about" element={<Landing />} />
        <Route path="/talk/:id" element={<Talk />} />
        <Route path="/fix" element={<Fix />} />
        <Route path="/review" element={<Review />} />
        <Route path="/tower" element={<TowerPage />} />
        <Route path="/me" element={<Me />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/terms" element={<Legal kind="terms" />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
        <Route path="*" element={<Home />} />
      </Routes>
      {showTour && <Guide slides={INTRO} label="처음 오셨나요" doneLabel={isLanding ? '알겠어요' : '시작하기'} onDone={() => store.set({ seenTour: true })} />}
      <Contact />
      <Toaster />
    </div>
  );
}
