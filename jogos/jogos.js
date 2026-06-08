const data = window.JOJO_GAMES;

const ui = {
    body: document.body,
    tabs: [...document.querySelectorAll(".eixo-tab")],
    grid: document.getElementById("jogosGrid"),
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

function cardTemplate(card) {
    const tag = card.href && !card.disabled ? "a" : "button";
    const href = tag === "a" ? ` href="${card.href}"` : "";
    const disabled = card.disabled ? " disabled aria-disabled=\"true\"" : "";
    const type = tag === "button" ? " type=\"button\"" : "";

    return `
        <${tag} class="game-card${card.disabled ? " is-disabled" : ""}"${href}${type}${disabled}>
            <img src="${card.art}" alt="" aria-hidden="true">
            <strong>${escapeHtml(card.title)}</strong>
            <span>${escapeHtml(card.description)}</span>
            <small>${escapeHtml(card.status)}</small>
        </${tag}>
    `;
}

function renderEixo(id) {
    const eixo = data.eixos[id] || data.eixos.alfabetizacao;
    ui.grid.innerHTML = eixo.cards.map(cardTemplate).join("");

    ui.tabs.forEach((tab) => {
        const active = tab.dataset.eixo === id;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
    });

    const params = new URLSearchParams(window.location.search);
    params.set("eixo", id);
    history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
}

function setActiveNav(name) {
    ui.navItems.forEach((item) => {
        const active = item.dataset.nav === name;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-current", active ? "page" : "false");
    });
}

function closePanel() {
    ui.panelBackdrop.classList.remove("is-visible");
    ui.panel.classList.remove("is-open");
    ui.panel.setAttribute("aria-hidden", "true");
    ui.body.classList.remove("panel-open");
    setActiveNav("jogos");

    panelCloseTimer = window.setTimeout(() => {
        ui.panelBackdrop.classList.add("hidden");
        panelCloseTimer = null;
    }, 180);
}

ui.tabs.forEach((tab) => {
    tab.addEventListener("click", () => renderEixo(tab.dataset.eixo));
});

ui.panelCloseBtn.addEventListener("click", closePanel);
ui.panelBackdrop.addEventListener("click", closePanel);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && ui.panel.classList.contains("is-open")) {
        closePanel();
    }
});

const initialEixo = new URLSearchParams(window.location.search).get("eixo") || "alfabetizacao";
renderEixo(initialEixo);
