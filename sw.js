const CACHE_NAME = 'nutritrack-pwa-v2';
const ASSETS_TO_CACHE = [
    '/nutritrack-pwa/',
    '/nutritrack-pwa/index.html',
    '/nutritrack-pwa/manifest.json',
    '/nutritrack-pwa/icons/icon-72.png',
    '/nutritrack-pwa/icons/icon-96.png',
    '/nutritrack-pwa/icons/icon-128.png',
    '/nutritrack-pwa/icons/icon-144.png',
    '/nutritrack-pwa/icons/icon-152.png',
    '/nutritrack-pwa/icons/icon-192.png',
    '/nutritrack-pwa/icons/icon-384.png',
    '/nutritrack-pwa/icons/icon-512.png'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Установка...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Кэширование ресурсов...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('✅ Все ресурсы закэшированы');
                return self.skipWaiting();
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Активация...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Удаление старого кэша:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker активирован');
            return self.clients.claim();
        })
    );
});

// Перехват запросов (стратегия: Cache First, потом Network)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Возвращаем из кэша, если есть
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Иначе идём в сеть
                return fetch(event.request)
                    .then((response) => {
                        // Кэшируем только успешные ответы
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Если нет сети и нет в кэше - показываем офлайн-страницу
                        if (event.request.mode === 'navigate') {
                            return caches.match('/nutritrack-pwa/index.html');
                        }
                    });
            })
    );
});

// Фоновая синхронизация (если поддерживается)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        console.log('🔄 Фоновая синхронизация данных...');
        // Здесь можно добавить синхронизацию с сервером
    }
});

// Push-уведомления (если нужно)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Время записать приём пищи! 🍽️',
        icon: '/nutritrack-pwa/icons/icon-192.png',
        badge: '/nutritrack-pwa/icons/icon-72.png',
        vibrate: [200, 100, 200],
        tag: 'nutritrack-reminder',
        renotify: true
    };
    
    event.waitUntil(
        self.registration.showNotification('NutriTrack Pro', options)
    );
});