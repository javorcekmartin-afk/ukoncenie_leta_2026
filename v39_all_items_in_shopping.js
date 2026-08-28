// v39 – všetky položky zo záložky 2 sa zobrazia v inventúre a nákupnom zozname.
(function(){
  if(window.__V39_ALL_ITEMS_IN_SHOPPING__)return;window.__V39_ALL_ITEMS_IN_SHOPPING__=true;

  sourceInventoryRows=function(){
    const rows=[];

    state.products.forEach(p=>{
      if(p.mode==='simple'&&n(p.packageAmount)>0&&n(p.saleAmount)>0){
        const c=productCalc(p);
        rows.push({
          key:'product:'+p.id,
          source:'product',
          sourceId:p.id,
          name:p.name,
          supplier:p.supplier||'Bez obchodu',
          packageLabel:`${num.format(n(p.packageAmount))} ${p.unit||'L'}`,
          packagePrice:n(p.packagePrice),
          minimum:c.suggestedPackages,
          planned:c.plannedPackages,
          manual:false
        });
      }
    });

    // Každá položka zo záložky 2 patrí do nákupného zoznamu.
    // Ak je v receptúre, minimum a plán sa dopočítajú z receptúr.
    // Ak nie je v receptúre, zostáva k dispozícii manuálny Plán balení zo záložky 2.
    state.items.forEach(i=>{
      const minimum=itemSuggestedPackages(i);
      const planned=itemPlannedPackages(i);
      rows.push({
        key:'item:'+i.id,
        source:'item',
        sourceId:i.id,
        name:i.name,
        supplier:i.supplier||'Bez obchodu',
        packageLabel:`${num.format(n(i.packageAmount))} ${i.unit||'L'}`,
        packagePrice:n(i.packagePrice),
        minimum,
        planned,
        manual:false
      });
    });

    return rows;
  };

  const note=document.querySelector('#tab-inventory .sectionhead p');
  if(note)note.textContent='Produkty sa preberajú zo záložky 1. Všetky suroviny a materiály zo záložky 2 sa zobrazujú vždy; pri položkách použitých v receptúrach sa potreba vypočíta automaticky, pri ostatných sa použije manuálny plán balení.';

  renderInventory();
  renderShops();
  updateSummary();
})();
