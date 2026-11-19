// 홈 화면에 추가할 수 있게 하는 아주 작은 서비스 워커. 화면은 늘 새로 받아요 (캐시하지 않음)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
