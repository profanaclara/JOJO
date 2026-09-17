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
