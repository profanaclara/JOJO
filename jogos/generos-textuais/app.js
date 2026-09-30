(() => {
    "use strict";
    const { Game, genres } = window.JojoQuiz;
    const game = new Game(window.JOJO_GENEROS);
    const $ = id => document.getElementById(id);
    const question = $("question"), options = $("options"), image = $("cardImage");
    const dialog = $("zoomDialog");
    let ready = false, remaining = 0, lastTick = 0, frame = 0, loadToken = 0;
    let sound = true, audio;
    try { sound = localStorage.getItem("jojo-generos-sound") !== "off"; } catch (_) { /* Storage may be unavailable. */ }

    function syncSound() {
        $("soundBtn").setAttribute("aria-pressed", String(sound));
        $("soundBtn").setAttribute("aria-label", sound ? "Desligar som" : "Ligar som");
        $("soundBtn").title = sound ? "Desligar som" : "Ligar som";
        $("soundBtn").firstElementChild.src = `../../assets/jojo-icon-som-${sound ? "on" : "off"}.webp`;
    }
    function playSound(correct) {
        if (!sound) return;
        try {
            const Audio = window.AudioContext || window.webkitAudioContext;
            if (!Audio) return;
            audio ||= new Audio();
            audio.resume().catch(() => {});
            const notes = correct ? [523, 659, 784, 1047] : [294, 220];
            notes.forEach((frequency, i) => {
                const start = audio.currentTime + i * (correct ? .15 : .13);
                const oscillator = audio.createOscillator(), gain = audio.createGain();
                oscillator.type = "sine";
                oscillator.frequency.value = frequency;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(.12, start + .015);
                gain.gain.exponentialRampToValueAtTime(.001, start + .3);
                oscillator.connect(gain).connect(audio.destination);
                oscillator.start(start); oscillator.stop(start + .32);
                oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
            });
        } catch (_) { /* A blocked audio device must not interrupt the game. */ }
    }
    function feedback(title, text, state = "") {
        $("feedback").className = `feedback ${state}`;
        $("feedbackTitle").textContent = title;
        $("feedbackText").textContent = text;
    }
    function paintOptions() {
        [...options.children].forEach(button => {
            const genre = button.dataset.genre;
            const eliminated = game.eliminated.has(genre);
            const done = game.phase !== "answering";
            const correct = done && genre === game.current.genre;
            button.disabled = !ready || eliminated || done;
            button.classList.toggle("eliminated", eliminated);
            button.classList.toggle("correct", correct);
            button.classList.toggle("muted", done && !correct);
            button.querySelector(".answer-icon")?.remove();
            button.setAttribute("aria-label", `${genres[genre].label}${correct ? ", RESPOSTA CORRETA" : eliminated ? ", ALTERNATIVA ELIMINADA" : ""}`);
            if (correct || eliminated) {
                const icon = document.createElement("img");
                icon.className = "answer-icon"; icon.alt = "";
                icon.src = `../../assets/jojo-icon-${correct ? "check" : "close"}.webp`;
                button.append(icon);
            }
        });
        $("hits").textContent = `${game.hits} ${game.hits === 1 ? "ACERTO" : "ACERTOS"}`;
    }
    function celebrate() {
        question.classList.add("celebrating");
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const colors = ["#70c7ff", "#8476ef", "#ffc94b", "#59c991"];
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement("i");
            piece.style.setProperty("--x", `${Math.random() * 100}%`);
            piece.style.setProperty("--delay", `${Math.random() * 1.1}s`);
            piece.style.setProperty("--color", colors[i % colors.length]);
            $("confetti").append(piece);
        }
    }
    // Count only visible reading time; zoom and background tabs pause advancement.
    function countdown(now) {
        if (!document.hidden && !dialog.open) remaining -= Math.min(now - lastTick, 150);
        lastTick = now;
        $("seconds").textContent = Math.max(1, Math.ceil(remaining / 1000));
        if (remaining <= 0) { nextQuestion(true); return; }
        frame = requestAnimationFrame(countdown);
    }
    function startCountdown(ms) {
        remaining = ms; lastTick = performance.now();
        $("seconds").textContent = Math.ceil(ms / 1000);
        $("advanceNote").hidden = false;
        frame = requestAnimationFrame(countdown);
    }
    function choose(genre, button) {
        if (!ready) return;
        const result = game.answer(genre);
        if (result === "ignored") return;
        playSound(result === "correct");
        paintOptions();
        if (result === "retry") {
            feedback("TENTE MAIS UMA VEZ!", "ESSA OPÇÃO FOI ELIMINADA. ESCOLHA OUTRA.", "error");
            button.classList.remove("shake"); void button.offsetWidth; button.classList.add("shake");
            options.querySelector("button:not(:disabled)")?.focus({ preventScroll: true });
        } else {
            feedback(result === "correct" ? "ACERTOU!" : `A RESPOSTA É: ${genres[game.current.genre].label}`, genres[game.current.genre].clue, result === "correct" ? "success" : "error");
            if (result === "correct") celebrate();
            else { question.classList.add("shake"); }
            startCountdown(result === "correct" ? 5000 : 4500);
        }
    }
    function loadCard() {
        const token = ++loadToken;
        ready = false; paintOptions();
        question.setAttribute("aria-busy", "true");
        $("loadStatus").hidden = false;
        $("loadStatus").textContent = "CARREGANDO TEXTO…";
        $("retryLoadBtn").hidden = true;
        $("enlargeBtn").disabled = true; $("zoomBtn").disabled = true;
        image.hidden = true;
        const loader = new Image();
        loader.onload = () => {
            if (token !== loadToken) return;
            image.src = loader.src; image.hidden = false;
            ready = true; question.setAttribute("aria-busy", "false");
            $("loadStatus").hidden = true;
            $("enlargeBtn").disabled = false; $("zoomBtn").disabled = false;
            paintOptions();
        };
        loader.onerror = () => {
            if (token !== loadToken) return;
            question.setAttribute("aria-busy", "false");
            $("loadStatus").textContent = "NÃO FOI POSSÍVEL CARREGAR A IMAGEM.";
            $("retryLoadBtn").hidden = false;
        };
        loader.src = `../../assets/generos-textuais/${game.current.file}`;
    }
    function nextQuestion(moveFocus = false) {
        cancelAnimationFrame(frame);
        game.next();
        question.className = `question${game.current.width > game.current.height * 1.7 ? " wide" : ""}`;
        $("confetti").replaceChildren();
        $("advanceNote").hidden = true;
        $("round").textContent = `TEXTO ${game.round}`;
        feedback("LEIA E ESCOLHA.", "VOCÊ TEM DUAS TENTATIVAS.");
        options.replaceChildren();
        game.options.forEach((genre, index) => {
            const button = document.createElement("button");
            button.type = "button"; button.className = "option"; button.dataset.genre = genre;
            const letter = document.createElement("span"); letter.className = "letter"; letter.textContent = String.fromCharCode(65 + index); letter.setAttribute("aria-hidden", "true");
            const label = document.createElement("span"); label.className = "answer-label"; label.textContent = genres[genre].label;
            button.append(letter, label);
            button.addEventListener("click", () => choose(genre, button));
            options.append(button);
        });
        loadCard();
        if (moveFocus) {
            $("questionTitle").focus({ preventScroll: true });
            window.scrollTo({ top: 0, behavior: "instant" });
        }
    }
    function zoom() {
        if (!ready) return;
        $("zoomImage").src = image.src;
        $("transcript").textContent = game.current.text;
        $("transcript").parentElement.hidden = !game.current.text;
        $("transcript").parentElement.open = false;
        dialog.showModal();
    }
    $("enlargeBtn").addEventListener("click", zoom);
    $("zoomBtn").addEventListener("click", zoom);
    $("closeZoomBtn").addEventListener("click", () => dialog.close());
    $("retryLoadBtn").addEventListener("click", loadCard);
    $("soundBtn").addEventListener("click", () => {
        sound = !sound; syncSound();
        if (!sound && audio) audio.suspend().catch(() => {});
        try { localStorage.setItem("jojo-generos-sound", sound ? "on" : "off"); } catch (_) { /* Optional preference. */ }
    });
    $("fullscreenBtn").addEventListener("click", async () => {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.documentElement.requestFullscreen();
        } catch (_) { feedback("TELA CHEIA INDISPONÍVEL.", "VOCÊ PODE CONTINUAR JOGANDO NESTA TELA."); }
    });
    document.addEventListener("fullscreenchange", () => {
        const label = document.fullscreenElement ? "Sair da tela cheia" : "Entrar em tela cheia";
        $("fullscreenBtn").setAttribute("aria-label", label);
        $("fullscreenBtn").title = label;
        // Entering fullscreen can retain the pre-existing scroll offset.
        requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    });
    if (!document.documentElement.requestFullscreen) $("fullscreenBtn").hidden = true;
    const intro = $("introDialog"), video = $("introVideo"), playIntro = $("playIntroBtn");
    let started = false;
    function startGame() {
        if (started) return;
        started = true;
        // Cancel any download and release the decoder when the introduction closes.
        video.pause();
        video.removeAttribute("src");
        video.load();
        nextQuestion(true);
    }
    playIntro.addEventListener("click", async () => {
        // No MP4 request until the user chooses to watch.
        if (!video.hasAttribute("src")) video.src = "../../assets/videos/jojo-generos-textuais.mp4";
        video.controls = true;
        playIntro.hidden = true;
        $("introStatus").textContent = "VOCÊ PODE PULAR QUANDO QUISER.";
        try {
            await video.play();
            if (intro.open) video.focus();
        } catch (_) {
            if (!intro.open) return;
            playIntro.hidden = false;
            $("introStatus").textContent = "TOQUE EM ASSISTIR PARA REPRODUZIR OU PULE PARA JOGAR.";
        }
    });
    video.addEventListener("error", () => {
        if (!intro.open || !video.hasAttribute("src")) return;
        $("introStatus").textContent = "NÃO FOI POSSÍVEL ABRIR O VÍDEO. VOCÊ PODE PULAR E JOGAR.";
    });
    video.addEventListener("ended", () => intro.close());
    $("skipIntroBtn").addEventListener("click", () => intro.close());
    // Escape, skipping, and natural completion all start exactly one round.
    intro.addEventListener("close", startGame);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && intro.open) video.pause();
    });
    syncSound();
    intro.showModal();
})();
