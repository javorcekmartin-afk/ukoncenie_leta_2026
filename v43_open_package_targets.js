// v43 – minimálny predaj po otvorení balenia: bez straty a cieľ +50 % z ceny balenia.
(function(){
  if(window.__V43_OPEN_PACKAGE_TARGETS__)return;window.__V43_OPEN_PACKAGE_TARGETS__=true;

  function servingsPerPackage(p){
    if(!p||p.mode!=='simple'||n(p.saleAmount)<=0||n(p.packageAmount)<=0)return 0;
    return n(p.packageAmount)/n(p.saleAmount);
  }

  function targetStats(p){
    const capacity=servingsPerPackage(p);
    const packageCost=Math.max(0,n(p.packagePrice));
    const salePrice=Math.max(0,n(p.salePrice));
    // Doplnky/receptové položky na jednu predanú porciu (napr. pohár).
    const extras=Math.max(0,typeof componentsCost==='function'?componentsCost(p):0);
    const contribution=salePrice-extras;
    function needed(multiplier){
      if(packageCost<=0)return 0;
      if(contribution<=0)return Infinity;
      return Math.ceil((packageCost*multiplier-1e-9)/contribution);
    }
    const breakEven=needed(1);
    const plus50=needed(1.5);
    return {
      capacity,packageCost,salePrice,extras,contribution,breakEven,plus50,
      breakEvenPossible:Number.isFinite(breakEven)&&breakEven<=capacity+1e-9,
      plus50Possible:Number.isFinite(plus50)&&plus50<=capacity+1e-9
    };
  }
  window.openPackageTargetStats=targetStats;

  function formatTarget(v,possible){
    if(!Number.isFinite(v))return '<span class="bad"><strong>Nemožné</strong></span>';
    if(!possible)return `<span class="bad"><strong>${num.format(v)} ks</strong><div class="mini">viac než obsah balenia</div></span>`;
    return `<strong>${num.format(v)} ks</strong>`;
  }

  function renderTargets(){
    const tab=document.getElementById('tab-prepaid');if(!tab)return;
    let panel=document.getElementById('openPackageTargetsPanel');
    if(!panel){
      panel=document.createElement('div');panel.id='openPackageTargetsPanel';panel.className='panel box';panel.style.marginTop='12px';
      const summary=document.getElementById('prepaidPeopleSummary')?.closest('.panel');
      if(summary)summary.insertAdjacentElement('beforebegin',panel);else tab.appendChild(panel);
    }

    const rows=state.products.filter(p=>p.mode==='simple'&&n(p.packageAmount)>0&&n(p.saleAmount)>0&&n(p.packagePrice)>0&&n(p.salePrice)>0)
      .map(p=>({p,s:targetStats(p)}));

    panel.innerHTML=`
      <div class="sectionhead">
        <div><h2>Minimálny predaj po otvorení balenia</h2><p>Pomôcka pri rozhodovaní, či sa oplatí otvoriť ďalší sud, fľašu alebo balenie. Cieľ +50 % znamená: pri balení za 100 € musí po započítaní nákladov zostať aspoň 50 € zisku.</p></div>
      </div>
      <div class="tablewrap" style="max-height:none"><table style="min-width:1050px"><thead><tr><th>Produkt</th><th>Balenie</th><th>Cena balenia</th><th>Predajná cena</th><th>Doplnky / porcia</th><th>Kapacita balenia</th><th>Bez straty</th><th>Cieľ +50 %</th><th>Potrebné predať z balenia</th></tr></thead><tbody>${rows.map(({p,s})=>{
        const pct=s.plus50Possible&&s.capacity>0?s.plus50/s.capacity*100:null;
        return `<tr><td><strong>${esc(p.name)}</strong></td><td>${num.format(n(p.packageAmount))} ${esc(p.unit||'')}</td><td class="calc">${eur.format(s.packageCost)}</td><td class="calc">${eur.format(s.salePrice)}</td><td class="calc">${eur.format(s.extras)}</td><td class="calc">${num.format(s.capacity)} ks</td><td class="calc">${formatTarget(s.breakEven,s.breakEvenPossible)}</td><td class="calc">${formatTarget(s.plus50,s.plus50Possible)}</td><td class="calc">${pct===null?'—':`<strong>${num.format(pct)} %</strong>`}</td></tr>`;
      }).join('')||'<tr><td colspan="9" class="empty">Nie sú zadané jednoduché produkty s nákupným balením a predajnou cenou.</td></tr>'}</tbody></table></div>
      <div class="hint" style="margin-top:10px"><strong>Výpočet:</strong> cena celého otvoreného balenia + priebežné náklady na predané porcie (napr. poháre). Pri cieli +50 % musí tržba po odpočítaní týchto priebežných nákladov pokryť 150 % ceny balenia.</div>`;
  }
  window.renderOpenPackageTargets=renderTargets;

  const previousRenderAll=renderAll;
  renderAll=function(){previousRenderAll();renderTargets()};

  document.addEventListener('input',e=>{
    const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;
    if(s==='product'&&['packageAmount','packagePrice','saleAmount','salePrice'].includes(f))renderTargets();
    if(s==='item'&&['packageAmount','packagePrice'].includes(f))renderTargets();
    if(e.target?.dataset?.rfield==='amount')renderTargets();
  });
  document.addEventListener('change',e=>{
    const s=e.target?.dataset?.scope,f=e.target?.dataset?.field;
    if(s==='product'||s==='item'||e.target?.dataset?.rfield)setTimeout(renderTargets,0);
  });

  const style=document.createElement('style');
  style.textContent=`#openPackageTargetsPanel td.calc strong{white-space:nowrap}#openPackageTargetsPanel .bad{color:#b42318}`;
  document.head.appendChild(style);
  renderTargets();
})();
