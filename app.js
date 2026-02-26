const STORAGE_KEY = "nutritwin_mvp_v1_6";

const MICRO_TARGETS = {
  fiber: { low: 18, high: 35, unit: "g", label: "Fiber" },
  magnesium: { low: 300, high: 420, unit: "mg", label: "Magnesium" },
  iron: { low: 8, high: 18, unit: "mg", label: "Iron" },
  vitaminC: { low: 75, high: 120, unit: "mg", label: "Vitamin C" },
  omega3: { low: 1.1, high: 2.0, unit: "g", label: "Omega-3" },
};

const PORTION_GUIDES = {
  normal: { factor: 1, label: "Normal plate" },
  hand_palm: { factor: 0.8, label: "~1 Palm protein + small side" },
  hand_fist: { factor: 1.15, label: "~1 Fist carbs + full plate" },
  hand_two_palms: { factor: 1.35, label: "Large (2 palms / big plate)" },
  plate_half: { factor: 0.75, label: "Half plate" },
  plate_full: { factor: 1.25, label: "Full plate with extras" },
};

const state = {
  users: [],
  selectedUserId: null,
  selectedDate: new Date().toISOString().slice(0, 10),
  imageDataUrl: "",
  vision: { ready: false, model: null, lastPredictions: [] },
  lastAutoSuggestion: null,
};

const el = {
  newUserName: document.getElementById("newUserName"),
  createUserBtn: document.getElementById("createUserBtn"),
  userSelect: document.getElementById("userSelect"),
  reportDate: document.getElementById("reportDate"),
  mealForm: document.getElementById("mealForm"),
  resetFormBtn: document.getElementById("resetFormBtn"),
  summary: document.getElementById("summary"),
  microSummary: document.getElementById("microSummary"),
  frequentMeals: document.getElementById("frequentMeals"),
  reportView: document.getElementById("reportView"),
  exportMarkdownBtn: document.getElementById("exportMarkdownBtn"),
  markdownOutput: document.getElementById("markdownOutput"),
  loadSampleBtn: document.getElementById("loadSampleBtn"),
  portionFactor: document.getElementById("portionFactor"),
  portionRef: document.getElementById("portionRef"),
  portionGuideHint: document.getElementById("portionGuideHint"),
  mealImageFile: document.getElementById("mealImageFile"),
  mealImagePreview: document.getElementById("mealImagePreview"),
  imageTools: document.getElementById("imageTools"),
  analyzeImageBtn: document.getElementById("analyzeImageBtn"),
  visionStatus: document.getElementById("visionStatus"),
  visionSuggestions: document.getElementById("visionSuggestions"),
  openCameraBtn: document.getElementById("openCameraBtn"),
  cameraBox: document.getElementById("cameraBox"),
  cameraVideo: document.getElementById("cameraVideo"),
  cameraCanvas: document.getElementById("cameraCanvas"),
  capturePhotoBtn: document.getElementById("capturePhotoBtn"),
  closeCameraBtn: document.getElementById("closeCameraBtn"),
};

const FOOD_MAP = [
  { keywords: ["banana", "plantain"], mealName: "Banane", kcal: 105, protein: 1.3, carbs: 27, fat: 0.3, profile: "fruit" },
  { keywords: ["apple"], mealName: "Apfel", kcal: 95, protein: 0.5, carbs: 25, fat: 0.3, profile: "fruit" },
  { keywords: ["orange", "mandarin", "citrus"], mealName: "Orange", kcal: 80, protein: 1.2, carbs: 18, fat: 0.2, profile: "fruit" },
  { keywords: ["pizza"], mealName: "Pizza", kcal: 850, protein: 32, carbs: 95, fat: 38, profile: "ultra_processed" },
  { keywords: ["burger", "cheeseburger"], mealName: "Burger", kcal: 780, protein: 35, carbs: 55, fat: 45, profile: "red_meat" },
  { keywords: ["salad", "caesar", "greens"], mealName: "Salat", kcal: 420, protein: 20, carbs: 22, fat: 26, profile: "green_plate" },
  { keywords: ["sushi"], mealName: "Sushi", kcal: 520, protein: 22, carbs: 75, fat: 14, profile: "fish_plate" },
  { keywords: ["pasta", "spaghetti", "noodle"], mealName: "Pasta", kcal: 650, protein: 22, carbs: 92, fat: 18, profile: "grain_heavy" },
  { keywords: ["rice", "bowl", "quinoa"], mealName: "Rice Bowl", kcal: 610, protein: 32, carbs: 70, fat: 18, profile: "balanced_bowl" },
  { keywords: ["steak", "beef"], mealName: "Steak Teller", kcal: 700, protein: 55, carbs: 28, fat: 40, profile: "red_meat" },
  { keywords: ["salmon", "fish"], mealName: "Lachs Teller", kcal: 620, protein: 45, carbs: 30, fat: 34, profile: "fish_plate" },
  { keywords: ["egg", "omelet"], mealName: "Eiergericht", kcal: 430, protein: 26, carbs: 10, fat: 30, profile: "egg_plate" },
  { keywords: ["sandwich", "sub"], mealName: "Sandwich", kcal: 520, protein: 24, carbs: 55, fat: 20, profile: "grain_heavy" },
  { keywords: ["chicken"], mealName: "Chicken Bowl", kcal: 590, protein: 48, carbs: 48, fat: 20, profile: "lean_protein" },
  { keywords: ["dessert", "cake", "donut"], mealName: "Dessert", kcal: 460, protein: 6, carbs: 58, fat: 22, profile: "ultra_processed" },
];

const MICRO_PROFILES = {
  green_plate: { fiber: 9, magnesium: 110, iron: 2.6, vitaminC: 42, omega3: 0.2, note: "Leafy + veggie heavy" },
  fish_plate: { fiber: 2, magnesium: 62, iron: 1.2, vitaminC: 10, omega3: 2.2, note: "Fish / Omega-3 focus" },
  red_meat: { fiber: 1.5, magnesium: 45, iron: 3.4, vitaminC: 5, omega3: 0.1, note: "Iron strong, fiber low" },
  grain_heavy: { fiber: 4, magnesium: 58, iron: 1.9, vitaminC: 8, omega3: 0.1, note: "Carb-heavy plate" },
  lean_protein: { fiber: 5.5, magnesium: 78, iron: 1.9, vitaminC: 20, omega3: 0.2, note: "Lean protein + mixed sides" },
  balanced_bowl: { fiber: 7.5, magnesium: 92, iron: 2.2, vitaminC: 24, omega3: 0.3, note: "Balanced one-bowl meal" },
  egg_plate: { fiber: 2.2, magnesium: 34, iron: 1.6, vitaminC: 6, omega3: 0.12, note: "Egg-based meal" },
  ultra_processed: { fiber: 2.5, magnesium: 28, iron: 1.6, vitaminC: 4, omega3: 0.04, note: "Low micro density" },
  fruit: { fiber: 3.2, magnesium: 32, iron: 0.4, vitaminC: 12, omega3: 0.02, note: "Fruit profile" },
  fallback: { fiber: 3, magnesium: 42, iron: 1.3, vitaminC: 8, omega3: 0.12, note: "Generic profile" },
};

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeMealName(name = "") {
  return name.toString().toLowerCase().trim().replace(/\s+/g, " ");
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.users = Array.isArray(parsed.users) ? parsed.users : [];
    state.selectedUserId = parsed.selectedUserId || null;
    state.selectedDate = parsed.selectedDate || state.selectedDate;
  } catch (err) {
    console.warn("Could not parse local state:", err);
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      users: state.users,
      selectedUserId: state.selectedUserId,
      selectedDate: state.selectedDate,
    })
  );
}

function currentUser() {
  return state.users.find((u) => u.id === state.selectedUserId) || null;
}

function ensureUserLearningStore(user) {
  if (!user) return;
  if (!user.corrections || typeof user.corrections !== "object") user.corrections = {};
}

function mealsForSelectedDay() {
  const user = currentUser();
  if (!user) return [];
  return user.meals
    .filter((meal) => meal.mealDateTime.startsWith(state.selectedDate))
    .sort((a, b) => a.mealDateTime.localeCompare(b.mealDateTime));
}

function sumDaily(meals) {
  return meals.reduce(
    (acc, m) => {
      acc.kcal += toNumber(m.kcal);
      acc.protein += toNumber(m.protein);
      acc.carbs += toNumber(m.carbs);
      acc.fat += toNumber(m.fat);
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function pickProfileFromMealName(mealName = "") {
  const name = mealName.toLowerCase();
  if (name.includes("salat") || name.includes("salad") || name.includes("greens")) return "green_plate";
  if (name.includes("lachs") || name.includes("fish") || name.includes("salmon") || name.includes("sushi")) return "fish_plate";
  if (name.includes("steak") || name.includes("beef") || name.includes("burger")) return "red_meat";
  if (name.includes("pasta") || name.includes("sandwich")) return "grain_heavy";
  if (name.includes("chicken")) return "lean_protein";
  if (name.includes("bowl") || name.includes("quinoa") || name.includes("rice")) return "balanced_bowl";
  if (name.includes("egg") || name.includes("omelet")) return "egg_plate";
  if (name.includes("pizza") || name.includes("dessert") || name.includes("cake")) return "ultra_processed";
  return "fallback";
}

function estimateMicrosForMeal(meal) {
  const profileKey = meal.microProfile || pickProfileFromMealName(meal.mealName);
  const profile = MICRO_PROFILES[profileKey] || MICRO_PROFILES.fallback;
  return { ...profile, profileKey };
}

function sumDailyMicros(meals) {
  return meals.reduce(
    (acc, m) => {
      const micro = m.micros || estimateMicrosForMeal(m);
      acc.fiber += toNumber(micro.fiber);
      acc.magnesium += toNumber(micro.magnesium);
      acc.iron += toNumber(micro.iron);
      acc.vitaminC += toNumber(micro.vitaminC);
      acc.omega3 += toNumber(micro.omega3);
      return acc;
    },
    { fiber: 0, magnesium: 0, iron: 0, vitaminC: 0, omega3: 0 }
  );
}

function microStatus(metric, value) {
  const t = MICRO_TARGETS[metric];
  if (!t) return "ok";
  if (value < t.low) return "low";
  if (value > t.high) return "high";
  return "ok";
}

function escapeHtml(text = "") {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderUsers() {
  el.userSelect.innerHTML = "";

  if (!state.users.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No users yet";
    el.userSelect.append(option);
    state.selectedUserId = null;
    return;
  }

  state.users.forEach((u) => {
    const option = document.createElement("option");
    option.value = u.id;
    option.textContent = u.name;
    if (u.id === state.selectedUserId) option.selected = true;
    el.userSelect.append(option);
  });

  if (!state.selectedUserId || !state.users.some((u) => u.id === state.selectedUserId)) {
    state.selectedUserId = state.users[0].id;
    el.userSelect.value = state.selectedUserId;
  }
}

function renderSummary() {
  const totals = sumDaily(mealsForSelectedDay());
  const cards = [
    { label: "Calories", value: `${Math.round(totals.kcal)} kcal` },
    { label: "Protein", value: `${totals.protein.toFixed(1)} g` },
    { label: "Carbs", value: `${totals.carbs.toFixed(1)} g` },
    { label: "Fat", value: `${totals.fat.toFixed(1)} g` },
  ];

  el.summary.innerHTML = cards
    .map((c) => `<article class="metric"><div class="label">${c.label}</div><div class="value">${c.value}</div></article>`)
    .join("");
}

function renderMicroSummary() {
  const m = sumDailyMicros(mealsForSelectedDay());
  const rows = [
    ["fiber", m.fiber],
    ["magnesium", m.magnesium],
    ["iron", m.iron],
    ["vitaminC", m.vitaminC],
    ["omega3", m.omega3],
  ];

  el.microSummary.innerHTML = rows
    .map(([key, value]) => {
      const t = MICRO_TARGETS[key];
      const status = microStatus(key, value);
      const pretty = key === "omega3" || key === "iron" || key === "fiber" ? value.toFixed(1) : Math.round(value);
      return `<span class="micro-chip status-${status}">${t.label} ${pretty}${t.unit} · ${status.toUpperCase()}</span>`;
    })
    .join(" ");
}

function renderFrequentMeals() {
  const user = currentUser();
  if (!user || !user.meals?.length) {
    el.frequentMeals.innerHTML = '<span class="small muted">Noch keine gespeicherten Mahlzeiten.</span>';
    return;
  }

  const counts = {};
  user.meals.forEach((m) => {
    const key = (m.mealName || "").trim();
    if (!key) return;
    counts[key] = (counts[key] || 0) + 1;
  });

  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  el.frequentMeals.innerHTML = top
    .map(([name]) => `<button type="button" class="btn btn-secondary small" data-quickmeal="${escapeHtml(name)}">${escapeHtml(name)}</button>`)
    .join(" ");

  el.frequentMeals.querySelectorAll("[data-quickmeal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mealName = btn.getAttribute("data-quickmeal") || "";
      el.mealForm.mealName.value = mealName;
      const user = currentUser();
      ensureUserLearningStore(user);
      const learned = user?.corrections?.[normalizeMealName(mealName)];
      if (learned?.portionFactor) {
        el.portionFactor.value = String(learned.portionFactor);
      }
      if (!el.mealForm.mealDateTime.value) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        el.mealForm.mealDateTime.value = now.toISOString().slice(0, 16);
      }
    });
  });
}

function renderReportView() {
  const user = currentUser();
  const meals = mealsForSelectedDay();

  if (!user || !meals.length) {
    el.reportView.innerHTML = `<p class="muted">No entries for selected day yet.</p>`;
    return;
  }

  el.reportView.innerHTML = meals
    .map((meal) => {
      const time = new Date(meal.mealDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const micro = meal.micros || estimateMicrosForMeal(meal);
      return `
        <article class="report-item">
          <h4>${escapeHtml(meal.mealName)} <span class="small muted">(${time})</span></h4>
          <div class="small">${escapeHtml(meal.description || "No notes")}</div>
          <div class="small muted">kcal ${toNumber(meal.kcal)} · P ${toNumber(meal.protein)}g · C ${toNumber(meal.carbs)}g · F ${toNumber(meal.fat)}g</div>
          <div class="small muted">Micro profile: ${escapeHtml(micro.note || "-")} · Fiber ${micro.fiber}g · Mg ${micro.magnesium}mg · Fe ${micro.iron}mg · VitC ${micro.vitaminC}mg · O3 ${micro.omega3}g</div>
          ${meal.imagePath ? `<div class="small muted">Image ref: ${escapeHtml(meal.imagePath)}</div>` : ""}
        </article>
      `;
    })
    .join("");
}

function buildMarkdownReport() {
  const user = currentUser();
  const meals = mealsForSelectedDay();
  if (!user) return "# NutriTwin Daily Report\n\n_No user selected._";

  const totals = sumDaily(meals);
  const micros = sumDailyMicros(meals);

  const rows = [
    ["fiber", micros.fiber],
    ["magnesium", micros.magnesium],
    ["iron", micros.iron],
    ["vitaminC", micros.vitaminC],
    ["omega3", micros.omega3],
  ];

  const lines = [
    "# NutriTwin Daily Report",
    "",
    `- **User:** ${user.name}`,
    `- **Date:** ${state.selectedDate}`,
    `- **Meals logged:** ${meals.length}`,
    "",
    "## Daily Summary",
    `- **Calories:** ${Math.round(totals.kcal)} kcal`,
    `- **Protein:** ${totals.protein.toFixed(1)} g`,
    `- **Carbs:** ${totals.carbs.toFixed(1)} g`,
    `- **Fat:** ${totals.fat.toFixed(1)} g`,
    "",
    "## Micronutrient Targets",
    ...rows.map(([k, v]) => {
      const t = MICRO_TARGETS[k];
      const status = microStatus(k, v).toUpperCase();
      const val = k === "omega3" || k === "iron" || k === "fiber" ? v.toFixed(1) : Math.round(v);
      return `- **${t.label}:** ${val}${t.unit} (${status})`;
    }),
    "",
    "## Meals",
    "",
  ];

  meals.forEach((meal, i) => {
    const micro = meal.micros || estimateMicrosForMeal(meal);
    lines.push(`### ${i + 1}. ${meal.mealName}`);
    lines.push(`- Time: ${meal.mealDateTime.replace("T", " ")}`);
    lines.push(`- Description: ${meal.description || "-"}`);
    lines.push(`- Macros: ${toNumber(meal.kcal)} kcal | P ${toNumber(meal.protein)} g | C ${toNumber(meal.carbs)} g | F ${toNumber(meal.fat)} g`);
    lines.push(`- Micro profile: ${micro.note || "-"}`);
    lines.push(`- Micros: Fiber ${micro.fiber}g | Mg ${micro.magnesium}mg | Fe ${micro.iron}mg | VitC ${micro.vitaminC}mg | O3 ${micro.omega3}g`);
    if (meal.imagePath) lines.push(`- Image ref: ${meal.imagePath}`);
    lines.push("");
  });

  return lines.join("\n");
}

function createUser(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return;

  const user = {
    id: uid("user"),
    name: trimmed,
    meals: [],
    corrections: {},
    createdAt: new Date().toISOString(),
  };

  state.users.push(user);
  state.selectedUserId = user.id;
  saveState();
  renderAll();
}

function setVisionStatus(msg, isError = false) {
  el.visionStatus.textContent = msg;
  el.visionStatus.style.color = isError ? "#b42318" : "";
}

function stopCameraStream() {
  const stream = el.cameraVideo?.srcObject;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    el.cameraVideo.srcObject = null;
  }
  el.cameraBox.classList.add("hidden");
}

async function openCameraCapture() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    el.cameraVideo.srcObject = stream;
    el.cameraBox.classList.remove("hidden");
    setVisionStatus("Kamera aktiv. Foto aufnehmen.");
  } catch {
    setVisionStatus("Kamerazugriff nicht möglich", true);
  }
}

function captureFromCamera() {
  const video = el.cameraVideo;
  const canvas = el.cameraCanvas;
  if (!video?.videoWidth) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  state.imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
  el.mealImagePreview.src = state.imageDataUrl;
  el.imageTools.classList.remove("hidden");
  setVisionStatus("Foto übernommen. Analyse starten.");
  stopCameraStream();
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function ensureVisionReady() {
  if (state.vision.ready && state.vision.model) return;
  setVisionStatus("Lade Bilderkennung …");
  if (!window.tf) await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js");
  if (!window.mobilenet) await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js");
  state.vision.model = await window.mobilenet.load({ version: 2, alpha: 1.0 });
  state.vision.ready = true;
  setVisionStatus("Bilderkennung bereit");
}

function mapPredictionToNutrition(predictions = []) {
  const matches = [];
  for (const item of FOOD_MAP) {
    let score = 0;
    for (const pred of predictions) {
      const c = pred.className.toLowerCase();
      if (item.keywords.some((k) => c.includes(k))) score += pred.probability;
    }
    if (score > 0) matches.push({ ...item, score });
  }

  if (!matches.length) return null;
  matches.sort((a, b) => b.score - a.score);
  const top = matches[0];
  return { ...top, confidence: Math.min(1, top.score) };
}

function confidenceLabel(score) {
  if (score >= 0.65) return "HIGH";
  if (score >= 0.4) return "MED";
  return "LOW";
}

function getPortionFactor() {
  const v = Number(el.portionFactor?.value || 1);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

function applyCorrection(mealName, macros) {
  const user = currentUser();
  ensureUserLearningStore(user);
  const correction = user?.corrections?.[normalizeMealName(mealName)];
  if (!correction) return { ...macros, mealName, correctionUsed: false };

  const factor = correction.factor || {};
  return {
    mealName: correction.preferredMealName || mealName,
    kcal: Math.round(macros.kcal * (factor.kcal || 1)),
    protein: +(macros.protein * (factor.protein || 1)).toFixed(1),
    carbs: +(macros.carbs * (factor.carbs || 1)).toFixed(1),
    fat: +(macros.fat * (factor.fat || 1)).toFixed(1),
    correctionUsed: true,
    note: correction.note || "Learned from your previous correction",
  };
}

function fillFormFromEstimate(estimate, predictions) {
  if (!estimate) {
    el.visionSuggestions.textContent = `Kein klarer Food-Match. Top-Klassen: ${predictions.slice(0, 3).map((p) => `${p.className} (${(p.probability * 100).toFixed(0)}%)`).join(", ")}. Bitte Werte kurz ergänzen.`;
    return;
  }

  const factor = getPortionFactor();
  const macros = {
    kcal: Math.round(estimate.kcal * factor),
    protein: +(estimate.protein * factor).toFixed(1),
    carbs: +(estimate.carbs * factor).toFixed(1),
    fat: +(estimate.fat * factor).toFixed(1),
  };

  const learned = applyCorrection(estimate.mealName, macros);
  const f = el.mealForm;
  f.mealName.value = learned.mealName;
  f.description.value = `Auto-Vorschlag aus Foto: ${predictions[0].className}`;
  f.kcal.value = learned.kcal;
  f.protein.value = learned.protein;
  f.carbs.value = learned.carbs;
  f.fat.value = learned.fat;

  const confPct = (estimate.confidence * 100).toFixed(0);
  const trust = confidenceLabel(estimate.confidence);
  const learningNote = learned.correctionUsed ? ` | Learned tweak: ${learned.note}` : "";
  el.visionSuggestions.textContent = `Auto-Vorschlag: ${learned.mealName} · ${learned.kcal} kcal · P ${learned.protein} / C ${learned.carbs} / F ${learned.fat} | Portion ${factor}x | Confidence ${confPct}% (${trust}) | Micro profile ${estimate.profile}${learningNote}`;

  state.lastAutoSuggestion = {
    mealName: estimate.mealName,
    adjustedMealName: learned.mealName,
    kcal: learned.kcal,
    protein: learned.protein,
    carbs: learned.carbs,
    fat: learned.fat,
    profile: estimate.profile,
    portionFactor: factor,
  };
}

async function analyzeCurrentImage() {
  if (!state.imageDataUrl) return setVisionStatus("Bitte zuerst ein Bild wählen", true);
  try {
    await ensureVisionReady();
    setVisionStatus("Analysiere Foto …");
    const preds = await state.vision.model.classify(el.mealImagePreview);
    state.vision.lastPredictions = preds;
    fillFormFromEstimate(mapPredictionToNutrition(preds), preds);
    setVisionStatus("Analyse fertig");
  } catch (e) {
    console.error(e);
    setVisionStatus("Analyse fehlgeschlagen", true);
  }
}

function storeCorrection(meal) {
  const user = currentUser();
  ensureUserLearningStore(user);
  if (!user || !state.lastAutoSuggestion) return;

  const base = state.lastAutoSuggestion;
  const correctedNameKey = normalizeMealName(meal.mealName || base.adjustedMealName || base.mealName);
  if (!correctedNameKey) return;

  const delta = {
    kcal: toNumber(meal.kcal) / Math.max(1, toNumber(base.kcal)),
    protein: toNumber(meal.protein) / Math.max(0.1, toNumber(base.protein)),
    carbs: toNumber(meal.carbs) / Math.max(0.1, toNumber(base.carbs)),
    fat: toNumber(meal.fat) / Math.max(0.1, toNumber(base.fat)),
  };

  const changed = Object.values(delta).some((v) => Math.abs(v - 1) > 0.08) || normalizeMealName(meal.mealName) !== normalizeMealName(base.adjustedMealName);
  if (!changed) return;

  user.corrections[correctedNameKey] = {
    preferredMealName: meal.mealName,
    factor: {
      kcal: +Math.min(1.8, Math.max(0.5, delta.kcal)).toFixed(2),
      protein: +Math.min(1.8, Math.max(0.5, delta.protein)).toFixed(2),
      carbs: +Math.min(1.8, Math.max(0.5, delta.carbs)).toFixed(2),
      fat: +Math.min(1.8, Math.max(0.5, delta.fat)).toFixed(2),
    },
    portionFactor: getPortionFactor(),
    note: `Saved correction ${new Date().toLocaleDateString()}`,
    updatedAt: new Date().toISOString(),
  };
}

function addMealFromForm(formData) {
  const user = currentUser();
  if (!user) return alert("Please create/select a user first.");

  const meal = {
    id: uid("meal"),
    mealName: (formData.get("mealName") || "").toString().trim(),
    mealDateTime: formData.get("mealDateTime"),
    description: (formData.get("description") || "").toString().trim(),
    kcal: formData.get("kcal") || 0,
    protein: formData.get("protein") || 0,
    carbs: formData.get("carbs") || 0,
    fat: formData.get("fat") || 0,
    imagePath: (formData.get("imagePath") || "").toString().trim() || state.imageDataUrl,
    createdAt: new Date().toISOString(),
  };

  if (!meal.mealName || !meal.mealDateTime) return alert("Meal name and date/time are required.");

  const portionFactor = Number(formData.get("portionFactor") || 1);
  const profile = state.lastAutoSuggestion?.profile || pickProfileFromMealName(meal.mealName);
  const microBase = MICRO_PROFILES[profile] || MICRO_PROFILES.fallback;
  meal.microProfile = profile;
  meal.micros = {
    fiber: +(microBase.fiber * portionFactor).toFixed(1),
    magnesium: +(microBase.magnesium * portionFactor).toFixed(0),
    iron: +(microBase.iron * portionFactor).toFixed(1),
    vitaminC: +(microBase.vitaminC * portionFactor).toFixed(0),
    omega3: +(microBase.omega3 * portionFactor).toFixed(2),
    note: microBase.note,
  };

  storeCorrection(meal);
  user.meals.push(meal);
  saveState();
  renderAll();
}

function resetImageTools() {
  state.imageDataUrl = "";
  state.vision.lastPredictions = [];
  state.lastAutoSuggestion = null;
  stopCameraStream();
  el.imageTools.classList.add("hidden");
  el.mealImagePreview.src = "";
  el.visionSuggestions.textContent = "";
  setVisionStatus("Noch nicht analysiert");
}

function updatePortionHelper() {
  const selected = PORTION_GUIDES[el.portionRef.value] || PORTION_GUIDES.normal;
  el.portionFactor.value = String(selected.factor);
  el.portionGuideHint.textContent = `Guide: ${selected.label} → factor ${selected.factor}x`;
}

function loadSampleDataset() {
  const isoDate = new Date().toISOString().slice(0, 10);
  const sampleUser = {
    id: uid("user"),
    name: "Sample Executive",
    createdAt: new Date().toISOString(),
    corrections: {
      "chicken bowl": { preferredMealName: "Chicken Bowl", factor: { kcal: 0.92, protein: 1.02, carbs: 0.88, fat: 0.95 }, portionFactor: 1, note: "Office bowl usually lighter" },
    },
    meals: [
      { id: uid("meal"), mealName: "Breakfast Power Bowl", mealDateTime: `${isoDate}T08:00`, description: "Greek yogurt, berries, oats", kcal: 420, protein: 32, carbs: 44, fat: 12, microProfile: "balanced_bowl", micros: { ...MICRO_PROFILES.balanced_bowl }, imagePath: "", createdAt: new Date().toISOString() },
      { id: uid("meal"), mealName: "Lunch Lean Plate", mealDateTime: `${isoDate}T13:00`, description: "Chicken, quinoa, greens", kcal: 610, protein: 48, carbs: 52, fat: 18, microProfile: "lean_protein", micros: { ...MICRO_PROFILES.lean_protein }, imagePath: "", createdAt: new Date().toISOString() },
    ],
  };

  state.users = [sampleUser];
  state.selectedUserId = sampleUser.id;
  state.selectedDate = isoDate;
  saveState();
  renderAll();
}

function renderAll() {
  renderUsers();
  el.reportDate.value = state.selectedDate;
  renderSummary();
  renderMicroSummary();
  renderFrequentMeals();
  renderReportView();
  el.markdownOutput.value = buildMarkdownReport();
}

function bindEvents() {
  el.createUserBtn.addEventListener("click", () => {
    createUser(el.newUserName.value);
    el.newUserName.value = "";
    el.newUserName.focus();
  });

  el.userSelect.addEventListener("change", (e) => {
    state.selectedUserId = e.target.value || null;
    saveState();
    renderAll();
  });

  el.reportDate.addEventListener("change", (e) => {
    state.selectedDate = e.target.value;
    saveState();
    renderAll();
  });

  el.portionRef?.addEventListener("change", updatePortionHelper);

  el.mealImageFile.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (!f) return resetImageTools();
    const reader = new FileReader();
    reader.onload = () => {
      state.imageDataUrl = reader.result?.toString() || "";
      el.mealImagePreview.src = state.imageDataUrl;
      el.imageTools.classList.remove("hidden");
      setVisionStatus("Bild geladen. Analyse starten.");
      el.visionSuggestions.textContent = "";
    };
    reader.readAsDataURL(f);
  });

  el.openCameraBtn?.addEventListener("click", openCameraCapture);
  el.capturePhotoBtn?.addEventListener("click", captureFromCamera);
  el.closeCameraBtn?.addEventListener("click", stopCameraStream);
  el.analyzeImageBtn.addEventListener("click", analyzeCurrentImage);

  el.mealForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addMealFromForm(new FormData(el.mealForm));
    el.mealForm.reset();
    updatePortionHelper();
    resetImageTools();
  });

  el.resetFormBtn.addEventListener("click", () => {
    el.mealForm.reset();
    updatePortionHelper();
    resetImageTools();
  });

  el.exportMarkdownBtn.addEventListener("click", async () => {
    const md = buildMarkdownReport();
    el.markdownOutput.value = md;
    try {
      await navigator.clipboard.writeText(md);
      el.exportMarkdownBtn.textContent = "Copied";
      setTimeout(() => (el.exportMarkdownBtn.textContent = "Export Markdown"), 1200);
    } catch {
      el.exportMarkdownBtn.textContent = "Exported Below";
      setTimeout(() => (el.exportMarkdownBtn.textContent = "Export Markdown"), 1200);
    }
  });

  el.loadSampleBtn.addEventListener("click", loadSampleDataset);
}

function initDefaults() {
  if (!state.selectedDate) state.selectedDate = new Date().toISOString().slice(0, 10);
  if (el.portionRef?.value) updatePortionHelper();
}

function boot() {
  loadState();
  initDefaults();
  bindEvents();
  renderAll();
}

boot();
