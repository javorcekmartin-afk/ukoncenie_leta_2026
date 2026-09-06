// v45 – manuálne skutočne minuté množstvo pre suroviny a materiál, s automatickým fallbackom z receptúr.
(function(){
  if(window.__V45_MANUAL_ITEM_ACTUAL__)return;window.__V45_MANUAL_ITEM_ACTUAL__=true;

  numericFields.add('actualUsedAmount');

  const autoActualItemDemand=typeof window.actualItemDemand==='function'?window.actualItemDemand:function(){return 0};
  const prevInvCalc=invCalc;

  function manualValue(i){
    return i&&String(i.actualUsedAmount??'').trim()!==''?Math.max(0,n(i.actualUsedAmount)):null;
  }
  function effectiveItemDemand(i){
    const manual=manualValue(i);
    return manual===null?Math.max(0,n(autoActualItemDemand(i.id))):manual;
  }
  window.actualItemDemand=function(id){
    const i=state.items.find(x=>x.id===id);
    return i?effectiveItemDemand(i):Math.max(0,n(autoActualItemDemand(id)));
  };
  window.effectiveItemActualDemand=function(i){return effectiveItemDemand(i)};

  function wholePackages(v){return v>0?Math.ceil(v-1e-9):0}
  invCalc=function(row){
    if(row.source==='item'){
      const i=state.items.find(x=>x.id===row.sourceId);
      if(i&&manualValue(i)!==null){
        const demand=effectiveItemDemand(i),amount=n(i.packageAmount);
        const actual=amount>0?wholePackages(demand/amount):0,unitPrice=n(i.packagePrice);
        return {actual,demand,unitPrice,realCost:actual*unitPrice,planPurchase:n(row.planned)*n(row.packagePrice)};
      }
    }
    return prevInvCalc(row);
  };

  function enhanceItemsTable(){
    const table=document.querySelector('#tab-items table');if(!table)return;
    const head=table.querySelector('thead tr');if(!head)return;
    let idx=[...head.children].findIndex(th=>th.dataset.v45Actual==='1');
    if(idx<0){
      const noteIdx=[...head.children].findIndex(th=>/Poznámka/i.test(th.textContent));
      idx=noteIdx>=0?noteIdx:Math.max(0,head.children.length-1);
      const th=document.createElement('th');th.dataset.v45Actual='1';th.textContent='Skutočne minuté množstvo';
      head.insertBefore(th,head.children[idx]||null);
    }
    const rows=[...table.querySelectorAll('tbody tr')];
    rows.forEach((tr,rowIndex)=>{
      const id=tr.querySelector('[data-scope="item"][data-id]')?.dataset?.id;
      const i=state.items.find(x=>x.id===id)||state.items[rowIndex];if(!i)return;
      let td=tr.querySelector('td[data-v45-actual="1"]');
      if(!td){td=document.createElement('td');td.dataset.v45Actual='1';tr.insertBefore(td,tr.children[idx]||null)}
      const manual=manualValue(i),auto=Math.max(0,n(autoActualItemDemand(i.id))),effective=manual===null?auto:manual;
      td.innerHTML=`<div class="v45-actual-wrap"><div class="amount-unit-wrap"><input type="text" inputmode="decimal" value="${esc(inputNum(effective))}" data-v45-item-actual="${esc(i.id)}"><span class="mini">${esc(i.unit||'')}</span></div><div class="mini">${manual===null?`auto z receptúr: ${num.format(auto)} ${esc(i.unit||'')}`:`manuálne · auto by bolo ${num.format(auto)} ${esc(i.unit||'')}`}</div>${manual!==null?`<button class="small" type="button" data-v45-item-auto="${esc(i.id)}">Auto</button>`:''}</div>`;
    });
  }

  function enhanceInventoryItemActuals(){
    const table=document.querySelector('#tab-inventory table');if(!table)return;
    const rows=inventoryRows();
    [...table.querySelectorAll('tbody tr')].forEach((tr,idx)=>{
      const row=rows[idx];if(!row||row.source!=='item')return;
      const i=state.items.find(x=>x.id===row.sourceId);if(!i)return;
      const c=invCalc(row),demand=effectiveItemDemand(i),manual=manualValue(i);
      const head=[...table.querySelectorAll('thead th')];
      let actualIdx=head.findIndex(th=>/Skutočne|minuté|otvorené/i.test(th.textContent));
      if(actualIdx<0)return;
      const actualCell=tr.children[actualIdx];if(!actualCell)return;
      actualCell.innerHTML=`<div class="linked-value"><strong>${num.format(c.actual)}</strong><div class="mini">spotreba ${num.format(demand)} ${esc(i.unit||'')} → celé balenia${manual===null?'':' · manuálne'}</div></div>`;
    });
  }

  const prevRenderItems=renderItems;
  renderItems=function(){prevRenderItems();enhanceItemsTable()};

  const prevRenderInventory=renderInventory;
  renderInventory=function(){prevRenderInventory();enhanceInventoryItemActuals()};

  function refreshAll(){
    renderItems();renderInventory();renderShops();updateSummary();
    if(typeof renderCategorySummary==='function')renderCategorySummary();
    if(typeof renderPrepaidBeforeEvent==='function')renderPrepaidBeforeEvent();
  }

  document.addEventListener('input',e=>{
    const id=e.target?.dataset?.v45ItemActual;if(!id)return;
    const i=state.items.find(x=>x.id===id);if(!i)return;
    i.actualUsedAmount=Math.max(0,n(e.target.value));save();
    renderInventory();renderShops();updateSummary();
  });
  document.addEventListener('change',e=>{
    const id=e.target?.dataset?.v45ItemActual;if(!id)return;
    const i=state.items.find(x=>x.id===id);if(!i)return;
    i.actualUsedAmount=Math.max(0,n(e.target.value));save();refreshAll();
  });
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-v45-item-auto]');if(!btn)return;
    const i=state.items.find(x=>x.id===btn.dataset.v45ItemAuto);if(!i)return;
    i.actualUsedAmount='';save();refreshAll();
  });

  const style=document.createElement('style');
  style.textContent=`#tab-items td[data-v45-actual="1"]{min-width:190px}#tab-items .v45-actual-wrap{display:grid;gap:4px}#tab-items .v45-actual-wrap .amount-unit-wrap{grid-template-columns:minmax(80px,1fr) 42px}#tab-items .v45-actual-wrap button{justify-self:start}`;
  document.head.appendChild(style);

  enhanceItemsTable();enhanceInventoryItemActuals();
})();
