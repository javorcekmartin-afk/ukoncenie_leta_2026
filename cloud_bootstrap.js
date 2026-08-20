// v32 cloud bootstrap + produktová kontrola
(function(){
  if(!document.getElementById('cloudConfigScript')){
    const cfg=document.createElement('script');
    cfg.id='cloudConfigScript';
    cfg.src='cloud_config.js?v=32';
    cfg.onload=function(){
      if(document.getElementById('cloudSyncScript'))return;
      const sync=document.createElement('script');
      sync.id='cloudSyncScript';
      sync.src='cloud_sync.js?v=32';
      document.body.appendChild(sync);
    };
    document.body.appendChild(cfg);
  }

  if(!document.getElementById('productValidationScript')){
    const v=document.createElement('script');
    v.id='productValidationScript';
    v.src='v32_validation.js?v=32';
    document.body.appendChild(v);
  }
})();
