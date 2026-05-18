const STORAGE_KEY = "jojo_math_tug_teams_v1";
const STANDARD_ROUNDS = [5, 10, 15, 20];

const OPERATION_META = {
    add: { label: "ADIÇÃO", symbol: "+" },
    subtract: { label: "SUBTRAÇÃO", symbol: "-" },
    multiply: { label: "MULTIPLICAÇÃO", symbol: "×" },
    divide: { label: "DIVISÃO", symbol: "÷" },
};

const refs = {
    app: document.getElementById("app"),
    setupBackdrop: document.getElementById("setupBackdrop"),
    setupModal: document.getElementById("setupModal"),
    stepPanels: [...document.querySelectorAll("[data-step-panel]")],
    stepIndicators: [...document.querySelectorAll("[data-step-indicator]")],
    operationButtons: [...document.querySelectorAll("[data-operation]")],
    levelButtons: [...document.querySelectorAll("[data-level]")],
    quantityButtons: [...document.querySelectorAll("[data-rounds]")],
    roundsInput: document.getElementById("roundsInput"),
    leftTeamInput: document.getElementById("leftTeamInput"),
    rightTeamInput: document.getElementById("rightTeamInput"),
    changeTeamsBtn: document.getElementById("changeTeamsBtn"),
    prevStepBtn: document.getElementById("prevStepBtn"),
    nextStepBtn: document.getElementById("nextStepBtn"),
    startMatchBtn: document.getElementById("startMatchBtn"),
    openSetupBtn: document.getElementById("openSetupBtn"),
    playAgainBtn: document.getElementById("playAgainBtn"),
    leftProblem: document.getElementById("leftProblem"),
    rightProblem: document.getElementById("rightProblem"),
    leftAnswerDisplay: document.getElementById("leftAnswerDisplay"),
    rightAnswerDisplay: document.getElementById("rightAnswerDisplay"),
    leftStatus: document.getElementById("leftStatus"),
    rightStatus: document.getElementById("rightStatus"),
    leftPanelName: document.getElementById("leftPanelName"),
    rightPanelName: document.getElementById("rightPanelName"),
    leftArenaName: document.getElementById("leftArenaName"),
    rightArenaName: document.getElementById("rightArenaName"),
    leftScoreBadge: document.getElementById("leftScoreBadge"),
    rightScoreBadge: document.getElementById("rightScoreBadge"),
    leftArenaScore: document.getElementById("leftArenaScore"),
    rightArenaScore: document.getElementById("rightArenaScore"),
    roundCounter: document.getElementById("roundCounter"),
    operationsLabel: document.getElementById("operationsLabel"),
    ropeWrapper: document.getElementById("ropeWrapper"),
    matchTimer: document.getElementById("matchTimer"),
    roundFeedback: document.getElementById("roundFeedback"),
    countdownOverlay: document.getElementById("countdownOverlay"),
    countdownValue: document.getElementById("countdownValue"),
    resultOverlay: document.getElementById("resultOverlay"),
    resultBadge: document.getElementById("resultBadge"),
    resultTitle: document.getElementById("resultTitle"),
    resultText: document.getElementById("resultText"),
    zoomOutBtn: document.getElementById("zoomOutBtn"),
    zoomInBtn: document.getElementById("zoomInBtn"),
    zoomValue: document.getElementById("zoomValue"),
    fullscreenBtn: document.getElementById("fullscreenBtn"),
    soundToggleBtn: document.getElementById("soundToggleBtn"),
    backgroundMusic: document.getElementById("backgroundMusic"),
    keypads: {
        left: document.querySelector('[data-keypad="left"]'),
        right: document.querySelector('[data-keypad="right"]'),
    },
};

const state = {
    setupOpen: true,
    setupStep: 1,
    config: {
        operations: ["add"],
        level: 1,
        rounds: 5,
        teamNames: {
            left: "EQUIPE AZUL",
            right: "EQUIPE VERMELHA",
        },
    },
    ui: {
        zoom: 1,
        soundOn: true,
    },
    game: createGameState(),
};

const timers = {
    countdown: null,
    countdownHide: null,
    feedback: null,
    nextRound: null,
    clock: null,
};

let audioContext = null;

function createGameState() {
    return {
        active: false,
        countdown: false,
        inRound: false,
        over: false,
        leftScore: 0,
        rightScore: 0,
        tugPosition: 0,
        answerBuffers: {
            left: "",
            right: "",
        },
        problems: {
            left: null,
            right: null,
        },
        statuses: {
            left: { text: "AGUARDANDO CONFIGURAÇÃO", tone: "" },
            right: { text: "AGUARDANDO CONFIGURAÇÃO", tone: "" },
        },
        startedAt: 0,
    };
}

function init() {
    loadSavedTeams();
    bindEvents();
    renderZoomControls();
    renderAll();
    openSetup(1, false);
}

function bindEvents() {
    refs.operationButtons.forEach((button) => {
        button.addEventListener("click", () => toggleOperation(button.dataset.operation));
    });

    refs.levelButtons.forEach((button) => {
        button.addEventListener("click", () => {
            state.config.level = Number(button.dataset.level);
            renderSetupState();
            playTone("step");
        });
    });

    refs.quantityButtons.forEach((button) => {
        button.addEventListener("click", () => {
            state.config.rounds = Number(button.dataset.rounds);
            refs.roundsInput.value = state.config.rounds;
            renderSetupState();
            playTone("step");
        });
    });

    refs.roundsInput.addEventListener("input", () => {
        const parsed = clampNumber(Number(refs.roundsInput.value || 5), 3, 50);
        state.config.rounds = parsed;
        refs.roundsInput.value = parsed;
        renderSetupState();
    });

    refs.changeTeamsBtn.addEventListener("click", () => openSetup(3, true));
    refs.prevStepBtn.addEventListener("click", handlePrevStep);
    refs.nextStepBtn.addEventListener("click", handleNextStep);
    refs.startMatchBtn.addEventListener("click", startMatchFromSetup);
    refs.openSetupBtn.addEventListener("click", () => openSetup(1, true));
    refs.playAgainBtn.addEventListener("click", () => {
        hideResult();
        beginMatch();
    });
    refs.zoomOutBtn.addEventListener("click", () => changeZoom(-0.1));
    refs.zoomInBtn.addEventListener("click", () => changeZoom(0.1));
    refs.fullscreenBtn.addEventListener("click", toggleFullscreen);
    refs.soundToggleBtn.addEventListener("click", toggleSound);

    window.addEventListener("resize", updateRopeShift);
    document.addEventListener("fullscreenchange", renderZoomControls);

    Object.entries(refs.keypads).forEach(([side, keypad]) => {
        keypad.addEventListener("pointerdown", (event) => {
            const button = event.target.closest("button");
            if (!button) {
                return;
            }

            event.preventDefault();
            button.classList.add("is-pressed");
            playTone("tap");
            handleKeypadPress(side, button.dataset.key);

            window.setTimeout(() => {
                button.classList.remove("is-pressed");
            }, 140);
        });
    });
}

function loadSavedTeams() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (saved?.left && saved?.right) {
            state.config.teamNames.left = saved.left;
            state.config.teamNames.right = saved.right;
        }
    } catch (error) {
        console.warn("Não foi possível carregar as equipes salvas.", error);
    }

    refs.leftTeamInput.value = state.config.teamNames.left;
    refs.rightTeamInput.value = state.config.teamNames.right;
    configureBackgroundMusic();
}

function configureBackgroundMusic() {
    if (!refs.backgroundMusic) {
        return;
    }

    refs.backgroundMusic.loop = true;
    refs.backgroundMusic.volume = 0.32;
}

function startBackgroundMusic(restart = false) {
    if (!refs.backgroundMusic || !state.ui.soundOn) {
        return;
    }

    if (restart) {
        refs.backgroundMusic.currentTime = 0;
    }

    const playPromise = refs.backgroundMusic.play();
    if (playPromise?.catch) {
        playPromise.catch(() => {});
    }
}

function pauseBackgroundMusic(reset = false) {
    if (!refs.backgroundMusic) {
        return;
    }

    refs.backgroundMusic.pause();
    if (reset) {
        refs.backgroundMusic.currentTime = 0;
    }
}

function ensureAudioContext() {
    if (!state.ui.soundOn) {
        return null;
    }

    if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            return null;
        }
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
    }

    return audioContext;
}

function playTone(kind) {
    const ctx = ensureAudioContext();
    if (!ctx) {
        return;
    }

    const configMap = {
        tap: [{ type: "triangle", frequency: 540, duration: 0.05, gain: 0.04 }],
        step: [{ type: "sine", frequency: 620, duration: 0.07, gain: 0.06 }],
        start: [
            { type: "triangle", frequency: 460, duration: 0.11, gain: 0.07 },
            { type: "triangle", frequency: 620, duration: 0.11, gain: 0.06, delay: 0.12 },
        ],
        success: [
            { type: "triangle", frequency: 680, duration: 0.08, gain: 0.07 },
            { type: "triangle", frequency: 840, duration: 0.12, gain: 0.08, delay: 0.09 },
        ],
        error: [{ type: "square", frequency: 210, duration: 0.11, gain: 0.045 }],
        win: [
            { type: "triangle", frequency: 520, duration: 0.12, gain: 0.07 },
            { type: "triangle", frequency: 660, duration: 0.12, gain: 0.08, delay: 0.11 },
            { type: "triangle", frequency: 820, duration: 0.18, gain: 0.09, delay: 0.22 },
        ],
    };

    const now = ctx.currentTime;
    const notes = configMap[kind] || configMap.tap;

    notes.forEach((note) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const startAt = now + (note.delay || 0);
        const endAt = startAt + note.duration;

        oscillator.type = note.type;
        oscillator.frequency.setValueAtTime(note.frequency, startAt);
        gainNode.gain.setValueAtTime(0.0001, startAt);
        gainNode.gain.linearRampToValueAtTime(note.gain, startAt + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start(startAt);
        oscillator.stop(endAt + 0.02);
    });
}

function changeZoom(delta) {
    state.ui.zoom = clampNumber(Number((state.ui.zoom + delta).toFixed(2)), 0.8, 1.3);
    document.body.style.zoom = `${Math.round(state.ui.zoom * 100)}%`;
    renderZoomControls();
    playTone("step");
}

async function toggleFullscreen() {
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await document.documentElement.requestFullscreen();
        }
        playTone("step");
    } catch (error) {
        console.warn("Não foi possível alternar a tela cheia.", error);
    } finally {
        renderZoomControls();
    }
}

function syncFullscreenState() {
    refs.app.classList.toggle("is-fullscreen", Boolean(document.fullscreenElement));
}

function toggleSound() {
    state.ui.soundOn = !state.ui.soundOn;
    if (state.ui.soundOn) {
        if (state.game.active || state.game.countdown || state.game.inRound) {
            startBackgroundMusic();
        }
        playTone("start");
    } else {
        pauseBackgroundMusic();
    }
    renderZoomControls();
}

function renderZoomControls() {
    refs.zoomValue.textContent = `${Math.round(state.ui.zoom * 100)}%`;
    refs.soundToggleBtn.textContent = state.ui.soundOn ? "🔊" : "🔇";
    refs.soundToggleBtn.classList.toggle("is-muted", !state.ui.soundOn);
    refs.fullscreenBtn.textContent = document.fullscreenElement ? "🡽" : "⛶";
    syncFullscreenState();
}

function saveTeams() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            left: state.config.teamNames.left,
            right: state.config.teamNames.right,
        }),
    );
}

function toggleOperation(operation) {
    const operations = state.config.operations;
    const index = operations.indexOf(operation);

    if (index >= 0) {
        if (operations.length === 1) {
            return;
        }
        operations.splice(index, 1);
    } else {
        operations.push(operation);
    }

    renderSetupState();
    renderBottomMeta();
    playTone("step");
}

function handlePrevStep() {
    if (state.setupStep === 1) {
        return;
    }

    state.setupStep -= 1;
    renderSetupState();
    playTone("step");
}

function handleNextStep() {
    if (state.setupStep >= 3) {
        return;
    }

    state.setupStep += 1;
    renderSetupState();
    playTone("step");
}

function sanitizeTeamName(value, fallback) {
    const cleaned = String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 20);

    return cleaned || fallback;
}

function startMatchFromSetup() {
    state.config.teamNames.left = sanitizeTeamName(refs.leftTeamInput.value, "EQUIPE AZUL");
    state.config.teamNames.right = sanitizeTeamName(refs.rightTeamInput.value, "EQUIPE VERMELHA");
    refs.leftTeamInput.value = state.config.teamNames.left;
    refs.rightTeamInput.value = state.config.teamNames.right;
    saveTeams();
    closeSetup();
    playTone("start");
    beginMatch();
}

function openSetup(step = 1, resetMatch = false) {
    clearAllTimers();
    pauseBackgroundMusic(resetMatch);

    if (resetMatch) {
        state.game = createGameState();
    }

    state.setupOpen = true;
    state.setupStep = step;
    refs.app.classList.add("is-setup-open");
    refs.setupBackdrop.classList.remove("hidden");
    refs.setupModal.classList.remove("hidden");
    hideResult();
    hideFeedback();
    renderAll();
}

function closeSetup() {
    state.setupOpen = false;
    refs.app.classList.remove("is-setup-open");
    refs.setupBackdrop.classList.add("hidden");
    refs.setupModal.classList.add("hidden");
    renderSetupState();
}

function beginMatch() {
    clearAllTimers();
    state.game = createGameState();
    state.game.active = true;
    state.game.countdown = true;
    startBackgroundMusic(true);
    setStatus("left", "PREPARE-SE PARA A LARGADA", "waiting");
    setStatus("right", "PREPARE-SE PARA A LARGADA", "waiting");
    renderAll();
    startCountdown();
}

function startCountdown() {
    const sequence = ["3", "2", "1", "VAI!"];
    let index = 0;

    refs.countdownOverlay.classList.remove("hidden");
    refs.countdownValue.textContent = sequence[index];
    playTone("step");

    timers.countdown = window.setInterval(() => {
        index += 1;

        if (index >= sequence.length) {
            clearInterval(timers.countdown);
            timers.countdown = null;
            state.game.countdown = false;
            refs.countdownOverlay.classList.add("hidden");
            state.game.startedAt = Date.now();
            startClock();
            startRound();
            return;
        }

        refs.countdownValue.textContent = sequence[index];
        playTone(index === sequence.length - 1 ? "start" : "step");
    }, 850);
}

function startClock() {
    updateMatchTimer();
    timers.clock = window.setInterval(updateMatchTimer, 250);
}

function updateMatchTimer() {
    if (!state.game.startedAt) {
        refs.matchTimer.textContent = "00:00";
        return;
    }

    const elapsed = Date.now() - state.game.startedAt;
    refs.matchTimer.textContent = formatTime(elapsed);
}

function startRound() {
    state.game.inRound = true;
    state.game.answerBuffers.left = "";
    state.game.answerBuffers.right = "";
    state.game.problems.left = generateProblem();
    state.game.problems.right = generateProblem();
    setStatus("left", "RESOLVA A CONTA", "");
    setStatus("right", "RESOLVA A CONTA", "");
    renderGame();
}

function handleKeypadPress(side, key) {
    if (state.setupOpen || state.game.countdown || !state.game.inRound || state.game.over) {
        return;
    }

    const buffer = state.game.answerBuffers[side];
    const activeProblem = state.game.problems[side];

    if (!activeProblem) {
        return;
    }

    if (key === "clear") {
        state.game.answerBuffers[side] = "";
        renderAnswerBuffers();
        return;
    }

    if (key === "submit") {
        if (!buffer) {
            return;
        }

        const submittedValue = Number(buffer);
        if (submittedValue === activeProblem.answer) {
            applyOutcome(side, true);
        } else {
            playTone("error");
            applyOutcome(side, false);
        }
        return;
    }

    const maxLength = Math.max(String(activeProblem.answer).length + 1, 2);
    const nextBuffer = buffer === "0" ? key : `${buffer}${key}`;
    state.game.answerBuffers[side] = nextBuffer.slice(0, maxLength);
    renderAnswerBuffers();
}

function applyOutcome(actorSide, isCorrect) {
    if (!state.game.inRound || state.game.over) {
        return;
    }

    const scoringSide = isCorrect ? actorSide : actorSide === "left" ? "right" : "left";

    if (scoringSide === "left") {
        state.game.leftScore += 1;
        state.game.tugPosition -= 1;
    } else {
        state.game.rightScore += 1;
        state.game.tugPosition += 1;
    }

    if (isCorrect) {
        setStatus(actorSide, "ACERTOU", "win");
        showFeedback(`${getTeamName(actorSide)} ACERTOU`);
        playTone("success");
    } else {
        setStatus(actorSide, "ERROU", "error");
        showFeedback(`${getTeamName(actorSide)} ERROU`);
    }

    state.game.answerBuffers[actorSide] = "";
    state.game.problems[actorSide] = generateProblem();
    renderGame();

    clearTimeout(timers.feedback);
    timers.feedback = window.setTimeout(() => {
        setStatus(actorSide, "RESOLVA A CONTA", "");
        hideFeedback();
        renderStatuses();
    }, 320);

    if (state.game.leftScore >= state.config.rounds || state.game.rightScore >= state.config.rounds) {
        finishMatch();
    }
}

function finishMatch() {
    clearInterval(timers.clock);
    timers.clock = null;
    state.game.active = false;
    state.game.inRound = false;
    state.game.over = true;
    pauseBackgroundMusic();
    renderGame();

    let title = "EMPATE";
    let text = "AS DUAS EQUIPES TERMINARAM COM A MESMA PONTUAÇÃO.";

    if (state.game.leftScore > state.game.rightScore) {
        title = `${state.config.teamNames.left} VENCEU`;
        text = `A EQUIPE AZUL FECHOU A PARTIDA COM ${state.game.leftScore} PONTOS.`;
        setStatus("left", "PARTIDA VENCIDA", "win");
        setStatus("right", "PARTIDA ENCERRADA", "");
    } else if (state.game.rightScore > state.game.leftScore) {
        title = `${state.config.teamNames.right} VENCEU`;
        text = `A EQUIPE VERMELHA FECHOU A PARTIDA COM ${state.game.rightScore} PONTOS.`;
        setStatus("right", "PARTIDA VENCIDA", "win");
        setStatus("left", "PARTIDA ENCERRADA", "");
    } else {
        setStatus("left", "PARTIDA EMPATADA", "waiting");
        setStatus("right", "PARTIDA EMPATADA", "waiting");
    }

    refs.resultTitle.textContent = title;
    refs.resultText.textContent = text;
    if (state.game.leftScore > state.game.rightScore) {
        refs.resultBadge.src = "./assets/ganhou-azul.gif";
        refs.resultBadge.alt = "Equipe azul venceu";
        refs.resultBadge.classList.remove("hidden");
    } else if (state.game.rightScore > state.game.leftScore) {
        refs.resultBadge.src = "./assets/ganhou-vermelho.gif";
        refs.resultBadge.alt = "Equipe vermelha venceu";
        refs.resultBadge.classList.remove("hidden");
    } else {
        refs.resultBadge.classList.add("hidden");
    }
    refs.resultOverlay.classList.remove("hidden");
    renderStatuses();
    playTone("win");
}

function hideResult() {
    refs.resultOverlay.classList.add("hidden");
    refs.resultBadge.classList.add("hidden");
}

function showFeedback(text) {
    refs.roundFeedback.textContent = text;
    refs.roundFeedback.classList.remove("hidden");

    clearTimeout(timers.feedback);
    timers.feedback = window.setTimeout(hideFeedback, 1400);
}

function hideFeedback() {
    refs.roundFeedback.classList.add("hidden");
}

function renderAll() {
    renderZoomControls();
    renderSetupState();
    renderGame();
}

function renderSetupState() {
    refs.stepPanels.forEach((panel) => {
        panel.classList.toggle("hidden", Number(panel.dataset.stepPanel) !== state.setupStep);
    });

    refs.stepIndicators.forEach((indicator) => {
        const stepNumber = Number(indicator.dataset.stepIndicator);
        indicator.classList.toggle("is-active", stepNumber === state.setupStep);
        indicator.classList.toggle("is-done", stepNumber < state.setupStep);
    });

    refs.prevStepBtn.classList.toggle("hidden", state.setupStep === 1);
    refs.nextStepBtn.classList.toggle("hidden", state.setupStep === 3);
    refs.startMatchBtn.classList.toggle("hidden", state.setupStep !== 3);

    refs.operationButtons.forEach((button) => {
        button.classList.toggle("is-selected", state.config.operations.includes(button.dataset.operation));
    });

    refs.levelButtons.forEach((button) => {
        button.classList.toggle("is-selected", Number(button.dataset.level) === state.config.level);
    });

    refs.quantityButtons.forEach((button) => {
        button.classList.toggle("is-selected", Number(button.dataset.rounds) === state.config.rounds);
    });

    refs.roundsInput.value = state.config.rounds;
    refs.leftTeamInput.value = state.config.teamNames.left;
    refs.rightTeamInput.value = state.config.teamNames.right;

    refs.setupBackdrop.classList.toggle("hidden", !state.setupOpen);
    refs.setupModal.classList.toggle("hidden", !state.setupOpen);
}

function renderGame() {
    renderNames();
    renderScores();
    renderProblem();
    renderAnswerBuffers();
    renderStatuses();
    renderBottomMeta();
    updateRopeShift();
}

function renderNames() {
    refs.leftPanelName.textContent = state.config.teamNames.left;
    refs.rightPanelName.textContent = state.config.teamNames.right;
    if (refs.leftArenaName) {
        refs.leftArenaName.textContent = state.config.teamNames.left;
    }
    if (refs.rightArenaName) {
        refs.rightArenaName.textContent = state.config.teamNames.right;
    }
}

function renderScores() {
    refs.leftScoreBadge.textContent = state.game.leftScore;
    refs.rightScoreBadge.textContent = state.game.rightScore;
    if (refs.leftArenaScore) {
        refs.leftArenaScore.textContent = state.game.leftScore;
    }
    if (refs.rightArenaScore) {
        refs.rightArenaScore.textContent = state.game.rightScore;
    }

    const leadingScore = Math.max(state.game.leftScore, state.game.rightScore);
    refs.roundCounter.textContent = `${leadingScore} / ${state.config.rounds}`;
}

function renderProblem() {
    refs.leftProblem.textContent = state.game.problems.left ? state.game.problems.left.leftText : "? + ? = ?";
    refs.rightProblem.textContent = state.game.problems.right ? state.game.problems.right.rightText : "? + ? = ?";
}

function renderAnswerBuffers() {
    refs.leftAnswerDisplay.textContent = state.game.answerBuffers.left || "—";
    refs.rightAnswerDisplay.textContent = state.game.answerBuffers.right || "—";
}

function renderStatuses() {
    ["left", "right"].forEach((side) => {
        const target = side === "left" ? refs.leftStatus : refs.rightStatus;
        const status = state.game.statuses[side];
        if (!target) {
            return;
        }
        target.textContent = status.text;
        target.classList.remove("is-win", "is-waiting", "is-error");
        if (status.tone) {
            target.classList.add(`is-${status.tone}`);
        }
    });
}

function renderBottomMeta() {
    refs.operationsLabel.textContent = state.config.operations
        .map((operation) => OPERATION_META[operation].label)
        .join(" • ");
}

function updateRopeShift() {
    const maxShift = window.innerWidth < 680 ? 110 : window.innerWidth < 1180 ? 180 : 240;
    const shift = (state.game.tugPosition / Math.max(state.config.rounds, 1)) * maxShift;
    refs.ropeWrapper.style.setProperty("--rope-shift", `${shift}px`);
}

function setStatus(side, text, tone = "") {
    state.game.statuses[side] = { text, tone };
}

function getTeamName(side) {
    return side === "left" ? state.config.teamNames.left : state.config.teamNames.right;
}

function clearAllTimers() {
    Object.values(timers).forEach((timerId) => {
        if (timerId) {
            clearInterval(timerId);
            clearTimeout(timerId);
        }
    });

    Object.keys(timers).forEach((key) => {
        timers[key] = null;
    });

    refs.countdownOverlay.classList.add("hidden");
}

function generateProblem() {
    const operation = randomItem(state.config.operations);

    switch (operation) {
        case "add":
            return generateAddition(state.config.level);
        case "subtract":
            return generateSubtraction(state.config.level);
        case "multiply":
            return generateMultiplication(state.config.level);
        case "divide":
            return generateDivision(state.config.level);
        default:
            return generateAddition(1);
    }
}

function generateAddition(level) {
    let a;
    let b;

    if (level === 1) {
        a = randomInt(0, 9);
        b = randomInt(0, 9);
    } else if (level === 2) {
        const tensA = randomInt(1, 8);
        const tensB = randomInt(1, 9 - tensA);
        const onesA = randomInt(0, 8);
        const onesB = randomInt(0, 9 - onesA);
        a = tensA * 10 + onesA;
        b = tensB * 10 + onesB;
    } else {
        const tensA = randomInt(1, 7);
        const tensB = randomInt(1, 8 - tensA);
        const onesA = randomInt(1, 9);
        const onesB = randomInt(Math.max(10 - onesA, 1), 9);
        a = tensA * 10 + onesA;
        b = tensB * 10 + onesB;
    }

    return buildProblem("add", a, b, a + b);
}

function generateSubtraction(level) {
    let a;
    let b;

    if (level === 1) {
        a = randomInt(1, 9);
        b = randomInt(0, a);
    } else if (level === 2) {
        do {
            const tensA = randomInt(1, 9);
            const tensB = randomInt(0, tensA);
            const onesA = randomInt(0, 9);
            const onesB = randomInt(0, onesA);
            a = tensA * 10 + onesA;
            b = tensB * 10 + onesB;
        } while (a === b);
    } else {
        const tensA = randomInt(2, 9);
        const tensB = randomInt(0, tensA - 1);
        const onesA = randomInt(0, 8);
        const onesB = randomInt(onesA + 1, 9);
        a = tensA * 10 + onesA;
        b = tensB * 10 + onesB;
    }

    return buildProblem("subtract", a, b, a - b);
}

function generateMultiplication(level) {
    let a;
    let b;

    if (level === 1) {
        a = randomInt(2, 9);
        b = randomInt(2, 9);
    } else if (level === 2) {
        b = randomInt(2, 4);
        const tensDigit = randomInt(1, Math.max(1, Math.floor(9 / b)));
        const onesDigit = randomInt(0, Math.floor(9 / b));
        a = tensDigit * 10 + onesDigit;
    } else {
        do {
            a = randomInt(12, 99);
            b = randomInt(2, 9);
        } while ((a % 10) * b < 10 && Math.floor(a / 10) * b < 10);
    }

    return buildProblem("multiply", a, b, a * b);
}

function generateDivision(level) {
    let divisor;
    let quotient;
    let dividend;

    if (level === 1) {
        divisor = randomInt(2, 9);
        quotient = randomInt(1, 9);
    } else if (level === 2) {
        do {
            divisor = randomInt(2, 9);
            quotient = randomInt(10, 15);
            dividend = divisor * quotient;
        } while (dividend > 99);
        return buildProblem("divide", dividend, divisor, quotient);
    } else {
        do {
            divisor = randomInt(2, 9);
            quotient = randomInt(16, 49);
            dividend = divisor * quotient;
        } while (dividend > 99);
        return buildProblem("divide", dividend, divisor, quotient);
    }

    dividend = divisor * quotient;
    return buildProblem("divide", dividend, divisor, quotient);
}

function buildProblem(operation, a, b, answer) {
    const meta = OPERATION_META[operation];
    const originalText = `${a} ${meta.symbol} ${b} = ?`;
    let leftText = originalText;
    let rightText = originalText;

    if ((operation === "add" || operation === "multiply") && a !== b) {
        const reversedText = `${b} ${meta.symbol} ${a} = ?`;
        if (Math.random() > 0.5) {
            leftText = reversedText;
            rightText = originalText;
        } else {
            leftText = originalText;
            rightText = reversedText;
        }
    }

    return {
        operation,
        a,
        b,
        answer,
        text: originalText,
        leftText,
        rightText,
    };
}

function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clampNumber(value, min, max) {
    if (Number.isNaN(value)) {
        return min;
    }
    return Math.min(max, Math.max(min, value));
}

function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

init();
