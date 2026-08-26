// v37 – výsledky bez falošnej presnosti po produktoch.
(function(){
  if(window.__V37_TRUTHFUL_RESULTS__)return;window.__V37_TRUTHFUL_RESULTS__=true;

  function removeProductProfitPanel(){
    const panel=document.getElementById('actualProfitPanel');
    if(panel)panel.remove();
  }

  function reliableCategoryCosts(){
    const groups=Object.fromEntries(RESULT_CATEGORIES.map(category=>[category,{category,cost:0,names:[]}]))
    inventoryRows().forEach(row=>{
      const c=invCalc(row);if(c.realCost<=0)return;
      let category='Iné';
      if(typeof actualCategoryForInventoryRow==='function')category=actualCategoryForInventoryRow(row);
      if(!groups[category])category='Iné';
      groups[category].cost+=c.realCost;
      groups[category].names.push(row.name);
    });
    return RESULT_CATEGORIES.map(category=>groups[category]);
  }

  renderActualProfitSummary=function(){removeProductProfitPanel()};

  renderCategorySummary=function(){
    const host=document.getElementById('categorySummary');if(!host)return;
    const rows=reliableCategoryCosts(),total=rows.reduce((s,g)=>s+g.cost,0);
    host.innerHTML=`<div class="tablewrap" style="max-height:none;margin-top:0"><table style="min-width:760px"><thead><tr><th>Kategória</th><th>Skutočný náklad</th><th>Podiel na náklade tovaru</th><th>Položky</th></tr></thead><tbody>${rows.map(g=>`<tr><td><strong>${esc(g.category)}</strong></td><td class="calc">${eur.format(g.cost)}</td><td class="calc">${total>0?num.format(g.cost/total*100):'0'} %</td><td class="mini">${g.names.length?esc([...new Set(g.names)].join(', ')):'—'}</td></tr>`).join('')}<tr class="total-line"><td><strong>Spolu</strong></td><td class="calc"><strong>${eur.format(total)}</strong></td><td class="calc"><strong>${total>0?'100 %':'0 %'}</strong></td><td></td></tr></tbody></table></div>`;
    const panel=document.querySelector('.category-panel');
    if(panel){
      const h=panel.querySelector('h2'),p=panel.querySelector('.category-note');
      if(h)h.textContent='Skutočný náklad podľa kategórií';
      if(p)p.textContent='Zobrazuje iba reálne náklady z inventúry. Tržbu ani zisk po kategóriách nepočítame, pretože bez evidencie počtu miešaných drinkov by išlo iba o odhad.';
    }
  };

  function hideProductProfitColumn(){
    const table=document.querySelector('#tab-products table');if(!table)return;
    // Stĺpec 14 = Reálny zisk. Skrytie zachová existujúcu dátovú logiku bez zmeny uložených dát.
    table.querySelectorAll('tr').forEach(tr=>{
      const cells=tr.children;
      if(cells.length>=14)cells[13].style.display='none';
    });
    const group=table.querySelector('.product-group-head');
    if(group){
      // Skutočnosť mala colspan 2; po skrytí zisku ostáva len pole skutočného množstva.
      const cells=group.children;
      if(cells.length>=7&&cells[6].textContent.trim()==='SKUTOČNOSŤ')cells[6].colSpan=1;
    }
  }

  const previousRenderProducts=renderProducts;
  renderProducts=function(){previousRenderProducts();hideProductProfitColumn()};

  const previousRenderShops=renderShops;
  renderShops=function(){
    previousRenderShops();
    removeProductProfitPanel();
    renderCategorySummary();
  };

  removeProductProfitPanel();
  hideProductProfitColumn();
  renderCategorySummary();
})();
