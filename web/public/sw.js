// 인터넷이 약하거나 끊겨도 열리게 (concept 11-27)
// 화면(index.html): 먼저 인터넷에서 새로 받고, 3초 안에 안 오거나 끊겼으면 받아 둔 것으로
// 그림·코드(/assets/): 이름에 판 번호가 붙어 있어서, 한 번 받으면 휴대폰에 둔 것을 써요
// 서버 기록(/api/)은 받아 두지 않아요 (늘 새로)
const CACHE = 'oracy-v2';
const SHELL = '/index.html';
const KEEP = 90; // 받아 둘 파일 수 (넘치면 오래된 것부터 지워요)

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function trim(cache) {
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - KEEP))) if (!k.url.endsWith(SHELL)) await cache.delete(k);
}

async function page(req) {
  const cache = await caches.open(CACHE);
  const net = fetch(req).then(async (res) => {
    if (res.ok) await cache.put(SHELL, res.clone());
    return res;
  });
  const slow = new Promise((r) => setTimeout(r, 3000, null));
  try {
    const first = await Promise.race([net, slow]);
    if (first) return first;
  } catch {
    /* 끊겼어요 → 받아 둔 것 */
  }
  const saved = await cache.match(SHELL);
  if (saved) {
    net.catch(() => {}); // 늦게라도 오면 다음에 쓸 수 있게 받아 둬요
    return saved;
  }
  return net.catch(() => new Response('<meta charset="utf-8"><p style="font:16px sans-serif;padding:24px">인터넷에 연결되면 다시 열어 주세요.</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
}

async function asset(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && res.type === 'basic') {
    await cache.put(req, res.clone());
    trim(cache);
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  // 장소 소개 페이지(/places/)는 앱이 아니라서 받아 둔 앱 화면으로 바꿔치기하지 않아요 (그냥 인터넷에서)
  if (req.mode === 'navigate' && url.pathname.startsWith('/places')) return;
  if (req.mode === 'navigate') return e.respondWith(page(req));
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) return e.respondWith(asset(req));
});

// 휴대폰 알림 (concept 11-32): 서버가 보낸 제목·내용을 그대로 보여 주고, 누르면 사이트를 열어요
self.addEventListener('push', (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = { title: 'OracyBlock', body: e.data ? e.data.text() : '' };
  }
  e.waitUntil(self.registration.showNotification(d.title || 'OracyBlock', {
    body: d.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'oracy-daily', // 하루 하나: 새 알림이 오면 예전 것을 바꿔요
    data: { url: d.url || '/' },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) if ('focus' in c) { await c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  })());
});
