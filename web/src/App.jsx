import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
const Learn = lazy(() => import('./pages/Learn.jsx'));
const Shop = lazy(() => import('./pages/Shop.jsx'));
import Talk from './pages/Talk.jsx';
const Fix = lazy(() => import('./pages/Fix.jsx'));
const Review = lazy(() => import('./pages/Review.jsx'));
import TowerPage from './pages/TowerPage.jsx';
const Me = lazy(() => import('./pages/Me.jsx'));
const Auth = lazy(() => import('./pages/Auth.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const Legal = lazy(() => import('./pages/Legal.jsx'));
import Landing from './pages/Landing.jsx';
import { Guide, INTRO } from './components/Guides.jsx';
import { Toaster, toast } from './components/ui.jsx';
import Contact from './components/Contact.jsx';
import InAppBanner from './components/InAppBanner.jsx';
import OfflineBar from './components/OfflineBar.jsx';
import { store, useStore } from './lib/store.js';
import { quiet } from './lib/api.js';
import { flushOutbox } from './lib/outbox.js';
import { unlock } from './lib/speech.js';

export default function App() {
  const st = useStore();
  const { pathname } = useLocation();
  // 처음 온 사람만 소개 웹(/about)부터. 한 번 본 다음에는 들어오면 홈 (concept 11-16)
  const firstVisit = pathname === '/' && !st.seenIntro;
  const isLanding = pathname === '/about';
  // 처음 온 사람 안내 6장(움직이는 그림)은 꼭 한 번 저절로 떠요 (소개 페이지나 홈 위에). 게임 방법 3장은 첫 대화를 시작할 때
  const showTour = !st.seenTour && (pathname === '/' || pathname === '/about');

  // 하루에 한 번 "왔어요" 남기기 (관리자 통계) + 로그인 정보 새로 받기
  useEffect(() => {
    quiet('/visit', { method: 'POST', body: {} });
    if (st.token) quiet('/me').then((u) => u && store.set({ user: u, level: u.level || st.level }));
  }, [st.token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // 인터넷이 끊겨 못 보낸 대화가 있으면, 앱을 열 때와 다시 이어질 때 보내요
  useEffect(() => {
    const go = () => flushOutbox().then((sent) => sent && toast('끊겼을 때 끝낸 대화를 저장했어요'));
    go();
    window.addEventListener('online', go);
    return () => window.removeEventListener('online', go);
  }, []);

  return (
    <div className={isLanding ? 'app-wide' : 'app'} onPointerDown={unlock}>
      <InAppBanner />
      <OfflineBar />
      {/* 자주 안 여는 화면은 열 때 받아요 (첫 화면을 빨리, concept 11-27). 받는 동안은 빈 바탕 */}
      <Suspense fallback={<div className="page" />}>
      <Routes>
        <Route path="/" element={firstVisit ? <Navigate to="/about" replace /> : <Home />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/shop" element={<Shop />} />
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
      </Suspense>
      {showTour && <Guide slides={INTRO} label="처음 오셨나요" doneLabel={isLanding ? '알겠어요' : '시작하기'} onDone={() => store.set({ seenTour: true })} />}
      <Contact />
      <Toaster />
    </div>
  );
}
