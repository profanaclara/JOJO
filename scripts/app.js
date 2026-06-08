const data = window.JOJO_DATA;

const ui = {
    body: document.body,
    heroSub: document.getElementById("heroSub"),
    primaryGrid: document.getElementById("primaryGrid"),
    smallGrid: document.getElementById("smallGrid"),
    navItems: [...document.querySelectorAll("[data-nav]")],
    panelBackdrop: document.getElementById("panelBackdrop"),
    panel: document.getElementById("infoPanel"),
    panelTitle: document.getElementById("panelTitle"),
    panelDescription: document.getElementById("panelDescription"),
    panelContent: document.getElementById("panelContent"),
    panelCloseBtn: document.getElementById("panelCloseBtn")
};

let panelCloseTimer = null;

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function renderPrimaryCard(item) {
    const tag = item.href ? "a" : "button";
    const href = item.href ? ` href="${item.href}"` : "";
    const type = item.href ? "" : ' type="button"';
    const action = item.action ? ` data-action="${item.action}"` : "";

    return `
        <${tag} class="main-card main-card--${item.variant}"${href}${type}${action}>
            <img class="main-card__art" src="${item.icon}" alt="" aria-hidden="true">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.description)}</span>
            <span class="card-action">
                ${escapeHtml(item.buttonLabel)}
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>
            </span>
        </${tag}>
    `;
}

function renderSmallCard(item) {
    const tag = item.href ? "a" : "button";
    const href = item.href ? ` href="${item.href}"` : "";
    const type = item.href ? "" : ' type="button"';
    const action = item.action ? ` data-action="${item.action}"` : "";
    const infoId = item.id ? ` data-info-id="${escapeHtml(item.id)}"` : "";

    return `
        <${tag} class="mini-card mini-card--${item.variant}"${href}${type}${action}${infoId}>
            <img class="mini-card__art" src="${item.icon}" alt="" aria-hidden="true">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.description)}</span>
            <i aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>
            </i>
        </${tag}>
    `;
}

function setActiveNav(name) {
    ui.navItems.forEach((item) => {
        const isActive = item.dataset.nav === name;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-current", isActive ? "page" : "false");
    });
}

function openPanel(title, description, content = "") {
    if (panelCloseTimer) {
        window.clearTimeout(panelCloseTimer);
        panelCloseTimer = null;
    }

    ui.panelTitle.textContent = title;
    ui.panelDescription.textContent = description;
    ui.panelContent.innerHTML = content;
    ui.panelBackdrop.classList.remove("hidden");
    ui.panel.classList.add("is-open");
    ui.panel.setAttribute("aria-hidden", "false");
    ui.body.classList.add("panel-open");

    requestAnimationFrame(() => {
        ui.panelBackdrop.classList.add("is-visible");
        ui.panelCloseBtn.focus();
    });
}

function closePanel() {
    ui.panelBackdrop.classList.remove("is-visible");
    ui.panel.classList.remove("is-open");
    ui.panel.setAttribute("aria-hidden", "true");
    ui.body.classList.remove("panel-open");
    setActiveNav("home");

    panelCloseTimer = window.setTimeout(() => {
        ui.panelBackdrop.classList.add("hidden");
        panelCloseTimer = null;
    }, 180);
}

function openReadingPanel() {
    const links = data.readingOptions
        .map((item) => `<a class="panel-link" href="${item.href}">${escapeHtml(item.title)}</a>`)
        .join("");
    openPanel("Leitura", "Escolha o tipo de atividade.", links);
    setActiveNav("jogos");
}

function openProfilePanel() {
    const credit = `
        <div class="panel-credit">
            <img src="./assets/logo-profanapixelart-small.webp" alt="">
            <span>${escapeHtml(data.about.credits)}</span>
        </div>
    `;
    openPanel(data.about.title, data.about.description, credit);
    setActiveNav("profile");
}

function openSoonPanel() {
    openPanel(data.soon.title, data.soon.description);
}

function openSmallInfoPanel(id) {
    const item = data.smallCards.find((card) => card.id === id);
    if (!item) {
        openSoonPanel();
        return;
    }

    openPanel(item.panelTitle || item.title, item.panelDescription || item.description);
}

function handleAction(action, source) {
    if (action === "reading") {
        openReadingPanel();
    }

    if (action === "soon") {
        openSoonPanel();
    }

    if (action === "small-info") {
        openSmallInfoPanel(source.dataset.infoId);
    }
}

function handleNavClick(event) {
    const target = event.currentTarget.dataset.nav;

    if (target === "home") {
        event.preventDefault();
        closePanel();
        setActiveNav("home");
    }

}

function setHeroGreeting() {
    if (!ui.heroSub) {
        return;
    }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    ui.heroSub.textContent = `${greeting}, Professor!`;
}

function openInitialPanelFromUrl() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("panel") === "leitura") {
        openReadingPanel();
    }
}

setHeroGreeting();
ui.primaryGrid.innerHTML = data.primaryCards.map(renderPrimaryCard).join("");
ui.smallGrid.innerHTML = data.smallCards.map(renderSmallCard).join("");

document.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (actionTarget) {
        handleAction(actionTarget.dataset.action, actionTarget);
    }
});

ui.navItems.forEach((item) => item.addEventListener("click", handleNavClick));
ui.panelCloseBtn.addEventListener("click", closePanel);
ui.panelBackdrop.addEventListener("click", closePanel);
openInitialPanelFromUrl();

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && ui.panel.classList.contains("is-open")) {
        closePanel();
    }
});
