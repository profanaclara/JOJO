const CACHE_PREFIX = "jojo-static-";
const CACHE_VERSION = `${CACHE_PREFIX}v2026-08-19-7`;

// Keep installation fast. Game pages and media enter the cache after their first visit.
const APP_SHELL = [
    "./",
    "./index.html",
    "./offline.html",
    "./manifest.webmanifest",
    "./styles/main.css?v=20",
    "./styles/menu.css?v=8",
    "./scripts/app.js?v=2",
    "./scripts/data.js?v=7",
    "./scripts/pwa.js?v=17",
    "./assets/jojo-horizontal.svg",
    "./assets/JOJOdownloadsemfundo.svg",
    "./assets/jojo-menu-jogos.png",
    "./assets/jojo-menu-ferramentas.png",
    "./assets/logo-profanapixelart-small.webp",
    "./assets/referencia-bem-comum.png",
    "./assets/referencia-caed-ufjf.png",
    "./assets/referencia-saeb.png",
    "./assets/fonts/archivo-latin.woff2",
    "./assets/fonts/inter-latin.woff2",
    "./assets/favicon-48.png",
    "./assets/icon-192.png",
    "./assets/icon-512.png",
    "./assets/icon-maskable-192.png",
    "./assets/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(async (cache) => {
                const urls = APP_SHELL.map((path) => new URL(path, self.location.href).toString());

                await Promise.allSettled(
                    urls.map(async (url) => {
                        const response = await fetch(url, { cache: "no-cache" });
                        if (!response.ok) {
                            throw new Error(`Falha ao cachear ${url}`);
                        }
                        await cache.put(url, response);
                    })
                );
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION)
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== "GET" || request.headers.has("range")) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(request);
                    return cached || caches.match(new URL("./offline.html", self.location.href).toString());
                })
        );
        return;
    }

    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) {
                return cached;
            }

            return fetch(request).then((response) => {
                if (response.ok && response.type === "basic") {
                    const copy = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
                }
                return response;
            });
        })
    );
});
