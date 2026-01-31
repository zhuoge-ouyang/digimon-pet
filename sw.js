const CACHE_NAME = 'digimon-pet-v5';
const urlsToCache = [
  './',
  './digimon-pet.html',
  './manifest.json',
  './shaguyashou01.gif',
  './shaguyashou02.gif',
  './shaguyashou03.gif',
  './shaguyashou04.gif',
  './shaguyashou05.gif',
  './dreamer.flac'
];

// 安装 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 拦截请求，优先使用缓存
self.addEventListener('fetch', event => {
  // 获取不带查询参数的 URL
  const url = new URL(event.request.url);
  url.search = ''; // 移除查询参数
  const cleanRequest = new Request(url.toString());
  
  event.respondWith(
    caches.match(cleanRequest)
      .then(response => {
        // 缓存命中，返回缓存
        if (response) {
          return response;
        }
        
        // 缓存未命中，从网络获取（使用原始请求）
        return fetch(event.request).then(response => {
          // 检查是否有效响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // 克隆响应并缓存（用干净的 URL）
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(cleanRequest, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // 离线时返回缓存的主页
        return caches.match('./digimon-pet.html');
      })
  );
});
