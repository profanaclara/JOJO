const modes = window.JOJO_TIMER_DATA.modes;
const MILESTONE_COUNT = 11;

const state = {
    mode: null,
    total: 0,
    remaining: 0,
    elapsed: 0,
    running: false,
    deadline: 0,
    intervalId: null,
    soundEnabled: true,
    audioContext: null,
    sandSource: null,
    sandGain: null,
    destination: ""
};

const ui = {
    body: document.body,
    home: document.getElementById("homeScreen"),
    timer: document.getElementById("timerScreen"),
    finish: document.getElementById("finishScreen"),
    setup: document.getElementById("setupPanel"),
    setupTitle: document.getElementById("setupTitle"),
    hours: document.getElementById("hoursInput"),
    minutes: document.getElementById("minutesInput"),
    preview: document.getElementById("timePreview"),
    validation: document.getElementById("validationMessage"),
    countdown: document.getElementById("countdownValue"),
    elapsed: document.getElementById("elapsedValue"),
    journeyCountdown: document.getElementById("journeyCountdownValue"),
    journeyElapsed: document.getElementById("journeyElapsedValue"),
    runningMode: document.getElementById("runningMode"),
    journeyLayout: document.getElementById("journeyLayout"),
    hourglassLayout: document.getElementById("hourglassLayout"),
    journeyCard: document.getElementById("journeyCard"),
    journeyScene: document.getElementById("journeyScene"),
    hourglassScene: document.getElementById("hourglassScene"),
    hourglassCanvas: document.getElementById("hourglassCanvas"),
    journeyMilestones: document.getElementById("journeyMilestones"),
    journeyBasePath: document.getElementById("journeyBasePath"),
    journeyProgress: document.getElementById("journeyProgress"),
    student: document.getElementById("studentMarker"),
    destination: document.getElementById("destinationMarker"),
    pause: document.getElementById("pauseBtn"),
    resume: document.getElementById("resumeBtn"),
    finishTitle: document.getElementById("finishTitle"),
    finishImage: document.getElementById("finishImage"),
    sound: document.getElementById("soundToggleBtn"),
    fullscreen: document.getElementById("fullscreenBtn")
};

const hourglassRenderer = ui.hourglassCanvas ? new window.FreeHourglassRenderer(ui.hourglassCanvas) : null;

function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
}

function clampNumber(value, min, max) {
    const number = Number.parseInt(value, 10);
    return Math.min(max, Math.max(min, Number.isFinite(number) ? number : 0));
}

function showScreen(name) {
    ui.home.classList.toggle("hidden", name !== "home");
    ui.timer.classList.toggle("hidden", name !== "timer");
    ui.finish.classList.toggle("hidden", name !== "finish");
    ui.body.dataset.screen = name;
    window.scrollTo({ top: 0, behavior: "instant" });
}

function updatePreview() {
    const hours = clampNumber(ui.hours.value, 0, 8);
    const minutes = clampNumber(ui.minutes.value, 0, 59);
    ui.hours.value = String(hours);
    ui.minutes.value = String(minutes);
    ui.preview.textContent = formatTime((hours * 3600) + (minutes * 60));
    ui.validation.textContent = "";
}

function updateUrlMode(mode) {
    const url = new URL(window.location.href);
    if (mode) {
        url.searchParams.set("modo", mode);
    } else {
        url.searchParams.delete("modo");
    }
    window.history.replaceState({}, "", url);
}

function selectMode(mode) {
    if (!modes[mode]) return;
    state.mode = mode;
    ui.setupTitle.textContent = modes[mode].title;
    ui.setup.classList.remove("hidden");
    document.querySelectorAll("[data-mode]").forEach((button) => {
        button.classList.toggle("is-selected", button.dataset.mode === mode);
        button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    });
    updateUrlMode(mode);
    updatePreview();
    ui.setup.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearTimer() {
    window.clearInterval(state.intervalId);
    state.intervalId = null;
    state.running = false;
    stopSandSound();
    hourglassRenderer?.pause();
}

function ensureAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!state.audioContext) state.audioContext = new AudioContextClass();
    if (state.audioContext.state === "suspended") state.audioContext.resume();
    return state.audioContext;
}

function startSandSound() {
    if (!state.soundEnabled || state.mode !== "livre" || state.sandSource) return;
    const context = ensureAudio();
    if (!context) return;
    const length = Math.floor(context.sampleRate * 2);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < length; index += 1) {
        previous = (previous * 0.7) + ((Math.random() * 2 - 1) * 0.3);
        data[index] = previous;
    }
    const source = context.createBufferSource();
    const highPass = context.createBiquadFilter();
    const lowPass = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    highPass.type = "highpass";
    highPass.frequency.value = 900;
    lowPass.type = "lowpass";
    lowPass.frequency.value = 4800;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.055, context.currentTime + 0.18);
    source.connect(highPass).connect(lowPass).connect(gain).connect(context.destination);
    source.start();
    state.sandSource = source;
    state.sandGain = gain;
}

function stopSandSound() {
    if (!state.sandSource) return;
    const source = state.sandSource;
    const gain = state.sandGain;
    state.sandSource = null;
    state.sandGain = null;
    if (gain && state.audioContext) {
        gain.gain.cancelScheduledValues(state.audioContext.currentTime);
        gain.gain.setTargetAtTime(0.0001, state.audioContext.currentTime, 0.03);
    }
    window.setTimeout(() => {
        try { source.stop(); } catch (_) { /* already stopped */ }
    }, 120);
}

function playFinishTone() {
    if (!state.soundEnabled || state.mode === "livre") return;
    const context = ensureAudio();
    if (!context) return;
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + (index * 0.13);
        oscillator.frequency.value = frequency;
        oscillator.type = "sine";
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.09, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.24);
    });
}

function buildMilestones() {
    ui.journeyMilestones.style.gridTemplateColumns = `repeat(${MILESTONE_COUNT}, minmax(0, 1fr))`;
    ui.journeyMilestones.innerHTML = Array.from({ length: MILESTONE_COUNT }, (_, index) => `<span data-step="${index}"></span>`).join("");
}

function updateMilestones(progress) {
    const milestones = [...ui.journeyMilestones.children];
    const lastIndex = Math.max(milestones.length - 1, 1);

    milestones.forEach((milestone, index) => {
        const ratio = index / lastIndex;
        const hue = 4 + (ratio * 122);
        milestone.style.setProperty("--milestone-color", `hsl(${hue} 88% 58%)`);
        milestone.classList.toggle("is-active", progress >= ratio);
    });
}

function getJourneyMetrics() {
    const track = ui.journeyBasePath.parentElement;
    const trackRect = track.getBoundingClientRect();
    const pathRect = ui.journeyBasePath.getBoundingClientRect();
    const markerRect = ui.student.getBoundingClientRect();

    if (!trackRect.width || !pathRect.width || !markerRect.width) return null;

    const pathLeft = pathRect.left - trackRect.left;
    const markerStart = Math.max(0, pathLeft - (markerRect.width * 0.12));
    const markerEnd = Math.max(markerStart, pathLeft + pathRect.width - (markerRect.width * 0.86));
    return { pathLeft, pathWidth: pathRect.width, markerStart, markerEnd };
}

function renderProgress() {
    const progress = state.total ? state.elapsed / state.total : 0;
    ui.countdown.textContent = formatTime(state.remaining);
    ui.elapsed.textContent = formatTime(state.elapsed);
    ui.journeyCountdown.textContent = formatTime(state.remaining);
    ui.journeyElapsed.textContent = formatTime(state.elapsed);

    if (state.mode !== "livre") {
        const metrics = getJourneyMetrics();
        if (metrics) {
            ui.journeyProgress.style.left = `${metrics.pathLeft}px`;
            ui.journeyProgress.style.width = `${metrics.pathWidth * progress}px`;
            ui.student.style.left = `${metrics.markerStart + ((metrics.markerEnd - metrics.markerStart) * progress)}px`;
        }
        updateMilestones(progress);
    }
}

function tick() {
    if (!state.running) return;
    state.remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    state.elapsed = state.total - state.remaining;
    renderProgress();
    if (state.remaining === 0) finishTimer();
}

function runTimer() {
    state.running = true;
    state.deadline = Date.now() + (state.remaining * 1000);
    window.clearInterval(state.intervalId);
    state.intervalId = window.setInterval(tick, 200);
    ui.pause.disabled = false;
    ui.resume.disabled = true;
    if (state.mode === "livre") {
        hourglassRenderer?.start(state.remaining);
        startSandSound();
    }
    tick();
}

function startTimer() {
    if (!state.mode) return;
    const total = (clampNumber(ui.hours.value, 0, 8) * 3600) + (clampNumber(ui.minutes.value, 0, 59) * 60);
    if (total <= 0) {
        ui.validation.textContent = "Defina um tempo maior que zero.";
        ui.minutes.focus();
        return;
    }
    ensureAudio();
    clearTimer();
    state.total = total;
    state.remaining = total;
    state.elapsed = 0;
    const mode = modes[state.mode];
    ui.runningMode.textContent = mode.title;
    const hourglass = state.mode === "livre";
    ui.journeyLayout.classList.toggle("hidden", hourglass);
    ui.hourglassLayout.classList.toggle("hidden", !hourglass);
    ui.body.dataset.runningMode = hourglass ? "hourglass" : "journey";
    if (!hourglass) {
        ui.journeyCard.classList.remove("is-lanche", "is-casa");
        ui.journeyCard.classList.add(`is-${state.mode}`);
        state.destination = mode.destinationAssets[Math.floor(Math.random() * mode.destinationAssets.length)];
        ui.destination.src = `./assets/${state.destination}`;
        buildMilestones();
    } else {
        hourglassRenderer?.reset();
    }
    showScreen("timer");
    renderProgress();
    runTimer();
}

function pauseTimer() {
    if (!state.running) return;
    state.remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    state.elapsed = state.total - state.remaining;
    clearTimer();
    ui.pause.disabled = true;
    ui.resume.disabled = false;
    renderProgress();
}

function resumeTimer() {
    if (state.remaining > 0) runTimer();
}

function resetTimer() {
    clearTimer();
    state.remaining = state.total;
    state.elapsed = 0;
    hourglassRenderer?.reset();
    renderProgress();
    runTimer();
}

function finishTimer() {
    clearTimer();
    state.remaining = 0;
    state.elapsed = state.total;
    renderProgress();
    playFinishTone();
    const mode = modes[state.mode];
    ui.finishTitle.textContent = mode.finishTitle;
    ui.finishImage.classList.toggle("hidden", !mode.finishAsset);
    ui.finishImage.src = mode.finishAsset ? `./assets/${mode.finishAsset}` : "";
    showScreen("finish");
}

async function leaveFullscreen() {
    if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch (_) { /* browser refused */ }
    }
}

function returnToMenu() {
    clearTimer();
    hourglassRenderer?.reset();
    leaveFullscreen();
    state.total = 0;
    state.remaining = 0;
    state.elapsed = 0;
    state.mode = null;
    delete ui.body.dataset.runningMode;
    ui.setup.classList.add("hidden");
    document.querySelectorAll("[data-mode]").forEach((button) => button.classList.remove("is-selected"));
    updateUrlMode(null);
    showScreen("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function restartSameMode() {
    showScreen("home");
    selectMode(state.mode);
}

function updateSoundButton() {
    ui.sound.classList.toggle("is-muted", !state.soundEnabled);
    ui.sound.setAttribute("aria-pressed", String(state.soundEnabled));
    ui.sound.setAttribute("aria-label", state.soundEnabled ? "Desligar som" : "Ligar som");
}

document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => selectMode(button.dataset.mode)));
document.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => {
    ui.hours.value = "0";
    ui.minutes.value = button.dataset.preset;
    updatePreview();
}));
ui.hours.addEventListener("input", updatePreview);
ui.minutes.addEventListener("input", updatePreview);
document.getElementById("changeModeBtn").addEventListener("click", returnToMenu);
document.getElementById("startTimerBtn").addEventListener("click", startTimer);
document.getElementById("backMenuBtn").addEventListener("click", returnToMenu);
document.getElementById("newTimerBtn").addEventListener("click", returnToMenu);
document.getElementById("pauseBtn").addEventListener("click", pauseTimer);
document.getElementById("resumeBtn").addEventListener("click", resumeTimer);
document.getElementById("resetBtn").addEventListener("click", resetTimer);
document.getElementById("sameModeBtn").addEventListener("click", restartSameMode);
document.getElementById("finishMenuBtn").addEventListener("click", returnToMenu);
ui.sound.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
        ensureAudio();
        if (state.running) startSandSound();
    } else {
        stopSandSound();
    }
    updateSoundButton();
});
ui.fullscreen.addEventListener("click", async () => {
    if (document.fullscreenElement) {
        await leaveFullscreen();
    } else {
        try { await document.documentElement.requestFullscreen(); } catch (_) { /* unsupported */ }
    }
});
document.addEventListener("fullscreenchange", () => {
    ui.body.classList.toggle("is-fullscreen", Boolean(document.fullscreenElement));
    hourglassRenderer?.redraw();
});
document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.running) pauseTimer();
});
document.addEventListener("keydown", (event) => {
    if (event.code === "Space" && !ui.timer.classList.contains("hidden")) {
        event.preventDefault();
        state.running ? pauseTimer() : resumeTimer();
    }
});
updateSoundButton();
updatePreview();
showScreen("home");
const requestedMode = new URLSearchParams(window.location.search).get("modo");
if (modes[requestedMode]) selectMode(requestedMode);
