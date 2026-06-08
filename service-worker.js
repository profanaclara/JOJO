const CACHE_VERSION = "jojo-static-v2026-06-08-11";
const APP_SHELL = [
    "./",
    "./index.html",
    "./offline.html",
    "./manifest.webmanifest",
    "./styles/main.css?v=9",
    "./styles/menu.css?v=8",
    "./scripts/app.js?v=2",
    "./scripts/data.js?v=4",
    "./scripts/pwa.js?v=17",
    "./assets/jojo-eyes-logo.png",
    "./assets/jojo-horizontal.svg",
    "./assets/jojologo-fundo-branco.svg",
    "./assets/JOJOdownload.svg",
    "./assets/JOJOdownloadsemfundo.svg",
    "./assets/logo-profanapixelart.png",
    "./assets/logo-profanapixelart-small.webp",
    "./assets/controle.svg",
    "./assets/cerebro.png",
    "./assets/jojo-card-geometria.png",
    "./assets/jojo-card-palavras.png",
    "./assets/jojo-card-textos.png",
    "./assets/jojo-card-popit.png",
    "./assets/jojo-card-pitagoras.png",
    "./assets/jojo-card-cabo-guerra.png",
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
    "./assets/fonts/Maria_lucia.woff2",
    "./assets/fonts/archivo-latin.woff2",
    "./assets/fonts/inter-latin.woff2",
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
    "./jogos/textos/styles.css?v=11",
    "./jogos/textos/app.js?v=10",
    "./jogos/textos/data.js?v=2",
    "./jogos/textos/assets/jojo-eyes-logo.png",
    "./jogos/index.html",
    "./jogos/jogos.css?v=5",
    "./jogos/jogos.js?v=8",
    "./jogos/jogos.data.js?v=10",
    "./jogos/popit-soma/",
    "./jogos/popit-soma/index.html",
    "./jogos/popit-soma/styles.css?v=6",
    "./jogos/popit-soma/app.js?v=5",
    "./jogos/popit-subtracao/",
    "./jogos/popit-subtracao/index.html",
    "./jogos/popit-subtracao/styles.css",
    "./jogos/popit-subtracao/app.js?v=4",
    "./jogos/tabuada-pitagoras/",
    "./jogos/tabuada-pitagoras/index.html",
    "./jogos/tabuada-pitagoras/styles.css?v=12",
    "./jogos/tabuada-pitagoras/app.js?v=8",
    "./agenda/",
    "./agenda/index.html",
    "./agenda/styles.css",
    "./agenda/app.js",
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
