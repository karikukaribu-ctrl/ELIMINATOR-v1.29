const $ = (id) => document.getElementById(id);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const uid = () => Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
const nowISO = () => new Date().toISOString();

const STORAGE_KEY = "eliminator_v2_perfected";
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
  "Un seul étorion. Pas un opéra intérieur.",
  "Épaules basses. Mâchoire relâchée. Continue.",
  "Commence moche. Le cerveau adore négocier, ignore-le.",
  "Une seule cible. Un seul onglet. Un seul monde.",
  "Tu n’as pas besoin d’envie. Tu as besoin d’élan.",
  "Fais petit. Mais fais réel."
];

const CELEBRATIONS = {
  fantasy: [
    {
      title: "BANNIÈRE PLANTÉE",
      msg: "Le territoire du bazar vient de perdre un village stratégique. Une chèvre prophétique confirme la victoire."
    },
    {
      title: "CHANT DE VICTOIRE",
      msg: "Une tâche est tombée. Au loin, les montagnes administratives ont gémi comme un classeur humide."
    },
    {
      title: "DRAGON COMPTABLE TERRASSÉ",
      msg: "La bête gardait ce dossier depuis mille ans. Tu l’as vaincue avec calme, et probablement sans cape."
    },
    {
      title: "LE BÂTON A FRAPPÉ LE PAVÉ",
      msg: "Quelque part, Gandalf le Blanc approuve d’un hochement de sourcil et décrète que, oui, tu passeras."
    }
  ],
  dream: [
    {
      title: "ARCHITECTE DU RÉEL",
      msg: "Tu viens de plier un morceau de journée dans le bon sens. La réalité, surprise, coopère."
    },
    {
      title: "TOTEM : STABLE",
      msg: "Le monde intérieur vacillait un peu. Puis tu as fait une vraie chose. C’est déjà une architecture."
    },
    {
      title: "ORIGAMI DU TEMPS RÉUSSI",
      msg: "Tu as pris une minute informe et tu en as fait une forme utile. Le réel trouve cela vaguement insultant."
    }
  ],
  ninja: [
    {
      title: "TECHNIQUE INTERDITE",
      msg: "Coup propre. La tâche n’a même pas eu le temps de préparer un discours défensif."
    },
    {
      title: "MODE INFILTRATION",
      msg: "Tu es passé entre les lasers de la distraction. Personne n’a rien vu. Sauf le résultat."
    },
    {
      title: "ASSASSINAT ADMINISTRATIF ÉLÉGANT",
      msg: "Une formalité de moins. La paperasse a glissé dans le néant avec une politesse remarquable."
    }
  ],
  med: [
    {
      title: "GESTE CHIRURGICAL",
      msg: "Incision nette dans le chaos. Champ propre. Fermeture sans complication. L’équipe est satisfaite."
    },
    {
      title: "DIAGNOSTIC : RÉSOLU",
      msg: "Symptôme : tâche persistante. Traitement : action ciblée. Évolution : favorable, presque insolente."
    },
    {
      title: "HÉMOSTASE PARFAITE",
      msg: "Une fuite d’énergie vient d’être stoppée. Le pronostic fonctionnel s’améliore à vue d’œil."
    }
  ],
  game: [
    {
      title: "QUÊTE VALIDÉE",
      msg: "Objectif atteint. Butin obtenu : paix mentale légère, dignité +2, confusion -1."
    },
    {
      title: "ACHIEVEMENT DÉBLOQUÉ",
      msg: "« Je termine ce que je commence ». Succès rare. Les anciens pensaient cela impossible."
    },
    {
      title: "INVENTAIRE ALLÉGÉ",
      msg: "Une charge de moins dans le sac de quêtes. Tu marches déjà mieux, petit héros fonctionnel."
    }
  ],
  empire: [
    {
      title: "EMPIRE ÉTENDU",
      msg: "Un étorion de moins. Ton autorité sur la journée augmente d’un cran parfaitement délicieux."
    },
    {
      title: "HÉROÏSME ADMINISTRATIF",
      msg: "La bureaucratie a levé un sourcil. Tu l’as écrasé avec une action concrète. Très beau geste."
    },
    {
      title: "RÉVOLTE ÉTOUFFÉE",
      msg: "Une poche de désorganisation a tenté de résister. Elle a été traitée avec le tact brutal nécessaire."
    },
    {
      title: "SAMWISE APPROUVE",
      msg: "Ce n’est peut-être pas glorieux, mais c’est du vrai courage de jardinier : avancer encore d’un pas avec la casserole sur le dos."
    }
  ]
};

const defaultState = {
  ui: {
    mode: "clair",
    season: "automne",
    serious: false,
    focus: false,
    font: "yusei",
    baseSize: 16,
    showBelowList: false,
    leftPanelWidth: 380,
    rightPanelWidth: 430
  },

  settings: {
    fatigue: 2,
    motivation: 2,
    tipsChance: 0.18,
    celebrationChance: 0.30,
    celebrationAutoCloseSec: 7,
    keepListInFocus: true,
    listSort: "roulette",
    includedCats: [],
    statsRangeDays: 30
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
    "Étire nuque et épaules 45 secondes.",
    "Regarde au loin 20 secondes. Reviens.",
    "Micro-reset : eau, respiration, retour.",
    "Fenêtre ouverte 30 secondes. Puis reprise nette."
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
      patients: [
        { id: uid(), name: "Patient 1" },
        { id: uid(), name: "Patient 2" },
        { id: uid(), name: "Patient 3" },
        { id: uid(), name: "Patient 4" }
      ],
      itemsPerPatient: ["Voir patient", "Note", "Traitement", "Dossier"],
      checks: {}
    },
    consult: {
      enabled: true,
      patients: [
        { id: uid(), name: "Patient 1" },
        { id: uid(), name: "Patient 2" },
        { id: uid(), name: "Patient 3" },
        { id: uid(), name: "Patient 4" },
        { id: uid(), name: "Patient 5" },
        { id: uid(), name: "Patient 6" }
      ],
      itemsPerPatient: ["Voir patient", "Note", "Ordonnance", "Dossier"],
      checks: {}
    }
  },

  history: [],

  stats: {
    tasksCompleted: 0,
    etorionsDone: 0,
    sessions: 0,
    taskHistory: [],
    celebrationsShown: 0
  }
};

let state = loadState();

/* =========================
   STORAGE
========================= */

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

function normalizePatients(setObj, fallbackCount){
  if(Array.isArray(setObj.patients)){
    setObj.patients = setObj.patients.map((p, i) => ({
      id: p?.id || uid(),
      name: p?.name || `Patient ${i + 1}`
    }));
    return;
  }

  const count = typeof setObj.patients === "number" ? setObj.patients : fallbackCount;
  setObj.patients = Array.from({ length: count }, (_, i) => ({
    id: uid(),
    name: `Patient ${i + 1}`
  }));
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

  normalizePatients(merged.sets.hospital, 4);
  normalizePatients(merged.sets.consult, 6);

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
    if(typeof task.today !== "boolean") task.today = false;
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

/* =========================
   HELPERS
========================= */

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
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : "";
}

function pickSubtitle(){
  return pickRandom(SUBLINES);
}

let statusTimer = null;
function status(message, ms = 4200){
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

/* =========================
   DOM SAFETY
========================= */

function setRootCssVars(){
  document.documentElement.style.setProperty("--baseSize", `${clamp(state.ui.baseSize, 14, 18)}px`);
  document.documentElement.style.setProperty("--panelLeft", `${clamp(state.ui.leftPanelWidth || 380, 300, 620)}px`);
  document.documentElement.style.setProperty("--panelRight", `${clamp(state.ui.rightPanelWidth || 430, 320, 720)}px`);
}

function syncPanelWidthInputs(){
  if($("leftPanelWidth")) $("leftPanelWidth").value = String(clamp(state.ui.leftPanelWidth || 380, 300, 620));
  if($("rightPanelWidth")) $("rightPanelWidth").value = String(clamp(state.ui.rightPanelWidth || 430, 320, 720));
}

/* =========================
   THEME + MODES
========================= */

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
  setRootCssVars();

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
  }

  document.title = state.ui.focus ? "ELIMINATOR — Focus" : "ELIMINATOR";
}

/* =========================
   PANELS + TABS
========================= */

function showPanelBack(show){
  const el = $("panelBack");
  if(!el) return;
  if(show){
    el.removeAttribute("hidden");
  }else{
    el.setAttribute("hidden", "");
  }
}

function openPanel(which){
  const left = $("leftPanel");
  const right = $("rightPanel");
  if(!left || !right) return;

  showPanelBack(true);
  document.body.style.overflow = "hidden";

  if(which === "left"){
    left.removeAttribute("hidden");
    right.setAttribute("hidden", "");
  }else{
    right.removeAttribute("hidden");
    left.setAttribute("hidden", "");
  }
}

function closePanels(){
  $("leftPanel")?.setAttribute("hidden", "");
  $("rightPanel")?.setAttribute("hidden", "");
  showPanelBack(false);
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

/* =========================
   OVERLAYS / MODALS
========================= */

function showModalBack(show){
  const el = $("modalBack");
  if(!el) return;
  if(show){
    el.removeAttribute("hidden");
  }else{
    el.setAttribute("hidden", "");
  }
}

function closeOverlay(){
  $("overlayModal")?.setAttribute("hidden", "");
  showModalBack(false);
  $$(".overlay-page").forEach(page => {
    page.setAttribute("hidden", "");
    page.classList.remove("is-show");
  });
}

function openOverlay(which){
  $("overlayModal")?.removeAttribute("hidden");
  showModalBack(true);

  $$(".overlay-page").forEach(page => {
    page.setAttribute("hidden", "");
    page.classList.remove("is-show");
  });

  const page = $(`overlay-${which}`);
  if(page){
    page.removeAttribute("hidden");
    page.classList.add("is-show");
  }

  const titleMap = {
    notes: "Notes",
    typhonse: "Typhonse",
    kiffance: "Kiffance",
    stats: "Stats"
  };

  if($("overlayTitle")) $("overlayTitle").textContent = titleMap[which] || "Fenêtre";

  if(which === "notes") renderNotesOverlay();
  if(which === "typhonse") renderTyphonse();
  if(which === "kiffance"){
    suggestKiffance();
  }
  if(which === "stats") renderStatsPanel();
}

function openPomoModal(){
  $("pomoModal")?.removeAttribute("hidden");
  showModalBack(true);

  if($("pomoMinutes")) $("pomoMinutes").value = state.pomodoro.workMin;
  if($("breakMinutes")) $("breakMinutes").value = state.pomodoro.breakMin;
  if($("autoStartSel")) $("autoStartSel").value = state.pomodoro.autoStart;
}

function closePomoModal(){
  $("pomoModal")?.setAttribute("hidden", "");
  showModalBack(false);
}

/* =========================
   TASK IMPORT + ESTIMATION
========================= */

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
      today: false,
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

/* =========================
   TASK ENGINE
========================= */

function activeTasks(){
  const included = state.settings.includedCats;
  let base = state.tasks.filter(task => !task.done);

  if(included && included.length > 0){
    base = base.filter(task => {
      if(included.includes("CE JOUR") && task.today) return true;
      return included.includes(task.cat);
    });
  }

  return base;
}

function doneTasks(){
  return state.tasks.filter(task => task.done);
}

function getTask(id){
  return state.tasks.find(task => task.id === id) || null;
}

function sortTasks(list){
  const mode = state.settings.listSort || "roulette";

  const todayScore = (task) => task.today ? -1 : 0;
  const pinScore = (task) => task.pinned ? -1 : 0;

  if(mode === "alpha"){
    return [...list].sort((a, b) => {
      const t = todayScore(a) - todayScore(b);
      if(t !== 0) return t;
      const p = pinScore(a) - pinScore(b);
      if(p !== 0) return p;
      return a.title.localeCompare(b.title, "fr");
    });
  }

  if(mode === "cat"){
    return [...list].sort((a, b) => {
      const t = todayScore(a) - todayScore(b);
      if(t !== 0) return t;
      const p = pinScore(a) - pinScore(b);
      if(p !== 0) return p;
      const c = a.cat.localeCompare(b.cat, "fr");
      return c !== 0 ? c : a.title.localeCompare(b.title, "fr");
    });
  }

  if(mode === "ordre"){
    return [...list].sort((a, b) => {
      const t = todayScore(a) - todayScore(b);
      if(t !== 0) return t;
      const p = pinScore(a) - pinScore(b);
      if(p !== 0) return p;
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    });
  }

  return [...list].sort((a, b) => {
    const t = todayScore(a) - todayScore(b);
    if(t !== 0) return t;
    const p = pinScore(a) - pinScore(b);
    if(p !== 0) return p;
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
    const today = actives.find(task => task.today);
    const pinned = actives.find(task => task.pinned);
    state.currentTaskId = (today || pinned || actives[0]).id;
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

  const today = tasks.filter(task => task.today);
  const pinned = tasks.filter(task => task.pinned);
  let pool = today.length ? today : (pinned.length ? pinned : [...tasks]);

  pool.sort((a, b) => (a.etorionsLeft || a.etorionsTotal) - (b.etorionsLeft || b.etorionsTotal));
  const sample = pool.slice(0, Math.min(4, pool.length));

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

function toggleTodayTask(id){
  const task = getTask(id);
  if(!task || task.done) return;
  task.today = !task.today;
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
  maybeShowCelebration();
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

/* =========================
   UNDO
========================= */

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

/* =========================
   CELEBRATIONS + FX
========================= */

let celebrateTimer = null;

function weightedCelebrationPool(){
  const fatigue = state.settings.fatigue;
  const motivation = state.settings.motivation;

  const weights = {
    fantasy: 1 + (fatigue >= 3 ? 0.3 : 0) + (motivation >= 3 ? 0.2 : 0),
    dream:   1 + (fatigue >= 3 ? 0.5 : 0),
    ninja:   1 + (motivation >= 3 ? 0.6 : 0),
    med:     1 + (fatigue >= 2 ? 0.4 : 0),
    game:    1 + (motivation >= 2 ? 0.5 : 0),
    empire:  1 + (motivation >= 3 ? 0.7 : 0)
  };

  const pool = [];
  Object.entries(CELEBRATIONS).forEach(([family, arr]) => {
    const w = Math.max(1, Math.round((weights[family] || 1) * 2));
    for(let i = 0; i < w; i++){
      pool.push(...arr.map(item => ({ ...item, family })));
    }
  });

  return pool;
}

function pickCelebration(){
  return pickRandom(weightedCelebrationPool());
}

function ensureCelebrationShell(){
  let shell = $("celebrateShell");
  if(shell) return shell;

  shell = document.createElement("div");
  shell.id = "celebrateShell";
  shell.setAttribute("hidden", "");
  shell.style.position = "fixed";
  shell.style.inset = "0";
  shell.style.zIndex = "9999";
  shell.style.display = "grid";
  shell.style.placeItems = "center";
  shell.style.pointerEvents = "none";

  shell.innerHTML = `
    <canvas id="celebrateCanvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;"></canvas>
    <div id="celebrateCard" style="
      min-width:min(760px,92vw);
      max-width:min(760px,92vw);
      padding:20px 22px;
      border-radius:22px;
      border:1px solid rgba(255,255,255,.16);
      background:rgba(255,255,255,.12);
      backdrop-filter:blur(20px);
      -webkit-backdrop-filter:blur(20px);
      box-shadow:0 18px 44px rgba(0,0,0,.18);
      text-align:center;
      color:white;
      position:relative;
      overflow:hidden;
    ">
      <div id="celebrateTitle" style="font-size:28px;font-weight:800;letter-spacing:.04em;margin-bottom:10px;"></div>
      <div id="celebrateMsg" style="font-size:16px;line-height:1.45;opacity:.96;"></div>
    </div>
  `;
  document.body.appendChild(shell);
  return shell;
}

function runFireworks(canvas){
  if(!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const particles = [];
  const colors = ["#ffd86b", "#ff8e72", "#8fe3ff", "#bfa7ff", "#ffffff", "#9ee27f"];

  for(let burst = 0; burst < 4; burst++){
    const cx = Math.random() * w * 0.8 + w * 0.1;
    const cy = Math.random() * h * 0.45 + h * 0.1;
    const count = 40 + Math.floor(Math.random() * 22);

    for(let i = 0; i < count; i++){
      const angle = (Math.PI * 2 * i) / count;
      const speed = 1.6 + Math.random() * 3.8;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        size: 1.5 + Math.random() * 2.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.03 + Math.random() * 0.03
      });
    }
  }

  const confetti = [];
  for(let i = 0; i < 120; i++){
    confetti.push({
      x: Math.random() * w,
      y: -20 - Math.random() * 100,
      vx: -1 + Math.random() * 2,
      vy: 1.5 + Math.random() * 2.5,
      rot: Math.random() * Math.PI,
      vr: -0.08 + Math.random() * 0.16,
      size: 4 + Math.random() * 6,
      alpha: 0.8 + Math.random() * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  let frame = 0;

  function tick(){
    frame++;
    ctx.clearRect(0, 0, w, h);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha *= 0.985;
    });

    confetti.forEach(c => {
      c.x += c.vx;
      c.y += c.vy;
      c.rot += c.vr;
      c.vy += 0.02;
      c.alpha *= 0.995;
    });

    particles.forEach(p => {
      if(p.alpha <= 0.03) return;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    confetti.forEach(c => {
      if(c.alpha <= 0.04) return;
      ctx.save();
      ctx.globalAlpha = c.alpha;
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.7);
      ctx.restore();
    });

    ctx.globalAlpha = 1;

    const alive = particles.some(p => p.alpha > 0.03) || confetti.some(c => c.alpha > 0.04);
    if(frame < 180 && alive){
      requestAnimationFrame(tick);
    }else{
      ctx.clearRect(0, 0, w, h);
    }
  }

  requestAnimationFrame(tick);
}

function maybeShowCelebration(force = false){
  if(!force && Math.random() > state.settings.celebrationChance) return;

  const cele = pickCelebration();
  if(!cele) return;

  const shell = ensureCelebrationShell();
  const title = $("celebrateTitle");
  const msg = $("celebrateMsg");
  const canvas = $("celebrateCanvas");

  if(title) title.textContent = cele.title;
  if(msg) msg.textContent = cele.msg;

  shell.removeAttribute("hidden");
  runFireworks(canvas);

  state.stats.celebrationsShown += 1;
  saveState();

  if(celebrateTimer) clearTimeout(celebrateTimer);
  celebrateTimer = setTimeout(() => {
    shell.setAttribute("hidden", "");
  }, clamp(state.settings.celebrationAutoCloseSec, 3, 15) * 1000);
}

/* =========================
   HUD + CENTRAL RENDER
========================= */

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
    if($("taskTitle")) $("taskTitle").textContent = "Aucune tâche sélectionnée";
    if($("metaCat")) $("metaCat").textContent = "—";
    if($("metaEt")) $("metaEt").textContent = "—";
    if($("metaTimer")) $("metaTimer").textContent = "00:00";
  }else{
    if($("taskTitle")) $("taskTitle").textContent = task.title;
    if($("metaCat")) $("metaCat").textContent = task.cat || "Inbox";
    if($("metaEt")) $("metaEt").textContent = `${task.etorionsLeft}/${task.etorionsTotal}`;
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

/* =========================
   BELOW LIST
========================= */

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
          <div class="card__title">${task.today ? "◆ " : ""}${escapeHTML(task.title)}</div>
          <div class="card__sub">${escapeHTML(task.cat)} · ${task.etorionsLeft}/${task.etorionsTotal}</div>
        </div>

        <div class="card__actions">
          <button class="icon-btn" data-below-act="up" data-id="${task.id}" title="Monter">↑</button>
          <button class="icon-btn" data-below-act="down" data-id="${task.id}" title="Descendre">↓</button>
          <button class="icon-btn" data-below-act="today" data-id="${task.id}" title="CE JOUR">${task.today ? "◆" : "◇"}</button>
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
      if(act === "today") toggleTodayTask(id);
      if(act === "sel") selectTask(id);
      if(act === "done") completeTask(id);

      saveState();
      renderAll();
    };
  });
}

/* =========================
   TASK PANEL
========================= */

function categories(){
  const set = new Set(state.tasks.map(task => task.cat || "Inbox"));
  const out = Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  out.unshift("CE JOUR");
  out.unshift("Toutes");
  return out;
}

function renderCatFilter(){
  const select = $("catFilter");
  if(!select) return;

  const selected = state.settings.includedCats || [];
  select.innerHTML = categories().map(cat => `
    <option value="${escapeHTML(cat)}" ${selected.includes(cat) ? "selected" : ""}>${escapeHTML(cat)}</option>
  `).join("");
}

function syncIncludedCatsFromSelect(){
  const sel = $("catFilter");
  if(!sel) return;
  const values = Array.from(sel.selectedOptions).map(o => o.value).filter(v => v !== "Toutes");
  state.settings.includedCats = values;
  saveState();
}

function renderTasksPanel(){
  renderCatFilter();

  const root = $("taskList");
  if(!root) return;

  const view = $("viewFilter")?.value || "active";
  state.settings.listSort = $("sortFilter")?.value || state.settings.listSort;

  let list = state.tasks.slice();

  if(view === "active") list = list.filter(task => !task.done);
  if(view === "done") list = list.filter(task => task.done);

  const included = state.settings.includedCats || [];
  if(included.length > 0){
    list = list.filter(task => {
      if(included.includes("CE JOUR") && task.today) return true;
      return included.includes(task.cat);
    });
  }

  list = sortTasks(list);

  if(list.length === 0){
    root.innerHTML = `<div class="muted small">Rien ici.</div>`;
    return;
  }

  root.innerHTML = list.map(task => `
    <div class="card">
      <div class="card__left">
        <div class="card__title">${task.today ? "◆ " : ""}${escapeHTML(task.title)}</div>
        <div class="card__sub">${escapeHTML(task.cat)} · ${task.etorionsLeft}/${task.etorionsTotal}${task.done ? " · Finie" : ""}</div>
      </div>

      <div class="card__actions">
        ${!task.done ? `<button class="icon-btn" data-task-act="sel" data-id="${task.id}" title="Sélectionner">${task.id === state.currentTaskId ? "★" : "▶"}</button>` : ""}
        ${!task.done ? `<button class="icon-btn" data-task-act="today" data-id="${task.id}" title="CE JOUR">${task.today ? "◆" : "◇"}</button>` : ""}
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
      if(act === "today") toggleTodayTask(id);
      if(act === "restore") restoreTask(id);
      if(act === "edit") editTaskPrompt(id);
      if(act === "del") deleteTask(id);
    };
  });
}

/* =========================
   NOTES
========================= */

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

/* =========================
   TYPHONSE
========================= */

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

/* =========================
   KIFFANCE
========================= */

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
    today: true,
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
  suggestKiffance();
}

/* =========================
   HABITS
========================= */

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
      <div class="card">
        <div class="card__left">
          <div class="card__title">${escapeHTML(habit.name)} (${progress.done}/${progress.total})</div>
          <div class="row">
            ${habit.checks.map((checked, idx) => `
              <button class="icon-btn" data-habit-id="${habit.id}" data-habit-index="${idx}" title="Case">${checked ? "✓" : "·"}</button>
            `).join("")}
          </div>
        </div>

        <div class="card__actions">
          <button class="action-btn" data-habit-act="reset" data-habit="${habit.id}" type="button">Reset</button>
          <button class="action-btn" data-habit-act="del" data-habit="${habit.id}" type="button">Supprimer</button>
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

/* =========================
   SETS
========================= */

function initSetsChecksForToday(){
  const dk = dayKey();

  for(const key of ["hospital", "consult"]){
    const set = state.sets[key];
    if(!set.checks) set.checks = {};
    if(!set.checks[dk]) set.checks[dk] = {};
  }
}

function setKeyItem(setName, patientId, itemLabel){
  return `${setName}|${patientId}|${itemLabel}`;
}

function toggleSetCheck(setName, patientId, itemLabel){
  initSetsChecksForToday();

  const dk = dayKey();
  const set = state.sets[setName];
  const key = setKeyItem(setName, patientId, itemLabel);

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

function updateSetPatientCount(setName, nextCount){
  const count = clamp(parseInt(nextCount, 10) || 1, 1, 30);
  const current = state.sets[setName].patients || [];

  if(current.length < count){
    while(current.length < count){
      current.push({ id: uid(), name: `Patient ${current.length + 1}` });
    }
  }else if(current.length > count){
    current.length = count;
  }

  state.sets[setName].patients = current;
  saveState();
  renderSetsPanel();
}

function renameSetPatient(setName, patientId, nextName){
  const set = state.sets[setName];
  const patient = set.patients.find(p => p.id === patientId);
  if(!patient) return;
  const cleaned = String(nextName || "").trim();
  patient.name = cleaned || "Patient";
  saveState();
}

function summarizeSetsToday(){
  initSetsChecksForToday();

  const dk = dayKey();
  const out = {};

  for(const key of ["hospital", "consult"]){
    const set = state.sets[key];
    const checks = set.checks?.[dk] || {};
    const total = set.patients.length * set.itemsPerPatient.length;
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

    let html = `
      <div class="card">
        <div class="card__left">
          <div class="card__title">${title}</div>
          <div class="card__sub">${Object.values(checks).filter(Boolean).length}/${set.patients.length * set.itemsPerPatient.length}</div>
    `;

    set.patients.forEach((patient, idx) => {
      html += `
        <div class="soft-sep"></div>
        <div class="field-group">
          <label class="label-mini">Patient ${idx + 1}</label>
          <input class="field input" data-patient-rename="${setKey}|${patient.id}" value="${escapeHTML(patient.name)}">
        </div>
        <div class="row">
      `;

      set.itemsPerPatient.forEach(item => {
        const key = setKeyItem(setKey, patient.id, item);
        const checked = !!checks[key];
        html += `
          <button
            class="action-btn ${checked ? "action-btn--accent" : ""}"
            type="button"
            data-set-click="${setKey}|${patient.id}|${encodeURIComponent(item)}"
          >${escapeHTML(item)}</button>
        `;
      });

      html += `</div>`;
    });

    html += `</div></div>`;
    return html;
  };

  root.innerHTML = buildSet("hospital", "HOSPITALIER") + buildSet("consult", "CONSULTATION");

  root.querySelectorAll("[data-set-click]").forEach(btn => {
    btn.onclick = () => {
      const [setName, patientId, itemEncoded] = btn.dataset.setClick.split("|");
      toggleSetCheck(setName, patientId, decodeURIComponent(itemEncoded));
    };
  });

  root.querySelectorAll("[data-patient-rename]").forEach(input => {
    input.addEventListener("change", () => {
      const [setName, patientId] = input.dataset.patientRename.split("|");
      renameSetPatient(setName, patientId, input.value);
    });
  });
}

/* =========================
   HISTORY + STATS
========================= */

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

function statsSeries(days = state.settings.statsRangeDays || 30){
  const today = new Date();
  const rows = [];
  for(let i = days - 1; i >= 0; i--){
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dayKey(d);
    const h = state.history.find(x => x.day === key);
    rows.push({
      day: key,
      tasks: h?.doneTasks || 0,
      etorions: h?.doneEtorions || 0
    });
  }
  return rows;
}

function renderMiniBars(series, key, maxValue){
  return series.map(row => {
    const v = row[key];
    const width = maxValue <= 0 ? 0 : Math.max(6, Math.round((v / maxValue) * 100));
    const dayNum = row.day.slice(8, 10);
    return `
      <div style="display:grid;grid-template-columns:34px 1fr 32px;gap:8px;align-items:center;">
        <div class="card__sub">${dayNum}</div>
        <div style="height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;">
          <div style="height:100%;width:${width}%;background:var(--accent);border-radius:999px;"></div>
        </div>
        <div class="card__sub" style="text-align:right;">${v}</div>
      </div>
    `;
  }).join("");
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
  const series = statsSeries();
  const maxTasks = Math.max(1, ...series.map(s => s.tasks));
  const maxEto = Math.max(1, ...series.map(s => s.etorions));

  const html = `
    <div class="card">
      <div class="card__left">
        <div class="card__title">Vue d’ensemble</div>
        <div class="card__sub">Progression restante : ${progress.pct}% · Dopamine score : ${dopamine}%</div>
        <div class="card__sub">Tâches complétées : ${state.stats.tasksCompleted}</div>
        <div class="card__sub">Étorions dégommés : ${state.stats.etorionsDone}</div>
        <div class="card__sub">Sessions : ${state.stats.sessions}</div>
        <div class="card__sub">Célébrations affichées : ${state.stats.celebrationsShown}</div>
      </div>
    </div>

    <div class="card">
      <div class="card__left">
        <div class="card__title">Tâches / jour</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
          ${renderMiniBars(series, "tasks", maxTasks)}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card__left">
        <div class="card__title">Étorions / jour</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
          ${renderMiniBars(series, "etorions", maxEto)}
        </div>
      </div>
    </div>
  `;

  if($("statsContent")) $("statsContent").innerHTML = html;
  if($("statsContentPanel")) $("statsContentPanel").innerHTML = html;
}

/* =========================
   EXPORT
========================= */

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

/* =========================
   TIPS
========================= */

function maybeShowTip(force = false){
  if(!force && Math.random() > state.settings.tipsChance) return;
  status(`Conseil — ${pickRandom(TIPS)}`, 6500);
}

/* =========================
   POMODORO
========================= */

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

/* =========================
   PREFS + FLOW
========================= */

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
  state.ui.font = "yusei";
  state.ui.baseSize = 16;
  state.ui.serious = false;
  state.settings.keepListInFocus = true;
  state.settings.fatigue = 2;
  state.settings.motivation = 2;
  state.pomodoro.workMin = 25;
  state.pomodoro.breakMin = 5;
  state.ui.leftPanelWidth = 380;
  state.ui.rightPanelWidth = 430;

  saveState();
  syncPrefsUI();
  syncPanelWidthInputs();
  applyTheme();
  resetPhase();
  renderAll();
}

/* =========================
   RESET GLOBAL
========================= */

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

/* =========================
   RENDER GLOBAL
========================= */

function renderAll(){
  applyTheme();
  syncPanelWidthInputs();
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

/* =========================
   TIMERS
========================= */

let taskTimerLoop = null;
function startTaskTimerLoop(){
  if(taskTimerLoop) clearInterval(taskTimerLoop);
  taskTimerLoop = setInterval(() => {
    renderMetaTimer();
  }, 500);
}

/* =========================
   EVENTS
========================= */

function bindUI(){
  $("btnLeft")?.addEventListener("click", () => openPanel("left"));
  $("btnRight")?.addEventListener("click", () => openPanel("right"));
  $("leftClose")?.addEventListener("click", closePanels);
  $("rightClose")?.addEventListener("click", closePanels);
  $("panelBack")?.addEventListener("click", closePanels);

  $("leftPanelWidth")?.addEventListener("input", (e) => {
    state.ui.leftPanelWidth = clamp(parseInt(e.target.value, 10) || 380, 300, 620);
    setRootCssVars();
    saveState();
  });

  $("rightPanelWidth")?.addEventListener("input", (e) => {
    state.ui.rightPanelWidth = clamp(parseInt(e.target.value, 10) || 430, 320, 720);
    setRootCssVars();
    saveState();
  });

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
    closePomoModal();
  });

  $("inboxAdd")?.addEventListener("click", () => {
    const count = importFromInbox($("inboxText")?.value || "");
    if(count > 0){
      addNoteEntry(`Import de ${count} tâche(s).`);
      if($("inboxText")) $("inboxText").value = "";
      status(`${count} tâche(s) importée(s).`);
    }else{
      status("Rien importé.");
    }
  });

  $("inboxClear")?.addEventListener("click", () => {
    if($("inboxText")) $("inboxText").value = "";
  });

  $("catFilter")?.addEventListener("change", () => {
    syncIncludedCatsFromSelect();
    renderTasksPanel();
  });

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
    if($("kiffNew")) $("kiffNew").value = "";
    saveState();
    suggestKiffance();
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
    updateSetPatientCount("hospital", e.target.value);
  });

  $("consPatients")?.addEventListener("change", (e) => {
    updateSetPatientCount("consult", e.target.value);
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
  $("testCeleBtn")?.addEventListener("click", () => maybeShowCelebration(true));

  $("notesArea")?.addEventListener("input", scheduleNotesSave);
  $("remindersArea")?.addEventListener("input", scheduleNotesSave);
  $("notesAreaPanel")?.addEventListener("input", scheduleNotesSave);
  $("remindersAreaPanel")?.addEventListener("input", scheduleNotesSave);

  $("btnAddTyphonse")?.addEventListener("click", () => {
    addTyphonse($("typhonseInput")?.value);
    if($("typhonseInput")) $("typhonseInput").value = "";
  });

  $("pomoTime")?.addEventListener("click", togglePomo);
  $("pomoEdit")?.addEventListener("click", openPomoModal);
  $("modalClose")?.addEventListener("click", closePomoModal);

  $("pomoApply")?.addEventListener("click", () => {
    state.pomodoro.workMin = clamp(parseInt($("pomoMinutes").value, 10) || 25, 5, 90);
    state.pomodoro.breakMin = clamp(parseInt($("breakMinutes").value, 10) || 5, 1, 30);
    state.pomodoro.autoStart = $("autoStartSel").value || "auto";

    saveState();
    resetPhase();
    closePomoModal();
  });

  $("pomoReset")?.addEventListener("click", () => {
    pausePomo();
    resetPhase();
  });
}

/* =========================
   INIT
========================= */

let taskTimerLoop = null;

function startTaskTimerLoop(){
  if(taskTimerLoop) clearInterval(taskTimerLoop);
  taskTimerLoop = setInterval(() => {
    renderMetaTimer();
  }, 500);
}

function init(){
  applyTheme();
  bindTabs();
  bindUI();
  syncPrefsUI();
  syncFlowPanel();
  syncPanelWidthInputs();
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

  if($("hospPatients")) $("hospPatients").value = state.sets.hospital.patients.length;
  if($("consPatients")) $("consPatients").value = state.sets.consult.patients.length;
}

document.addEventListener("DOMContentLoaded", init);
