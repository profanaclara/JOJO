const fs = require("node:fs");
const path = require("node:path");

const ROOT_FILES = new Set([
    "index.html", "404.html", "ajuda.html", "offline.html", "privacidade.html", "service-worker.js",
    "manifest.webmanifest", "robots.txt", "sitemap.xml", "llms.txt", "CNAME", ".nojekyll"
]);
const GAMES = new Set([
    "palavras", "textos", "generos-textuais", "popit-soma", "popit-subtracao",
    "tabuada-pitagoras", "timer", "cabo-de-guerra-operacoes-fracoes",
    "cabo-de-guerra", "cabo-de-guerra-fracoes"
]);
const MEDIA = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".ico", ".woff", ".woff2", ".mp3", ".mp4", ".ogg", ".wav", ".webm"]);

function isPublicFile(relativePath) {
    const parts = relativePath.replace(/\\/g, "/").split("/");
    const name = parts.join("/");
    if (ROOT_FILES.has(name)) return true;
    if (parts.some(part => part.startsWith(".") || part.startsWith("_") || part === "node_modules")) return false;
    const extension = path.extname(name).toLowerCase();
    if (parts[0] === "assets") {
        return MEDIA.has(extension) || ["assets/vendor/jspdf/jspdf.umd.min.js", "assets/vendor/jspdf/LICENSE"].includes(name);
    }
    if (parts[0] === "styles") return parts.length === 2 && extension === ".css";
    if (parts[0] === "scripts") return ["scripts/app.js", "scripts/data.js", "scripts/pwa.js", "scripts/lib/jogo-utils.js"].includes(name);
    if (parts[0] === "agenda") return ["agenda/index.html", "agenda/app.js", "agenda/styles.css"].includes(name);
    if (parts[0] !== "jogos") return false;
    if (parts.length === 2) return ["index.html", "jogos.css", "jogos.js", "jogos.data.js"].includes(parts[1]);
    if (!GAMES.has(parts[1])) return false;
    if (parts.length === 3) return [".html", ".css", ".js"].includes(extension);
    return parts[2] === "assets" && MEDIA.has(extension);
}

function prepareSite(root, output = path.join(root, "_site")) {
    // Never merge with an old artifact, which might contain unpublished files.
    if (fs.existsSync(output)) throw new Error("A pasta de saída já existe. Escolha outra pasta para preservar o artefato anterior.");
    const files = [];
    function walk(directory, prefix = "") {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const name = prefix + entry.name;
            if (entry.isSymbolicLink()) continue;
            if (entry.isDirectory()) {
                if (!prefix && !["assets", "styles", "scripts", "agenda", "jogos"].includes(entry.name)) continue;
                if (entry.name.startsWith(".") || entry.name.startsWith("_") || entry.name === "node_modules") continue;
                if (prefix === "jogos/" && !GAMES.has(entry.name)) continue;
                walk(path.join(directory, entry.name), name + "/");
            } else if (entry.isFile() && isPublicFile(name)) files.push(name);
        }
    }
    walk(root);
    for (const name of ROOT_FILES) {
        if (!files.includes(name)) throw new Error(`Arquivo obrigatório ausente: ${name}`);
    }
    fs.mkdirSync(output, { recursive: true });
    for (const name of files) {
        const destination = path.join(output, name);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.copyFileSync(path.join(root, name), destination);
    }
    return files;
}

module.exports = { isPublicFile, prepareSite };
if (require.main === module) {
    const root = path.resolve(__dirname, "..");
    const output = path.resolve(root, process.argv[2] || "_site");
    const files = prepareSite(root, output);
    console.log(`${files.length} arquivos públicos preparados em ${output}.`);
}
