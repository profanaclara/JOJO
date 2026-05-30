const CACHE_VERSION = "jojo-static-v2026-05-30-3";
const APP_SHELL = [
    "./",
    "./index.html",
    "./offline.html",
    "./manifest.webmanifest",
    "./styles/main.css?v=6",
    "./scripts/app.js",
    "./scripts/data.js",
    "./scripts/pwa.js?v=13",
    "./assets/jojo-eyes-logo.png",
    "./assets/jojo-horizontal.svg",
    "./assets/jojologo-fundo-branco.svg",
    "./assets/JOJOdownload.svg",
    "./assets/JOJOdownloadsemfundo.svg",
    "./assets/logo-profanapixelart.png",
    "./assets/controle.svg",
    "./assets/cerebro.png",
    "./assets/fonts/Maria_lucia.woff2",
    "./assets/icon-192.png",
    "./assets/icon-512.png",
    "./assets/icon-maskable-192.png",
    "./assets/icon-maskable-512.png",
    "./jogos/palavras/",
    "./jogos/palavras/index.html",
    "./jogos/palavras/styles.css",
    "./jogos/palavras/app.js",
    "./jogos/palavras/data.js",
    "./jogos/palavras/assets/jojo-eyes-logo.png",
    "./jogos/textos/",
    "./jogos/textos/index.html",
    "./jogos/textos/styles.css?v=2",
    "./jogos/textos/app.js?v=2",
    "./jogos/textos/data.js?v=2",
    "./jogos/textos/assets/jojo-eyes-logo.png",
    "./jogos/timer/",
    "./jogos/timer/index.html",
    "./jogos/timer/styles.css?v=3",
    "./jogos/timer/app.js?v=2",
    "./jogos/timer/data.js",
    "./jogos/timer/assets/jojo-eyes-logo.png",
    "./jogos/timer/assets/carnes.gif",
    "./jogos/timer/assets/comida.svg",
    "./jogos/timer/assets/casa.gif",
    "./jogos/timer/assets/coracao-com-fome.gif",
    "./jogos/timer/assets/coracao-feliz.gif",
    "./jogos/timer/assets/crianca.gif",
    "./jogos/timer/assets/frutas.gif",
    "./jogos/timer/assets/hamburguer.gif",
    "./jogos/timer/assets/legumes.gif",
    "./jogos/timer/assets/onibus.gif",
    "./jogos/timer/assets/pizza.gif",
    "./jogos/timer/assets/tacos.gif",
    "./jogos/cabo-de-guerra/",
    "./jogos/cabo-de-guerra/index.html",
    "./jogos/cabo-de-guerra/styles.css",
    "./jogos/cabo-de-guerra/app.js",
    "./jogos/cabo-de-guerra/gif-frame.html",
    "./jogos/cabo-de-guerra/assets/jojo-eyes-logo.png",
    "./jogos/cabo-de-guerra/assets/cabo-de-guerra-2.gif?v=2",
    "./jogos/cabo-de-guerra/assets/cabo-de-guerra-2.gif",
    "./jogos/cabo-de-guerra/assets/equipe-azul.gif",
    "./jogos/cabo-de-guerra/assets/equipe-vermelha.gif",
    "./jogos/cabo-de-guerra/assets/ganhou-azul.gif",
    "./jogos/cabo-de-guerra/assets/ganhou-vermelho.gif",
    "./jogos/cabo-de-guerra-operacoes-fracoes/",
    "./jogos/cabo-de-guerra-operacoes-fracoes/index.html",
    "./jogos/cabo-de-guerra-operacoes-fracoes/styles.css?v=7",
    "./jogos/cabo-de-guerra-operacoes-fracoes/app.js?v=6",
    "./jogos/cabo-de-guerra-operacoes-fracoes/gif-frame.html",
    "./jogos/cabo-de-guerra-operacoes-fracoes/assets/jojo-eyes-logo.png",
    "./jogos/cabo-de-guerra-operacoes-fracoes/assets/cabo-de-guerra-2.gif",
    "./jogos/cabo-de-guerra-operacoes-fracoes/assets/equipe-azul.gif",
    "./jogos/cabo-de-guerra-operacoes-fracoes/assets/equipe-vermelha.gif",
    "./jogos/cabo-de-guerra-operacoes-fracoes/assets/ganhou-azul.gif",
    "./jogos/cabo-de-guerra-operacoes-fracoes/assets/ganhou-vermelho.gif",
    "./jogos/cabo-de-guerra-operacoes-fracoes/assets/musicacabodeguerra.mp3"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then(async (cache) => {
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
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_VERSION)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
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
