/* =========================================================
   ELIMINATOR V2
   Architecture robuste
   - UI type v27
   - logique inspirée v19
   - saisons Ghibli plus contrastées
========================================================= */

const $ = (id) => document.getElementById(id);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const uid = () => Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
const nowISO = () => new Date().toISOString();

const STORAGE_KEY = "eliminator_v2_stable";
const SEASONS = ["printemps", "ete", "automne", "hiver", "noirblanc"];

const SUBLINES = [
  "Une quête après l’autre.",
  "Le chaos recule. Toi, tu avances.",
  "Le réel apprécie les tâches finies.",
  "Aujourd’hui, on nettoie la carte mentale.",
  "Une micro-victoire vaut mieux qu’un grand flou.",
  "Tu n’as pas besoin d’héroïsme. Juste d’un prochain geste."
];

const TIPS = [
  "Un seul étorion. Pas un TED Talk intérieur.",
  "Épaules basses. Mâchoire relâchée. Continue.",
  "Commence moche. Le cerveau adore négocier, ignore-le.",
  "Une seule cible. Un seul onglet. Un seul monde.",
  "Tu n’as pas besoin d’envie. Tu as besoin d’élan.",
  "Fais petit. Mais fais réel."
];

const defaultState = {
  ui: {
    mode: "clair",
    season: "automne",
    serious: false,
    focus: false,
    font: "inter",
    baseSize: 16,
    showBelowList: false
  },

  settings: {
    fatigue: 2,
    motivation: 2,
    tipsChance: 0.18,
    celebrationChance: 0.30,
    keepListInFocus: true,
    listSort: "roulette",
    includedCats: []
  },

  baseline: {
    totalTasks: 0,
    totalEtorions: 0
  },

  tasks: [],
  currentTaskId: null,
  currentTaskStart: null,
  undo: [],

  kiffances: [
    "Bois un verre d’eau.",
    "Marche 60 secondes. Puis reviens.",
    "Range 10 objets. Pas 47.",
    "Respire 5 cycles lents.",
    "Étire nuque et épaules 45 secondes."
  ],

  pomodoro: {
    workMin: 25,
    breakMin: 5,
    autoStart: "auto",
    phase: "work"
  },

  notes: {
    entries: [],
    text: "",
    reminders: "",
    typhonse: []
  },

  habits: [],

  sets: {
    hospital: {
      enabled: true,
      patients: 4,
      itemsPerPatient: ["Voir patient", "Note", "Traitement", "Dossier"],
      checks: {}
    },
    consult: {
      enabled: true,
      patients: 6,
      itemsPerPatient: ["Voir patient", "Note", "Ordonnance", "Dossier"],
      checks: {}
    }
  },

  history: [],

  stats: {
    tasksCompleted: 0,
    etorionsDone: 0,
    sessions: 0,
    taskHistory: []
  }
};

let state = loadState();

/* =========================================================
   STORAGE
========================================================= */

function safeClone(obj){
  if(typeof structuredClone === "function"){
    try{
      return structuredClone(obj);
    }catch(_){}
  }
  return JSON.parse(JSON.stringify(obj));
}

function deepAssign(target, source){
  for(const key in source){
    if(
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key]
    ){
      deepAssign(target[key], source[key]);
    }else{
      target[key] = source[key];
    }
  }
}

function migrateState(loaded){
  const merged = safeClone(defaultState);
  deepAssign(merged, loaded || {});

  if(Array.isArray(merged.notes)){
    merged.notes = {
      entries: merged.notes,
      text: "",
      reminders: "",
      typhonse: []
    };
  }

  if(!Array.isArray(merged.notes.entries)) merged.notes.entries = [];
  if(!Array.isArray(merged.notes.typhonse)) merged.notes.typhonse = [];
  if(!Array.isArray(merged.kiffances)) merged.kiffances = [];
  if(!Array.isArray(merged.habits)) merged.habits = [];
  if(!Array.isArray(merged.history)) merged.history = [];
  if(!Array.isArray(merged.stats.taskHistory)) merged.stats.taskHistory = [];
  if(!Array.isArray(merged.tasks)) merged.tasks = [];

  merged.tasks.forEach(task => {
    if(!task.id) task.id = uid();
    if(!task.title && task.label) task.title = task.label;
    if(!task.label && task.title) task.label = task.title;
    if(typeof task.etorionsTotal !== "number"){
      const base = typeof task.etorions === "number" ? task.etorions : 1;
      task.etorionsTotal = base;
    }
    if(typeof task.etorionsLeft !== "number") task.etorionsLeft = task.etorionsTotal;
    if(typeof task.initialEtorions !== "number") task.initialEtorions = task.etorionsTotal;
    if(typeof task.done !== "boolean") task.done = false;
    if(typeof task.pinned !== "boolean") task.pinned = false;
    if(!task.cat) task.cat = "Inbox";
    if(!task.createdAt) task.createdAt = nowISO();
  });

  return merged;
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return safeClone(defaultState);
    return migrateState(JSON.parse(raw));
  }catch(_){
    return safeClone(defaultState);
  }
}

function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(_){}
}

/* =========================================================
   GENERAL HELPERS
========================================================= */

function dayKey(d = new Date()){
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function pad2(n){
  return String(n).padStart(2, "0");
}

function fmtMMSS(ms){
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

function escapeHTML(text){
  return String(text || "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#039;"
  }[c]));
}

function seasonLabel(season){
  const map = {
    printemps: "Printemps",
    ete: "Été",
    automne: "Automne",
    hiver: "Hiver",
    noirblanc: "Noir & blanc"
  };
  return map[season] || "Automne";
}

function pickRandom(arr){
  if(!arr.length) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSubtitle(){
  return pickRandom(SUBLINES);
}

let statusTimer = null;
function status(message, ms = 4000){
  const el = $("statusSpot");
  if(!el) return;
  el.textContent = message || "";
  if(statusTimer) clearTimeout(statusTimer);
  if(message){
    statusTimer = setTimeout(() => {
      el.textContent = "";
    }, ms);
  }
}

/* =========================================================
   THEME + MODES
========================================================= */

function applyTheme(){
  document.body.classList.remove(
    "theme--printemps",
    "theme--ete",
    "theme--automne",
    "theme--hiver",
    "theme--noirblanc",
    "mode--clair",
    "mode--sombre"
  );

  document.body.classList.add(`theme--${state.ui.season}`);
  document.body.classList.add(`mode--${state.ui.mode}`);
  document.body.classList.toggle("is-serious", !!state.ui.serious);
  document.body.classList.toggle("is-focus", !!state.ui.focus);
  document.body.setAttribute("data-font", state.ui.font);
  document.documentElement.style.setProperty("--baseSize", `${clamp(state.ui.baseSize, 14, 18)}px`);

  if($("modeToggle")){
    $("modeToggle").textContent = state.ui.mode === "sombre" ? "Sombre" : "Clair";
    $("modeToggle").setAttribute("aria-pressed", state.ui.mode === "sombre" ? "true" : "false");
  }

  if($("seasonCycle")){
    $("seasonCycle").textContent = seasonLabel(state.ui.season);
  }

  if($("seriousToggle")){
    $("seriousToggle").textContent = state.ui.serious ? "Sérieux ON" : "Sérieux";
    $("seriousToggle").setAttribute("aria-pressed", state.ui.serious ? "true" : "false");
  }

  if($("focusBtn")){
    $("focusBtn").textContent = state.ui.focus ? "Focus ON" : "Focus";
    $("focusBtn").setAttribute("aria-pressed", state.ui.focus ? "true" : "false");
  }

  if($("listToggleBtn")){
    $("listToggleBtn").setAttribute("aria-pressed", state.ui.showBelowList ? "true" : "false");
    $("listToggleBtn").classList.toggle("is-active", !!state.ui.showBelowList);
  }

  document.title = state.ui.focus ? "ELIMINATOR — Focus" : "ELIMINATOR";
}

/* =========================================================
   PANELS + TABS
========================================================= */

function openPanel(which){
  $("panelBack")?.classList.add("is-show");
  document.body.style.overflow = "hidden";

  if(which === "left"){
    $("leftPanel")?.classList.add("is-open");
    $("rightPanel")?.classList.remove("is-open");
  }else{
    $("rightPanel")?.classList.add("is-open");
    $("leftPanel")?.classList.remove("is-open");
  }
}

function closePanels(){
  $("panelBack")?.classList.remove("is-show");
  $("leftPanel")?.classList.remove("is-open");
  $("rightPanel")?.classList.remove("is-open");
  document.body.style.overflow = "";
}

function bindTabs(){
  $$(".tab-btn[data-lefttab]").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".tab-btn[data-lefttab]").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const key = btn.dataset.lefttab;
      $$("#leftPanel .tab-page").forEach(p => p.classList.remove("is-show"));
      $(`left-${key}`)?.classList.add("is-show");

      if(key === "tasks") renderTasksPanel();
      if(key === "kiffance") renderKiffance();
      if(key === "prefs") syncPrefsUI();
      if(key === "export") renderExport();
    });
  });

  $$(".tab-btn[data-righttab]").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".tab-btn[data-righttab]").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const key = btn.dataset.righttab;
      $$("#rightPanel .tab-page").forEach(p => p.classList.remove("is-show"));
      $(`right-${key}`)?.classList.add("is-show");

      if(key === "sets") renderSetsPanel();
      if(key === "habits") renderHabitsPanel();
      if(key === "flow") syncFlowPanel();
      if(key === "history") renderHistoryPanel();
      if(key === "notes") renderNotesPanel();
      if(key === "stats") renderStatsPanel();
    });
  });
}

/* =========================================================
   OVERLAYS
========================================================= */

function closeOverlay(){
  $("overlayModal").hidden = true;
  $("modalBack").hidden = true;
  $$(".overlay-page").forEach(page => {
    page.hidden = true;
    page.classList.remove("is-show");
  });
}

function openOverlay(which){
  $("overlayModal").hidden = false;
  $("modalBack").hidden = false;

  $$(".overlay-page").forEach(page => {
    page.hidden = true;
    page.classList.remove("is-show");
  });

  const page = $(`overlay-${which}`);
  if(page){
    page.hidden = false;
    page.classList.add("is-show");
  }

  const titleMap = {
    notes: "Notes",
    typhonse: "Typhonse",
    kiffance: "Kiffance",
    stats: "Stats"
  };
  $("overlayTitle").textContent = titleMap[which] || "Fenêtre";

  if(which === "notes") renderNotesOverlay();
  if(which === "typhonse") renderTyphonse();
  if(which === "kiffance"){
    renderKiffance();
    suggestKiffance();
  }
  if(which === "stats") renderStatsPanel();
}

/* =========================================================
   TASK PARSING + ESTIMATION
========================================================= */

function isAllCapsLine(line){
  const t = String(line || "").trim();
  if(!t) return false;
  const hasLetters = /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(t);
  if(!hasLetters) return false;
  return t === t.toUpperCase() && t.length <= 90;
}

function parseTaskLine(line){
  const raw = String(line || "").trim();
  if(!raw) return null;

  const cleaned = raw.replace(/^[-*•\s]+/, "").trim();
  if(!cleaned) return null;

  let title = cleaned;
  let etorions = null;

  const match = cleaned.match(/^(.*?)(?:\s*[-–—]\s*|\s+)(\d+)\s*$/);
  if(match){
    title = match[1].trim();
    etorions = parseInt(match[2], 10);
  }

  title = title.replace(/\s+/g, " ").trim();
  if(!title) return null;

  if(etorions !== null) etorions = clamp(etorions, 1, 99);

  return { title, etorions };
}

function estimateEtorions(label){
  const target = String(label || "").trim().toLowerCase();
  const matches = state.stats.taskHistory.filter(entry =>
    String(entry.label || "").trim().toLowerCase() === target
  );

  if(matches.length === 0) return 3;

  const avg = matches.reduce((sum, entry) => sum + (entry.etorionsUsed || 0), 0) / matches.length;
  return clamp(Math.round(avg) || 3, 1, 12);
}

function importFromInbox(text){
  const lines = String(text || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let cat = "Inbox";
  const imported = [];

  for(const line of lines){
    if(isAllCapsLine(line)){
      cat = line.trim();
      continue;
    }

    const parsed = parseTaskLine(line);
    if(!parsed) continue;

    const eto = parsed.etorions ?? estimateEtorions(parsed.title);

    imported.push({
      id: uid(),
      title: parsed.title,
      label: parsed.title,
      cat,
      etorionsTotal: eto,
      etorionsLeft: eto,
      initialEtorions: eto,
      pinned: false,
      done: false,
      createdAt: nowISO(),
      doneAt: null
    });
  }

  if(imported.length === 0) return 0;

  pushUndo("import");
  state.tasks.push(...imported);

  const totalTasks = imported.length;
  const totalEtorions = imported.reduce((sum, task) => sum + task.etorionsTotal, 0);

  if(state.baseline.totalTasks === 0 && state.baseline.totalEtorions === 0){
    state.baseline.totalTasks = totalTasks;
    state.baseline.totalEtorions = totalEtorions;
  }else{
    state.baseline.totalTasks += totalTasks;
    state.baseline.totalEtorions += totalEtorions;
  }

  ensureCurrentTask();
  saveState();
  renderAll();

  return imported.length;
}

/* =========================================================
   TASK ENGINE
========================================================= */

function activeTasks(){
  const included = state.settings.includedCats;

  return state.tasks
    .filter(task => !task.done)
    .filter(task => {
      if(!included || included.length === 0) return true;
      return included.includes(task.cat);
    });
}

function doneTasks(){
  return state.tasks.filter(task => task.done);
}

function getTask(id){
  return state.tasks.find(task => task.id === id) || null;
}

function sortTasks(list){
  const mode = state.settings.listSort || "roulette";

  if(mode === "alpha"){
    return [...list].sort((a, b) => a.title.localeCompare(b.title, "fr"));
  }

  if(mode === "cat"){
    return [...list].sort((a, b) => {
      const catCompare = a.cat.localeCompare(b.cat, "fr");
      return catCompare !== 0 ? catCompare : a.title.localeCompare(b.title, "fr");
    });
  }

  if(mode === "ordre"){
    return [...list].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  }

  return [...list].sort((a, b) => {
    if(a.pinned && !b.pinned) return -1;
    if(!a.pinned && b.pinned) return 1;
    return (a.createdAt || "").localeCompare(b.createdAt || "");
  });
}

function ensureCurrentTask(){
  const current = getTask(state.currentTaskId);
  const actives = activeTasks();

  if(actives.length === 0){
    state.currentTaskId = null;
    state.currentTaskStart = null;
    return;
  }

  if(!current || current.done){
    const pinned = actives.find(task => task.pinned);
    state.currentTaskId = (pinned || actives[0]).id;
    state.currentTaskStart = Date.now();
  }
}

function computeProgress(){
  const baseTasks = state.baseline.totalTasks || 0;
  const baseEtorions = state.baseline.totalEtorions || 0;

  const remainingTasks = activeTasks();
  const remT = remainingTasks.length;
  const remE = remainingTasks.reduce((sum, task) => sum + (task.etorionsLeft || 0), 0);

  const pct = baseTasks <= 0 ? 100 : clamp(Math.round((remT / baseTasks) * 100), 0, 100);

  return {
    baseTasks,
    baseEtorions,
    remT,
    remE,
    pct
  };
}

function dopamineScore(){
  const tasks = activeTasks();
  if(tasks.length === 0) return 100;

  const totalLoad = tasks.reduce((sum, task) => sum + (task.etorionsLeft || task.etorionsTotal || 1), 0);
  const avgLoad = totalLoad / tasks.length;

  return Math.round(Math.max(0, 100 - avgLoad * 10));
}

function roulettePick(){
  const tasks = activeTasks();
  if(tasks.length === 0) return null;

  const pinned = tasks.filter(task => task.pinned);
  let pool = pinned.length ? pinned : [...tasks];

  pool.sort((a, b) => (a.etorionsLeft || a.etorionsTotal) - (b.etorionsLeft || b.etorionsTotal));
  const sample = pool.slice(0, Math.min(3, pool.length));

  return sample[Math.floor(Math.random() * sample.length)];
}

function selectTask(id){
  const task = getTask(id);
  if(!task || task.done) return;

  state.currentTaskId = id;
  state.currentTaskStart = Date.now();
  saveState();
  renderAll();
}

function moveTask(id, delta){
  const index = state.tasks.findIndex(task => task.id === id);
  if(index < 0) return;

  const target = clamp(index + delta, 0, state.tasks.length - 1);
  const [item] = state.tasks.splice(index, 1);
  state.tasks.splice(target, 0, item);
}

function editTaskPrompt(id){
  const task = getTask(id);
  if(!task) return;

  const next = prompt("Éditer la tâche", task.title);
  if(next === null) return;

  const value = next.trim();
  if(!value) return;

  task.title = value;
  task.label = value;
  saveState();
  renderAll();
}

function deleteTask(id){
  const task = getTask(id);
  if(!task) return;

  pushUndo("delete");

  state.tasks = state.tasks.filter(t => t.id !== id);

  if(!task.done){
    state.baseline.totalTasks = Math.max(0, state.baseline.totalTasks - 1);
    state.baseline.totalEtorions = Math.max(0, state.baseline.totalEtorions - (task.etorionsTotal || 0));
  }

  if(state.currentTaskId === id){
    state.currentTaskId = null;
    state.currentTaskStart = null;
  }

  ensureCurrentTask();
  saveState();
  renderAll();
}

function completeTask(id = state.currentTaskId){
  const task = getTask(id);
  if(!task || task.done) return;

  pushUndo("complete");

  task.done = true;
  task.doneAt = nowISO();

  state.stats.tasksCompleted += 1;
  state.stats.taskHistory.push({
    label: task.title,
    etorionsUsed: task.initialEtorions || task.etorionsTotal || 1,
    date: task.doneAt
  });

  snapshotDay();
  ensureCurrentTask();
  saveState();
  renderAll();

  status("Tâche terminée. Une menace de moins.");
}

function restoreTask(id){
  const task = getTask(id);
  if(!task || !task.done) return;

  pushUndo("restore");
  task.done = false;
  task.doneAt = null;

  ensureCurrentTask();
  saveState();
  renderAll();
}

function degommeEtorion(){
  const task = getTask(state.currentTaskId);
  if(!task || task.done){
    status("Aucune tâche à traiter.");
    return;
  }

  pushUndo("degomme");

  task.etorionsLeft = clamp((task.etorionsLeft || 1) - 1, 0, 99);
  state.stats.etorionsDone += 1;

  if(task.etorionsLeft <= 0){
    completeTask(task.id);
    status("Étorions à zéro. Tâche neutralisée.");
    return;
  }

  maybeShowTip();
  saveState();
  renderAll();

  status("💣 Un étorion de moins.");
}

/* =========================================================
   UNDO
========================================================= */

function pushUndo(label){
  state.undo.unshift({
    label,
    at: Date.now(),
    payload: safeClone(state)
  });

  state.undo = state.undo.slice(0, 25);
  saveState();
}

function doUndo(){
  const snapshot = state.undo.shift();
  if(!snapshot){
    status("Rien à annuler.");
    return;
  }

  state = migrateState(snapshot.payload);
  saveState();
  renderAll();
  status("Retour arrière.");
}

/* =========================================================
   HUD + CENTRAL RENDER
========================================================= */

function renderSubtitle(){
  const subtitle = $("subtitle");
  if(subtitle) subtitle.textContent = pickSubtitle();
}

function renderProgress(){
  const p = computeProgress();

  if($("progressFill")) $("progressFill").style.width = `${p.pct}%`;
  if($("progressPctIn")) $("progressPctIn").textContent = `${p.pct}%`;
  if($("progressBar")) $("progressBar").setAttribute("aria-valuenow", String(p.pct));
}

function renderHub(){
  ensureCurrentTask();

  const act = activeTasks();
  const done = doneTasks();
  const p = computeProgress();

  if($("statActive")) $("statActive").textContent = String(act.length);
  if($("statDone")) $("statDone").textContent = String(done.length);
  if($("statEtorions")) $("statEtorions").textContent = String(p.remE);

  if($("missionLineLeft")){
    $("missionLineLeft").textContent = `Tâches en cours (${done.length} finies · ${act.length}/${p.baseTasks || act.length || 0})`;
  }

  if($("pillTasks")) $("pillTasks").textContent = `${p.remT}/${p.baseTasks || 0} tâches`;
  if($("pillEto")) $("pillEto").textContent = `${p.remE}/${p.baseEtorions || 0} étorions`;
  if($("pillDone")) $("pillDone").textContent = `${done.length} ${done.length > 1 ? "faites" : "faite"}`;

  if($("pillMode")){
    const modeLabel = state.ui.focus ? "focus" : state.ui.serious ? "sérieux" : "normal";
    $("pillMode").textContent = `mode: ${modeLabel}`;
  }

  if($("pillFlow")){
    const f = state.settings.fatigue;
    const m = state.settings.motivation;
    const flow = (m >= 3 && f <= 2) ? "fort" : (m <= 1 && f >= 3) ? "fragile" : "stable";
    $("pillFlow").textContent = `flow: ${flow}`;
  }

  const task = getTask(state.currentTaskId);

  if(!task){
    $("taskTitle").textContent = "Aucune tâche sélectionnée";
    $("metaCat").textContent = "—";
    $("metaEt").textContent = "—";
    $("metaTimer").textContent = "00:00";
  }else{
    $("taskTitle").textContent = task.title;
    $("metaCat").textContent = task.cat || "Inbox";
    $("metaEt").textContent = `${task.etorionsLeft}/${task.etorionsTotal}`;
  }
}

function renderMetaTimer(){
  const task = getTask(state.currentTaskId);
  if(!task || !state.currentTaskStart){
    if($("metaTimer")) $("metaTimer").textContent = "00:00";
    return;
  }

  const ms = Date.now() - state.currentTaskStart;
  if($("metaTimer")) $("metaTimer").textContent = fmtMMSS(ms);
}

function toggleTaskMeta(){
  const meta = $("taskMetaDetails");
  if(!meta) return;
  meta.hidden = !meta.hidden;
}

/* =========================================================
   BELOW LIST
========================================================= */

function applyBelowListVisibility(){
  const list = $("belowList");
  if(!list) return;

  const visible = state.ui.showBelowList && (!state.ui.focus || state.settings.keepListInFocus);
  list.hidden = !visible;

  if($("listToggleBtn")){
    $("listToggleBtn").setAttribute("aria-pressed", state.ui.showBelowList ? "true" : "false");
  }
}

function renderBelowList(){
  const root = $("belowTasks");
  if(!root) return;

  const list = sortTasks(activeTasks());

  if(list.length === 0){
    root.innerHTML = `<div class="muted small">Aucune tâche.</div>`;
    return;
  }

  root.innerHTML = list.slice(0, 30).map(task => {
    const isCurrent = task.id === state.currentTaskId;

    return `
      <div class="card" style="${isCurrent ? "outline:2px solid color-mix(in srgb, var(--accent) 40%, transparent);" : ""}">
        <div class="card__left">
          <div class="card__title">${escapeHTML(task.title)}</div>
          <div class="card__sub">${escapeHTML(task.cat)} · ${task.etorionsLeft}/${task.etorionsTotal}</div>
        </div>

        <div class="card__actions">
          <button class="icon-btn" data-below-act="up" data-id="${task.id}" title="Monter">↑</button>
          <button class="icon-btn" data-below-act="down" data-id="${task.id}" title="Descendre">↓</button>
          <button class="icon-btn" data-below-act="pin" data-id="${task.id}" title="Épingler">${task.pinned ? "■" : "□"}</button>
          <button class="icon-btn" data-below-act="sel" data-id="${task.id}" title="Sélectionner">▶</button>
          <button class="icon-btn" data-below-act="done" data-id="${task.id}" title="Terminer">✓</button>
        </div>
      </div>
    `;
  }).join("");

  root.querySelectorAll("[data-below-act]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const act = btn.dataset.belowAct;
      const task = getTask(id);
      if(!task) return;

      if(act === "up") moveTask(id, -1);
      if(act === "down") moveTask(id, 1);
      if(act === "pin") task.pinned = !task.pinned;
      if(act === "sel") selectTask(id);
      if(act === "done") completeTask(id);

      saveState();
      renderAll();
    };
  });
}

/* =========================================================
   TASK PANEL
========================================================= */

function categories(){
  const set = new Set(state.tasks.map(task => task.cat || "Inbox"));
  const out = Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  out.unshift("Toutes");
  return out;
}

function renderCatFilter(){
  const select = $("catFilter");
  if(!select) return;

  const previous = select.value || "Toutes";
  select.innerHTML = "";

  categories().forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  select.value = categories().includes(previous) ? previous : "Toutes";
}

function renderTasksPanel(){
  renderCatFilter();

  const root = $("taskList");
  if(!root) return;

  const cat = $("catFilter")?.value || "Toutes";
  const view = $("viewFilter")?.value || "active";
  state.settings.listSort = $("sortFilter")?.value || state.settings.listSort;

  let list = state.tasks.slice();

  if(view === "active") list = list.filter(task => !task.done);
  if(view === "done") list = list.filter(task => task.done);
  if(cat !== "Toutes") list = list.filter(task => (task.cat || "Inbox") === cat);

  list = sortTasks(list);

  if(list.length === 0){
    root.innerHTML = `<div class="muted small">Rien ici.</div>`;
    return;
  }

  root.innerHTML = list.map(task => `
    <div class="card">
      <div class="card__left">
        <div class="card__title">${escapeHTML(task.title)}</div>
        <div class="card__sub">${escapeHTML(task.cat)} · ${task.etorionsLeft}/${task.etorionsTotal}${task.done ? " · Finie" : ""}</div>
      </div>

      <div class="card__actions">
        ${!task.done ? `<button class="icon-btn" data-task-act="sel" data-id="${task.id}" title="Sélectionner">${task.id === state.currentTaskId ? "★" : "▶"}</button>` : ""}
        ${!task.done ? `<button class="icon-btn" data-task-act="done" data-id="${task.id}" title="Terminer">✓</button>` : `<button class="icon-btn" data-task-act="restore" data-id="${task.id}" title="Restaurer">↩</button>`}
        <button class="icon-btn" data-task-act="edit" data-id="${task.id}" title="Éditer">≋</button>
        <button class="icon-btn" data-task-act="del" data-id="${task.id}" title="Supprimer">×</button>
      </div>
    </div>
  `).join("");

  root.querySelectorAll("[data-task-act]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const act = btn.dataset.taskAct;

      if(act === "sel") selectTask(id);
      if(act === "done") completeTask(id);
      if(act === "restore") restoreTask(id);
      if(act === "edit") editTaskPrompt(id);
      if(act === "del") deleteTask(id);
    };
  });
}

/* =========================================================
   NOTES
========================================================= */

function addNoteEntry(text){
  const value = String(text || "").trim();
  if(!value) return;

  state.notes.entries.unshift({
    id: uid(),
    text: value,
    at: nowISO()
  });

  state.notes.entries = state.notes.entries.slice(0, 120);
  saveState();
}

let notesSaveTimer = null;

function scheduleNotesSave(){
  if(notesSaveTimer) clearTimeout(notesSaveTimer);

  notesSaveTimer = setTimeout(() => {
    if($("notesArea")) state.notes.text = $("notesArea").value;
    if($("remindersArea")) state.notes.reminders = $("remindersArea").value;
    if($("notesAreaPanel")) state.notes.text = $("notesAreaPanel").value;
    if($("remindersAreaPanel")) state.notes.reminders = $("remindersAreaPanel").value;
    saveState();
  }, 300);
}

function renderNotesEntries(){
  const root = $("notesEntriesList");
  if(!root) return;

  const entries = state.notes.entries || [];

  if(entries.length === 0){
    root.innerHTML = `<div class="muted small">Aucune note horodatée.</div>`;
    return;
  }

  root.innerHTML = entries.slice(0, 30).map(entry => {
    const dt = new Date(entry.at);
    const stamp = dt.toLocaleString("fr-BE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    return `
      <div class="card">
        <div class="card__left">
          <div class="card__sub">${stamp}</div>
          <div class="card__title">${escapeHTML(entry.text)}</div>
        </div>
      </div>
    `;
  }).join("");
}

function renderNotesPanel(){
  if($("notesAreaPanel")) $("notesAreaPanel").value = state.notes.text || "";
  if($("remindersAreaPanel")) $("remindersAreaPanel").value = state.notes.reminders || "";
}

function renderNotesOverlay(){
  if($("notesArea")) $("notesArea").value = state.notes.text || "";
  if($("remindersArea")) $("remindersArea").value = state.notes.reminders || "";
  renderNotesEntries();
}

/* =========================================================
   TYPHONSE
========================================================= */

function addTyphonse(label){
  const value = String(label || "").trim();
  if(!value) return;

  state.notes.typhonse.push({
    id: uid(),
    label: value,
    done: false,
    createdAt: nowISO()
  });

  saveState();
  renderTyphonse();
}

function toggleTyphonse(id){
  const item = state.notes.typhonse.find(entry => entry.id === id);
  if(!item) return;

  item.done = !item.done;
  saveState();
  renderTyphonse();
}

function renderTyphonse(){
  const root = $("typhonseList");
  if(!root) return;

  const list = state.notes.typhonse || [];

  if(list.length === 0){
    root.innerHTML = `<div class="muted small">Typhonse est vide. Suspect, mais acceptable.</div>`;
    return;
  }

  root.innerHTML = list.map(item => `
    <div class="card">
      <div class="card__left">
        <div class="card__title">${item.done ? "✓ " : ""}${escapeHTML(item.label)}</div>
        <div class="card__sub">${item.done ? "Fait" : "En attente"}</div>
      </div>

      <div class="card__actions">
        <button class="icon-btn" data-ty-act="toggle" data-id="${item.id}" title="Cocher">${item.done ? "↩" : "✓"}</button>
        <button class="icon-btn" data-ty-act="del" data-id="${item.id}" title="Supprimer">×</button>
      </div>
    </div>
  `).join("");

  root.querySelectorAll("[data-ty-act]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const act = btn.dataset.tyAct;

      if(act === "toggle") toggleTyphonse(id);
      if(act === "del"){
        state.notes.typhonse = state.notes.typhonse.filter(entry => entry.id !== id);
        saveState();
        renderTyphonse();
      }
    };
  });
}

/* =========================================================
   KIFFANCE
========================================================= */

let lastKiffSuggestion = "";

function pickKiffance(){
  if(!state.kiffances.length) return "Bois de l’eau. Respire. Continue.";
  return pickRandom(state.kiffances);
}

function suggestKiffance(){
  lastKiffSuggestion = pickKiffance();

  if($("kiffSuggestionBox")) $("kiffSuggestionBox").textContent = lastKiffSuggestion;
  if($("overlayKiffSuggestion")) $("overlayKiffSuggestion").textContent = lastKiffSuggestion;
}

function addKiffanceAsTask(){
  const text = String(lastKiffSuggestion || "").trim();
  if(!text) return;

  pushUndo("kifftask");

  state.tasks.push({
    id: uid(),
    title: text,
    label: text,
    cat: "KIFFANCE",
    etorionsTotal: 1,
    etorionsLeft: 1,
    initialEtorions: 1,
    pinned: false,
    done: false,
    createdAt: nowISO(),
    doneAt: null
  });

  state.baseline.totalTasks += 1;
  state.baseline.totalEtorions += 1;

  saveState();
  ensureCurrentTask();
  renderAll();
}

function renderKiffance(){
  const root = $("kiffList");

  if(root){
    if(state.kiffances.length === 0){
      root.innerHTML = `<div class="muted small">Aucune kiffance.</div>`;
    }else{
      root.innerHTML = state.kiffances.map((kiff, index) => `
        <div class="card">
          <div class="card__left">
            <div class="card__title">${escapeHTML(kiff)}</div>
            <div class="card__sub">Récompense / pause utile</div>
          </div>

          <div class="card__actions">
            <button class="icon-btn" data-kiff-del="${index}" title="Supprimer">×</button>
          </div>
        </div>
      `).join("");

      root.querySelectorAll("[data-kiff-del]").forEach(btn => {
        btn.onclick = () => {
          const index = parseInt(btn.dataset.kiffDel, 10);
          pushUndo("kiffdel");
          state.kiffances.splice(index, 1);
          saveState();
          renderKiffance();
        };
      });
    }
  }

  if($("overlayKiffList")){
    $("overlayKiffList").innerHTML = state.kiffances.length
      ? state.kiffances.map(kiff => `
          <div class="card">
            <div class="card__left">
              <div class="card__title">${escapeHTML(kiff)}</div>
            </div>
          </div>
        `).join("")
      : `<div class="muted small">Aucune kiffance enregistrée.</div>`;
  }
}

/* =========================================================
   HABITS
========================================================= */

function addHabit(name, slots){
  const nm = String(name || "").trim();
  if(!nm) return;

  const sl = clamp(parseInt(slots, 10) || 8, 3, 12);

  state.habits.push({
    id: uid(),
    name: nm,
    slots: sl,
    checks: Array.from({ length: sl }, () => false),
    createdAt: nowISO()
  });

  saveState();
  renderHabitsPanel();
  snapshotDay();
}

function toggleHabitCheck(habitId, index){
  const habit = state.habits.find(h => h.id === habitId);
  if(!habit) return;

  habit.checks[index] = !habit.checks[index];
  saveState();
  renderHabitsPanel();
  snapshotDay();
}

function habitProgress(habit){
  const done = habit.checks.filter(Boolean).length;
  const total = habit.checks.length;
  return {
    done,
    total,
    pct: total ? Math.round(done / total * 100) : 0
  };
}

function renderHabitsPanel(){
  const root = $("habitsContent");
  if(!root) return;

  if(state.habits.length === 0){
    root.innerHTML = `<div class="muted small">Aucune habitude.</div>`;
    return;
  }

  root.innerHTML = state.habits.map(habit => {
    const progress = habitProgress(habit);

    return `
      <div class="soft-card">
        <div class="card__title">${escapeHTML(habit.name)} (${progress.done}/${progress.total})</div>

        <div class="row row--wrap">
          ${habit.checks.map((checked, idx) => `
            <button class="icon-btn" data-habit-id="${habit.id}" data-habit-index="${idx}" title="Case">${checked ? "✓" : "·"}</button>
          `).join("")}
        </div>

        <div class="row row--wrap">
          <button class="btn btn--ghost" data-habit-act="reset" data-habit="${habit.id}" type="button">Reset</button>
          <button class="btn btn--ghost" data-habit-act="del" data-habit="${habit.id}" type="button">Supprimer</button>
        </div>
      </div>
    `;
  }).join("");

  root.querySelectorAll("[data-habit-id]").forEach(btn => {
    btn.onclick = () => {
      toggleHabitCheck(btn.dataset.habitId, parseInt(btn.dataset.habitIndex, 10));
    };
  });

  root.querySelectorAll("[data-habit-act]").forEach(btn => {
    btn.onclick = () => {
      const act = btn.dataset.habitAct;
      const habitId = btn.dataset.habit;
      const habit = state.habits.find(h => h.id === habitId);
      if(!habit) return;

      if(act === "reset"){
        habit.checks = habit.checks.map(() => false);
      }else if(act === "del"){
        state.habits = state.habits.filter(h => h.id !== habitId);
      }

      saveState();
      renderHabitsPanel();
      snapshotDay();
    };
  });
}

/* =========================================================
   SETS
========================================================= */

function initSetsChecksForToday(){
  const dk = dayKey();

  for(const key of ["hospital", "consult"]){
    const set = state.sets[key];
    if(!set.checks) set.checks = {};
    if(!set.checks[dk]) set.checks[dk] = {};
  }
}

function setKeyItem(setName, patientIndex, itemIndex){
  return `${setName}|p${patientIndex}|i${itemIndex}`;
}

function toggleSetCheck(setName, patientIndex, itemIndex){
  initSetsChecksForToday();

  const dk = dayKey();
  const set = state.sets[setName];
  const key = setKeyItem(setName, patientIndex, itemIndex);

  set.checks[dk][key] = !set.checks[dk][key];

  saveState();
  renderSetsPanel();
  snapshotDay();
}

function resetSetToday(setName){
  initSetsChecksForToday();
  const dk = dayKey();
  state.sets[setName].checks[dk] = {};
  saveState();
  renderSetsPanel();
  snapshotDay();
}

function summarizeSetsToday(){
  initSetsChecksForToday();

  const dk = dayKey();
  const out = {};

  for(const key of ["hospital", "consult"]){
    const set = state.sets[key];
    const checks = set.checks?.[dk] || {};
    const total = set.patients * set.itemsPerPatient.length;
    const done = Object.values(checks).filter(Boolean).length;
    out[key] = { done, total };
  }

  return out;
}

function renderSetsPanel(){
  const root = $("setsContent");
  if(!root) return;

  initSetsChecksForToday();
  const dk = dayKey();

  const buildSet = (setKey, title) => {
    const set = state.sets[setKey];
    const checks = set.checks?.[dk] || {};
    const items = set.itemsPerPatient;

    let html = `
      <div class="soft-card">
        <div class="card__title">${title}</div>
        <div class="card__sub">${Object.values(checks).filter(Boolean).length}/${set.patients * items.length}</div>
    `;

    for(let p = 1; p <= set.patients; p++){
      html += `<div class="divider"></div><div class="card__sub">Patient ${p}</div>`;

      items.forEach((item, index) => {
        const key = setKeyItem(setKey, p, index);
        const checked = !!checks[key];

        html += `
          <div class="card">
            <div class="card__left">
              <div class="card__title">${escapeHTML(item)}</div>
            </div>

            <div class="card__actions">
              <button class="icon-btn" data-set="${setKey}" data-p="${p}" data-i="${index}" title="Cocher">${checked ? "✓" : "·"}</button>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
    return html;
  };

  root.innerHTML = buildSet("hospital", "HOSPITALIER") + buildSet("consult", "CONSULTATION");

  root.querySelectorAll("[data-set]").forEach(btn => {
    btn.onclick = () => {
      toggleSetCheck(
        btn.dataset.set,
        parseInt(btn.dataset.p, 10),
        parseInt(btn.dataset.i, 10)
      );
    };
  });

  if($("setsToggleBtn")){
    $("setsToggleBtn").setAttribute("aria-pressed", $("rightPanel")?.classList.contains("is-open") ? "true" : "false");
  }
}

/* =========================================================
   HISTORY + STATS
========================================================= */

function snapshotDay(){
  const dk = dayKey();

  const doneToday = state.tasks.filter(task =>
    task.done &&
    task.doneAt &&
    task.doneAt.startsWith(dk)
  );

  const active = activeTasks();
  const habitsSummary = state.habits.map(h => {
    const p = habitProgress(h);
    return {
      name: h.name,
      done: p.done,
      total: p.total
    };
  });

  const entry = {
    day: dk,
    doneTitles: doneToday.map(t => t.title),
    remainingTitles: active.map(t => t.title),
    doneTasks: doneToday.length,
    remainingTasks: active.length,
    doneEtorions: state.stats.etorionsDone,
    baselineEtorions: state.baseline.totalEtorions,
    habits: habitsSummary,
    sets: summarizeSetsToday()
  };

  const index = state.history.findIndex(h => h.day === dk);
  if(index >= 0) state.history[index] = entry;
  else state.history.unshift(entry);

  saveState();
}

function exportTodayText(){
  snapshotDay();
  const dk = dayKey();
  const entry = state.history.find(h => h.day === dk);
  if(!entry) return "Aucune donnée.";

  const lines = [];
  lines.push(`ELIMINATOR — RAPPORT JOURNALIER — ${dk}`);
  lines.push("");

  lines.push(`TÂCHES FAITES (${entry.doneTasks})`);
  if(entry.doneTitles.length === 0) lines.push("—");
  else entry.doneTitles.forEach(title => lines.push(`- ${title}`));
  lines.push("");

  lines.push(`TÂCHES RESTANTES (${entry.remainingTasks})`);
  if(entry.remainingTitles.length === 0) lines.push("—");
  else entry.remainingTitles.forEach(title => lines.push(`- ${title}`));
  lines.push("");

  lines.push(`HABITUDES`);
  if(!entry.habits.length) lines.push("—");
  else entry.habits.forEach(h => lines.push(`- ${h.name}: ${h.done}/${h.total}`));
  lines.push("");

  lines.push(`SETS`);
  const hs = entry.sets?.hospital || { done: 0, total: 0 };
  const cs = entry.sets?.consult || { done: 0, total: 0 };
  lines.push(`- HOSPITALIER: ${hs.done}/${hs.total}`);
  lines.push(`- CONSULTATION: ${cs.done}/${cs.total}`);
  lines.push("");

  lines.push(`STATS`);
  lines.push(`- ÉTORIONS DÉGOMMÉS: ${entry.doneEtorions}`);
  lines.push(`- BASE ÉTORIONS: ${entry.baselineEtorions}`);

  return lines.join("\n");
}

function renderHistoryPanel(){
  const root = $("historyContent");
  if(root){
    if(state.history.length === 0){
      root.innerHTML = `<div class="muted small">Pas encore d’historique.</div>`;
    }else{
      root.innerHTML = state.history.slice(0, 14).map(entry => `
        <div class="card">
          <div class="card__left">
            <div class="card__sub">${entry.day}</div>
            <div class="card__title">Faites: ${entry.doneTasks} · Restantes: ${entry.remainingTasks} · Étorions: ${entry.doneEtorions}</div>
          </div>
        </div>
      `).join("");
    }
  }

  const grid = $("calendarGrid");
  if(grid){
    const days = [];
    const today = new Date();

    for(let i = 29; i >= 0; i--){
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(dayKey(d));
    }

    const map = {};
    state.history.forEach(entry => {
      map[entry.day] = entry.doneTasks || 0;
    });

    const max = Math.max(1, ...Object.values(map), 1);

    grid.innerHTML = days.map(dk => {
      const value = map[dk] || 0;
      const intensity = clamp(value / max, 0, 1);
      const opacity = 0.08 + intensity * 0.42;
      const date = new Date(dk);

      return `
        <div class="calendar-cell" title="${dk} — ${value} tâche(s)">
          <div class="calendar-cell__fill" style="opacity:${opacity}"></div>
          <div class="calendar-cell__label">${String(date.getDate()).padStart(2, "0")}</div>
        </div>
      `;
    }).join("");
  }
}

function renderStatsPanel(){
  const progress = computeProgress();
  const dopamine = dopamineScore();

  const lines = [
    `Tâches complétées : ${state.stats.tasksCompleted}`,
    `Étorions dégommés : ${state.stats.etorionsDone}`,
    `Sessions : ${state.stats.sessions}`,
    `Progression restante : ${progress.pct}%`,
    `Dopamine score : ${dopamine}%`,
    `Habitudes : ${state.habits.length}`,
    `Tâches actives : ${activeTasks().length}`
  ];

  const html = lines.map(line => `
    <div class="card">
      <div class="card__left">
        <div class="card__title">${escapeHTML(line)}</div>
      </div>
    </div>
  `).join("");

  if($("statsContent")) $("statsContent").innerHTML = html;
  if($("statsContentPanel")) $("statsContentPanel").innerHTML = html;
}

/* =========================================================
   EXPORT
========================================================= */

function renderExport(){
  const out = $("exportOut");
  if(out) out.value = JSON.stringify(state, null, 2);
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    status("Copié.");
  }catch(_){
    status("Impossible de copier.");
  }
}

/* =========================================================
   TIPS
========================================================= */

function maybeShowTip(force = false){
  if(!force && Math.random() > state.settings.tipsChance) return;
  status(`Conseil — ${pickRandom(TIPS)}`, 6500);
}

/* =========================================================
   POMODORO
========================================================= */

let pomoTimer = null;
let pomoRunning = false;
let remainingMs = 0;

function currentPhaseMinutes(){
  return state.pomodoro.phase === "break" ? state.pomodoro.breakMin : state.pomodoro.workMin;
}

function resetPhase(){
  remainingMs = clamp(currentPhaseMinutes(), 1, 120) * 60 * 1000;
  renderPomodoro();
}

function renderPomodoro(){
  if($("pomoTime")){
    $("pomoTime").textContent = fmtMMSS(remainingMs);
    $("pomoTime").classList.toggle("is-running", pomoRunning);
  }
}

function pausePomo(){
  pomoRunning = false;
  if(pomoTimer) clearInterval(pomoTimer);
  pomoTimer = null;
  renderPomodoro();
}

function playPomo(){
  if(pomoRunning) return;
  if(!remainingMs) resetPhase();

  pomoRunning = true;
  renderPomodoro();

  pomoTimer = setInterval(() => {
    remainingMs -= 250;

    if(remainingMs <= 0){
      remainingMs = 0;
      pausePomo();

      state.pomodoro.phase = state.pomodoro.phase === "work" ? "break" : "work";
      saveState();

      status(`⏰ ${state.pomodoro.phase === "work" ? "Pomodoro" : "Pause"} prêt.`);

      resetPhase();

      if(state.pomodoro.autoStart === "auto"){
        playPomo();
      }
      return;
    }

    renderPomodoro();
  }, 250);
}

function togglePomo(){
  if(pomoRunning) pausePomo();
  else playPomo();
}

/* =========================================================
   PREFS + FLOW
========================================================= */

function syncPrefsUI(){
  if($("modeSel")) $("modeSel").value = state.ui.mode;
  if($("seasonSel")) $("seasonSel").value = state.ui.season;
  if($("fontSel")) $("fontSel").value = state.ui.font;
  if($("uiScale")) $("uiScale").value = state.ui.baseSize;
  if($("seriousSel")) $("seriousSel").value = state.ui.serious ? "on" : "off";
  if($("keepListFocusSel")) $("keepListFocusSel").value = String(!!state.settings.keepListInFocus);
  if($("fatigueSel")) $("fatigueSel").value = state.settings.fatigue;
  if($("motivationSel")) $("motivationSel").value = state.settings.motivation;
  if($("workMinSel")) $("workMinSel").value = state.pomodoro.workMin;
  if($("breakMinSel")) $("breakMinSel").value = state.pomodoro.breakMin;
}

function syncFlowPanel(){
  if($("fatigueInline")) $("fatigueInline").value = state.settings.fatigue;
  if($("motivationInline")) $("motivationInline").value = state.settings.motivation;
  if($("celeChanceInline")) $("celeChanceInline").value = state.settings.celebrationChance;
  if($("tipsChanceInline")) $("tipsChanceInline").value = state.settings.tipsChance;
}

function applyPrefsFromPanel(){
  state.ui.mode = $("modeSel")?.value || state.ui.mode;
  state.ui.season = $("seasonSel")?.value || state.ui.season;
  state.ui.font = $("fontSel")?.value || state.ui.font;
  state.ui.baseSize = clamp(parseInt($("uiScale")?.value, 10) || state.ui.baseSize, 14, 18);
  state.ui.serious = ($("seriousSel")?.value || "off") === "on";

  state.settings.keepListInFocus = ($("keepListFocusSel")?.value || "true") === "true";
  state.settings.fatigue = clamp(parseInt($("fatigueSel")?.value, 10) || state.settings.fatigue, 0, 4);
  state.settings.motivation = clamp(parseInt($("motivationSel")?.value, 10) || state.settings.motivation, 0, 4);

  state.pomodoro.workMin = clamp(parseInt($("workMinSel")?.value, 10) || state.pomodoro.workMin, 5, 90);
  state.pomodoro.breakMin = clamp(parseInt($("breakMinSel")?.value, 10) || state.pomodoro.breakMin, 1, 30);

  saveState();
  applyTheme();
  resetPhase();
  renderAll();
}

function resetPrefs(){
  state.ui.mode = "clair";
  state.ui.season = "automne";
  state.ui.font = "inter";
  state.ui.baseSize = 16;
  state.ui.serious = false;
  state.settings.keepListInFocus = true;
  state.settings.fatigue = 2;
  state.settings.motivation = 2;
  state.pomodoro.workMin = 25;
  state.pomodoro.breakMin = 5;

  saveState();
  syncPrefsUI();
  applyTheme();
  resetPhase();
  renderAll();
}

/* =========================================================
   RESET GLOBAL
========================================================= */

function resetDay(){
  pushUndo("reset");

  state.tasks = [];
  state.baseline = {
    totalTasks: 0,
    totalEtorions: 0
  };
  state.currentTaskId = null;
  state.currentTaskStart = null;
  state.stats.sessions += 1;
  state.stats.tasksCompleted = 0;
  state.stats.etorionsDone = 0;
  state.undo = [];

  saveState();
  renderAll();

  status("Reset total. Terrain nettoyé.");
}

/* =========================================================
   RENDER GLOBAL
========================================================= */

function renderAll(){
  applyTheme();
  renderSubtitle();
  renderProgress();
  renderHub();
  renderMetaTimer();
  renderTasksPanel();
  renderBelowList();
  applyBelowListVisibility();
  renderKiffance();
  renderHabitsPanel();
  renderSetsPanel();
  renderHistoryPanel();
  renderStatsPanel();
  renderNotesPanel();
  renderExport();
  renderPomodoro();
}

/* =========================================================
   TIMERS
========================================================= */

let taskTimerLoop = null;
function startTaskTimerLoop(){
  if(taskTimerLoop) clearInterval(taskTimerLoop);
  taskTimerLoop = setInterval(() => {
    renderMetaTimer();
  }, 500);
}

/* =========================================================
   EVENTS
========================================================= */

function bindUI(){
  $("btnLeft")?.addEventListener("click", () => openPanel("left"));
  $("btnRight")?.addEventListener("click", () => openPanel("right"));
  $("leftClose")?.addEventListener("click", closePanels);
  $("rightClose")?.addEventListener("click", closePanels);
  $("panelBack")?.addEventListener("click", closePanels);

  $("modeToggle")?.addEventListener("click", () => {
    state.ui.mode = state.ui.mode === "sombre" ? "clair" : "sombre";
    saveState();
    applyTheme();
  });

  $("seasonCycle")?.addEventListener("click", () => {
    const index = SEASONS.indexOf(state.ui.season);
    state.ui.season = SEASONS[(index + 1) % SEASONS.length];
    saveState();
    applyTheme();
  });

  $("seriousToggle")?.addEventListener("click", () => {
    state.ui.serious = !state.ui.serious;
    saveState();
    applyTheme();
    renderHub();
  });

  $("focusBtn")?.addEventListener("click", () => {
    state.ui.focus = !state.ui.focus;
    saveState();
    applyTheme();
    renderHub();
    applyBelowListVisibility();
  });

  $("listToggleBtn")?.addEventListener("click", () => {
    state.ui.showBelowList = !state.ui.showBelowList;
    saveState();
    applyBelowListVisibility();
  });

  $("setsToggleBtn")?.addEventListener("click", () => {
    openPanel("right");
    const setsTab = document.querySelector('.tab-btn[data-righttab="sets"]');
    if(setsTab) setsTab.click();
  });

  $("btnHideBelow")?.addEventListener("click", () => {
    state.ui.showBelowList = false;
    saveState();
    applyBelowListVisibility();
  });

  $("undoBtn")?.addEventListener("click", doUndo);

  $("rouletteBtn")?.addEventListener("click", () => {
    $("rouletteWheel")?.classList.remove("is-spinning");
    void $("rouletteWheel")?.offsetWidth;
    $("rouletteWheel")?.classList.add("is-spinning");

    const pick = roulettePick();
    if(!pick){
      status("Rien à tirer.");
      return;
    }

    state.currentTaskId = pick.id;
    state.currentTaskStart = Date.now();
    saveState();
    renderAll();
    maybeShowTip();

    setTimeout(() => {
      $("rouletteWheel")?.classList.remove("is-spinning");
    }, 900);
  });

  $("bombBtn")?.addEventListener("click", degommeEtorion);
  $("doneTaskBtn")?.addEventListener("click", () => completeTask());
  $("editTaskBtn")?.addEventListener("click", () => editTaskPrompt(state.currentTaskId));
  $("taskInfoBtn")?.addEventListener("click", toggleTaskMeta);

  $("openNotes")?.addEventListener("click", () => openOverlay("notes"));
  $("openTyphonse")?.addEventListener("click", () => openOverlay("typhonse"));
  $("openKiffance")?.addEventListener("click", () => openOverlay("kiffance"));
  $("openStats")?.addEventListener("click", () => openOverlay("stats"));

  $("belowListToggleBtn")?.addEventListener("click", () => {
    state.ui.showBelowList = !state.ui.showBelowList;
    saveState();
    applyBelowListVisibility();
  });

  $("overlayClose")?.addEventListener("click", closeOverlay);

  $("modalBack")?.addEventListener("click", () => {
    closeOverlay();
    $("pomoModal").hidden = true;
    $("modalBack").hidden = true;
  });

  $("inboxAdd")?.addEventListener("click", () => {
    const count = importFromInbox($("inboxText")?.value || "");
    if(count > 0){
      addNoteEntry(`Import de ${count} tâche(s).`);
      $("inboxText").value = "";
      status(`${count} tâche(s) importée(s).`);
    }else{
      status("Rien importé.");
    }
  });

  $("inboxClear")?.addEventListener("click", () => {
    if($("inboxText")) $("inboxText").value = "";
  });

  $("catFilter")?.addEventListener("change", renderTasksPanel);
  $("viewFilter")?.addEventListener("change", renderTasksPanel);

  $("sortFilter")?.addEventListener("change", () => {
    state.settings.listSort = $("sortFilter").value;
    saveState();
    renderTasksPanel();
    renderBelowList();
  });

  $("kiffAdd")?.addEventListener("click", () => {
    const txt = $("kiffNew")?.value?.trim();
    if(!txt) return;

    state.kiffances.push(txt);
    $("kiffNew").value = "";
    saveState();
    renderKiffance();
  });

  $("kiffSuggest")?.addEventListener("click", suggestKiffance);
  $("kiffToTask")?.addEventListener("click", addKiffanceAsTask);
  $("overlayKiffRefresh")?.addEventListener("click", suggestKiffance);
  $("overlayKiffToTask")?.addEventListener("click", addKiffanceAsTask);

  $("prefsApply")?.addEventListener("click", applyPrefsFromPanel);
  $("prefsReset")?.addEventListener("click", resetPrefs);

  $("exportBtn")?.addEventListener("click", () => copyText(JSON.stringify(state, null, 2)));
  $("reportBtn")?.addEventListener("click", () => copyText(exportTodayText()));
  $("wipeBtn")?.addEventListener("click", resetDay);

  $("habitAddBtn")?.addEventListener("click", () => {
    addHabit($("habitName")?.value, $("habitSlots")?.value);
    if($("habitName")) $("habitName").value = "";
  });

  $("hospPatients")?.addEventListener("change", (e) => {
    state.sets.hospital.patients = clamp(parseInt(e.target.value, 10) || 4, 1, 20);
    saveState();
    renderSetsPanel();
  });

  $("consPatients")?.addEventListener("change", (e) => {
    state.sets.consult.patients = clamp(parseInt(e.target.value, 10) || 6, 1, 30);
    saveState();
    renderSetsPanel();
  });

  $("hospResetToday")?.addEventListener("click", () => resetSetToday("hospital"));
  $("consResetToday")?.addEventListener("click", () => resetSetToday("consult"));

  $("saveFlowBtn")?.addEventListener("click", () => {
    state.settings.fatigue = clamp(parseInt($("fatigueInline").value, 10) || state.settings.fatigue, 0, 4);
    state.settings.motivation = clamp(parseInt($("motivationInline").value, 10) || state.settings.motivation, 0, 4);
    state.settings.celebrationChance = clamp(Number($("celeChanceInline").value) || state.settings.celebrationChance, 0, 1);
    state.settings.tipsChance = clamp(Number($("tipsChanceInline").value) || state.settings.tipsChance, 0, 1);

    saveState();
    renderHub();
    renderStatsPanel();
    status("Flow sauvé.");
  });

  $("testTipBtn")?.addEventListener("click", () => maybeShowTip(true));
  $("testCeleBtn")?.addEventListener("click", () => status("Célébration test. Le cosmos te remarque.", 5000));

  $("notesArea")?.addEventListener("input", scheduleNotesSave);
  $("remindersArea")?.addEventListener("input", scheduleNotesSave);
  $("notesAreaPanel")?.addEventListener("input", scheduleNotesSave);
  $("remindersAreaPanel")?.addEventListener("input", scheduleNotesSave);

  $("btnAddTyphonse")?.addEventListener("click", () => {
    addTyphonse($("typhonseInput")?.value);
    if($("typhonseInput")) $("typhonseInput").value = "";
  });

  $("pomoTime")?.addEventListener("click", togglePomo);

  $("pomoEdit")?.addEventListener("click", () => {
    $("pomoModal").hidden = false;
    $("modalBack").hidden = false;

    $("pomoMinutes").value = state.pomodoro.workMin;
    $("breakMinutes").value = state.pomodoro.breakMin;
    $("autoStartSel").value = state.pomodoro.autoStart;
  });

  $("modalClose")?.addEventListener("click", () => {
    $("pomoModal").hidden = true;
    $("modalBack").hidden = true;
  });

  $("pomoApply")?.addEventListener("click", () => {
    state.pomodoro.workMin = clamp(parseInt($("pomoMinutes").value, 10) || 25, 5, 90);
    state.pomodoro.breakMin = clamp(parseInt($("breakMinutes").value, 10) || 5, 1, 30);
    state.pomodoro.autoStart = $("autoStartSel").value || "auto";

    saveState();
    resetPhase();

    $("pomoModal").hidden = true;
    $("modalBack").hidden = true;
  });

  $("pomoReset")?.addEventListener("click", () => {
    pausePomo();
    resetPhase();
  });
}

/* =========================================================
   INIT
========================================================= */

function init(){
  applyTheme();
  bindTabs();
  bindUI();
  syncPrefsUI();
  syncFlowPanel();
  renderNotesOverlay();
  renderTyphonse();
  renderKiffance();
  renderHabitsPanel();
  renderSetsPanel();
  renderHistoryPanel();
  renderStatsPanel();
  renderAll();
  resetPhase();
  startTaskTimerLoop();

  if($("hospPatients")) $("hospPatients").value = state.sets.hospital.patients;
  if($("consPatients")) $("consPatients").value = state.sets.consult.patients;
}

document.addEventListener("DOMContentLoaded", init);
