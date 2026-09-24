const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const { Game, genres } = require("../jogos/generos-textuais/core.js");
const context = { window: {} };
vm.runInNewContext(readFileSync(join(__dirname, "../jogos/generos-textuais/data.js"), "utf8"), context);
const items = context.window.JOJO_GENEROS;

test("all 75 cards exist and have a valid genre; no alternate draft duplicates", () => {
    assert.equal(items.length, 75);
    assert.equal(new Set(items.map(i => i.file)).size, 75);
    for (const item of items) {
        assert.ok(genres[item.genre]);
        assert.ok(existsSync(join(__dirname, "../assets/generos-textuais", item.file)), item.file);
    }
});
test("infinite shuffled rounds exhaust the deck before repeating and don't repeat across cycles", () => {
    const game = new Game(items);
    let last;
    for (let cycle = 0; cycle < 3; cycle++) {
        const seen = new Set();
        for (let i = 0; i < items.length; i++) {
            game.next();
            assert.notEqual(game.current.id, last);
            assert.ok(!seen.has(game.current.id));
            seen.add(game.current.id); last = game.current.id;
            assert.equal(new Set(game.options).size, 4);
            assert.ok(game.options.includes(game.current.genre));
        }
    }
    assert.equal(game.round, 225);
});
test("first error eliminates only that option; a repeated click cannot consume the second chance", () => {
    const game = new Game(items); game.next();
    const wrong = game.options.find(g => g !== game.current.genre);
    assert.equal(game.answer(wrong), "retry");
    assert.equal(game.answer(wrong), "ignored");
    assert.equal(game.eliminated.size, 1);
    assert.equal(game.phase, "answering");
    assert.equal(game.answer(game.current.genre), "correct");
    assert.equal(game.hits, 1);
    assert.equal(game.answer(game.current.genre), "ignored");
    assert.equal(game.hits, 1);
});
test("never repeats a genre consecutively, even at deck boundaries and near exhaustion", () => {
    for (let seed = 1; seed <= 100; seed++) {
        let state = seed;
        const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
        const game = new Game(items, random);
        let previous;
        for (let cycle = 0; cycle < 3; cycle++) {
            const seen = new Set();
            for (let i = 0; i < items.length; i++) {
                const card = game.next();
                assert.notEqual(card.genre, previous, `seed ${seed}, round ${game.round}`);
                assert.ok(!seen.has(card.id));
                seen.add(card.id);
                previous = card.genre;
            }
        }
    }
});
test("a single-genre collection still progresses without immediately repeating a card", () => {
    const game = new Game(items.filter(i => i.genre === "conto"));
    let previous;
    for (let i = 0; i < 40; i++) {
        const card = game.next();
        assert.notEqual(card.id, previous);
        previous = card.id;
    }
});
test("second distinct error reveals correct answer, locks round, then resets both chances", () => {
    const game = new Game(items); game.next();
    const wrong = game.options.filter(g => g !== game.current.genre);
    assert.equal(game.answer(wrong[0]), "retry");
    assert.equal(game.answer(wrong[1]), "revealed");
    assert.equal(game.answer(game.current.genre), "ignored");
    assert.equal(game.hits, 0);
    game.next();
    assert.equal(game.phase, "answering");
    assert.equal(game.eliminated.size, 0);
    assert.equal(game.answer("unknown"), "ignored");
});
