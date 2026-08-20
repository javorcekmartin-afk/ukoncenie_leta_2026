// v28 – inventúra prepojená so skutočným predajom a receptami.
// Predaj môže byť zadaný aj ako časť balenia (napr. 1,54 suda = 154 pív), ale inventúrny náklad sa účtuje na celé otvorené balenia.
(function(){
  const _baseInvCalcV28=invCalc;

  function actualPortionsForProduct(p){
    if(typeof window.productActualPackageStats==='function')return n(window.productActualPackageStats(p).portions);
    const calc=productCalc(p),packs=n(p.actualSoldPackages),servings=p.mode==='simple'?n(calc.servingsPerPackage):1;
    return packs*servings;
  }

  function actualItemDemand(itemId){
    let total=0;
    state.products.forEach(p=>{
      const portions=actualPortionsForProduct(p);if(portions<=0)return;
      (p.components||[]).forEach(c=>{if(c.itemId===itemId)total+=n(c.amount)*portions});
    });
    return total;
  }
  window.actualItemDemand=actualItemDemand;

  function wholePackages(amount){return amount>0?Math.ceil(amount-1e-9):0}
  function actualItemPackages(i){const demand=actualItemDemand(i.id);return n(i.packageAmount)>0&&demand>0?wholePackages(demand/n(i.packageAmount)):0}
  window.actualItemPackages=actualItemPackages;

  sourceInventoryRows=function(){
    const rows=[];
    state.products.forEach(p=>{
      if(p.mode==='simple'&&n(p.packageAmount)>0&&n(p.saleAmount)>0){const c=productCalc(p);rows.push({key:'product:'+p.id,source:'product',sourceId:p.id,name:p.name,supplier:p.supplier||'Bez obchodu',packageLabel:`${num.format(n(p.packageAmount))} ${p.unit||'L'}`,packagePrice:n(p.packagePrice),minimum:c.suggestedPackages,planned:c.plannedPackages,manual:false})}
    });
    state.items.forEach(i=>{
      const need=itemDemand(i.id),actualNeed=actualItemDemand(i.id);
      if(need>0||actualNeed>0)rows.push({key:'item:'+i.id,source:'item',sourceId:i.id,name:i.name,supplier:i.supplier||'Bez obchodu',packageLabel:`${num.format(n(i.packageAmount))} ${i.unit||'L'}`,packagePrice:n(i.packagePrice),minimum:itemSuggestedPackages(i),planned:itemPlannedPackages(i),manual:false});
    });
    return rows;
  };

  invCalc=function(row){
    if(row.source==='product'){
      const p=state.products.find(x=>x.id===row.sourceId);
      const sold=p&&String(p.actualSoldPackages??'').trim()!==''?Math.max(0,n(p.actualSoldPackages)):0;
      const actual=wholePackages(sold);
      const unitPrice=p?n(p.packagePrice):n(row.packagePrice);
      return {actual,sold,unitPrice,realCost:actual*unitPrice,planPurchase:n(row.planned)*n(row.packagePrice)};
    }
    if(row.source==='item'){
      const i=state.items.find(x=>x.id===row.sourceId),actual=i?actualItemPackages(i):0,unitPrice=i?n(i.packagePrice):n(row.packagePrice);
      return {actual,unitPrice,realCost:actual*unitPrice,planPurchase:n(row.planned)*n(row.packagePrice)};
    }
    return _baseInvCalcV28(row);
  };

  renderInventory=function(){
    const rows=inventoryRows();
    inventoryBody.innerHTML=rows.map(r=>{
      const v=invState(r),c=invCalc(r),supplier=rowSupplier(r);
      const nameCell=r.manual?field('manual',r.sourceId,'name',v.name||'','text','name'):`<strong>${esc(r.name)}</strong>`;
      const supplierCell=r.manual?supplierField('manual',r.sourceId,'supplier',v.supplier||''):supplierField('inventory',r.key,'supplierOverride',v.supplierOverride||supplier);
      const packageCell=r.manual?field('manual',r.sourceId,'packageLabel',v.packageLabel||'1 balenie'):esc(r.packageLabel);
      const planCell=r.manual?field('manual',r.sourceId,'plannedPackages',v.plannedPackages||0,'num'):r.planned;
      let actualCell='',priceCell='',noteCell='',actionCell='';

      if(r.source==='product'){
        const p=state.products.find(x=>x.id===r.sourceId),sold=p?Math.max(0,n(p.actualSoldPackages)):0;
        actualCell=`<div class="linked-value"><strong>${num.format(c.actual)}</strong><div class="mini">predaj ${num.format(sold)} bal. → ${num.format(c.actual)} otvorené bal.</div></div>`;
        priceCell=`<div class="linked-value"><strong>${eur.format(c.unitPrice)}</strong><div class="mini">zo záložky 1</div></div>`;
        noteCell=field('inventory',r.key,'note',v.note||'');
      }else if(r.source==='item'){
        const i=state.items.find(x=>x.id===r.sourceId),demand=i?actualItemDemand(i.id):0;
        actualCell=`<div class="linked-value"><strong>${num.format(c.actual)}</strong><div class="mini">spotreba ${num.format(demand)} ${esc(i?.unit||'')} → celé balenia</div></div>`;
        priceCell=`<div class="linked-value"><strong>${eur.format(c.unitPrice)}</strong><div class="mini">zo záložky 2</div></div>`;
        noteCell=field('inventory',r.key,'note',v.note||'');
      }else{
        actualCell=field('manual',r.sourceId,'actualPackages',v.actualPackages??'','num');
        priceCell=moneyField('manual',r.sourceId,'actualUnitPrice',v.actualUnitPrice??'');
        noteCell=field('manual',r.sourceId,'note',v.note||'');
        actionCell=`<button class="small danger" data-action="deleteManualInventory" data-id="${r.sourceId}">×</button>`;
      }

      return `<tr><td>${nameCell}</td><td>${supplierCell}</td><td>${packageCell}</td><td class="calc">${r.minimum||'—'}</td><td>${planCell}</td><td class="calc">${eur.format(c.planPurchase)}</td><td>${actualCell}</td><td>${priceCell}</td><td class="calc">${eur.format(c.realCost)}</td><td>${noteCell}</td><td>${actionCell}</td></tr>`;
    }).join('');
    inventoryEmpty.hidden=rows.length>0;
  };

  const style=document.createElement('style');style.textContent=`#tab-inventory .linked-value{padding:6px 4px;white-space:nowrap}#tab-inventory .linked-value strong{display:block}`;document.head.appendChild(style);

  function refreshActualInventory(){renderInventory();renderShops();updateSummary();if(typeof renderCategorySummary==='function')renderCategorySummary();if(typeof renderActualProfitSummary==='function')renderActualProfitSummary()}
  document.addEventListener('input',e=>{const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;if(s==='product'&&(f==='actualSoldPackages'||f==='packagePrice'||f==='saleAmount'||f==='packageAmount'))refreshActualInventory();if(s==='item'&&(f==='packagePrice'||f==='packageAmount'))refreshActualInventory();if(e.target?.dataset?.rfield==='amount')refreshActualInventory()});
  document.addEventListener('change',e=>{const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;if((s==='product'&&(f==='actualSoldPackages'||f==='packagePrice'||f==='saleAmount'||f==='packageAmount'||f==='unit'))||(s==='item'&&(f==='packagePrice'||f==='packageAmount'||f==='unit'))||e.target?.dataset?.rfield)refreshActualInventory()});

  const section=document.querySelector('#tab-inventory .sectionhead p');if(section)section.textContent='Produkty preberajú skutočný predaj zo záložky 1 a inventúra ho zaokrúhli na celé otvorené balenia. Suroviny a materiály sa automaticky vypočítajú zo skutočného predaja a receptov, zaokrúhlia nahor na celé balenia a cenu preberú zo záložky 2.';

  renderInventory();renderShops();updateSummary();if(typeof renderCategorySummary==='function')renderCategorySummary();
})();

(function loadV29UI(){
  if(document.getElementById('v29UiScript'))return;
  const s=document.createElement('script');
  s.id='v29UiScript';
  s.src='v29_ui.js?v=29';
  document.body.appendChild(s);
})();
