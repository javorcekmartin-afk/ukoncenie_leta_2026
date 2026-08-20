// v22 – kompaktnejšia a logicky zoradená tabuľka produktov + jednotky l / ks.
(function(){
  function productUnit(p){return String(p.unit||'L').toLowerCase()==='ks'?'ks':'L'}
  function unitSelectForProduct(p){
    const u=productUnit(p);
    return `<select class="amount-unit" data-scope="product" data-id="${p.id}" data-field="unit"><option value="L" ${u==='L'?'selected':''}>l</option><option value="ks" ${u==='ks'?'selected':''}>ks</option></select>`;
  }
  function amountField(p,key){
    return `<div class="amount-unit-wrap">${field('product',p.id,key,p[key],'num')}${unitSelectForProduct(p)}</div>`;
  }
  function economicsCell(c){
    return `<div class="stacked-metrics"><div><span>Náklad / ks</span><strong>${eur.format(c.cost)}</strong></div><div><span>Zisk / ks</span><strong class="${c.profit>=0?'good':'bad'}">${eur.format(c.profit)}</strong></div><div><span>Prirážka</span><strong>${pct0.format(c.markup)} %</strong></div><div><span>Odpor. cena</span><strong>${eur.format(c.recommended)}</strong></div></div>`;
  }
  function planPurchaseCell(p,c){
    if(p.mode!=='simple')return `<span class="mini">podľa receptúry</span>`;
    const shortage=c.plannedPackages<c.suggestedPackages;
    return `<div class="plan-purchase-cell"><div class="mini">Minimum: <strong>${num.format(c.suggestedPackages)}</strong></div><div class="mini">Kúpiť balení:</div>${field('product',p.id,'plannedPackages',p.plannedPackages||c.suggestedPackages,'num')}${shortage?`<div class="mini bad">chýba ${num.format(c.suggestedPackages-c.plannedPackages)}</div>`:''}<div class="mini">Kapacita: ${num.format(c.capacity)} ks</div></div>`;
  }

  renderProducts=function(){
    const q=productQuery.toLowerCase();
    const rows=state.products.filter(p=>!q||(p.name||'').toLowerCase().includes(q));
    const table=document.querySelector('#tab-products table');
    if(table){
      table.style.minWidth='1750px';
      table.querySelector('thead').innerHTML=`
        <tr class="product-group-head">
          <th colspan="4">PRODUKT</th><th colspan="2">PREDAJ</th><th colspan="2">NÁKUP</th><th>EKONOMIKA</th><th colspan="2">PLÁN</th><th colspan="2">SKUTOČNOSŤ</th><th>RECEPT</th><th></th>
        </tr>
        <tr><th>Produkt</th><th>Kategória</th><th>Typ</th><th>Obchod</th><th>Predávané množstvo</th><th>Predajná cena</th><th>Nákupné balenie</th><th>Cena balenia</th><th>Prehľad / ks</th><th>Plán predaja ks</th><th>Plán nákupu</th><th>Skutočne predané ks</th><th>Reálny zisk</th><th>Recept / doplnky</th><th>Akcie</th></tr>`;
    }
    productBody.innerHTML=rows.map(p=>{
      const c=productCalc(p),comp=(p.components||[]).map(x=>{const i=item(x.itemId);return i?`${i.name}: ${num.format(n(x.amount))} ${i.unit}`:''}).filter(Boolean).join(' + '),actual=typeof actualProductStats==='function'?actualProductStats(p):{profit:n(p.actualSoldQty)*c.profit};
      const hasActual=String(p.actualSoldQty??'').trim()!=='';
      return `<tr>
        <td>${field('product',p.id,'name',p.name,'text','name')}</td>
        <td>${categorySelect(p.id,p.category)}</td>
        <td>${modeSelect(p)}</td>
        <td>${p.mode==='simple'?supplierField('product',p.id,'supplier',p.supplier||''):'—'}</td>
        <td>${amountField(p,'saleAmount')}</td>
        <td>${moneyField('product',p.id,'salePrice',p.salePrice)}</td>
        <td>${p.mode==='simple'?amountField(p,'packageAmount'):`<span class="mini">cez receptúru</span>`}</td>
        <td>${p.mode==='simple'?moneyField('product',p.id,'packagePrice',p.packagePrice):`<span class="mini">cez receptúru</span>`}</td>
        <td>${economicsCell(c)}</td>
        <td>${field('product',p.id,'plannedQty',p.plannedQty,'num')}</td>
        <td>${planPurchaseCell(p,c)}</td>
        <td>${field('product',p.id,'actualSoldQty',p.actualSoldQty??'','num')}</td>
        <td class="calc ${actual.profit>=0?'good':'bad'}" data-real-profit="${p.id}">${hasActual?`<strong>${eur.format(actual.profit)}</strong>`:'—'}</td>
        <td><button class="small" data-action="recipe" data-id="${p.id}">${p.mode==='simple'?'Doplnky':'Receptúra'}</button><div class="mini recipe-summary">${esc(comp||'bez položiek')}</div></td>
        <td><button class="small danger" data-action="deleteProduct" data-id="${p.id}">×</button></td>
      </tr>`;
    }).join('');
    productEmpty.hidden=rows.length>0;
  };

  // Jemné vizuálne oddelenie skupín a kompaktnejšie bunky.
  const style=document.createElement('style');
  style.textContent=`
    #tab-products .product-group-head th{font-size:10px;letter-spacing:.08em;color:#6c7587;background:#f7f9fc;text-align:center;border-bottom:1px solid #e4e9f1;padding:7px 8px}
    #tab-products .amount-unit-wrap{display:grid;grid-template-columns:minmax(68px,1fr) 58px;gap:5px;align-items:center;min-width:135px}
    #tab-products .amount-unit{min-width:54px}
    #tab-products .stacked-metrics{min-width:145px;display:grid;gap:3px;font-size:11px}
    #tab-products .stacked-metrics>div{display:flex;justify-content:space-between;gap:10px;white-space:nowrap}
    #tab-products .stacked-metrics span{color:#747d8e}
    #tab-products .plan-purchase-cell{min-width:125px;display:grid;gap:4px}
    #tab-products .recipe-summary{max-width:240px;white-space:normal;line-height:1.35;margin-top:4px}
    #tab-products td{vertical-align:top}
  `;
  document.head.appendChild(style);

  // Po zmene jednotky sa prepočíta celá tabuľka, aby boli obe zobrazenia jednotky synchronizované.
  document.addEventListener('change',e=>{
    if(e.target?.dataset?.scope==='product'&&e.target?.dataset?.field==='unit')renderAll();
  });

  renderProducts();
})();
