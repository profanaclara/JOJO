const { modes, about } = window.JOJO_TIMER_DATA;
const MILESTONE_COUNT = 11;

const state = {
    activeMode: null,
    totalSeconds: 0,
    remainingSeconds: 0,
    timerId: null,
    destinationRotationId: null,
    destinationAssetIndex: 0,
    isPaused: false,
    soundEnabled: true,
    audioContext: null,
    tickPhase: 0
};

const ui = {
    body: document.body,
    homeScreen: document.getElementById("homeScreen"),
    timerScreen: document.getElementById("timerScreen"),
    finishScreen: document.getElementById("finishScreen"),
    modeButtons: [...document.querySelectorAll("[data-mode]")],
    setupCard: document.getElementById("setupCard"),
    setupEyebrow: document.getElementById("setupEyebrow"),
    setupTitle: document.getElementById("setupTitle"),
    setupSubtitle: document.getElementById("setupSubtitle"),
    changeModeBtn: document.getElementById("changeModeBtn"),
    hoursInput: document.getElementById("hoursInput"),
    minutesInput: document.getElementById("minutesInput"),
    timePreview: document.getElementById("timePreview"),
    validationMessage: document.getElementById("validationMessage"),
    startTimerBtn: document.getElementById("startTimerBtn"),
    journeyCard: document.getElementById("journeyCard"),
    timerModeEyebrow: document.getElementById("timerModeEyebrow"),
    timerModeTitle: document.getElementById("timerModeTitle"),
    timerStatusText: document.getElementById("timerStatusText"),
    countdownValue: document.getElementById("countdownValue"),
    progressPercent: document.getElementById("progressPercent"),
    journeyMilestones: document.getElementById("journeyMilestones"),
    journeyBasePath: document.getElementById("journeyBasePath"),
    journeyProgress: document.getElementById("journeyProgress"),
    studentMarker: document.getElementById("studentMarker"),
    destinationAsset: document.getElementById("destinationAsset"),
    destinationLabel: document.getElementById("destinationLabel"),
    journeyMessage: document.getElementById("journeyMessage"),
    totalTimeValue: document.getElementById("totalTimeValue"),
    elapsedTimeValue: document.getElementById("elapsedTimeValue"),
    pauseBtn: document.getElementById("pauseBtn"),
    resumeBtn: document.getElementById("resumeBtn"),
    resetBtn: document.getElementById("resetBtn"),
    newTimerBtn: document.getElementById("newTimerBtn"),
    backHomeBtn: document.getElementById("backHomeBtn"),
    finishEmoji: document.getElementById("finishEmoji"),
    finishVisuals: document.getElementById("finishVisuals"),
    finishTitle: document.getElementById("finishTitle"),
    finishText: document.getElementById("finishText"),
    finishBadge: document.getElementById("finishBadge"),
    finishNewTimerBtn: document.getElementById("finishNewTimerBtn"),
    finishSameModeBtn: document.getElementById("finishSameModeBtn"),
    openInfoBtn: document.getElementById("openInfoBtn"),
    openInfoTimerBtn: document.getElementById("openInfoTimerBtn"),
    closeInfoBtn: document.getElementById("closeInfoBtn"),
    infoModal: document.getElementById("infoModal"),
    aboutParagraphs: document.getElementById("aboutParagraphs"),
    aboutBullets: document.getElementById("aboutBullets"),
    aboutFooter: document.getElementById("aboutFooter"),
    soundToggleBtn: document.getElementById("soundToggleBtn"),
    fullscreenBtn: document.getElementById("fullscreenBtn"),
    exitFullscreenBtn: document.getElementById("exitFullscreenBtn"),
    appShell: document.querySelector(".app-shell")
};

function getMode() {
    return modes[state.activeMode];
}

function ensureAudioReady() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        return null;
    }

    if (!state.audioContext) {
        state.audioContext = new AudioContextClass();
    }

    if (state.audioContext.state === "suspended") {
        state.audioContext.resume();
    }

    return state.audioContext;
}

function playSynthTone({
    type = "sine",
    frequency = 440,
    duration = 0.12,
    volume = 0.05,
    attack = 0.01,
    release = 0.08,
    endFrequency = null,
    delay = 0
}) {
    if (!state.soundEnabled) {
        return;
    }

    const context = ensureAudioReady();
    if (!context) {
        return;
    }

    const now = context.currentTime;
    const startAt = now + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);

    if (endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startAt + duration);
    }

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(volume, startAt + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + release);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startAt);
    oscillator.stop(startAt + duration);
}

function playTickTock() {
    const isTick = state.tickPhase % 2 === 0;
    state.tickPhase += 1;

    playSynthTone({
        type: isTick ? "square" : "triangle",
        frequency: isTick ? 960 : 760,
        endFrequency: isTick ? 620 : 480,
        duration: 0.1,
        release: 0.1,
        volume: 0.04
    });
}

function playFinishSound() {
    if (!state.soundEnabled) {
        return;
    }

    ensureAudioReady();

    [
        { delay: 0, frequency: 560, endFrequency: 760, duration: 0.18, release: 0.2, volume: 0.04, type: "triangle" },
        { delay: 0.13, frequency: 640, endFrequency: 880, duration: 0.2, release: 0.22, volume: 0.042, type: "triangle" },
        { delay: 0.28, frequency: 720, endFrequency: 980, duration: 0.24, release: 0.26, volume: 0.044, type: "triangle" },
        { delay: 0.46, frequency: 640, endFrequency: 920, duration: 0.42, release: 0.46, volume: 0.046, type: "sawtooth" }
    ].forEach((note) => playSynthTone(note));

    [
        { delay: 0.58, frequency: 523.25, duration: 0.62, release: 0.72, volume: 0.028, type: "sine" },
        { delay: 0.6, frequency: 659.25, duration: 0.62, release: 0.72, volume: 0.026, type: "sine" },
        { delay: 0.62, frequency: 783.99, duration: 0.7, release: 0.78, volume: 0.026, type: "sine" },
        { delay: 0.68, frequency: 1046.5, duration: 0.48, release: 0.54, volume: 0.018, type: "triangle" }
    ].forEach((note) => playSynthTone(note));
}

function playEnableSound() {
    playSynthTone({
        type: "triangle",
        frequency: 640,
        endFrequency: 860,
        duration: 0.18,
        release: 0.18,
        volume: 0.045
    });
}

function updateSoundButton() {
    const icon = state.soundEnabled ? "🔊" : "🔇";
    const label = state.soundEnabled ? "Som ligado" : "Som desligado";
    ui.soundToggleBtn.innerHTML = `<span aria-hidden="true">${icon}</span><span class="sr-only">${label}</span>`;
    ui.soundToggleBtn.setAttribute("aria-label", label);
    ui.soundToggleBtn.setAttribute("aria-pressed", String(state.soundEnabled));
}

function syncFullscreenState() {
    const isFullscreen = Boolean(document.fullscreenElement);
    ui.body.classList.toggle("is-fullscreen", isFullscreen);
    ui.fullscreenBtn.classList.toggle("hidden", isFullscreen);
    ui.exitFullscreenBtn.classList.toggle("hidden", !isFullscreen);
}

async function enterFullscreen() {
    const target = ui.appShell || document.documentElement;
    try {
        if (target.requestFullscreen) {
            await target.requestFullscreen();
        } else if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        }
    } catch (error) {
        console.warn("Não foi possível entrar em tela cheia.", error);
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
        console.warn("Não foi possível sair da tela cheia.", error);
    } finally {
        syncFullscreenState();
    }
}

function toggleSound() {
    state.soundEnabled = !state.soundEnabled;

    if (state.soundEnabled) {
        ensureAudioReady();
        playEnableSound();
    }

    updateSoundButton();
}

function formatTime(totalSeconds) {
    const safeSeconds = Math.max(0, totalSeconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function stopDestinationCycle() {
    if (state.destinationRotationId) {
        window.clearInterval(state.destinationRotationId);
        state.destinationRotationId = null;
    }
}

function stopCountdown() {
    if (state.timerId) {
        window.clearInterval(state.timerId);
        state.timerId = null;
    }
}

function startDestinationCycle() {
    stopDestinationCycle();

    const mode = getMode();
    if (!mode || !Array.isArray(mode.destinationAssets) || !mode.destinationAssets.length) {
        return;
    }

    state.destinationRotationId = window.setInterval(() => {
        if (state.isPaused || state.remainingSeconds <= 0) {
            return;
        }

        state.destinationAssetIndex = (state.destinationAssetIndex + 1) % mode.destinationAssets.length;
        renderDestination(mode);
    }, 3000);
}

function clampNumber(value, min, max) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        return 0;
    }

    return Math.min(max, Math.max(min, parsed));
}

function getInputSeconds() {
    const hours = clampNumber(ui.hoursInput.value, 0, 8);
    const minutes = clampNumber(ui.minutesInput.value, 0, 59);
    return hours * 3600 + minutes * 60;
}

function getProgressRatio() {
    if (state.totalSeconds <= 0) {
        return 0;
    }

    return (state.totalSeconds - state.remainingSeconds) / state.totalSeconds;
}

function getCurrentDestination(mode) {
    if (Array.isArray(mode.destinationAssets) && mode.destinationAssets.length) {
        return mode.destinationAssets[state.destinationAssetIndex % mode.destinationAssets.length];
    }

    return {
        src: mode.destinationAsset,
        label: mode.destinationLabel
    };
}

function renderDestination(mode) {
    const destination = getCurrentDestination(mode);
    ui.destinationAsset.src = destination.src;
    ui.destinationAsset.alt = destination.label || "";
    ui.destinationAsset.title = destination.label || "";
    ui.destinationLabel.textContent = "";
}

function switchScreen(screen) {
    ui.homeScreen.classList.toggle("hidden", screen !== "home");
    ui.timerScreen.classList.toggle("hidden", screen !== "timer");
    ui.finishScreen.classList.toggle("hidden", screen !== "finish");
}

function renderAboutModal() {
    ui.aboutParagraphs.innerHTML = about.paragraphs
        .map((paragraph) => `<p>${paragraph}</p>`)
        .join("");
    ui.aboutBullets.innerHTML = about.bullets
        .map((item) => `<li>${item}</li>`)
        .join("");
    ui.aboutFooter.textContent = about.footer;
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

function updateSetupPreview() {
    const totalSeconds = getInputSeconds();
    const hours = clampNumber(ui.hoursInput.value, 0, 8);
    const minutes = clampNumber(ui.minutesInput.value, 0, 59);

    if (String(hours) !== ui.hoursInput.value && ui.hoursInput.value !== "") {
        ui.hoursInput.value = String(hours);
    }

    if (String(minutes) !== ui.minutesInput.value && ui.minutesInput.value !== "") {
        ui.minutesInput.value = String(minutes);
    }

    ui.timePreview.textContent = formatTime(totalSeconds);

    if (!state.activeMode) {
        ui.validationMessage.textContent = "Escolha primeiro o tipo do timer.";
        ui.startTimerBtn.disabled = true;
        return;
    }

    if (totalSeconds <= 0) {
        ui.validationMessage.textContent = "Digite pelo menos 1 minuto para começar.";
        ui.startTimerBtn.disabled = true;
        return;
    }

    ui.validationMessage.textContent = "";
    ui.startTimerBtn.disabled = false;
}

function selectMode(modeId) {
    state.activeMode = modeId;
    const mode = getMode();

    ui.modeButtons.forEach((button) => {
        button.classList.toggle("is-selected", button.dataset.mode === modeId);
    });

    ui.setupCard.classList.remove("hidden");
    ui.setupEyebrow.textContent = mode.eyebrow;
    ui.setupTitle.textContent = mode.title;
    ui.setupSubtitle.textContent = mode.subtitle;
    ui.setupSubtitle.classList.toggle("hidden", !mode.subtitle);
    updateSetupPreview();
}

function resetInputs() {
    ui.hoursInput.value = "";
    ui.minutesInput.value = "15";
    updateSetupPreview();
}

function buildMilestones() {
    ui.journeyMilestones.style.gridTemplateColumns = `repeat(${MILESTONE_COUNT}, minmax(0, 1fr))`;
    ui.journeyMilestones.innerHTML = Array.from({ length: MILESTONE_COUNT }, (_, index) => `<span data-step="${index}"></span>`).join("");
}

function getMilestoneColor(index, total) {
    const ratio = total <= 1 ? 1 : index / (total - 1);
    const hue = 4 + ratio * 122;
    return `hsl(${hue} 88% 58%)`;
}

function updateMilestones(progressRatio) {
    const milestones = [...ui.journeyMilestones.children];
    const lastIndex = Math.max(milestones.length - 1, 1);

    milestones.forEach((item, index) => {
        const threshold = index / lastIndex;
        const isActive = progressRatio >= threshold;
        item.style.setProperty("--milestone-color", getMilestoneColor(index, milestones.length));
        item.classList.toggle("is-active", isActive);
    });
}

function getJourneyMetrics() {
    const track = ui.journeyBasePath.parentElement;
    const trackRect = track.getBoundingClientRect();
    const pathRect = ui.journeyBasePath.getBoundingClientRect();
    const markerRect = ui.studentMarker.getBoundingClientRect();

    if (!trackRect.width || !pathRect.width || !markerRect.width) {
        return null;
    }

    const pathLeft = pathRect.left - trackRect.left;
    const pathWidth = pathRect.width;
    const markerStart = Math.max(0, pathLeft - markerRect.width * 0.12);
    const markerEnd = Math.max(markerStart, pathLeft + pathWidth - markerRect.width * 0.86);

    return {
        pathLeft,
        pathWidth,
        markerStart,
        markerEnd
    };
}

function updateStudentPosition(progressRatio) {
    const metrics = getJourneyMetrics();
    if (!metrics) {
        return;
    }

    const left = metrics.markerStart + (metrics.markerEnd - metrics.markerStart) * progressRatio;
    ui.studentMarker.style.left = `${left}px`;
}

function getJourneyMessage(progressRatio) {
    const mode = getMode();
    if (progressRatio >= 1) {
        return mode.progressMessages[4];
    }

    if (progressRatio >= 0.75) {
        return mode.progressMessages[3];
    }

    if (progressRatio >= 0.5) {
        return mode.progressMessages[2];
    }

    if (progressRatio >= 0.2) {
        return mode.progressMessages[1];
    }

    return mode.progressMessages[0];
}

function updateTimerStatus() {
    const mode = getMode();
    const progressRatio = getProgressRatio();
    const elapsed = state.totalSeconds - state.remainingSeconds;
    const metrics = getJourneyMetrics();

    renderDestination(mode);
    ui.countdownValue.textContent = formatTime(state.remainingSeconds);
    if (ui.totalTimeValue) {
        ui.totalTimeValue.textContent = formatTime(state.totalSeconds);
    }
    ui.elapsedTimeValue.textContent = formatTime(elapsed);
    if (ui.progressPercent) {
        ui.progressPercent.textContent = `${Math.round(progressRatio * 100)}%`;
    }
    ui.journeyMessage.textContent = getJourneyMessage(progressRatio);
    ui.timerStatusText.textContent = state.isPaused ? "Timer pausado" : getJourneyMessage(progressRatio);

    if (metrics) {
        ui.journeyProgress.style.left = `${metrics.pathLeft}px`;
        ui.journeyProgress.style.width = `${metrics.pathWidth * progressRatio}px`;
    }

    updateMilestones(progressRatio);
    updateStudentPosition(progressRatio);
}

function renderTimerScene() {
    const mode = getMode();
    ui.timerModeEyebrow.textContent = mode.eyebrow;
    ui.timerModeTitle.textContent = mode.title;
    ui.timerStatusText.textContent = mode.progressTitle;
    ui.journeyCard.classList.remove("is-lanche", "is-casa");
    ui.journeyCard.classList.add(mode.accentClass);
    updateTimerStatus();
}

function renderFinishVisuals(mode) {
    const assets = Array.isArray(mode.finishAssets) ? mode.finishAssets : [];

    if (!assets.length) {
        ui.finishVisuals.innerHTML = "";
        ui.finishVisuals.classList.add("hidden");
        ui.finishEmoji.classList.remove("hidden");
        ui.finishEmoji.textContent = mode.finishEmoji;
        return;
    }

    ui.finishVisuals.innerHTML = assets
        .map((asset) => `<img src="${asset.src}" alt="${asset.label}" title="${asset.label}">`)
        .join("");
    ui.finishVisuals.classList.remove("hidden");
    ui.finishEmoji.classList.add("hidden");
}

function stopTimer() {
    stopCountdown();
    stopDestinationCycle();
}

function startCountdown() {
    stopCountdown();
    state.isPaused = false;
    state.tickPhase = 0;
    ensureAudioReady();
    ui.pauseBtn.disabled = false;
    ui.resumeBtn.disabled = true;
    playTickTock();

    state.timerId = window.setInterval(() => {
        if (state.isPaused) {
            return;
        }

        state.remainingSeconds -= 1;
        if (state.remainingSeconds <= 0) {
            state.remainingSeconds = 0;
            updateTimerStatus();
            finishTimer();
            return;
        }

        playTickTock();
        updateTimerStatus();
    }, 1000);
}

function startTimer() {
    state.totalSeconds = getInputSeconds();
    state.remainingSeconds = state.totalSeconds;
    state.destinationAssetIndex = 0;

    if (state.totalSeconds <= 0 || !state.activeMode) {
        updateSetupPreview();
        return;
    }

    switchScreen("timer");
    buildMilestones();
    window.requestAnimationFrame(() => {
        renderTimerScene();
    });
    startDestinationCycle();
    startCountdown();
}

function pauseTimer() {
    state.isPaused = true;
    ui.pauseBtn.disabled = true;
    ui.resumeBtn.disabled = false;
    ui.timerStatusText.textContent = "Timer pausado";
}

function resumeTimer() {
    state.isPaused = false;
    ui.pauseBtn.disabled = false;
    ui.resumeBtn.disabled = true;
    ui.timerStatusText.textContent = getJourneyMessage(getProgressRatio());
}

function resetCurrentTimer() {
    state.remainingSeconds = state.totalSeconds;
    state.isPaused = false;
    state.tickPhase = 0;
    state.destinationAssetIndex = 0;
    ui.pauseBtn.disabled = false;
    ui.resumeBtn.disabled = true;
    buildMilestones();
    updateTimerStatus();
    startDestinationCycle();
}

function backToHome() {
    stopTimer();
    state.totalSeconds = 0;
    state.remainingSeconds = 0;
    state.isPaused = false;
    state.activeMode = null;
    ui.modeButtons.forEach((button) => button.classList.remove("is-selected"));
    ui.setupCard.classList.add("hidden");
    resetInputs();
    switchScreen("home");
}

function finishTimer() {
    stopTimer();
    const mode = getMode();
    renderFinishVisuals(mode);
    playFinishSound();
    ui.finishTitle.textContent = mode.finishTitle;
    ui.finishText.textContent = mode.finishText;
    ui.finishBadge.textContent = mode.finishBadge;
    switchScreen("finish");
}

function repeatSameMode() {
    switchScreen("home");
    ui.setupCard.classList.remove("hidden");
    resetInputs();
    selectMode(state.activeMode);
}

ui.modeButtons.forEach((button) => {
    button.addEventListener("click", () => selectMode(button.dataset.mode));
});

ui.hoursInput.addEventListener("input", updateSetupPreview);
ui.minutesInput.addEventListener("input", updateSetupPreview);
ui.startTimerBtn.addEventListener("click", startTimer);
ui.changeModeBtn.addEventListener("click", () => {
    state.activeMode = null;
    ui.setupCard.classList.add("hidden");
    ui.modeButtons.forEach((button) => button.classList.remove("is-selected"));
    updateSetupPreview();
});

ui.pauseBtn.addEventListener("click", pauseTimer);
ui.resumeBtn.addEventListener("click", resumeTimer);
ui.resetBtn.addEventListener("click", resetCurrentTimer);
ui.newTimerBtn.addEventListener("click", backToHome);
ui.backHomeBtn.addEventListener("click", backToHome);
ui.finishNewTimerBtn.addEventListener("click", backToHome);
ui.finishSameModeBtn.addEventListener("click", repeatSameMode);
ui.soundToggleBtn.addEventListener("click", toggleSound);
ui.fullscreenBtn.addEventListener("click", enterFullscreen);
ui.exitFullscreenBtn.addEventListener("click", exitFullscreen);

ui.openInfoBtn.addEventListener("click", openInfoModal);
ui.openInfoTimerBtn?.addEventListener("click", openInfoModal);
ui.closeInfoBtn.addEventListener("click", closeInfoModal);
ui.infoModal.addEventListener("click", (event) => {
    if (event.target === ui.infoModal || event.target.classList.contains("modal__backdrop")) {
        closeInfoModal();
    }
});

window.addEventListener("resize", () => {
    if (!ui.timerScreen.classList.contains("hidden")) {
        updateTimerStatus();
    }
});

document.addEventListener("fullscreenchange", () => {
    syncFullscreenState();
    if (!ui.timerScreen.classList.contains("hidden")) {
        updateTimerStatus();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !ui.infoModal.classList.contains("hidden")) {
        closeInfoModal();
        return;
    }

    if (event.key === "Enter" && !ui.homeScreen.classList.contains("hidden") && !ui.startTimerBtn.disabled) {
        startTimer();
    }
});

renderAboutModal();
updateSoundButton();
resetInputs();
buildMilestones();
syncFullscreenState();
