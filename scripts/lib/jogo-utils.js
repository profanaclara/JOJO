// Utilitarios compartilhados entre os jogos da JOJO.
// Extraido de jogos/popit-soma/app.js, jogos/popit-subtracao/app.js e
// jogos/tabuada-pitagoras/app.js, onde a mesma logica existia copiada em cada arquivo.
// Comportamento identico ao codigo original - so o local do codigo mudou.

function formatTarget(value) {
    return value === null ? "?" : value;
}

function clampInt(value, min, max) {
    const number = Number.parseInt(String(value), 10);
    if (Number.isNaN(number)) {
        return null;
    }
    return Math.max(min, Math.min(max, number));
}

// Extraido de jogos/palavras/app.js e jogos/textos/app.js (identico nos dois,
// exceto que textos tinha o parametro "delay" - mantido aqui, com o mesmo
// default de 0 usado implicitamente em palavras).
// Depende de "state.audioContext" e "state.soundEnabled", declarados no
// app.js de cada jogo - funciona porque essas funcoes so sao chamadas depois
// que o app.js correspondente carregou e criou "state".

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
