// v48 – jasná logika doplnkových nákladov: fallback skutočnej ceny na plánovanú + transparentné ceny v záložke 5.
(function(){
  if(window.__V48_SUPPLEMENTAL_COST_CLARITY__)return;window.__V48_SUPPLEMENTAL_COST_CLARITY__=true;

  function hasValue(v){return String(v??'').trim()!==''}
  function effectiveActualUnitPrice(c){
    return hasValue(c.unitPrice)?Math.max(0,n(c.unitPrice)):Math.max(0,n(c.plannedUnitPrice));
  }
  window.effectiveSupplementalActualUnitPrice=effectiveActualUnitPrice;

  // Ak je vyplnené skutočné množstvo, ale reálna jednotková cena nie, použije sa plánovaná cena.
  suppCalc=function(c){
    const qty=Math.max(0,n(c.qty));
    const unitPrice=effectiveActualUnitPrice(c);
    return {actual:qty*unitPrice,qty,unitPrice};
  };

  function enhanceCostsHint(){
    const tab=document.getElementById('tab-costs');if(!tab)return;
    let hint=document.getElementById('v48CostFallbackHint');
    if(!hint){
      hint=document.createElement('div');hint.id='v48CostFallbackHint';hint.className='hint';
      hint.innerHTML='<strong>Skutočná cena:</strong> ak ju necháš prázdnu, pri výpočte sa použije plánovaná cena / jednotku. Ak ju vyplníš, použije sa zadaná reálna cena.';
      tab.querySelector('.panel')?.appendChild(hint);
    }
  }

  function enhanceShopTables(){
    document.querySelectorAll('#tab-shops .purchase-list-table').forEach(table=>{
      const head=table.querySelector('thead tr');if(!head)return;
      const headers=[...head.children];
      let planPriceIdx=headers.findIndex(th=>th.dataset.v48PlanPrice==='1');
      if(planPriceIdx<0){
        const planCostIdx=headers.findIndex(th=>/Plán nákup/i.test(th.textContent));
        if(planCostIdx>=0){
          const th=document.createElement('th');th.dataset.v48PlanPrice='1';th.textContent='Plán cena / jednotku';
          head.insertBefore(th,head.children[planCostIdx]||null);
        }
      }
      const headers2=[...head.children];
      let actualPriceIdx=headers2.findIndex(th=>th.dataset.v48ActualPrice==='1');
      if(actualPriceIdx<0){
        const actualCostIdx=headers2.findIndex(th=>/Skutočný náklad/i.test(th.textContent));
        if(actualCostIdx>=0){
          const th=document.createElement('th');th.dataset.v48ActualPrice='1';th.textContent='Skutočná cena / jednotku';
          head.insertBefore(th,head.children[actualCostIdx]||null);
        }
      }

      const finalHeaders=[...head.children];
      const ppi=finalHeaders.findIndex(th=>th.dataset.v48PlanPrice==='1');
      const api=finalHeaders.findIndex(th=>th.dataset.v48ActualPrice==='1');
      const actualCostIdx=finalHeaders.findIndex(th=>/Skutočný náklad/i.test(th.textContent));

      table.querySelectorAll('tbody tr[data-purchase-row]').forEach(tr=>{
        const marker=tr.dataset.purchaseRow||'';
        const isCost=marker.startsWith('cost:');
        let planTd=tr.querySelector('td[data-v48-plan-price="1"]');
        if(!planTd){planTd=document.createElement('td');planTd.dataset.v48PlanPrice='1';tr.insertBefore(planTd,tr.children[ppi]||null)}
        let actualTd=tr.querySelector('td[data-v48-actual-price="1"]');
        if(!actualTd){actualTd=document.createElement('td');actualTd.dataset.v48ActualPrice='1';tr.insertBefore(actualTd,tr.children[api]||null)}

        if(!isCost){planTd.textContent='—';actualTd.textContent='—';return}
        const id=marker.replace(/^cost:/,'');
        const c=state.supplementalCosts.find(x=>x.id===id);if(!c)return;
        const planUnit=Math.max(0,n(c.plannedUnitPrice));
        const actualUnit=effectiveActualUnitPrice(c);
        planTd.className='calc';planTd.textContent=eur.format(planUnit);
        actualTd.className='calc';
        actualTd.innerHTML=`<strong>${eur.format(actualUnit)}</strong>${hasValue(c.unitPrice)?'':'<div class="mini">z plánu</div>'}`;

        // Po vložení stĺpcov znovu nájdi bunku skutočného nákladu podľa aktuálnej pozície.
        const headersNow=[...head.children];
        const costPos=headersNow.findIndex(th=>/Skutočný náklad/i.test(th.textContent));
        const costCell=tr.children[costPos];
        if(costCell){costCell.className='calc';costCell.innerHTML=`<strong>${eur.format(suppCalc(c).actual)}</strong>`}
      });

      const totalRow=table.querySelector('tbody tr.total-line');
      if(totalRow){
        // total riadok má colspan – po pridaní dvoch stĺpcov ho nechaj vizuálne konzistentný.
        const first=totalRow.children[0];if(first&&first.colSpan)first.colSpan=Math.max(1,first.colSpan+1);
      }
    });
  }

  const prevRenderShops=renderShops;
  renderShops=function(){prevRenderShops();enhanceShopTables()};

  const prevUpdateSummary=updateSummary;
  updateSummary=function(){prevUpdateSummary();enhanceCostsHint()};

  document.addEventListener('input',e=>{
    if(e.target?.dataset?.scope==='cost'&&(e.target.dataset.field==='qty'||e.target.dataset.field==='unitPrice'||e.target.dataset.field==='plannedUnitPrice'||e.target.dataset.field==='plannedQty')){
      setTimeout(()=>{renderShops();updateSummary()},0);
    }
  });
  document.addEventListener('change',e=>{
    if(e.target?.dataset?.scope==='cost')setTimeout(()=>{renderShops();updateSummary()},0);
  });

  enhanceCostsHint();renderShops();updateSummary();
})();
