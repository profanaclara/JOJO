const { testsData } = window.JOJO_TEXTOS_DATA;

const YEAR_META = {
    1: {
        label: "1º Ano",
        icon: "🌱",
        subtitle: ""
    },
    2: {
        label: "2º Ano",
        icon: "🌿",
        subtitle: ""
    },
    3: {
        label: "3º Ano",
        icon: "🌳",
        subtitle: ""
    },
    4: {
        label: "4º e 5º Ano",
        icon: "🌟",
        subtitle: ""
    }
};

const STEP_META = {
    text: {
        title: "Texto"
    },
    words: {
        title: "Palavras"
    },
    pseudo: {
        title: "Pseudopalavras"
    }
};

const UPPER_GRADE_WORD_BANKS = [
    [
        "amizade", "caderno", "janela", "professora", "coragem", "caminho", "combinado", "respeito",
        "família", "brincadeira", "gentileza", "descoberta", "parceria", "passeio", "memória", "sonho",
        "escuta", "curiosidade", "presença", "acolhimento"
    ],
    [
        "floresta", "borboleta", "montanha", "nascente", "chuvisco", "passarinho", "semente", "manhã",
        "horizonte", "perfume", "folhagem", "riozinho", "campina", "pétala", "silêncio", "jardineira",
        "natureza", "brisa", "cuidado", "trilha"
    ],
    [
        "planeta", "microscópio", "experiência", "energia", "galáxia", "cientista", "observação", "laboratório",
        "satélite", "combustível", "universo", "descobrir", "hipótese", "pesquisa", "foguete", "solução",
        "astronomia", "invenção", "protótipo", "tecnologia"
    ],
    [
        "poesia", "capítulo", "personagem", "enredo", "biblioteca", "aventura", "narrativa", "leitura",
        "mistério", "expressão", "imaginação", "autoria", "descrição", "diálogo", "memórias", "fantasia",
        "clássico", "cultura", "palavra", "história"
    ],
    [
        "atitude", "equilíbrio", "desafio", "organização", "estratégia", "perseverança", "consciência", "esforço",
        "aprender", "planejamento", "responsável", "criatividade", "escolha", "mudança", "confiança", "propósito",
        "autonomia", "convivência", "reflexão", "superação"
    ]
];

const UPPER_GRADE_PSEUDO_BANKS = [
    [
        "lamiro", "tevano", "piruca", "noride", "beluta", "saveno", "muripe", "caluno",
        "teriva", "jonipe", "falume", "deroca", "bineta", "soripe", "tuleca", "nerumo",
        "valiro", "cerupa", "lomide", "fanuro"
    ],
    [
        "brenita", "siluvo", "garume", "tonipa", "melavo", "purina", "veluco", "nanite",
        "coruma", "davelo", "tirupe", "sumeca", "lorino", "pelura", "zaneco", "ferima",
        "golupe", "maniro", "quebila", "raveno"
    ],
    [
        "cloripe", "drumela", "fagiro", "nimavo", "torina", "zelume", "prenoca", "vulipe",
        "gerano", "bretila", "someru", "lupade", "queniro", "talume", "vinoca", "murade",
        "solipa", "drenuvo", "cafiro", "beruna"
    ],
    [
        "plorina", "ganuve", "trelipo", "morenaf", "sureta", "daluvo", "pirano", "venide",
        "lomura", "saripo", "trefina", "nolume", "barute", "cilopa", "franide", "temuro",
        "zelipa", "corune", "virelo", "quetara"
    ],
    [
        "gralume", "ponire", "catuvo", "delipa", "mureno", "salufe", "tronipa", "beluro",
        "nemica", "frolupe", "tarino", "veluma", "pradico", "sonelu", "girape", "molina",
        "serupe", "valeco", "durina", "colape"
    ]
];

const state = {
    soundEnabled: true,
    audioContext: null,
    textBoldEnabled: false,
    screen: "home",
    selectionView: "years",
    currentYear: null,
    currentSeries: null,
    currentTestIndex: null,
    currentStep: "text",
    timerId: null,
    seconds: 0,
    errors: 0,
    timeLimit: 30,
    warningPlayed: false,
    autoWordTimer: null,
    autoPseudoTimer: null,
    autoWordsRunning: false,
    autoPseudoRunning: false,
    currentWordIndex: 0,
    currentPseudoIndex: 0,
    wordsNotRead: [],
    pseudosNotRead: [],
    selectedWords: [],
    selectedPseudos: []
};

const ui = {
    body: document.body,
    homeScreen: document.getElementById("homeScreen"),
    selectionScreen: document.getElementById("selectionScreen"),
    sessionScreen: document.getElementById("sessionScreen"),
    infoModal: document.getElementById("infoModal"),
    openInfoBtn: document.getElementById("openInfoBtn"),
    selectionInfoBtn: document.getElementById("selectionInfoBtn"),
    closeInfoBtn: document.getElementById("closeInfoBtn"),
    toggleSoundBtn: document.getElementById("toggleSoundBtn"),
    selectionSoundBtn: document.getElementById("selectionSoundBtn"),
    sessionSoundBtn: document.getElementById("sessionSoundBtn"),
    toggleBoldBtn: document.getElementById("toggleBoldBtn"),
    toggleFullscreenBtn: document.getElementById("toggleFullscreenBtn"),
    exitFullscreenBtn: document.getElementById("exitFullscreenBtn"),
    fullscreenTimerDock: document.getElementById("fullscreenTimerDock"),
    fullscreenTimerValue: document.getElementById("fullscreenTimerValue"),
    fullscreenErrorDock: document.getElementById("fullscreenErrorDock"),
    fullscreenErrorValue: document.getElementById("fullscreenErrorValue"),
    rotateScreenBtn: document.getElementById("rotateScreenBtn"),
    selectionBackBtn: document.getElementById("selectionBackBtn"),
    selectionEyebrow: document.getElementById("selectionEyebrow"),
    selectionTitle: document.getElementById("selectionTitle"),
    selectionGrid: document.getElementById("selectionGrid"),
    sessionHomeBtn: document.getElementById("sessionHomeBtn"),
    sessionEyebrow: document.getElementById("sessionEyebrow"),
    sessionHeading: document.getElementById("sessionHeading"),
    backToSelectionBtn: document.getElementById("backToSelectionBtn"),
    stepNavigation: document.getElementById("stepNavigation"),
    timer: document.getElementById("timer"),
    timeLimitLabel: document.getElementById("timeLimitLabel"),
    errorCount: document.getElementById("errorCount"),
    maxErrorsLabel: document.getElementById("maxErrorsLabel"),
    textStep: document.getElementById("textStep"),
    textTitle: document.getElementById("textTitle"),
    readingText: document.getElementById("readingText"),
    criteriaMaxErrors: document.getElementById("criteriaMaxErrors"),
    criteriaMaxTime: document.getElementById("criteriaMaxTime"),
    questionsDetails: document.getElementById("questionsDetails"),
    questions: document.getElementById("questions"),
    checkAnswersBtn: document.getElementById("checkAnswersBtn"),
    results: document.getElementById("results"),
    wordsStep: document.getElementById("wordsStep"),
    wordsGrid: document.getElementById("wordsGrid"),
    autoWordsInterface: document.getElementById("autoWordsInterface"),
    wordCounter: document.getElementById("wordCounter"),
    totalWords: document.getElementById("totalWords"),
    startAutoWords: document.getElementById("startAutoWords"),
    markNotRead: document.getElementById("markNotRead"),
    autoWordsGrid: document.getElementById("autoWordsGrid"),
    notReadCount: document.getElementById("notReadCount"),
    notReadList: document.getElementById("notReadList"),
    pseudoStep: document.getElementById("pseudoStep"),
    pseudoGrid: document.getElementById("pseudoGrid"),
    autoPseudoInterface: document.getElementById("autoPseudoInterface"),
    pseudoCounter: document.getElementById("pseudoCounter"),
    totalPseudos: document.getElementById("totalPseudos"),
    startAutoPseudos: document.getElementById("startAutoPseudos"),
    markPseudoNotRead: document.getElementById("markPseudoNotRead"),
    autoPseudoGrid: document.getElementById("autoPseudoGrid"),
    pseudoNotReadCount: document.getElementById("pseudoNotReadCount"),
    pseudoNotReadList: document.getElementById("pseudoNotReadList"),
    startBtn: document.getElementById("startBtn"),
    stopBtn: document.getElementById("stopBtn"),
    errorBtn: document.getElementById("errorBtn"),
    resetBtn: document.getElementById("resetBtn")
};

let selectionFocusSyncFrame = 0;

function getYearMeta(year) {
    return YEAR_META[year] || YEAR_META[1];
}

function getCurrentSeriesTests() {
    if (!state.currentYear) {
        return [];
    }

    if (state.currentYear === 3) {
        return testsData[3]?.[1] || [];
    }

    if (!state.currentSeries) {
        return [];
    }

    return testsData[state.currentYear]?.[state.currentSeries] || [];
}

function getCurrentTest() {
    if (state.currentTestIndex === null) {
        return null;
    }

    return getCurrentSeriesTests()[state.currentTestIndex] || null;
}

function getAvailableSteps(testData) {
    const steps = ["text"];

    if (getWordsListForDisplay(testData).length > 0) {
        steps.push("words");
    }

    if (getPseudoWordsListForDisplay(testData).length > 0) {
        steps.push("pseudo");
    }

    return steps;
}

function getWordsListForDisplay(testData) {
    if (!testData || !Array.isArray(testData.words_list)) {
        return [];
    }

    if (state.currentYear === 1 || state.currentYear === 2) {
        return getEarlyLiteracySequence(testData.words_list);
    }

    if (state.currentYear === 4) {
        return getUpperGradeBank(UPPER_GRADE_WORD_BANKS);
    }

    return testData.words_list;
}

function getPseudoWordsListForDisplay(testData) {
    if (!testData || !Array.isArray(testData.pseudo_words)) {
        return [];
    }

    if (state.currentYear === 1 || state.currentYear === 2) {
        return getEarlyLiteracySequence(testData.pseudo_words);
    }

    if (state.currentYear === 4) {
        return getUpperGradeBank(UPPER_GRADE_PSEUDO_BANKS);
    }

    return testData.pseudo_words;
}

function getEarlyLiteracySequence(list) {
    return list
        .map((word, index) => ({
            word,
            index,
            size: String(word).normalize("NFD").replace(/[\u0300-\u036f]/g, "").length
        }))
        .sort((left, right) => {
            if (left.size !== right.size) {
                return left.size - right.size;
            }

            return left.index - right.index;
        })
        .map((item) => item.word);
}

function getUpperGradeBank(bankSets) {
    if (!Array.isArray(bankSets) || bankSets.length === 0) {
        return [];
    }

    const index = Number.isInteger(state.currentTestIndex) ? state.currentTestIndex : 0;
    const selectedSet = bankSets[index % bankSets.length] || [];
    return selectedSet.slice();
}

function getRotatingDisplayWindow(list, size, step) {
    if (!Array.isArray(list) || list.length === 0) {
        return [];
    }

    if (list.length <= size) {
        return list.slice();
    }

    const index = Number.isInteger(state.currentTestIndex) ? state.currentTestIndex : 0;
    const start = (index * step) % list.length;
    const windowItems = [];

    for (let offset = 0; offset < size; offset += 1) {
        windowItems.push(list[(start + offset) % list.length]);
    }

    return windowItems;
}

function parseTimeLimit(maxTimeLabel) {
    if (!maxTimeLabel) {
        return state.currentYear === 3 ? 42 : 30;
    }

    const matches = [...String(maxTimeLabel).matchAll(/\d+/g)].map((match) => Number(match[0]));
    if (matches.length === 0) {
        return state.currentYear === 3 ? 42 : 30;
    }

    const label = String(maxTimeLabel).toLowerCase();
    if (label.includes("min") && matches.length >= 2) {
        return matches[0] * 60 + matches[1];
    }

    if (label.includes("min")) {
        return matches[0] * 60;
    }

    return matches[0];
}

function formatSeconds(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function switchScreen(nextScreen) {
    state.screen = nextScreen;
    ui.homeScreen.classList.toggle("hidden", nextScreen !== "home");
    ui.selectionScreen.classList.toggle("hidden", nextScreen !== "selection");
    ui.sessionScreen.classList.toggle("hidden", nextScreen !== "session");
    ui.body.classList.toggle("session-active", nextScreen === "session");
}

function updateSoundButtons() {
    const icon = state.soundEnabled ? "🔊" : "🔇";
    const label = state.soundEnabled ? "Som ligado" : "Som desligado";
    const pressed = String(state.soundEnabled);
    const markup = `<span aria-hidden="true">${icon}</span><span class="sr-only">${label}</span>`;
    ui.toggleSoundBtn.innerHTML = markup;
    ui.selectionSoundBtn.innerHTML = markup;
    ui.sessionSoundBtn.innerHTML = markup;
    ui.toggleSoundBtn.setAttribute("aria-label", label);
    ui.selectionSoundBtn.setAttribute("aria-label", label);
    ui.sessionSoundBtn.setAttribute("aria-label", label);
    ui.toggleSoundBtn.setAttribute("aria-pressed", pressed);
    ui.selectionSoundBtn.setAttribute("aria-pressed", pressed);
    ui.sessionSoundBtn.setAttribute("aria-pressed", pressed);
}

function updateBoldButton() {
    if (!ui.toggleBoldBtn) {
        return;
    }

    const label = state.textBoldEnabled ? "Desativar texto em negrito" : "Ativar texto em negrito";
    ui.toggleBoldBtn.innerHTML = `<span aria-hidden="true">𝐁</span><span class="sr-only">${label}</span>`;
    ui.toggleBoldBtn.setAttribute("aria-label", label);
    ui.toggleBoldBtn.setAttribute("aria-pressed", String(state.textBoldEnabled));
}

function syncTextWeight() {
    ui.readingText.classList.toggle("is-bold", state.textBoldEnabled);
    ui.textTitle.classList.toggle("is-bold", state.textBoldEnabled);
}

function syncQuestionsDrawer(force = false) {
    if (!ui.questionsDetails) {
        return;
    }

    const isMobile = window.innerWidth <= 760;

    if (isMobile) {
        if (force || ui.questionsDetails.open) {
            ui.questionsDetails.open = false;
        }
        return;
    }

    if (force) {
        ui.questionsDetails.open = false;
    }
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

    if (state.audioContext.state === "suspended") {
        state.audioContext.resume().then(() => callback(state.audioContext)).catch(() => {});
        return;
    }

    callback(state.audioContext);
}

function playTone({ frequency, duration, type = "sine", volume = 0.08, delay = 0 }) {
    if (!state.soundEnabled) {
        return;
    }

    runWithAudio((context) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        const now = context.currentTime + delay;

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

function playUiSound() {
    playTone({ frequency: 690, duration: 0.07, type: "triangle", volume: 0.08 });
}

function playStartSound() {
    playTone({ frequency: 470, duration: 0.11, type: "triangle", volume: 0.09 });
    playTone({ frequency: 620, duration: 0.15, type: "triangle", volume: 0.1, delay: 0.1 });
}

function playStopSound() {
    playTone({ frequency: 320, duration: 0.08, type: "triangle", volume: 0.08 });
    playTone({ frequency: 260, duration: 0.11, type: "triangle", volume: 0.08, delay: 0.08 });
}

function playErrorSound() {
    playTone({ frequency: 250, duration: 0.1, type: "sawtooth", volume: 0.08 });
}

function playWarningSound() {
    playTone({ frequency: 840, duration: 0.08, type: "square", volume: 0.08 });
    playTone({ frequency: 740, duration: 0.08, type: "square", volume: 0.08, delay: 0.1 });
}

function playSuccessSound() {
    playTone({ frequency: 520, duration: 0.1, type: "triangle", volume: 0.08 });
    playTone({ frequency: 680, duration: 0.12, type: "triangle", volume: 0.08, delay: 0.08 });
}

function playPartialSound() {
    playTone({ frequency: 460, duration: 0.08, type: "triangle", volume: 0.08 });
    playTone({ frequency: 560, duration: 0.09, type: "triangle", volume: 0.08, delay: 0.08 });
}

function playResetSound() {
    playTone({ frequency: 530, duration: 0.07, type: "triangle", volume: 0.07 });
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

function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    updateSoundButtons();

    if (state.soundEnabled) {
        playUiSound();
    }
}

function toggleTextBold() {
    state.textBoldEnabled = !state.textBoldEnabled;
    updateBoldButton();
    syncTextWeight();
    playUiSound();
}

async function enterFullscreen() {
    playUiSound();

    try {
        if (document.fullscreenElement == null && ui.sessionScreen.requestFullscreen) {
            await ui.sessionScreen.requestFullscreen();
        }
    } catch (error) {
        console.warn("Nao foi possivel entrar em tela cheia.", error);
    }
}

async function exitFullscreen() {
    playUiSound();

    try {
        if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen();
        }
    } catch (error) {
        console.warn("Nao foi possivel sair da tela cheia.", error);
    }
}

async function requestLandscapeOrientation() {
    playUiSound();

    try {
        if (document.fullscreenElement == null && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        }

        if (screen.orientation?.lock) {
            await screen.orientation.lock("landscape");
            return;
        }
    } catch (error) {
        console.warn("Nao foi possivel travar a tela na horizontal.", error);
    }

    window.alert("Se o celular não girar sozinho, ative a rotação automática e vire o aparelho para a horizontal.");
}

function resetTimerVisual() {
    ui.timer.textContent = "00:00";
    ui.timer.classList.remove("timer-warning");
    ui.fullscreenTimerValue.textContent = "00:00";
    ui.fullscreenTimerValue.classList.remove("timer-warning");
    ui.errorCount.textContent = "0";
    ui.fullscreenErrorValue.textContent = "0";
}

function stopTimer() {
    if (state.timerId) {
        window.clearInterval(state.timerId);
        state.timerId = null;
    }

    ui.startBtn.disabled = false;
    ui.stopBtn.disabled = true;
}

function renderTimerAndErrors() {
    ui.timer.textContent = formatSeconds(state.seconds);
    ui.fullscreenTimerValue.textContent = formatSeconds(state.seconds);
    ui.errorCount.textContent = String(state.errors);
    ui.fullscreenErrorValue.textContent = String(state.errors);
    ui.timer.classList.toggle("timer-warning", state.seconds > state.timeLimit);
    ui.fullscreenTimerValue.classList.toggle("timer-warning", state.seconds > state.timeLimit);
}

function syncFullscreenState() {
    const isFullscreen = document.fullscreenElement === ui.sessionScreen;
    ui.body.classList.toggle("textos-fullscreen", isFullscreen);
    ui.exitFullscreenBtn.classList.toggle("hidden", !isFullscreen);
    ui.fullscreenTimerDock.classList.toggle("hidden", !isFullscreen);
    ui.fullscreenErrorDock.classList.toggle("hidden", !isFullscreen);
    ui.fullscreenTimerDock.setAttribute("aria-hidden", String(!isFullscreen));
    ui.fullscreenErrorDock.setAttribute("aria-hidden", String(!isFullscreen));
    ui.toggleFullscreenBtn.classList.toggle("hidden", isFullscreen);
}

function startTimer() {
    if (state.timerId) {
        return;
    }

    playStartSound();
    ui.startBtn.disabled = true;
    ui.stopBtn.disabled = false;

    state.timerId = window.setInterval(() => {
        state.seconds += 1;
        renderTimerAndErrors();

        if (state.seconds > state.timeLimit && !state.warningPlayed) {
            state.warningPlayed = true;
            playWarningSound();
        }
    }, 1000);
}

function addError() {
    state.errors += 1;
    renderTimerAndErrors();
    playErrorSound();
}

function clearQuestionSelections() {
    ui.questions.querySelectorAll("input[type='radio']").forEach((input) => {
        input.checked = false;
    });
}

function clearAutoTimers() {
    if (state.autoWordTimer) {
        window.clearTimeout(state.autoWordTimer);
        state.autoWordTimer = null;
    }

    if (state.autoPseudoTimer) {
        window.clearTimeout(state.autoPseudoTimer);
        state.autoPseudoTimer = null;
    }
}

function resetAutoState() {
    state.autoWordsRunning = false;
    state.autoPseudoRunning = false;
    state.currentWordIndex = 0;
    state.currentPseudoIndex = 0;
    state.wordsNotRead = [];
    state.pseudosNotRead = [];
    state.selectedWords = [];
    state.selectedPseudos = [];
}

function resetTest() {
    stopTimer();
    clearAutoTimers();
    resetAutoState();
    state.seconds = 0;
    state.errors = 0;
    state.warningPlayed = false;
    resetTimerVisual();
    ui.results.classList.add("hidden");
    ui.results.innerHTML = "";
    clearQuestionSelections();
    renderAutoWordsSection();
    renderAutoPseudoSection();
}

function goHome() {
    resetTest();
    state.selectionView = "years";
    state.currentYear = null;
    state.currentSeries = null;
    state.currentTestIndex = null;
    switchScreen("home");
}

function goBackFromSelection() {
    goHome();
}

function backToSelection() {
    resetTest();
    renderTestSelection();
    switchScreen("selection");
}

function renderTestSelection() {
    state.selectionView = "tests";
    const yearMeta = getYearMeta(state.currentYear);
    const tests = getCurrentSeriesTests();

    ui.selectionEyebrow.textContent = yearMeta.label;
    ui.selectionTitle.textContent = "Escolha o texto";
    ui.selectionGrid.dataset.mode = "tests";
    ui.selectionGrid.innerHTML = tests
        .map((testData, index) => {
            return `
                <button class="selection-card selection-card--test" type="button" data-select-test="${index}">
                    <strong>${escapeHtml(testData.title)}</strong>
                </button>
            `;
        })
        .join("");

    switchScreen("selection");
    window.requestAnimationFrame(() => {
        queueSelectionFocusSync();
    });
}

function getSelectionTestCards() {
    return Array.from(ui.selectionGrid.querySelectorAll(".selection-card--test"));
}

function syncSelectionFocusState() {
    if (ui.selectionGrid.dataset.mode !== "tests") {
        return;
    }

    const cards = getSelectionTestCards();
    if (cards.length === 0) {
        return;
    }

    const containerRect = ui.selectionGrid.getBoundingClientRect();
    const centerY = containerRect.top + containerRect.height / 2;
    let focusedCard = cards[0];
    let shortestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(centerY - cardCenter);

        if (distance < shortestDistance) {
            shortestDistance = distance;
            focusedCard = card;
        }
    });

    cards.forEach((card) => {
        card.classList.toggle("is-focus-target", card === focusedCard);
    });
}

function queueSelectionFocusSync() {
    if (selectionFocusSyncFrame) {
        window.cancelAnimationFrame(selectionFocusSyncFrame);
    }

    selectionFocusSyncFrame = window.requestAnimationFrame(() => {
        syncSelectionFocusState();
        selectionFocusSyncFrame = 0;
    });
}

function renderQuestions(testData) {
    ui.questions.innerHTML = testData.questions
        .map((question, questionIndex) => {
            const options = question.options
                .map((option, optionIndex) => {
                    const inputId = `question_${questionIndex}_${optionIndex}`;
                    return `
                        <label class="question-option" for="${inputId}">
                            <input id="${inputId}" type="radio" name="question_${questionIndex}" value="${optionIndex}">
                            <span>${String.fromCharCode(65 + optionIndex)}) ${escapeHtml(option)}</span>
                        </label>
                    `;
                })
                .join("");

            return `
                <article class="question-item">
                    <h5>${questionIndex + 1}. ${escapeHtml(question.q)}</h5>
                    <div class="question-options">${options}</div>
                </article>
            `;
        })
        .join("");
}

function renderTextStep(testData) {
    ui.textTitle.textContent = "";
    ui.readingText.innerHTML = testData.text
        .split("\n")
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("");
    syncTextWeight();
    ui.criteriaMaxErrors.textContent = `Máximo de ${testData.maxErrors} erros`;
    ui.criteriaMaxTime.textContent = `Máximo de ${testData.maxTime}`;
    renderQuestions(testData);
    ui.results.classList.add("hidden");
    ui.results.innerHTML = "";
}

function renderStaticChipGrid(container, items, selectedIndexes = [], pseudo = false) {
    container.innerHTML = items
        .map((item, index) => {
            return `
                <article class="chip ${pseudo ? "chip--pseudo" : ""} ${selectedIndexes.includes(index) ? "is-selected" : ""}" data-chip-index="${index}">
                    <strong class="chip__word">${escapeHtml(item)}</strong>
                </article>
            `;
        })
        .join("");
}

function buildAutoChipMarkup(items, currentIndex, missedIndexes, selectedIndexes, running, pseudo = false) {
    return items
        .map((item, index) => {
            const classes = ["chip"];

            if (pseudo) {
                classes.push("chip--pseudo");
            }

            if (running && index === currentIndex) {
                classes.push("is-current");
            } else if (missedIndexes.includes(index)) {
                classes.push("is-missed");
            } else if (index < currentIndex) {
                classes.push("is-read");
            } else if (selectedIndexes.includes(index)) {
                classes.push("is-selected");
            }

            return `
                <article class="${classes.join(" ")}" data-chip-index="${index}">
                    <strong class="chip__word">${escapeHtml(item)}</strong>
                </article>
            `;
        })
        .join("");
}

function updateNotReadDisplay() {
    const testData = getCurrentTest();
    const wordsList = getWordsListForDisplay(testData);
    const labels = state.wordsNotRead.map((index) => `${index + 1}. ${wordsList[index]}`);
    ui.notReadCount.textContent = String(labels.length);
    ui.notReadList.textContent = labels.length > 0 ? labels.join(" • ") : "Nenhuma palavra marcada.";
}

function updatePseudoNotReadDisplay() {
    const testData = getCurrentTest();
    const pseudoList = getPseudoWordsListForDisplay(testData);
    const labels = state.pseudosNotRead.map((index) => `${index + 1}. ${pseudoList[index]}`);
    ui.pseudoNotReadCount.textContent = String(labels.length);
    ui.pseudoNotReadList.textContent = labels.length > 0 ? labels.join(" • ") : "Nenhuma pseudopalavra marcada.";
}

function renderAutoWordsSection() {
    const testData = getCurrentTest();
    const wordsList = getWordsListForDisplay(testData);

    if (!testData || wordsList.length === 0) {
        ui.autoWordsInterface.classList.add("hidden");
        return;
    }

    ui.autoWordsInterface.classList.remove("hidden");
    ui.totalWords.textContent = String(wordsList.length);
    ui.wordCounter.textContent = String(
        state.autoWordsRunning
            ? Math.min(state.currentWordIndex + 1, wordsList.length)
            : state.currentWordIndex
    );
    ui.startAutoWords.disabled = state.autoWordsRunning;
    ui.markNotRead.disabled = !state.autoWordsRunning;
    ui.autoWordsGrid.innerHTML = buildAutoChipMarkup(
        wordsList,
        state.currentWordIndex,
        state.wordsNotRead,
        state.selectedWords,
        state.autoWordsRunning
    );
    updateNotReadDisplay();
}

function renderAutoPseudoSection() {
    const testData = getCurrentTest();
    const pseudoList = getPseudoWordsListForDisplay(testData);

    if (!testData || pseudoList.length === 0) {
        ui.autoPseudoInterface.classList.add("hidden");
        return;
    }

    ui.autoPseudoInterface.classList.remove("hidden");
    ui.totalPseudos.textContent = String(pseudoList.length);
    ui.pseudoCounter.textContent = String(
        state.autoPseudoRunning
            ? Math.min(state.currentPseudoIndex + 1, pseudoList.length)
            : state.currentPseudoIndex
    );
    ui.startAutoPseudos.disabled = state.autoPseudoRunning;
    ui.markPseudoNotRead.disabled = !state.autoPseudoRunning;
    ui.autoPseudoGrid.innerHTML = buildAutoChipMarkup(
        pseudoList,
        state.currentPseudoIndex,
        state.pseudosNotRead,
        state.selectedPseudos,
        state.autoPseudoRunning,
        true
    );
    updatePseudoNotReadDisplay();
}

function renderWordsStep(testData) {
    ui.wordsGrid.classList.add("hidden");
    renderAutoWordsSection();
}

function renderPseudoStep(testData) {
    ui.pseudoGrid.classList.add("hidden");
    renderAutoPseudoSection();
}

function toggleWordSelection(index) {
    if (state.selectedWords.includes(index)) {
        state.selectedWords = state.selectedWords.filter((item) => item !== index);
    } else {
        state.selectedWords = [...state.selectedWords, index];
    }

    const testData = getCurrentTest();
    if (testData) {
        renderWordsStep(testData);
        playUiSound();
    }
}

function togglePseudoSelection(index) {
    if (state.selectedPseudos.includes(index)) {
        state.selectedPseudos = state.selectedPseudos.filter((item) => item !== index);
    } else {
        state.selectedPseudos = [...state.selectedPseudos, index];
    }

    const testData = getCurrentTest();
    if (testData) {
        renderPseudoStep(testData);
        playUiSound();
    }
}

function renderStepNavigation(testData) {
    const steps = getAvailableSteps(testData);

    if (!steps.includes(state.currentStep)) {
        state.currentStep = steps[0];
    }

    ui.stepNavigation.innerHTML = steps
        .map((step) => {
            const activeClass = step === state.currentStep ? "is-active" : "";
            return `
                <button class="step-button ${activeClass}" type="button" data-step="${step}">
                    ${STEP_META[step].title}
                </button>
            `;
        })
        .join("");

}

function renderVisibleStep() {
    ui.textStep.classList.toggle("hidden", state.currentStep !== "text");
    ui.wordsStep.classList.toggle("hidden", state.currentStep !== "words");
    ui.pseudoStep.classList.toggle("hidden", state.currentStep !== "pseudo");
}

function renderSession() {
    const testData = getCurrentTest();
    if (!testData) {
        return;
    }

    const yearMeta = getYearMeta(state.currentYear);
    ui.sessionEyebrow.textContent = yearMeta.label;
    ui.sessionHeading.textContent = testData.title;
    ui.timeLimitLabel.textContent = `Meta: ${testData.maxTime}`;
    ui.maxErrorsLabel.textContent = `Meta: até ${testData.maxErrors} erros`;
    renderTextStep(testData);
    renderWordsStep(testData);
    renderPseudoStep(testData);
    renderStepNavigation(testData);
    renderVisibleStep();
    renderTimerAndErrors();
    updateBoldButton();
    syncQuestionsDrawer(true);
}

function openTest(testIndex) {
    state.currentTestIndex = testIndex;
    state.currentStep = "text";
    const testData = getCurrentTest();
    state.timeLimit = parseTimeLimit(testData.maxTime);
    resetTest();
    renderSession();
    switchScreen("session");
}

function selectYear(year) {
    state.currentYear = year;
    state.currentSeries = null;
    state.currentTestIndex = null;
    playUiSound();
    state.currentSeries = year === 3 ? null : 1;
    renderTestSelection();
}

function showStep(step) {
    const testData = getCurrentTest();
    if (!testData) {
        return;
    }

    if (!getAvailableSteps(testData).includes(step)) {
        return;
    }

    state.currentStep = step;
    playUiSound();
    renderStepNavigation(testData);
    renderVisibleStep();
}

function checkAnswers() {
    const testData = getCurrentTest();
    if (!testData) {
        return;
    }

    let correctCount = 0;
    const resultLines = testData.questions
        .map((question, questionIndex) => {
            const selected = document.querySelector(`input[name="question_${questionIndex}"]:checked`);
            const isCorrect = selected && Number(selected.value) === question.correct;

            if (isCorrect) {
                correctCount += 1;
            }

            return {
                correctAnswer: question.options[question.correct],
                isCorrect,
                label: `Pergunta ${questionIndex + 1}`
            };
        })
        .map((result) => {
            return `
                <div class="result-line ${result.isCorrect ? "result-line--ok" : "result-line--error"}">
                    <span>${result.label}</span>
                    <span>${result.isCorrect ? "✅" : `❌ ${escapeHtml(result.correctAnswer)}`}</span>
                </div>
            `;
        })
        .join("");

    const perfect = correctCount === testData.questions.length;
    ui.results.innerHTML = `
        <div class="results-box__summary ${perfect ? "is-perfect" : "is-partial"}">
            ${correctCount}/${testData.questions.length} corretas
        </div>
        ${resultLines}
    `;
    ui.results.classList.remove("hidden");

    if (perfect) {
        playSuccessSound();
    } else {
        playPartialSound();
    }
}

function scheduleNextAutoWord() {
    const testData = getCurrentTest();
    const wordsList = getWordsListForDisplay(testData);
    if (!testData || !state.autoWordsRunning) {
        return;
    }

    renderAutoWordsSection();
    playUiSound();

    state.autoWordTimer = window.setTimeout(() => {
        state.currentWordIndex += 1;

        if (state.currentWordIndex >= wordsList.length) {
            state.autoWordsRunning = false;
            state.currentWordIndex = wordsList.length;
            renderAutoWordsSection();
            playSuccessSound();
            return;
        }

        scheduleNextAutoWord();
    }, 3000);
}

function startAutoWords() {
    const testData = getCurrentTest();
    const wordsList = getWordsListForDisplay(testData);
    if (!testData || wordsList.length === 0) {
        return;
    }

    if (state.autoPseudoTimer) {
        window.clearTimeout(state.autoPseudoTimer);
        state.autoPseudoTimer = null;
    }
    state.autoPseudoRunning = false;
    state.autoWordsRunning = true;
    state.currentWordIndex = 0;
    state.wordsNotRead = [];
    renderAutoPseudoSection();
    renderAutoWordsSection();
    playStartSound();
    scheduleNextAutoWord();
}

function markWordNotRead() {
    const testData = getCurrentTest();
    const wordsList = getWordsListForDisplay(testData);
    if (!testData || !state.autoWordsRunning) {
        return;
    }

    const index = state.currentWordIndex;
    if (index >= wordsList.length || state.wordsNotRead.includes(index)) {
        return;
    }

    state.wordsNotRead = [...state.wordsNotRead, index];
    renderAutoWordsSection();
    playErrorSound();
}

function scheduleNextAutoPseudo() {
    const testData = getCurrentTest();
    const pseudoList = getPseudoWordsListForDisplay(testData);
    if (!testData || !state.autoPseudoRunning) {
        return;
    }

    renderAutoPseudoSection();
    playUiSound();

    state.autoPseudoTimer = window.setTimeout(() => {
        state.currentPseudoIndex += 1;

        if (state.currentPseudoIndex >= pseudoList.length) {
            state.autoPseudoRunning = false;
            state.currentPseudoIndex = pseudoList.length;
            renderAutoPseudoSection();
            playSuccessSound();
            return;
        }

        scheduleNextAutoPseudo();
    }, 3000);
}

function startAutoPseudos() {
    const testData = getCurrentTest();
    const pseudoList = getPseudoWordsListForDisplay(testData);
    if (!testData || pseudoList.length === 0) {
        return;
    }

    if (state.autoWordTimer) {
        window.clearTimeout(state.autoWordTimer);
        state.autoWordTimer = null;
    }
    state.autoWordsRunning = false;
    state.autoPseudoRunning = true;
    state.currentPseudoIndex = 0;
    state.pseudosNotRead = [];
    renderAutoWordsSection();
    renderAutoPseudoSection();
    playStartSound();
    scheduleNextAutoPseudo();
}

function markPseudoNotRead() {
    const testData = getCurrentTest();
    const pseudoList = getPseudoWordsListForDisplay(testData);
    if (!testData || !state.autoPseudoRunning) {
        return;
    }

    const index = state.currentPseudoIndex;
    if (index >= pseudoList.length || state.pseudosNotRead.includes(index)) {
        return;
    }

    state.pseudosNotRead = [...state.pseudosNotRead, index];
    renderAutoPseudoSection();
    playErrorSound();
}

ui.openInfoBtn.addEventListener("click", openInfoModal);
ui.selectionInfoBtn.addEventListener("click", openInfoModal);
ui.closeInfoBtn.addEventListener("click", closeInfoModal);
ui.infoModal.addEventListener("click", (event) => {
    if (event.target === ui.infoModal || event.target.classList.contains("modal__backdrop")) {
        closeInfoModal();
    }
});

ui.toggleSoundBtn.addEventListener("click", toggleSound);
ui.selectionSoundBtn.addEventListener("click", toggleSound);
ui.sessionSoundBtn.addEventListener("click", toggleSound);
ui.toggleBoldBtn.addEventListener("click", toggleTextBold);
ui.toggleFullscreenBtn.addEventListener("click", enterFullscreen);
ui.exitFullscreenBtn.addEventListener("click", exitFullscreen);
ui.rotateScreenBtn.addEventListener("click", requestLandscapeOrientation);
ui.selectionBackBtn.addEventListener("click", goBackFromSelection);
ui.sessionHomeBtn.addEventListener("click", goHome);
ui.backToSelectionBtn.addEventListener("click", backToSelection);
ui.checkAnswersBtn.addEventListener("click", checkAnswers);
ui.startBtn.addEventListener("click", startTimer);
ui.stopBtn.addEventListener("click", () => {
    stopTimer();
    playStopSound();
});
ui.errorBtn.addEventListener("click", addError);
ui.resetBtn.addEventListener("click", () => {
    resetTest();
    playResetSound();
});
ui.startAutoWords.addEventListener("click", startAutoWords);
ui.markNotRead.addEventListener("click", markWordNotRead);
ui.startAutoPseudos.addEventListener("click", startAutoPseudos);
ui.markPseudoNotRead.addEventListener("click", markPseudoNotRead);

document.querySelectorAll("[data-year]").forEach((button) => {
    button.addEventListener("click", () => {
        ensureAudioContext();
        selectYear(Number(button.dataset.year));
    });
});

ui.selectionGrid.addEventListener("click", (event) => {
    const testButton = event.target.closest("[data-select-test]");
    if (testButton) {
        ensureAudioContext();
        playUiSound();
        openTest(Number(testButton.dataset.selectTest));
    }
});

ui.selectionGrid.addEventListener("scroll", () => {
    if (ui.selectionGrid.dataset.mode !== "tests") {
        return;
    }

    queueSelectionFocusSync();
});

ui.wordsGrid.addEventListener("click", (event) => {
    if (state.currentYear === 4) {
        return;
    }

    const chip = event.target.closest("[data-chip-index]");
    if (!chip) {
        return;
    }

    toggleWordSelection(Number(chip.dataset.chipIndex));
});

ui.pseudoGrid.addEventListener("click", (event) => {
    if (state.currentYear === 4) {
        return;
    }

    const chip = event.target.closest("[data-chip-index]");
    if (!chip) {
        return;
    }

    togglePseudoSelection(Number(chip.dataset.chipIndex));
});

ui.autoWordsGrid.addEventListener("click", (event) => {
    if (state.autoWordsRunning) {
        return;
    }

    const chip = event.target.closest("[data-chip-index]");
    if (!chip) {
        return;
    }

    toggleWordSelection(Number(chip.dataset.chipIndex));
});

ui.autoPseudoGrid.addEventListener("click", (event) => {
    if (state.autoPseudoRunning) {
        return;
    }

    const chip = event.target.closest("[data-chip-index]");
    if (!chip) {
        return;
    }

    togglePseudoSelection(Number(chip.dataset.chipIndex));
});

ui.stepNavigation.addEventListener("click", (event) => {
    const button = event.target.closest("[data-step]");
    if (!button) {
        return;
    }

    showStep(button.dataset.step);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !ui.infoModal.classList.contains("hidden")) {
        closeInfoModal();
        return;
    }

    if (state.screen !== "session") {
        return;
    }

    if (event.key === "Escape") {
        event.preventDefault();
        if (document.fullscreenElement === ui.sessionScreen) {
            exitFullscreen();
        } else {
            backToSelection();
        }
        return;
    }

    if ((event.key === "Enter" || event.code === "Space") && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        if (!state.timerId) {
            startTimer();
        } else {
            stopTimer();
            playStopSound();
        }
        return;
    }

    if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        addError();
    }
});

resetTimerVisual();
updateSoundButtons();
updateBoldButton();
syncTextWeight();
window.addEventListener("resize", () => {
    syncQuestionsDrawer(false);

    if (ui.selectionGrid.dataset.mode === "tests") {
        queueSelectionFocusSync();
    }
});
document.addEventListener("fullscreenchange", syncFullscreenState);
syncFullscreenState();
