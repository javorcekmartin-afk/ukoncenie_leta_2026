// v38 – reálny zisk iba pri produktoch, ktoré vieme spoľahlivo vyhodnotiť samostatne.
(function(){
  if(window.__V38_SELECTIVE_PRODUCT_PROFIT__)return;window.__V38_SELECTIVE_PRODUCT_PROFIT__=true;

  function isUsedInAnotherRecipe(productId){
    return state.products.some(p=>(p.components||[]).some(c=>c.itemId===productId));
  }
  function canShowProductProfit(p){
    return p&&p.mode==='simple'&&!isUsedInAnotherRecipe(p.id);
  }
  window.canShowProductProfit=canShowProductProfit;

  function applySelectiveProfit(){
    const table=document.querySelector('#tab-products table');if(!table)return;
    const head=table.querySelector('thead tr:last-child');
    if(head&&head.children.length>=14){
      head.children[13].style.display='';
      head.children[13].textContent='Reálny zisk';
    }
    const group=table.querySelector('.product-group-head');
    if(group){
      const cells=group.children;
      if(cells.length>=7&&cells[6].textContent.trim()==='SKUTOČNOSŤ')cells[6].colSpan=2;
    }

    const rows=[...document.querySelectorAll('#tab-products tbody tr')];
    rows.forEach((tr,idx)=>{
      const cells=tr.children;if(cells.length<14)return;
      const profitCell=cells[13];profitCell.style.display='';
      const id=tr.querySelector('[data-scope="product"][data-id]')?.dataset?.id;
      const p=state.products.find(x=>x.id===id) || state.products[idx];
      if(!p)return;
      if(canShowProductProfit(p)){
        const st=typeof window.productActualPackageStats==='function'?window.productActualPackageStats(p):null;
        const hasActual=String(p.actualSoldPackages??'').trim()!=='';
        profitCell.className='calc '+(st&&st.profit<0?'bad':'good');
        profitCell.innerHTML=hasActual&&st?`<strong>${eur.format(st.profit)}</strong>`:'—';
      }else{
        profitCell.className='calc';
        profitCell.innerHTML=`<span class="mini recipe-profit-note">${p.mode==='recipe'?'Receptúra':'Súčasť receptúry'}</span>`;
      }
    });
  }

  // v37 skrylo celý stĺpec. Po jeho renderi ho v38 selektívne obnoví.
  const previousRenderProducts=renderProducts;
  renderProducts=function(){previousRenderProducts();applySelectiveProfit()};

  document.addEventListener('change',e=>{
    if(e.target?.dataset?.rfield==='itemId'||(e.target?.dataset?.scope==='product'&&e.target?.dataset?.field==='mode'))setTimeout(applySelectiveProfit,0);
  });

  const style=document.createElement('style');
  style.textContent=`#tab-products .recipe-profit-note{display:inline-block;max-width:105px;white-space:normal;line-height:1.25;color:#7b8493}`;
  document.head.appendChild(style);

  applySelectiveProfit();
})();
