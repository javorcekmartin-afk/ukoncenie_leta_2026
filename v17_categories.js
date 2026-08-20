// v21 – bezpečné kategórie + manuálna obnova dát + skutočný predaj/zisk po produktoch.

const _safeOriginalSave=save;
save=function(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){
      localStorage.setItem("kostoliste_stanok_backup_"+Date.now(),raw);
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

numericFields.add("actualSoldQty");
function actualProductStats(p){const qty=n(p.actualSoldQty),calc=productCalc(p),revenue=qty*n(p.salePrice),profit=qty*calc.profit;return {qty,revenue,unitProfit:calc.profit,profit}}
function addActualColumnsToProducts(){
  const table=document.querySelector('#tab-products table');if(!table)return;const head=table.querySelector('thead tr');
  if(head&&!head.querySelector('[data-real-sales-head]')){const q=document.createElement('th');q.dataset.realSalesHead='qty';q.textContent='Skutočne predané ks';const p=document.createElement('th');p.dataset.realSalesHead='profit';p.textContent='Reálny zisk';head.insertBefore(p,head.lastElementChild);head.insertBefore(q,p)}
  table.querySelectorAll('tbody tr').forEach(tr=>{if(tr.querySelector('[data-real-sales-cell]'))return;const id=tr.querySelector('[data-scope="product"]')?.dataset.id,p=state.products.find(x=>x.id===id);if(!p)return;const st=actualProductStats(p);const q=document.createElement('td');q.dataset.realSalesCell='qty';q.innerHTML=field('product',p.id,'actualSoldQty',p.actualSoldQty??'','num');const z=document.createElement('td');z.dataset.realSalesCell='profit';z.className=`calc ${st.profit>=0?'good':'bad'}`;z.textContent=String(p.actualSoldQty??'').trim()===''?'—':eur.format(st.profit);tr.insertBefore(z,tr.lastElementChild);tr.insertBefore(q,z)})
}
function renderActualProfitSummary(){
  const tab=document.getElementById('tab-shops');if(!tab)return;let panel=document.getElementById('actualProfitPanel');if(!panel){panel=document.createElement('div');panel.id='actualProfitPanel';panel.className='panel box';panel.style.marginTop='12px';const category=document.querySelector('.category-panel');if(category)tab.insertBefore(panel,category);else tab.appendChild(panel)}
  const filled=state.products.map(p=>({p,...actualProductStats(p)})).filter(r=>String(r.p.actualSoldQty??'').trim()!=='');
  const totalQty=filled.reduce((s,r)=>s+r.qty,0),totalRevenue=filled.reduce((s,r)=>s+r.revenue,0),totalProfit=filled.reduce((s,r)=>s+r.profit,0);
  panel.innerHTML=`<h2>Skutočný predaj a zisk podľa produktov</h2><p class="category-note">Reálny zisk produktu = skutočne predané ks × zisk na ks. Tento prehľad nemení finálny finančný výsledok akcie.</p>${filled.length?`<div class="tablewrap" style="max-height:none;margin-top:10px"><table style="min-width:900px"><thead><tr><th>Produkt</th><th>Kategória</th><th>Skutočne predané ks</th><th>Predajná cena</th><th>Zisk / ks</th><th>Skutočná tržba produktu</th><th>Reálny zisk</th></tr></thead><tbody>${filled.map(r=>`<tr><td><strong>${esc(r.p.name)}</strong></td><td>${esc(normalizeProductCategory(r.p.category))}</td><td class="calc">${num.format(r.qty)}</td><td class="calc">${eur.format(n(r.p.salePrice))}</td><td class="calc">${eur.format(r.unitProfit)}</td><td class="calc">${eur.format(r.revenue)}</td><td class="calc ${r.profit>=0?'good':'bad'}"><strong>${eur.format(r.profit)}</strong></td></tr>`).join('')}<tr class="total-line"><td><strong>Spolu</strong></td><td></td><td class="calc"><strong>${num.format(totalQty)}</strong></td><td></td><td></td><td class="calc"><strong>${eur.format(totalRevenue)}</strong></td><td class="calc"><strong>${eur.format(totalProfit)}</strong></td></tr></tbody></table></div>`:`<div class="empty" style="margin-top:10px">Vyplň pri produktoch „Skutočne predané ks“ a zobrazí sa reálny zisk po produktoch.</div>`}`;
}

const _renderProductsV21=renderProducts;renderProducts=function(){_renderProductsV21();addActualColumnsToProducts()};
const _renderShopsCategories=renderShops;renderShops=function(){_renderShopsCategories();updateCategoryPanelLabels();renderCategorySummary();renderActualProfitSummary()};
document.addEventListener("input",e=>{const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;if(s==="inventory"||s==="manual"||(s==="product"&&f==="category"))renderCategorySummary();if(s==="product"&&f==="actualSoldQty"){const tr=e.target.closest('tr'),p=state.products.find(x=>x.id===e.target.dataset.id),cell=tr?.querySelector('[data-real-sales-cell="profit"]');if(p&&cell){const st=actualProductStats(p);cell.textContent=eur.format(st.profit);cell.className=`calc ${st.profit>=0?'good':'bad'}`}renderActualProfitSummary()}});
document.addEventListener("change",e=>{const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;if(s==="inventory"||s==="manual"||(s==="product"&&f==="category"))renderCategorySummary();if(s==="product"&&f==="actualSoldQty")renderActualProfitSummary()});

updateCategoryPanelLabels();renderProducts();renderCategorySummary();renderActualProfitSummary();
(function loadRecoveryTool(){if(document.getElementById('manualRecoveryScript'))return;const s=document.createElement('script');s.id='manualRecoveryScript';s.src='recovery.js?v=24';document.body.appendChild(s)})();
(function loadV24Products(){if(document.getElementById('v22ProductScript'))return;const s=document.createElement('script');s.id='v22ProductScript';s.src='v22_products.js?v=24';s.onload=()=>{document.title='Stánok v24';const pill=document.querySelector('.top .pill');if(pill)pill.textContent='v24'};document.body.appendChild(s)})();
