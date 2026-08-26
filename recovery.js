// v37 – bootstrap cloudu + výsledková vrstva + nákupné statusy + plán doplnkových nákladov + DPH + spoľahlivé výsledky bez produktového zisku.
(function(){
  if(!document.getElementById('cloudBootstrapScript')){
    const s=document.createElement('script');
    s.id='cloudBootstrapScript';
    s.src='cloud_bootstrap.js?v=37';
    document.body.appendChild(s);
  }

  function loadV37(){
    if(typeof window.productActualPackageStats!=='function'||typeof window.actualItemDemand!=='function')return false;

    function loadTruthful(){
      if(document.getElementById('v37TruthfulResultsScript'))return;
      const t=document.createElement('script');
      t.id='v37TruthfulResultsScript';
      t.src='v37_truthful_results.js?v=37';
      t.onload=()=>{document.title='Stánok v37';const pill=document.querySelector('.top .pill');if(pill)pill.textContent='v37';renderAll()};
      document.body.appendChild(t);
    }

    function loadVat(){
      if(document.getElementById('v36VatSummaryScript')){loadTruthful();return;}
      const v=document.createElement('script');
      v.id='v36VatSummaryScript';
      v.src='v36_vat_summary.js?v=37';
      v.onload=loadTruthful;
      document.body.appendChild(v);
    }

    function loadPlannedCosts(){
      if(document.getElementById('v35PlannedCostsScript')){loadVat();return;}
      const p=document.createElement('script');
      p.id='v35PlannedCostsScript';
      p.src='v35_planned_costs.js?v=37';
      p.onload=loadVat;
      document.body.appendChild(p);
    }

    function loadPurchaseStatus(){
      if(document.getElementById('v34PurchaseStatusScript')){loadPlannedCosts();return;}
      const p=document.createElement('script');
      p.id='v34PurchaseStatusScript';
      p.src='v34_purchase_status.js?v=37';
      p.onload=loadPlannedCosts;
      document.body.appendChild(p);
    }

    if(document.getElementById('v33ShopResultsScript')){loadPurchaseStatus();return true;}
    const s=document.createElement('script');
    s.id='v33ShopResultsScript';
    s.src='v33_shopping_results.js?v=37';
    s.onload=loadPurchaseStatus;
    document.body.appendChild(s);
    return true;
  }

  if(!loadV37()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(loadV37()||tries>80)clearInterval(timer)},125);
  }
})();
