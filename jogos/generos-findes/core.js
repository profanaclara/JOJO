(function (root) {
    "use strict";
    const genres = {
    "hq": {
        "label": "HQ"
    },
    "tirinha": {
        "label": "TIRINHA"
    },
    "fabula": {
        "label": "FÁBULA"
    },
    "cronica": {
        "label": "CRÔNICA"
    },
    "noticia": {
        "label": "NOTÍCIA"
    },
    "teatral": {
        "label": "TEXTO TEATRAL"
    },
    "poema": {
        "label": "POEMA"
    },
    "reportagem": {
        "label": "REPORTAGEM"
    },
    "cientifico": {
        "label": "ARTIGO DE DIVULGAÇÃO CIENTÍFICA"
    },
    "conto": {
        "label": "CONTO"
    }
};
    function shuffle(values, random = Math.random) {
        const result = [...values];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    class Game {
        constructor(items, random = Math.random) {
            if (!items.length) throw new Error("Acervo vazio");
            this.items = items;
            this.random = random;
            this.deck = [];
            this.round = 0;
            this.hits = 0;
            this.current = null;
        }
        next() {
            if (!this.deck.length) {
                this.deck = shuffle(this.items, this.random);
            }
            const counts = new Map();
            this.deck.forEach(item => counts.set(item.genre, (counts.get(item.genre) || 0) + 1));
            const remaining = this.deck.length - 1;
            // Leave enough other genres to separate the remaining cards, including
            // at the end of a cycle. Layout variants also share the same genre.
            let index = this.deck.findIndex(item => item.genre !== this.current?.genre &&
                [...counts].every(([genre, count]) => genre === item.genre
                    ? count - 1 <= Math.floor(remaining / 2)
                    : count <= Math.ceil(remaining / 2)));
            // Keep playing if a future filtered collection cannot be interleaved.
            if (index < 0) index = this.deck.findIndex(item => item.genre !== this.current?.genre);
            if (index < 0) index = this.deck.findIndex(item => item.id !== this.current?.id);
            this.current = this.deck.splice(Math.max(0, index), 1)[0];
            this.options = shuffle([this.current.genre, ...shuffle(Object.keys(genres).filter(g => g !== this.current.genre && !(["hq", "tirinha"].includes(this.current.genre) && ["hq", "tirinha"].includes(g))), this.random).slice(0, 3)], this.random);
            this.eliminated = new Set();
            this.phase = "answering";
            this.round++;
            return this.current;
        }
        answer(genre) {
            if (this.phase !== "answering" || !this.options.includes(genre) || this.eliminated.has(genre)) return "ignored";
            if (genre === this.current.genre) {
                this.hits++;
                this.phase = "correct";
                return "correct";
            }
            this.eliminated.add(genre);
            if (this.eliminated.size === 2) {
                this.phase = "revealed";
                return "revealed";
            }
            return "retry";
        }
    }
    const api = { Game, genres, shuffle };
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    else root.JojoQuiz = api;
})(typeof window !== "undefined" ? window : globalThis);
