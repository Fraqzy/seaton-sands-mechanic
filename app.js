// ---------- Storage + defaults ----------
const STORAGE_KEY = "seaton_tools_v2";

const DEFAULTS = {
  adminCode: "284", // verander via admin panel
  materials: [
    { key: "Aluminium", price: 25 },
    { key: "Car parts", price: 25 },
    { key: "Craft parts", price: 25 },
    { key: "Elektronisch Schroot", price: 25 },
    { key: "Ijzer", price: 25 },
    { key: "Metaalschroot", price: 25 },
    { key: "Rubber", price: 25 },
    { key: "Staal", price: 25 },
    { key: "Koper", price: 15 },
    { key: "Plastic", price: 15 }
  ],
  bulk: {
    enabledDefault: false,
    threshold: 1000,
    addPerPiece: 5
  },

  cosmetics: {
    // basisprijs voor elke "sheet" rij (ongeacht vinkje)
    basePricePerItem: 400,

    // extra opties (NIET standaard meetellen: enkel als checkbox aan staat)
    favoriteExtras: ["Fully tune", "Raceharnas", "Kleine reparatie", "Grote reparatie", "Set banden"],

    // 10% korting op grand total (sheet + extras)
    discount10: false,

    extraOptions: [
        { name: "Fully tune", price: 30000, category: "Performance", enabled: true, favorite: true },
        { name: "Raceharnas", price: 6000, category: "NOS items", enabled: true },
        { name: "Pops n' bangs", price: 2000, category: "NOS items", enabled: true },
        { name: "Voertuig armor", price: 2500, category: "NOS items", enabled: true },
        { name: "NOS", price: 3000, category: "NOS items", enabled: true },
        { name: "Bijvullen NOS", price: 2500, category: "NOS items", enabled: true },
        { name: "NOS kleurinjector", price: 1000, category: "NOS items", enabled: true },
        { name: "NEON lichten", price: 1500, category: "Werktuigkundige gereedschap", enabled: true },
        { name: "Xenon lichten", price: 1500, category: "Werktuigkundige gereedschap", enabled: true },
        { name: "Ophanging Tier 1", price: 2500, category: "performance", enabled: true },
        { name: "Ophanging Tier 2", price: 5000, category: "performance", enabled: true },
        { name: "Ophanging Tier 3", price: 7500, category: "performance", enabled: true },
        { name: "Ophanging Tier 4", price: 10000, category: "performance", enabled: true },
        { name: "Ophanging Tier 5", price: 12500, category: "performance", enabled: true },
        { name: "1 band", price: 400, category: "repair items", enabled: true },
        { name: "2 banden", price: 800, category: "repair items", enabled: true },
        { name: "Set banden", price: 1000, category: "repair items", enabled: true },
        { name: "Kleine reparatie", price: 300, category: "repair items", enabled: true },
        { name: "Grote reparatie", price: 600, category: "repair items", enabled: true }
],

    categoryMap: {
      "Voorbumpers": "Bumper",
      "Achterbumpers": "Bumper",
      "Grilles": "Bumper",
      "Motorkappen": "Motorkap",
      "Sideskirts": "Skirts",
      "Linker spatbord": "Skirts",
      "Rechter spatbord": "Skirts",
      "Rolkooien": "Rollcage",
      "Kenteken": "Aangepast Kenteken",
      "Kentekenplaathouders": "Aangepast Kenteken",
      "Wrap": "Bestickering",
      "Afwerking B": "Buitenkant Cosmetica",
      "Afwerking A": "Buitenkant Cosmetica",
      "Antennes": "Buitenkant Cosmetica",
      "Hydraulica": "Buitenkant Cosmetica",
      "Ornamenten": "Binnenkant Cosmetica",
      "Speakers": "Binnenkant Cosmetica",
      "Deurspeakers": "Binnenkant Cosmetica",
      "Wijzerplaten": "Binnenkant Cosmetica",
      "Wielkastafdekkingen": "Buitenkant Cosmetica",
      "Koffers": "Buitenkant Cosmetica",
      "Stoelen": "Stoel cosmetics",
      "Extra's": "Buitenkant Cosmetica",
      "Dak": "Voertuig Dak",
      "Uitlaten": "Uitlaat",
      "Spoilers": "Spoiler",
      "Wheels": "Custom Velgen",
      "Velg": "Spuitbus",
      "Raamfolie": "Ramen tint kit",
      "Primair": "Spuitbus",
      "Secundair": "Spuitbus",
      "Parelmoer": "Spuitbus",
      "Dashboard": "Spuitbus",
      "Interieur": "Spuitbus"
    }
  }
};

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return structuredClone(DEFAULTS);
  try{
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULTS),
      ...parsed,
      bulk: { ...DEFAULTS.bulk, ...(parsed.bulk||{}) },
      cosmetics: {
        ...DEFAULTS.cosmetics,
        ...(parsed.cosmetics||{}),
        // migrate old alwaysOptions -> extraOptions if present
        extraOptions: (parsed?.cosmetics?.extraOptions ?? parsed?.cosmetics?.alwaysOptions ?? DEFAULTS.cosmetics.extraOptions),
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
  const pawnToggle = document.getElementById("pawnshopToggle");
  const pawnInfo = document.getElementById("pawnInfo");
  const rows = document.getElementById("materialsRows");
  const totalAmountEl = document.getElementById("totalAmount");
  const bulkAmountEl = document.getElementById("bulkAmount");
  const totalQtyEl = document.getElementById("totalQty");

  bulkToggle.checked = !!state.bulk.enabledDefault;
  pawnToggle.checked = false;

  const PAWNSHOP_SET = new Set([
    'Ijzer','Staal','Aluminium','Rubber','Elektronisch Schroot','Car parts','Craft parts'
  ]);
  function unitPrice(m){
    if(pawnToggle.checked && PAWNSHOP_SET.has(m.key)) return 25;
    return m.price;
  }

  function render(){
    rows.innerHTML = "";
    state.materials.forEach((m, idx)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div><b>${m.key}</b></div>
          <div class="small">${eur(unitPrice(m))} / stuk</div>
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

    pawnInfo.textContent = pawnToggle.checked
      ? 'Pawnshop inkopen: Ijzer/Staal/Aluminium/Rubber/E-Schroot/Car & Craft parts = €25/stuk'
      : '';

    let total = 0;
    let totalQty = 0;
    let bulkExtra = 0;

    rows.querySelectorAll("input[type=number]").forEach(input=>{
      const idx = Number(input.dataset.idx);
      const qty = Math.max(0, Number(input.value||0));
      totalQty += qty;

      const base = qty * unitPrice(state.materials[idx]);
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
  pawnToggle.addEventListener("change", ()=>{ render(); });

  document.getElementById("resetMaterials").addEventListener("click", ()=>{
    rows.querySelectorAll("input[type=number]").forEach(i=>i.value=0);
    calculate();
  });

  render();
}

// ---------- Cosmetics parsing ----------
function parseSheetText(text){
  const parts = text
    .split(",")
    .map(s=>s.trim())
    .filter(Boolean);

  const items = [];
  for(const p of parts){
    const dashIdx = p.indexOf("-");
    if(dashIdx === -1) continue;

    const key = p.slice(0, dashIdx).trim().replace(/\s+/g," ");
    const match = p.match(/\[\s*(.*?)\s*\]/);
    let option = match ? match[1] : "";
    option = option.replace(/\s+/g," ").trim();

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

  // KPIs (sheet)
  const countEl = document.getElementById("countItems");
  const totalEl = document.getElementById("totalPrice");
  const appliedEl = document.getElementById("appliedCount");
  const appliedAmountEl = document.getElementById("appliedAmount");
  const catSummaryEl = document.getElementById("categorySummary");

  // KPIs (extras)
  const extrasAppliedEl = document.getElementById("extrasApplied");
  const extrasAmountEl = document.getElementById("extrasAmount");

  // KPI grand total
  const grandTotalEl = document.getElementById("grandTotal");
  const discountToggle = document.getElementById("discount10");
  const discountAmountEl = document.getElementById("discountAmount");

  const tableBody = document.getElementById("cosmeticsRows");
  const extrasBody = document.getElementById("extrasRows");

  let sheetRows = [];   // {label, option, category, price, checked}
  let extraRows = [];   // {name, category, price, checked}

  

  function isFav(name){
    return (state.cosmetics.favoriteExtras || []).includes(name);
  }
  function toggleFav(name){
    const cur = new Set(state.cosmetics.favoriteExtras || []);
    if(cur.has(name)) cur.delete(name); else cur.add(name);
    state.cosmetics.favoriteExtras = Array.from(cur);
    saveState(state);
  }
  function sortExtras(){
    extraRows.sort((a,b)=>{
      const fa = isFav(a.name) ? 0 : 1;
      const fb = isFav(b.name) ? 0 : 1;
      if(fa != fb) return fa - fb;
      const ca = (a.category || "").toLowerCase();
      const cb = (b.category || "").toLowerCase();
      if(ca < cb) return -1;
      if(ca > cb) return 1;
      const na = (a.name || "").toLowerCase();
      const nb = (b.name || "").toLowerCase();
      if(na < nb) return -1;
      if(na > nb) return 1;
      return 0;
    });
  }
function loadExtras(keepChecks = true){
    const prev = new Map();
    if(keepChecks){
      for(const r of extraRows) prev.set(r.name, !!r.checked);
    }
    extraRows = (state.cosmetics.extraOptions || [])
      .filter(o => o.enabled)
      .map(o => ({
        name: o.name,
        category: o.category || "Extra",
        price: Number(o.price || 0),
        checked: prev.get(o.name) ?? false
      }));
  sortExtras();
  }

  function rebuildSheet(){
    tableBody.innerHTML = "";
    sheetRows.forEach((r, idx)=>{
      const tr = document.createElement("tr");
      if(r.checked) tr.classList.add("done");
      tr.innerHTML = `        <td><input type="checkbox" data-idx="${idx}" ${r.checked ? "checked":""}></td>
        <td><b>${escapeHtml(r.label)}</b></td>
        <td>${escapeHtml(r.option || "")}</td>
        <td>${escapeHtml(r.category || "")}</td>`;
      tableBody.appendChild(tr);
    });
  }

  function rebuildExtras(){
    extrasBody.innerHTML = "";
    extraRows.forEach((r, idx)=>{
      const tr = document.createElement("tr");
      const favOn = isFav(r.name);
      tr.innerHTML = `
        <td><input type="checkbox" data-xidx="${idx}" ${r.checked ? "checked":""}></td>
        <td><button class="favBtn ${favOn ? "on":""}" data-fav="${idx}" title="Favoriet">${favOn ? "★":"☆"}</button></td>
        <td><b>${escapeHtml(r.name)}</b></td>
        <td>${eur(r.price)}</td>
      `;
      extrasBody.appendChild(tr);
    });
  }

  function updateTotals(){
    // sheet totals
    const count = sheetRows.length;
    let applied = 0;
    let appliedAmount = 0;
    let total = 0;

    for(const r of sheetRows){
      total += r.price;
      if(r.checked){
        applied += 1;
        appliedAmount += r.price;
      }
    }

    // extras totals (ONLY if checked)
    let extrasApplied = 0;
    let extrasAmount = 0;
    for(const r of extraRows){
      if(r.checked){
        extrasApplied += 1;
        extrasAmount += r.price;
      }
    }

    countEl.textContent = String(count);
    totalEl.textContent = eur(total);
    if(appliedEl) appliedEl.textContent = `${applied} / ${count}`;
    if(appliedAmountEl) appliedAmountEl.textContent = eur(appliedAmount);

    extrasAppliedEl.textContent = `${extrasApplied} / ${extraRows.length}`;
    extrasAmountEl.textContent = eur(extrasAmount);

    // Categorie-overzicht (open/total)
    if(catSummaryEl){
      const counts = new Map();
      for(const r of sheetRows){
        const cat = r.category || "Onbekend";
        const cur = counts.get(cat) || {total:0, open:0};
        cur.total += 1;
        if(!r.checked) cur.open += 1;
        counts.set(cat, cur);
      }
      const cats = Array.from(counts.keys()).sort((a,b)=>a.localeCompare(b,'nl',{sensitivity:'base'}));
      catSummaryEl.innerHTML = cats.length
        ? cats.map(cat=>{
            const v = counts.get(cat);
            return `<span class="chip"><b>${escapeHtml(cat)}</b><span class="muted">${v.open}/${v.total}</span></span>`;
          }).join("")
        : '<span class="small">Nog geen sheet omgezet.</span>';
    }

        const grand = total + extrasAmount;
    const discountOn = (discountToggle ? !!discountToggle.checked : !!state.cosmetics.discount10);
    const discount = discountOn ? (grand * 0.10) : 0;
    if(discountAmountEl){
      discountAmountEl.textContent = eur(discount);
      discountAmountEl.closest?.('.kpi')?.classList.toggle('hidden', discount <= 0);
    }
    grandTotalEl.textContent = eur(grand - discount);
  }

  function buildFromText(){
    const parsed = parseSheetText(sheetInput.value || "");
    sheetRows = parsed.map(it => ({
      label: it.part,
      option: it.option,
      category: state.cosmetics.categoryMap[it.part] || "Onbekend",
      price: Number(state.cosmetics.basePricePerItem || 0),
      checked: false
    }));

    // Sorteren op categorie → onderdeel → optie
    sheetRows.sort((a,b)=>{
      const ca = (a.category || "").toLowerCase();
      const cb = (b.category || "").toLowerCase();
      if(ca < cb) return -1;
      if(ca > cb) return 1;

      const la = (a.label || "").toLowerCase();
      const lb = (b.label || "").toLowerCase();
      if(la < lb) return -1;
      if(la > lb) return 1;

      const oa = (a.option || "").toLowerCase();
      const ob = (b.option || "").toLowerCase();
      if(oa < ob) return -1;
      if(oa > ob) return 1;
      return 0;
    });

    rebuildSheet();
    updateTotals();
  }

  tableBody.addEventListener("change", (e)=>{
    const cb = e.target;
    if(cb && cb.matches('input[type="checkbox"][data-idx]')){
      const idx = Number(cb.dataset.idx);
      sheetRows[idx].checked = cb.checked;
      updateTotals();
    }
  });

  extrasBody.addEventListener("click", (e)=>{
    const btn = e.target;
    if(btn && btn.matches("button.favBtn")){
      const idx = Number(btn.dataset.fav);
      const name = extraRows[idx]?.name;
      if(!name) return;
      toggleFav(name);
      loadExtras(true);
      rebuildExtras();
      updateTotals();
    }
  });

  extrasBody.addEventListener("change", (e)=>{
    const cb = e.target;
    if(cb && cb.matches('input[type="checkbox"][data-xidx]')){
      const idx = Number(cb.dataset.xidx);
      extraRows[idx].checked = cb.checked;
      updateTotals();
    }
  });

  toTableBtn.addEventListener("click", buildFromText);

  resetBtn.addEventListener("click", ()=>{
    sheetInput.value = "";
    sheetRows = [];
    // extras blijven zichtbaar, maar reset checkboxes
    for(const r of extraRows) r.checked = false;
    rebuildSheet();
    rebuildExtras();
    updateTotals();
  });

  // Init: extras altijd tonen, ook zonder sheet
  loadExtras(false);

  // 10% korting toggle
  if(discountToggle){
    discountToggle.checked = !!state.cosmetics.discount10;
    discountToggle.addEventListener("change", ()=>{
      state.cosmetics.discount10 = !!discountToggle.checked;
      saveState(state);
      updateTotals();
    });
  }

  rebuildExtras();
  rebuildSheet();
  updateTotals();
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
  const extraJson = document.getElementById("extraJson");

  adminCode.value = state.adminCode;
  bulkThreshold.value = state.bulk.threshold;
  bulkAdd.value = state.bulk.addPerPiece;
  bulkDefault.checked = !!state.bulk.enabledDefault;

  baseCosPrice.value = state.cosmetics.basePricePerItem;

  matJson.value = JSON.stringify(state.materials, null, 2);
  mapJson.value = JSON.stringify(state.cosmetics.categoryMap, null, 2);
  extraJson.value = JSON.stringify(state.cosmetics.extraOptions, null, 2);

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

      const ex = JSON.parse(extraJson.value);
      if(!Array.isArray(ex)) throw new Error("Extra options JSON moet een array zijn.");
      newState.cosmetics.extraOptions = ex;

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
  setupHiddenAdmin();
});
