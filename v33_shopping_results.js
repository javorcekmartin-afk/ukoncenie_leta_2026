// v33 – jednotný nákupný zoznam podľa obchodov + reálny zisk z otvorených/minutých balení.
(function(){
  if(window.__V33_SHOP_RESULTS__)return;window.__V33_SHOP_RESULTS__=true;

  // Obchod zo zdrojovej záložky je jediný zdroj pravdy.
  rowSupplier=function(row){
    if(row.source==='product')return (state.products.find(p=>p.id===row.sourceId)?.supplier||'').trim()||'Bez obchodu';
    if(row.source==='item')return (state.items.find(i=>i.id===row.sourceId)?.supplier||'').trim()||'Bez obchodu';
    if(row.source==='manual')return (state.manualInventory.find(m=>m.id===row.sourceId)?.supplier||'').trim()||'Bez obchodu';
    return (row.supplier||'').trim()||'Bez obchodu';
  };

  const _suppliersV33=suppliers;
  suppliers=function(){
    const set=new Set(_suppliersV33());
    state.supplementalCosts.forEach(c=>{if((c.supplier||'').trim())set.add(c.supplier.trim())});
    return [...set].sort((a,b)=>a.localeCompare(b,'sk'));
  };

  function actualPortions(p){return typeof window.productActualPackageStats==='function'?n(window.productActualPackageStats(p).portions):0}
  function wholePackages(v){return v>0?Math.ceil(v-1e-9):0}

  function demandOfProductForSource(p,row){
    const portions=actualPortions(p);if(portions<=0)return 0;
    let demand=0;
    if(row.source==='product'&&p.id===row.sourceId&&p.mode==='simple')demand+=portions*n(p.saleAmount);
    (p.components||[]).forEach(c=>{if(c.itemId===row.sourceId)demand+=n(c.amount)*portions});
    return demand;
  }
  function totalDemandForSource(row){return state.products.reduce((s,p)=>s+demandOfProductForSource(p,row),0)}
  window.actualSourceDemand=totalDemandForSource;

  const _invCalcV33=invCalc;
  invCalc=function(row){
    if(row.source==='product'){
      const p=state.products.find(x=>x.id===row.sourceId),demand=totalDemandForSource(row),amount=p?n(p.packageAmount):0;
      const actual=amount>0?wholePackages(demand/amount):0,unitPrice=p?n(p.packagePrice):n(row.packagePrice);
      return {actual,demand,unitPrice,realCost:actual*unitPrice,planPurchase:n(row.planned)*n(row.packagePrice)};
    }
    if(row.source==='item'){
      const i=state.items.find(x=>x.id===row.sourceId),demand=totalDemandForSource(row),amount=i?n(i.packageAmount):0;
      const actual=amount>0?wholePackages(demand/amount):0,unitPrice=i?n(i.packagePrice):n(row.packagePrice);
      return {actual,demand,unitPrice,realCost:actual*unitPrice,planPurchase:n(row.planned)*n(row.packagePrice)};
    }
    return _invCalcV33(row);
  };

  function allocation(){
    const byProduct=Object.fromEntries(state.products.map(p=>[p.id,0]));let unallocated=0;
    inventoryRows().forEach(row=>{
      const c=invCalc(row);
      if(row.manual){unallocated+=c.realCost;return}
      const demands=state.products.map(p=>({id:p.id,d:demandOfProductForSource(p,row)})).filter(x=>x.d>0);
      const total=demands.reduce((s,x)=>s+x.d,0);
      if(total>0)demands.forEach(x=>byProduct[x.id]=(byProduct[x.id]||0)+c.realCost*x.d/total);
      else unallocated+=c.realCost;
    });
    return {byProduct,unallocated};
  }

  function realProductStats(p,alloc){
    const base=typeof window.productActualPackageStats==='function'?window.productActualPackageStats(p):{packages:0,portions:0,revenue:0};
    const revenue=n(base.revenue),goodsCost=n(alloc.byProduct[p.id]),profit=revenue-goodsCost;
    return {packages:n(base.packages),portions:n(base.portions),revenue,goodsCost,profit};
  }
  window.realProductStats=function(p){return realProductStats(p,allocation())};

  actualCategorySummary=function(){
    const alloc=allocation();
    const groups=Object.fromEntries(RESULT_CATEGORIES.map(category=>[category,{category,revenue:0,cost:0,profit:0,names:[]}]))
    state.products.forEach(p=>{
      const st=realProductStats(p,alloc);if(st.revenue===0&&st.goodsCost===0)return;
      const cat=normalizeProductCategory(p.category),g=groups[cat]||groups.Iné;
      g.revenue+=st.revenue;g.cost+=st.goodsCost;g.names.push(p.name);
    });
    if(alloc.unallocated>0){groups.Iné.cost+=alloc.unallocated;groups.Iné.names.push('Nepriradené / manuálne položky')}
    RESULT_CATEGORIES.forEach(cat=>groups[cat].profit=groups[cat].revenue-groups[cat].cost);
    return RESULT_CATEGORIES.map(cat=>groups[cat]);
  };

  renderCategorySummary=function(){
    const host=document.getElementById('categorySummary');if(!host)return;const rows=actualCategorySummary();
    const revenue=rows.reduce((s,g)=>s+g.revenue,0),cost=rows.reduce((s,g)=>s+g.cost,0),profit=revenue-cost;
    host.innerHTML=`<div class="tablewrap" style="max-height:none;margin-top:0"><table style="min-width:900px"><thead><tr><th>Kategória</th><th>Skutočná tržba</th><th>Skutočný náklad tovaru</th><th>Skutočný zisk</th><th>Produkty</th></tr></thead><tbody>${rows.map(g=>`<tr><td><strong>${esc(g.category)}</strong></td><td class="calc">${eur.format(g.revenue)}</td><td class="calc">${eur.format(g.cost)}</td><td class="calc ${g.profit>=0?'good':'bad'}"><strong>${eur.format(g.profit)}</strong></td><td class="mini">${g.names.length?esc([...new Set(g.names)].join(', ')):'—'}</td></tr>`).join('')}<tr class="total-line"><td><strong>Spolu</strong></td><td class="calc"><strong>${eur.format(revenue)}</strong></td><td class="calc"><strong>${eur.format(cost)}</strong></td><td class="calc ${profit>=0?'good':'bad'}"><strong>${eur.format(profit)}</strong></td><td></td></tr></tbody></table></div>`;
    const panel=document.querySelector('.category-panel');if(panel){const h=panel.querySelector('h2'),p=panel.querySelector('.category-note');if(h)h.textContent='Skutočná tržba, náklad a zisk podľa kategórií';if(p)p.textContent='Zisk = skutočná tržba − reálny náklad otvorených/minutých balení tovaru. Doplnkové náklady akcie sú vedené samostatne.'}
  };

  renderActualProfitSummary=function(){
    const tab=document.getElementById('tab-shops');if(!tab)return;let panel=document.getElementById('actualProfitPanel');
    if(!panel){panel=document.createElement('div');panel.id='actualProfitPanel';panel.className='panel box';panel.style.marginTop='12px';const category=document.querySelector('.category-panel');if(category)tab.insertBefore(panel,category);else tab.appendChild(panel)}
    const alloc=allocation(),rows=state.products.map(p=>({p,...realProductStats(p,alloc)})).filter(r=>String(r.p.actualSoldPackages??'').trim()!==''||r.goodsCost>0);
    const revenue=rows.reduce((s,r)=>s+r.revenue,0),cost=rows.reduce((s,r)=>s+r.goodsCost,0),profit=revenue-cost;
    panel.innerHTML=`<h2>Skutočný výsledok podľa produktov</h2><p class="category-note">Reálny náklad zahŕňa celé otvorené/minuté balenia. Náklad spoločných doplnkov a surovín sa medzi produkty rozdelí podľa ich skutočnej spotreby.</p>${rows.length?`<div class="tablewrap" style="max-height:none;margin-top:10px"><table style="min-width:960px"><thead><tr><th>Produkt</th><th>Kategória</th><th>Predané balenia</th><th>Predané porcie</th><th>Skutočná tržba</th><th>Reálny náklad tovaru</th><th>Reálny zisk</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${esc(r.p.name)}</strong></td><td>${esc(normalizeProductCategory(r.p.category))}</td><td class="calc">${num.format(r.packages)}</td><td class="calc">${num.format(r.portions)}</td><td class="calc">${eur.format(r.revenue)}</td><td class="calc">${eur.format(r.goodsCost)}</td><td class="calc ${r.profit>=0?'good':'bad'}"><strong>${eur.format(r.profit)}</strong></td></tr>`).join('')}<tr class="total-line"><td><strong>Spolu</strong></td><td></td><td></td><td></td><td class="calc"><strong>${eur.format(revenue)}</strong></td><td class="calc"><strong>${eur.format(cost)}</strong></td><td class="calc ${profit>=0?'good':'bad'}"><strong>${eur.format(profit)}</strong></td></tr></tbody></table></div>`:`<div class="empty" style="margin-top:10px">Po vyplnení skutočného predaja sa zobrazí reálny výsledok po produktoch.</div>`}`;
  };

  // Doplnkové náklady dostanú obchod.
  renderCosts=function(){
    costBody.innerHTML=state.supplementalCosts.map(c=>`<tr><td>${field('cost',c.id,'name',c.name,'text','name')}</td><td>${costCategory(c.id,c.category)}</td><td>${supplierField('cost',c.id,'supplier',c.supplier||'')}</td><td>${field('cost',c.id,'qty',c.qty,'num')}</td><td>${moneyField('cost',c.id,'unitPrice',c.unitPrice)}</td><td class="calc" data-cost-total>${eur.format(suppCalc(c).actual)}</td><td>${field('cost',c.id,'note',c.note||'')}</td><td><button class="small danger" data-action="deleteCost" data-id="${c.id}">×</button></td></tr>`).join('');
    costEmpty.hidden=state.supplementalCosts.length>0;
    const table=document.querySelector('#tab-costs table');if(table){table.style.minWidth='1120px';const hr=table.querySelector('thead tr');if(hr)hr.innerHTML='<th>Položka</th><th>Kategória</th><th>Obchod</th><th>Skutočné množstvo</th><th>Cena / jednotku</th><th>Skutočný náklad</th><th>Poznámka</th><th>Akcie</th>'}
  };
  addCost.onclick=()=>{state.supplementalCosts.push({id:uid(),name:'Nový náklad',category:'Ostatné',supplier:'',qty:1,unitPrice:0,note:''});save();renderAll()};

  shopSummary=function(){
    const groups={};
    function group(s){const supplier=(s||'').trim()||'Bez obchodu';return groups[supplier]||(groups[supplier]={supplier,rows:[],plan:0,actual:0})}
    inventoryRows().forEach(r=>{const c=invCalc(r),g=group(rowSupplier(r));g.rows.push({type:'Tovar',name:r.name,detail:r.packageLabel||'',planned:n(r.planned),planValue:c.planPurchase,actual:c.actual,actualValue:c.realCost});g.plan+=c.planPurchase;g.actual+=c.realCost});
    state.supplementalCosts.forEach(c=>{const g=group(c.supplier);const val=suppCalc(c).actual;g.rows.push({type:'Doplnkový náklad',name:c.name,detail:c.category||'',planned:null,planValue:0,actual:n(c.qty),actualValue:val});g.actual+=val});
    return Object.values(groups).sort((a,b)=>a.supplier.localeCompare(b.supplier,'sk'));
  };

  renderShops=function(){
    const groups=shopSummary();
    shopGroups.innerHTML=groups.length?groups.map(g=>`<div class="panel box shopbox"><div class="sectionhead" style="padding:0 0 10px"><div><h2>${esc(g.supplier)}</h2><p>Plán nákupu ${eur.format(g.plan)} · Skutočne ${eur.format(g.actual)}</p></div></div><div class="tablewrap" style="max-height:none"><table style="min-width:900px"><thead><tr><th>Typ</th><th>Položka</th><th>Balenie / kategória</th><th>Plán množstvo</th><th>Plán nákup</th><th>Skutočné množstvo</th><th>Skutočný náklad</th></tr></thead><tbody>${g.rows.map(r=>`<tr><td class="mini">${esc(r.type)}</td><td><strong>${esc(r.name)}</strong></td><td class="mini">${esc(r.detail||'—')}</td><td class="calc">${r.planned===null?'—':num.format(r.planned)}</td><td class="calc">${r.planValue?eur.format(r.planValue):'—'}</td><td class="calc">${num.format(r.actual)}</td><td class="calc">${eur.format(r.actualValue)}</td></tr>`).join('')}<tr class="total-line"><td colspan="4"><strong>Spolu ${esc(g.supplier)}</strong></td><td class="calc"><strong>${eur.format(g.plan)}</strong></td><td></td><td class="calc"><strong>${eur.format(g.actual)}</strong></td></tr></tbody></table></div></div>`).join(''):`<div class="panel empty">Zatiaľ nie sú nákupné položky.</div>`;
    renderActualProfitSummary();renderCategorySummary();
  };

  // V inventúre zobraz zdrojový obchod ako prepojenú hodnotu, nie starý override.
  function fixInventorySupplierCells(){
    document.querySelectorAll('#tab-inventory tbody tr').forEach(tr=>{
      const inp=tr.querySelector('input[data-scope="inventory"][data-field="supplierOverride"]');if(!inp)return;
      const key=inp.dataset.id,row=inventoryRows().find(r=>r.key===key);if(!row)return;
      inp.closest('td').innerHTML=`<div class="linked-value"><strong>${esc(rowSupplier(row))}</strong><div class="mini">zo zdrojovej záložky</div></div>`;
    });
  }
  const _renderInventoryV33=renderInventory;renderInventory=function(){_renderInventoryV33();fixInventorySupplierCells()};

  document.addEventListener('input',e=>{const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;if(s==='item'&&f==='supplier')renderShops();if(s==='product'&&f==='supplier')renderShops();if(s==='cost'&&(f==='supplier'||f==='qty'||f==='unitPrice'||f==='name'||f==='category'))renderShops()});
  document.addEventListener('change',e=>{const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;if((s==='item'||s==='product'||s==='cost')&&f==='supplier')renderAll()});

  state.supplementalCosts=state.supplementalCosts.map(c=>({...c,supplier:c.supplier||''}));
  renderAll();
})();
