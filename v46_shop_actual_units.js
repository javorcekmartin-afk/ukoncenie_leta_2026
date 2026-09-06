// v46 – v záložke 5 zobraz reálne minuté jednotky zo záložky 2, nie iba počet otvorených balení.
(function(){
  if(window.__V46_SHOP_ACTUAL_UNITS__)return;window.__V46_SHOP_ACTUAL_UNITS__=true;

  function enhanceShopActualUnits(){
    const host=document.getElementById('shopGroups');if(!host)return;
    host.querySelectorAll('.purchase-list-table').forEach(table=>{
      const headers=[...table.querySelectorAll('thead th')];
      const actualIdx=headers.findIndex(th=>/Skutočné množstvo/i.test(th.textContent));
      if(actualIdx<0)return;
      headers[actualIdx].textContent='Skutočne minuté / otvorené bal.';

      table.querySelectorAll('tbody tr[data-purchase-row^="inventory:"]').forEach(tr=>{
        const marker=tr.dataset.purchaseRow||'';
        const key=marker.replace(/^inventory:/,'');
        const row=inventoryRows().find(r=>r.key===key);
        if(!row||row.source!=='item')return;
        const item=state.items.find(i=>i.id===row.sourceId);if(!item)return;
        const demand=typeof window.effectiveItemActualDemand==='function'
          ? Math.max(0,n(window.effectiveItemActualDemand(item)))
          : Math.max(0,n(typeof window.actualItemDemand==='function'?window.actualItemDemand(item.id):0));
        const c=invCalc(row);
        const cell=tr.children[actualIdx];if(!cell)return;
        cell.className='calc';
        cell.innerHTML=`<strong>${num.format(demand)} ${esc(item.unit||'')}</strong><div class="mini">${num.format(c.actual)} otvorené bal.</div>`;
      });
    });
  }

  const previousRenderShops=renderShops;
  renderShops=function(){previousRenderShops();enhanceShopActualUnits()};

  const style=document.createElement('style');
  style.textContent='#tab-shops .purchase-list-table td .mini{margin-top:2px;white-space:nowrap}';
  document.head.appendChild(style);

  enhanceShopActualUnits();
})();
