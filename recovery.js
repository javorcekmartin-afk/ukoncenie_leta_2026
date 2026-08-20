// v31 – bezpečný bootstrap cloud synchronizácie.
// Hlavná aplikačná logika ani lokálne dáta sa tu nemenia.
(function(){
  if(document.getElementById('cloudBootstrapScript'))return;
  const s=document.createElement('script');
  s.id='cloudBootstrapScript';
  s.src='cloud_bootstrap.js?v=31';
  document.body.appendChild(s);
})();
