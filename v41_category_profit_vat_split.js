// v41 – zisk po kategóriách podľa finálneho skutočného predaja + kontrolný rozpad eKasa/ostatná tržba.
(function(){
  if(window.__V41_CATEGORY_PROFIT_VAT_SPLIT__)return;window.__V41_CATEGORY_PROFIT_VAT_SPLIT__=true;

  if(state.meta.ekasaRevenueGross===undefined||state.meta.ekasaRevenueGross===null||state.meta.ekasaRevenueGross===''){
    // Bezpečný default: celá skutočná tržba je zahrnutá do DPH výpočtu.
    const t=totals();
    state.meta.ekasaRevenueGross=t.revenueFilled?n(t.actualRevenue):0;
  }

  function actualCategoryProfitRows(){
    const cats=Array.isArray(window.RESULT_CATEGORIES)?window.RESULT_CATEGORIES:RESULT_CATEGORIES;
    const groups=Object.fromEntries(cats.map(category=>[category,{category,revenue:0,cost:0,profit:0,names:[],count:0}]));
    state.products.forEach(p=>{
      if(String(p.actualSoldPackages??'').trim()==='')return;
      let st=null;
      if(typeof window.realProductStats==='function')st=window.realProductStats(p);
      else if(typeof window.productActualPackageStats==='function'){
        const x=window.productActualPackageStats(p);st={revenue:n(x.revenue),goodsCost:Math.max(0,n(x.revenue)-n(x.profit)),profit:n(x.profit)};
      }
      if(!st)return;
      const cat=typeof normalizeProductCategory==='function'?normalizeProductCategory(p.category):(p.category||'Iné');
      const g=groups[cat]||groups['Iné'];if(!g)return;
      g.revenue+=n(st.revenue);g.cost+=n(st.goodsCost);g.names.push(p.name);g.count++;
    });
    cats.forEach(cat=>groups[cat].profit=groups[cat].revenue-groups[cat].cost);
    return cats.map(cat=>groups[cat]);
  }

  renderCategorySummary=function(){
    const host=document.getElementById('categorySummary');if(!host)return;
    const rows=actualCategoryProfitRows();
    const revenue=rows.reduce((s,g)=>s+g.revenue,0),cost=rows.reduce((s,g)=>s+g.cost,0),profit=revenue-cost;
    host.innerHTML=`<div class="tablewrap" style="max-height:none;margin-top:0"><table style="min-width:900px"><thead><tr><th>Kategória</th><th>Skutočná tržba</th><th>Skutočný náklad</th><th>Skutočný zisk</th><th>Produkty s vyplnenou skutočnosťou</th></tr></thead><tbody>${rows.map(g=>`<tr><td><strong>${esc(g.category)}</strong></td><td class="calc">${eur.format(g.revenue)}</td><td class="calc">${eur.format(g.cost)}</td><td class="calc ${g.profit>=0?'good':'bad'}"><strong>${eur.format(g.profit)}</strong></td><td class="mini">${g.names.length?esc([...new Set(g.names)].join(', ')):'—'}</td></tr>`).join('')}<tr class="total-line"><td><strong>Spolu</strong></td><td class="calc"><strong>${eur.format(revenue)}</strong></td><td class="calc"><strong>${eur.format(cost)}</strong></td><td class="calc ${profit>=0?'good':'bad'}"><strong>${eur.format(profit)}</strong></td><td></td></tr></tbody></table></div>`;
    const panel=document.querySelector('.category-panel');
    if(panel){
      const h=panel.querySelector('h2'),p=panel.querySelector('.category-note');
      if(h)h.textContent='Skutočný výsledok podľa kategórií';
      if(p)p.textContent='Počíta sa iba z produktov, pri ktorých je vyplnené finálne skutočne predané množstvo. Nevyplnené receptové drinky sa do tržby ani zisku kategórie nezapočítajú.';
    }
  };

  function splitGross(gross,rate){
    const g=Math.max(0,n(gross)),r=Math.max(0,n(rate))/100;
    const net=r>0?g/(1+r):g;return {gross:g,net,vat:g-net};
  }

  function renderVatControlSplit(){
    const panel=document.getElementById('vatSummaryPanel');if(!panel)return;
    const t=totals(),rate=Math.max(0,n(state.meta.vatRate??23));
    const totalGross=t.revenueFilled?Math.max(0,n(t.actualRevenue)):0;
    let ekasa=Math.max(0,n(state.meta.ekasaRevenueGross));
    if(ekasa>totalGross&&t.revenueFilled)ekasa=totalGross;
    const other=t.revenueFilled?Math.max(0,totalGross-ekasa):0;
    const terminal=Math.max(0,n(state.meta.terminalRevenue));
    const e=splitGross(ekasa,rate),o=splitGross(other,rate);

    let box=document.getElementById('vatControlSplit');
    if(!box){box=document.createElement('div');box.id='vatControlSplit';box.className='vat-control-split';panel.appendChild(box)}
    box.innerHTML=`
      <h3 style="margin:16px 0 6px">Kontrolný rozpad tržby</h3>
      <p class="category-note" style="margin-bottom:10px">Rozdelenie slúži na kontrolu eKasa evidencie. Neevidovaná tržba nie je automaticky oslobodená od DPH.</p>
      <div class="vat-summary-grid">
        <div class="vat-block">
          <h3>Evidovaná / eKasa tržba</h3>
          <div class="vat-row"><span>Tržba s DPH</span><strong><input id="ekasaRevenueGrossInput" type="text" inputmode="decimal" value="${esc(inputNum(ekasa))}" style="width:105px;text-align:right"> €</strong></div>
          <div class="vat-row"><span>Tržba bez DPH</span><strong>${eur.format(e.net)}</strong></div>
          <div class="vat-row"><span>DPH na výstupe</span><strong>${eur.format(e.vat)}</strong></div>
          <div class="vat-detail"><span>Tržba cez terminál – kontrola</span><span>${eur.format(terminal)}</span></div>
          <div class="vat-detail"><span>Rozdiel eKasa − terminál</span><span>${eur.format(ekasa-terminal)}</span></div>
        </div>
        <div class="vat-block">
          <h3>Ostatná tržba na kontrolu</h3>
          <div class="vat-row"><span>Rozdiel do celkovej tržby</span><strong>${eur.format(other)}</strong></div>
          <div class="vat-row"><span>Základ pri rovnakej sadzbe</span><strong>${eur.format(o.net)}</strong></div>
          <div class="vat-row"><span>DPH pri rovnakej sadzbe</span><strong>${eur.format(o.vat)}</strong></div>
          <div class="hint" style="margin-top:8px">Táto časť je kontrolná. Ak ide o zdaniteľnú tržbu, DPH sa rieši bez ohľadu na to, či bol predaj zaevidovaný v eKasa.</div>
        </div>
      </div>`;
  }

  const prevRenderShops=renderShops;
  renderShops=function(){prevRenderShops();renderCategorySummary();renderVatControlSplit()};

  document.addEventListener('input',e=>{
    if(e.target?.id==='ekasaRevenueGrossInput'){
      state.meta.ekasaRevenueGross=Math.max(0,n(e.target.value));save();renderVatControlSplit();
    }
  });
  document.addEventListener('change',e=>{
    if(e.target?.id==='ekasaRevenueGrossInput'){
      state.meta.ekasaRevenueGross=Math.max(0,n(e.target.value));save();renderVatControlSplit();
    }
  });

  const style=document.createElement('style');style.textContent=`#tab-shops .vat-control-split{margin-top:12px;padding-top:2px;border-top:1px solid #e6eaf0}`;document.head.appendChild(style);
  renderCategorySummary();renderVatControlSplit();save();
})();
