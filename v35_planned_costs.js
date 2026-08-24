// v35 – plánované doplnkové náklady vstupujú do plánovaného výsledku.
(function(){
  if(window.__V35_PLANNED_COSTS__)return;window.__V35_PLANNED_COSTS__=true;

  numericFields.add('plannedQty');
  numericFields.add('plannedUnitPrice');

  // Staršie náklady zachovaj: doterajšia hodnota sa pri prvom prechode použije aj ako plán.
  state.supplementalCosts=state.supplementalCosts.map(c=>({
    ...c,
    supplier:c.supplier||'',
    plannedQty:c.plannedQty===undefined?(c.qty??1):c.plannedQty,
    plannedUnitPrice:c.plannedUnitPrice===undefined?(c.unitPrice??0):c.plannedUnitPrice
  }));

  function suppPlanCalc(c){return Math.max(0,n(c.plannedQty)*n(c.plannedUnitPrice))}
  window.suppPlanCalc=suppPlanCalc;

  renderCosts=function(){
    costBody.innerHTML=state.supplementalCosts.map(c=>`<tr>
      <td>${field('cost',c.id,'name',c.name,'text','name')}</td>
      <td>${costCategory(c.id,c.category)}</td>
      <td>${supplierField('cost',c.id,'supplier',c.supplier||'')}</td>
      <td>${field('cost',c.id,'plannedQty',c.plannedQty??1,'num')}</td>
      <td>${moneyField('cost',c.id,'plannedUnitPrice',c.plannedUnitPrice??0)}</td>
      <td class="calc" data-plan-cost-total="${c.id}">${eur.format(suppPlanCalc(c))}</td>
      <td>${field('cost',c.id,'qty',c.qty??'','num')}</td>
      <td>${moneyField('cost',c.id,'unitPrice',c.unitPrice??'')}</td>
      <td class="calc" data-cost-total>${eur.format(suppCalc(c).actual)}</td>
      <td>${field('cost',c.id,'note',c.note||'')}</td>
      <td><button class="small danger" data-action="deleteCost" data-id="${c.id}">×</button></td>
    </tr>`).join('');
    costEmpty.hidden=state.supplementalCosts.length>0;
    const table=document.querySelector('#tab-costs table');
    if(table){
      table.style.minWidth='1500px';
      const hr=table.querySelector('thead tr');
      if(hr)hr.innerHTML='<th>Položka</th><th>Kategória</th><th>Obchod</th><th>Plán množstvo</th><th>Plán cena / jednotku</th><th>Plán náklad</th><th>Skutočné množstvo</th><th>Skutočná cena / jednotku</th><th>Skutočný náklad</th><th>Poznámka</th><th>Akcie</th>';
    }
  };

  addCost.onclick=()=>{
    state.supplementalCosts.push({id:uid(),name:'Nový náklad',category:'Ostatné',supplier:'',plannedQty:1,plannedUnitPrice:0,qty:'',unitPrice:'',note:''});
    save();renderAll();
  };

  // Plánovaný výsledok celej akcie = tržba - kalkulačný náklad predaja - známe doplnkové náklady.
  totals=function(){
    let planRevenue=0,planCost=0;
    state.products.forEach(p=>{
      const portions=typeof window.productPlannedPortions==='function'?window.productPlannedPortions(p):n(p.plannedQty);
      const calc=productCalc(p);
      planRevenue+=n(p.salePrice)*portions;
      planCost+=calc.cost*portions;
    });
    let planPurchase=0,actualPurchase=0;
    inventoryRows().forEach(r=>{const c=invCalc(r);planPurchase+=c.planPurchase;actualPurchase+=c.realCost});
    let planSupp=0,suppActual=0;
    state.supplementalCosts.forEach(c=>{planSupp+=suppPlanCalc(c);suppActual+=suppCalc(c).actual});
    const rev=revenueCalc();
    const planResult=planRevenue-planCost-planSupp;
    const totalActualCosts=actualPurchase+suppActual;
    const actualResult=rev.filled?rev.total-totalActualCosts:null;
    return {planRevenue,planCost,planPurchase,planSupp,planResult,actualRevenue:rev.total,actualPurchase,suppActual,totalActualCosts,actualResult,revenueFilled:rev.filled,rev};
  };

  function ensurePlanSupplementalUI(){
    const resultCard=document.getElementById('planResult')?.closest('.card');
    if(resultCard){
      const label=resultCard.querySelector('.label'),meta=resultCard.querySelector('.meta');
      if(label)label.textContent='Plánovaný čistý výsledok';
      if(meta)meta.textContent='tržba − náklad predaja − doplnkové náklady';
      if(!document.getElementById('planSupplemental')){
        const card=document.createElement('div');card.className='card';
        card.innerHTML='<div class="label">Plánované doplnkové náklady</div><div class="value" id="planSupplemental">0 €</div><div class="meta">známe náklady pred akciou</div>';
        resultCard.insertAdjacentElement('beforebegin',card);
      }
    }
    const rResult=document.getElementById('rPlanResult')?.closest('.resultitem');
    if(rResult){
      const label=rResult.querySelector('span');if(label)label.textContent='Plánovaný čistý výsledok';
      if(!document.getElementById('rPlanSupplemental')){
        const row=document.createElement('div');row.className='resultitem';
        row.innerHTML='<span>Plánované doplnkové náklady</span><strong id="rPlanSupplemental">0 €</strong>';
        rResult.insertAdjacentElement('beforebegin',row);
      }
    }
  }

  updateSummary=function(){
    ensurePlanSupplementalUI();
    const t=totals();
    setMoney('planRevenue',t.planRevenue);setMoney('planPurchase',t.planCost);setMoney('planSupplemental',t.planSupp);setMoney('planResult',t.planResult);
    setMoney('actualRevenue',t.actualRevenue,t.revenueFilled);setMoney('actualPurchase',t.actualPurchase);setMoney('actualSupplemental',t.suppActual);setMoney('totalActualCosts',t.totalActualCosts);setMoney('actualResult',t.actualResult,t.revenueFilled);
    setMoney('rPlanRevenue',t.planRevenue);setMoney('rPlanPurchase',t.planCost);setMoney('rPlanPackagePurchase',t.planPurchase);setMoney('rPlanSupplemental',t.planSupp);setMoney('rPlanResult',t.planResult);
    setMoney('rCashRevenue',t.rev.cash,String(state.meta.cashRevenue??'').trim()!=='');setMoney('rTerminalRevenue',t.rev.terminal,String(state.meta.terminalRevenue??'').trim()!=='');setMoney('rCashFloat',-t.rev.float,String(state.meta.cashFloat??'').trim()!=='');
    setMoney('rActualRevenue',t.actualRevenue,t.revenueFilled);setMoney('rActualPurchase',t.actualPurchase);setMoney('rSuppActual',t.suppActual);setMoney('rTotalActualCosts',t.totalActualCosts);setMoney('rActualResult',t.actualResult,t.revenueFilled);
  };

  // Zachovaj v nákupnom zozname aj plán doplnkových nákladov a v34 statusy.
  function purchaseStatus(type,id){
    const key='__purchase_status__:'+type+':'+id;
    state.inventory[key]=state.inventory[key]||{secured:'nie',closed:'nie'};
    return state.inventory[key];
  }
  shopSummary=function(){
    const groups={};
    function group(s){const supplier=(s||'').trim()||'Bez obchodu';return groups[supplier]||(groups[supplier]={supplier,rows:[],plan:0,actual:0})}
    inventoryRows().forEach(r=>{
      const c=invCalc(r),g=group(rowSupplier(r)),st=purchaseStatus('inventory',r.key);
      g.rows.push({statusType:'inventory',statusId:r.key,status:st,type:'Tovar',name:r.name,detail:r.packageLabel||'',planned:n(r.planned),planValue:c.planPurchase,actual:c.actual,actualValue:c.realCost});
      g.plan+=c.planPurchase;g.actual+=c.realCost;
    });
    state.supplementalCosts.forEach(c=>{
      const g=group(c.supplier),plan=suppPlanCalc(c),actual=suppCalc(c).actual,st=purchaseStatus('cost',c.id);
      g.rows.push({statusType:'cost',statusId:c.id,status:st,type:'Doplnkový náklad',name:c.name,detail:c.category||'',planned:n(c.plannedQty),planValue:plan,actual:n(c.qty),actualValue:actual});
      g.plan+=plan;g.actual+=actual;
    });
    return Object.values(groups).sort((a,b)=>a.supplier.localeCompare(b.supplier,'sk'));
  };

  document.addEventListener('input',e=>{
    const el=e.target;if(el?.dataset?.scope!=='cost')return;
    const c=state.supplementalCosts.find(x=>x.id===el.dataset.id);if(!c)return;
    if(el.dataset.field==='plannedQty'||el.dataset.field==='plannedUnitPrice'){
      const total=el.closest('tr')?.querySelector('[data-plan-cost-total]');if(total)total.textContent=eur.format(suppPlanCalc(c));
      updateSummary();renderShops();
    }
  });
  document.addEventListener('change',e=>{
    if(e.target?.dataset?.scope==='cost'&&(e.target.dataset.field==='plannedQty'||e.target.dataset.field==='plannedUnitPrice')){save();renderAll()}
  });

  ensurePlanSupplementalUI();
  save();
  renderAll();
})();
