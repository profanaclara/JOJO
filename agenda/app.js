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

const ui = {
    body: document.body,
    agendaMain: document.querySelector(".agenda-main"),
    form: document.getElementById("agendaForm"),
    studentName: document.getElementById("studentName"),
    recordDate: document.getElementById("recordDate"),
    dailyRecordDate: document.getElementById("dailyRecordDate"),
    recorderName: document.getElementById("recorderName"),
    notes: document.getElementById("notes"),
    notesSection: document.getElementById("notesSection"),
    stepNav: document.getElementById("agendaStepNav"),
    previousStepBtn: document.getElementById("agendaPreviousStep"),
    nextStepBtn: document.getElementById("agendaNextStep"),
    stepLabel: document.getElementById("agendaStepLabel"),
    clearBtn: document.getElementById("clearBtn"),
    saveStatus: document.getElementById("saveStatus"),
    recordView: document.getElementById("recordView"),
    drawer: document.getElementById("studentDrawer"),
    drawerBackdrop: document.getElementById("drawerBackdrop"),
    drawerOpenBtn: document.getElementById("drawerOpenBtn"),
    drawerCloseBtn: document.getElementById("drawerCloseBtn"),
    newStudentName: document.getElementById("newStudentName"),
    addStudentBtn: document.getElementById("addStudentBtn"),
    drawerStudents: document.getElementById("drawerStudents"),
    drawerHistory: document.getElementById("drawerHistory")
};

const state = {
    records: readJson(STORAGE.records, readJson("jojo_agenda_records_v1", [])),
    students: [],
    activeRecordKey: "",
    reportMode: "dates",
    reportDates: new Set(),
    reportAnchor: "",
    reportQuery: "",
    reportMonth: "all",
    agendaStep: 0
};

state.students = sanitizeStudents(readJson(STORAGE.students, readJson("jojo_agenda_students_v1", [])), state.records);
writeJson(STORAGE.students, state.students);

function readJson(key, fallback) {
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
}

function todayIso() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function normalizeName(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
}

function studentKey(name) {
    return normalizeName(name).toLowerCase();
}

function sanitizeStudents(students, records) {
    const hasJoaquimRecord = records.some((record) => studentKey(record.student) === "joaquim");
    return (students || []).filter((name) => hasJoaquimRecord || studentKey(name) !== "joaquim");
}

function currentKey() {
    return `${studentKey(ui.studentName.value)}::${ui.recordDate.value}`;
}

const agendaSteps = [
    { title: "Dados do aluno", element: document.querySelector(".agenda-student") },
    { title: "Humor", element: document.querySelector(".agenda-details--mood") },
    { title: "Entrada e saída", element: document.querySelector(".agenda-details--arrival") },
    { title: "Rotina", element: document.querySelector(".agenda-details--routine") },
    { title: "Atividades", element: document.querySelector(".agenda-details--activities") },
    { title: "Comportamentos", element: document.querySelector(".agenda-details--behavior") },
    { title: "Apetite e reforçador", element: document.querySelector(".agenda-details--appetite") },
    { title: "Anotações", element: ui.notesSection }
];

function setWizardDisplay(element, active) {
    if (!element) {
        return;
    }

    if (!active) {
        element.style.setProperty("display", "none", "important");
        return;
    }

    element.style.setProperty("display", element instanceof HTMLDetailsElement ? "block" : "grid", "important");
    element.style.setProperty("grid-column", "1 / -1", "important");
    element.style.setProperty("grid-row", "1", "important");
    element.style.setProperty("width", "100%", "important");
    element.style.setProperty("max-width", "none", "important");
    element.style.setProperty("justify-self", "stretch", "important");
}

function setWizardFooterLayout(currentStep) {
    const isLastStep = currentStep === agendaSteps.length - 1;
    const actions = ui.form.querySelector(".agenda-actions");

    ui.stepNav.style.setProperty("display", "grid", "important");
    ui.stepNav.style.setProperty("grid-column", "1 / -1", "important");
    ui.stepNav.style.setProperty("grid-row", "2", "important");
    ui.stepNav.style.setProperty("width", "100%", "important");

    actions.classList.toggle("is-wizard-active", isLastStep);
    actions.style.setProperty("display", isLastStep ? "grid" : "none", "important");
    actions.style.setProperty("grid-column", "1 / -1", "important");
    actions.style.setProperty("grid-row", "3", "important");
    actions.style.setProperty("width", "100%", "important");
    actions.style.setProperty("max-width", "none", "important");

    ui.saveStatus.classList.toggle("is-wizard-active", isLastStep);
    ui.saveStatus.style.setProperty("display", isLastStep ? "block" : "none", "important");
    ui.saveStatus.style.setProperty("grid-column", "1 / -1", "important");
    ui.saveStatus.style.setProperty("grid-row", "4", "important");
}

function renderAgendaStep() {
    const currentStep = Math.max(0, Math.min(state.agendaStep, agendaSteps.length - 1));
    state.agendaStep = currentStep;

    agendaSteps.forEach((step, index) => {
        const active = index === currentStep;
        step.element.classList.toggle("is-wizard-active", active);
        setWizardDisplay(step.element, active);
        if (step.element instanceof HTMLDetailsElement) {
            step.element.open = active;
        }
    });

    ui.stepLabel.textContent = `${currentStep + 1} de ${agendaSteps.length} · ${agendaSteps[currentStep].title}`;
    ui.previousStepBtn.disabled = currentStep === 0;
    ui.nextStepBtn.classList.toggle("hidden", currentStep === agendaSteps.length - 1);
    setWizardFooterLayout(currentStep);
}

function moveAgendaStep(direction) {
    state.agendaStep += direction;
    renderAgendaStep();
}

function formatDate(value) {
    if (!value) {
        return "";
    }

    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
}

function monthLabel(value) {
    const date = new Date(`${value}T12:00:00`);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function dayLabel(value) {
    const date = new Date(`${value}T12:00:00`);
    const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    return `${formatDate(value)} - ${weekday}`;
}

function periodLabel(value) {
    return {
        dates: "dias selecionados",
        weekly: "semana inteira",
        monthly: "mês inteiro"
    }[value] || "dias selecionados";
}

function isMultiGroup(group) {
    return group === "mood";
}

function normalizeMultiValue(value) {
    if (Array.isArray(value)) {
        return [...new Set(value.map((item) => normalizeName(item)).filter(Boolean))];
    }
    const single = normalizeName(value);
    return single ? [single] : [];
}

function formatMood(value) {
    return normalizeMultiValue(value).join(", ");
}

function normalizeSearch(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function updateDailyRecordLabel() {
    if (!ui.dailyRecordDate) {
        return;
    }
    const prefix = ui.recordDate.value === todayIso() ? "Hoje" : "Editando o dia";
    ui.dailyRecordDate.textContent = `${prefix} · ${formatDate(ui.recordDate.value)}`;
}

function sameReportPeriod(recordDate, baseDate, period) {
    if (!recordDate || !baseDate) {
        return false;
    }

    const record = new Date(`${recordDate}T12:00:00`);
    const base = new Date(`${baseDate}T12:00:00`);

    if (period === "monthly") {
        return record.getFullYear() === base.getFullYear() && record.getMonth() === base.getMonth();
    }

    if (period === "weekly") {
        const start = new Date(base);
        const day = (start.getDay() + 6) % 7;
        start.setDate(start.getDate() - day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return record >= start && record <= end;
    }

    return recordDate === baseDate;
}

function selectedValue(group) {
    return document.querySelector(`[data-group="${group}"].is-active`)?.dataset.value || "";
}

function selectedValues(group) {
    return [...document.querySelectorAll(`[data-group="${group}"].is-active`)].map((item) => item.dataset.value);
}

function selectedFlags() {
    return [...document.querySelectorAll(".flag-chip.is-active")].map((item) => item.dataset.flag);
}

function setGroupValue(group, value) {
    if (isMultiGroup(group)) {
        const selected = new Set(normalizeMultiValue(value));
        document.querySelectorAll(`[data-group="${group}"]`).forEach((button) => {
            button.classList.toggle("is-active", selected.has(button.dataset.value));
        });
        return;
    }

    const fallback = DEFAULTS[group] || "";
    const nextValue = value || fallback;
    document.querySelectorAll(`[data-group="${group}"]`).forEach((button) => {
        button.classList.toggle("is-active", button.dataset.value === nextValue);
    });
}

function setFlags(flags) {
    const selected = new Set(flags || []);
    document.querySelectorAll(".flag-chip").forEach((button) => {
        button.classList.toggle("is-active", selected.has(button.dataset.flag));
    });
}

function addStudent(name) {
    const normalized = normalizeName(name);
    if (!normalized) {
        return false;
    }

    const exists = state.students.some((item) => studentKey(item) === studentKey(normalized));
    if (!exists) {
        state.students.unshift(normalized);
    } else {
        state.students = [
            normalized,
            ...state.students.filter((item) => studentKey(item) !== studentKey(normalized))
        ];
    }

    state.students = state.students.slice(0, 40);
    writeJson(STORAGE.students, state.students);
    return true;
}

function getCurrentStudentRecords() {
    const key = studentKey(ui.studentName.value);
    return state.records
        .filter((record) => studentKey(record.student) === key)
        .sort((a, b) => b.date.localeCompare(a.date));
}

function recordsForStudent(name) {
    const key = studentKey(name);
    return state.records
        .filter((record) => studentKey(record.student) === key)
        .sort((a, b) => b.date.localeCompare(a.date));
}

function getRecordForCurrentDay() {
    const key = currentKey();
    return state.records.find((record) => record.key === key);
}

function showForm() {
    ui.form.classList.remove("hidden");
    ui.recordView.classList.add("hidden");
    ui.body.classList.remove("agenda-record-only");
}

function showRecordView(record, mode = "view") {
    if (!record) {
        return;
    }

    state.activeRecordKey = record.key;
    state.reportMode = "dates";
    state.reportDates = new Set([record.date]);
    state.reportAnchor = record.date;
    state.reportQuery = "";
    state.reportMonth = "all";
    ui.form.classList.add("hidden");
    ui.recordView.classList.remove("hidden");
    ui.body.classList.add("agenda-record-only");
    ui.recordView.innerHTML = renderRecordView(record, mode);
    applyReportListFilters();
    renderDrawer();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearCurrentForm() {
    Object.entries(DEFAULTS).forEach(([group, value]) => setGroupValue(group, value));
    setFlags([]);
    ui.notes.value = "";
    ui.saveStatus.textContent = "";
}

function loadRecord(record) {
    if (!record) {
        clearCurrentForm();
        renderDrawer();
        return;
    }

    ui.studentName.value = record.student;
    ui.recordDate.value = record.date;
    updateDailyRecordLabel();
    ui.recorderName.value = record.recorder || ui.recorderName.value;
    setGroupValue("mood", record.mood);
    setGroupValue("arrival", record.arrival);
    setGroupValue("departure", record.departure);
    setGroupValue("activityStatus", record.activityStatus);
    setGroupValue("appetite", record.appetite);
    setFlags(record.flags);
    ui.notes.value = record.notes || "";
    ui.saveStatus.textContent = "";
    renderDrawer();
}

function loadCurrentRecord() {
    const record = getRecordForCurrentDay();
    if (record) {
        loadRecord(record);
        return;
    }

    clearCurrentForm();
    updateDailyRecordLabel();
    renderDrawer();
}

function compactTags(record) {
    const mood = formatMood(record.mood);
    const tags = [
        mood,
        `Chegou: ${record.arrival}`,
        `Saiu: ${record.departure}`,
        `Atividade: ${record.activityStatus}`,
        `Apetite: ${record.appetite}`,
        ...record.flags
    ].filter(Boolean);

    return tags.slice(0, 7);
}

function allRecordTags(record) {
    const mood = formatMood(record.mood);
    return [
        mood ? `Humor: ${mood}` : "",
        `Chegou: ${record.arrival}`,
        `Saiu: ${record.departure}`,
        `Atividade: ${record.activityStatus}`,
        `Apetite: ${record.appetite}`,
        ...(record.flags || [])
    ].filter(Boolean);
}

function renderRecordView(record, mode = "view") {
    const tags = allRecordTags(record);
    const updatedDate = record.updatedAt ? new Date(record.updatedAt) : null;
    const updatedLabel = updatedDate && !Number.isNaN(updatedDate.getTime())
        ? updatedDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : "-";

    return `
        <article class="record-view-card">
            <p class="record-eyebrow">${mode === "saved" ? "REGISTRO SALVO" : "REGISTRO"}</p>
            <header>
                <div>
                    <h2>${escapeHtml(record.student)}</h2>
                    <p class="empty-state">Registro do dia</p>
                </div>
                <time>${escapeHtml(formatDate(record.date))}</time>
            </header>
            <div class="record-meta">
                <div><span>Registrado por</span><strong>${escapeHtml(record.recorder || "-")}</strong></div>
                <div><span>Data</span><strong>${escapeHtml(formatDate(record.date))}</strong></div>
                <div><span>Tipo</span><strong>Registro diário</strong></div>
                <div><span>Atualizado</span><strong>${escapeHtml(updatedLabel)}</strong></div>
            </div>
            <div class="record-view-tags">
                ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
            </div>
            ${record.notes ? `<p class="record-view-note">${escapeHtml(record.notes)}</p>` : ""}
        </article>
        ${renderReportBuilder(record)}
        <div class="record-view-actions">
            <button class="secondary-action" type="button" data-record-action="edit">Editar</button>
            <button class="secondary-action" type="button" data-record-action="new">Novo</button>
            <button class="primary-action full" type="button" data-record-action="email">Enviar por e-mail</button>
            <button class="secondary-action full" type="button" data-record-action="download">Baixar PDF</button>
        </div>
        <p id="reportStatus" class="save-status" aria-live="polite"></p>
    `;
}

function selectedReportRecords(record) {
    const records = recordsForStudent(record.student);
    if (state.reportMode === "dates") {
        return records
            .filter((item) => state.reportDates.has(item.date))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    return records
        .filter((item) => sameReportPeriod(item.date, state.reportAnchor || record.date, state.reportMode))
        .sort((a, b) => a.date.localeCompare(b.date));
}

function reportDateSummary(records) {
    if (!records.length) {
        return "Nenhum registro encontrado";
    }
    if (records.length === 1) {
        return formatDate(records[0].date);
    }
    return `${formatDate(records[0].date)} a ${formatDate(records[records.length - 1].date)}`;
}

function renderReportBuilder(record) {
    const records = recordsForStudent(record.student);
    const selected = selectedReportRecords(record);
    const recipient = window.localStorage.getItem(STORAGE.recipient) || record.recipientEmail || "";
    const monthOptions = [...new Map(records.map((item) => [item.date.slice(0, 7), monthLabel(item.date)])).entries()];
    const groupedRecords = monthOptions.map(([month, label]) => {
        const rows = records.filter((item) => item.date.startsWith(month)).map((item) => {
            const selectedDate = state.reportDates.has(item.date);
            const previewed = item.key === state.activeRecordKey;
            const searchable = normalizeSearch([
                dayLabel(item.date),
                formatMood(item.mood),
                item.arrival,
                item.departure,
                item.activityStatus,
                item.appetite,
                ...(item.flags || []),
                item.notes
            ].join(" "));
            return `
                <div class="report-date${selectedDate ? " is-selected" : ""}${previewed ? " is-previewed" : ""}" data-report-row data-month="${escapeHtml(month)}" data-search="${escapeHtml(searchable)}">
                    <button class="report-date__preview" type="button" data-preview-record="${escapeHtml(item.key)}">
                        <strong>${escapeHtml(dayLabel(item.date))}</strong>
                        <span>${escapeHtml(compactTags(item).slice(0, 2).join(" · ") || "Abrir registro")}</span>
                    </button>
                    <button class="report-date__select" type="button" data-report-date="${escapeHtml(item.date)}" aria-pressed="${selectedDate}" aria-label="${selectedDate ? "Remover" : "Incluir"} ${escapeHtml(formatDate(item.date))} no relatório">
                        <span aria-hidden="true">${selectedDate ? "✓" : "+"}</span>
                    </button>
                </div>
            `;
        }).join("");
        return `<section class="report-month-group" data-report-month-group="${escapeHtml(month)}"><h3>${escapeHtml(label)}</h3>${rows}</section>`;
    }).join("");

    return `
        <section class="report-builder" aria-labelledby="reportBuilderTitle">
            <div class="report-builder__heading">
                <div><p>RELATÓRIO</p><h2 id="reportBuilderTitle">Escolha o período</h2></div>
                <span class="report-count">${selected.length} ${selected.length === 1 ? "dia" : "dias"}</span>
            </div>
            <div class="report-mode-tabs" role="group" aria-label="Tipo de período">
                <button type="button" data-report-mode="dates" class="${state.reportMode === "dates" ? "is-active" : ""}">Dias escolhidos</button>
                <button type="button" data-report-mode="weekly" class="${state.reportMode === "weekly" ? "is-active" : ""}">Semana inteira</button>
                <button type="button" data-report-mode="monthly" class="${state.reportMode === "monthly" ? "is-active" : ""}">Mês inteiro</button>
            </div>
            ${state.reportMode === "dates" ? `
                <div class="report-list-toolbar">
                    <label class="report-search" for="reportSearch"><span class="sr-only">Buscar registros</span><input id="reportSearch" type="search" value="${escapeHtml(state.reportQuery)}" placeholder="Buscar observação ou registro"></label>
                    <label class="report-month-filter" for="reportMonthFilter"><span class="sr-only">Filtrar por mês</span><select id="reportMonthFilter"><option value="all">Todos os meses</option>${monthOptions.map(([month, label]) => `<option value="${escapeHtml(month)}"${state.reportMonth === month ? " selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select></label>
                </div>
                <p id="reportVisibleCount" class="report-visible-count"></p>
                <div class="report-date-list" aria-label="Registros do aluno">${groupedRecords || `<p class="empty-state">Ainda não há dias registrados.</p>`}</div>
                <p id="reportFilterEmpty" class="empty-state hidden">Nenhum registro corresponde à busca.</p>
            ` : `
                <label class="report-anchor-label" for="reportAnchor">
                    <span>${state.reportMode === "weekly" ? "Escolha um dia da semana" : "Escolha um dia do mês"}</span>
                    <input id="reportAnchor" type="date" value="${escapeHtml(state.reportAnchor || record.date)}">
                </label>
            `}
            <div class="report-selection-summary">
                <span>Período incluído</span>
                <strong>${escapeHtml(reportDateSummary(selected))}</strong>
                <small>${selected.length ? `${selected.length} registro${selected.length === 1 ? "" : "s"} será${selected.length === 1 ? "" : "ão"} usado${selected.length === 1 ? "" : "s"} no relatório.` : "Escolha um período que tenha registros salvos."}</small>
            </div>
            <label class="field-label report-email-label" for="reportRecipientEmail">Enviar relatório para</label>
            <input id="reportRecipientEmail" type="email" autocomplete="off" value="${escapeHtml(recipient)}" placeholder="email@exemplo.com">
        </section>
    `;
}

function persistReportRecipient() {
    const field = document.getElementById("reportRecipientEmail");
    if (field) {
        window.localStorage.setItem(STORAGE.recipient, normalizeName(field.value));
    }
}

function applyReportListFilters() {
    const query = normalizeSearch(state.reportQuery);
    let visibleCount = 0;
    document.querySelectorAll("[data-report-month-group]").forEach((group) => {
        let groupCount = 0;
        group.querySelectorAll("[data-report-row]").forEach((row) => {
            const matchesMonth = state.reportMonth === "all" || row.dataset.month === state.reportMonth;
            const matchesQuery = !query || row.dataset.search.includes(query);
            const visible = matchesMonth && matchesQuery;
            row.classList.toggle("hidden", !visible);
            if (visible) {
                groupCount += 1;
                visibleCount += 1;
            }
        });
        group.classList.toggle("hidden", groupCount === 0);
    });
    const count = document.getElementById("reportVisibleCount");
    if (count) {
        count.textContent = `${visibleCount} ${visibleCount === 1 ? "registro encontrado" : "registros encontrados"}`;
    }
    document.getElementById("reportFilterEmpty")?.classList.toggle("hidden", visibleCount !== 0);
}

function rerenderRecordView(record = activeRecord()) {
    if (!record) {
        return;
    }
    ui.recordView.innerHTML = renderRecordView(record);
    applyReportListFilters();
}

function renderDrawerStudents() {
    const selected = studentKey(ui.studentName.value);
    ui.drawerStudents.innerHTML = state.students
        .map((name) => `
            <button class="drawer-student${studentKey(name) === selected ? " is-active" : ""}" type="button" data-student="${escapeHtml(name)}">
                ${escapeHtml(name)}
            </button>
        `)
        .join("");
}

function renderDrawerHistory() {
    const records = getCurrentStudentRecords();
    if (!records.length) {
        ui.drawerHistory.innerHTML = `<p class="empty-state">Sem registros anteriores.</p>`;
        return;
    }

    const reportShortcut = `
        <button class="drawer-report-shortcut" type="button" data-open-student-report>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7zM15 3v5h4M10 12h6m-6 4h6"/></svg>
            <span><strong>Ver registros e criar relatório</strong><small>Escolha dias, uma semana ou um mês</small></span>
        </button>
    `;
    let currentMonth = "";
    const activeKey = state.activeRecordKey || currentKey();
    const html = records.map((record) => {
        const month = monthLabel(record.date);
        const monthHtml = month !== currentMonth ? `<p class="history-month">${escapeHtml(month)}</p>` : "";
        currentMonth = month;
        const active = record.key === activeKey ? " is-active" : "";
        const summary = compactTags(record).slice(0, 2).join(" / ");

        return `
            ${monthHtml}
            <button class="history-day${active}" type="button" data-record-key="${escapeHtml(record.key)}">
                <strong>${escapeHtml(dayLabel(record.date))}</strong>
                <span>${escapeHtml(summary || "Registro")}</span>
            </button>
        `;
    }).join("");

    ui.drawerHistory.innerHTML = reportShortcut + html;
}

function renderDrawer() {
    renderDrawerStudents();
    renderDrawerHistory();
}

function openDrawer() {
    renderDrawer();
    ui.drawer.classList.add("is-open");
    ui.drawerBackdrop.classList.remove("hidden");
    ui.body.classList.add("drawer-open");
    ui.drawer.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => ui.drawerBackdrop.classList.add("is-visible"));
}

function closeDrawer() {
    ui.drawer.classList.remove("is-open");
    ui.drawerBackdrop.classList.remove("is-visible");
    ui.body.classList.remove("drawer-open");
    ui.drawer.setAttribute("aria-hidden", "true");
    window.setTimeout(() => ui.drawerBackdrop.classList.add("hidden"), 180);
}

function saveRecord(event) {
    event.preventDefault();

    const student = normalizeName(ui.studentName.value);
    const date = ui.recordDate.value;
    const recorder = normalizeName(ui.recorderName.value);
    if (!student || !date || !recorder) {
        ui.saveStatus.textContent = "Preencha aluno, data e registrador.";
        return;
    }

    addStudent(student);
    window.localStorage.setItem(STORAGE.recorder, recorder);

    const nextRecord = {
        key: currentKey(),
        student,
        date,
        recorder,
        mood: selectedValues("mood"),
        arrival: selectedValue("arrival"),
        departure: selectedValue("departure"),
        activityStatus: selectedValue("activityStatus"),
        appetite: selectedValue("appetite"),
        flags: selectedFlags(),
        notes: ui.notes.value.trim(),
        updatedAt: new Date().toISOString()
    };

    const index = state.records.findIndex((record) => record.key === nextRecord.key);
    if (index >= 0) {
        state.records[index] = nextRecord;
    } else {
        state.records.unshift(nextRecord);
    }

    writeJson(STORAGE.records, state.records);
    renderDrawer();
    showRecordView(nextRecord, "saved");
}

function activeRecord() {
    return state.records.find((record) => record.key === state.activeRecordKey) || getRecordForCurrentDay();
}

function buildReportPayload(record) {
    const period = state.reportMode;
    const records = selectedReportRecords(record);
    const recipientField = document.getElementById("reportRecipientEmail");
    const recipientEmail = normalizeName(recipientField?.value || window.localStorage.getItem(STORAGE.recipient) || "");
    window.localStorage.setItem(STORAGE.recipient, recipientEmail);
    return {
        student: record.student,
        baseDate: state.reportAnchor || record.date,
        baseDisplayDate: reportDateSummary(records),
        period,
        periodLabel: periodLabel(period),
        recipientEmail,
        recorder: record.recorder || ui.recorderName.value || "",
        subject: `Agenda JOJO - ${record.student} - ${periodLabel(period)}`,
        body: [
            `Olá,`,
            "",
            `Segue em anexo o relatório ${periodLabel(period)} da Agenda JOJO de ${record.student}.`,
            "",
            `Registro enviado por: ${record.recorder || ui.recorderName.value || "JOJO"}`,
            "",
            "Atenciosamente."
        ].join("\n"),
        records: records.map((item) => ({
            date: item.date,
            displayDate: formatDate(item.date),
            recorder: item.recorder || "",
            mood: formatMood(item.mood),
            arrival: item.arrival || "",
            departure: item.departure || "",
            activityStatus: item.activityStatus || "",
            appetite: item.appetite || "",
            flags: item.flags || [],
            notes: item.notes || ""
        }))
    };
}

function setReportStatus(message) {
    const status = document.getElementById("reportStatus");
    if (status) {
        status.textContent = message;
    }
}

function sendReportToAndroid(action) {
    const record = activeRecord();
    if (!record) {
        return;
    }

    if (!selectedReportRecords(record).length) {
        setReportStatus("Escolha pelo menos um dia com registro.");
        return;
    }

    const payload = JSON.stringify(buildReportPayload(record));
    if (!window.JojoAndroid) {
        setReportStatus("Disponível no app instalado.");
        return;
    }

    if (action === "email" && window.JojoAndroid.shareAgendaReport) {
        window.JojoAndroid.shareAgendaReport(payload);
        setReportStatus("Abrindo e-mail com PDF.");
    }

    if (action === "download" && window.JojoAndroid.saveAgendaReport) {
        window.JojoAndroid.saveAgendaReport(payload);
        setReportStatus("Gerando PDF.");
    }
}

function handleRecordAction(action) {
    const record = activeRecord();
    if (!record) {
        return;
    }

    if (action === "edit") {
        loadRecord(record);
        showForm();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    if (action === "new") {
        ui.recordDate.value = todayIso();
        updateDailyRecordLabel();
        clearCurrentForm();
        showForm();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    sendReportToAndroid(action);
}

function chooseStudent(name) {
    ui.studentName.value = name;
    ui.recordDate.value = todayIso();
    updateDailyRecordLabel();
    ui.saveStatus.textContent = "";
    showForm();
    loadCurrentRecord();
}

document.addEventListener("click", (event) => {
    const reportMode = event.target.closest("[data-report-mode]");
    if (reportMode) {
        persistReportRecipient();
        state.reportMode = reportMode.dataset.reportMode;
        rerenderRecordView();
        return;
    }

    const reportDate = event.target.closest("[data-report-date]");
    if (reportDate) {
        persistReportRecipient();
        const date = reportDate.dataset.reportDate;
        if (state.reportDates.has(date)) {
            state.reportDates.delete(date);
        } else {
            state.reportDates.add(date);
        }
        rerenderRecordView();
        return;
    }

    const previewRecord = event.target.closest("[data-preview-record]");
    if (previewRecord) {
        persistReportRecipient();
        const record = state.records.find((item) => item.key === previewRecord.dataset.previewRecord);
        if (record) {
            state.activeRecordKey = record.key;
            rerenderRecordView(record);
        }
        return;
    }

    const choice = event.target.closest(".choice-chip");
    if (choice) {
        if (isMultiGroup(choice.dataset.group)) {
            choice.classList.toggle("is-active");
            return;
        }
        setGroupValue(choice.dataset.group, choice.dataset.value);
        return;
    }

    const flag = event.target.closest(".flag-chip");
    if (flag) {
        flag.classList.toggle("is-active");
        return;
    }

    const student = event.target.closest(".drawer-student");
    if (student) {
        chooseStudent(student.dataset.student);
        return;
    }

    const day = event.target.closest(".history-day");
    if (day) {
        const record = state.records.find((item) => item.key === day.dataset.recordKey);
        showRecordView(record);
        closeDrawer();
        return;
    }

    const openStudentReport = event.target.closest("[data-open-student-report]");
    if (openStudentReport) {
        const latestRecord = getCurrentStudentRecords()[0];
        showRecordView(latestRecord);
        closeDrawer();
        return;
    }

    const recordAction = event.target.closest("[data-record-action]");
    if (recordAction) {
        handleRecordAction(recordAction.dataset.recordAction);
    }
});

ui.drawerOpenBtn.addEventListener("click", openDrawer);
ui.drawerCloseBtn.addEventListener("click", closeDrawer);
ui.drawerBackdrop.addEventListener("click", closeDrawer);
ui.form.addEventListener("submit", saveRecord);
ui.clearBtn.addEventListener("click", clearCurrentForm);
ui.previousStepBtn.addEventListener("click", () => moveAgendaStep(-1));
ui.nextStepBtn.addEventListener("click", () => moveAgendaStep(1));
ui.addStudentBtn.addEventListener("click", () => {
    const name = normalizeName(ui.newStudentName.value);
    if (!name) {
        return;
    }

    addStudent(name);
    ui.newStudentName.value = "";
    chooseStudent(name);
    renderDrawer();
});
ui.newStudentName.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        ui.addStudentBtn.click();
    }
});
ui.studentName.addEventListener("change", () => {
    addStudent(ui.studentName.value);
    loadCurrentRecord();
});
ui.recordDate.addEventListener("change", loadCurrentRecord);
document.querySelectorAll(".agenda-details").forEach((section) => {
    section.addEventListener("toggle", () => {
        if (!section.open) return;
        document.querySelectorAll(".agenda-details[open]").forEach((otherSection) => {
            if (otherSection !== section) otherSection.open = false;
        });
    });
});
ui.recorderName.addEventListener("change", () => {
    window.localStorage.setItem(STORAGE.recorder, normalizeName(ui.recorderName.value));
});
document.addEventListener("change", (event) => {
    if (event.target.id === "reportAnchor") {
        state.reportAnchor = event.target.value;
        rerenderRecordView();
    }
    if (event.target.id === "reportRecipientEmail") {
        window.localStorage.setItem(STORAGE.recipient, normalizeName(event.target.value));
    }
    if (event.target.id === "reportMonthFilter") {
        state.reportMonth = event.target.value;
        applyReportListFilters();
    }
});
document.addEventListener("input", (event) => {
    if (event.target.id === "reportSearch") {
        state.reportQuery = event.target.value;
        applyReportListFilters();
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && ui.drawer.classList.contains("is-open")) {
        closeDrawer();
    }
});

ui.recordDate.value = todayIso();
updateDailyRecordLabel();
ui.studentName.value = "";
ui.recorderName.value = window.localStorage.getItem(STORAGE.recorder) || "";
loadCurrentRecord();
renderDrawer();
renderAgendaStep();
