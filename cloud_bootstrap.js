// v31 cloud bootstrap
(function(){
  if(document.getElementById('cloudConfigScript'))return;
  const cfg=document.createElement('script');
  cfg.id='cloudConfigScript';
  cfg.src='cloud_config.js?v=31';
  cfg.onload=function(){
    if(document.getElementById('cloudSyncScript'))return;
    const sync=document.createElement('script');
    sync.id='cloudSyncScript';
    sync.src='cloud_sync.js?v=31';
    document.body.appendChild(sync);
  };
  document.body.appendChild(cfg);
})();
