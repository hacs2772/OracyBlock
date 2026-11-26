import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/do-hyeon';
import './styles.css';
import App from './App.jsx';
import Crash from './components/Crash.jsx';
import { watchErrors } from './lib/errors.js';
import { catchSource } from './lib/source.js';

watchErrors();
catchSource();
// 소개 웹이 아니면(다시 온 사람) 홈·대화 화면을 기다리지 않게 바로 받기 시작해요
if (window.location.pathname !== '/about') {
  import('./pages/Home.jsx');
  import('./pages/Talk.jsx');
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Crash>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Crash>
  </React.StrictMode>,
);

// 휴대폰 홈 화면에 추가하면 앱처럼 + 인터넷이 약해도 열리게 (public/sw.js, concept 11-27)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
