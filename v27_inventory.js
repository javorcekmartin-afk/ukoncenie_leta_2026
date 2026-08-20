// v27 – inventúra bez duplicitného zadávania údajov.
// Produkty: skutočné balenia + cena sa berú zo záložky 1.
// Suroviny/materiál: cena sa berie zo záložky 2, v inventúre sa zadáva len skutočne minuté množstvo.
(function(){
  const _baseInvCalcV27=invCalc;

  invCalc=function(row){
    // Zdrojové produkty: skutočne predané balenia aj cena sú už v záložke 1.
    if(row.source==='product'){
      const p=state.products.find(x=>x.id===row.sourceId);
      const actual=p&&String(p.actualSoldPackages??'').trim()!==''?n(p.actualSoldPackages):0;
      const unitPrice=p?n(p.packagePrice):n(row.packagePrice);
      return {actual,unitPrice,realCost:actual*unitPrice,planPurchase:n(row.planned)*n(row.packagePrice)};
    }

    // Suroviny/materiál: cenu používame priamo zo záložky 2.
    if(row.source==='item'){
      const v=invState(row);
      const actual=String(v.actualPackages??'').trim()===''?0:n(v.actualPackages);
      const i=state.items.find(x=>x.id===row.sourceId);
      const unitPrice=i?n(i.packagePrice):n(row.packagePrice);
      return {actual,unitPrice,realCost:actual*unitPrice,planPurchase:n(row.planned)*n(row.packagePrice)};
    }

    return _baseInvCalcV27(row);
  };

  renderInventory=function(){
    const rows=inventoryRows();
    inventoryBody.innerHTML=rows.map(r=>{
      const v=invState(r),c=invCalc(r),supplier=rowSupplier(r);
      const nameCell=r.manual?field('manual',r.sourceId,'name',v.name||'','text','name'):`<strong>${esc(r.name)}</strong>`;
      const supplierCell=r.manual?supplierField('manual',r.sourceId,'supplier',v.supplier||''):supplierField('inventory',r.key,'supplierOverride',v.supplierOverride||supplier);
      const packageCell=r.manual?field('manual',r.sourceId,'packageLabel',v.packageLabel||'1 balenie'):esc(r.packageLabel);
      const planCell=r.manual?field('manual',r.sourceId,'plannedPackages',v.plannedPackages||0,'num'):r.planned;
      let actualCell='',priceCell='',noteCell='',actionCell='';

      if(r.source==='product'){
        const p=state.products.find(x=>x.id===r.sourceId);
        const actual=p&&String(p.actualSoldPackages??'').trim()!==''?n(p.actualSoldPackages):0;
        actualCell=`<div class="linked-value"><strong>${num.format(actual)}</strong><div class="mini">zo záložky 1</div></div>`;
        priceCell=`<div class="linked-value"><strong>${eur.format(c.unitPrice)}</strong><div class="mini">zo záložky 1</div></div>`;
        noteCell=field('inventory',r.key,'note',v.note||'');
      }else if(r.source==='item'){
        actualCell=field('inventory',r.key,'actualPackages',v.actualPackages??'','num');
        priceCell=`<div class="linked-value"><strong>${eur.format(c.unitPrice)}</strong><div class="mini">zo záložky 2</div></div>`;
        noteCell=field('inventory',r.key,'note',v.note||'');
      }else{
        actualCell=field('manual',r.sourceId,'actualPackages',v.actualPackages??'','num');
        priceCell=moneyField('manual',r.sourceId,'actualUnitPrice',v.actualUnitPrice??'');
        noteCell=field('manual',r.sourceId,'note',v.note||'');
        actionCell=`<button class="small danger" data-action="deleteManualInventory" data-id="${r.sourceId}">×</button>`;
      }

      return `<tr>
        <td>${nameCell}</td><td>${supplierCell}</td><td>${packageCell}</td>
        <td class="calc">${r.minimum||'—'}</td><td>${planCell}</td><td class="calc">${eur.format(c.planPurchase)}</td>
        <td>${actualCell}</td><td>${priceCell}</td><td class="calc">${eur.format(c.realCost)}</td><td>${noteCell}</td><td>${actionCell}</td>
      </tr>`;
    }).join('');
    inventoryEmpty.hidden=rows.length>0;
  };

  const style=document.createElement('style');
  style.textContent=`#tab-inventory .linked-value{padding:6px 4px;white-space:nowrap}#tab-inventory .linked-value strong{display:block}`;
  document.head.appendChild(style);

  // Pri zmene skutočne predaných balení alebo ceny produktu sa inventúra okamžite prepočíta.
  document.addEventListener('input',e=>{
    const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;
    if(s==='product'&&(f==='actualSoldPackages'||f==='packagePrice')){renderInventory();renderShops();updateSummary();if(typeof renderCategorySummary==='function')renderCategorySummary();}
    if(s==='item'&&f==='packagePrice'){renderInventory();renderShops();updateSummary();if(typeof renderCategorySummary==='function')renderCategorySummary();}
  });
  document.addEventListener('change',e=>{
    const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;
    if((s==='product'&&(f==='actualSoldPackages'||f==='packagePrice'))||(s==='item'&&f==='packagePrice')){renderInventory();renderShops();updateSummary();if(typeof renderCategorySummary==='function')renderCategorySummary();}
  });

  // Nadpisy vysvetlia, že väčšina údajov sa už neprepisuje ručne.
  const section=document.querySelector('#tab-inventory .sectionhead p');
  if(section)section.textContent='Produkty preberajú skutočne predané balenia aj cenu zo záložky 1. Pri surovinách a materiáloch zadáš len skutočne minuté balenia; cena sa preberie zo záložky 2.';

  renderInventory();renderShops();updateSummary();if(typeof renderCategorySummary==='function')renderCategorySummary();
})();
