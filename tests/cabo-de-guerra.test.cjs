const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

// Exercise the actual input handler without starting the browser UI or timers.
function game() {
    const context = vm.createContext({
        document: {
            getElementById: () => null,
            querySelector: () => null,
            querySelectorAll: () => [],
        },
    });
    const source = readFileSync(join(__dirname, "../jogos/cabo-de-guerra-operacoes-fracoes/app.js"), "utf8");
    vm.runInContext(source.replace(/init\(\);\s*$/, ""), context);
    vm.runInContext(`
        renderAnswerBuffers = () => {};
        playTone = () => {};
        applyOutcome = (side, correct) => { globalThis.outcome = { side, correct }; };
        state.setupOpen = false;
        state.game.inRound = true;
    `, context);
    return context;
}

for (const [numerator, denominator] of [[1, 2], [1, 12], [9, 10], [10, 12], [11, 12]]) {
    test(`accepts the complete fraction ${numerator}/${denominator}`, () => {
        const context = game();
        vm.runInContext(`
            state.config.contentMode = "fraction";
            state.game.problems.left = { numerator: ${numerator}, denominator: ${denominator} };
            state.game.answerBuffers.left = createFractionAnswerBuffer();
            for (const key of "${numerator}${denominator}") handleKeypadPress("left", key);
            handleKeypadPress("left", "submit");
        `, context);
        assert.equal(context.outcome?.correct, true);
    });
}

test("incomplete and incorrect fractions do not earn a point", () => {
    const context = game();
    vm.runInContext(`
        state.config.contentMode = "fraction";
        state.game.problems.left = { numerator: 10, denominator: 12 };
        state.game.answerBuffers.left = createFractionAnswerBuffer();
        handleKeypadPress("left", "1");
        handleKeypadPress("left", "submit");
    `, context);
    assert.equal(context.outcome, undefined);
    vm.runInContext(`
        for (const key of "112") handleKeypadPress("left", key);
        handleKeypadPress("left", "submit");
    `, context);
    assert.equal(context.outcome.correct, false);
});

test("operations still accept a multi-digit answer", () => {
    const context = game();
    vm.runInContext(`
        state.game.problems.right = { answer: 12 };
        for (const key of "12") handleKeypadPress("right", key);
        handleKeypadPress("right", "submit");
    `, context);
    assert.equal(context.outcome?.correct, true);
    assert.equal(context.outcome.side, "right");
});
