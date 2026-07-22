const CACHE_VERSION = "jojo-static-v2026-07-22-01";

const APP_SHELL = [
    "./",
    "./index.html",
    "./offline.html",
    "./manifest.webmanifest",
    "./styles/main.css?v=16",
    "./styles/menu.css?v=8",
    "./styles/tablet.css",
    "./styles/tablet-agenda-final.css",
    "./styles/tablet-word-final.css",
    "./scripts/app.js?v=8",
    "./scripts/data.js?v=8",
    "./scripts/pwa.js?v=18",
    "./assets/jojo-horizontal.svg",
    "./assets/jojo-card-geometria.png",
    "./assets/jojo-card-palavras.png",
    "./assets/jojo-card-textos.png",
    "./assets/jojo-card-popit.png",
    "./assets/jojo-card-pitagoras.png",
    "./assets/jojo-card-matematica.png",
    "./assets/jojo-card-trilha.png",
    "./assets/jojo-eixo-alfabetizacao.png",
    "./assets/jojo-eixo-matematica.png",
    "./assets/jojo-eixo-geometria.png",
    "./assets/jojo-home-jogos.png",
    "./assets/jojo-menu-ferramentas.png",
    "./assets/jojo-home-registros.png",
    "./assets/jojo-home-favoritos.png",
    "./assets/jojo-home-relatorios.png",
    "./assets/jojo-nav-home.png",
    "./assets/jojo-nav-jogos.png",
    "./assets/jojo-nav-ferramentas.png",
    "./assets/jojo-som.png",
    "./assets/jojo-timer-casa.png",
    "./assets/jojo-timer-cronometro.png",
    "./assets/jojo-timer-lanche.png",
    "./assets/jojo-watermark.png",
    "./assets/logo-profanapixelart-small.webp",
    "./assets/JOJOdownloadsemfundo.svg",
    "./assets/sounds/dragon-studio-pop-402324.mp3",
    "./assets/fonts/Maria_lucia.woff2",
    "./assets/fonts/archivo-latin.woff2",
    "./assets/fonts/inter-latin.woff2",
    "./assets/icon-192.png",
    "./assets/icon-512.png",
    "./assets/icon-maskable-192.png",
    "./assets/icon-maskable-512.png",
    "./jogos/",
    "./jogos/index.html",
    "./jogos/jogos.css",
    "./jogos/jogos.js",
    "./jogos/jogos.data.js",
    "./jogos/palavras/",
    "./jogos/palavras/index.html",
    "./jogos/palavras/styles.css",
    "./jogos/palavras/app.js",
    "./jogos/palavras/data.js",
    "./jogos/textos/",
    "./jogos/textos/index.html",
    "./jogos/textos/styles.css",
    "./jogos/textos/app.js",
    "./jogos/textos/data.js",
    "./jogos/popit-soma/",
    "./jogos/popit-soma/index.html",
    "./jogos/popit-soma/styles.css",
    "./jogos/popit-soma/app.js",
    "./jogos/popit-subtracao/",
    "./jogos/popit-subtracao/index.html",
    "./jogos/popit-subtracao/styles.css",
    "./jogos/popit-subtracao/app.js",
    "./jogos/tabuada-pitagoras/",
    "./jogos/tabuada-pitagoras/index.html",
    "./jogos/tabuada-pitagoras/styles.css",
    "./jogos/tabuada-pitagoras/app.js",
    "./jogos/timer/",
    "./jogos/timer/index.html",
    "./jogos/timer/styles.css",
    "./jogos/timer/app.js",
    "./jogos/timer/data.js",
    "./jogos/timer/hourglass-component.html",
    "./jogos/timer/assets/carnes.webp",
    "./jogos/timer/assets/casa.webp",
    "./jogos/timer/assets/comida.webp",
    "./jogos/timer/assets/coracao-com-fome.webp",
    "./jogos/timer/assets/coracao-feliz.webp",
    "./jogos/timer/assets/crianca.webp",
    "./jogos/timer/assets/frutas.webp",
    "./jogos/timer/assets/hamburguer.webp",
    "./jogos/timer/assets/legumes.webp",
    "./jogos/timer/assets/pizza.webp",
    "./jogos/timer/assets/tacos.webp",
    "./agenda/",
    "./agenda/index.html",
    "./agenda/styles.css",
    "./agenda/app.js"
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
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE_VERSION)
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== "GET") {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
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
                const copy = response.clone();
                caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
                return response;
            });
        })
    );
});
