// v47 – jednotný zdroj skutočne minutých/otvorených balení naprieč záložkami 2, 3 a 5.
(function(){
  if(window.__V47_LINKED_ACTUAL_PACKAGES__)return;window.__V47_LINKED_ACTUAL_PACKAGES__=true;

  numericFields.add('actualUsedPackages');

  const prevInvCalc=invCalc;
  const prevEffectiveItemDemand=window.effectiveItemActualDemand;

  function invStateFor(row){
    const key=row.key||('manual:'+row.sourceId);
    state.inventory[key]=state.inventory[key]&&typeof state.inventory[key]==='object'?state.inventory[key]:{};
    return state.inventory[key];
  }
  function hasValue(v){return String(v??'').trim()!==''}
  function returnedPackages(row){const v=invStateFor(row).returnedPackages;return hasValue(v)?Math.max(0,n(v)):null}
  function itemManualPackages(item){return item&&hasValue(item.actualUsedPackages)?Math.max(0,n(item.actualUsedPackages)):null}

  function finalActualPackages(row){
    const returned=returnedPackages(row);
    if(returned!==null)return Math.max(0,n(row.planned)-returned);
    if(row.source==='item'){
      const item=state.items.find(i=>i.id===row.sourceId),manual=itemManualPackages(item);
      if(manual!==null)return manual;
    }
    return Math.max(0,n(prevInvCalc(row).actual));
  }
  window.finalActualPackages=finalActualPackages;

  invCalc=function(row){
    const base=prevInvCalc(row);
    if(row.source==='product'||row.source==='item'){
      const actual=finalActualPackages(row);
      const unitPrice=row.source==='product'
        ? n(state.products.find(p=>p.id===row.sourceId)?.packagePrice??base.unitPrice)
        : n(state.items.find(i=>i.id===row.sourceId)?.packagePrice??base.unitPrice);
      return {...base,actual,unitPrice,realCost:actual*unitPrice};
    }
    return base;
  };

  // Pri manuálne zadaných baleniach v záložke 2 prepočítaj aj ekvivalentnú spotrebu pre ostatné analytické vrstvy.
  window.effectiveItemActualDemand=function(item){
    if(!item)return 0;
    const row=inventoryRows().find(r=>r.source==='item'&&r.sourceId===item.id);
    if(row){
      const returned=returnedPackages(row),manual=itemManualPackages(item);
      if(returned!==null||manual!==null)return finalActualPackages(row)*Math.max(0,n(item.packageAmount));
    }
    return typeof prevEffectiveItemDemand==='function'?Math.max(0,n(prevEffectiveItemDemand(item))):0;
  };

  function enhanceItems(){
    const table=document.querySelector('#tab-items table');if(!table)return;
    const head=table.querySelector('thead tr');if(!head)return;
    let idx=[...head.children].findIndex(th=>th.dataset.v45Actual==='1'||/Skutočne minuté/i.test(th.textContent));
    if(idx<0)return;
    head.children[idx].textContent='Skutočne minuté balenia';
    [...table.querySelectorAll('tbody tr')].forEach((tr,rowIndex)=>{
      const id=tr.querySelector('[data-scope="item"][data-id]')?.dataset?.id;
      const item=state.items.find(i=>i.id===id)||state.items[rowIndex];if(!item)return;
      const cell=tr.children[idx];if(!cell)return;
      const row=inventoryRows().find(r=>r.source==='item'&&r.sourceId===item.id);
      const manual=itemManualPackages(item);
      const auto=row?Math.max(0,n(prevInvCalc(row).actual)):0;
      const returned=row?returnedPackages(row):null;
      const effective=row?finalActualPackages(row):(manual??auto);
      cell.dataset.v47ActualPackages='1';
      cell.innerHTML=`<div class="v47-pack-wrap"><input type="text" inputmode="decimal" value="${esc(inputNum(effective))}" data-v47-item-packages="${esc(item.id)}" ${returned!==null?'disabled':''}><div class="mini">${returned!==null?`podľa inventúry: plán ${num.format(n(row?.planned))} − vrátené ${num.format(returned)}`:manual!==null?`manuálne balenia · auto by bolo ${num.format(auto)}`:`auto z receptúr: ${num.format(auto)} bal.`}</div>${manual!==null&&returned===null?`<button class="small" type="button" data-v47-item-auto="${esc(item.id)}">Auto</button>`:''}</div>`;
    });
  }

  function enhanceInventory(){
    const table=document.querySelector('#tab-inventory table');if(!table)return;
    const headers=[...table.querySelectorAll('thead th')];
    const actualIdx=headers.findIndex(th=>/Skutočne|minuté|otvorené/i.test(th.textContent));
    const returnedIdx=headers.findIndex(th=>/Vrátené balenia/i.test(th.textContent));
    if(actualIdx<0)return;
    headers[actualIdx].textContent='Skutočne minuté / otvorené balenia';
    const rows=inventoryRows();
    [...table.querySelectorAll('tbody tr')].forEach((tr,i)=>{
      const row=rows[i];if(!row)return;
      const actual=finalActualPackages(row),returned=returnedPackages(row);
      const cell=tr.children[actualIdx];if(cell){
        cell.className='calc';
        cell.innerHTML=`<strong>${num.format(actual)}</strong><div class="mini">${returned!==null?`plán ${num.format(n(row.planned))} − vrátené ${num.format(returned)}`:row.source==='item'&&itemManualPackages(state.items.find(x=>x.id===row.sourceId))!==null?'zo záložky 2':'automaticky'}</div>`;
      }
      if(returnedIdx>=0&&tr.children[returnedIdx]){
        const inp=tr.children[returnedIdx].querySelector('[data-returned-key]');
        if(inp)inp.placeholder='0';
      }
    });
  }

  function enhanceShops(){
    const host=document.getElementById('shopGroups');if(!host)return;
    host.querySelectorAll('.purchase-list-table').forEach(table=>{
      const headers=[...table.querySelectorAll('thead th')];
      const actualIdx=headers.findIndex(th=>/Skutočné množstvo|Skutočne minuté/i.test(th.textContent));
      if(actualIdx<0)return;
      headers[actualIdx].textContent='Skutočne minuté balenia';
      table.querySelectorAll('tbody tr[data-purchase-row^="inventory:"]').forEach(tr=>{
        const key=(tr.dataset.purchaseRow||'').replace(/^inventory:/,'');
        const row=inventoryRows().find(r=>r.key===key);if(!row)return;
        const actual=finalActualPackages(row),returned=returnedPackages(row);
        const cell=tr.children[actualIdx];if(!cell)return;
        cell.className='calc';
        cell.innerHTML=`<strong>${num.format(actual)}</strong><div class="mini">${returned!==null?`plán ${num.format(n(row.planned))} − vrátené ${num.format(returned)}`:row.source==='item'&&itemManualPackages(state.items.find(x=>x.id===row.sourceId))!==null?'zo záložky 2':'automaticky'}</div>`;
      });
    });
  }

  const prevRenderItems=renderItems;renderItems=function(){prevRenderItems();enhanceItems()};
  const prevRenderInventory=renderInventory;renderInventory=function(){prevRenderInventory();enhanceInventory()};
  const prevRenderShops=renderShops;renderShops=function(){prevRenderShops();enhanceShops()};

  function refresh(){renderItems();renderInventory();renderShops();updateSummary();if(typeof renderCategorySummary==='function')renderCategorySummary();if(typeof renderInventoryProfitSummary==='function')renderInventoryProfitSummary()}

  document.addEventListener('input',e=>{
    const id=e.target?.dataset?.v47ItemPackages;if(!id)return;
    const item=state.items.find(i=>i.id===id);if(!item)return;
    item.actualUsedPackages=Math.max(0,n(e.target.value));item.actualUsedAmount='';save();
    renderInventory();renderShops();updateSummary();
  });
  document.addEventListener('change',e=>{
    const id=e.target?.dataset?.v47ItemPackages;if(id){const item=state.items.find(i=>i.id===id);if(item){item.actualUsedPackages=Math.max(0,n(e.target.value));item.actualUsedAmount='';save();refresh()}return}
    if(e.target?.dataset?.returnedKey)setTimeout(refresh,0);
  });
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-v47-item-auto]');if(!btn)return;
    const item=state.items.find(i=>i.id===btn.dataset.v47ItemAuto);if(!item)return;
    item.actualUsedPackages='';item.actualUsedAmount='';save();refresh();
  });

  const style=document.createElement('style');
  style.textContent='#tab-items .v47-pack-wrap{display:grid;gap:4px;min-width:170px}#tab-items .v47-pack-wrap input{width:95px}#tab-items .v47-pack-wrap button{justify-self:start}';
  document.head.appendChild(style);

  enhanceItems();enhanceInventory();enhanceShops();updateSummary();
})();
