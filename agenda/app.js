const STORAGE = {
    records: "jojo_agenda_records_v2",
    students: "jojo_agenda_students_v2",
    recorder: "jojo_agenda_recorder_v1",
    recipient: "jojo_agenda_recipient_v1"
};

const DEFAULTS = {
    mood: ["Tranquilo"],
    arrival: "Bem",
    departure: "Bem",
    activityStatus: "Todas",
    appetite: "Normal"
};

const STEP_TITLES = [
    "Dados do registro",
    "Humor",
    "Entrada e saída",
    "Rotina",
    "Atividades",
    "Comportamentos",
    "Apetite e reforçador",
    "Anotações"
];

const ui = {
    formView: document.getElementById("formView"),
    historyView: document.getElementById("historyView"),
    newRecordTab: document.getElementById("newRecordTab"),
    historyTab: document.getElementById("historyTab"),
    form: document.getElementById("agendaForm"),
    steps: [...document.querySelectorAll(".wizard-step")],
    stepCounter: document.getElementById("stepCounter"),
    stepTitle: document.getElementById("stepTitle"),
    stepDots: document.getElementById("stepDots"),
    previousStepBtn: document.getElementById("previousStepBtn"),
    nextStepBtn: document.getElementById("nextStepBtn"),
    saveRecordBtn: document.getElementById("saveRecordBtn"),
    clearFormBtn: document.getElementById("clearFormBtn"),
    formStatus: document.getElementById("formStatus"),
    studentName: document.getElementById("studentName"),
    studentOptions: document.getElementById("studentOptions"),
    recordDate: document.getElementById("recordDate"),
    dailyRecordDate: document.getElementById("dailyRecordDate"),
    recorderName: document.getElementById("recorderName"),
    notes: document.getElementById("notes"),
    historyStudent: document.getElementById("historyStudent"),
    historySearch: document.getElementById("historySearch"),
    historyMonth: document.getElementById("historyMonth"),
    historyCount: document.getElementById("historyCount"),
    historyList: document.getElementById("historyList"),
    recordPreview: document.getElementById("recordPreview"),
    reportBuilder: document.getElementById("reportBuilder"),
    studentDialog: document.getElementById("studentDialog"),
    manageStudentsBtn: document.getElementById("manageStudentsBtn"),
    newStudentName: document.getElementById("newStudentName"),
    addStudentBtn: document.getElementById("addStudentBtn"),
    studentList: document.getElementById("studentList")
};

const state = {
    records: migrateRecords(),
    students: [],
    step: 0,
    activeStudent: "",
    activeRecordKey: "",
    historyQuery: "",
    historyMonth: "all",
    reportMode: "dates",
    reportDates: new Set(),
    reportAnchor: ""
};

state.students = migrateStudents();

function readJson(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function normalizeName(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeSearch(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function studentKey(value) {
    return normalizeSearch(normalizeName(value));
}

function todayIso() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDate(value) {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
}

function monthLabel(value) {
    return new Date(`${value}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function dayLabel(value) {
    const day = new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    return `${formatDate(value)} · ${day}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function normalizeArray(value) {
    if (Array.isArray(value)) return [...new Set(value.map(normalizeName).filter(Boolean))];
    const item = normalizeName(value);
    return item ? [item] : [];
}

function migrateRecords() {
    const source = readJson(STORAGE.records, readJson("jojo_agenda_records_v1", []));
    const records = Array.isArray(source) ? source.map((record) => {
        const student = normalizeName(record.student || record.studentName);
        const date = record.date || record.recordDate || todayIso();
        return {
            key: `${studentKey(student)}::${date}`,
            student,
            date,
            recorder: normalizeName(record.recorder || record.recorderName),
            mood: normalizeArray(record.mood || DEFAULTS.mood),
            arrival: record.arrival || DEFAULTS.arrival,
            departure: record.departure || DEFAULTS.departure,
            activityStatus: record.activityStatus || DEFAULTS.activityStatus,
            appetite: record.appetite || DEFAULTS.appetite,
            flags: normalizeArray(record.flags),
            notes: String(record.notes || "").trim(),
            updatedAt: record.updatedAt || new Date().toISOString()
        };
    }).filter((record) => record.student && record.date) : [];
    const unique = [...new Map(records.map((record) => [record.key, record])).values()];
    writeJson(STORAGE.records, unique);
    return unique;
}

function migrateStudents() {
    const stored = readJson(STORAGE.students, readJson("jojo_agenda_students_v1", []));
    const names = [...(Array.isArray(stored) ? stored : []), ...state.records.map((record) => record.student)]
        .map(normalizeName)
        .filter(Boolean);
    const unique = [...new Map(names.map((name) => [studentKey(name), name])).values()];
    writeJson(STORAGE.students, unique);
    return unique;
}

function addStudent(name) {
    const normalized = normalizeName(name);
    if (!normalized) return false;
    state.students = [normalized, ...state.students.filter((item) => studentKey(item) !== studentKey(normalized))].slice(0, 80);
    writeJson(STORAGE.students, state.students);
    renderStudentControls();
    return true;
}

function recordsForStudent(name = state.activeStudent) {
    return state.records
        .filter((record) => studentKey(record.student) === studentKey(name))
        .sort((a, b) => b.date.localeCompare(a.date));
}

function currentFormKey() {
    return `${studentKey(ui.studentName.value)}::${ui.recordDate.value}`;
}

function selectedValue(group) {
    return document.querySelector(`[data-group="${group}"].is-active`)?.dataset.value || "";
}

function selectedValues(group) {
    return [...document.querySelectorAll(`[data-group="${group}"].is-active`)].map((button) => button.dataset.value);
}

function selectedFlags() {
    return [...document.querySelectorAll(".flag.is-active")].map((button) => button.dataset.flag);
}

function setGroup(group, value) {
    const values = group === "mood" ? new Set(normalizeArray(value)) : new Set([value || DEFAULTS[group]]);
    document.querySelectorAll(`[data-group="${group}"]`).forEach((button) => {
        button.classList.toggle("is-active", values.has(button.dataset.value));
    });
}

function setFlags(flags) {
    const values = new Set(normalizeArray(flags));
    document.querySelectorAll(".flag").forEach((button) => button.classList.toggle("is-active", values.has(button.dataset.flag)));
}

function updateDateHint() {
    const date = ui.recordDate.value;
    ui.dailyRecordDate.textContent = date === todayIso() ? `Hoje · ${formatDate(date)}` : formatDate(date);
}

function renderSteps() {
    ui.steps.forEach((step, index) => step.classList.toggle("is-active", index === state.step));
    ui.stepCounter.textContent = `Etapa ${state.step + 1} de ${STEP_TITLES.length}`;
    ui.stepTitle.textContent = STEP_TITLES[state.step];
    ui.stepDots.innerHTML = STEP_TITLES.map((_, index) => `<span class="step-dot${index < state.step ? " is-complete" : ""}${index === state.step ? " is-active" : ""}"></span>`).join("");
    ui.previousStepBtn.disabled = state.step === 0;
    ui.nextStepBtn.classList.toggle("is-hidden", state.step === STEP_TITLES.length - 1);
    ui.saveRecordBtn.classList.toggle("is-hidden", state.step !== STEP_TITLES.length - 1);
    ui.formStatus.textContent = "";
}

function validateFirstStep() {
    if (!normalizeName(ui.studentName.value) || !ui.recordDate.value || !normalizeName(ui.recorderName.value)) {
        ui.formStatus.textContent = "Preencha aluno, data e registrador para continuar.";
        return false;
    }
    addStudent(ui.studentName.value);
    localStorage.setItem(STORAGE.recorder, normalizeName(ui.recorderName.value));
    return true;
}

function moveStep(direction) {
    if (direction > 0 && state.step === 0 && !validateFirstStep()) return;
    state.step = Math.max(0, Math.min(STEP_TITLES.length - 1, state.step + direction));
    renderSteps();
}

function clearForm(keepIdentity = true) {
    setGroup("mood", DEFAULTS.mood);
    setGroup("arrival", DEFAULTS.arrival);
    setGroup("departure", DEFAULTS.departure);
    setGroup("activityStatus", DEFAULTS.activityStatus);
    setGroup("appetite", DEFAULTS.appetite);
    setFlags([]);
    ui.notes.value = "";
    if (!keepIdentity) {
        ui.studentName.value = "";
        ui.recordDate.value = todayIso();
    }
    ui.formStatus.textContent = "";
    updateDateHint();
}

function loadRecordIntoForm(record) {
    if (!record) return;
    ui.studentName.value = record.student;
    ui.recordDate.value = record.date;
    ui.recorderName.value = record.recorder || ui.recorderName.value;
    setGroup("mood", record.mood);
    setGroup("arrival", record.arrival);
    setGroup("departure", record.departure);
    setGroup("activityStatus", record.activityStatus);
    setGroup("appetite", record.appetite);
    setFlags(record.flags);
    ui.notes.value = record.notes || "";
    updateDateHint();
}

function loadExistingDay() {
    const record = state.records.find((item) => item.key === currentFormKey());
    if (record) loadRecordIntoForm(record);
    else clearForm(true);
}

function showView(name) {
    const history = name === "history";
    ui.formView.classList.toggle("is-hidden", history);
    ui.historyView.classList.toggle("is-hidden", !history);
    ui.newRecordTab.classList.toggle("is-active", !history);
    ui.historyTab.classList.toggle("is-active", history);
    ui.newRecordTab.setAttribute("aria-selected", String(!history));
    ui.historyTab.setAttribute("aria-selected", String(history));
    if (history) prepareHistory();
    window.scrollTo({ top: 0, behavior: "instant" });
}

function saveRecord(event) {
    event.preventDefault();
    if (!validateFirstStep()) {
        state.step = 0;
        renderSteps();
        return;
    }

    const student = normalizeName(ui.studentName.value);
    const date = ui.recordDate.value;
    const record = {
        key: `${studentKey(student)}::${date}`,
        student,
        date,
        recorder: normalizeName(ui.recorderName.value),
        mood: selectedValues("mood"),
        arrival: selectedValue("arrival"),
        departure: selectedValue("departure"),
        activityStatus: selectedValue("activityStatus"),
        appetite: selectedValue("appetite"),
        flags: selectedFlags(),
        notes: ui.notes.value.trim(),
        updatedAt: new Date().toISOString()
    };
    const index = state.records.findIndex((item) => item.key === record.key);
    if (index >= 0) state.records[index] = record;
    else state.records.push(record);
    writeJson(STORAGE.records, state.records);
    state.activeStudent = student;
    state.activeRecordKey = record.key;
    state.reportDates = new Set([record.date]);
    state.reportAnchor = record.date;
    showView("history");
}

function renderStudentControls() {
    ui.studentOptions.innerHTML = state.students.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("");
    const current = state.activeStudent || state.students[0] || "";
    ui.historyStudent.innerHTML = state.students.length
        ? state.students.map((name) => `<option value="${escapeHtml(name)}"${studentKey(name) === studentKey(current) ? " selected" : ""}>${escapeHtml(name)}</option>`).join("")
        : `<option value="">Nenhum aluno</option>`;
    ui.studentList.innerHTML = state.students.length
        ? state.students.map((name) => `<button type="button" data-dialog-student="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join("")
        : `<p>Nenhum aluno cadastrado.</p>`;
}

function prepareHistory() {
    if (!state.activeStudent) state.activeStudent = normalizeName(ui.studentName.value) || state.students[0] || "";
    const records = recordsForStudent();
    if (!state.activeRecordKey || !records.some((record) => record.key === state.activeRecordKey)) {
        state.activeRecordKey = records[0]?.key || "";
    }
    if (!state.reportDates.size && records[0]) state.reportDates.add(records[0].date);
    if (!state.reportAnchor && records[0]) state.reportAnchor = records[0].date;
    renderStudentControls();
    renderHistoryMonths();
    renderHistory();
}

function renderHistoryMonths() {
    const months = [...new Set(recordsForStudent().map((record) => record.date.slice(0, 7)))];
    if (state.historyMonth !== "all" && !months.includes(state.historyMonth)) state.historyMonth = "all";
    ui.historyMonth.innerHTML = `<option value="all">Todos os meses</option>${months.map((month) => `<option value="${month}"${state.historyMonth === month ? " selected" : ""}>${escapeHtml(monthLabel(month))}</option>`).join("")}`;
}

function filteredRecords() {
    const query = normalizeSearch(state.historyQuery);
    return recordsForStudent().filter((record) => {
        const monthMatch = state.historyMonth === "all" || record.date.startsWith(state.historyMonth);
        const content = normalizeSearch([record.date, formatDate(record.date), record.mood.join(" "), record.arrival, record.departure, record.activityStatus, record.appetite, record.flags.join(" "), record.notes].join(" "));
        return monthMatch && (!query || content.includes(query));
    });
}

function renderHistory() {
    const records = filteredRecords();
    ui.historyCount.textContent = `${records.length} ${records.length === 1 ? "registro" : "registros"}`;
    if (!records.length) {
        ui.historyList.innerHTML = `<div class="empty-card">Nenhum registro encontrado.</div>`;
    } else {
        let activeMonth = "";
        ui.historyList.innerHTML = records.map((record) => {
            const month = record.date.slice(0, 7);
            const heading = month !== activeMonth ? `<h3>${escapeHtml(monthLabel(month))}</h3>` : "";
            activeMonth = month;
            const summary = [record.mood.join(", "), record.activityStatus].filter(Boolean).join(" · ");
            return `${heading}<div class="record-row${record.key === state.activeRecordKey ? " is-active" : ""}">
                <button class="record-open" type="button" data-open-record="${escapeHtml(record.key)}"><strong>${escapeHtml(dayLabel(record.date))}</strong><span>${escapeHtml(summary)}</span></button>
                <button class="record-select${state.reportDates.has(record.date) ? " is-selected" : ""}" type="button" data-select-date="${record.date}" aria-label="${state.reportDates.has(record.date) ? "Remover" : "Incluir"} no relatório">${state.reportDates.has(record.date) ? "✓" : "+"}</button>
            </div>`;
        }).join("");
        ui.historyList.innerHTML = `<div class="month-group">${ui.historyList.innerHTML}</div>`;
    }
    renderRecordPreview();
    renderReportBuilder();
}

function activeRecord() {
    return state.records.find((record) => record.key === state.activeRecordKey) || recordsForStudent()[0] || null;
}

function recordTags(record) {
    if (!record) return [];
    return [
        record.mood.length ? `Humor: ${record.mood.join(", ")}` : "",
        `Chegou: ${record.arrival}`,
        `Saiu: ${record.departure}`,
        `Atividade: ${record.activityStatus}`,
        `Apetite: ${record.appetite}`,
        ...record.flags
    ].filter(Boolean);
}

function renderRecordPreview() {
    const record = activeRecord();
    if (!record) {
        ui.recordPreview.innerHTML = `<div class="empty-card">Selecione ou crie um registro.</div>`;
        return;
    }
    const updated = new Date(record.updatedAt);
    const updatedLabel = Number.isNaN(updated.getTime()) ? "-" : updated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    ui.recordPreview.innerHTML = `
        <header><div><p class="eyebrow">REGISTRO DO DIA</p><h2>${escapeHtml(record.student)}</h2></div><time>${escapeHtml(formatDate(record.date))}</time></header>
        <div class="record-meta"><div><span>Registrado por</span><strong>${escapeHtml(record.recorder || "-")}</strong></div><div><span>Atualizado</span><strong>${escapeHtml(updatedLabel)}</strong></div></div>
        <div class="tag-list">${recordTags(record).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        ${record.notes ? `<p class="record-note">${escapeHtml(record.notes)}</p>` : ""}
        <div class="preview-actions"><button class="button button--secondary" type="button" data-edit-record>Editar</button><button class="button button--primary" type="button" data-new-record>Novo registro</button></div>`;
}

function sameReportPeriod(recordDate, anchor, mode) {
    if (!recordDate || !anchor) return false;
    const record = new Date(`${recordDate}T12:00:00`);
    const base = new Date(`${anchor}T12:00:00`);
    if (mode === "monthly") return record.getFullYear() === base.getFullYear() && record.getMonth() === base.getMonth();
    const start = new Date(base);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return record >= start && record <= end;
}

function selectedReportRecords() {
    const records = recordsForStudent();
    if (state.reportMode === "dates") return records.filter((record) => state.reportDates.has(record.date)).sort((a, b) => a.date.localeCompare(b.date));
    return records.filter((record) => sameReportPeriod(record.date, state.reportAnchor, state.reportMode)).sort((a, b) => a.date.localeCompare(b.date));
}

function reportSummary(records) {
    if (!records.length) return "Nenhum registro no período";
    if (records.length === 1) return formatDate(records[0].date);
    return `${formatDate(records[0].date)} a ${formatDate(records.at(-1).date)}`;
}

function renderReportBuilder() {
    const records = selectedReportRecords();
    const recipient = localStorage.getItem(STORAGE.recipient) || "";
    ui.reportBuilder.innerHTML = `
        <div class="report-heading"><div><p>RELATÓRIO</p><h2>Escolha o período</h2></div><span class="report-count">${records.length} ${records.length === 1 ? "dia" : "dias"}</span></div>
        <div class="report-tabs" role="group" aria-label="Período do relatório">
            <button class="${state.reportMode === "dates" ? "is-active" : ""}" type="button" data-report-mode="dates">Dias escolhidos</button>
            <button class="${state.reportMode === "weekly" ? "is-active" : ""}" type="button" data-report-mode="weekly">Semana inteira</button>
            <button class="${state.reportMode === "monthly" ? "is-active" : ""}" type="button" data-report-mode="monthly">Mês inteiro</button>
        </div>
        ${state.reportMode === "dates" ? `<p class="step-help">Use o botão <strong>+</strong> ao lado dos dias para montar o relatório.</p>` : `<label class="anchor-field"><span>${state.reportMode === "weekly" ? "Um dia da semana" : "Um dia do mês"}</span><input id="reportAnchor" type="date" value="${escapeHtml(state.reportAnchor || todayIso())}"></label>`}
        <div class="report-summary"><span>Período incluído</span><strong>${escapeHtml(reportSummary(records))}</strong><small>${records.length ? `${records.length} registro${records.length === 1 ? "" : "s"} selecionado${records.length === 1 ? "" : "s"}.` : "Selecione um período com registros."}</small></div>
        <label class="report-email"><span>Enviar relatório para</span><input id="reportEmail" type="email" value="${escapeHtml(recipient)}" placeholder="email@exemplo.com"></label>
        <div class="report-actions"><button class="button button--secondary" type="button" data-report-action="pdf">Baixar PDF</button><button class="button button--primary" type="button" data-report-action="email">Abrir e-mail</button></div>
        <p id="reportStatus" class="report-status" aria-live="polite"></p>`;
}

function buildReportPayload() {
    const records = selectedReportRecords();
    const email = normalizeName(document.getElementById("reportEmail")?.value || "");
    localStorage.setItem(STORAGE.recipient, email);
    return { student: state.activeStudent, email, records };
}

function reportStatus(message, isError = false) {
    const element = document.getElementById("reportStatus");
    if (!element) return;
    element.textContent = message;
    element.style.color = isError ? "#d64b62" : "#16886a";
}

function openReportEmail() {
    const payload = buildReportPayload();
    if (!payload.records.length) {
        reportStatus("Selecione pelo menos um registro.", true);
        return;
    }
    const subject = `Agenda JOJO - ${payload.student}`;
    const body = [`Olá,`, "", `Segue o relatório da Agenda JOJO de ${payload.student}.`, `Período: ${reportSummary(payload.records)}.`, "", "O PDF baixado deve ser anexado a este e-mail.", "", "Atenciosamente."].join("\n");
    window.location.href = `mailto:${encodeURIComponent(payload.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    reportStatus("E-mail aberto. Anexe o PDF baixado antes de enviar.");
}

function loadImageData(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            canvas.getContext("2d").drawImage(image, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        image.onerror = reject;
        image.src = url;
    });
}

async function downloadReportPdf() {
    const payload = buildReportPayload();
    if (!payload.records.length) {
        reportStatus("Selecione pelo menos um registro.", true);
        return;
    }
    if (!window.jspdf?.jsPDF) {
        reportStatus("Não foi possível iniciar o gerador de PDF.", true);
        return;
    }

    reportStatus("Gerando PDF...");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let watermark = "";
    try { watermark = await loadImageData("../assets/jojo-watermark.png"); } catch { watermark = ""; }
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    function addPageBase() {
        if (watermark) {
            const stateOpacity = new doc.GState({ opacity: 0.07 });
            doc.setGState(stateOpacity);
            doc.addImage(watermark, "PNG", (pageWidth - 82) / 2, (pageHeight - 82) / 2, 82, 82);
            doc.setGState(new doc.GState({ opacity: 1 }));
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(48, 139, 207);
        doc.text("JOJO | Plataforma de Jogos Educativos", 16, 11);
        doc.setDrawColor(218, 229, 242);
        doc.line(16, 15, pageWidth - 16, 15);
    }

    addPageBase();
    doc.setTextColor(18, 32, 64);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Relatório da Agenda", 16, 28);
    doc.setFontSize(12);
    doc.text(payload.student, 16, 37);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(101, 113, 138);
    doc.setFontSize(9);
    doc.text(`Período: ${reportSummary(payload.records)}`, 16, 43);

    let y = 55;
    payload.records.forEach((record, index) => {
        const tags = recordTags(record).join("  |  ");
        const tagLines = doc.splitTextToSize(tags, pageWidth - 40);
        const noteLines = record.notes ? doc.splitTextToSize(`Anotações: ${record.notes}`, pageWidth - 40) : [];
        const height = 24 + tagLines.length * 4.5 + noteLines.length * 4.5;
        if (y + height > pageHeight - 18) {
            doc.addPage();
            addPageBase();
            y = 24;
        }
        doc.setFillColor(index % 2 ? 246 : 239, index % 2 ? 249 : 247, 253);
        doc.roundedRect(16, y, pageWidth - 32, height, 3, 3, "F");
        doc.setFont("helvetica", "bold");
        doc.setTextColor(18, 32, 64);
        doc.setFontSize(11);
        doc.text(formatDate(record.date), 21, y + 8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(72, 84, 108);
        doc.text(`Registrado por: ${record.recorder || "-"}`, 21, y + 14);
        doc.text(tagLines, 21, y + 20);
        if (noteLines.length) doc.text(noteLines, 21, y + 20 + tagLines.length * 4.5);
        y += height + 5;
    });

    doc.setFontSize(7.5);
    doc.setTextColor(130, 140, 155);
    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
        doc.setPage(page);
        doc.text(`Página ${page} de ${pages}`, pageWidth - 16, pageHeight - 8, { align: "right" });
    }
    const safeName = normalizeSearch(payload.student).replace(/[^a-z0-9]+/g, "-") || "aluno";
    doc.save(`JOJO-agenda-${safeName}.pdf`);
    reportStatus("PDF gerado com sucesso.");
}

document.addEventListener("click", (event) => {
    const choice = event.target.closest(".choice");
    if (choice) {
        if (choice.dataset.group === "mood") choice.classList.toggle("is-active");
        else setGroup(choice.dataset.group, choice.dataset.value);
        return;
    }
    const flag = event.target.closest(".flag");
    if (flag) {
        flag.classList.toggle("is-active");
        return;
    }
    const openRecord = event.target.closest("[data-open-record]");
    if (openRecord) {
        state.activeRecordKey = openRecord.dataset.openRecord;
        renderHistory();
        return;
    }
    const selectDate = event.target.closest("[data-select-date]");
    if (selectDate) {
        const date = selectDate.dataset.selectDate;
        if (state.reportDates.has(date)) state.reportDates.delete(date);
        else state.reportDates.add(date);
        renderHistory();
        return;
    }
    const reportMode = event.target.closest("[data-report-mode]");
    if (reportMode) {
        state.reportMode = reportMode.dataset.reportMode;
        renderReportBuilder();
        return;
    }
    if (event.target.closest("[data-edit-record]")) {
        const record = activeRecord();
        if (record) {
            loadRecordIntoForm(record);
            state.step = 0;
            renderSteps();
            showView("form");
        }
        return;
    }
    if (event.target.closest("[data-new-record]")) {
        ui.studentName.value = state.activeStudent;
        ui.recordDate.value = todayIso();
        clearForm(true);
        state.step = 0;
        renderSteps();
        showView("form");
        return;
    }
    const reportAction = event.target.closest("[data-report-action]");
    if (reportAction) {
        if (reportAction.dataset.reportAction === "pdf") downloadReportPdf();
        else openReportEmail();
        return;
    }
    const dialogStudent = event.target.closest("[data-dialog-student]");
    if (dialogStudent) {
        state.activeStudent = dialogStudent.dataset.dialogStudent;
        ui.studentName.value = state.activeStudent;
        ui.studentDialog.close();
        showView("history");
    }
});

ui.newRecordTab.addEventListener("click", () => showView("form"));
ui.historyTab.addEventListener("click", () => showView("history"));
ui.previousStepBtn.addEventListener("click", () => moveStep(-1));
ui.nextStepBtn.addEventListener("click", () => moveStep(1));
ui.clearFormBtn.addEventListener("click", () => clearForm(true));
ui.form.addEventListener("submit", saveRecord);
ui.recordDate.addEventListener("change", () => { updateDateHint(); loadExistingDay(); });
ui.studentName.addEventListener("change", () => { addStudent(ui.studentName.value); loadExistingDay(); });
ui.recorderName.addEventListener("change", () => localStorage.setItem(STORAGE.recorder, normalizeName(ui.recorderName.value)));
ui.historyStudent.addEventListener("change", () => {
    state.activeStudent = ui.historyStudent.value;
    state.activeRecordKey = "";
    state.reportDates = new Set();
    state.reportAnchor = recordsForStudent()[0]?.date || todayIso();
    state.historyMonth = "all";
    renderHistoryMonths();
    renderHistory();
});
ui.historySearch.addEventListener("input", () => { state.historyQuery = ui.historySearch.value; renderHistory(); });
ui.historyMonth.addEventListener("change", () => { state.historyMonth = ui.historyMonth.value; renderHistory(); });
document.addEventListener("change", (event) => {
    if (event.target.id === "reportAnchor") {
        state.reportAnchor = event.target.value;
        renderReportBuilder();
    }
    if (event.target.id === "reportEmail") localStorage.setItem(STORAGE.recipient, normalizeName(event.target.value));
});
ui.manageStudentsBtn.addEventListener("click", () => { renderStudentControls(); ui.studentDialog.showModal(); });
ui.addStudentBtn.addEventListener("click", () => {
    const name = normalizeName(ui.newStudentName.value);
    if (!addStudent(name)) return;
    state.activeStudent = name;
    ui.studentName.value = name;
    ui.newStudentName.value = "";
    ui.studentDialog.close();
});

ui.recordDate.value = todayIso();
ui.recorderName.value = localStorage.getItem(STORAGE.recorder) || "";
ui.studentName.value = state.students[0] || "";
state.activeStudent = ui.studentName.value;
updateDateHint();
renderStudentControls();
renderSteps();
