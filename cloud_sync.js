// Cloud sync – localStorage ostáva bezpečná lokálna kópia, cloud je nadstavba.
(function(){
  const cfg=window.CLOUD_SYNC_CONFIG||{};
  if(!cfg.url||!cfg.key)return;

  const SETTINGS_KEY='kostoliste_cloud_settings_v1';
  let cloudSettings={eventCode:'',pin:''};
  try{cloudSettings={...cloudSettings,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch(e){}
  let cloudReady=false, cloudBusy=false, pushTimer=null, suppressPush=false;

  function headers(){
    const h={'apikey':cfg.key,'Content-Type':'application/json'};
    if(String(cfg.key).startsWith('eyJ'))h.Authorization='Bearer '+cfg.key;
    return h;
  }
  function rpc(name,body){
    return fetch(cfg.url.replace(/\/$/,'')+'/rest/v1/rpc/'+name,{method:'POST',headers:headers(),body:JSON.stringify(body)}).then(async r=>{
      const text=await r.text();
      if(!r.ok)throw new Error(text||('HTTP '+r.status));
      return text?JSON.parse(text):null;
    });
  }
  function validSettings(){return String(cloudSettings.eventCode||'').trim().length>=3&&String(cloudSettings.pin||'').length>=4}
  function saveSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(cloudSettings))}
  function setStatus(text,kind=''){
    let el=document.getElementById('cloudStatus');
    if(el){el.textContent=text;el.dataset.kind=kind}
    const btn=document.getElementById('openCloudSync');if(btn)btn.textContent=cloudReady?'Cloud ✓':'Cloud sync';
  }
  function currentState(){return JSON.parse(JSON.stringify(state))}

  async function pushCloud(showMessage=false){
    if(!cloudReady||!validSettings()||cloudBusy||suppressPush)return;
    cloudBusy=true;setStatus('Ukladám do cloudu…');
    try{
      await rpc('cloud_save_state',{p_event_code:cloudSettings.eventCode,p_pin:cloudSettings.pin,p_state:currentState()});
      setStatus('Cloud uložený ✓','ok');
      if(showMessage)alert('Aktuálne dáta boli uložené do cloudu.');
    }catch(e){setStatus('Cloud chyba','error');if(showMessage)alert('Uloženie do cloudu sa nepodarilo. '+e.message)}
    finally{cloudBusy=false}
  }

  async function pullCloud(showMessage=false){
    if(!validSettings())return false;
    cloudBusy=true;setStatus('Načítavam cloud…');
    try{
      const rows=await rpc('cloud_get_state',{p_event_code:cloudSettings.eventCode,p_pin:cloudSettings.pin});
      if(!Array.isArray(rows)||!rows.length){setStatus('Cloud je prázdny');if(showMessage)alert('Pre tento kód zatiaľ nie sú v cloude žiadne dáta. Najprv ich nahraj z PC.');return false}
      const remote=rows[0].state;
      if(!remote||!Array.isArray(remote.products))throw new Error('Neplatné cloudové dáta');
      suppressPush=true;
      try{
        const backup=localStorage.getItem(KEY);if(backup)localStorage.setItem('kostoliste_stanok_before_cloud_'+Date.now(),backup);
        state=normalize(remote);
        localStorage.setItem(KEY,JSON.stringify(state));
        renderAll();
      }finally{suppressPush=false}
      cloudReady=true;setStatus('Cloud načítaný ✓','ok');
      if(showMessage)alert('Dáta z cloudu boli načítané.');
      return true;
    }catch(e){setStatus('Cloud chyba','error');if(showMessage)alert('Načítanie cloudu sa nepodarilo. Skontroluj kód a PIN.');return false}
    finally{cloudBusy=false}
  }

  const originalSave=save;
  save=function(){
    originalSave();
    if(cloudReady&&!suppressPush){clearTimeout(pushTimer);pushTimer=setTimeout(()=>pushCloud(false),900)}
  };

  function dialog(){
    let dlg=document.getElementById('cloudSyncDialog');
    if(!dlg){dlg=document.createElement('dialog');dlg.id='cloudSyncDialog';document.body.appendChild(dlg)}
    dlg.innerHTML=`<div class="dialog" style="min-width:min(620px,calc(100vw - 30px))"><div class="dialoghead"><div><h3>Cloud synchronizácia</h3><div class="mini">Rovnaký kód akcie a PIN použiješ na PC aj mobile.</div></div><button id="closeCloudSync">×</button></div><div class="dialogbody"><div class="field"><label>Kód akcie</label><input id="cloudEventCode" value="${esc(cloudSettings.eventCode||'KOSTOLISTE2026')}"></div><div class="field" style="margin-top:10px"><label>PIN</label><input id="cloudPin" type="password" inputmode="numeric" value="${esc(cloudSettings.pin||'')}"></div><div class="hint" style="margin-top:12px">Na PC najprv použi <strong>Nahrať tento počítač do cloudu</strong>. Na mobile potom zadaj rovnaký kód a PIN a použi <strong>Načítať z cloudu</strong>.</div><div id="cloudStatus" class="status" style="margin-top:10px"></div></div><div class="dialogactions" style="display:flex;gap:8px;flex-wrap:wrap"><button id="cloudPull">Načítať z cloudu</button><button class="primary" id="cloudPush">Nahrať tento počítač do cloudu</button></div></div>`;
    dlg.querySelector('#closeCloudSync').onclick=()=>dlg.close();
    function capture(){cloudSettings.eventCode=dlg.querySelector('#cloudEventCode').value.trim().toUpperCase();cloudSettings.pin=dlg.querySelector('#cloudPin').value;saveSettings();return validSettings()}
    dlg.querySelector('#cloudPull').onclick=async()=>{if(!capture()){alert('Zadaj kód akcie a PIN s aspoň 4 znakmi.');return}cloudReady=true;await pullCloud(true)};
    dlg.querySelector('#cloudPush').onclick=async()=>{if(!capture()){alert('Zadaj kód akcie a PIN s aspoň 4 znakmi.');return}cloudReady=true;await pushCloud(true)};
    dlg.showModal();setStatus(cloudReady?'Cloud pripojený ✓':'Cloud zatiaľ nepripojený');
  }

  function init(){
    const actions=document.querySelector('.top .actions');
    if(actions&&!document.getElementById('openCloudSync')){const b=document.createElement('button');b.id='openCloudSync';b.textContent='Cloud sync';b.onclick=dialog;actions.prepend(b)}
    if(validSettings()){
      cloudReady=true;
      // Na známom zariadení načítaj cloud automaticky. Ak internet nie je dostupný, zostane lokálna kópia.
      setTimeout(()=>pullCloud(false),250);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
