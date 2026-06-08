const TOTAL_BUBBLES = 20;

const ui = {
    soundBtn: document.getElementById("soundBtn"),
    minuendInput: document.getElementById("minuendInput"),
    subtrahendInput: document.getElementById("subtrahendInput"),
    targetStart: document.getElementById("targetStart"),
    targetRemove: document.getElementById("targetRemove"),
    startCount: document.getElementById("startCount"),
    removedCount: document.getElementById("removedCount"),
    steps: [...document.querySelectorAll(".goal-chip")],
    board: document.getElementById("popitBoard"),
    tray: document.getElementById("countTray"),
    countedValue: document.getElementById("countedValue"),
    topAnswerValue: document.getElementById("topAnswerValue"),
    resultText: document.getElementById("resultText"),
    modeBtn: document.getElementById("modeBtn"),
    shuffleBtn: document.getElementById("shuffleBtn"),
    resetBtn: document.getElementById("resetBtn"),
    undoBtn: document.getElementById("undoBtn"),
    fullscreenBtn: document.getElementById("fullscreenBtn")
};

const state = {
    sound: true,
    audio: null,
    mode: "automatic",
    minuend: null,
    subtrahend: null,
    step: "start",
    bubbles: [],
    tray: [],
    history: []
};

function randomProblem() {
    const minuend = Math.floor(Math.random() * 6) + 4;
    const subtrahend = Math.floor(Math.random() * minuend);
    return [minuend, subtrahend];
}

function hasProblem() {
    return state.minuend !== null && state.subtrahend !== null;
}

function formatTarget(value) {
    return value === null ? "?" : value;
}

function clampDigit(value, min = 0) {
    const number = Number.parseInt(String(value), 10);
    if (Number.isNaN(number)) {
        return null;
    }
    return Math.max(min, Math.min(9, number));
}

function syncInputs() {
    ui.minuendInput.value = formatTarget(state.minuend) === "?" ? "" : state.minuend;
    ui.subtrahendInput.value = formatTarget(state.subtrahend) === "?" ? "" : state.subtrahend;
}

function updateModeUI() {
    const automatic = state.mode === "automatic";
    ui.modeBtn.textContent = automatic ? "Automático" : "Manual";
    ui.modeBtn.setAttribute("aria-label", automatic ? "Modo automático" : "Modo manual");
    ui.minuendInput.readOnly = automatic;
    ui.subtrahendInput.readOnly = automatic;
    ui.shuffleBtn.disabled = !automatic;
}

function setMode(mode, silent = false) {
    state.mode = mode;
    if (mode === "automatic") {
        [state.minuend, state.subtrahend] = randomProblem();
    } else {
        state.minuend = null;
        state.subtrahend = null;
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

function shuffleProblem() {
    if (state.mode !== "automatic") {
        return;
    }

    const previous = `${state.minuend}-${state.subtrahend}`;
    let next = randomProblem();
    for (let attempt = 0; attempt < 5 && `${next[0]}-${next[1]}` === previous; attempt += 1) {
        next = randomProblem();
    }
    [state.minuend, state.subtrahend] = next;
    syncInputs();
    softPop(0.58);
    resetState(true);
}

function resetState(keepProblem = true) {
    if (!keepProblem && state.mode === "automatic") {
        [state.minuend, state.subtrahend] = randomProblem();
        syncInputs();
    }
    state.step = "start";
    state.bubbles = Array.from({ length: TOTAL_BUBBLES }, () => null);
    state.tray = [];
    state.history = [];
    render();
}

function applyManualProblem() {
    if (state.mode !== "manual") {
        return;
    }
    const minuend = clampDigit(ui.minuendInput.value, 1);
    const subtrahend = clampDigit(ui.subtrahendInput.value, 0);
    state.minuend = minuend;
    state.subtrahend = minuend === null || subtrahend === null
        ? subtrahend
        : Math.min(subtrahend, minuend);
    syncInputs();
    resetState(true);
}

function countStart() {
    return state.bubbles.filter(Boolean).length;
}

function countRemoved() {
    return state.bubbles.filter((value) => value === "b").length;
}

function leftovers() {
    if (!hasProblem()) {
        return 0;
    }
    return state.minuend - state.subtrahend;
}

function isInitialComplete() {
    return hasProblem() && countStart() === state.minuend;
}

function isRemovalComplete() {
    return hasProblem() && countRemoved() === state.subtrahend;
}

function leftoverIndexes() {
    return state.bubbles
        .map((value, index) => ({ value, index }))
        .filter((item) => item.value === "a" || item.value === "leftover")
        .map((item) => item.index);
}

function pressBubble(index) {
    if (!hasProblem()) {
        softPop(0.28);
        renderStatus();
        return;
    }

    if (state.tray.length) {
        softPop(0.34);
        return;
    }

    if (state.step === "start") {
        pressInitial(index);
        return;
    }

    pressRemove(index);
}

function pressInitial(index) {
    if (state.bubbles[index]) {
        softPop(0.34);
        return;
    }

    if (countStart() >= state.minuend) {
        return;
    }

    state.bubbles[index] = "a";
    state.history.push({ type: "start", index });
    softPop(0.68);

    if (isInitialComplete()) {
        state.step = state.subtrahend > 0 ? "remove" : "count";
        if (state.subtrahend === 0) {
            window.setTimeout(prepareLeftovers, 260);
        }
    }
    render();
}

function pressRemove(index) {
    if (state.bubbles[index] !== "a") {
        softPop(0.34);
        return;
    }

    if (countRemoved() >= state.subtrahend) {
        return;
    }

    state.bubbles[index] = "b";
    state.history.push({ type: "remove", index });
    softPop(0.8);

    if (isRemovalComplete()) {
        window.setTimeout(prepareLeftovers, 280);
    }
    render();
}

function prepareLeftovers() {
    if (!isInitialComplete() || !isRemovalComplete() || state.tray.length) {
        return;
    }

    leftoverIndexes().forEach((index) => {
        state.bubbles[index] = "leftover";
    });
    state.tray = leftoverIndexes().map((index, order) => ({
        id: `${index}-${order}`,
        group: "leftover",
        counted: false
    }));
    state.step = "count";
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
}

function undo() {
    if (state.tray.length) {
        state.tray = [];
        state.step = state.subtrahend > 0 ? "remove" : "start";
        state.bubbles = state.bubbles.map((value) => value === "leftover" ? "a" : value);
        render();
        return;
    }

    const last = state.history.pop();
    if (!last) {
        return;
    }

    state.bubbles[last.index] = last.type === "remove" ? "a" : null;
    state.step = last.type;
    softPop(0.4);
    render();
}

function render() {
    updateModeUI();
    ui.targetStart.textContent = formatTarget(state.minuend);
    ui.targetRemove.textContent = formatTarget(state.subtrahend);
    ui.topAnswerValue.textContent = hasProblem() ? leftovers() : "?";
    renderSteps();
    renderBoard();
    renderTray();
    renderStatus();
}

function renderSteps() {
    ui.startCount.textContent = countStart();
    ui.removedCount.textContent = countRemoved();
    ui.steps.forEach((button) => {
        const active = hasProblem() && button.dataset.step === state.step && !state.tray.length;
        const complete = button.dataset.step === "start" ? isInitialComplete() : isRemovalComplete();
        button.classList.toggle("is-active", active);
        button.classList.toggle("is-complete", complete);
        button.setAttribute("aria-pressed", active ? "true" : "false");
    });
}

function renderBoard() {
    ui.board.innerHTML = state.bubbles.map((value, index) => {
        const classes = [
            "bubble",
            value ? `is-${value}` : "",
            state.tray.length && value ? "is-collected" : ""
        ].filter(Boolean).join(" ");
        return `<button class="${classes}" type="button" data-index="${index}" aria-label="Apertar bolinha"></button>`;
    }).join("");
}

function renderTray() {
    ui.tray.innerHTML = state.tray.map((ball, index) => {
        const delay = Math.min(index * 22, 220);
        return `
            <button
                class="count-ball is-${ball.group}${ball.counted ? " is-counted" : ""}"
                type="button"
                data-tray-index="${index}"
                style="animation-delay:${delay}ms"
                aria-label="Contar bolinha"
            ></button>
        `;
    }).join("");
    ui.countedValue.textContent = state.tray.filter((ball) => ball.counted).length;
}

function renderStatus() {
    const counted = state.tray.filter((ball) => ball.counted).length;
    ui.resultText.classList.remove("is-success");

    if (!hasProblem()) {
        ui.resultText.textContent = "Digite a conta.";
        return;
    }

    if (state.tray.length && counted === leftovers()) {
        ui.resultText.textContent = `Sobrou ${leftovers()}`;
        ui.resultText.classList.add("is-success");
        return;
    }

    if (state.tray.length) {
        ui.resultText.textContent = `Conte: ${counted}/${leftovers()}`;
        return;
    }

    if (!isInitialComplete()) {
        ui.resultText.textContent = `Inicial: ${state.minuend - countStart()}`;
        return;
    }

    if (!isRemovalComplete()) {
        ui.resultText.textContent = `Retire: ${state.subtrahend - countRemoved()}`;
        return;
    }

    ui.resultText.textContent = "Juntando";
}

function ensureAudio() {
    if (!state.audio) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            return null;
        }
        state.audio = new AudioContext();
    }
    if (state.audio.state === "suspended") {
        state.audio.resume();
    }
    return state.audio;
}

function softPop(intensity = 0.6) {
    if (!state.sound) {
        return;
    }

    const audio = ensureAudio();
    if (!audio) {
        return;
    }

    const duration = 0.095;
    const now = audio.currentTime;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12 * intensity, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    gain.connect(audio.destination);

    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150 + intensity * 80, now);
    osc.frequency.exponentialRampToValueAtTime(54 + intensity * 18, now + duration);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration);

    const noiseBuffer = audio.createBuffer(1, audio.sampleRate * duration, audio.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) {
        channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
    }
    const noise = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const noiseGain = audio.createGain();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(520, now);
    filter.Q.setValueAtTime(1.3, now);
    noiseGain.gain.setValueAtTime(0.035 * intensity, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    noise.buffer = noiseBuffer;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audio.destination);
    noise.start(now);
    noise.stop(now + duration);
}

async function toggleFullscreen() {
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await document.documentElement.requestFullscreen();
        }
    } catch {
        softPop(0.28);
    }
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

ui.soundBtn.addEventListener("click", () => {
    state.sound = !state.sound;
    ui.soundBtn.setAttribute("aria-pressed", state.sound ? "true" : "false");
    if (state.sound) {
        softPop(0.5);
    }
});

ui.undoBtn.addEventListener("click", undo);
ui.resetBtn.addEventListener("click", () => resetState(true));
ui.modeBtn.addEventListener("click", toggleMode);
ui.shuffleBtn.addEventListener("click", shuffleProblem);
ui.fullscreenBtn?.addEventListener("click", toggleFullscreen);
ui.minuendInput.addEventListener("input", applyManualProblem);
ui.subtrahendInput.addEventListener("input", applyManualProblem);
ui.minuendInput.addEventListener("change", applyManualProblem);
ui.subtrahendInput.addEventListener("change", applyManualProblem);
ui.minuendInput.addEventListener("blur", applyManualProblem);
ui.subtrahendInput.addEventListener("blur", applyManualProblem);

setMode("automatic", true);
