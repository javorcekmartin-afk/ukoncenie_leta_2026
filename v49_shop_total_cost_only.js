// v49 – v prehľade podľa obchodov zobrazuj hlavne celkové plánované a skutočné sumy, nie jednotkové ceny.
(function(){
  if(window.__V49_SHOP_TOTAL_COST_ONLY__)return;window.__V49_SHOP_TOTAL_COST_ONLY__=true;

  function simplifyShopTables(){
    document.querySelectorAll('#tab-shops .purchase-list-table').forEach(table=>{
      const head=table.querySelector('thead tr');if(!head)return;

      // Odstráň v48 pomocné jednotkové cenové stĺpce – patria do zdrojových záložiek, nie do sumára obchodov.
      const removeIndexes=[];
      [...head.children].forEach((th,idx)=>{
        if(th.dataset.v48PlanPrice==='1'||th.dataset.v48ActualPrice==='1'||/Plán cena\s*\/\s*jednotku/i.test(th.textContent)||/Skutočná cena\s*\/\s*jednotku/i.test(th.textContent))removeIndexes.push(idx);
      });
      removeIndexes.sort((a,b)=>b-a).forEach(idx=>{
        table.querySelectorAll('tbody tr').forEach(tr=>{
          // Pri normálnych riadkoch odstráň bunku na rovnakom indexe. Total riadok s colspan nechaj na neskoršiu úpravu.
          if(tr.children.length>idx&&!tr.classList.contains('total-line'))tr.children[idx].remove();
        });
        if(head.children[idx])head.children[idx].remove();
      });

      const headers=[...head.children];
      const planIdx=headers.findIndex(th=>/Plán nákup/i.test(th.textContent));
      const actualIdx=headers.findIndex(th=>/Skutočný náklad|Skutočná cena spolu/i.test(th.textContent));
      if(planIdx>=0)headers[planIdx].textContent='Plán nákup spolu';
      if(actualIdx>=0)headers[actualIdx].textContent='Skutočná cena spolu';

      // Celkový riadok znovu zosúlaď so zjednodušeným počtom stĺpcov.
      const totalRow=table.querySelector('tbody tr.total-line');
      if(totalRow){
        const cells=[...totalRow.children];
        const first=cells[0];
        if(first&&first.colSpan)first.colSpan=4;
      }
    });

    document.querySelectorAll('#tab-shops .shopbox').forEach(box=>{
      const p=box.querySelector('.sectionhead p');if(!p)return;
      p.textContent=p.textContent.replace(/^Plán nákupu\s*/,'Plán spolu ').replace(/·\s*Skutočne\s*/,'· Skutočne spolu ');
    });
  }

  const prevRenderShops=renderShops;
  renderShops=function(){prevRenderShops();simplifyShopTables()};

  simplifyShopTables();
})();
