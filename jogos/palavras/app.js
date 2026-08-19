const { letters, syllables, words, pseudoWords, benchmarks } = window.JOJO_PALAVRAS_DATA;

const CONTENT_META = {
    letters: { label: "Letras", singular: "letra", plural: "letras", pace: "LPM" },
    syllables: { label: "Sílabas", singular: "sílaba", plural: "sílabas", pace: "SPM" },
    words: { label: "Palavras", singular: "palavra", plural: "palavras", pace: "PPM" },
    pseudowords: { label: "Pseudopalavras", singular: "pseudopalavra", plural: "pseudopalavras", pace: "PPM" }
};

const state = {
    soundEnabled: true,
    audioContext: null,
    mode: "timed",
    letter: "lowercase",
    content: "words",
    syllableLevel: "simple",
    screen: "home",
    session: createIdleSession()
};

const ui = {
    body: document.body,
    homeScreen: document.getElementById("homeScreen"),
    sessionScreen: document.getElementById("sessionScreen"),
    resultScreen: document.getElementById("resultScreen"),
    infoModal: document.getElementById("infoModal"),
    benchmarkGrid: document.getElementById("benchmarkGrid"),
    benchmarkSection: document.getElementById("benchmarkSection"),
    openInfoBtn: document.getElementById("openInfoBtn"),
    closeInfoBtn: document.getElementById("closeInfoBtn"),
    toggleSoundBtn: document.getElementById("toggleSoundBtn"),
    fullscreenBtn: document.getElementById("fullscreenBtn"),
    exitFullscreenBtn: document.getElementById("exitFullscreenBtn"),
    sessionSoundBtn: document.getElementById("sessionSoundBtn"),
    contentButtons: [...document.querySelectorAll("[data-content-option]")],
    syllableButtons: [...document.querySelectorAll("[data-syllable-option]")],
    letterButtons: [...document.querySelectorAll("[data-letter-option]")],
    modeButtons: [...document.querySelectorAll("[data-mode-option]")],
    syllableLevelGroup: document.getElementById("syllableLevelGroup"),
    heroContentLabel: document.getElementById("heroContentLabel"),
    startSessionBtn: document.getElementById("startSessionBtn"),
    backHomeBtn: document.getElementById("backHomeBtn"),
    nextBtn: document.getElementById("nextBtn"),
    skipBtn: document.getElementById("skipBtn"),
    finishBtn: document.getElementById("finishBtn"),
    retryBtn: document.getElementById("retryBtn"),
    resultHomeBtn: document.getElementById("resultHomeBtn"),
    sessionModeLabel: document.getElementById("sessionModeLabel"),
    sessionLetterLabel: document.getElementById("sessionLetterLabel"),
    timerCaption: document.getElementById("timerCaption"),
    timerValue: document.getElementById("timerValue"),
    shownValue: document.getElementById("shownValue"),
    sessionContentLabel: document.getElementById("sessionContentLabel"),
    readValue: document.getElementById("readValue"),
    skippedValue: document.getElementById("skippedValue"),
    paceValue: document.getElementById("paceValue"),
    wordDisplay: document.getElementById("wordDisplay"),
    helperText: document.getElementById("helperText"),
    resultTitle: document.getElementById("resultTitle"),
    resultScore: document.getElementById("resultScore"),
    resultScoreLabel: document.getElementById("resultScoreLabel"),
    resultPace: document.getElementById("resultPace"),
    resultSummary: document.getElementById("resultSummary"),
    resultSkippedBox: document.getElementById("resultSkippedBox"),
    resultSkippedLabel: document.getElementById("resultSkippedLabel"),
    resultSkippedWords: document.getElementById("resultSkippedWords"),
    appShell: document.querySelector(".app-shell")
};

function createIdleSession() {
    return {
        status: "idle",
        timerId: null,
        queue: [],
        index: 0,
        currentWord: null,
        shownCount: 0,
        readCount: 0,
        skippedWords: [],
        secondsLeft: 60,
        elapsedSeconds: 0
    };
}

function renderBenchmarks() {
    ui.benchmarkGrid.innerHTML = benchmarks
        .map(
            (item) => `
                <div class="benchmark-row">
                    <span>${item.year}</span>
                    <strong>${item.ppm} PPM</strong>
                </div>
            `
        )
        .join("");
}

function shuffleArray(array) {
    const copy = [...array];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }
    return copy;
}

function getVowelNucleusCount(item) {
    const normalized = item
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleUpperCase("pt-BR");

    return (normalized.match(/[AEIOU]+/g) || []).length;
}

function hasAtLeastTwoSyllables(item) {
    return getVowelNucleusCount(item) >= 2;
}

function getItemComplexity(item) {
    const decomposed = item.normalize("NFD");
    const normalized = decomposed
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleUpperCase("pt-BR");
    const clusters = normalized.match(/(?:BR|CR|DR|FR|GR|PR|TR|VR|BL|CL|FL|GL|PL|TL|VL)/g) || [];
    const digraphs = normalized.match(/(?:CH|LH|NH|QU|GU)/g) || [];
    const unusualClusters = normalized.match(/[BCDFGJKLMNPQRSTVWXYZ]{2,}/g) || [];
    const closedSyllables = normalized.match(/[AEIOU][RSLMNX](?:$|[BCDFGJKLMNPQRSTVWXYZ])/g) || [];
    const accentCount = decomposed.length - normalized.length;
    const lengthScore = [...item].length;
    const vowelNuclei = getVowelNucleusCount(item);

    return (
        lengthScore
        + Math.max(0, vowelNuclei - 2) * 1.5
        + Math.max(0, lengthScore - 5) * 0.7
        + clusters.length * 2.2
        + digraphs.length * 1.8
        + unusualClusters.length * 1.4
        + closedSyllables.length * 1.2
        + Math.max(0, accentCount) * 8
    );
}

function sortByComplexity(list) {
    return [...list].sort((first, second) => {
        const complexityDifference = getItemComplexity(first) - getItemComplexity(second);
        if (complexityDifference !== 0) {
            return complexityDifference;
        }

        return [...first].length - [...second].length;
    });
}

function getModeLabel() {
    return state.mode === "timed" ? "Teste cronometrado" : "Leitura livre";
}

function getContentMeta() {
    return CONTENT_META[state.content];
}

function getContentNoun(count) {
    const meta = getContentMeta();
    return count === 1 ? meta.singular : meta.plural;
}

function getContentDetailLabel() {
    if (state.content !== "syllables") {
        return getContentMeta().label;
    }

    return state.syllableLevel === "complex" ? "Sílabas complexas" : "Sílabas simples";
}

function getLetterLabel() {
    if (state.letter === "uppercase") {
        return "Letra impressa maiúscula";
    }

    if (state.letter === "cursive") {
        return "Letra cursiva manuscrita";
    }

    return "Letra impressa minúscula";
}

function updateSoundButtons() {
    const icon = state.soundEnabled ? "🔊" : "🔇";
    const label = state.soundEnabled ? "Som ligado" : "Som desligado";
    ui.toggleSoundBtn.innerHTML = `<span aria-hidden="true">${icon}</span><span class="sr-only">${label}</span>`;
    ui.sessionSoundBtn.innerHTML = `<span aria-hidden="true">${icon}</span><span class="sr-only">${label}</span>`;
    ui.toggleSoundBtn.setAttribute("aria-label", label);
    ui.sessionSoundBtn.setAttribute("aria-label", label);
    ui.toggleSoundBtn.setAttribute("aria-pressed", String(state.soundEnabled));
    ui.sessionSoundBtn.setAttribute("aria-pressed", String(state.soundEnabled));
}

function renderHomeSelections() {
    ui.contentButtons.forEach((button) => {
        const isActive = button.dataset.contentOption === state.content;
        button.classList.toggle("is-selected", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });

    ui.syllableButtons.forEach((button) => {
        const isActive = button.dataset.syllableOption === state.syllableLevel;
        button.classList.toggle("is-selected", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });

    ui.syllableLevelGroup.hidden = state.content !== "syllables";
    ui.benchmarkSection.hidden = state.content !== "words";
    ui.heroContentLabel.textContent = getContentDetailLabel();

    ui.letterButtons.forEach((button) => {
        const isActive = button.dataset.letterOption === state.letter;
        button.classList.toggle("is-selected", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });

    ui.modeButtons.forEach((button) => {
        const isActive = button.dataset.modeOption === state.mode;
        button.classList.toggle("is-selected", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });

    ui.startSessionBtn.textContent = `Começar ${getContentDetailLabel().toLocaleLowerCase("pt-BR")}`;
}

function setDisplayItem(item) {
    const itemLength = [...item].length;
    const maximumSize = state.content === "letters" ? 30 : state.content === "syllables" ? 24 : 22;
    const fittedSize = Math.min(maximumSize, 145 / Math.max(itemLength, 1));

    ui.wordDisplay.textContent = item;
    ui.wordDisplay.style.setProperty("--item-size", `${fittedSize}vw`);
    ui.wordDisplay.classList.remove("is-intro");
    ui.wordDisplay.classList.toggle("is-cursive", state.letter === "cursive");
    // Apply the measured size before the browser can paint the provisional vw size.
    fitDisplayItemToStage();
}

let displayFitFrame = null;

function fitDisplayItemToStage() {
    if (state.screen !== "session" || ui.wordDisplay.classList.contains("is-intro")) {
        return;
    }

    const item = ui.wordDisplay.textContent.trim();
    const stage = ui.wordDisplay.closest(".word-stage");
    if (!item || !stage) {
        return;
    }

    const itemLength = [...item].length;
    const maximumSize = state.content === "letters" ? 30 : state.content === "syllables" ? 24 : 22;
    const initialSize = Math.min(maximumSize, 145 / Math.max(itemLength, 1));
    ui.wordDisplay.style.setProperty("--item-size", `${initialSize}vw`);

    const stageStyle = window.getComputedStyle(stage);
    const availableWidth = stage.clientWidth
        - Number.parseFloat(stageStyle.paddingLeft)
        - Number.parseFloat(stageStyle.paddingRight);
    const availableHeight = stage.clientHeight
        - Number.parseFloat(stageStyle.paddingTop)
        - Number.parseFloat(stageStyle.paddingBottom);
    const displayStyle = window.getComputedStyle(ui.wordDisplay);
    const currentSize = Number.parseFloat(displayStyle.fontSize);

    const canvas = fitDisplayItemToStage.canvas || document.createElement("canvas");
    fitDisplayItemToStage.canvas = canvas;
    const context = canvas.getContext("2d");
    context.font = `${displayStyle.fontStyle} ${displayStyle.fontWeight} ${currentSize}px ${displayStyle.fontFamily}`;

    const letterSpacing = Number.parseFloat(displayStyle.letterSpacing) || 0;
    const measuredWidth = context.measureText(item).width + Math.max(0, itemLength - 1) * letterSpacing;
    const widthLimitedSize = measuredWidth > 0 ? currentSize * (availableWidth * 0.94 / measuredWidth) : currentSize;
    const heightLimitedSize = availableHeight > 0 ? availableHeight * 0.82 : currentSize;
    const finalSize = Math.max(34, Math.min(currentSize, widthLimitedSize, heightLimitedSize));

    ui.wordDisplay.style.setProperty("--item-size", `${finalSize}px`);
}

function scheduleDisplayFit() {
    if (displayFitFrame) {
        window.cancelAnimationFrame(displayFitFrame);
    }

    displayFitFrame = window.requestAnimationFrame(() => {
        displayFitFrame = null;
        fitDisplayItemToStage();
    });
}

function ensureAudioContext() {
    if (state.audioContext || !window.AudioContext) {
        return;
    }

    state.audioContext = new window.AudioContext();
}

function runWithAudio(callback) {
    ensureAudioContext();
    if (!state.audioContext) {
        return;
    }

    const context = state.audioContext;
    if (context.state === "suspended") {
        context.resume().then(() => callback(context)).catch(() => {});
        return;
    }

    callback(context);
}

function playTone({ frequency, duration, type = "sine", volume = 0.08 }) {
    if (!state.soundEnabled) {
        return;
    }

    runWithAudio((context) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        const now = context.currentTime;

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(volume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.02);
    });
}

function playStartSound() {
    playTone({ frequency: 440, duration: 0.12, type: "triangle", volume: 0.09 });
    window.setTimeout(() => {
        playTone({ frequency: 560, duration: 0.15, type: "triangle", volume: 0.1 });
    }, 110);
}

function playAdvanceSound() {
    playTone({ frequency: 620, duration: 0.08, type: "triangle", volume: 0.07 });
}

function playSkipSound() {
    playTone({ frequency: 260, duration: 0.11, type: "sawtooth", volume: 0.07 });
}

function playCountdownSound() {
    playTone({ frequency: 860, duration: 0.09, type: "square", volume: 0.08 });
}

function playFinishSound() {
    playTone({ frequency: 520, duration: 0.12, type: "triangle", volume: 0.09 });
    window.setTimeout(() => {
        playTone({ frequency: 420, duration: 0.16, type: "triangle", volume: 0.09 });
    }, 130);
}

function playToggleSound() {
    playTone({ frequency: 700, duration: 0.08, type: "triangle", volume: 0.08 });
}

function switchScreen(nextScreen) {
    state.screen = nextScreen;
    ui.homeScreen.classList.toggle("hidden", nextScreen !== "home");
    ui.sessionScreen.classList.toggle("hidden", nextScreen !== "session");
    ui.resultScreen.classList.toggle("hidden", nextScreen !== "result");
    ui.body.classList.toggle("session-active", nextScreen === "session");
    ui.body.classList.toggle("result-active", nextScreen === "result");
    syncFullscreenState();
    window.scrollTo({ top: 0, behavior: "instant" });
}

function syncFullscreenState() {
    const isFullscreen = Boolean(document.fullscreenElement);
    const sessionVisible = state.screen === "session";
    ui.body.classList.toggle("is-fullscreen", isFullscreen);
    ui.fullscreenBtn.classList.toggle("hidden", isFullscreen || !sessionVisible);
    ui.exitFullscreenBtn.classList.toggle("hidden", !isFullscreen || !sessionVisible);
}

async function enterFullscreen() {
    const target = ui.appShell || document.documentElement;
    try {
        if (target.requestFullscreen) {
            await target.requestFullscreen();
        }
    } catch (error) {
        console.warn("Nao foi possivel entrar em tela cheia.", error);
    } finally {
        syncFullscreenState();
    }
}

async function exitFullscreen() {
    try {
        if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen();
        }
    } catch (error) {
        console.warn("Nao foi possivel sair da tela cheia.", error);
    } finally {
        syncFullscreenState();
    }
}

function openInfoModal() {
    ui.infoModal.classList.remove("hidden");
    ui.infoModal.setAttribute("aria-hidden", "false");
    ui.body.classList.add("modal-open");
}

function closeInfoModal() {
    ui.infoModal.classList.add("hidden");
    ui.infoModal.setAttribute("aria-hidden", "true");
    ui.body.classList.remove("modal-open");
}

function buildRepeatedQueue(source, targetLength = 100) {
    const queue = [];

    while (queue.length < targetLength) {
        const round = shuffleArray(source);
        if (queue.length > 0 && round.length > 1 && queue.at(-1) === round[0]) {
            [round[0], round[1]] = [round[1], round[0]];
        }
        queue.push(...round);
    }

    return queue.slice(0, targetLength);
}

function getContentSource() {
    if (state.content === "letters") {
        return letters;
    }

    if (state.content === "syllables") {
        return syllables[state.syllableLevel];
    }

    if (state.content === "pseudowords") {
        return pseudoWords;
    }

    return words;
}

function buildQueue() {
    const source = getContentSource();
    let orderedItems;

    if (state.content === "pseudowords") {
        const uniqueItems = [...new Set(source)].filter(hasAtLeastTwoSyllables);
        orderedItems = sortByComplexity(shuffleArray(uniqueItems).slice(0, 100));
    } else if (state.content === "words") {
        const uniqueItems = [...new Set(source)];
        orderedItems = sortByComplexity(shuffleArray(uniqueItems).slice(0, 100));
    } else {
        orderedItems = buildRepeatedQueue(source);
    }

    if (state.letter === "uppercase") {
        return orderedItems.map((item) => item.toLocaleUpperCase("pt-BR"));
    }
    return orderedItems.map((item) => item.toLocaleLowerCase("pt-BR"));
}

function startSession(mode, letter) {
    state.mode = mode;
    state.letter = letter;
    ui.sessionScreen.dataset.mode = mode;
    ui.sessionScreen.dataset.content = state.content;
    state.session = {
        status: "ready",
        timerId: null,
        queue: buildQueue(),
        index: 0,
        currentWord: null,
        shownCount: 0,
        readCount: 0,
        skippedWords: [],
        secondsLeft: 60,
        elapsedSeconds: 0
    };

    ui.sessionModeLabel.textContent = getModeLabel();
    ui.sessionLetterLabel.textContent = getLetterLabel();
    ui.sessionContentLabel.textContent = getContentDetailLabel();
    ui.timerCaption.textContent = mode === "timed" ? "Tempo restante" : "Tempo de leitura";
    ui.wordDisplay.textContent = state.letter === "cursive" ? "pronto? clique em próxima" : "PRONTO? CLIQUE EM PRÓXIMA";
    ui.wordDisplay.style.removeProperty("--item-size");
    ui.wordDisplay.classList.add("is-intro");
    ui.wordDisplay.classList.toggle("is-cursive", state.letter === "cursive");
    ui.helperText.textContent = "Espaço avança • X marca dificuldade • Enter encerra";

    renderSessionStats();
    switchScreen("session");
}

function clearTimer() {
    if (state.session.timerId) {
        window.clearInterval(state.session.timerId);
        state.session.timerId = null;
    }
}

function startTimerIfNeeded() {
    if (state.mode !== "timed" || state.session.timerId) {
        return;
    }

    state.session.timerId = window.setInterval(() => {
        state.session.secondsLeft -= 1;
        renderSessionStats();

        if (state.session.secondsLeft <= 10 && state.session.secondsLeft > 0) {
            playCountdownSound();
        }

        if (state.session.secondsLeft <= 0) {
            state.session.secondsLeft = 0;
            finishSession("time");
        }
    }, 1000);
}

function startElapsedTimerIfNeeded() {
    if (state.mode !== "free" || state.session.timerId) {
        return;
    }

    state.session.timerId = window.setInterval(() => {
        state.session.elapsedSeconds += 1;
        renderSessionStats();
    }, 1000);
}

function getPace() {
    const elapsedSeconds = state.mode === "timed" ? 60 - state.session.secondsLeft : state.session.elapsedSeconds;
    if (elapsedSeconds <= 0 || state.session.readCount <= 0) {
        return 0;
    }
    return Math.round(state.session.readCount / (elapsedSeconds / 60));
}

function getTimerDisplay() {
    const value = state.mode === "timed" ? state.session.secondsLeft : state.session.elapsedSeconds;
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderSessionStats() {
    const meta = getContentMeta();
    ui.timerValue.textContent = getTimerDisplay();
    ui.shownValue.textContent = `${state.session.shownCount}/${state.session.queue.length}`;
    ui.readValue.textContent = `${state.session.readCount} lidas`;
    ui.skippedValue.textContent = String(state.session.skippedWords.length);
    ui.paceValue.textContent = `${getPace()} ${meta.pace}`;
}

function showNextWord() {
    if (state.session.index >= state.session.queue.length) {
        finishSession("complete");
        return;
    }

    state.session.currentWord = state.session.queue[state.session.index];
    state.session.index += 1;
    state.session.shownCount = state.session.index;
    setDisplayItem(state.session.currentWord);
    ui.helperText.textContent = state.mode === "timed" ? "Espaço avança • X marca dificuldade" : "Espaço avança • X marca dificuldade • Enter encerra";
    renderSessionStats();
}

function handleNextWord() {
    ensureAudioContext();

    if (state.session.status === "ready") {
        state.session.status = "running";
        if (state.mode === "timed") {
            startTimerIfNeeded();
        } else {
            startElapsedTimerIfNeeded();
        }
        playStartSound();
        showNextWord();
        return;
    }

    if (state.session.status !== "running") {
        return;
    }

    if (state.session.currentWord) {
        state.session.readCount += 1;
    }

    playAdvanceSound();
    showNextWord();
}

function handleSkipWord() {
    ensureAudioContext();

    if (state.session.status === "ready") {
        state.session.status = "running";
        if (state.mode === "timed") {
            startTimerIfNeeded();
        } else {
            startElapsedTimerIfNeeded();
        }
        playStartSound();
        showNextWord();
        return;
    }

    if (state.session.status !== "running" || !state.session.currentWord) {
        return;
    }

    state.session.skippedWords.push(state.session.currentWord);
    playSkipSound();
    showNextWord();
}

function finishSession(reason = "manual") {
    const meta = getContentMeta();
    clearTimer();
    state.session.status = "complete";
    playFinishSound();

    ui.resultTitle.textContent = reason === "time" ? "Tempo encerrado" : "Sessão concluída";
    ui.resultScore.textContent = String(state.session.readCount);
    ui.resultScoreLabel.textContent = state.mode === "timed" ? `${meta.plural} lidas em 1 minuto` : `${meta.plural} lidas`;
    ui.resultPace.textContent = `${getPace()} ${meta.pace}`;
    ui.resultSummary.textContent =
        state.mode === "timed"
            ? `Você confirmou ${state.session.readCount} ${getContentNoun(state.session.readCount)} e marcou ${state.session.skippedWords.length} com dificuldade.`
            : `Você leu ${state.session.readCount} ${getContentNoun(state.session.readCount)} nesta rodada.`;

    ui.resultSkippedLabel.textContent = `${meta.label} com dificuldade`;

    if (state.session.skippedWords.length > 0) {
        ui.resultSkippedBox.classList.remove("hidden");
        ui.resultSkippedWords.textContent = state.session.skippedWords.join(" • ");
    } else {
        ui.resultSkippedBox.classList.add("hidden");
        ui.resultSkippedWords.textContent = "";
    }

    switchScreen("result");
}

function goHome() {
    clearTimer();
    state.session = createIdleSession();
    delete ui.sessionScreen.dataset.mode;
    delete ui.sessionScreen.dataset.content;
    ui.wordDisplay.classList.remove("is-intro", "is-cursive");
    ui.wordDisplay.style.removeProperty("--item-size");
    switchScreen("home");
}

function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    updateSoundButtons();
    if (state.soundEnabled) {
        playToggleSound();
    }
}

function retrySession() {
    if (!state.mode || !state.letter) {
        goHome();
        return;
    }

    startSession(state.mode, state.letter);
}

ui.contentButtons.forEach((button) => {
    button.addEventListener("click", () => {
        state.content = button.dataset.contentOption;
        renderHomeSelections();
        if (state.soundEnabled) {
            playToggleSound();
        }
    });
});

ui.syllableButtons.forEach((button) => {
    button.addEventListener("click", () => {
        state.syllableLevel = button.dataset.syllableOption;
        renderHomeSelections();
        if (state.soundEnabled) {
            playToggleSound();
        }
    });
});

ui.letterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        state.letter = button.dataset.letterOption;
        renderHomeSelections();
        if (state.soundEnabled) {
            playToggleSound();
        }
    });
});

ui.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        state.mode = button.dataset.modeOption;
        renderHomeSelections();
        if (state.soundEnabled) {
            playToggleSound();
        }
    });
});

ui.startSessionBtn.addEventListener("click", () => {
    ensureAudioContext();
    if (state.soundEnabled) {
        playToggleSound();
    }
    startSession(state.mode, state.letter);
});

ui.toggleSoundBtn.addEventListener("click", toggleSound);
ui.fullscreenBtn.addEventListener("click", enterFullscreen);
ui.exitFullscreenBtn.addEventListener("click", exitFullscreen);
ui.sessionSoundBtn.addEventListener("click", toggleSound);
ui.openInfoBtn.addEventListener("click", openInfoModal);
ui.closeInfoBtn.addEventListener("click", closeInfoModal);
ui.infoModal.addEventListener("click", (event) => {
    if (event.target === ui.infoModal || event.target.classList.contains("modal__backdrop")) {
        closeInfoModal();
    }
});

ui.backHomeBtn.addEventListener("click", goHome);
ui.nextBtn.addEventListener("click", handleNextWord);
ui.skipBtn.addEventListener("click", handleSkipWord);
ui.finishBtn.addEventListener("click", () => finishSession("manual"));
ui.retryBtn.addEventListener("click", retrySession);
ui.resultHomeBtn.addEventListener("click", goHome);

document.addEventListener("keydown", (event) => {
    if (state.screen !== "session") {
        if (event.key === "Escape" && !ui.infoModal.classList.contains("hidden")) {
            closeInfoModal();
        } else if (event.key === "Escape" && document.fullscreenElement) {
            exitFullscreen();
        }
        return;
    }

    if (event.code === "Space") {
        event.preventDefault();
        handleNextWord();
    }

    if (event.key.toLowerCase() === "x") {
        event.preventDefault();
        handleSkipWord();
    }

    if (event.key === "Enter") {
        event.preventDefault();
        finishSession("manual");
    }

    if (event.key === "Escape") {
        event.preventDefault();
        goHome();
    }
});

renderBenchmarks();
updateSoundButtons();
renderHomeSelections();
document.addEventListener("fullscreenchange", () => {
    syncFullscreenState();
    scheduleDisplayFit();
});
window.addEventListener("resize", scheduleDisplayFit);
syncFullscreenState();
