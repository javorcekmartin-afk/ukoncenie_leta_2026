// v35 – bootstrap cloudu + výsledková vrstva + nákupné statusy + plán doplnkových nákladov.
(function(){
  if(!document.getElementById('cloudBootstrapScript')){
    const s=document.createElement('script');
    s.id='cloudBootstrapScript';
    s.src='cloud_bootstrap.js?v=35';
    document.body.appendChild(s);
  }

  function loadV35(){
    if(typeof window.productActualPackageStats!=='function'||typeof window.actualItemDemand!=='function')return false;

    function loadPlannedCosts(){
      if(document.getElementById('v35PlannedCostsScript'))return;
      const p=document.createElement('script');
      p.id='v35PlannedCostsScript';
      p.src='v35_planned_costs.js?v=35';
      p.onload=()=>{document.title='Stánok v35';const pill=document.querySelector('.top .pill');if(pill)pill.textContent='v35'};
      document.body.appendChild(p);
    }

    function loadPurchaseStatus(){
      if(document.getElementById('v34PurchaseStatusScript')){loadPlannedCosts();return;}
      const p=document.createElement('script');
      p.id='v34PurchaseStatusScript';
      p.src='v34_purchase_status.js?v=35';
      p.onload=loadPlannedCosts;
      document.body.appendChild(p);
    }

    if(document.getElementById('v33ShopResultsScript')){loadPurchaseStatus();return true;}
    const s=document.createElement('script');
    s.id='v33ShopResultsScript';
    s.src='v33_shopping_results.js?v=35';
    s.onload=loadPurchaseStatus;
    document.body.appendChild(s);
    return true;
  }

  if(!loadV35()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(loadV35()||tries>80)clearInterval(timer)},125);
  }
})();
