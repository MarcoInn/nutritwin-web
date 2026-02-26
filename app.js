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
  frequentMeals: document.getElementById("frequentMeals"),
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
  openCameraBtn: document.getElementById("openCameraBtn"),
  cameraBox: document.getElementById("cameraBox"),
  cameraVideo: document.getElementById("cameraVideo"),
  cameraCanvas: document.getElementById("cameraCanvas"),
  capturePhotoBtn: document.getElementById("capturePhotoBtn"),
  closeCameraBtn: document.getElementById("closeCameraBtn"),
};

const FOOD_MAP = [
  { keywords: ["pizza"], mealName: "Pizza", kcal: 850, protein: 32, carbs: 95, fat: 38, micros: "Na↑ Mg↓ Fiber↓" },
  { keywords: ["burger", "cheeseburger"], mealName: "Burger", kcal: 780, protein: 35, carbs: 55, fat: 45, micros: "Na↑ Fe↔ Fiber↓" },
  { keywords: ["salad", "caesar", "greens"], mealName: "Salat", kcal: 420, protein: 20, carbs: 22, fat: 26, micros: "Fiber↑ VitC↑" },
  { keywords: ["sushi"], mealName: "Sushi", kcal: 520, protein: 22, carbs: 75, fat: 14, micros: "Iodine↔ Na↑" },
  { keywords: ["pasta", "spaghetti", "noodle"], mealName: "Pasta", kcal: 650, protein: 22, carbs: 92, fat: 18, micros: "Fiber↓ K↔" },
  { keywords: ["rice", "bowl", "quinoa"], mealName: "Rice Bowl", kcal: 610, protein: 32, carbs: 70, fat: 18, micros: "Mg↔ Fiber↔" },
  { keywords: ["steak", "beef"], mealName: "Steak Teller", kcal: 700, protein: 55, carbs: 28, fat: 40, micros: "Fe↑ Zn↑" },
  { keywords: ["salmon", "fish"], mealName: "Lachs Teller", kcal: 620, protein: 45, carbs: 30, fat: 34, micros: "Omega-3↑ VitD↔" },
  { keywords: ["egg", "omelet"], mealName: "Eiergericht", kcal: 430, protein: 26, carbs: 10, fat: 30, micros: "Choline↑" },
  { keywords: ["sandwich", "sub"], mealName: "Sandwich", kcal: 520, protein: 24, carbs: 55, fat: 20, micros: "Na↔ Fiber↓" },
  { keywords: ["chicken"], mealName: "Chicken Bowl", kcal: 590, protein: 48, carbs: 48, fat: 20, micros: "B6↑ Zn↔" },
  { keywords: ["dessert", "cake", "donut"], mealName: "Dessert", kcal: 460, protein: 6, carbs: 58, fat: 22, micros: "Sugar↑ Fiber↓" },
];

function uid(prefix = "id") { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }
function toNumber(value){ const n=Number(value); return Number.isFinite(n)?n:0; }
function getPortionFactor(){ const v=Number(el.portionFactor?.value||1); return Number.isFinite(v)&&v>0?v:1; }
function confidenceLabel(score){ if(score>=0.65) return "HIGH"; if(score>=0.4) return "MED"; return "LOW"; }

function loadState(){ const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return; try{const p=JSON.parse(raw); state.users=Array.isArray(p.users)?p.users:[]; state.selectedUserId=p.selectedUserId||null; state.selectedDate=p.selectedDate||state.selectedDate;}catch{} }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify({users:state.users,selectedUserId:state.selectedUserId,selectedDate:state.selectedDate})); }
function currentUser(){ return state.users.find(u=>u.id===state.selectedUserId)||null; }
function mealsForSelectedDay(){ const u=currentUser(); if(!u) return []; return u.meals.filter(m=>m.mealDateTime.startsWith(state.selectedDate)).sort((a,b)=>a.mealDateTime.localeCompare(b.mealDateTime)); }

function sumDaily(meals){ return meals.reduce((a,m)=>{a.kcal+=toNumber(m.kcal);a.protein+=toNumber(m.protein);a.carbs+=toNumber(m.carbs);a.fat+=toNumber(m.fat);return a;},{kcal:0,protein:0,carbs:0,fat:0}); }
function escapeHtml(t=""){ return t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"); }

function renderUsers(){ el.userSelect.innerHTML=""; if(!state.users.length){const o=document.createElement("option");o.value="";o.textContent="No users yet";el.userSelect.append(o);state.selectedUserId=null;return;} state.users.forEach(u=>{const o=document.createElement("option");o.value=u.id;o.textContent=u.name;if(u.id===state.selectedUserId)o.selected=true;el.userSelect.append(o);}); if(!state.selectedUserId||!state.users.some(u=>u.id===state.selectedUserId)){state.selectedUserId=state.users[0].id;el.userSelect.value=state.selectedUserId;} }

function renderSummary(){ const t=sumDaily(mealsForSelectedDay()); const cards=[{label:"Calories",value:`${Math.round(t.kcal)} kcal`},{label:"Protein",value:`${t.protein.toFixed(1)} g`},{label:"Carbs",value:`${t.carbs.toFixed(1)} g`},{label:"Fat",value:`${t.fat.toFixed(1)} g`}]; el.summary.innerHTML=cards.map(c=>`<article class="metric"><div class="label">${c.label}</div><div class="value">${c.value}</div></article>`).join(""); }

function renderFrequentMeals(){
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
  const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  el.frequentMeals.innerHTML = top.map(([name]) => `<button type="button" class="btn btn-secondary small" data-quickmeal="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join(" ");
  el.frequentMeals.querySelectorAll("[data-quickmeal]").forEach((btn)=>{
    btn.addEventListener("click", ()=>{
      el.mealForm.mealName.value = btn.getAttribute("data-quickmeal");
      if(!el.mealForm.mealDateTime.value){
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        el.mealForm.mealDateTime.value = now.toISOString().slice(0,16);
      }
    });
  });
}

function renderReportView(){ const u=currentUser(); const meals=mealsForSelectedDay(); if(!u||!meals.length){el.reportView.innerHTML='<p class="muted">No entries for selected day yet.</p>'; return;} el.reportView.innerHTML=meals.map(meal=>{const time=new Date(meal.mealDateTime).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}); return `<article class="report-item"><h4>${escapeHtml(meal.mealName)} <span class="small muted">(${time})</span></h4><div class="small">${escapeHtml(meal.description||"No notes")}</div><div class="small muted">kcal ${toNumber(meal.kcal)} · P ${toNumber(meal.protein)}g · C ${toNumber(meal.carbs)}g · F ${toNumber(meal.fat)}g</div>${meal.imagePath?`<div class="small muted">Image ref: ${escapeHtml(meal.imagePath)}</div>`:""}</article>`;}).join(""); }

function buildMarkdownReport(){ const u=currentUser(); const meals=mealsForSelectedDay(); if(!u) return "# NutriTwin Daily Report\n\n_No user selected._"; const t=sumDaily(meals); const lines=[`# NutriTwin Daily Report`,``,`- **User:** ${u.name}`,`- **Date:** ${state.selectedDate}`,`- **Meals logged:** ${meals.length}` ,``,`## Daily Summary`,``,`- **Calories:** ${Math.round(t.kcal)} kcal`,`- **Protein:** ${t.protein.toFixed(1)} g`,`- **Carbs:** ${t.carbs.toFixed(1)} g`,`- **Fat:** ${t.fat.toFixed(1)} g`,``,`## Meals`,``]; if(!meals.length){lines.push('_No meals logged for this date._'); return lines.join('\n');} meals.forEach((m,i)=>{lines.push(`### ${i+1}. ${m.mealName}`); lines.push(`- Time: ${m.mealDateTime.replace('T',' ')}`); lines.push(`- Description: ${m.description||'-'}`); lines.push(`- Macros: ${toNumber(m.kcal)} kcal | P ${toNumber(m.protein)} g | C ${toNumber(m.carbs)} g | F ${toNumber(m.fat)} g`); if(m.imagePath) lines.push(`- Image ref: ${m.imagePath}`); lines.push('');}); return lines.join('\n'); }

function createUser(name){const n=(name||"").trim(); if(!n) return; const u={id:uid('user'),name:n,meals:[],createdAt:new Date().toISOString()}; state.users.push(u); state.selectedUserId=u.id; saveState(); renderAll();}

function setVisionStatus(msg,isError=false){ el.visionStatus.textContent=msg; el.visionStatus.style.color=isError?"#b42318":""; }
function stopCameraStream(){ const stream=el.cameraVideo?.srcObject; if(stream){stream.getTracks().forEach(t=>t.stop()); el.cameraVideo.srcObject=null;} el.cameraBox.classList.add('hidden'); }
async function openCameraCapture(){ try{ const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false}); el.cameraVideo.srcObject=stream; el.cameraBox.classList.remove('hidden'); setVisionStatus('Kamera aktiv. Foto aufnehmen.'); } catch{ setVisionStatus('Kamerazugriff nicht möglich',true);} }
function captureFromCamera(){ const v=el.cameraVideo,c=el.cameraCanvas; if(!v?.videoWidth) return; c.width=v.videoWidth; c.height=v.videoHeight; c.getContext('2d').drawImage(v,0,0,c.width,c.height); state.imageDataUrl=c.toDataURL('image/jpeg',0.9); el.mealImagePreview.src=state.imageDataUrl; el.imageTools.classList.remove('hidden'); setVisionStatus('Foto übernommen. Analyse starten.'); stopCameraStream(); }

function loadScript(src){ return new Promise((res,rej)=>{const s=document.createElement('script'); s.src=src; s.async=true; s.onload=res; s.onerror=rej; document.head.appendChild(s);}); }
async function ensureVisionReady(){ if(state.vision.ready&&state.vision.model) return; setVisionStatus('Lade Bilderkennung …'); if(!window.tf) await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js'); if(!window.mobilenet) await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js'); state.vision.model=await window.mobilenet.load({version:2,alpha:1}); state.vision.ready=true; setVisionStatus('Bilderkennung bereit'); }

function mapPredictionToNutrition(predictions=[]){ const matches=[]; for(const item of FOOD_MAP){ let score=0; for(const pred of predictions){ const c=pred.className.toLowerCase(); if(item.keywords.some(k=>c.includes(k))) score+=pred.probability; } if(score>0) matches.push({...item,score}); } if(!matches.length) return null; matches.sort((a,b)=>b.score-a.score); const top=matches[0]; return {...top, confidence: Math.min(1, top.score)}; }

function fillFormFromEstimate(estimate,predictions){ const f=el.mealForm; if(!estimate){ el.visionSuggestions.textContent=`Kein klarer Food-Match. Top-Klassen: ${predictions.slice(0,3).map(p=>`${p.className} (${(p.probability*100).toFixed(0)}%)`).join(', ')}. Bitte Werte kurz ergänzen.`; return; }
  const factor=getPortionFactor();
  const kcal=Math.round(estimate.kcal*factor), protein=+(estimate.protein*factor).toFixed(1), carbs=+(estimate.carbs*factor).toFixed(1), fat=+(estimate.fat*factor).toFixed(1);
  f.mealName.value=estimate.mealName; f.description.value=`Auto-Vorschlag aus Foto: ${predictions[0].className}`; f.kcal.value=kcal; f.protein.value=protein; f.carbs.value=carbs; f.fat.value=fat;
  const conf=estimate.confidence, confPct=(conf*100).toFixed(0), trust=confidenceLabel(conf);
  const trustNote = trust === "LOW" ? "Niedrige Sicherheit: bitte Meal-Name und Makros manuell gegenchecken." : "Bitte kurz validieren.";
  el.visionSuggestions.textContent=`Auto-Vorschlag: ${estimate.mealName} · ${kcal} kcal · P ${protein} / C ${carbs} / F ${fat} | Portion ${factor}x | Confidence ${confPct}% (${trust}) | Mikro-Hinweis: ${estimate.micros}. ${trustNote}`;
}

async function analyzeCurrentImage(){ if(!state.imageDataUrl){ setVisionStatus('Bitte zuerst ein Bild wählen',true); return;} try{ await ensureVisionReady(); setVisionStatus('Analysiere Foto …'); const preds=await state.vision.model.classify(el.mealImagePreview); state.vision.lastPredictions=preds; fillFormFromEstimate(mapPredictionToNutrition(preds),preds); setVisionStatus('Analyse fertig'); } catch { setVisionStatus('Analyse fehlgeschlagen',true);} }

function addMealFromForm(formData){ const u=currentUser(); if(!u){alert('Please create/select a user first.');return;} const meal={id:uid('meal'),mealName:(formData.get('mealName')||'').toString().trim(),mealDateTime:formData.get('mealDateTime'),description:(formData.get('description')||'').toString().trim(),kcal:formData.get('kcal')||0,protein:formData.get('protein')||0,carbs:formData.get('carbs')||0,fat:formData.get('fat')||0,imagePath:(formData.get('imagePath')||'').toString().trim()||state.imageDataUrl,createdAt:new Date().toISOString()}; if(!meal.mealName||!meal.mealDateTime){alert('Meal name and date/time are required.');return;} u.meals.push(meal); saveState(); renderAll(); }

function resetImageTools(){ state.imageDataUrl=''; state.vision.lastPredictions=[]; stopCameraStream(); el.imageTools.classList.add('hidden'); el.mealImagePreview.src=''; el.visionSuggestions.textContent=''; setVisionStatus('Noch nicht analysiert'); }

function loadSampleDataset(){ const d=new Date().toISOString().slice(0,10); const u={id:uid('user'),name:'Sample Executive',createdAt:new Date().toISOString(),meals:[{id:uid('meal'),mealName:'Breakfast Power Bowl',mealDateTime:`${d}T08:00`,description:'Greek yogurt, berries, oats',kcal:420,protein:32,carbs:44,fat:12,imagePath:'images/breakfast_bowl.jpg',createdAt:new Date().toISOString()},{id:uid('meal'),mealName:'Lunch Lean Plate',mealDateTime:`${d}T13:00`,description:'Grilled chicken, quinoa, greens',kcal:610,protein:48,carbs:52,fat:18,imagePath:'images/lunch_plate.jpg',createdAt:new Date().toISOString()},{id:uid('meal'),mealName:'Dinner Recovery',mealDateTime:`${d}T19:30`,description:'Salmon, sweet potato, broccoli',kcal:690,protein:50,carbs:46,fat:30,imagePath:'',createdAt:new Date().toISOString()}]}; state.users=[u]; state.selectedUserId=u.id; state.selectedDate=d; saveState(); renderAll(); }

function renderAll(){ renderUsers(); el.reportDate.value=state.selectedDate; renderSummary(); renderFrequentMeals(); renderReportView(); el.markdownOutput.value=buildMarkdownReport(); }

function bindEvents(){
  el.createUserBtn.addEventListener('click',()=>{createUser(el.newUserName.value); el.newUserName.value=''; el.newUserName.focus();});
  el.userSelect.addEventListener('change',e=>{state.selectedUserId=e.target.value||null; saveState(); renderAll();});
  el.reportDate.addEventListener('change',e=>{state.selectedDate=e.target.value; saveState(); renderAll();});
  el.mealImageFile.addEventListener('change',e=>{const f=e.target.files?.[0]; if(!f) return resetImageTools(); const r=new FileReader(); r.onload=()=>{state.imageDataUrl=r.result?.toString()||''; el.mealImagePreview.src=state.imageDataUrl; el.imageTools.classList.remove('hidden'); setVisionStatus('Bild geladen. Analyse starten.'); el.visionSuggestions.textContent='';}; r.readAsDataURL(f);});
  el.openCameraBtn?.addEventListener('click',openCameraCapture);
  el.capturePhotoBtn?.addEventListener('click',captureFromCamera);
  el.closeCameraBtn?.addEventListener('click',stopCameraStream);
  el.analyzeImageBtn.addEventListener('click',analyzeCurrentImage);
  el.mealForm.addEventListener('submit',e=>{e.preventDefault(); addMealFromForm(new FormData(el.mealForm)); el.mealForm.reset(); resetImageTools();});
  el.resetFormBtn.addEventListener('click',()=>{el.mealForm.reset(); resetImageTools();});
  el.exportMarkdownBtn.addEventListener('click',async()=>{const md=buildMarkdownReport(); el.markdownOutput.value=md; try{await navigator.clipboard.writeText(md); el.exportMarkdownBtn.textContent='Copied'; setTimeout(()=>el.exportMarkdownBtn.textContent='Export Markdown',1200);}catch{el.exportMarkdownBtn.textContent='Exported Below'; setTimeout(()=>el.exportMarkdownBtn.textContent='Export Markdown',1200);}});
  el.loadSampleBtn.addEventListener('click',loadSampleDataset);
}

function boot(){ loadState(); bindEvents(); renderAll(); }
boot();