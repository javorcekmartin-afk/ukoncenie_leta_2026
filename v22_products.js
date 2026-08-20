// v26 – produktový plán a skutočnosť podľa celých balení.
(function(){
  numericFields.add('sortOrder');
  numericFields.add('plannedSalePackages');
  numericFields.add('actualSoldPackages');

  function productUnit(p){return String(p.unit||'L').toLowerCase()==='ks'?'ks':'L'}
  function unitSelectForProduct(p){const u=productUnit(p);return `<select class="amount-unit" data-scope="product" data-id="${p.id}" data-field="unit"><option value="L" ${u==='L'?'selected':''}>l</option><option value="ks" ${u==='ks'?'selected':''}>ks</option></select>`}
  function amountField(p,key){return `<div class="amount-unit-wrap">${field('product',p.id,key,p[key],'num')}${unitSelectForProduct(p)}</div>`}
  function servingsPerSalePackage(p){return p.mode==='simple'&&n(p.saleAmount)>0?Math.max(0,n(p.packageAmount)/n(p.saleAmount)):1}
  function plannedSalePackages(p){
    if(String(p.plannedSalePackages??'').trim()!=='')return Math.max(0,n(p.plannedSalePackages));
    const servings=servingsPerSalePackage(p);
    return servings>0?Math.max(0,n(p.plannedQty)/servings):0;
  }
  function plannedPortions(p){return plannedSalePackages(p)*servingsPerSalePackage(p)}
  function actualPackageStats(p){
    const calc=productCalc(p),packages=Math.max(0,n(p.actualSoldPackages)),servings=servingsPerSalePackage(p),portions=packages*servings;
    return {packages,servings,portions,revenue:portions*n(p.salePrice),unitProfit:calc.profit,profit:portions*calc.profit};
  }
  window.productPlannedSalePackages=plannedSalePackages;
  window.productPlannedPortions=plannedPortions;
  window.productActualPackageStats=actualPackageStats;

  // Plánované balenia sú zdroj pravdy. Staré plannedQty ostáva iba kvôli spätnej kompatibilite.
  productRecipeDemand=function(productId){
    let total=0;
    state.products.forEach(p=>{
      if(p.id===productId)return;
      (p.components||[]).forEach(c=>{if(c.itemId===productId)total+=n(c.amount)*plannedPortions(p)});
    });
    return total;
  };
  itemDemand=function(id){
    let total=0;
    state.products.forEach(p=>(p.components||[]).forEach(c=>{if(c.itemId===id)total+=n(c.amount)*plannedPortions(p)}));
    return total;
  };
  productCalc=function(p){
    const b=baseCost(p),comp=componentsCost(p),cost=b+comp,profit=n(p.salePrice)-cost;
    const servings=servingsPerSalePackage(p);
    const directNeed=p.mode==='simple'?plannedPortions(p)*n(p.saleAmount):0;
    const recipeNeed=p.mode==='simple'?productRecipeDemand(p.id):0;
    const totalNeed=directNeed+recipeNeed;
    const suggested=p.mode==='simple'&&n(p.packageAmount)>0?Math.ceil(totalNeed/n(p.packageAmount)):0;
    const planned=n(p.plannedPackages)||suggested;
    return {base:b,components:comp,cost,profit,markup:cost>0?profit/cost*100:0,recommended:roundUp(cost*(1+n(state.meta.targetMarkup)/100),.1),servingsPerPackage:servings,suggestedPackages:suggested,plannedPackages:planned,capacity:servings*planned,directNeed,recipeNeed,totalNeed};
  };

  // Dashboard plán sa tiež počíta z plánovaných balení, nie zo starého poľa plannedQty.
  totals=function(){
    let planRevenue=0,planCost=0;
    state.products.forEach(p=>{const portions=plannedPortions(p),calc=productCalc(p);planRevenue+=n(p.salePrice)*portions;planCost+=calc.cost*portions});
    let planPurchase=0,actualPurchase=0;
    inventoryRows().forEach(r=>{const c=invCalc(r);planPurchase+=c.planPurchase;actualPurchase+=c.realCost});
    let suppActual=0;state.supplementalCosts.forEach(c=>suppActual+=suppCalc(c).actual);
    const rev=revenueCalc(),planResult=planRevenue-planCost,totalActualCosts=actualPurchase+suppActual,actualResult=rev.filled?rev.total-totalActualCosts:null;
    return {planRevenue,planCost,planPurchase,planResult,actualRevenue:rev.total,actualPurchase,suppActual,totalActualCosts,actualResult,revenueFilled:rev.filled,rev};
  };

  // Nahradí starú analytiku „predané ks“ za balenia × porcie v balení.
  actualProductStats=function(p){return actualPackageStats(p)};
  renderActualProfitSummary=function(){
    const tab=document.getElementById('tab-shops');if(!tab)return;
    let panel=document.getElementById('actualProfitPanel');
    if(!panel){panel=document.createElement('div');panel.id='actualProfitPanel';panel.className='panel box';panel.style.marginTop='12px';const category=document.querySelector('.category-panel');if(category)tab.insertBefore(panel,category);else tab.appendChild(panel)}
    const filled=state.products.map(p=>({p,...actualPackageStats(p)})).filter(r=>String(r.p.actualSoldPackages??'').trim()!=='');
    const totalPackages=filled.reduce((s,r)=>s+r.packages,0),totalPortions=filled.reduce((s,r)=>s+r.portions,0),totalRevenue=filled.reduce((s,r)=>s+r.revenue,0),totalProfit=filled.reduce((s,r)=>s+r.profit,0);
    panel.innerHTML=`<h2>Skutočný predaj a zisk podľa produktov</h2><p class="category-note">Reálny zisk = skutočne predané balenia × porcií v balení × zisk na porciu. Pri drinkoch z receptúry sa 1 balenie rovná 1 drinku.</p>${filled.length?`<div class="tablewrap" style="max-height:none;margin-top:10px"><table style="min-width:980px"><thead><tr><th>Produkt</th><th>Kategória</th><th>Predané balenia</th><th>Porcií / balenie</th><th>Predané porcie</th><th>Zisk / porcia</th><th>Skutočná tržba</th><th>Reálny zisk</th></tr></thead><tbody>${filled.map(r=>`<tr><td><strong>${esc(r.p.name)}</strong></td><td>${esc(normalizeProductCategory(r.p.category))}</td><td class="calc">${num.format(r.packages)}</td><td class="calc">${num.format(r.servings)}</td><td class="calc">${num.format(r.portions)}</td><td class="calc">${eur.format(r.unitProfit)}</td><td class="calc">${eur.format(r.revenue)}</td><td class="calc ${r.profit>=0?'good':'bad'}"><strong>${eur.format(r.profit)}</strong></td></tr>`).join('')}<tr class="total-line"><td><strong>Spolu</strong></td><td></td><td class="calc"><strong>${num.format(totalPackages)}</strong></td><td></td><td class="calc"><strong>${num.format(totalPortions)}</strong></td><td></td><td class="calc"><strong>${eur.format(totalRevenue)}</strong></td><td class="calc"><strong>${eur.format(totalProfit)}</strong></td></tr></tbody></table></div>`:`<div class="empty" style="margin-top:10px">Vyplň pri produktoch „Skutočne predané balenia“ a zobrazí sa reálny zisk.</div>`}`;
  };

  function economicsCell(p,c){
    const servings=servingsPerSalePackage(p);
    return `<div class="stacked-metrics"><div><span>Náklad / porcia</span><strong>${eur.format(c.cost)}</strong></div><div><span>Zisk / porcia</span><strong class="${c.profit>=0?'good':'bad'}">${eur.format(c.profit)}</strong></div><div><span>Porcií / balenie</span><strong>${num.format(servings)}</strong></div><div><span>Zisk / balenie</span><strong class="${c.profit>=0?'good':'bad'}">${eur.format(c.profit*servings)}</strong></div><div><span>Prirážka</span><strong>${pct0.format(c.markup)} %</strong></div></div>`;
  }
  function planPurchaseCell(p,c){
    if(p.mode!=='simple')return `<span class="mini">podľa receptúry</span>`;
    const shortage=c.plannedPackages<c.suggestedPackages;
    return `<div class="plan-purchase-cell"><div class="mini">Minimum: <strong>${num.format(c.suggestedPackages)}</strong></div><div class="mini">Kúpiť balení:</div>${field('product',p.id,'plannedPackages',p.plannedPackages||c.suggestedPackages,'num')}${shortage?`<div class="mini bad">chýba ${num.format(c.suggestedPackages-c.plannedPackages)}</div>`:''}</div>`;
  }
  function displayedOrder(p){const idx=state.products.findIndex(x=>x.id===p.id),stored=n(p.sortOrder);return stored>0?stored:idx+1}
  function orderedProducts(){return state.products.map((p,idx)=>({p,idx,order:n(p.sortOrder)>0?n(p.sortOrder):idx+1})).sort((a,b)=>a.order-b.order||a.idx-b.idx).map(x=>x.p)}
  function renumberProducts(){state.products.forEach((p,idx)=>p.sortOrder=idx+1)}

  renderProducts=function(){
    const q=productQuery.toLowerCase(),rows=orderedProducts().filter(p=>!q||(p.name||'').toLowerCase().includes(q));
    const table=document.querySelector('#tab-products table');
    if(table){table.style.minWidth='1840px';table.querySelector('thead').innerHTML=`<tr class="product-group-head"><th colspan="5">PRODUKT</th><th colspan="2">PREDAJ</th><th colspan="2">NÁKUP</th><th>EKONOMIKA</th><th colspan="2">PLÁN</th><th colspan="2">SKUTOČNOSŤ</th><th>RECEPT</th><th></th></tr><tr><th>Poradie</th><th>Produkt</th><th>Kategória</th><th>Typ</th><th>Obchod</th><th>Predávané množstvo</th><th>Predajná cena</th><th>Nákupné balenie</th><th>Cena balenia</th><th>Prehľad</th><th>Plán predaja balení</th><th>Plán nákupu</th><th>Skutočne predané balenia</th><th>Reálny zisk</th><th>Recept / doplnky</th><th>Akcie</th></tr>`}
    productBody.innerHTML=rows.map(p=>{
      const c=productCalc(p),comp=(p.components||[]).map(x=>{const i=item(x.itemId);return i?`${i.name}: ${num.format(n(x.amount))} ${i.unit}`:''}).filter(Boolean).join(' + '),actual=actualPackageStats(p),hasActual=String(p.actualSoldPackages??'').trim()!=='';
      const planPackages=plannedSalePackages(p),planPortions=plannedPortions(p);
      return `<tr><td class="order-cell">${field('product',p.id,'sortOrder',displayedOrder(p),'num','order-input','min="1"')}</td><td>${field('product',p.id,'name',p.name,'text','name')}</td><td>${categorySelect(p.id,p.category)}</td><td>${modeSelect(p)}</td><td>${p.mode==='simple'?supplierField('product',p.id,'supplier',p.supplier||''):'—'}</td><td>${amountField(p,'saleAmount')}</td><td>${moneyField('product',p.id,'salePrice',p.salePrice)}</td><td>${p.mode==='simple'?amountField(p,'packageAmount'):`<span class="mini">1 drink</span>`}</td><td>${p.mode==='simple'?moneyField('product',p.id,'packagePrice',p.packagePrice):`<span class="mini">cez receptúru</span>`}</td><td>${economicsCell(p,c)}</td><td>${field('product',p.id,'plannedSalePackages',planPackages,'num')}<div class="mini">= ${num.format(planPortions)} porcií</div></td><td>${planPurchaseCell(p,c)}</td><td>${field('product',p.id,'actualSoldPackages',p.actualSoldPackages??'','num')}<div class="mini">${hasActual?`= ${num.format(actual.portions)} porcií`:p.mode==='recipe'?'1 = 1 drink':''}</div></td><td class="calc ${actual.profit>=0?'good':'bad'}" data-real-profit="${p.id}">${hasActual?`<strong>${eur.format(actual.profit)}</strong>`:'—'}</td><td><button class="small" data-action="recipe" data-id="${p.id}">${p.mode==='simple'?'Doplnky':'Receptúra'}</button><div class="mini recipe-summary">${esc(comp||'bez položiek')}</div></td><td><button class="small danger" data-action="deleteProduct" data-id="${p.id}" title="Zmazať produkt">×</button></td></tr>`;
    }).join('');
    productEmpty.hidden=rows.length>0;
  };

  const style=document.createElement('style');style.textContent=`#tab-products .product-group-head th{font-size:10px;letter-spacing:.08em;color:#6c7587;background:#f7f9fc;text-align:center;border-bottom:1px solid #e4e9f1;padding:7px 8px}#tab-products .amount-unit-wrap{display:grid;grid-template-columns:minmax(68px,1fr) 58px;gap:5px;align-items:center;min-width:135px}#tab-products .amount-unit{min-width:54px}#tab-products .stacked-metrics{min-width:160px;display:grid;gap:3px;font-size:11px}#tab-products .stacked-metrics>div{display:flex;justify-content:space-between;gap:10px;white-space:nowrap}#tab-products .stacked-metrics span{color:#747d8e}#tab-products .plan-purchase-cell{min-width:125px;display:grid;gap:4px}#tab-products .recipe-summary{max-width:240px;white-space:normal;line-height:1.35;margin-top:4px}#tab-products td{vertical-align:top}#tab-products .order-cell{width:72px;min-width:72px}#tab-products .order-input{width:58px;text-align:center;font-weight:800}`;document.head.appendChild(style);

  document.addEventListener('input',e=>{
    if(e.target?.dataset?.scope==='product'&&e.target?.dataset?.field==='plannedSalePackages'){const p=state.products.find(x=>x.id===e.target.dataset.id);if(!p)return;p.plannedSalePackages=Math.max(0,n(e.target.value));p.plannedQty=plannedPortions(p);save();updateSummary();renderShops()}
    if(e.target?.dataset?.scope==='product'&&e.target?.dataset?.field==='actualSoldPackages'){const p=state.products.find(x=>x.id===e.target.dataset.id);if(!p)return;const st=actualPackageStats(p),cell=e.target.closest('tr')?.querySelector('[data-real-profit]');if(cell){cell.innerHTML=`<strong>${eur.format(st.profit)}</strong>`;cell.className=`calc ${st.profit>=0?'good':'bad'}`}renderActualProfitSummary()}
  });
  document.addEventListener('change',e=>{
    if(e.target?.dataset?.scope==='product'&&e.target?.dataset?.field==='unit')renderAll();
    if(e.target?.dataset?.scope==='product'&&e.target?.dataset?.field==='plannedSalePackages'){const p=state.products.find(x=>x.id===e.target.dataset.id);if(p){p.plannedSalePackages=Math.max(0,n(e.target.value));p.plannedQty=plannedPortions(p);save();renderAll()}}
    if(e.target?.dataset?.scope==='product'&&e.target?.dataset?.field==='actualSoldPackages'){save();renderAll()}
    if(e.target?.dataset?.scope==='product'&&e.target?.dataset?.field==='sortOrder'){const id=e.target.dataset.id,current=state.products.findIndex(p=>p.id===id);if(current<0)return;const wanted=Math.max(1,Math.min(state.products.length,Math.round(n(e.target.value)||current+1))),moved=state.products.splice(current,1)[0];state.products.splice(wanted-1,0,moved);renumberProducts();save();renderAll()}
  });

  renderProducts();renderActualProfitSummary();updateSummary();
})();
