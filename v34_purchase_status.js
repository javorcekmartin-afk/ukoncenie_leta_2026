// v34 – stav nákupného zoznamu: Zabezpečené / Uzavreté.
(function(){
  if(window.__V34_PURCHASE_STATUS__)return;window.__V34_PURCHASE_STATUS__=true;

  function statusKey(type,id){return '__purchase_status__:'+type+':'+id}
  function statusFor(type,id){
    const key=statusKey(type,id);
    state.inventory[key]=state.inventory[key]||{secured:'nie',closed:'nie'};
    return state.inventory[key];
  }
  function ynSelect(type,id,field,value){
    const v=String(value||'nie').toLowerCase()==='ano'?'ano':'nie';
    return `<select class="purchase-status-select" data-purchase-type="${esc(type)}" data-purchase-id="${esc(id)}" data-purchase-field="${field}"><option value="nie" ${v==='nie'?'selected':''}>Nie</option><option value="ano" ${v==='ano'?'selected':''}>Áno</option></select>`;
  }
  function rowClass(st){return String(st.closed).toLowerCase()==='ano'?'purchase-closed':String(st.secured).toLowerCase()==='ano'?'purchase-secured':''}

  shopSummary=function(){
    const groups={};
    function group(s){const supplier=(s||'').trim()||'Bez obchodu';return groups[supplier]||(groups[supplier]={supplier,rows:[],plan:0,actual:0})}
    inventoryRows().forEach(r=>{
      const c=invCalc(r),g=group(rowSupplier(r)),st=statusFor('inventory',r.key);
      g.rows.push({statusType:'inventory',statusId:r.key,status:st,type:'Tovar',name:r.name,detail:r.packageLabel||'',planned:n(r.planned),planValue:c.planPurchase,actual:c.actual,actualValue:c.realCost});
      g.plan+=c.planPurchase;g.actual+=c.realCost;
    });
    state.supplementalCosts.forEach(c=>{
      const g=group(c.supplier),val=suppCalc(c).actual,st=statusFor('cost',c.id);
      g.rows.push({statusType:'cost',statusId:c.id,status:st,type:'Doplnkový náklad',name:c.name,detail:c.category||'',planned:null,planValue:0,actual:n(c.qty),actualValue:val});
      g.actual+=val;
    });
    return Object.values(groups).sort((a,b)=>a.supplier.localeCompare(b.supplier,'sk'));
  };

  renderShops=function(){
    const groups=shopSummary();
    shopGroups.innerHTML=groups.length?groups.map(g=>`<div class="panel box shopbox"><div class="sectionhead" style="padding:0 0 10px"><div><h2>${esc(g.supplier)}</h2><p>Plán nákupu ${eur.format(g.plan)} · Skutočne ${eur.format(g.actual)}</p></div></div><div class="tablewrap" style="max-height:none"><table class="purchase-list-table" style="min-width:1100px"><thead><tr><th>Typ</th><th>Položka</th><th>Balenie / kategória</th><th>Plán množstvo</th><th>Plán nákup</th><th>Zabezpečené</th><th>Skutočné množstvo</th><th>Skutočný náklad</th><th>Uzavreté</th></tr></thead><tbody>${g.rows.map(r=>`<tr class="${rowClass(r.status)}" data-purchase-row="${esc(r.statusType)}:${esc(r.statusId)}"><td class="mini">${esc(r.type)}</td><td><strong>${esc(r.name)}</strong></td><td class="mini">${esc(r.detail||'—')}</td><td class="calc">${r.planned===null?'—':num.format(r.planned)}</td><td class="calc">${r.planValue?eur.format(r.planValue):'—'}</td><td>${ynSelect(r.statusType,r.statusId,'secured',r.status.secured)}</td><td class="calc">${num.format(r.actual)}</td><td class="calc">${eur.format(r.actualValue)}</td><td>${ynSelect(r.statusType,r.statusId,'closed',r.status.closed)}</td></tr>`).join('')}<tr class="total-line"><td colspan="4"><strong>Spolu ${esc(g.supplier)}</strong></td><td class="calc"><strong>${eur.format(g.plan)}</strong></td><td></td><td></td><td class="calc"><strong>${eur.format(g.actual)}</strong></td><td></td></tr></tbody></table></div></div>`).join(''):`<div class="panel empty">Zatiaľ nie sú nákupné položky.</div>`;
    if(typeof renderActualProfitSummary==='function')renderActualProfitSummary();
    if(typeof renderCategorySummary==='function')renderCategorySummary();
  };

  document.addEventListener('change',e=>{
    const el=e.target;if(!el?.dataset?.purchaseField)return;
    const st=statusFor(el.dataset.purchaseType,el.dataset.purchaseId);
    st[el.dataset.purchaseField]=el.value==='ano'?'ano':'nie';
    save();renderShops();
  });

  const style=document.createElement('style');
  style.textContent=`
    #tab-shops .purchase-list-table tbody tr.purchase-secured>td{background:#eef8f0!important}
    #tab-shops .purchase-list-table tbody tr.purchase-secured>td:first-child{box-shadow:inset 4px 0 0 #8fbea0}
    #tab-shops .purchase-list-table tbody tr.purchase-closed>td{background:#cfe8d6!important;color:#1d4d2d}
    #tab-shops .purchase-list-table tbody tr.purchase-closed>td:first-child{box-shadow:inset 4px 0 0 #397a50}
    #tab-shops .purchase-status-select{min-width:88px;font-weight:700}
    #tab-shops tr.purchase-closed .purchase-status-select{background:#e7f4eb;border-color:#78a989}
  `;
  document.head.appendChild(style);

  renderShops();
})();
