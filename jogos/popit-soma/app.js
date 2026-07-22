const TOTAL_BUBBLES = 20;

const ui = {
    soundBtn: document.getElementById("soundBtn"),
    addendAInput: document.getElementById("addendAInput"),
    addendBInput: document.getElementById("addendBInput"),
    targetA: document.getElementById("targetA"),
    targetB: document.getElementById("targetB"),
    countA: document.getElementById("countA"),
    countB: document.getElementById("countB"),
    goals: [...document.querySelectorAll(".goal-chip")],
    board: document.getElementById("popitBoard"),
    tray: document.getElementById("countTray"),
    countedValue: document.getElementById("countedValue"),
    countResult: document.getElementById("countResult"),
    resultEquation: document.getElementById("resultEquation"),
    resultValue: document.getElementById("resultValue"),
    resultHint: document.getElementById("resultHint"),
    topAnswerValue: document.getElementById("topAnswerValue"),
    resultBtn: document.getElementById("resultBtn"),
    modeBtn: document.getElementById("modeBtn"),
    resetBtn: document.getElementById("resetBtn"),
    undoBtn: document.getElementById("undoBtn")
};

const state = {
    sound: true,
    popAudio: null,
    mode: "automatic",
    a: null,
    b: null,
    activeGroup: "a",
    bubbles: [],
    tray: [],
    history: [],
    revealed: false
};

function randomAddends() {
    const a = Math.floor(Math.random() * 5) + 2;
    const b = Math.floor(Math.random() * 5) + 1;
    return a + b <= 10 ? [a, b] : [a, 10 - a];
}

function hasProblem() {
    return state.a !== null && state.b !== null;
}

function formatTarget(value) {
    return value === null ? "?" : value;
}

function resetState(keepProblem = true) {
    state.bubbles = Array.from({ length: TOTAL_BUBBLES }, () => null);
    state.tray = [];
    state.history = [];
    state.revealed = false;
    if (!keepProblem && state.mode === "automatic") {
        [state.a, state.b] = randomAddends();
        syncInputs();
    }
    state.activeGroup = state.a > 0 ? "a" : "b";
    render();
}

function clampDigit(value) {
    const number = Number.parseInt(String(value), 10);
    if (Number.isNaN(number)) {
        return null;
    }
    return Math.max(0, Math.min(9, number));
}

function syncInputs() {
    ui.addendAInput.value = formatTarget(state.a) === "?" ? "" : state.a;
    ui.addendBInput.value = formatTarget(state.b) === "?" ? "" : state.b;
}

function updateModeUI() {
    const automatic = state.mode === "automatic";
    ui.modeBtn.textContent = automatic ? "Automático" : "Manual";
    ui.modeBtn.setAttribute("aria-label", automatic ? "Modo automático" : "Modo manual");
    ui.addendAInput.readOnly = automatic;
    ui.addendBInput.readOnly = automatic;
}

function setMode(mode, silent = false) {
    state.mode = mode;
    if (mode === "automatic") {
        [state.a, state.b] = randomAddends();
    } else {
        state.a = null;
        state.b = null;
    }
    syncInputs();
    updateModeUI();
    resetState(true);
    if (!silent) {
        softPop(mode === "automatic" ? 0.56 : 0.36);
    }
}

function toggleMode() {
    setMode(state.mode === "automatic" ? "manual" : "automatic");
}

function applyManualProblem() {
    if (state.mode !== "manual") {
        return;
    }
    state.a = clampDigit(ui.addendAInput.value);
    state.b = clampDigit(ui.addendBInput.value);
    syncInputs();
    resetState(true);
}

function countGroup(group) {
    return state.bubbles.filter((value) => value === group).length;
}

function totalTarget() {
    return (state.a || 0) + (state.b || 0);
}

function countedTotal() {
    return state.tray.filter((ball) => ball.counted).length;
}

function canRevealAnswer() {
    const counted = countedTotal();
    return hasProblem() && (
        (totalTarget() === 0 && state.a !== null && state.b !== null) ||
        (state.tray.length > 0 && counted === totalTarget())
    );
}

function equationPreview(revealed = false) {
    const a = formatTarget(state.a);
    const b = formatTarget(state.b);
    const total = revealed && hasProblem() ? totalTarget() : "?";
    return `${a} + ${b} = ${total}`;
}

function remainingFor(group) {
    if (!hasProblem()) {
        return 0;
    }
    return group === "a" ? state.a - countGroup("a") : state.b - countGroup("b");
}

function selectedBubbles() {
    return state.bubbles
        .map((group, index) => ({ group, index }))
        .filter((item) => item.group);
}

function isSelectionComplete() {
    return hasProblem() && countGroup("a") === state.a && countGroup("b") === state.b;
}

function chooseGroup(group) {
    if (!hasProblem() || remainingFor(group) <= 0 || state.tray.length) {
        return;
    }
    state.activeGroup = group;
    renderGoals();
}

function pressBubble(index) {
    if (!hasProblem()) {
        softPop(0.28);
        renderStatus();
        return;
    }

    if (state.tray.length || state.bubbles[index]) {
        softPop(0.34);
        return;
    }

    const group = remainingFor(state.activeGroup) > 0
        ? state.activeGroup
        : remainingFor("a") > 0
            ? "a"
            : "b";

    if (remainingFor(group) <= 0) {
        return;
    }

    state.bubbles[index] = group;
    state.history.push(index);
    softPop(group === "a" ? 0.68 : 0.78);

    if (remainingFor(group) === 0 && remainingFor(group === "a" ? "b" : "a") > 0) {
        state.activeGroup = group === "a" ? "b" : "a";
    }

    if (isSelectionComplete()) {
        window.setTimeout(joinBubbles, 260);
    }

    render();
}

function joinBubbles() {
    if (!isSelectionComplete() || state.tray.length) {
        return;
    }
    state.tray = selectedBubbles().map((item, order) => ({
        id: `${item.index}-${order}`,
        counted: false
    }));
    softPop(0.48);
    render();
}

function countTrayBall(index) {
    const ball = state.tray[index];
    if (!ball || ball.counted) {
        softPop(0.32);
        return;
    }
    ball.counted = true;
    softPop(0.9);
    renderTray();
    renderStatus();

    if (canRevealAnswer() && !state.revealed) {
        revealResult(0.84);
    }
}

function undo() {
    if (state.tray.length) {
        state.tray = [];
        render();
        return;
    }

    const index = state.history.pop();
    if (index === undefined) {
        return;
    }

    state.bubbles[index] = null;
    if (countGroup("a") < (state.a || 0)) {
        state.activeGroup = "a";
    }
    softPop(0.4);
    render();
}

function render() {
    updateModeUI();
    ui.targetA.textContent = formatTarget(state.a);
    ui.targetB.textContent = formatTarget(state.b);
    renderGoals();
    renderBoard();
    renderTray();
    renderStatus();
}

function renderGoals() {
    ui.countA.textContent = countGroup("a");
    ui.countB.textContent = countGroup("b");
    ui.goals.forEach((button) => {
        const group = button.dataset.group;
        const active = hasProblem() && state.activeGroup === group && !state.tray.length;
        const complete = hasProblem() && remainingFor(group) <= 0;
        button.classList.toggle("is-active", active);
        button.classList.toggle("is-complete", complete);
        button.setAttribute("aria-pressed", active ? "true" : "false");
    });
}

function renderBoard() {
    ui.board.innerHTML = state.bubbles.map((group, index) => {
        const classes = [
            "bubble",
            group ? `is-${group}` : "",
            state.tray.length && group ? "is-collected" : ""
        ].filter(Boolean).join(" ");
        const label = group ? "Bolinha apertada" : "Apertar bolinha";
        return `<button class="${classes}" type="button" data-index="${index}" aria-label="${label}"></button>`;
    }).join("");
}

function renderTray() {
    ui.tray.innerHTML = state.tray.map((ball, index) => {
        const delay = Math.min(index * 18, 220);
        return `
            <button
                class="count-ball${ball.counted ? " is-counted" : ""}"
                type="button"
                data-tray-index="${index}"
                style="animation-delay:${delay}ms"
                aria-label="Contar bolinha"
            ></button>
        `;
    }).join("");
    ui.countedValue.textContent = countedTotal();
}

function renderStatus() {
    const canReveal = canRevealAnswer();
    const revealed = canReveal && state.revealed;
    ui.topAnswerValue.textContent = revealed ? totalTarget() : "?";
    ui.topAnswerValue.classList.toggle("is-revealed", revealed);
    ui.countedValue.textContent = revealed ? "OK" : countedTotal();
    ui.countedValue.setAttribute("aria-label", revealed ? "Contagem concluida" : `Bolinhas contadas: ${countedTotal()}`);
    ui.countedValue.classList.toggle("is-complete", canReveal && !revealed);
    ui.countedValue.classList.toggle("is-confirmed", revealed);
    ui.countResult.classList.toggle("is-ready", canReveal);
    ui.countResult.classList.toggle("is-revealed", revealed);
    ui.resultEquation.textContent = equationPreview(revealed);
    ui.resultValue.textContent = revealed ? totalTarget() : "?";
    ui.resultHint.textContent = revealed
        ? "Muito bem! Esse e o total da conta."
        : "Conte todas as bolinhas para descobrir.";
    ui.resultBtn.disabled = !canReveal;
    ui.resultBtn.classList.toggle("is-ready", canReveal);
    ui.resultBtn.classList.toggle("is-revealed", revealed);
    ui.resultBtn.textContent = revealed
        ? state.mode === "automatic" ? "Próxima conta" : "Nova rodada"
        : canReveal ? "Mostrar resultado" : "Resultado";
}

function revealResult(intensity = 0.62) {
    if (!canRevealAnswer()) {
        softPop(0.28);
        return;
    }
    if (state.revealed) {
        renderStatus();
        return;
    }
    state.revealed = true;
    softPop(intensity);
    render();
}

function nextRound() {
    if (state.mode === "automatic") {
        [state.a, state.b] = randomAddends();
        syncInputs();
    }
    resetState(true);
    softPop(0.72);
}

function ensurePopAudio() {
    if (!state.popAudio) {
        state.popAudio = new Audio("../../assets/sounds/dragon-studio-pop-402324.mp3");
        state.popAudio.preload = "auto";
        state.popAudio.volume = 0.62;
        state.popAudio.playsInline = true;
    }
    return state.popAudio;
}

function primeAudio() {
    const audio = ensurePopAudio();
    if (!audio) {
        return;
    }
    audio.load();
}

function softPop(intensity = 0.6) {
    if (!state.sound) {
        return;
    }

    const source = ensurePopAudio();
    if (!source) {
        return;
    }

    const clip = source.cloneNode();
    clip.volume = Math.max(0.18, Math.min(0.92, 0.55 + intensity * 0.18));
    clip.currentTime = 0;
    clip.playsInline = true;
    clip.play().catch(() => {});
}

ui.board.addEventListener("click", (event) => {
    const button = event.target.closest("[data-index]");
    if (!button) {
        return;
    }
    pressBubble(Number(button.dataset.index));
});

ui.tray.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tray-index]");
    if (!button) {
        return;
    }
    countTrayBall(Number(button.dataset.trayIndex));
});

ui.goals.forEach((button) => {
    button.addEventListener("click", () => chooseGroup(button.dataset.group));
});

window.addEventListener("pointerdown", primeAudio, { once: true, passive: true });

ui.soundBtn.addEventListener("click", () => {
    state.sound = !state.sound;
    ui.soundBtn.setAttribute("aria-pressed", state.sound ? "true" : "false");
    if (state.sound) {
        softPop(0.5);
    }
});

ui.undoBtn.addEventListener("click", undo);
ui.resetBtn.addEventListener("click", () => resetState(true));
ui.resultBtn.addEventListener("click", () => {
    if (state.revealed) {
        nextRound();
        return;
    }
    revealResult();
});
ui.modeBtn.addEventListener("click", toggleMode);
ui.addendAInput.addEventListener("input", applyManualProblem);
ui.addendBInput.addEventListener("input", applyManualProblem);
ui.addendAInput.addEventListener("change", applyManualProblem);
ui.addendBInput.addEventListener("change", applyManualProblem);
ui.addendAInput.addEventListener("blur", applyManualProblem);
ui.addendBInput.addEventListener("blur", applyManualProblem);

setMode("automatic", true);
