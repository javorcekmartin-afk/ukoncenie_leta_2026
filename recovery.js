// v47 – bootstrap cloudu + všetky predchádzajúce vrstvy + jednotné skutočne minuté balenia naprieč záložkami 2, 3 a 5.
(function(){
  if(!document.getElementById('cloudBootstrapScript')){
    const s=document.createElement('script');
    s.id='cloudBootstrapScript';
    s.src='cloud_bootstrap.js?v=47';
    document.body.appendChild(s);
  }

  function loadV47(){
    if(typeof window.productActualPackageStats!=='function'||typeof window.actualItemDemand!=='function')return false;

    function loadLinkedActualPackages(){
      if(document.getElementById('v47LinkedActualPackagesScript'))return;
      const x=document.createElement('script');
      x.id='v47LinkedActualPackagesScript';
      x.src='v47_linked_actual_packages.js?v=47';
      x.onload=()=>{document.title='Stánok v47';const pill=document.querySelector('.top .pill');if(pill)pill.textContent='v47';renderAll()};
      document.body.appendChild(x);
    }

    function loadShopActualUnits(){
      if(document.getElementById('v46ShopActualUnitsScript')){loadLinkedActualPackages();return;}
      const x=document.createElement('script');
      x.id='v46ShopActualUnitsScript';
      x.src='v46_shop_actual_units.js?v=47';
      x.onload=loadLinkedActualPackages;
      document.body.appendChild(x);
    }

    function loadManualItemActual(){
      if(document.getElementById('v45ManualItemActualScript')){loadShopActualUnits();return;}
      const x=document.createElement('script');
      x.id='v45ManualItemActualScript';
      x.src='v45_manual_item_actual.js?v=47';
      x.onload=loadShopActualUnits;
      document.body.appendChild(x);
    }

    function loadProfitInventory(){
      if(document.getElementById('v44ProfitInventoryScript')){loadManualItemActual();return;}
      const x=document.createElement('script');
      x.id='v44ProfitInventoryScript';
      x.src='v44_profit_inventory_summary.js?v=47';
      x.onload=loadManualItemActual;
      document.body.appendChild(x);
    }

    function loadOpenPackageTargets(){
      if(document.getElementById('v43OpenPackageTargetsScript')){loadProfitInventory();return;}
      const x=document.createElement('script');
      x.id='v43OpenPackageTargetsScript';
      x.src='v43_open_package_targets.js?v=47';
      x.onload=loadProfitInventory;
      document.body.appendChild(x);
    }

    function loadCategoryProfit(){
      if(document.getElementById('v42CategoryProfitScript')){loadOpenPackageTargets();return;}
      const x=document.createElement('script');
      x.id='v42CategoryProfitScript';
      x.src='v42_category_profit_only.js?v=47';
      x.onload=loadOpenPackageTargets;
      document.body.appendChild(x);
    }

    function loadPrepaid(){
      if(document.getElementById('v40PrepaidScript')){loadCategoryProfit();return;}
      const x=document.createElement('script');
      x.id='v40PrepaidScript';
      x.src='v40_prepaid_before_event.js?v=47';
      x.onload=loadCategoryProfit;
      document.body.appendChild(x);
    }

    function loadAllItems(){
      if(document.getElementById('v39AllItemsScript')){loadPrepaid();return;}
      const x=document.createElement('script');
      x.id='v39AllItemsScript';
      x.src='v39_all_items_in_shopping.js?v=47';
      x.onload=loadPrepaid;
      document.body.appendChild(x);
    }

    function loadSelectiveProfit(){
      if(document.getElementById('v38SelectiveProfitScript')){loadAllItems();return;}
      const p=document.createElement('script');
      p.id='v38SelectiveProfitScript';
      p.src='v38_selective_product_profit.js?v=47';
      p.onload=loadAllItems;
      document.body.appendChild(p);
    }

    function loadTruthful(){
      if(document.getElementById('v37TruthfulResultsScript')){loadSelectiveProfit();return;}
      const t=document.createElement('script');
      t.id='v37TruthfulResultsScript';
      t.src='v37_truthful_results.js?v=47';
      t.onload=loadSelectiveProfit;
      document.body.appendChild(t);
    }

    function loadVat(){
      if(document.getElementById('v36VatSummaryScript')){loadTruthful();return;}
      const v=document.createElement('script');
      v.id='v36VatSummaryScript';
      v.src='v36_vat_summary.js?v=47';
      v.onload=loadTruthful;
      document.body.appendChild(v);
    }

    function loadPlannedCosts(){
      if(document.getElementById('v35PlannedCostsScript')){loadVat();return;}
      const p=document.createElement('script');
      p.id='v35PlannedCostsScript';
      p.src='v35_planned_costs.js?v=47';
      p.onload=loadVat;
      document.body.appendChild(p);
    }

    function loadPurchaseStatus(){
      if(document.getElementById('v34PurchaseStatusScript')){loadPlannedCosts();return;}
      const p=document.createElement('script');
      p.id='v34PurchaseStatusScript';
      p.src='v34_purchase_status.js?v=47';
      p.onload=loadPlannedCosts;
      document.body.appendChild(p);
    }

    if(document.getElementById('v33ShopResultsScript')){loadPurchaseStatus();return true;}
    const s=document.createElement('script');
    s.id='v33ShopResultsScript';
    s.src='v33_shopping_results.js?v=47';
    s.onload=loadPurchaseStatus;
    document.body.appendChild(s);
    return true;
  }

  if(!loadV47()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(loadV47()||tries>80)clearInterval(timer)},125);
  }
})();
