// v25 – plánovaný zisk sa počíta z kalkulačného nákladu skutočne plánovaného predaja,
// nie z nákupu celých balení. Nákup balení zostáva samostatná informačná hodnota.
(function(){
  const _baseTotals=totals;

  totals=function(){
    const t=_baseTotals();
    let planConsumptionCost=0;
    state.products.forEach(p=>{
      planConsumptionCost += productCalc(p).cost * n(p.plannedQty);
    });
    const planProfit = t.planRevenue - planConsumptionCost;
    return {...t,planConsumptionCost,planResult:planProfit,planProfit};
  };

  function ensurePlanDashboard(){
    const group=document.querySelector('.plan-group .group-cards');
    if(!group)return;
    group.style.gridTemplateColumns='repeat(4,minmax(150px,1fr))';
    group.innerHTML=`
      <div class="card plan"><div class="label">Plánovaná tržba</div><div class="value" id="planRevenue">0 €</div><div class="meta">predajná cena × plán ks</div></div>
      <div class="card plan"><div class="label">Kalkulačný náklad predaja</div><div class="value" id="planConsumptionCost">0 €</div><div class="meta">náklad / ks × plán predaja</div></div>
      <div class="card plan"><div class="label">Plánovaný nákup balení</div><div class="value" id="planPurchase">0 €</div><div class="meta">celé balenia, ktoré treba nakúpiť</div></div>
      <div class="card plan emphasis"><div class="label">Plánovaný zisk</div><div class="value" id="planResult">0 €</div><div class="meta">tržba − kalkulačný náklad predaja</div></div>`;
  }

  const _updateSummaryV25=updateSummary;
  updateSummary=function(){
    _updateSummaryV25();
    const t=totals();
    setMoney('planConsumptionCost',t.planConsumptionCost);
    setMoney('planResult',t.planResult);
    setMoney('rPlanResult',t.planResult);
  };

  function updateResultLabels(){
    const planSection=document.querySelector('#tab-shops .result-section:first-child');
    if(!planSection)return;
    const items=planSection.querySelectorAll('.resultitem');
    if(items[1])items[1].querySelector('span').textContent='Plánovaný nákup celých balení';
    if(items[2])items[2].querySelector('span').textContent='Plánovaný zisk z predaja';
    let extra=document.getElementById('rPlanConsumptionRow');
    if(!extra&&items[1]){
      extra=document.createElement('div');
      extra.id='rPlanConsumptionRow';extra.className='resultitem';
      extra.innerHTML='<span>Kalkulačný náklad plánovaného predaja</span><strong id="rPlanConsumptionCost">0 €</strong>';
      items[1].insertAdjacentElement('afterend',extra);
    }
    const t=totals();
    setMoney('rPlanConsumptionCost',t.planConsumptionCost);
  }

  const _renderShopsV25=renderShops;
  renderShops=function(){
    _renderShopsV25();
    updateResultLabels();
  };

  // Pri každom prerenderovaní ostáva nový dashboard zachovaný.
  ensurePlanDashboard();
  updateSummary();
  updateResultLabels();
})();
