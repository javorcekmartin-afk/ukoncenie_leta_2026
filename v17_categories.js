// v19 – recovery + bezpečné zálohy + skutočný prehľad kategórií.

(function recoverLocalState(){
  try{
    const currentKey=typeof KEY!=="undefined"?KEY:"kostoliste_stanok_v15";
    const currentRaw=localStorage.getItem(currentKey);
    if(currentRaw)localStorage.setItem("kostoliste_stanok_emergency_"+Date.now(),currentRaw);

    const keys=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k&&k.startsWith("kostoliste_stanok_")&&!k.includes("emergency"))keys.push(k);
    }
    const candidates=[];
    for(const k of keys){
      try{
        const raw=localStorage.getItem(k);if(!raw)continue;
        const parsed=JSON.parse(raw);
        if(!parsed||!Array.isArray(parsed.products))continue;
        candidates.push({key:k,raw,parsed,score:(parsed.products?.length||0)*1000+(parsed.items?.length||0)*10+(parsed.manualInventory?.length||0)});
      }catch(e){}
    }
    if(!candidates.length)return;
    candidates.sort((a,b)=>b.score-a.score);
    const best=candidates[0];
    const current=candidates.find(x=>x.key===currentKey);
    if(best&&(!current||best.score>current.score)){
      state=normalize(migrateOld(best.parsed));
      localStorage.setItem(currentKey,JSON.stringify(state));
      window.__recoveredFrom=best.key;
    }
  }catch(e){}
})();

// Každé ďalšie uloženie najprv vytvorí rotačnú lokálnu zálohu.
const _safeOriginalSave=save;
save=function(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){
      const stamp=Date.now();
      localStorage.setItem("kostoliste_stanok_backup_"+stamp,raw);
      const backups=[];
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);if(k&&k.startsWith("kostoliste_stanok_backup_"))backups.push(k);
      }
      backups.sort().reverse().slice(10).forEach(k=>localStorage.removeItem(k));
    }
  }catch(e){}
  _safeOriginalSave();
};

const RESULT_CATEGORIES=["Pivo","Víno","Nealko","Alko","Drinky","Iné"];
function normalizeProductCategory(cat){const c=String(cat||"").trim();if(c==="Destilát")return "Alko";if(c==="Mix drink")return "Drinky";if(RESULT_CATEGORIES.includes(c))return c;return "Iné"}
categorySelect=function(id,val){const current=normalizeProductCategory(val);return `<select data-scope="product" data-id="${id}" data-field="category">${RESULT_CATEGORIES.map(c=>`<option ${c===current?"selected":""}>${c}</option>`).join("")}</select>`};
function usedInRecipe(sourceId){return state.products.some(p=>p.mode==="recipe"&&(p.components||[]).some(c=>c.itemId===sourceId))}
function actualCategoryForInventoryRow(row){
  if(row.source==="product"){const p=state.products.find(x=>x.id===row.sourceId);if(!p)return "Iné";if(usedInRecipe(p.id))return "Drinky";return normalizeProductCategory(p.category)}
  if(row.source==="item"){const i=state.items.find(x=>x.id===row.sourceId);if(!i)return "Iné";if(i.kind==="Spotrebný materiál")return "Iné";if(usedInRecipe(i.id))return "Drinky";return "Iné"}
  return "Iné";
}
function actualCategorySummary(){
  const groups=Object.fromEntries(RESULT_CATEGORIES.map(category=>[category,{category,cost:0,names:[]}]))
  inventoryRows().forEach(row=>{const c=invCalc(row);if(c.realCost<=0)return;const g=groups[actualCategoryForInventoryRow(row)]||groups.Iné;g.cost+=c.realCost;g.names.push(row.name)});
  const total=Object.values(groups).reduce((s,g)=>s+g.cost,0);
  return RESULT_CATEGORIES.map(category=>({...groups[category],share:total>0?groups[category].cost/total*100:0,total}));
}
function renderCategorySummary(){
  const host=document.getElementById("categorySummary");if(!host)return;const rows=actualCategorySummary();const total=rows.reduce((s,g)=>s+g.cost,0);
  host.innerHTML=`<div class="tablewrap" style="max-height:none;margin-top:0"><table style="min-width:720px"><thead><tr><th>Kategória</th><th>Reálny náklad</th><th>Podiel na náklade tovaru</th><th>Položky</th></tr></thead><tbody>${rows.map(g=>`<tr><td><strong>${esc(g.category)}</strong></td><td class="calc">${eur.format(g.cost)}</td><td class="calc">${num.format(g.share)} %</td><td class="mini">${g.names.length?esc([...new Set(g.names)].join(", ")):"—"}</td></tr>`).join("")}<tr class="total-line"><td><strong>Spolu</strong></td><td class="calc"><strong>${eur.format(total)}</strong></td><td class="calc"><strong>${total>0?"100 %":"0 %"}</strong></td><td></td></tr></tbody></table></div>`;
}
function updateCategoryPanelLabels(){const panel=document.querySelector(".category-panel");if(!panel)return;const h2=panel.querySelector("h2"),note=panel.querySelector(".category-note");if(h2)h2.textContent="Skutočný náklad podľa kategórií";if(note)note.textContent="Počíta sa automaticky zo skutočne minutých / otvorených balení v inventúre. Produkty a suroviny použité v receptúrach sa zaradia do Drinky; spotrebný materiál ide do Iné."}
const _renderShopsCategories=renderShops;renderShops=function(){_renderShopsCategories();updateCategoryPanelLabels();renderCategorySummary()};
document.addEventListener("input",e=>{const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;if(s==="inventory"||s==="manual"||(s==="product"&&f==="category"))renderCategorySummary()});
document.addEventListener("change",e=>{const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;if(s==="inventory"||s==="manual"||(s==="product"&&f==="category"))renderCategorySummary()});
state.products.forEach(p=>p.category=normalizeProductCategory(p.category));
save();
updateCategoryPanelLabels();renderProducts();renderCategorySummary();

if(window.__recoveredFrom){
  setTimeout(()=>{
    const top=document.querySelector('.top');if(!top)return;
    const msg=document.createElement('div');msg.className='hint';msg.style.margin='0 0 12px';msg.innerHTML=`<strong>Dáta boli obnovené</strong> zo staršej lokálnej verzie (${esc(window.__recoveredFrom)}).`;
    top.insertAdjacentElement('afterend',msg);
  },0);
}
