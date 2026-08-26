// v38 – bootstrap cloudu + výsledková vrstva + nákupné statusy + plán doplnkových nákladov + DPH + selektívny produktový zisk.
(function(){
  if(!document.getElementById('cloudBootstrapScript')){
    const s=document.createElement('script');
    s.id='cloudBootstrapScript';
    s.src='cloud_bootstrap.js?v=38';
    document.body.appendChild(s);
  }

  function loadV38(){
    if(typeof window.productActualPackageStats!=='function'||typeof window.actualItemDemand!=='function')return false;

    function loadSelectiveProfit(){
      if(document.getElementById('v38SelectiveProfitScript'))return;
      const p=document.createElement('script');
      p.id='v38SelectiveProfitScript';
      p.src='v38_selective_product_profit.js?v=38';
      p.onload=()=>{document.title='Stánok v38';const pill=document.querySelector('.top .pill');if(pill)pill.textContent='v38';renderAll()};
      document.body.appendChild(p);
    }

    function loadTruthful(){
      if(document.getElementById('v37TruthfulResultsScript')){loadSelectiveProfit();return;}
      const t=document.createElement('script');
      t.id='v37TruthfulResultsScript';
      t.src='v37_truthful_results.js?v=38';
      t.onload=loadSelectiveProfit;
      document.body.appendChild(t);
    }

    function loadVat(){
      if(document.getElementById('v36VatSummaryScript')){loadTruthful();return;}
      const v=document.createElement('script');
      v.id='v36VatSummaryScript';
      v.src='v36_vat_summary.js?v=38';
      v.onload=loadTruthful;
      document.body.appendChild(v);
    }

    function loadPlannedCosts(){
      if(document.getElementById('v35PlannedCostsScript')){loadVat();return;}
      const p=document.createElement('script');
      p.id='v35PlannedCostsScript';
      p.src='v35_planned_costs.js?v=38';
      p.onload=loadVat;
      document.body.appendChild(p);
    }

    function loadPurchaseStatus(){
      if(document.getElementById('v34PurchaseStatusScript')){loadPlannedCosts();return;}
      const p=document.createElement('script');
      p.id='v34PurchaseStatusScript';
      p.src='v34_purchase_status.js?v=38';
      p.onload=loadPlannedCosts;
      document.body.appendChild(p);
    }

    if(document.getElementById('v33ShopResultsScript')){loadPurchaseStatus();return true;}
    const s=document.createElement('script');
    s.id='v33ShopResultsScript';
    s.src='v33_shopping_results.js?v=38';
    s.onload=loadPurchaseStatus;
    document.body.appendChild(s);
    return true;
  }

  if(!loadV38()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(loadV38()||tries>80)clearInterval(timer)},125);
  }
})();
