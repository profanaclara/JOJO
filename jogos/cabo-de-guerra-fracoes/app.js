const LEVELS = {
    easy: { label: "Fácil", denominators: [2, 3, 4] },
    medium: { label: "Médio", denominators: [4, 5, 6, 8] },
    hard: { label: "Desafio", denominators: [6, 8, 10, 12] },
};

const refs = {
    app: document.getElementById("app"),
    restartBtn: document.getElementById("restartBtn"),
    setupModal: document.getElementById("setupModal"),
    levelButtons: [...document.querySelectorAll("[data-level]")],
    roundsButtons: [...document.querySelectorAll("[data-rounds]")],
    startMatchBtn: document.getElementById("startMatchBtn"),
    leftPizza: document.getElementById("leftPizza"),
    rightPizza: document.getElementById("rightPizza"),
    leftScore: document.getElementById("leftScore"),
    rightScore: document.getElementById("rightScore"),
    leftStatus: document.getElementById("leftStatus"),
    rightStatus: document.getElementById("rightStatus"),
    leftNumeratorField: document.getElementById("leftNumeratorField"),
    leftDenominatorField: document.getElementById("leftDenominatorField"),
    rightNumeratorField: document.getElementById("rightNumeratorField"),
    rightDenominatorField: document.getElementById("rightDenominatorField"),
    keypads: [...document.querySelectorAll(".keypad")],
    roundCounter: document.getElementById("roundCounter"),
    levelLabel: document.getElementById("levelLabel"),
    matchTimer: document.getElementById("matchTimer"),
    ropeWrapper: document.getElementById("ropeWrapper"),
    feedback: document.getElementById("feedback"),
    countdownOverlay: document.getElementById("countdownOverlay"),
    countdownValue: document.getElementById("countdownValue"),
    backgroundMusic: document.getElementById("backgroundMusic"),
};

const state = {
    config: {
        level: "easy",
        rounds: 5,
    },
    match: {
        started: false,
        inCountdown: false,
        inRound: false,
        round: 0,
        leftScore: 0,
        rightScore: 0,
        tug: 0,
        timeLeft: 0,
        problems: {
            left: null,
            right: null,
        },
        answers: {
            left: createAnswerState(),
            right: createAnswerState(),
        },
    },
};

const timers = {
    countdown: null,
    nextRound: null,
    clock: null,
    feedback: null,
};

function createAnswerState() {
    return {
        numerator: "",
        denominator: "",
        active: "numerator",
    };
}

function init() {
    bindEvents();
    configureMusic();
    renderSetup();
    renderAll();
}

function bindEvents() {
    refs.levelButtons.forEach((button) => {
        button.addEventListener("click", () => {
            state.config.level = button.dataset.level;
            renderSetup();
        });
    });

    refs.roundsButtons.forEach((button) => {
        button.addEventListener("click", () => {
            state.config.rounds = Number(button.dataset.rounds);
            renderSetup();
        });
    });

    refs.startMatchBtn.addEventListener("click", startMatch);
    refs.restartBtn.addEventListener("click", restartPrototype);

    [refs.leftNumeratorField, refs.leftDenominatorField, refs.rightNumeratorField, refs.rightDenominatorField].forEach((field) => {
        field.addEventListener("click", () => {
            setActiveField(field.dataset.side, field.dataset.part);
        });
    });

    refs.keypads.forEach((keypad) => {
        keypad.addEventListener("click", (event) => {
            const button = event.target.closest("button");
            if (!button) {
                return;
            }

            handleKeypadPress(keypad.dataset.side, button.dataset.key);
        });
    });
}

function configureMusic() {
    if (!refs.backgroundMusic) {
        return;
    }

    refs.backgroundMusic.volume = 0.28;
    refs.backgroundMusic.loop = true;
}

function startMatch() {
    resetMatchState();
    refs.app.classList.remove("is-setup-open");
    refs.setupModal.classList.add("hidden");
    startCountdown();
}

function restartPrototype() {
    clearAllTimers();
    pauseMusic(true);
    resetMatchState();
    refs.app.classList.add("is-setup-open");
    refs.setupModal.classList.remove("hidden");
    refs.countdownOverlay.classList.add("hidden");
    hideFeedback();
    renderSetup();
    renderAll();
}

function resetMatchState() {
    state.match.started = false;
    state.match.inCountdown = false;
    state.match.inRound = false;
    state.match.round = 0;
    state.match.leftScore = 0;
    state.match.rightScore = 0;
    state.match.tug = 0;
    state.match.timeLeft = 0;
    state.match.problems.left = null;
    state.match.problems.right = null;
    state.match.answers.left = createAnswerState();
    state.match.answers.right = createAnswerState();
}

function startCountdown() {
    clearAllTimers();
    state.match.inCountdown = true;
    refs.countdownOverlay.classList.remove("hidden");

    let value = 3;
    refs.countdownValue.textContent = value;

    timers.countdown = window.setInterval(() => {
        value -= 1;
        if (value > 0) {
            refs.countdownValue.textContent = value;
            return;
        }

        window.clearInterval(timers.countdown);
        timers.countdown = null;
        refs.countdownValue.textContent = "Já";

        window.setTimeout(() => {
            refs.countdownOverlay.classList.add("hidden");
            state.match.inCountdown = false;
            beginRound();
        }, 420);
    }, 700);
}

function beginRound() {
    if (state.match.round >= state.config.rounds) {
        finishMatch();
        return;
    }

    state.match.started = true;
    state.match.inRound = true;
    state.match.round += 1;
    state.match.timeLeft = 20;
    state.match.answers.left = createAnswerState();
    state.match.answers.right = createAnswerState();
    state.match.problems.left = generateFractionProblem();
    state.match.problems.right = generateFractionProblem();
    setStatus("left", "Preencha a fração.", "");
    setStatus("right", "Preencha a fração.", "");
    startMusic();
    startClock();
    renderAll();
}

function startClock() {
    if (timers.clock) {
        window.clearInterval(timers.clock);
    }

    refs.matchTimer.textContent = formatTime(state.match.timeLeft);

    timers.clock = window.setInterval(() => {
        state.match.timeLeft -= 1;
        refs.matchTimer.textContent = formatTime(Math.max(state.match.timeLeft, 0));

        if (state.match.timeLeft > 0) {
            return;
        }

        window.clearInterval(timers.clock);
        timers.clock = null;
        state.match.inRound = false;
        showFeedback("Tempo esgotado");
        setStatus("left", "Tempo esgotado.", "error");
        setStatus("right", "Tempo esgotado.", "error");
        timers.nextRound = window.setTimeout(() => {
            hideFeedback();
            beginRound();
        }, 1400);
    }, 1000);
}

function handleKeypadPress(side, key) {
    if (!state.match.inRound) {
        return;
    }

    const answer = state.match.answers[side];

    if (key === "clear") {
        if (answer[answer.active]) {
            answer[answer.active] = "";
        } else {
            answer.numerator = "";
            answer.denominator = "";
            answer.active = "numerator";
        }
        renderAnswerFields(side);
        return;
    }

    if (key === "submit") {
        validateAnswer(side);
        return;
    }

    const activeKey = answer.active;
    if (answer[activeKey].length >= 2) {
        return;
    }

    answer[activeKey] += key;

    if (activeKey === "numerator" && answer.numerator.length >= 1) {
        answer.active = "denominator";
    }

    renderAnswerFields(side);
}

function validateAnswer(side) {
    const answer = state.match.answers[side];
    const problem = state.match.problems[side];

    if (!answer.numerator || !answer.denominator) {
        setStatus(side, "Complete numerador e denominador.", "error");
        return;
    }

    const isCorrect =
        Number(answer.numerator) === problem.numerator &&
        Number(answer.denominator) === problem.denominator;

    if (!isCorrect) {
        setStatus(side, "Tente novamente.", "error");
        answer.numerator = "";
        answer.denominator = "";
        answer.active = "numerator";
        renderAnswerFields(side);
        return;
    }

    const winnerSide = side;
    const loserSide = side === "left" ? "right" : "left";
    state.match.inRound = false;

    if (timers.clock) {
        window.clearInterval(timers.clock);
        timers.clock = null;
    }

    if (winnerSide === "left") {
        state.match.leftScore += 1;
        state.match.tug = Math.max(-160, state.match.tug - 28);
    } else {
        state.match.rightScore += 1;
        state.match.tug = Math.min(160, state.match.tug + 28);
    }

    setStatus(winnerSide, "Acertou!", "success");
    setStatus(loserSide, "A outra equipe venceu a rodada.", "");
    showFeedback(winnerSide === "left" ? "Equipe azul venceu a rodada" : "Equipe vermelha venceu a rodada");
    renderAll();

    timers.nextRound = window.setTimeout(() => {
        hideFeedback();
        beginRound();
    }, 1500);
}

function finishMatch() {
    pauseMusic(true);
    state.match.started = false;
    const winnerText =
        state.match.leftScore === state.match.rightScore
            ? "Empate geral"
            : state.match.leftScore > state.match.rightScore
                ? "Equipe azul venceu a partida"
                : "Equipe vermelha venceu a partida";

    showFeedback(winnerText);
    setStatus("left", winnerText, "");
    setStatus("right", winnerText, "");
    renderAll();
}

function generateFractionProblem() {
    const level = LEVELS[state.config.level];
    const denominator = sample(level.denominators);
    const numerator = randomInt(1, denominator - 1);

    return {
        numerator,
        denominator,
    };
}

function renderAll() {
    renderSetup();
    renderScores();
    renderRoundMeta();
    renderProblem("left");
    renderProblem("right");
    renderAnswerFields("left");
    renderAnswerFields("right");
    refs.matchTimer.textContent = formatTime(state.match.timeLeft);
    refs.ropeWrapper.style.setProperty("--rope-shift", `${state.match.tug}px`);
    refs.ropeWrapper.style.left = `calc(50% + ${state.match.tug}px)`;
}

function renderSetup() {
    refs.levelButtons.forEach((button) => {
        button.classList.toggle("is-selected", button.dataset.level === state.config.level);
    });

    refs.roundsButtons.forEach((button) => {
        button.classList.toggle("is-selected", Number(button.dataset.rounds) === state.config.rounds);
    });
}

function renderScores() {
    refs.leftScore.textContent = state.match.leftScore;
    refs.rightScore.textContent = state.match.rightScore;
}

function renderRoundMeta() {
    refs.roundCounter.textContent = `${Math.min(state.match.round, state.config.rounds)} / ${state.config.rounds}`;
    refs.levelLabel.textContent = LEVELS[state.config.level].label;
}

function renderProblem(side) {
    const container = side === "left" ? refs.leftPizza : refs.rightPizza;
    const problem = state.match.problems[side];

    if (!problem) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = buildPizzaSvg(problem.numerator, problem.denominator, side);
}

function renderAnswerFields(side) {
    const answer = state.match.answers[side];
    const numeratorField = side === "left" ? refs.leftNumeratorField : refs.rightNumeratorField;
    const denominatorField = side === "left" ? refs.leftDenominatorField : refs.rightDenominatorField;

    numeratorField.textContent = answer.numerator || "?";
    denominatorField.textContent = answer.denominator || "?";
    numeratorField.classList.toggle("is-active", answer.active === "numerator");
    denominatorField.classList.toggle("is-active", answer.active === "denominator");
}

function setActiveField(side, part) {
    state.match.answers[side].active = part;
    renderAnswerFields(side);
}

function setStatus(side, text, tone) {
    const element = side === "left" ? refs.leftStatus : refs.rightStatus;
    element.textContent = text;
    element.classList.toggle("is-success", tone === "success");
    element.classList.toggle("is-error", tone === "error");
}

function showFeedback(text) {
    refs.feedback.textContent = text;
    refs.feedback.classList.remove("hidden");

    if (timers.feedback) {
        window.clearTimeout(timers.feedback);
    }

    timers.feedback = window.setTimeout(() => {
        hideFeedback();
    }, 1300);
}

function hideFeedback() {
    refs.feedback.classList.add("hidden");
}

function startMusic() {
    if (!refs.backgroundMusic) {
        return;
    }

    const promise = refs.backgroundMusic.play();
    if (promise?.catch) {
        promise.catch(() => {});
    }
}

function pauseMusic(reset = false) {
    if (!refs.backgroundMusic) {
        return;
    }

    refs.backgroundMusic.pause();
    if (reset) {
        refs.backgroundMusic.currentTime = 0;
    }
}

function clearAllTimers() {
    Object.values(timers).forEach((timerId) => {
        if (timerId) {
            window.clearTimeout(timerId);
            window.clearInterval(timerId);
        }
    });

    Object.keys(timers).forEach((key) => {
        timers[key] = null;
    });
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample(values) {
    return values[Math.floor(Math.random() * values.length)];
}

function polarToCartesian(cx, cy, radius, angleDeg) {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: cx + radius * Math.cos(angleRad),
        y: cy + radius * Math.sin(angleRad),
    };
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

function buildPizzaSvg(numerator, denominator, side) {
    const fill = side === "left" ? "#51a8ff" : "#ff6f8e";
    const crust = "#f2b96a";
    const cheese = "#ffe8ad";
    const lines = "#ffffff";
    const size = 220;
    const radius = 88;
    const cx = size / 2;
    const cy = size / 2;
    const angleStep = 360 / denominator;

    let slices = "";

    for (let index = 0; index < denominator; index += 1) {
        const startAngle = index * angleStep;
        const endAngle = startAngle + angleStep;
        const path = describeSlice(cx, cy, radius, startAngle, endAngle);
        const sliceFill = index < numerator ? fill : cheese;

        slices += `<path d="${path}" fill="${sliceFill}" stroke="${lines}" stroke-width="4"></path>`;
    }

    return `
        <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Pizza representando ${numerator} de ${denominator}">
            <circle cx="${cx}" cy="${cy}" r="${radius + 10}" fill="${crust}"></circle>
            ${slices}
            <circle cx="${cx}" cy="${cy}" r="12" fill="#fff7dc" opacity="0.85"></circle>
        </svg>
    `;
}

init();
