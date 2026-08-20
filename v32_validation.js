// v32 – jemné označenie nekompletných produktov pred akciou. Bez zásahu do dát.
(function(){
  if(window.__productValidationV32)return;window.__productValidationV32=true;

  function txt(v){return String(v??'').trim()}
  function positive(v){return n(v)>0}

  function missingFor(p){
    const missing=[];
    if(!txt(p.name))missing.push('názov');
    if(!txt(p.category))missing.push('kategória');
    if(!txt(p.mode))missing.push('typ');
    if(!positive(p.saleAmount))missing.push('predávané množstvo');
    if(!positive(p.salePrice))missing.push('predajná cena');

    if(p.mode==='simple'){
      if(!txt(p.supplier))missing.push('obchod');
      if(!positive(p.packageAmount))missing.push('nákupné balenie');
      if(!positive(p.packagePrice))missing.push('cena balenia');
    }else if(!(p.components||[]).length){
      missing.push('recept');
    }

    const planned=typeof window.productPlannedSalePackages==='function'
      ? window.productPlannedSalePackages(p)
      : n(p.plannedSalePackages);
    if(!(planned>0))missing.push('plán predaja balení');

    return missing;
  }

  function applyValidation(){
    const rows=document.querySelectorAll('#tab-products tbody tr');
    rows.forEach(tr=>{
      const id=tr.querySelector('[data-scope="product"]')?.dataset.id;
      const p=state.products.find(x=>x.id===id);if(!p)return;
      const missing=missingFor(p);
      tr.classList.toggle('needs-data',missing.length>0);
      tr.querySelectorAll('.needs-data-badge,.needs-data-note').forEach(x=>x.remove());
      if(!missing.length)return;

      const nameCell=tr.children[1]||tr.children[0];
      if(nameCell){
        const badge=document.createElement('div');
        badge.className='needs-data-badge';
        badge.textContent='Doplniť údaje';
        badge.title='Chýba: '+missing.join(', ');
        nameCell.appendChild(badge);
      }
      const target=tr.querySelector('.recipe-summary')?.parentElement || tr.lastElementChild;
      if(target){
        const note=document.createElement('div');
        note.className='needs-data-note';
        note.textContent='Chýba: '+missing.join(', ');
        target.appendChild(note);
      }
    });
  }

  const style=document.createElement('style');
  style.textContent=`
    #tab-products tbody tr.needs-data>td{background:#fffaf0}
    #tab-products tbody tr.needs-data>td:first-child{box-shadow:inset 3px 0 0 #d8a43b}
    #tab-products .needs-data-badge{display:inline-flex;align-items:center;margin-top:5px;padding:3px 7px;border-radius:999px;background:#fff1c9;color:#8a5a00;font-size:10px;font-weight:800;white-space:nowrap}
    #tab-products .needs-data-note{margin-top:6px;padding:5px 7px;border-radius:7px;background:#fff7e3;color:#7b5b18;font-size:10px;line-height:1.35;max-width:250px}
    #tab-products tbody tr:not(.needs-data)>td{transition:background .18s ease}
  `;
  document.head.appendChild(style);

  const originalRenderProducts=renderProducts;
  renderProducts=function(){originalRenderProducts();applyValidation()};

  document.addEventListener('input',e=>{
    if(e.target?.dataset?.scope==='product')setTimeout(applyValidation,0);
  });
  document.addEventListener('change',e=>{
    if(e.target?.dataset?.scope==='product'||e.target?.dataset?.rfield)setTimeout(applyValidation,0);
  });

  // Recept sa upravuje v dialógu; po zatvorení obnov kontrolu.
  ['doneRecipe','closeRecipe'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(applyValidation,0)));

  applyValidation();
})();
