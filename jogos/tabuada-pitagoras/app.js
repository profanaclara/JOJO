const GRID_SIZE = 9;

const ui = {
    soundBtn: document.getElementById("soundBtn"),
    factorAInput: document.getElementById("factorAInput"),
    factorBInput: document.getElementById("factorBInput"),
    topAnswerValue: document.getElementById("topAnswerValue"),
    grid: document.getElementById("pitagorasGrid"),
    resultPanel: document.getElementById("resultPanel"),
    resultEquation: document.getElementById("resultEquation"),
    resultValue: document.getElementById("resultValue"),
    statusText: document.getElementById("statusText"),
    nextBtn: document.getElementById("nextBtn"),
    modeBtn: document.getElementById("modeBtn"),
    clearBtn: document.getElementById("clearBtn"),
    showBtn: document.getElementById("showBtn")
};

const state = {
    sound: true,
    audio: null,
    mode: "automatic",
    a: null,
    b: null,
    selectedRow: null,
    selectedColumn: null,
    selectedCellKey: null,
    revealed: false,
    wrongKey: null
};

function clampFactor(value) {
    const number = Number.parseInt(String(value), 10);
    if (Number.isNaN(number)) {
        return null;
    }
    return Math.max(1, Math.min(GRID_SIZE, number));
}

function randomFactor() {
    return Math.floor(Math.random() * GRID_SIZE) + 1;
}

function hasProblem() {
    return state.a !== null && state.b !== null;
}

function answer() {
    return hasProblem() ? state.a * state.b : null;
}

function formatTarget(value) {
    return value === null ? "?" : value;
}

function syncInputs() {
    ui.factorAInput.value = formatTarget(state.a) === "?" ? "" : state.a;
    ui.factorBInput.value = formatTarget(state.b) === "?" ? "" : state.b;
}

function updateModeUI() {
    const automatic = state.mode === "automatic";
    ui.modeBtn.textContent = automatic ? "Automático" : "Manual";
    ui.modeBtn.setAttribute("aria-label", automatic ? "Modo automático" : "Modo manual");
    ui.factorAInput.readOnly = automatic;
    ui.factorBInput.readOnly = automatic;
}

function setMode(mode, silent = false) {
    state.mode = mode;
    if (mode === "automatic") {
        state.a = randomFactor();
        state.b = randomFactor();
    } else {
        state.a = null;
        state.b = null;
    }
    syncInputs();
    updateModeUI();
    clearSelection();
    if (!silent) {
        softTone(mode === "automatic" ? 0.56 : 0.36);
    }
}

function toggleMode() {
    setMode(state.mode === "automatic" ? "manual" : "automatic");
}

function applyManualProblem() {
    if (state.mode !== "manual") {
        return;
    }
    state.a = clampFactor(ui.factorAInput.value);
    state.b = clampFactor(ui.factorBInput.value);
    syncInputs();
    clearSelection();
}

function clearSelection() {
    state.selectedRow = null;
    state.selectedColumn = null;
    state.selectedCellKey = null;
    state.revealed = false;
    state.wrongKey = null;
    render();
}

function resultEquationText(revealed = false) {
    const currentAnswer = revealed && answer() !== null ? answer() : "?";
    return `${formatTarget(state.a)} × ${formatTarget(state.b)} = ${currentAnswer}`;
}

function revealAnswer() {
    if (!hasProblem()) {
        softTone(0.28, 0.74);
        renderStatus();
        return;
    }
    state.selectedRow = state.a;
    state.selectedColumn = state.b;
    state.selectedCellKey = `${state.a}-${state.b}`;
    state.revealed = true;
    state.wrongKey = null;
    softTone(0.88, 1.22);
    render();
}

function selectCell(row, column) {
    state.selectedRow = row;
    state.selectedColumn = column;
    state.selectedCellKey = `${row}-${column}`;

    if (!hasProblem()) {
        state.revealed = false;
        state.wrongKey = null;
        softTone(0.36, 0.86);
        render();
        return;
    }

    if (row === state.a && column === state.b) {
        state.revealed = true;
        state.wrongKey = null;
        softTone(0.95, 1.26);
    } else {
        state.revealed = false;
        state.wrongKey = `${row}-${column}`;
        softTone(0.34, 0.72);
        window.setTimeout(() => {
            if (state.wrongKey === `${row}-${column}`) {
                state.wrongKey = null;
                renderGrid();
            }
        }, 260);
    }

    render();
}

function selectHeader(kind, value) {
    if (kind === "row") {
        state.selectedRow = value;
    } else {
        state.selectedColumn = value;
    }
    state.selectedCellKey = null;
    state.revealed = false;
    state.wrongKey = null;
    softTone(0.52, 0.96);
    render();
}

function render() {
    updateModeUI();
    const currentAnswer = answer();
    const answerText = state.revealed && currentAnswer !== null ? currentAnswer : "?";
    ui.topAnswerValue.textContent = answerText;
    ui.topAnswerValue.classList.toggle("is-visible", state.revealed);
    ui.resultEquation.textContent = resultEquationText(state.revealed);
    ui.resultValue.textContent = answerText;
    ui.resultPanel.classList.toggle("is-ready", hasProblem());
    ui.resultPanel.classList.toggle("is-revealed", state.revealed);
    ui.nextBtn.disabled = !state.revealed;
    ui.nextBtn.textContent = state.mode === "automatic" ? "Próxima conta" : "Nova rodada";
    renderGrid();
    renderStatus();
}

function renderGrid() {
    const pieces = [];
    pieces.push(`<span class="grid-cell grid-cell--corner" aria-hidden="true"></span>`);

    for (let column = 1; column <= GRID_SIZE; column += 1) {
        const selected = state.selectedColumn === column;
        pieces.push(`
            <button
                class="grid-cell grid-cell--head${selected ? " grid-cell--column" : ""}"
                type="button"
                data-kind="column"
                data-value="${column}"
                aria-label="Número superior ${column}"
            >${column}</button>
        `);
    }

    for (let row = 1; row <= GRID_SIZE; row += 1) {
        const rowSelected = state.selectedRow === row;
        pieces.push(`
            <button
                class="grid-cell grid-cell--side${rowSelected ? " grid-cell--row" : ""}"
                type="button"
                data-kind="row"
                data-value="${row}"
                aria-label="Número lateral ${row}"
            >${row}</button>
        `);

        for (let column = 1; column <= GRID_SIZE; column += 1) {
            const key = `${row}-${column}`;
            const isRow = state.selectedRow === row;
            const isColumn = state.selectedColumn === column;
            const isSelected = state.selectedCellKey === key;
            const isCorrect = state.revealed && row === state.a && column === state.b;
            const isWrong = state.wrongKey === key;
            const classes = [
                "grid-cell",
                isRow ? "grid-cell--row" : "",
                isColumn ? "grid-cell--column" : "",
                isSelected ? "grid-cell--selected" : "",
                isCorrect ? "grid-cell--correct" : "",
                isWrong ? "grid-cell--wrong" : ""
            ].filter(Boolean).join(" ");

            pieces.push(`
                <button
                    class="${classes}"
                    type="button"
                    data-row="${row}"
                    data-column="${column}"
                    aria-label="${row} vezes ${column}"
                >${row * column}</button>
            `);
        }
    }

    ui.grid.innerHTML = pieces.join("");
}

function renderStatus() {
    ui.statusText.classList.toggle("is-success", state.revealed);

    if (!hasProblem()) {
        ui.statusText.textContent = "Digite a conta.";
        return;
    }

    if (state.revealed) {
        ui.statusText.textContent = `${state.a} vezes ${state.b} é ${answer()}.`;
        return;
    }

    if (state.selectedRow && state.selectedColumn) {
        if (state.selectedRow === state.a && state.selectedColumn === state.b) {
            ui.statusText.textContent = "Agora toque no resultado.";
            return;
        }
        ui.statusText.textContent = "Confira os números escolhidos.";
        return;
    }

    if (state.selectedRow) {
        ui.statusText.textContent = "Agora escolha o outro número.";
        return;
    }

    if (state.selectedColumn) {
        ui.statusText.textContent = "Agora escolha o outro número.";
        return;
    }

    ui.statusText.textContent = "Escolha os dois números.";
}

function nextRound() {
    if (state.mode === "automatic") {
        state.a = randomFactor();
        state.b = randomFactor();
        syncInputs();
    }
    clearSelection();
    softTone(0.74, 1.08);
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

function softTone(intensity = 0.6, pitch = 1) {
    if (!state.sound) {
        return;
    }

    const audio = ensureAudio();
    if (!audio) {
        return;
    }

    const now = audio.currentTime;
    const duration = 0.11;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.1 * intensity, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    gain.connect(audio.destination);

    const osc = audio.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(360 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(170 * pitch, now + duration);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration);
}

ui.grid.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
        return;
    }

    if (button.dataset.kind === "row") {
        selectHeader("row", Number(button.dataset.value));
        return;
    }

    if (button.dataset.kind === "column") {
        selectHeader("column", Number(button.dataset.value));
        return;
    }

    selectCell(Number(button.dataset.row), Number(button.dataset.column));
});

ui.soundBtn.addEventListener("click", () => {
    state.sound = !state.sound;
    ui.soundBtn.setAttribute("aria-pressed", state.sound ? "true" : "false");
    if (state.sound) {
        softTone(0.5, 1);
    }
});

ui.modeBtn.addEventListener("click", toggleMode);
ui.clearBtn.addEventListener("click", clearSelection);
ui.showBtn.addEventListener("click", revealAnswer);
ui.nextBtn.addEventListener("click", nextRound);
ui.factorAInput.addEventListener("input", applyManualProblem);
ui.factorBInput.addEventListener("input", applyManualProblem);
ui.factorAInput.addEventListener("change", applyManualProblem);
ui.factorBInput.addEventListener("change", applyManualProblem);
ui.factorAInput.addEventListener("blur", applyManualProblem);
ui.factorBInput.addEventListener("blur", applyManualProblem);

setMode("automatic", true);
