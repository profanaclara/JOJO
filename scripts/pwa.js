let deferredInstallPrompt = null;

function getRootUrl() {
    const scriptUrl = new URL(document.currentScript.src, window.location.href);
    return new URL("../", scriptUrl);
}

function isStandaloneMode() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function normalizePath(pathname) {
    return String(pathname || "").replace(/\\/g, "/");
}

function isPlatformHome() {
    const path = normalizePath(window.location.pathname);
    const isRootHome = path === "/" || path === "/index.html";
    const isProjectHome = /\/JOJO\/?$/.test(path) || /\/JOJO\/index\.html$/.test(path);
    const hasPlatformHomeMarkup = Boolean(
        document.getElementById("installAppBtn")
        && document.querySelector(".app-screen .home-actions")
    );

    return isRootHome || isProjectHome || hasPlatformHomeMarkup;
}

function isVisibleHomeScreen() {
    const homeScreen = document.querySelector("#homeScreen.screen--home");
    return Boolean(homeScreen && !homeScreen.classList.contains("hidden"));
}

function isVisibleMathSetupFirstStep() {
    const app = document.getElementById("app");
    if (!app || !app.classList.contains("math-tug-app") || !app.classList.contains("is-setup-open")) {
        return false;
    }

    const firstStep = document.querySelector('[data-step-panel="1"]');
    return Boolean(firstStep && !firstStep.classList.contains("hidden"));
}

function shouldShowInstallButtonForCurrentView() {
    return isPlatformHome();
}

function removeInstallButtonOutsidePlatform() {
    if (isPlatformHome()) {
        return;
    }

    const button = document.getElementById("installAppBtn");
    if (button) {
        button.remove();
    }
}

function ensureFloatingButtonStyles() {
    if (document.getElementById("pwaFloatingStyles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "pwaFloatingStyles";
    style.textContent = `
        .install-app-button--floating {
            position: fixed;
            top: calc(env(safe-area-inset-top, 0px) + 14px);
            right: 14px;
            z-index: 999;
            width: 68px;
            height: 68px;
            padding: 0;
            border: 0;
            border-radius: 24px;
            background: rgba(255, 255, 255, 0.96);
            color: #197bc0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 12px 30px rgba(15, 75, 121, 0.16);
        }

        .install-app-button--floating[hidden] {
            display: none !important;
        }

        .install-app-button__icon {
            width: 34px;
            height: 34px;
            object-fit: contain;
            display: block;
        }

        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }

        .install-app-button--floating:active {
            transform: scale(0.98);
        }

        @media (max-width: 680px) {
            .install-app-button--floating {
                top: calc(env(safe-area-inset-top, 0px) + 10px);
                right: 10px;
                width: 58px;
                height: 58px;
                border-radius: 20px;
            }

            .install-app-button__icon {
                width: 28px;
                height: 28px;
            }
        }
    `;

    document.head.appendChild(style);
}

function ensureInstallButton() {
    if (!isPlatformHome()) {
        removeInstallButtonOutsidePlatform();
        return null;
    }

    let button = document.getElementById("installAppBtn");
    const rootUrl = getRootUrl();
    const iconUrl = new URL("assets/JOJOdownload.svg", rootUrl);

    if (!button) {
        ensureFloatingButtonStyles();
        button = document.createElement("button");
        button.type = "button";
        button.id = "installAppBtn";
        document.body.appendChild(button);
    }

    ensureFloatingButtonStyles();
    button.className = "install-app-button install-app-button--floating";
    button.hidden = true;
    button.setAttribute("aria-label", "Baixar app JOJO");
    button.setAttribute("title", "Baixar app JOJO");
    button.innerHTML = `<img class="install-app-button__icon" src="${iconUrl}" alt=""><span>Baixar App</span>`;

    return button;
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    const rootUrl = getRootUrl();
    const serviceWorkerUrl = new URL("service-worker.js", rootUrl);

    navigator.serviceWorker.register(serviceWorkerUrl, {
        scope: rootUrl.pathname,
        updateViaCache: "none"
    }).then((registration) => {
        registration.update().catch(() => {});
    }).catch((error) => {
        console.warn("Nao foi possivel registrar o modo offline.", error);
    });
}

function showInstallButton() {
    const button = ensureInstallButton();
    if (!button) {
        return;
    }
    button.hidden = false;
}

function hideInstallButton() {
    const button = document.getElementById("installAppBtn");
    if (!button) {
        return;
    }
    button.hidden = true;
}

function bindInstallButton() {
    const button = ensureInstallButton();
    if (!button) {
        return;
    }

    button.addEventListener("click", async () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            const choice = await deferredInstallPrompt.userChoice;
            if (choice.outcome === "accepted") {
                hideInstallButton();
            }
            deferredInstallPrompt = null;
            return;
        }

        const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
        const message = isIos
            ? "No iPhone ou iPad, abra no Safari, toque em Compartilhar e escolha 'Adicionar à Tela de Início'."
            : "Abra o menu do navegador e escolha 'Instalar app' ou 'Adicionar à tela inicial'.";

        window.alert(message);
    });
}

function updateInstallButtonVisibility() {
    if (!isPlatformHome()) {
        removeInstallButtonOutsidePlatform();
        return;
    }

    if (!shouldShowInstallButtonForCurrentView()) {
        hideInstallButton();
        return;
    }

    showInstallButton();
}

function watchInstallButtonContext() {
    if (!document.body) {
        return;
    }

    const observer = new MutationObserver(() => {
        updateInstallButtonVisibility();
    });

    observer.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "data-setup-step"],
    });

    window.addEventListener("pageshow", updateInstallButtonVisibility);
    window.addEventListener("resize", updateInstallButtonVisibility);
    document.addEventListener("visibilitychange", updateInstallButtonVisibility);
}

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButtonVisibility();
});

window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    hideInstallButton();
});

registerServiceWorker();
bindInstallButton();
watchInstallButtonContext();

updateInstallButtonVisibility();
