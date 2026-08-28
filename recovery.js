// v40 – bootstrap cloudu + výsledková vrstva + nákupné statusy + plán doplnkových nákladov + DPH + selektívny produktový zisk + všetky položky zo záložky 2 + evidencia úhrad pred akciou.
(function(){
  if(!document.getElementById('cloudBootstrapScript')){
    const s=document.createElement('script');
    s.id='cloudBootstrapScript';
    s.src='cloud_bootstrap.js?v=40';
    document.body.appendChild(s);
  }

  function loadV40(){
    if(typeof window.productActualPackageStats!=='function'||typeof window.actualItemDemand!=='function')return false;

    function loadPrepaid(){
      if(document.getElementById('v40PrepaidScript'))return;
      const x=document.createElement('script');
      x.id='v40PrepaidScript';
      x.src='v40_prepaid_before_event.js?v=40';
      x.onload=()=>{document.title='Stánok v40';const pill=document.querySelector('.top .pill');if(pill)pill.textContent='v40';renderAll()};
      document.body.appendChild(x);
    }

    function loadAllItems(){
      if(document.getElementById('v39AllItemsScript')){loadPrepaid();return;}
      const x=document.createElement('script');
      x.id='v39AllItemsScript';
      x.src='v39_all_items_in_shopping.js?v=40';
      x.onload=loadPrepaid;
      document.body.appendChild(x);
    }

    function loadSelectiveProfit(){
      if(document.getElementById('v38SelectiveProfitScript')){loadAllItems();return;}
      const p=document.createElement('script');
      p.id='v38SelectiveProfitScript';
      p.src='v38_selective_product_profit.js?v=40';
      p.onload=loadAllItems;
      document.body.appendChild(p);
    }

    function loadTruthful(){
      if(document.getElementById('v37TruthfulResultsScript')){loadSelectiveProfit();return;}
      const t=document.createElement('script');
      t.id='v37TruthfulResultsScript';
      t.src='v37_truthful_results.js?v=40';
      t.onload=loadSelectiveProfit;
      document.body.appendChild(t);
    }

    function loadVat(){
      if(document.getElementById('v36VatSummaryScript')){loadTruthful();return;}
      const v=document.createElement('script');
      v.id='v36VatSummaryScript';
      v.src='v36_vat_summary.js?v=40';
      v.onload=loadTruthful;
      document.body.appendChild(v);
    }

    function loadPlannedCosts(){
      if(document.getElementById('v35PlannedCostsScript')){loadVat();return;}
      const p=document.createElement('script');
      p.id='v35PlannedCostsScript';
      p.src='v35_planned_costs.js?v=40';
      p.onload=loadVat;
      document.body.appendChild(p);
    }

    function loadPurchaseStatus(){
      if(document.getElementById('v34PurchaseStatusScript')){loadPlannedCosts();return;}
      const p=document.createElement('script');
      p.id='v34PurchaseStatusScript';
      p.src='v34_purchase_status.js?v=40';
      p.onload=loadPlannedCosts;
      document.body.appendChild(p);
    }

    if(document.getElementById('v33ShopResultsScript')){loadPurchaseStatus();return true;}
    const s=document.createElement('script');
    s.id='v33ShopResultsScript';
    s.src='v33_shopping_results.js?v=40';
    s.onload=loadPurchaseStatus;
    document.body.appendChild(s);
    return true;
  }

  if(!loadV40()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(loadV40()||tries>80)clearInterval(timer)},125);
  }
})();
