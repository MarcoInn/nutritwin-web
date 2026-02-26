const STORAGE_KEY = "nutritwin_mvp_v1";

const state = {
  users: [],
  selectedUserId: null,
  selectedDate: new Date().toISOString().slice(0, 10),
  imageDataUrl: "",
  vision: { ready: false, model: null, lastPredictions: [] },
};

const el = {
  newUserName: document.getElementById("newUserName"),
  createUserBtn: document.getElementById("createUserBtn"),
  userSelect: document.getElementById("userSelect"),
  reportDate: document.getElementById("reportDate"),
  mealForm: document.getElementById("mealForm"),
  resetFormBtn: document.getElementById("resetFormBtn"),
  summary: document.getElementById("summary"),
  reportView: document.getElementById("reportView"),
  exportMarkdownBtn: document.getElementById("exportMarkdownBtn"),
  markdownOutput: document.getElementById("markdownOutput"),
  loadSampleBtn: document.getElementById("loadSampleBtn"),
  portionFactor: document.getElementById("portionFactor"),
  mealImageFile: document.getElementById("mealImageFile"),
  mealImagePreview: document.getElementById("mealImagePreview"),
  imageTools: document.getElementById("imageTools"),
  analyzeImageBtn: document.getElementById("analyzeImageBtn"),
  visionStatus: document.getElementById("visionStatus"),
  visionSuggestions: document.getElementById("visionSuggestions"),
};

const FOOD_MAP = [
  { keywords: ["pizza"], mealName: "Pizza", kcal: 850, protein: 32, carbs: 95, fat: 38 },
  { keywords: ["burger", "cheeseburger"], mealName: "Burger", kcal: 780, protein: 35, carbs: 55, fat: 45 },
  { keywords: ["salad", "caesar"], mealName: "Salat", kcal: 420, protein: 20, carbs: 22, fat: 26 },
  { keywords: ["sushi"], mealName: "Sushi", kcal: 520, protein: 22, carbs: 75, fat: 14 },
  { keywords: ["pasta", "spaghetti"], mealName: "Pasta", kcal: 650, protein: 22, carbs: 92, fat: 18 },
  { keywords: ["rice", "bowl", "quinoa"], mealName: "Rice Bowl", kcal: 610, protein: 32, carbs: 70, fat: 18 },
  { keywords: ["steak", "beef"], mealName: "Steak Teller", kcal: 700, protein: 55, carbs: 28, fat: 40 },
  { keywords: ["salmon", "fish"], mealName: "Lachs Teller", kcal: 620, protein: 45, carbs: 30, fat: 34 },
  { keywords: ["egg", "omelet"], mealName: "Eiergericht", kcal: 430, protein: 26, carbs: 10, fat: 30 },
  { keywords: ["sandwich", "sub"], mealName: "Sandwich", kcal: 520, protein: 24, carbs: 55, fat: 20 },
  { keywords: ["chicken"], mealName: "Chicken Bowl", kcal: 590, protein: 48, carbs: 48, fat: 20 },
  { keywords: ["dessert", "cake", "donut"], mealName: "Dessert", kcal: 460, protein: 6, carbs: 58, fat: 22 },
];

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
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

function mealsForSelectedDay() {
  const user = currentUser();
  if (!user) return [];
  return user.meals
    .filter((meal) => meal.mealDateTime.startsWith(state.selectedDate))
    .sort((a, b) => a.mealDateTime.localeCompare(b.mealDateTime));
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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
  const meals = mealsForSelectedDay();
  const totals = sumDaily(meals);

  const cards = [
    { label: "Calories", value: `${Math.round(totals.kcal)} kcal` },
    { label: "Protein", value: `${totals.protein.toFixed(1)} g` },
    { label: "Carbs", value: `${totals.carbs.toFixed(1)} g` },
    { label: "Fat", value: `${totals.fat.toFixed(1)} g` },
  ];

  el.summary.innerHTML = cards
    .map(
      (c) => `
      <article class="metric">
        <div class="label">${c.label}</div>
        <div class="value">${c.value}</div>
      </article>
    `
    )
    .join("");
}

function escapeHtml(text = "") {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
      return `
        <article class="report-item">
          <h4>${escapeHtml(meal.mealName)} <span class="small muted">(${time})</span></h4>
          <div class="small">${escapeHtml(meal.description || "No notes")}</div>
          <div class="small muted">kcal ${toNumber(meal.kcal)} · P ${toNumber(meal.protein)}g · C ${toNumber(meal.carbs)}g · F ${toNumber(meal.fat)}g</div>
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

  const lines = [
    `# NutriTwin Daily Report`,
    ``,
    `- **User:** ${user.name}`,
    `- **Date:** ${state.selectedDate}`,
    `- **Meals logged:** ${meals.length}`,
    ``,
    `## Daily Summary`,
    ``,
    `- **Calories:** ${Math.round(totals.kcal)} kcal`,
    `- **Protein:** ${totals.protein.toFixed(1)} g`,
    `- **Carbs:** ${totals.carbs.toFixed(1)} g`,
    `- **Fat:** ${totals.fat.toFixed(1)} g`,
    ``,
    `## Meals`,
    ``,
  ];

  if (!meals.length) {
    lines.push("_No meals logged for this date._");
    return lines.join("\n");
  }

  meals.forEach((meal, i) => {
    lines.push(`### ${i + 1}. ${meal.mealName}`);
    lines.push(`- Time: ${meal.mealDateTime.replace("T", " ")}`);
    lines.push(`- Description: ${meal.description || "-"}`);
    lines.push(
      `- Macros: ${toNumber(meal.kcal)} kcal | P ${toNumber(meal.protein)} g | C ${toNumber(meal.carbs)} g | F ${toNumber(meal.fat)} g`
    );
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
  try {
    if (!window.tf) {
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js");
    }
    if (!window.mobilenet) {
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js");
    }
    state.vision.model = await window.mobilenet.load({ version: 2, alpha: 1.0 });
    state.vision.ready = true;
    setVisionStatus("Bilderkennung bereit");
  } catch (e) {
    setVisionStatus("Bilderkennung konnte nicht geladen werden", true);
    throw e;
  }
}

function mapPredictionToNutrition(predictions = []) {
  const classes = predictions.map((p) => p.className.toLowerCase());
  for (const item of FOOD_MAP) {
    if (classes.some((c) => item.keywords.some((k) => c.includes(k)))) {
      return { ...item, confidence: predictions[0]?.probability || 0 };
    }
  }
  return null;
}

function getPortionFactor() {
  const v = Number(el.portionFactor?.value || 1);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

function fillFormFromEstimate(estimate, predictions) {
  const f = el.mealForm;
  if (!estimate) {
    el.visionSuggestions.textContent = `Kein klarer Food-Match. Top-Klassen: ${predictions
      .slice(0, 3)
      .map((p) => `${p.className} (${(p.probability * 100).toFixed(0)}%)`)
      .join(", ")}. Bitte Werte kurz manuell ergänzen.`;
    return;
  }

  const factor = getPortionFactor();
  const kcal = Math.round(estimate.kcal * factor);
  const protein = +(estimate.protein * factor).toFixed(1);
  const carbs = +(estimate.carbs * factor).toFixed(1);
  const fat = +(estimate.fat * factor).toFixed(1);

  f.mealName.value = estimate.mealName;
  f.description.value = `Auto-Vorschlag aus Foto: ${predictions[0].className}`;
  f.kcal.value = kcal;
  f.protein.value = protein;
  f.carbs.value = carbs;
  f.fat.value = fat;

  const confidence = (estimate.confidence * 100).toFixed(0);
  el.visionSuggestions.textContent = `Auto-Vorschlag: ${estimate.mealName} · ${kcal} kcal · P ${protein} / C ${carbs} / F ${fat} | Portion ${factor}x | Confidence ${confidence}%. Bitte kurz validieren.`;
}

async function analyzeCurrentImage() {
  if (!state.imageDataUrl) {
    setVisionStatus("Bitte zuerst ein Bild wählen", true);
    return;
  }
  try {
    await ensureVisionReady();
    setVisionStatus("Analysiere Foto …");

    const preds = await state.vision.model.classify(el.mealImagePreview);
    state.vision.lastPredictions = preds;
    const estimate = mapPredictionToNutrition(preds);
    fillFormFromEstimate(estimate, preds);
    setVisionStatus("Analyse fertig");
  } catch (e) {
    console.error(e);
    setVisionStatus("Analyse fehlgeschlagen", true);
  }
}

function addMealFromForm(formData) {
  const user = currentUser();
  if (!user) {
    alert("Please create/select a user first.");
    return;
  }

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

  if (!meal.mealName || !meal.mealDateTime) {
    alert("Meal name and date/time are required.");
    return;
  }

  user.meals.push(meal);
  saveState();
  renderAll();
}

function resetImageTools() {
  state.imageDataUrl = "";
  state.vision.lastPredictions = [];
  el.imageTools.classList.add("hidden");
  el.mealImagePreview.src = "";
  el.visionSuggestions.textContent = "";
  setVisionStatus("Noch nicht analysiert");
}

function loadSampleDataset() {
  const today = new Date();
  const isoDate = today.toISOString().slice(0, 10);

  const sampleUser = {
    id: uid("user"),
    name: "Sample Executive",
    createdAt: new Date().toISOString(),
    meals: [
      {
        id: uid("meal"),
        mealName: "Breakfast Power Bowl",
        mealDateTime: `${isoDate}T08:00`,
        description: "Greek yogurt, berries, oats",
        kcal: 420,
        protein: 32,
        carbs: 44,
        fat: 12,
        imagePath: "images/breakfast_bowl.jpg",
        createdAt: new Date().toISOString(),
      },
      {
        id: uid("meal"),
        mealName: "Lunch Lean Plate",
        mealDateTime: `${isoDate}T13:00`,
        description: "Grilled chicken, quinoa, greens",
        kcal: 610,
        protein: 48,
        carbs: 52,
        fat: 18,
        imagePath: "images/lunch_plate.jpg",
        createdAt: new Date().toISOString(),
      },
      {
        id: uid("meal"),
        mealName: "Dinner Recovery",
        mealDateTime: `${isoDate}T19:30`,
        description: "Salmon, sweet potato, broccoli",
        kcal: 690,
        protein: 50,
        carbs: 46,
        fat: 30,
        imagePath: "",
        createdAt: new Date().toISOString(),
      },
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

  el.analyzeImageBtn.addEventListener("click", analyzeCurrentImage);

  el.mealForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addMealFromForm(new FormData(el.mealForm));
    el.mealForm.reset();
    resetImageTools();
  });

  el.resetFormBtn.addEventListener("click", () => {
    el.mealForm.reset();
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

  el.loadSampleBtn.addEventListener("click", () => {
    loadSampleDataset();
  });
}

function initDefaults() {
  if (!state.selectedDate) {
    state.selectedDate = new Date().toISOString().slice(0, 10);
  }
}

function boot() {
  loadState();
  initDefaults();
  bindEvents();
  renderAll();
}

boot();