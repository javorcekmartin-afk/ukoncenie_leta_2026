// v44 – produktový zisk pre všetky zadané produkty + sumáre + vrátené balenia v inventúre.
(function(){
  if(window.__V44_PROFIT_INVENTORY__)return;window.__V44_PROFIT_INVENTORY__=true;

  function filledProductStats(){
    return state.products.map(p=>{
      const filled=String(p.actualSoldPackages??'').trim()!=='';
      const st=typeof window.productActualPackageStats==='function'?window.productActualPackageStats(p):null;
      return {p,filled,st};
    }).filter(x=>x.filled&&x.st);
  }
  function analyticalProductProfit(){return filledProductStats().reduce((s,x)=>s+n(x.st.profit),0)}
  window.analyticalProductProfit=analyticalProductProfit;

  function recipeUseNote(p){
    const used=state.products.some(other=>(other.components||[]).some(c=>c.itemId===p.id));
    return used?'<div class="mini profit-estimate-note">orientačne podľa spotreby</div>':'';
  }

  function applyAllProductProfit(){
    const table=document.querySelector('#tab-products table');if(!table)return;
    const head=table.querySelector('thead tr:last-child');
    if(head&&head.children.length>=14){head.children[13].style.display='';head.children[13].textContent='Reálny / orientačný zisk'}
    const group=table.querySelector('.product-group-head');
    if(group&&group.children.length>=7&&group.children[6].textContent.trim()==='SKUTOČNOSŤ')group.children[6].colSpan=2;

    [...table.querySelectorAll('tbody tr')].forEach(tr=>{
      const input=tr.querySelector('[data-scope="product"][data-field="actualSoldPackages"]');
      if(!input)return;
      const p=state.products.find(x=>x.id===input.dataset.id);if(!p)return;
      const cell=tr.children[13];if(!cell)return;
      cell.style.display='';
      const filled=String(p.actualSoldPackages??'').trim()!=='';
      if(!filled){cell.className='calc';cell.innerHTML='—';return}
      const st=window.productActualPackageStats(p);
      cell.className='calc '+(st.profit>=0?'good':'bad');
      cell.innerHTML=`<strong>${eur.format(st.profit)}</strong>${recipeUseNote(p)}`;
    });
    renderProductProfitFooter();
  }

  function renderProductProfitFooter(){
    const tab=document.getElementById('tab-products');if(!tab)return;
    let panel=document.getElementById('productProfitFooterV44');
    if(!panel){
      panel=document.createElement('div');panel.id='productProfitFooterV44';panel.className='panel box';panel.style.marginTop='12px';tab.appendChild(panel);
    }
    const rows=filledProductStats(),profit=analyticalProductProfit(),revenue=rows.reduce((s,x)=>s+n(x.st.revenue),0);
    panel.innerHTML=`<div class="sectionhead" style="padding:0"><div><h2>Sumár produktového zisku</h2><p class="category-note">Počíta zo všetkých produktov s vyplneným skutočným množstvom. Pri produktoch použitých v receptúrach ide o orientačný zisk podľa spotreby.</p></div></div><div class="profit-summary-cards"><div class="card"><div class="label">Produkty s vyplnenou skutočnosťou</div><div class="value">${rows.length}</div></div><div class="card"><div class="label">Analytická tržba produktov</div><div class="value">${eur.format(revenue)}</div></div><div class="card result-card"><div class="label">Produktový zisk spolu</div><div class="value ${profit>=0?'good':'bad'}">${eur.format(profit)}</div><div class="meta">orientačný pri položkách v receptúrach</div></div></div>`;
  }

  function renderDashboardProductProfit(){
    const group=document.querySelector('.dashboard-group.actual-group .actual-cards');if(!group)return;
    let card=document.getElementById('dashboardProductProfitV44');
    if(!card){card=document.createElement('div');card.id='dashboardProductProfitV44';card.className='card actual';group.appendChild(card)}
    const profit=analyticalProductProfit();
    card.innerHTML=`<div class="label">Produktový zisk</div><div class="value ${profit>=0?'good':'bad'}">${eur.format(profit)}</div><div class="meta">podľa zadanej skutočnosti; analytický údaj</div>`;
  }

  function returnedState(row){
    const key=row.key||('manual:'+row.sourceId);
    state.inventory[key]=state.inventory[key]&&typeof state.inventory[key]==='object'?state.inventory[key]:{};
    return state.inventory[key];
  }
  function returnedInput(row){
    const v=returnedState(row);
    return `<input type="text" inputmode="decimal" value="${esc(inputNum(v.returnedPackages??''))}" data-returned-key="${esc(row.key)}" placeholder="0"><div class="mini">neotvorené / vrátené</div>`;
  }

  function enhanceInventory(){
    const table=document.querySelector('#tab-inventory table');if(!table)return;
    const head=table.querySelector('thead tr');if(!head)return;
    let idx=[...head.children].findIndex(th=>th.dataset.v44Returned==='1');
    if(idx<0){
      const actualIdx=[...head.children].findIndex(th=>/Skutočne|minuté|otvorené/i.test(th.textContent));
      idx=actualIdx>=0?actualIdx+1:7;
      const th=document.createElement('th');th.dataset.v44Returned='1';th.textContent='Vrátené balenia';
      head.insertBefore(th,head.children[idx]||null);
    }
    const rows=inventoryRows();
    [...table.querySelectorAll('tbody tr')].forEach((tr,i)=>{
      const row=rows[i];if(!row)return;
      let td=tr.querySelector('td[data-v44-returned="1"]');
      if(!td){td=document.createElement('td');td.dataset.v44Returned='1';tr.insertBefore(td,tr.children[idx]||null)}
      td.innerHTML=returnedInput(row);
    });
    renderInventoryProfitSummary();
  }

  function renderInventoryProfitSummary(){
    const tab=document.getElementById('tab-inventory');if(!tab)return;
    let panel=document.getElementById('inventoryProfitSummaryV44');
    if(!panel){panel=document.createElement('div');panel.id='inventoryProfitSummaryV44';panel.className='panel box';panel.style.marginTop='12px';tab.appendChild(panel)}
    const rows=inventoryRows();
    const returned=rows.reduce((s,r)=>s+Math.max(0,n(returnedState(r).returnedPackages)),0);
    const t=totals(),profit=analyticalProductProfit();
    panel.innerHTML=`<h2>Sumár inventúry</h2><div class="profit-summary-cards"><div class="card"><div class="label">Vrátené balenia spolu</div><div class="value">${num.format(returned)}</div><div class="meta">evidenčný údaj; neotvorený tovar</div></div><div class="card"><div class="label">Reálny náklad tovaru</div><div class="value">${eur.format(n(t.actualPurchase))}</div><div class="meta">minuté / otvorené balenia</div></div><div class="card result-card"><div class="label">Produktový zisk</div><div class="value ${profit>=0?'good':'bad'}">${eur.format(profit)}</div><div class="meta">analytický údaj podľa zadanej skutočnosti</div></div></div>`;
  }

  const prevRenderProducts=renderProducts;
  renderProducts=function(){prevRenderProducts();applyAllProductProfit()};

  const prevRenderInventory=renderInventory;
  renderInventory=function(){prevRenderInventory();enhanceInventory()};

  const prevUpdateSummary=updateSummary;
  updateSummary=function(){prevUpdateSummary();renderDashboardProductProfit();renderProductProfitFooter();renderInventoryProfitSummary()};

  document.addEventListener('input',e=>{
    const el=e.target;
    if(el?.dataset?.returnedKey){
      state.inventory[el.dataset.returnedKey]=state.inventory[el.dataset.returnedKey]||{};
      state.inventory[el.dataset.returnedKey].returnedPackages=Math.max(0,n(el.value));
      save();renderInventoryProfitSummary();
    }
    if(el?.dataset?.scope==='product'&&el.dataset.field==='actualSoldPackages'){
      setTimeout(()=>{applyAllProductProfit();renderDashboardProductProfit();renderInventoryProfitSummary()},0);
    }
  });
  document.addEventListener('change',e=>{
    const el=e.target;
    if(el?.dataset?.returnedKey){
      state.inventory[el.dataset.returnedKey]=state.inventory[el.dataset.returnedKey]||{};
      state.inventory[el.dataset.returnedKey].returnedPackages=Math.max(0,n(el.value));save();enhanceInventory();
    }
  });

  const style=document.createElement('style');
  style.textContent=`
    .profit-summary-cards{display:grid;grid-template-columns:repeat(3,minmax(160px,1fr));gap:10px;margin-top:12px}
    #tab-products .profit-estimate-note{max-width:125px;white-space:normal;line-height:1.2;margin-top:3px;color:#7b8493}
    #tab-inventory td[data-v44-returned="1"] input{min-width:90px;width:100px}
    @media(max-width:700px){.profit-summary-cards{grid-template-columns:1fr}}
  `;document.head.appendChild(style);

  applyAllProductProfit();renderDashboardProductProfit();enhanceInventory();
})();
