// v34 – bootstrap cloudu + výsledková vrstva + stav nákupného zoznamu.
(function(){
  if(!document.getElementById('cloudBootstrapScript')){
    const s=document.createElement('script');
    s.id='cloudBootstrapScript';
    s.src='cloud_bootstrap.js?v=34';
    document.body.appendChild(s);
  }

  function loadV34(){
    if(document.getElementById('v33ShopResultsScript'))return true;
    if(typeof window.productActualPackageStats!=='function'||typeof window.actualItemDemand!=='function')return false;
    const s=document.createElement('script');
    s.id='v33ShopResultsScript';
    s.src='v33_shopping_results.js?v=34';
    s.onload=()=>{
      if(!document.getElementById('v34PurchaseStatusScript')){
        const p=document.createElement('script');
        p.id='v34PurchaseStatusScript';
        p.src='v34_purchase_status.js?v=34';
        p.onload=()=>{document.title='Stánok v34';const pill=document.querySelector('.top .pill');if(pill)pill.textContent='v34'};
        document.body.appendChild(p);
      }
    };
    document.body.appendChild(s);
    return true;
  }

  if(!loadV34()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(loadV34()||tries>80)clearInterval(timer)},125);
  }
})();
