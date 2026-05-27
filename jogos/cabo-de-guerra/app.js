const STORAGE_KEY = "jojo_math_tug_teams_v1";
const STANDARD_ROUNDS = [5, 10, 15, 20];

const OPERATION_META = {
    fraction: { label: "FRAÇÕES", symbol: "🍕" },
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
    leftNumeratorField: document.getElementById("leftNumeratorField"),
    leftDenominatorField: document.getElementById("leftDenominatorField"),
    rightNumeratorField: document.getElementById("rightNumeratorField"),
    rightDenominatorField: document.getElementById("rightDenominatorField"),
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
        operations: ["fraction"],
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

function createFractionAnswerBuffer() {
    return {
        numerator: "",
        denominator: "",
        activePart: "numerator",
    };
}

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
            left: createFractionAnswerBuffer(),
            right: createFractionAnswerBuffer(),
        },
        problems: {
            left: null,
            right: null,
        },
        lastShapes: {
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

    [refs.leftNumeratorField, refs.leftDenominatorField, refs.rightNumeratorField, refs.rightDenominatorField].forEach((field) => {
        field.addEventListener("click", () => {
            if (state.setupOpen || state.game.over) {
                return;
            }

            state.game.answerBuffers[field.dataset.side].activePart = field.dataset.part;
            renderAnswerBuffers();
        });
    });

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
    if (operation === "fraction") {
        state.config.operations = ["fraction"];
        renderSetupState();
        renderBottomMeta();
        playTone("step");
        return;
    }

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
    state.game.answerBuffers.left = createFractionAnswerBuffer();
    state.game.answerBuffers.right = createFractionAnswerBuffer();
    const roundProblems = generateRoundProblems();
    state.game.problems.left = roundProblems.left;
    state.game.problems.right = roundProblems.right;
    state.game.lastShapes.left = roundProblems.left.shape;
    state.game.lastShapes.right = roundProblems.right.shape;
    setStatus("left", "ESCREVA A FRAÇÃO", "");
    setStatus("right", "ESCREVA A FRAÇÃO", "");
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
        if (buffer[buffer.activePart]) {
            buffer[buffer.activePart] = "";
        } else {
            state.game.answerBuffers[side] = createFractionAnswerBuffer();
        }
        renderAnswerBuffers();
        return;
    }

    if (key === "submit") {
        if (!buffer.numerator || !buffer.denominator) {
            return;
        }

        const submittedNumerator = Number(buffer.numerator);
        const submittedDenominator = Number(buffer.denominator);
        if (
            submittedNumerator === activeProblem.numerator &&
            submittedDenominator === activeProblem.denominator
        ) {
            applyOutcome(side, true);
        } else {
            playTone("error");
            applyOutcome(side, false);
        }
        return;
    }

    const activePart = buffer.activePart;
    const maxLength = activeProblem.denominator >= 10 ? 2 : 1;
    const nextBuffer = buffer[activePart] === "0" ? key : `${buffer[activePart]}${key}`;
    buffer[activePart] = nextBuffer.slice(0, maxLength);

    if (activePart === "numerator" && buffer.numerator) {
        buffer.activePart = "denominator";
    }

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

    state.game.answerBuffers[actorSide] = createFractionAnswerBuffer();
    const replacementShape = pickNextShapeForSide(
        state.config.level,
        state.game.problems[otherSide(actorSide)]?.shape ?? null,
        state.game.lastShapes[actorSide],
    );
    state.game.problems[actorSide] = generateFractionProblem(
        state.config.level,
        [],
        state.game.lastShapes[actorSide],
        replacementShape,
    );
    state.game.lastShapes[actorSide] = state.game.problems[actorSide].shape;
    renderGame();

    clearTimeout(timers.feedback);
    timers.feedback = window.setTimeout(() => {
        setStatus(actorSide, "ESCREVA A FRAÇÃO", "");
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
    refs.leftProblem.innerHTML = state.game.problems.left ? buildFractionVisual(state.game.problems.left, "left") : "🍕";
    refs.rightProblem.innerHTML = state.game.problems.right ? buildFractionVisual(state.game.problems.right, "right") : "🍕";
}

function renderAnswerBuffers() {
    renderAnswerBufferForSide("left");
    renderAnswerBufferForSide("right");
}

function renderAnswerBufferForSide(side) {
    const buffer = state.game.answerBuffers[side];
    const numeratorField = side === "left" ? refs.leftNumeratorField : refs.rightNumeratorField;
    const denominatorField = side === "left" ? refs.leftDenominatorField : refs.rightDenominatorField;

    numeratorField.textContent = buffer.numerator || "?";
    denominatorField.textContent = buffer.denominator || "?";
    numeratorField.classList.toggle("is-active", buffer.activePart === "numerator");
    denominatorField.classList.toggle("is-active", buffer.activePart === "denominator");
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
    refs.operationsLabel.textContent = "FRAÇÕES";
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
    return generateFractionProblem(state.config.level, [], null);
}

function generateRoundProblems() {
    const pair = pickDistinctRoundShapes(state.config.level);
    const leftProblem = generateFractionProblem(state.config.level, [], state.game.lastShapes.left, pair.left);
    const rightProblem = generateFractionProblem(state.config.level, [], state.game.lastShapes.right, pair.right);

    return {
        left: leftProblem,
        right: rightProblem,
    };
}

function generateFractionProblem(level, excludedShapes = [], previousShape = null, forcedShape = null) {
    const shape = forcedShape || chooseShapeForLevel(level, excludedShapes, previousShape);
    const denominators = getDenominatorsForShape(level, shape);
    const denominator = randomItem(denominators);
    const numerator = randomInt(1, denominator - 1);

    return {
        numerator,
        denominator,
        shape,
    };
}

function getLevelDenominators(level) {
    if (level === 2) {
        return [4, 5, 6, 8];
    }
    if (level === 3) {
        return [6, 8, 9, 10];
    }
    return [2, 3, 4];
}

function getRenderableShapes(denominator) {
    const shapes = ["circle", "bar"];
    const grid = getGridDimensions(denominator);
    if (grid && grid.rows > 1 && grid.cols > 1) {
        shapes.push("grid");
    }
    return shapes;
}

function getAvailableShapesForLevel(level) {
    const shapes = new Set();
    getLevelDenominators(level).forEach((denominator) => {
        getRenderableShapes(denominator).forEach((shape) => shapes.add(shape));
    });
    return [...shapes];
}

function getDenominatorsForShape(level, shape) {
    const denominators = getLevelDenominators(level).filter((denominator) => getRenderableShapes(denominator).includes(shape));
    return denominators.length ? denominators : getLevelDenominators(level);
}

function pickShapeFromPool(pool, previousShape = null) {
    const filtered = previousShape ? pool.filter((shape) => shape !== previousShape) : pool;
    return randomItem(filtered.length ? filtered : pool);
}

function chooseShapeForLevel(level, excludedShapes = [], previousShape = null) {
    let shapes = getAvailableShapesForLevel(level);

    if (excludedShapes.length) {
        const filtered = shapes.filter((shape) => !excludedShapes.includes(shape));
        if (filtered.length) {
            shapes = filtered;
        }
    }

    return pickShapeFromPool(shapes, previousShape);
}

function pickDistinctRoundShapes(level) {
    const allShapes = getAvailableShapesForLevel(level);
    const leftShape = pickShapeFromPool(allShapes, state.game.lastShapes.left);
    const rightPool = allShapes.filter((shape) => shape !== leftShape);
    const rightShape = pickShapeFromPool(rightPool.length ? rightPool : allShapes, state.game.lastShapes.right);

    return {
        left: leftShape,
        right: rightShape === leftShape && rightPool.length ? randomItem(rightPool) : rightShape,
    };
}

function pickNextShapeForSide(level, blockedShape, previousShape) {
    const allShapes = getAvailableShapesForLevel(level);
    const allowedShapes = allShapes.filter((shape) => shape !== blockedShape);
    return pickShapeFromPool(allowedShapes.length ? allowedShapes : allShapes, previousShape);
}

function buildFractionVisual(problem, side) {
    switch (problem.shape) {
        case "bar":
            return buildBarSvg(problem, side);
        case "grid":
            return buildGridSvg(problem, side);
        case "circle":
        default:
            return buildCircleSvg(problem, side);
    }
}

function buildCircleSvg(problem, side) {
    const fill = side === "left" ? "#5aa9ff" : "#ff7793";
    const crust = "#f0b86a";
    const cheese = "#ffe5a3";
    const stroke = "#ffffff";
    const size = 210;
    const radius = 78;
    const center = size / 2;
    const angleStep = 360 / problem.denominator;
    let slices = "";

    for (let index = 0; index < problem.denominator; index += 1) {
        const startAngle = index * angleStep;
        const endAngle = startAngle + angleStep;
        const path = describeSlice(center, center, radius, startAngle, endAngle);
        const sliceFill = index < problem.numerator ? fill : cheese;
        slices += `<path d="${path}" fill="${sliceFill}" stroke="${stroke}" stroke-width="4"></path>`;
    }

    return `
        <svg class="fraction-visual fraction-visual--circle" width="108" height="108" style="width:108px;height:108px;max-width:108px;max-height:108px;display:block;" viewBox="0 0 ${size} ${size}" role="img" aria-label="Círculo representando ${problem.numerator} de ${problem.denominator}">
            <circle cx="${center}" cy="${center}" r="${radius + 10}" fill="${crust}"></circle>
            ${slices}
            <circle cx="${center}" cy="${center}" r="10" fill="#fff7dc" opacity="0.85"></circle>
        </svg>
    `;
}

function buildBarSvg(problem, side) {
    const fill = side === "left" ? "#5aa9ff" : "#ff7793";
    const base = "#ffe5a3";
    const stroke = "#ffffff";
    const width = 230;
    const height = 120;
    const innerX = 20;
    const innerY = 28;
    const innerWidth = 190;
    const innerHeight = 64;
    const partWidth = innerWidth / problem.denominator;
    let cells = "";

    for (let index = 0; index < problem.denominator; index += 1) {
        const x = innerX + index * partWidth;
        const cellFill = index < problem.numerator ? fill : base;
        cells += `<rect x="${x}" y="${innerY}" width="${partWidth}" height="${innerHeight}" fill="${cellFill}" stroke="${stroke}" stroke-width="3"></rect>`;
    }

    return `
        <svg class="fraction-visual fraction-visual--bar" width="141" height="51" style="width:141px;height:51px;max-width:141px;max-height:51px;display:block;" viewBox="0 0 ${width} ${height}" role="img" aria-label="Barra representando ${problem.numerator} de ${problem.denominator}">
            <rect x="${innerX}" y="${innerY}" width="${innerWidth}" height="${innerHeight}" rx="20" fill="#f5f8ff"></rect>
            ${cells}
        </svg>
    `;
}

function buildGridSvg(problem, side) {
    const fill = side === "left" ? "#5aa9ff" : "#ff7793";
    const base = "#ffe5a3";
    const stroke = "#ffffff";
    const size = 210;
    const frame = 150;
    const x0 = (size - frame) / 2;
    const y0 = (size - frame) / 2;
    const dimensions = getGridDimensions(problem.denominator) || { rows: 1, cols: problem.denominator };
    const cellWidth = frame / dimensions.cols;
    const cellHeight = frame / dimensions.rows;
    let cells = "";

    for (let row = 0; row < dimensions.rows; row += 1) {
        for (let col = 0; col < dimensions.cols; col += 1) {
            const index = row * dimensions.cols + col;
            const x = x0 + col * cellWidth;
            const y = y0 + row * cellHeight;
            const cellFill = index < problem.numerator ? fill : base;
            cells += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" rx="10" fill="${cellFill}" stroke="${stroke}" stroke-width="3"></rect>`;
        }
    }

    return `
        <svg class="fraction-visual fraction-visual--grid" width="87" height="87" style="width:87px;height:87px;max-width:87px;max-height:87px;display:block;" viewBox="0 0 ${size} ${size}" role="img" aria-label="Grade representando ${problem.numerator} de ${problem.denominator}">
            ${cells}
        </svg>
    `;
}

function getGridDimensions(denominator) {
    let best = null;

    for (let rows = 2; rows <= Math.sqrt(denominator); rows += 1) {
        if (denominator % rows !== 0) {
            continue;
        }
        const cols = denominator / rows;
        if (!best || Math.abs(cols - rows) < Math.abs(best.cols - best.rows)) {
            best = { rows, cols };
        }
    }

    if (best) {
        return best;
    }

    if (denominator % 2 === 0 && denominator >= 4) {
        return { rows: 2, cols: denominator / 2 };
    }

    return null;
}

function otherSide(side) {
    return side === "left" ? "right" : "left";
}

function describeSlice(cx, cy, radius, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        `M ${cx} ${cy}`,
        `L ${start.x} ${start.y}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
        "Z",
    ].join(" ");
}

function polarToCartesian(cx, cy, radius, angleDeg) {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: cx + radius * Math.cos(angleRad),
        y: cy + radius * Math.sin(angleRad),
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
