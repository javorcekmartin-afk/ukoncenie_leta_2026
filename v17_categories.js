// v18 logika kategórií – skutočný stav podľa reálnej inventúry.
// Kategórie: Pivo, Víno, Nealko, Alko, Drinky, Iné.
// Ak sa jednoduchý produkt používa v receptúre, jeho reálny náklad ide automaticky do Drinky.
// Suroviny použité v receptúrach idú do Drinky; spotrebný materiál (poháre, slamky...) ide do Iné.

const RESULT_CATEGORIES=["Pivo","Víno","Nealko","Alko","Drinky","Iné"];

function normalizeProductCategory(cat){
  const c=String(cat||"").trim();
  if(c==="Destilát")return "Alko";
  if(c==="Mix drink")return "Drinky";
  if(RESULT_CATEGORIES.includes(c))return c;
  return "Iné";
}

// V záložke Produkty ponechávame iba kategórie, ktoré majú význam vo finálnom prehľade.
categorySelect=function(id,val){
  const current=normalizeProductCategory(val);
  return `<select data-scope="product" data-id="${id}" data-field="category">${RESULT_CATEGORIES.map(c=>`<option ${c===current?"selected":""}>${c}</option>`).join("")}</select>`;
};

function usedInRecipe(sourceId){
  return state.products.some(p=>p.mode==="recipe"&&(p.components||[]).some(c=>c.itemId===sourceId));
}

function actualCategoryForInventoryRow(row){
  if(row.source==="product"){
    const p=state.products.find(x=>x.id===row.sourceId);
    if(!p)return "Iné";
    // Čokoľvek, čo sa používa ako ingrediencia miešaného nápoja, dávame celé do Drinky.
    if(usedInRecipe(p.id))return "Drinky";
    return normalizeProductCategory(p.category);
  }

  if(row.source==="item"){
    const i=state.items.find(x=>x.id===row.sourceId);
    if(!i)return "Iné";
    // Poháre, slamky a ostatný spotrebný materiál nechceme miešať s nápojmi.
    if(i.kind==="Spotrebný materiál")return "Iné";
    // Surovina, ktorá vstupuje do receptúry, patrí do Drinky.
    if(usedInRecipe(i.id))return "Drinky";
    return "Iné";
  }

  // Manuálne inventúrne položky nemajú produktovú kategóriu.
  return "Iné";
}

function actualCategorySummary(){
  const groups=Object.fromEntries(RESULT_CATEGORIES.map(category=>[category,{category,cost:0,rows:0,packages:0,names:[]}]))
  inventoryRows().forEach(row=>{
    const c=invCalc(row);
    if(c.realCost<=0)return;
    const category=actualCategoryForInventoryRow(row);
    const g=groups[category]||groups["Iné"];
    g.cost+=c.realCost;
    g.rows+=1;
    g.packages+=c.actual;
    g.names.push(row.name);
  });
  const total=Object.values(groups).reduce((s,g)=>s+g.cost,0);
  return RESULT_CATEGORIES.map(category=>({...groups[category],share:total>0?groups[category].cost/total*100:0,total}));
}

function renderCategorySummary(){
  const host=document.getElementById("categorySummary");
  if(!host)return;
  const rows=actualCategorySummary();
  const total=rows.reduce((s,g)=>s+g.cost,0);

  host.innerHTML=`<div class="tablewrap" style="max-height:none;margin-top:0"><table style="min-width:720px">
    <thead><tr><th>Kategória</th><th>Reálny náklad</th><th>Podiel na náklade tovaru</th><th>Položky</th></tr></thead>
    <tbody>${rows.map(g=>`<tr>
      <td><strong>${esc(g.category)}</strong></td>
      <td class="calc">${eur.format(g.cost)}</td>
      <td class="calc">${num.format(g.share)} %</td>
      <td class="mini">${g.names.length?esc([...new Set(g.names)].join(", ")):"—"}</td>
    </tr>`).join("")}
    <tr class="total-line"><td><strong>Spolu</strong></td><td class="calc"><strong>${eur.format(total)}</strong></td><td class="calc"><strong>${total>0?"100 %":"0 %"}</strong></td><td></td></tr>
    </tbody>
  </table></div>`;
}

function updateCategoryPanelLabels(){
  const panel=document.querySelector(".category-panel");
  if(!panel)return;
  const h2=panel.querySelector("h2");
  const note=panel.querySelector(".category-note");
  if(h2)h2.textContent="Skutočný náklad podľa kategórií";
  if(note)note.textContent="Počíta sa automaticky zo skutočne minutých / otvorených balení v inventúre. Produkty a suroviny použité v receptúrach sa zaradia do Drinky; spotrebný materiál ide do Iné.";
}

const _renderShopsCategories=renderShops;
renderShops=function(){
  _renderShopsCategories();
  updateCategoryPanelLabels();
  renderCategorySummary();
};

// Ak sa zmení inventúra alebo kategória produktu, prehľad sa okamžite prepočíta.
document.addEventListener("input",e=>{
  const scope=e.target?.dataset?.scope;
  const fieldName=e.target?.dataset?.field;
  if(scope==="inventory"||scope==="manual"||(scope==="product"&&fieldName==="category"))renderCategorySummary();
});
document.addEventListener("change",e=>{
  const scope=e.target?.dataset?.scope;
  const fieldName=e.target?.dataset?.field;
  if(scope==="inventory"||scope==="manual"||(scope==="product"&&fieldName==="category"))renderCategorySummary();
});

// Preveď staré názvy kategórií bez mazania produktov.
state.products.forEach(p=>p.category=normalizeProductCategory(p.category));
save();
updateCategoryPanelLabels();
renderProducts();
renderCategorySummary();
