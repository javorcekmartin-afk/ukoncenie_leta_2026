// v20 – bezpečné kategórie + manuálna obnova dát.
// Tento súbor už pri načítaní NEPREPISUJE lokálne dáta a NEVYBERÁ automaticky staršiu verziu.

// Každé ďalšie uloženie si pred zápisom odloží aktuálny stav do rotačnej zálohy.
const _safeOriginalSave=save;
save=function(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){
      localStorage.setItem("kostoliste_stanok_backup_"+Date.now(),raw);
      const backups=[];
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if(k&&k.startsWith("kostoliste_stanok_backup_"))backups.push(k);
      }
      backups.sort().reverse().slice(10).forEach(k=>localStorage.removeItem(k));
    }
  }catch(e){}
  _safeOriginalSave();
};

const RESULT_CATEGORIES=["Pivo","Víno","Nealko","Alko","Drinky","Iné"];
function normalizeProductCategory(cat){
  const c=String(cat||"").trim();
  if(c==="Destilát")return "Alko";
  if(c==="Mix drink")return "Drinky";
  if(RESULT_CATEGORIES.includes(c))return c;
  return "Iné";
}
categorySelect=function(id,val){
  const current=normalizeProductCategory(val);
  return `<select data-scope="product" data-id="${id}" data-field="category">${RESULT_CATEGORIES.map(c=>`<option ${c===current?"selected":""}>${c}</option>`).join("")}</select>`;
};
function usedInRecipe(sourceId){return state.products.some(p=>p.mode==="recipe"&&(p.components||[]).some(c=>c.itemId===sourceId))}
function actualCategoryForInventoryRow(row){
  if(row.source==="product"){
    const p=state.products.find(x=>x.id===row.sourceId);
    if(!p)return "Iné";
    if(usedInRecipe(p.id))return "Drinky";
    return normalizeProductCategory(p.category);
  }
  if(row.source==="item"){
    const i=state.items.find(x=>x.id===row.sourceId);
    if(!i)return "Iné";
    if(i.kind==="Spotrebný materiál")return "Iné";
    if(usedInRecipe(i.id))return "Drinky";
    return "Iné";
  }
  return "Iné";
}
function actualCategorySummary(){
  const groups=Object.fromEntries(RESULT_CATEGORIES.map(category=>[category,{category,cost:0,names:[]}]))
  inventoryRows().forEach(row=>{
    const c=invCalc(row);if(c.realCost<=0)return;
    const g=groups[actualCategoryForInventoryRow(row)]||groups.Iné;
    g.cost+=c.realCost;g.names.push(row.name);
  });
  const total=Object.values(groups).reduce((s,g)=>s+g.cost,0);
  return RESULT_CATEGORIES.map(category=>({...groups[category],share:total>0?groups[category].cost/total*100:0,total}));
}
function renderCategorySummary(){
  const host=document.getElementById("categorySummary");if(!host)return;
  const rows=actualCategorySummary();const total=rows.reduce((s,g)=>s+g.cost,0);
  host.innerHTML=`<div class="tablewrap" style="max-height:none;margin-top:0"><table style="min-width:720px"><thead><tr><th>Kategória</th><th>Reálny náklad</th><th>Podiel na náklade tovaru</th><th>Položky</th></tr></thead><tbody>${rows.map(g=>`<tr><td><strong>${esc(g.category)}</strong></td><td class="calc">${eur.format(g.cost)}</td><td class="calc">${num.format(g.share)} %</td><td class="mini">${g.names.length?esc([...new Set(g.names)].join(", ")):"—"}</td></tr>`).join("")}<tr class="total-line"><td><strong>Spolu</strong></td><td class="calc"><strong>${eur.format(total)}</strong></td><td class="calc"><strong>${total>0?"100 %":"0 %"}</strong></td><td></td></tr></tbody></table></div>`;
}
function updateCategoryPanelLabels(){
  const panel=document.querySelector(".category-panel");if(!panel)return;
  const h2=panel.querySelector("h2"),note=panel.querySelector(".category-note");
  if(h2)h2.textContent="Skutočný náklad podľa kategórií";
  if(note)note.textContent="Počíta sa automaticky zo skutočne minutých / otvorených balení v inventúre. Produkty a suroviny použité v receptúrach sa zaradia do Drinky; spotrebný materiál ide do Iné.";
}
const _renderShopsCategories=renderShops;
renderShops=function(){_renderShopsCategories();updateCategoryPanelLabels();renderCategorySummary()};
document.addEventListener("input",e=>{const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;if(s==="inventory"||s==="manual"||(s==="product"&&f==="category"))renderCategorySummary()});
document.addEventListener("change",e=>{const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;if(s==="inventory"||s==="manual"||(s==="product"&&f==="category"))renderCategorySummary()});

// Kategórie len zobrazíme v novej sade; staré produkty ani ich dáta pri načítaní neukladáme/neprepisujeme.
updateCategoryPanelLabels();
renderProducts();
renderCategorySummary();

// Načítaj manuálny diagnostický nástroj Obnova dát.
(function loadRecoveryTool(){
  if(document.getElementById('manualRecoveryScript'))return;
  const s=document.createElement('script');
  s.id='manualRecoveryScript';
  s.src='recovery.js?v=20';
  document.body.appendChild(s);
})();
