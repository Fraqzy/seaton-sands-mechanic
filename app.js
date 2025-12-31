// ---------- Storage + defaults ----------
const STORAGE_KEY = "seaton_tools_v1";

const DEFAULTS = {
  adminCode: "123", // verander via admin panel
  materials: [
    { key: "Aluminium", price: 25 },
    { key: "Car parts", price: 25 },
    { key: "Craft parts", price: 25 },
    { key: "Elektronisch Schroot", price: 25 },
    { key: "Ijzer", price: 20 },
    { key: "Metaalschroot", price: 25 },
    { key: "Rubber", price: 25 },
    { key: "Staal", price: 20 },
    { key: "Koper", price: 20 },
    { key: "Plastic", price: 20 }
  ],
  bulk: {
    enabledDefault: false,
    threshold: 1000,
    addPerPiece: 5
  },

  cosmetics: {
    // basisprijs voor elke "sheet" optie die je aanvinkt
    basePricePerItem: 400,

    // extra "standaard checkmarks" die nooit in sheet staan
    alwaysOptions: [
      { name: "Fully tune", price: 30000, category: "Performance", enabled: true },
      { name: "Raceharnas", price: 6000, category: "Safety", enabled: true }
    ],

    // mapping van sheet "Onderdeel" naar categorie
    // (je kan dit uitbreiden in admin)
    categoryMap: {
      "Voorbumpers": "Bumper",
      "Achterbumpers": "Bumper",
      "Roosters": "Bumper",
      "Motorkappen": "Motorkap",
      "Skirts": "Skirts",
      "Linker Spatbord": "Skirts",
      "Rechter spatbord": "Skirts",
      "Rolkooien": "Rollcage",
      "Borden": "Aangepast kentekenplaat",
      "Livery": "Bestickering",
      "Afwerking B": "Buitenkant cosmetica",
      "Extras": "Buitenkant cosmetica",
      "Dak": "Buitenkant cosmetica",
      "Uitlaten": "Buitenkant cosmetica",
      "Spoilers": "Buitenkant cosmetica",
      "Wheels": "Custom Velgen",
      "Velg": "Custom Velgen",
      "Raam Tints": "Ramentinten",
      "Primair": "Kleuren",
      "Secundair": "Kleuren",
      "Parelmoer": "Kleuren",
      "Interieur": "Kleuren"
    }
  }
};

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return structuredClone(DEFAULTS);
  try{
    const parsed = JSON.parse(raw);
    // simpele merge: defaults + parsed
    return {
      ...structuredClone(DEFAULTS),
      ...parsed,
      bulk: { ...DEFAULTS.bulk, ...(parsed.bulk||{}) },
      cosmetics: {
        ...DEFAULTS.cosmetics,
        ...(parsed.cosmetics||{}),
        alwaysOptions: parsed?.cosmetics?.alwaysOptions ?? DEFAULTS.cosmetics.alwaysOptions,
        categoryMap: { ...DEFAULTS.cosmetics.categoryMap, ...(parsed?.cosmetics?.categoryMap||{}) }
      }
    };
  }catch{
    return structuredClone(DEFAULTS);
  }
}
function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function eur(n){
  return new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR"}).format(n);
}

// ---------- Hidden admin ----------
function setupHiddenAdmin(){
  const btn = document.querySelector(".hidden-admin");
  if(!btn) return;
  btn.addEventListener("click", ()=>{
    const state = loadState();
    const code = prompt("Admin code (3 cijfers):");
    if(code === null) return;
    if(code.trim() === state.adminCode){
      window.location.href = "admin.html";
    }else{
      alert("Foute code.");
    }
  });
}

// ---------- Materials page ----------
function initMaterials(){
  setupHiddenAdmin();
  const state = loadState();

  const bulkToggle = document.getElementById("bulkToggle");
  const bulkInfo = document.getElementById("bulkInfo");
  const rows = document.getElementById("materialsRows");
  const totalAmountEl = document.getElementById("totalAmount");
  const bulkAmountEl = document.getElementById("bulkAmount");
  const totalQtyEl = document.getElementById("totalQty");

  // default toggle
  bulkToggle.checked = !!state.bulk.enabledDefault;

  function render(){
    rows.innerHTML = "";
    state.materials.forEach((m, idx)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div><b>${m.key}</b></div>
          <div class="small">${eur(m.price)} / stuk</div>
        </td>
        <td><input type="number" min="0" step="1" value="0" data-idx="${idx}" /></td>
        <td class="priceCell" data-idx="${idx}">${eur(0)}</td>
      `;
      rows.appendChild(tr);
    });
    calculate();
  }

  function calculate(){
    const bulkOn = bulkToggle.checked;
    bulkInfo.textContent = bulkOn
      ? `Bulk aan: +${eur(state.bulk.addPerPiece)} per stuk zodra aantal > ${state.bulk.threshold}`
      : `Bulk uit`;

    let total = 0;
    let totalQty = 0;
    let bulkExtra = 0;

    rows.querySelectorAll("input[type=number]").forEach(input=>{
      const idx = Number(input.dataset.idx);
      const qty = Math.max(0, Number(input.value||0));
      totalQty += qty;

      const base = qty * state.materials[idx].price;
      let extra = 0;
      if(bulkOn && qty > state.bulk.threshold){
        extra = qty * state.bulk.addPerPiece;
      }
      bulkExtra += extra;

      const line = base + extra;
      total += line;

      const cell = rows.querySelector(`.priceCell[data-idx="${idx}"]`);
      if(cell) cell.textContent = eur(line);
    });

    totalAmountEl.textContent = eur(total);
    bulkAmountEl.textContent = eur(bulkExtra);
    totalQtyEl.textContent = String(totalQty);
  }

  rows.addEventListener("input", (e)=>{
    if(e.target && e.target.matches("input[type=number]")) calculate();
  });
  bulkToggle.addEventListener("change", calculate);

  document.getElementById("resetMaterials").addEventListener("click", ()=>{
    rows.querySelectorAll("input[type=number]").forEach(i=>i.value=0);
    calculate();
  });

  render();
}

// ---------- Cosmetics parsing ----------
function parseSheetText(text){
  // input voorbeeld: "Voorbumpers - [ 5. Cropped ... ],Motorkappen - [ 5. Vented Hood ], ..."
  // We splitsen op comma, maar sommige users plaatsen ", " => trim.
  const parts = text
    .split(",")
    .map(s=>s.trim())
    .filter(Boolean);

  const items = [];
  for(const p of parts){
    // "Key - [ Value ] -"
    // We pakken alles links van "-" als key, en tussen [ ] als value
    const dashIdx = p.indexOf("-");
    if(dashIdx === -1) continue;

    const key = p.slice(0, dashIdx).trim().replace(/\s+/g," ");
    const match = p.match(/\[\s*(.*?)\s*\]/);
    let option = match ? match[1] : "";
    option = option.replace(/\s+/g," ").trim();

    // skip volledig lege keys
    if(!key) continue;

    items.push({ part: key, option });
  }
  return items;
}

function initCosmetics(){
  setupHiddenAdmin();
  const state = loadState();

  const sheetInput = document.getElementById("sheetInput");
  const toTableBtn = document.getElementById("toTable");
  const resetBtn = document.getElementById("resetCosmetics");

  const countEl = document.getElementById("countItems");
  const totalEl = document.getElementById("totalPrice");
  const appliedEl = document.getElementById("appliedCount");
  const appliedAmountEl = document.getElementById("appliedAmount");
  const tableBody = document.getElementById("cosmeticsRows");

  // rechter lijst "Optie" (zoals screenshot 5)
  const optionList = document.getElementById("optionList");

  let currentRows = []; // {label, option, category, price, checked}

  function rebuild(){
    tableBody.innerHTML = "";
    optionList.innerHTML = "";

    currentRows.forEach((r, idx)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="checkbox" data-idx="${idx}" ${r.checked ? "checked":""}></td>
        <td><b>${r.label}</b></td>
        <td>${escapeHtml(r.option || "")}</td>
        <td>${escapeHtml(r.category || "")}</td>
        <td>${eur(r.price)}</td>
      `;
      tableBody.appendChild(tr);

      const li = document.createElement("div");
      li.style.padding = "10px";
      li.style.borderBottom = "1px solid var(--border)";
      li.textContent = r.option || r.label;
      optionList.appendChild(li);
    });

    updateTotals();
  }

  function updateTotals(){
    const count = currentRows.length;
    let applied = 0;
    let appliedAmount = 0;
    let total = 0;

    for(const r of currentRows){
      total += r.price;
      if(r.checked){
        applied += 1;
        appliedAmount += r.price;
      }
    }

    countEl.textContent = String(count);
    totalEl.textContent = eur(total);
    appliedEl.textContent = `${applied} / ${count}`;
    appliedAmountEl.textContent = eur(appliedAmount);
  }

  function buildFromText(){
    const parsed = parseSheetText(sheetInput.value || "");
    const rows = [];

    // Sheet items => base price
    for(const it of parsed){
      const cat = state.cosmetics.categoryMap[it.part] || "Onbekend";
      rows.push({
        label: it.part,
        option: it.option,
        category: cat,
        price: Number(state.cosmetics.basePricePerItem || 0),
        checked: false
      });
    }

    // Always options (extra checkmarks)
    for(const opt of (state.cosmetics.alwaysOptions || [])){
      if(!opt.enabled) continue;
      rows.push({
        label: opt.name,
        option: opt.name,
        category: opt.category || "Extra",
        price: Number(opt.price || 0),
        checked: false
      });
    }

    currentRows = rows;
    rebuild();
  }

  tableBody.addEventListener("change", (e)=>{
    const cb = e.target;
    if(cb && cb.matches("input[type=checkbox]")){
      const idx = Number(cb.dataset.idx);
      currentRows[idx].checked = cb.checked;
      updateTotals();
    }
  });

  toTableBtn.addEventListener("click", buildFromText);
  resetBtn.addEventListener("click", ()=>{
    sheetInput.value = "";
    currentRows = [];
    rebuild();
  });

  // start leeg
  rebuild();
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ---------- Admin ----------
function initAdmin(){
  const state = loadState();

  const adminCode = document.getElementById("adminCode");
  const bulkThreshold = document.getElementById("bulkThreshold");
  const bulkAdd = document.getElementById("bulkAdd");
  const bulkDefault = document.getElementById("bulkDefault");

  const baseCosPrice = document.getElementById("baseCosPrice");

  const matJson = document.getElementById("matJson");
  const mapJson = document.getElementById("mapJson");
  const alwaysJson = document.getElementById("alwaysJson");

  // fill
  adminCode.value = state.adminCode;
  bulkThreshold.value = state.bulk.threshold;
  bulkAdd.value = state.bulk.addPerPiece;
  bulkDefault.checked = !!state.bulk.enabledDefault;

  baseCosPrice.value = state.cosmetics.basePricePerItem;

  matJson.value = JSON.stringify(state.materials, null, 2);
  mapJson.value = JSON.stringify(state.cosmetics.categoryMap, null, 2);
  alwaysJson.value = JSON.stringify(state.cosmetics.alwaysOptions, null, 2);

  document.getElementById("saveAdmin").addEventListener("click", ()=>{
    try{
      const newState = loadState();

      const code = adminCode.value.trim();
      if(!/^\d{3}$/.test(code)) throw new Error("Admin code moet exact 3 cijfers zijn.");

      newState.adminCode = code;
      newState.bulk.threshold = Number(bulkThreshold.value || 1000);
      newState.bulk.addPerPiece = Number(bulkAdd.value || 5);
      newState.bulk.enabledDefault = !!bulkDefault.checked;

      newState.cosmetics.basePricePerItem = Number(baseCosPrice.value || 400);

      const mats = JSON.parse(matJson.value);
      if(!Array.isArray(mats)) throw new Error("Materials JSON moet een array zijn.");
      newState.materials = mats;

      const cmap = JSON.parse(mapJson.value);
      if(typeof cmap !== "object" || Array.isArray(cmap) || !cmap) throw new Error("CategoryMap JSON moet een object zijn.");
      newState.cosmetics.categoryMap = cmap;

      const aopts = JSON.parse(alwaysJson.value);
      if(!Array.isArray(aopts)) throw new Error("AlwaysOptions JSON moet een array zijn.");
      newState.cosmetics.alwaysOptions = aopts;

      saveState(newState);
      alert("Opgeslagen! Refresh je pagina’s.");
    }catch(err){
      alert("Fout: " + err.message);
    }
  });

  document.getElementById("resetAll").addEventListener("click", ()=>{
    if(!confirm("Alles resetten naar defaults?")) return;
    localStorage.removeItem(STORAGE_KEY);
    alert("Reset gedaan. Herlaad de pagina.");
  });
}

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", ()=>{
  const page = document.body.dataset.page;
  if(page === "materials") initMaterials();
  if(page === "cosmetics") initCosmetics();
  if(page === "admin") initAdmin();
  // home ook hidden admin
  setupHiddenAdmin();
});
