// v42 – zisk po kategóriách bez dodatočného rozkladu DPH.
(function(){
  if(window.__V42_CATEGORY_PROFIT_ONLY__)return;window.__V42_CATEGORY_PROFIT_ONLY__=true;

  function actualCategoryProfitRows(){
    const cats=Array.isArray(window.RESULT_CATEGORIES)?window.RESULT_CATEGORIES:RESULT_CATEGORIES;
    const groups=Object.fromEntries(cats.map(category=>[category,{category,revenue:0,cost:0,profit:0,names:[],count:0}]));
    state.products.forEach(p=>{
      if(String(p.actualSoldPackages??'').trim()==='')return;
      let st=null;
      if(typeof window.realProductStats==='function')st=window.realProductStats(p);
      else if(typeof window.productActualPackageStats==='function'){
        const x=window.productActualPackageStats(p);
        st={revenue:n(x.revenue),goodsCost:Math.max(0,n(x.revenue)-n(x.profit)),profit:n(x.profit)};
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

  const prevRenderShops=renderShops;
  renderShops=function(){prevRenderShops();renderCategorySummary()};

  renderCategorySummary();
})();
