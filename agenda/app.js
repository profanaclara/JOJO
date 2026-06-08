const STORAGE = {
    records: "jojo_agenda_records_v2",
    students: "jojo_agenda_students_v2",
    recorder: "jojo_agenda_recorder_v1",
    recipient: "jojo_agenda_recipient_v1"
};

const DEFAULTS = {
    mood: "Tranquilo",
    arrival: "Bem",
    departure: "Bem",
    activityStatus: "Todas",
    appetite: "Normal",
    reportPeriod: "daily"
};

const ui = {
    body: document.body,
    form: document.getElementById("agendaForm"),
    studentName: document.getElementById("studentName"),
    recordDate: document.getElementById("recordDate"),
    recorderName: document.getElementById("recorderName"),
    recipientEmail: document.getElementById("recipientEmail"),
    notes: document.getElementById("notes"),
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
    activeRecordKey: ""
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
        daily: "diário",
        weekly: "semanal",
        monthly: "mensal"
    }[value] || "diário";
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

function selectedFlags() {
    return [...document.querySelectorAll(".flag-chip.is-active")].map((item) => item.dataset.flag);
}

function setGroupValue(group, value) {
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

function getRecordForCurrentDay() {
    const key = currentKey();
    return state.records.find((record) => record.key === key);
}

function showForm() {
    ui.form.classList.remove("hidden");
    ui.recordView.classList.add("hidden");
}

function showRecordView(record, mode = "view") {
    if (!record) {
        return;
    }

    state.activeRecordKey = record.key;
    ui.form.classList.add("hidden");
    ui.recordView.classList.remove("hidden");
    ui.recordView.innerHTML = renderRecordView(record, mode);
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
    ui.recorderName.value = record.recorder || ui.recorderName.value;
    ui.recipientEmail.value = record.recipientEmail || ui.recipientEmail.value;
    setGroupValue("reportPeriod", record.reportPeriod || "daily");
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
    renderDrawer();
}

function compactTags(record) {
    const tags = [
        record.mood,
        `Chegou: ${record.arrival}`,
        `Saiu: ${record.departure}`,
        `Atividade: ${record.activityStatus}`,
        `Apetite: ${record.appetite}`,
        ...record.flags
    ].filter(Boolean);

    return tags.slice(0, 7);
}

function allRecordTags(record) {
    return [
        `Humor: ${record.mood}`,
        `Chegou: ${record.arrival}`,
        `Saiu: ${record.departure}`,
        `Atividade: ${record.activityStatus}`,
        `Apetite: ${record.appetite}`,
        ...(record.flags || [])
    ].filter(Boolean);
}

function renderRecordView(record, mode = "view") {
    const tags = allRecordTags(record);
    const period = record.reportPeriod || selectedValue("reportPeriod") || "daily";
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
                    <p class="empty-state">Registro ${escapeHtml(periodLabel(period))}</p>
                </div>
                <time>${escapeHtml(formatDate(record.date))}</time>
            </header>
            <div class="record-meta">
                <div><span>Registrado por</span><strong>${escapeHtml(record.recorder || "-")}</strong></div>
                <div><span>E-mail</span><strong>${escapeHtml(record.recipientEmail || "-")}</strong></div>
                <div><span>Período</span><strong>${escapeHtml(periodLabel(period))}</strong></div>
                <div><span>Atualizado</span><strong>${escapeHtml(updatedLabel)}</strong></div>
            </div>
            <div class="record-view-tags">
                ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
            </div>
            ${record.notes ? `<p class="record-view-note">${escapeHtml(record.notes)}</p>` : ""}
        </article>
        <div class="record-view-actions">
            <button class="secondary-action" type="button" data-record-action="edit">Editar</button>
            <button class="secondary-action" type="button" data-record-action="new">Novo</button>
            <button class="primary-action full" type="button" data-record-action="email">Enviar por e-mail</button>
            <button class="secondary-action full" type="button" data-record-action="download">Baixar PDF</button>
        </div>
        <p id="reportStatus" class="save-status" aria-live="polite"></p>
    `;
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

    ui.drawerHistory.innerHTML = html;
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
    const recipientEmail = normalizeName(ui.recipientEmail.value);
    if (!student || !date || !recorder) {
        ui.saveStatus.textContent = "Preencha aluno, data e registrador.";
        return;
    }

    addStudent(student);
    window.localStorage.setItem(STORAGE.recorder, recorder);
    window.localStorage.setItem(STORAGE.recipient, recipientEmail);

    const nextRecord = {
        key: currentKey(),
        student,
        date,
        recorder,
        recipientEmail,
        reportPeriod: selectedValue("reportPeriod"),
        mood: selectedValue("mood"),
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

function reportRecordsFor(record) {
    const period = record.reportPeriod || "daily";
    return state.records
        .filter((item) => studentKey(item.student) === studentKey(record.student))
        .filter((item) => sameReportPeriod(item.date, record.date, period))
        .sort((a, b) => a.date.localeCompare(b.date));
}

function buildReportPayload(record) {
    const period = record.reportPeriod || "daily";
    const records = reportRecordsFor(record);
    return {
        student: record.student,
        baseDate: record.date,
        baseDisplayDate: formatDate(record.date),
        period,
        periodLabel: periodLabel(period),
        recipientEmail: record.recipientEmail || ui.recipientEmail.value || "",
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
            mood: item.mood || "",
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
    ui.saveStatus.textContent = "";
    showForm();
    loadCurrentRecord();
}

document.addEventListener("click", (event) => {
    const choice = event.target.closest(".choice-chip");
    if (choice) {
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
ui.recorderName.addEventListener("change", () => {
    window.localStorage.setItem(STORAGE.recorder, normalizeName(ui.recorderName.value));
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && ui.drawer.classList.contains("is-open")) {
        closeDrawer();
    }
});

ui.recordDate.value = todayIso();
ui.studentName.value = "";
ui.recorderName.value = window.localStorage.getItem(STORAGE.recorder) || "";
ui.recipientEmail.value = window.localStorage.getItem(STORAGE.recipient) || "";
loadCurrentRecord();
renderDrawer();
