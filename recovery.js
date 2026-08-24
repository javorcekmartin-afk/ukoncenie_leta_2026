// v33 – bootstrap cloudu + bezpečné načítanie finálnej výsledkovej vrstvy.
(function(){
  if(!document.getElementById('cloudBootstrapScript')){
    const s=document.createElement('script');
    s.id='cloudBootstrapScript';
    s.src='cloud_bootstrap.js?v=33';
    document.body.appendChild(s);
  }

  function loadV33(){
    if(document.getElementById('v33ShopResultsScript'))return;
    // Počkaj, kým je načítaná balíková produktová aj inventúrna logika.
    if(typeof window.productActualPackageStats!=='function'||typeof window.actualItemDemand!=='function')return false;
    const s=document.createElement('script');
    s.id='v33ShopResultsScript';
    s.src='v33_shopping_results.js?v=33';
    s.onload=()=>{document.title='Stánok v33';const pill=document.querySelector('.top .pill');if(pill)pill.textContent='v33'};
    document.body.appendChild(s);
    return true;
  }

  if(!loadV33()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(loadV33()||tries>80)clearInterval(timer)},125);
  }
})();
