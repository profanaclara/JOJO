const state = {
    activeSection: null,
    activeTab: null,
    lastTrigger: null
};

const sections = window.JOJO_DATA.sections;

const ui = {
    body: document.body,
    backdrop: document.getElementById("sheetBackdrop"),
    sheet: document.getElementById("appSheet"),
    sheetEyebrow: document.getElementById("sheetEyebrow"),
    sheetTitle: document.getElementById("sheetTitle"),
    sheetTabs: document.getElementById("sheetTabs"),
    sheetContent: document.getElementById("sheetContent"),
    closeButton: document.getElementById("sheetCloseBtn"),
    homeButtons: [...document.querySelectorAll("[data-section]")]
};

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function renderListCard(item) {
    const placeholderClass = item.placeholder ? " placeholder-card" : "";
    const art = item.art ? `<img class="list-card__art" src="${item.art}" alt="" aria-hidden="true" loading="lazy" decoding="async">` : "";
    const tagBadge = item.tag ? `<span class="card-badge">${escapeHtml(item.tag)}</span>` : "";
    const description = item.description ? `<p>${escapeHtml(item.description)}</p>` : "";
    const tag = item.href ? "a" : "article";
    const href = item.href
        ? item.external
            ? ` href="${item.href}" target="_blank" rel="noreferrer"`
            : ` href="${item.href}"`
        : "";
    const interactiveClass = item.href ? " list-card--link" : "";

    return `
        <${tag} class="list-card${placeholderClass}${interactiveClass}"${href}>
            ${art}
            <div class="list-card__body">
                ${tagBadge}
                <h3>${escapeHtml(item.title)}</h3>
                ${description}
            </div>
        </${tag}>
    `;
}

function renderInfoCard(card) {
    return `
        <article class="section-card">
            <div class="section-card__title">
                <span class="card-badge">${escapeHtml(card.tag || "Informação")}</span>
                <span>${escapeHtml(card.title)}</span>
            </div>
            <p>${escapeHtml(card.description)}</p>
        </article>
    `;
}

function openSheet(sectionKey, trigger = null) {
    const section = sections[sectionKey];
    if (!section) {
        return;
    }

    state.lastTrigger = trigger;
    state.activeSection = sectionKey;
    state.activeTab = section.type === "tabs" ? section.tabs[0]?.id || null : null;

    renderSheet();

    ui.sheet.classList.add("is-open");
    ui.backdrop.classList.remove("hidden");
    ui.sheet.setAttribute("aria-hidden", "false");
    ui.body.classList.add("sheet-open");

    requestAnimationFrame(() => {
        ui.closeButton.focus();
    });
}

function closeSheet() {
    ui.sheet.classList.remove("is-open");
    ui.backdrop.classList.add("hidden");
    ui.sheet.setAttribute("aria-hidden", "true");
    ui.body.classList.remove("sheet-open");
    state.activeSection = null;
    state.activeTab = null;

    if (state.lastTrigger) {
        state.lastTrigger.focus();
    }
    state.lastTrigger = null;
}

function renderTabs(section) {
    if (section.type !== "tabs") {
        ui.sheetTabs.classList.add("hidden");
        ui.sheetTabs.innerHTML = "";
        return;
    }

    ui.sheetTabs.classList.remove("hidden");
    ui.sheetTabs.innerHTML = section.tabs
        .map((tab) => `
            <button
                id="tab-${tab.id}"
                class="tab-button ${tab.id === state.activeTab ? "is-active" : ""}"
                type="button"
                data-tab="${tab.id}"
                role="tab"
                tabindex="${tab.id === state.activeTab ? "0" : "-1"}"
                aria-selected="${tab.id === state.activeTab}"
                aria-controls="tabpanel-${tab.id}"
            >
                ${escapeHtml(tab.label)}
            </button>
        `)
        .join("");
}

function renderContent(section) {
    if (section.type === "tabs") {
        const activeTab = section.tabs.find((tab) => tab.id === state.activeTab) || section.tabs[0];
        ui.sheetContent.setAttribute("role", "tabpanel");
        ui.sheetContent.setAttribute("id", `tabpanel-${activeTab.id}`);
        ui.sheetContent.setAttribute("aria-labelledby", `tab-${activeTab.id}`);
        ui.sheetContent.innerHTML = activeTab.items.map(renderListCard).join("");
        return;
    }

    ui.sheetContent.removeAttribute("role");
    ui.sheetContent.removeAttribute("id");
    ui.sheetContent.removeAttribute("aria-labelledby");

    if (section.type === "list") {
        ui.sheetContent.innerHTML = section.items.map(renderListCard).join("");
        return;
    }

    ui.sheetContent.innerHTML = section.cards.map(renderInfoCard).join("");
}

function renderSheet() {
    const section = sections[state.activeSection];
    if (!section) {
        return;
    }

    ui.sheetEyebrow.textContent = section.eyebrow;
    ui.sheetTitle.textContent = section.title;
    renderTabs(section);
    renderContent(section);
}

ui.homeButtons.forEach((button) => {
    button.addEventListener("click", () => openSheet(button.dataset.section, button));
});

ui.closeButton.addEventListener("click", closeSheet);
ui.backdrop.addEventListener("click", closeSheet);

ui.sheetTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) {
        return;
    }

    state.activeTab = button.dataset.tab;
    renderSheet();
});

ui.sheetTabs.addEventListener("keydown", (event) => {
    const tabs = [...ui.sheetTabs.querySelectorAll("[data-tab]")];
    if (!tabs.length) {
        return;
    }

    const currentIndex = tabs.findIndex((tab) => tab.dataset.tab === state.activeTab);
    if (currentIndex === -1) {
        return;
    }

    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
        nextIndex = 0;
    } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
    } else {
        return;
    }

    event.preventDefault();
    state.activeTab = tabs[nextIndex].dataset.tab;
    renderSheet();
    ui.sheetTabs.querySelector(`[data-tab="${state.activeTab}"]`)?.focus();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.activeSection) {
        closeSheet();
    }
});
