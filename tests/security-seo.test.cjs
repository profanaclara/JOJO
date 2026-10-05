const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const vm = require("node:vm");
const { createHash } = require("node:crypto");
const { isPublicFile, prepareSite } = require("../scripts/prepare-site.cjs");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8").replace(/\r\n/g, "\n");
const sitemap = [...read("sitemap.xml").matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
const htmlFiles = sitemap.map(url => {
    const pathname = new URL(url).pathname.slice(1);
    return pathname.endsWith("/") || !pathname ? pathname + "index.html" : pathname;
}).concat(["404.html", "offline.html", "jogos/cabo-de-guerra/index.html", "jogos/cabo-de-guerra-fracoes/index.html", "jogos/cabo-de-guerra-operacoes-fracoes/gif-frame.html"]);

test("publication excludes drafts, credentials and development files", () => {
    for (const file of [".env", "assets/.env.local", "assets/key.pem", "assets/debug.html", "scripts/compress-images.py", "tests/security-seo.test.cjs", "referencias/original.html", "jogos/jojo-cidade/index.html", "jogos/timer/_dev/fonte-original.html", ".git/config", "_local/student.json", "Claude outputs/prompt.md"]) {
        assert.equal(isPublicFile(file), false, file);
    }
    for (const file of [...htmlFiles, "assets/vendor/jspdf/jspdf.umd.min.js", "assets/vendor/jspdf/LICENSE", "jogos/cabo-de-guerra-operacoes-fracoes/assets/cabo-de-guerra-2.gif", "scripts/lib/jogo-utils.js", "sitemap.xml"]) {
        assert.equal(isPublicFile(file), true, file);
    }
});

test("publication artifact contains only allowed files and refuses a stale output", () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "jojo-publication-"));
    try {
        const names = ["index.html", "404.html", "ajuda.html", "offline.html", "privacidade.html", "service-worker.js", "manifest.webmanifest", "robots.txt", "sitemap.xml", "llms.txt", "CNAME", ".nojekyll", "jogos/timer/app.js", "jogos/timer/_dev/secret.html", "assets/.env", "jogos/jojo-cidade/index.html", ".env", "docs/private.md"];
        for (const name of names) {
            fs.mkdirSync(path.dirname(path.join(fixture, name)), { recursive: true });
            fs.writeFileSync(path.join(fixture, name), name);
        }
        const files = prepareSite(fixture);
        assert.deepEqual(files.sort(), names.filter(isPublicFile).sort());
        assert.equal(fs.readFileSync(path.join(fixture, "_site/jogos/timer/app.js"), "utf8"), "jogos/timer/app.js");
        assert.equal(fs.existsSync(path.join(fixture, "_site/.env")), false);
        assert.throws(() => prepareSite(fixture), /já existe/);
    } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
    }
});

test("all public pages restrict scripts and authorize only their existing inline blocks", () => {
    for (const file of htmlFiles) {
        const html = read(file);
        const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/i)?.[1];
        assert.ok(policy, file);
        const scripts = policy.split(";").find(part => part.trim().startsWith("script-src ")).trim();
        assert.match(scripts, /^script-src 'self'(?: 'sha256-[\w+/=]+')*$/);
        for (const directive of ["script-src-attr 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'self'"]) assert.ok(policy.includes(directive), file);
        assert.ok(html.indexOf('http-equiv="Content-Security-Policy"') < html.indexOf("<script") || !html.includes("<script"), file);
        for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
            if (/\bsrc=/.test(attrs)) continue;
            const hash = createHash("sha256").update(body).digest("base64");
            assert.ok(scripts.includes(`'sha256-${hash}'`), `${file}: inline script changed without updating CSP`);
        }
        assert.doesNotMatch(html, /\son(?:click|load|error)\s*=/i, file);
    }
});

test("sitemap entries resolve to published canonical pages and the static directory links them", () => {
    assert.equal(new Set(sitemap).size, sitemap.length);
    const directory = read("jogos/index.html");
    for (const url of sitemap) {
        assert.equal(new URL(url).origin, "https://jojo.profanaclara.com.br");
        const pathname = new URL(url).pathname.slice(1);
        const file = pathname.endsWith("/") || !pathname ? pathname + "index.html" : pathname;
        const html = read(file);
        assert.ok(isPublicFile(file));
        assert.ok(html.includes(`<link rel="canonical" href="${url}">`), file);
        assert.match(html, /<meta name="description" content="[^"]+"/);
        assert.doesNotMatch(html, /name="robots" content="[^"]*noindex/);
        if (pathname.startsWith("jogos/") && pathname !== "jogos/") {
            assert.ok(directory.includes(`href="./${pathname.slice(6)}"`), pathname);
        }
    }
    assert.ok(read("robots.txt").includes("Sitemap: https://jojo.profanaclara.com.br/sitemap.xml"));
    assert.ok(read("llms.txt").includes("/jogos/generos-textuais/"));
});

test("agenda escapes stored dates before putting them in HTML attributes", () => {
    const source = read("agenda/app.js");
    function definition(name) {
        const start = source.indexOf(`function ${name}(`);
        const end = source.indexOf("\nfunction ", start + 1);
        return source.slice(start, end < 0 ? undefined : end);
    }
    const attack = '\"><img src=x onerror="window.compromised=1">';
    const record = { date: attack, key: "record", mood: [], activityStatus: "" };
    const context = {
        ui: { historyMonth: {}, historyCount: {}, historyList: {} },
        state: { historyMonth: "all", reportDates: new Set(), activeRecordKey: "" },
        recordsForStudent: () => [record], filteredRecords: () => [record],
        monthLabel: value => value, dayLabel: value => value,
        renderRecordPreview() {}, renderReportBuilder() {}
    };
    vm.runInNewContext(["escapeHtml", "renderHistoryMonths", "renderHistory"].map(definition).join("\n"), context);
    context.renderHistoryMonths();
    context.renderHistory();
    assert.doesNotMatch(context.ui.historyMonth.innerHTML, /<img/);
    assert.doesNotMatch(context.ui.historyList.innerHTML, /<img/);
    assert.ok(context.ui.historyList.innerHTML.includes("data-select-date=\"&quot;&gt;&lt;img"));
});

test("public navigation and assets resolve even on a deeply nested 404 URL", () => {
    for (const file of htmlFiles) {
        const base = new URL(file === "404.html" ? "missing/nested/page/" : file, "https://jojo.profanaclara.com.br/");
        const html = read(file);
        for (const [, link] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
            const url = new URL(link, base);
            if (url.origin !== base.origin) continue;
            let target = decodeURIComponent(url.pathname.slice(1));
            if (!target || target.endsWith("/")) target += "index.html";
            assert.ok(fs.existsSync(path.join(root, target)), `${file}: ${link}`);
            assert.ok(isPublicFile(target), `${file}: unpublished target ${target}`);
        }
    }
    assert.match(read("404.html"), /name="robots" content="noindex, follow"/);
    assert.ok(!sitemap.some(url => url.endsWith("/404.html")));
});

test("indexed pages have unique titles and complete sharing metadata", () => {
    const titles = new Set();
    for (const url of sitemap) {
        let file = new URL(url).pathname.slice(1);
        if (!file || file.endsWith("/")) file += "index.html";
        const html = read(file);
        const title = html.match(/<title>(.*?)<\/title>/)[1];
        assert.ok(!titles.has(title), `Duplicate title: ${title}`);
        titles.add(title);
        for (const property of ["og:title", "og:description", "og:image", "og:image:width", "og:image:height", "og:image:alt"]) {
            assert.ok(html.includes(`property="${property}" content="`), `${file}: ${property}`);
        }
        for (const name of ["twitter:card", "twitter:title", "twitter:description", "twitter:image", "twitter:image:alt"]) {
            assert.ok(html.includes(`name="${name}" content="`), `${file}: ${name}`);
        }
        for (const [image] of html.matchAll(/<img\b[^>]*>/g)) assert.match(image, /\balt="[^"]*"/, file);
    }
});
