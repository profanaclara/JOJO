const { modes, about } = window.JOJO_TIMER_DATA;
const MILESTONE_COUNT = 11;

const state = {
    activeMode: null,
    totalSeconds: 0,
    remainingSeconds: 0,
    elapsedSeconds: 0,
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
    durationGuidance: document.getElementById("durationGuidance"),
    durationGuidanceLabel: document.getElementById("durationGuidanceLabel"),
    durationGuidanceValue: document.getElementById("durationGuidanceValue"),
    durationGuidanceHint: document.getElementById("durationGuidanceHint"),
    inputGrid: document.querySelector(".input-grid"),
    hoursInput: document.getElementById("hoursInput"),
    minutesInput: document.getElementById("minutesInput"),
    presetRow: document.getElementById("presetRow"),
    presetButtons: [...document.querySelectorAll("[data-preset-minutes]")],
    timePreviewLabel: document.getElementById("timePreviewLabel"),
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
    journeyScene: document.querySelector(".journey-scene"),
    freeTimerPanel: document.getElementById("freeTimerPanel"),
    hourglassVisual: document.querySelector(".hourglass-visual"),
    hourglassCanvas: document.getElementById("hourglassCanvas"),
    journeyMessage: document.getElementById("journeyMessage"),
    totalTimeValue: document.getElementById("totalTimeValue"),
    elapsedTimeValue: document.getElementById("elapsedTimeValue"),
    pauseBtn: document.getElementById("pauseBtn"),
    resumeBtn: document.getElementById("resumeBtn"),
    resetBtn: document.getElementById("resetBtn"),
    newTimerBtn: document.getElementById("newTimerBtn"),
    backHomeBtn: document.getElementById("backHomeBtn"),
    finishEmoji: document.getElementById("finishEmoji"),
    finishCelebration: document.getElementById("finishCelebration"),
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

const hourglassState = {
    active: false,
    cycle: -1,
    paused: false
};

// Continuous, filtered noise gives the hourglass a soft sand-falling sound
// without adding a large audio asset to the app package.
const sandSoundState = {
    source: null,
    gain: null
};

class FreeHourglassRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas?.getContext("2d");
        this.tempCanvas = document.createElement("canvas");
        this.tempCtx = this.tempCanvas.getContext("2d", { willReadFrequently: true });
        this.width = 200;
        this.height = 400;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.tempCanvas.width = this.width;
        this.tempCanvas.height = this.height;
        this.cx = this.width / 2;
        this.gateRow = this.height / 2;
        this.grid = new Uint32Array(this.width * this.height);
        this.imgData = this.tempCtx.createImageData(this.width, this.height);
        this.data32 = new Uint32Array(this.imgData.data.buffer);
        this.totalGrainsInit = 0;
        this.currentGrainsTop = 0;
        this.totalSeconds = 0;
        this.remainingSeconds = 0;
        this.lastTime = 0;
        this.grainsPerSecond = 0;
        this.dropAccumulator = 0;
        this.isRunning = false;
        this.direction = true;
        this.glassPath = new Path2D();
        this.buildPaths();
        this.initLiquid();
        this.frameId = 0;
        this.animate = this.animate.bind(this);
        this.frameId = window.requestAnimationFrame(this.animate);
    }

    color(r, g, b) {
        return (255 << 24) | (b << 16) | (g << 8) | r;
    }

    lerpColor(c1, c2, t) {
        return this.color(
            Math.round(c1.r + (c2.r - c1.r) * t),
            Math.round(c1.g + (c2.g - c1.g) * t),
            Math.round(c1.b + (c2.b - c1.b) * t)
        );
    }

    get colorStops() {
        return [
            { r: 255, g: 107, b: 158 },
            { r: 255, g: 175, b: 115 },
            { r: 255, g: 238, b: 115 },
            { r: 133, g: 238, b: 158 },
            { r: 115, g: 200, b: 255 },
            { r: 186, g: 133, b: 255 }
        ];
    }

    getGradientColor(t) {
        const clamped = Math.max(0, Math.min(1, t));
        const scaled = clamped * (this.colorStops.length - 1);
        const idx = Math.floor(scaled);

        if (idx >= this.colorStops.length - 1) {
            const stop = this.colorStops[idx];
            return this.color(stop.r, stop.g, stop.b);
        }

        return this.lerpColor(this.colorStops[idx], this.colorStops[idx + 1], scaled - idx);
    }

    buildPaths() {
        this.glassPath.moveTo(30, 80);
        this.glassPath.arc(100, 80, 70, Math.PI, 0);
        this.glassPath.bezierCurveTo(170, 140, 110, 180, 110, 200);
        this.glassPath.bezierCurveTo(110, 220, 170, 260, 170, 320);
        this.glassPath.arc(100, 320, 70, 0, Math.PI);
        this.glassPath.bezierCurveTo(30, 260, 90, 220, 90, 200);
        this.glassPath.bezierCurveTo(90, 180, 30, 140, 30, 80);
        this.glassPath.closePath();
    }

    buildGlassLimits() {
        this.grid.fill(0);

        for (let y = 0; y < this.height; y += 1) {
            for (let x = 0; x < this.width; x += 1) {
                if (!this.ctx.isPointInPath(this.glassPath, x, y)) {
                    this.grid[y * this.width + x] = 1;
                }
            }
        }

        for (let x = 0; x < this.width; x += 1) {
            if (this.grid[(this.gateRow - 1) * this.width + x] === 0) {
                this.grid[(this.gateRow - 1) * this.width + x] = 1;
            }
            if (this.grid[this.gateRow * this.width + x] === 0) {
                this.grid[this.gateRow * this.width + x] = 1;
            }
        }
    }

    initLiquid() {
        this.buildGlassLimits();
        this.totalGrainsInit = 0;

        for (let y = 20; y < this.gateRow - 2; y += 1) {
            const colorHex = this.getGradientColor((y - 20) / 160);
            for (let x = 0; x < this.width; x += 1) {
                if (this.grid[y * this.width + x] === 0) {
                    this.grid[y * this.width + x] = colorHex;
                    this.totalGrainsInit += 1;
                }
            }
        }

        this.currentGrainsTop = this.totalGrainsInit;
    }

    pluckGrainFromTop() {
        for (let r = 1; r < 120; r += 1) {
            for (let angle = Math.PI; angle <= Math.PI * 2; angle += 0.1) {
                const tx = Math.round(this.cx + Math.cos(angle) * r);
                const ty = Math.round((this.gateRow - 2) + Math.sin(angle) * r);
                if (ty >= 0 && ty < this.gateRow && tx >= 0 && tx < this.width) {
                    if (this.grid[ty * this.width + tx] > 1) {
                        const c = this.grid[ty * this.width + tx];
                        this.grid[ty * this.width + tx] = 0;
                        return c;
                    }
                }
            }
        }

        return 0;
    }

    dropGrainAtBottom(c) {
        if (c <= 1) {
            return;
        }

        const sx = this.cx + Math.floor(Math.random() * 9) - 4;
        const sy = this.gateRow + 2 + Math.floor(Math.random() * 20);

        if (this.grid[sy * this.width + sx] === 0) {
            this.grid[sy * this.width + sx] = c;
            return;
        }

        for (let dy = sy; dy < this.height; dy += 1) {
            if (this.grid[dy * this.width + this.cx] === 0) {
                this.grid[dy * this.width + this.cx] = c;
                break;
            }
        }
    }

    updatePhysics() {
        this.direction = !this.direction;

        for (let y = this.height - 2; y >= 0; y -= 1) {
            const startX = this.direction ? 1 : this.width - 2;
            const endX = this.direction ? this.width - 1 : 0;
            const stepX = this.direction ? 1 : -1;

            for (let x = startX; x !== endX; x += stepX) {
                const i = y * this.width + x;
                const grain = this.grid[i];

                if (grain <= 1) {
                    continue;
                }

                const below = i + this.width;
                if (this.grid[below] === 0) {
                    this.grid[below] = grain;
                    this.grid[i] = 0;
                    continue;
                }

                const dir = Math.random() < 0.5 ? 1 : -1;
                if (this.grid[below + dir] === 0) {
                    this.grid[below + dir] = grain;
                    this.grid[i] = 0;
                } else if (this.grid[below - dir] === 0) {
                    this.grid[below - dir] = grain;
                    this.grid[i] = 0;
                } else if (this.grid[i + dir] === 0) {
                    this.grid[i + dir] = grain;
                    this.grid[i] = 0;
                } else if (this.grid[i - dir] === 0) {
                    this.grid[i - dir] = grain;
                    this.grid[i] = 0;
                }
            }
        }
    }

    drawVisuals() {
        for (let i = 0; i < this.grid.length; i += 1) {
            this.data32[i] = this.grid[i] > 1 ? this.grid[i] : 0;
        }

        this.tempCtx.putImageData(this.imgData, 0, 0);
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.filter = "blur(0.8px)";
        this.ctx.drawImage(this.tempCanvas, 0, 0);
        this.ctx.filter = "none";
        this.ctx.lineJoin = "round";
        this.ctx.lineCap = "round";

        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        this.ctx.lineWidth = 2;
        this.ctx.stroke(this.glassPath);

        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(100, 80, 50, Math.PI * 0.85, Math.PI * 1.25);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(100, 320, 50, Math.PI * 0.65, Math.PI * 0.95);
        this.ctx.stroke();
    }

    forceEmptyTop() {
        for (let y = 0; y < this.gateRow; y += 1) {
            for (let x = 0; x < this.width; x += 1) {
                if (this.grid[y * this.width + x] > 1) {
                    const c = this.grid[y * this.width + x];
                    this.grid[y * this.width + x] = 0;
                    this.dropGrainAtBottom(c);
                }
            }
        }
        this.currentGrainsTop = 0;
    }

    animate(timestamp) {
        let dt = (timestamp - this.lastTime) / 1000;
        if (dt > 0.1) {
            dt = 0.016;
        }
        this.lastTime = timestamp;

        if (this.isRunning) {
            this.remainingSeconds -= dt;

            if (this.remainingSeconds <= 0) {
                this.remainingSeconds = 0;
                this.forceEmptyTop();
                this.isRunning = false;
            } else {
                this.dropAccumulator += this.grainsPerSecond * dt;
                const dropsThisFrame = Math.floor(this.dropAccumulator);

                if (dropsThisFrame > 0 && this.currentGrainsTop > 0) {
                    for (let i = 0; i < dropsThisFrame; i += 1) {
                        const c = this.pluckGrainFromTop();
                        if (c > 1) {
                            this.dropGrainAtBottom(c);
                            this.currentGrainsTop -= 1;
                        }
                    }
                    this.dropAccumulator -= dropsThisFrame;
                }
            }
        }

        this.updatePhysics();
        this.updatePhysics();
        this.drawVisuals();
        this.frameId = window.requestAnimationFrame(this.animate);
    }

    start(seconds = 60) {
        if (!this.ctx) {
            return;
        }

        if (this.remainingSeconds === 0 || this.totalSeconds !== seconds) {
            this.totalSeconds = seconds;
            this.remainingSeconds = seconds;
            this.initLiquid();
            this.grainsPerSecond = this.totalGrainsInit / this.totalSeconds;
            this.dropAccumulator = 0;
        }

        this.isRunning = true;
        this.lastTime = performance.now();
    }

    pause() {
        this.isRunning = false;
    }

    reset() {
        this.isRunning = false;
        this.remainingSeconds = 0;
        this.totalSeconds = 0;
        this.dropAccumulator = 0;
        this.initLiquid();
    }

    redraw() {
        if (!this.ctx) {
            return;
        }

        this.drawVisuals();
    }
}

const hourglassRenderer = ui.hourglassCanvas ? new FreeHourglassRenderer(ui.hourglassCanvas) : null;

function getMode() {
    return modes[state.activeMode];
}

function isHourglassMode() {
    return state.activeMode === "livre";
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

function stopHourglassSandSound() {
    if (!sandSoundState.source) {
        return;
    }

    const context = state.audioContext;
    if (context && sandSoundState.gain) {
        sandSoundState.gain.gain.cancelScheduledValues(context.currentTime);
        sandSoundState.gain.gain.setTargetAtTime(0.0001, context.currentTime, 0.03);
    }

    const source = sandSoundState.source;
    sandSoundState.source = null;
    sandSoundState.gain = null;
    window.setTimeout(() => source.stop(), 110);
}

function startHourglassSandSound() {
    if (!state.soundEnabled || !isHourglassMode() || state.isPaused || sandSoundState.source) {
        return;
    }

    const context = ensureAudioReady();
    if (!context) {
        return;
    }

    const noiseLength = Math.floor(context.sampleRate * 2);
    const buffer = context.createBuffer(1, noiseLength, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let previousSample = 0;

    for (let index = 0; index < noiseLength; index += 1) {
        // Slightly correlated noise is less harsh than pure white noise.
        previousSample = previousSample * 0.72 + (Math.random() * 2 - 1) * 0.28;
        samples[index] = previousSample;
    }

    const source = context.createBufferSource();
    const highPass = context.createBiquadFilter();
    const lowPass = context.createBiquadFilter();
    const gain = context.createGain();
    const shimmer = context.createOscillator();
    const shimmerGain = context.createGain();

    source.buffer = buffer;
    source.loop = true;
    highPass.type = "highpass";
    highPass.frequency.value = 850;
    lowPass.type = "lowpass";
    lowPass.frequency.value = 4700;
    gain.gain.value = 0.0001;
    shimmer.type = "sine";
    shimmer.frequency.value = 1.3;
    shimmerGain.gain.value = 0.005;

    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(gain);
    gain.connect(context.destination);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(gain.gain);

    gain.gain.linearRampToValueAtTime(0.036, context.currentTime + 0.16);
    source.start();
    shimmer.start();
    sandSoundState.source = source;
    sandSoundState.gain = gain;
    source.addEventListener("ended", () => {
        if (sandSoundState.source === source) {
            sandSoundState.source = null;
            sandSoundState.gain = null;
        }
        shimmer.stop();
    }, { once: true });
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
    const label = state.soundEnabled ? "Som ligado" : "Som desligado";
    const soundClass = state.soundEnabled ? "sound-sticker" : "sound-sticker sound-sticker--off";
    ui.soundToggleBtn.innerHTML = `<img class="${soundClass}" src="../../assets/jojo-som.png" alt="" aria-hidden="true"><span class="sr-only">${label}</span>`;
    ui.soundToggleBtn.setAttribute("aria-label", label);
    ui.soundToggleBtn.setAttribute("aria-pressed", String(state.soundEnabled));
}

function syncFullscreenState() {
    const isFullscreen = Boolean(document.fullscreenElement) || ui.body.classList.contains("is-fullscreen-native");
    ui.body.classList.toggle("is-fullscreen", isFullscreen);
    ui.fullscreenBtn.classList.toggle("hidden", isFullscreen);
    ui.exitFullscreenBtn.classList.toggle("hidden", !isFullscreen);

    // Android may resize the WebView after the native fullscreen callback.
    window.requestAnimationFrame(() => hourglassRenderer?.redraw());
}

function enterNativeFullscreenLandscape() {
    if (window.JojoAndroid?.enterFullscreenLandscape) {
        ui.body.classList.add("is-fullscreen-native");
        window.JojoAndroid.enterFullscreenLandscape();
        syncFullscreenState();
    }
}

function exitNativeFullscreen() {
    if (window.JojoAndroid?.exitFullscreen) {
        ui.body.classList.remove("is-fullscreen-native");
        window.JojoAndroid.exitFullscreen();
        syncFullscreenState();
    }
}

async function enterFullscreen() {
    enterNativeFullscreenLandscape();
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
    exitNativeFullscreen();
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
        startHourglassSandSound();
    } else {
        stopHourglassSandSound();
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

function setInputDuration(totalMinutes) {
    const safeMinutes = Math.max(0, totalMinutes);
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    ui.hoursInput.value = hours > 0 ? String(hours) : "";
    ui.minutesInput.value = minutes > 0 ? String(minutes) : "0";
}

function updatePresetSelection() {
    const totalMinutes = clampNumber(ui.hoursInput.value, 0, 8) * 60 + clampNumber(ui.minutesInput.value, 0, 59);
    ui.presetButtons.forEach((button) => {
        const isActive = Number(button.dataset.presetMinutes) === totalMinutes;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
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
    if (mode.hasDuration === false) {
        return;
    }
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
    ui.body.classList.toggle("is-timer-home-screen", screen === "home");
    ui.body.classList.toggle("is-timer-running-screen", screen === "timer");
    ui.body.classList.toggle("is-timer-finish-screen", screen === "finish");

    if (screen === "timer") {
        enterNativeFullscreenLandscape();
    } else {
        exitNativeFullscreen();
    }
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
    const mode = getMode();
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
    updatePresetSelection();

    if (!state.activeMode) {
        ui.inputGrid.classList.remove("hidden");
        ui.presetRow.classList.add("hidden");
        ui.durationGuidance.classList.add("hidden");
        ui.timePreviewLabel.textContent = "Tempo digitado";
        ui.validationMessage.textContent = "Escolha primeiro o tipo do timer.";
        ui.startTimerBtn.disabled = true;
        return;
    }

    if (mode?.hasDuration === false) {
        ui.inputGrid.classList.add("hidden");
        ui.presetRow.classList.add("hidden");
        ui.durationGuidance.classList.remove("hidden");
        ui.durationGuidanceLabel.textContent = "Cronômetro livre";
        ui.durationGuidanceValue.textContent = "Sem tempo final";
        ui.durationGuidanceHint.textContent = "Esse modo conta o tempo sem limite. Para um aviso no fim, escolha Lanche ou Casa.";
        ui.timePreviewLabel.textContent = "Tempo corrido";
        ui.timePreview.textContent = "00:00:00";
        ui.validationMessage.textContent = "Aqui o tempo não é definido antes. É só começar e acompanhar.";
        ui.startTimerBtn.disabled = false;
        return;
    }

    ui.inputGrid.classList.remove("hidden");
    ui.presetRow.classList.remove("hidden");
    ui.durationGuidance.classList.remove("hidden");
    ui.durationGuidanceLabel.textContent = "Defina o tempo";
    ui.durationGuidanceValue.textContent = formatTime(totalSeconds);
    ui.durationGuidanceHint.textContent = "Você pode digitar horas e minutos ou tocar em um atalho rápido.";
    ui.timePreviewLabel.textContent = "Tempo digitado";

    if (totalSeconds <= 0) {
        ui.validationMessage.textContent = "Digite pelo menos 1 minuto para começar.";
        ui.startTimerBtn.disabled = true;
        return;
    }

    ui.validationMessage.textContent = "";
    ui.startTimerBtn.disabled = false;
}

function showModeChooser() {
    state.activeMode = null;
    ui.body.classList.remove("timer-mode-selected");
    ui.setupCard.classList.add("hidden");
    ui.modeButtons.forEach((button) => button.classList.remove("is-selected"));
    ui.finishCelebration.innerHTML = "";
    updateSetupPreview();
}

function selectMode(modeId) {
    const wasChooserVisible = ui.setupCard.classList.contains("hidden");
    state.activeMode = modeId;
    const mode = getMode();

    ui.body.classList.add("timer-mode-selected");
    ui.setupCard.classList.remove("is-free-mode");
    ui.modeButtons.forEach((button) => {
        button.classList.toggle("is-selected", button.dataset.mode === modeId);
    });

    ui.setupCard.classList.remove("hidden");
    ui.setupEyebrow.textContent = mode.eyebrow;
    ui.setupTitle.textContent = mode.title;
    const setupSubtitle = mode.subtitle || "Escolha quanto tempo essa rotina vai durar.";
    ui.setupSubtitle.textContent = setupSubtitle;
    ui.setupSubtitle.classList.toggle("hidden", !setupSubtitle);
    ui.startTimerBtn.textContent = "Começar timer";
    updateSetupPreview();

    if (wasChooserVisible) {
        window.history.pushState({ jojoTimerSetup: true }, "", window.location.href);
    }
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

function updateHourglass(hourglassMode) {
    if (!hourglassRenderer) {
        return;
    }

    if (!hourglassMode) {
        hourglassRenderer.reset();
        hourglassState.active = false;
        hourglassState.cycle = -1;
        hourglassState.paused = false;
        return;
    }

    const duration = Math.max(1, state.totalSeconds);
    const needsNewCycle = !hourglassState.active || hourglassState.cycle !== duration;

    if (needsNewCycle) {
        hourglassRenderer.reset();
        hourglassRenderer.start(duration);
        hourglassState.active = true;
        hourglassState.cycle = duration;
        hourglassState.paused = false;

        if (state.isPaused) {
            hourglassRenderer.pause();
            hourglassState.paused = true;
        }
        return;
    }

    if (state.isPaused && !hourglassState.paused) {
        hourglassRenderer.pause();
        hourglassState.paused = true;
        return;
    }

    if (!state.isPaused && hourglassState.paused) {
        hourglassRenderer.start(duration);
        hourglassState.paused = false;
    }
}

function updateTimerStatus() {
    const mode = getMode();
    const hourglassMode = isHourglassMode();
    const progressRatio = getProgressRatio();
    const elapsed = state.totalSeconds - state.remainingSeconds;
    const metrics = hourglassMode ? null : getJourneyMetrics();

    if (!hourglassMode) {
        renderDestination(mode);
    }

    ui.countdownValue.textContent = formatTime(state.remainingSeconds);
    if (ui.totalTimeValue) {
        ui.totalTimeValue.textContent = formatTime(state.totalSeconds);
    }
    ui.elapsedTimeValue.textContent = formatTime(elapsed);
    if (ui.progressPercent) {
        ui.progressPercent.textContent = `${Math.round(progressRatio * 100)}%`;
    }
    const countdownLabel = ui.countdownValue?.previousElementSibling;
    if (countdownLabel) {
        countdownLabel.textContent = "Tempo restante";
    }
    ui.journeyMessage.textContent = hourglassMode
        ? (state.isPaused ? "Ampulheta pausada." : getJourneyMessage(progressRatio))
        : getJourneyMessage(progressRatio);
    ui.timerStatusText.textContent = state.isPaused
        ? (hourglassMode ? "Ampulheta pausada" : "Timer pausado")
        : (hourglassMode ? "Ampulheta em movimento" : getJourneyMessage(progressRatio));

    if (metrics) {
        ui.journeyProgress.style.left = `${metrics.pathLeft}px`;
        ui.journeyProgress.style.width = `${metrics.pathWidth * progressRatio}px`;
    } else {
        ui.journeyProgress.style.width = "0px";
    }

    ui.journeyCard.classList.toggle("is-paused", hourglassMode && state.isPaused);
    updateHourglass(hourglassMode);
    updateMilestones(progressRatio);
    if (!hourglassMode) {
        updateStudentPosition(progressRatio);
    }
}

function renderTimerScene() {
    const mode = getMode();
    ui.timerModeEyebrow.textContent = mode.eyebrow;
    ui.timerModeTitle.textContent = mode.title;
    ui.timerStatusText.textContent = mode.progressTitle;
    ui.journeyCard.classList.remove("is-lanche", "is-casa", "is-livre");
    ui.journeyCard.classList.add(mode.accentClass);
    ui.journeyScene.classList.toggle("hidden", isHourglassMode());
    ui.freeTimerPanel.classList.toggle("hidden", !isHourglassMode());
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

function renderFinishCelebration(mode) {
    const palettes = {
        "is-lanche": ["#ffd84d", "#ff8a67", "#63c9ff", "#7de28a"],
        "is-casa": ["#8be2d0", "#4d89f6", "#ffd86d", "#ff8db7"],
        "is-livre": ["#63c9ff", "#7d6bff", "#ffd84d", "#ff8a67"]
    };
    const palette = palettes[mode.accentClass] || palettes["is-lanche"];

    ui.finishCelebration.innerHTML = Array.from({ length: 18 }, (_, index) => {
        const color = palette[index % palette.length];
        const x = ((index % 6) / 5) * 100;
        const delay = (index % 6) * 0.08;
        const duration = 1.8 + (index % 4) * 0.2;
        const drift = index % 2 === 0 ? -1 : 1;
        return `<span class="celebration-dot" style="--dot-color:${color};--dot-x:${x}%;--dot-delay:${delay}s;--dot-duration:${duration}s;--dot-drift:${drift};"></span>`;
    }).join("");
}

function stopTimer() {
    stopCountdown();
    stopDestinationCycle();
    stopHourglassSandSound();
    hourglassRenderer?.reset();
    hourglassState.active = false;
    hourglassState.cycle = -1;
    hourglassState.paused = false;
}

function startCountdown() {
    stopCountdown();
    state.isPaused = false;
    state.tickPhase = 0;
    ensureAudioReady();
    ui.pauseBtn.disabled = false;
    ui.resumeBtn.disabled = true;
    startHourglassSandSound();
    if (!isHourglassMode()) {
        playTickTock();
    }

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

        if (!isHourglassMode()) {
            playTickTock();
        }
        updateTimerStatus();
    }, 1000);
}

function startFreeCountup() {
    stopCountdown();
    state.isPaused = false;
    state.tickPhase = 0;
    ensureAudioReady();
    ui.pauseBtn.disabled = false;
    ui.resumeBtn.disabled = true;

    state.timerId = window.setInterval(() => {
        if (state.isPaused) {
            return;
        }

        state.elapsedSeconds += 1;
        if (state.elapsedSeconds % 5 === 0) {
            playTickTock();
        }
        updateTimerStatus();
    }, 1000);
}

function startTimer() {
    state.totalSeconds = getInputSeconds();
    state.remainingSeconds = state.totalSeconds;
    state.elapsedSeconds = 0;
    state.destinationAssetIndex = 0;
    window.history.pushState({ jojoTimerSession: true }, "", window.location.href);

    if (state.totalSeconds <= 0 || !state.activeMode) {
        updateSetupPreview();
        return;
    }

    switchScreen("timer");
    buildMilestones();
    window.requestAnimationFrame(() => {
        renderTimerScene();
    });
    if (!isHourglassMode()) {
        startDestinationCycle();
    }
    startCountdown();
}

function pauseTimer() {
    state.isPaused = true;
    stopHourglassSandSound();
    ui.pauseBtn.disabled = true;
    ui.resumeBtn.disabled = false;
    updateTimerStatus();
}

function resumeTimer() {
    state.isPaused = false;
    startHourglassSandSound();
    ui.pauseBtn.disabled = false;
    ui.resumeBtn.disabled = true;
    updateTimerStatus();
}

function resetCurrentTimer() {
    state.remainingSeconds = state.totalSeconds;
    state.elapsedSeconds = 0;
    state.isPaused = false;
    state.tickPhase = 0;
    state.destinationAssetIndex = 0;
    ui.pauseBtn.disabled = false;
    ui.resumeBtn.disabled = true;
    stopHourglassSandSound();
    buildMilestones();
    updateTimerStatus();
    if (!isHourglassMode()) {
        startDestinationCycle();
    }
    startCountdown();
}

function backToHome() {
    stopTimer();
    state.totalSeconds = 0;
    state.remainingSeconds = 0;
    state.elapsedSeconds = 0;
    state.isPaused = false;
    state.activeMode = null;
    ui.body.classList.remove("timer-mode-selected");
    ui.modeButtons.forEach((button) => button.classList.remove("is-selected"));
    ui.setupCard.classList.add("hidden");
    ui.finishCelebration.innerHTML = "";
    resetInputs();
    switchScreen("home");
}

function finishTimer() {
    stopTimer();
    const mode = getMode();
    renderFinishCelebration(mode);
    renderFinishVisuals(mode);
    if (!isHourglassMode()) {
        playFinishSound();
    }
    ui.finishTitle.textContent = mode.finishTitle;
    ui.finishText.textContent = mode.finishText;
    ui.finishBadge.textContent = mode.finishBadge;
    switchScreen("finish");
}

function repeatSameMode() {
    switchScreen("home");
    ui.finishCelebration.innerHTML = "";
    ui.setupCard.classList.remove("hidden");
    resetInputs();
    selectMode(state.activeMode);
}

ui.modeButtons.forEach((button) => {
    button.addEventListener("click", () => selectMode(button.dataset.mode));
});

ui.hoursInput.addEventListener("input", updateSetupPreview);
ui.minutesInput.addEventListener("input", updateSetupPreview);
ui.presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
        setInputDuration(Number(button.dataset.presetMinutes));
        updateSetupPreview();
    });
});
ui.startTimerBtn.addEventListener("click", startTimer);
ui.changeModeBtn.addEventListener("click", () => {
    showModeChooser();
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
        window.requestAnimationFrame(() => hourglassRenderer?.redraw());
    }
});

document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && ui.body.classList.contains("is-fullscreen-native")) {
        exitNativeFullscreen();
    }
    syncFullscreenState();
    if (!ui.timerScreen.classList.contains("hidden")) {
        updateTimerStatus();
    }
});

window.addEventListener("popstate", () => {
    if (!ui.timerScreen.classList.contains("hidden")) {
        exitFullscreen();
        backToHome();
        return;
    }

    if (!ui.setupCard.classList.contains("hidden")) {
        showModeChooser();
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
switchScreen("home");
syncFullscreenState();
