// Cloud sync – bezpečný režim. LocalStorage ostáva lokálna záloha.
(function(){
  const cfg=window.CLOUD_SYNC_CONFIG||{};
  if(!cfg.url||!cfg.key)return;

  const SETTINGS_KEY='kostoliste_cloud_settings_v1';
  let cloudSettings={eventCode:'',pin:''};
  try{cloudSettings={...cloudSettings,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch(e){}
  let cloudReady=false,cloudBusy=false,pushTimer=null,suppressPush=false,sessionWriteEnabled=false;

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
    const el=document.getElementById('cloudStatus');if(el){el.textContent=text;el.dataset.kind=kind}
    const btn=document.getElementById('openCloudSync');if(btn)btn.textContent=cloudReady?'Cloud ✓':'Cloud sync';
  }
  function currentState(){return JSON.parse(JSON.stringify(state))}
  function localProductCount(){return Array.isArray(state?.products)?state.products.length:0}

  async function getRemote(){
    const rows=await rpc('cloud_get_state',{p_event_code:cloudSettings.eventCode,p_pin:cloudSettings.pin});
    return Array.isArray(rows)&&rows.length?rows[0]:null;
  }

  async function pushCloud(showMessage=false){
    if(!cloudReady||!validSettings()||cloudBusy||suppressPush)return false;
    cloudBusy=true;setStatus('Kontrolujem cloud…');
    try{
      const remote=await getRemote();
      const localCount=localProductCount();
      const remoteCount=Array.isArray(remote?.state?.products)?remote.state.products.length:0;

      // Kritická ochrana: zariadenie s menším počtom produktov nesmie prepísať bohatší cloud.
      if(remote&&remoteCount>localCount){
        sessionWriteEnabled=false;
        setStatus('Nahratie zablokované','error');
        if(showMessage)alert(`Nahratie bolo zablokované. Cloud obsahuje ${remoteCount} produktov, toto zariadenie iba ${localCount}. Najprv použi „Načítať z cloudu“; tým zabránime strate dát.`);
        return false;
      }

      if(showMessage&&remote){
        const ok=confirm(`Naozaj prepísať cloud dátami z tohto zariadenia?\n\nToto zariadenie: ${localCount} produktov\nCloud: ${remoteCount} produktov`);
        if(!ok){setStatus('Nahratie zrušené');return false}
      }

      await rpc('cloud_save_state',{p_event_code:cloudSettings.eventCode,p_pin:cloudSettings.pin,p_state:currentState()});
      cloudReady=true;sessionWriteEnabled=true;setStatus('Cloud uložený ✓','ok');
      if(showMessage)alert('Aktuálne dáta boli uložené do cloudu.');
      return true;
    }catch(e){setStatus('Cloud chyba','error');if(showMessage)alert('Uloženie do cloudu sa nepodarilo. '+e.message);return false}
    finally{cloudBusy=false}
  }

  async function pullCloud(showMessage=false){
    if(!validSettings()||cloudBusy)return false;
    cloudBusy=true;setStatus('Načítavam cloud…');
    try{
      const remoteRow=await getRemote();
      if(!remoteRow){setStatus('Cloud je prázdny');if(showMessage)alert('Pre tento kód zatiaľ nie sú v cloude žiadne dáta.');return false}
      const remote=remoteRow.state;
      if(!remote||!Array.isArray(remote.products))throw new Error('Neplatné cloudové dáta');
      suppressPush=true;
      try{
        const backup=localStorage.getItem(KEY);
        if(backup)localStorage.setItem('kostoliste_stanok_before_cloud_'+Date.now(),backup);
        state=normalize(remote);
        localStorage.setItem(KEY,JSON.stringify(state));
        renderAll();
      }finally{suppressPush=false}
      cloudReady=true;sessionWriteEnabled=true;setStatus('Cloud načítaný ✓','ok');
      if(showMessage)alert(`Dáta z cloudu boli načítané (${remote.products.length} produktov).`);
      return true;
    }catch(e){setStatus('Cloud chyba','error');if(showMessage)alert('Načítanie cloudu sa nepodarilo. Skontroluj kód a PIN.');return false}
    finally{cloudBusy=false}
  }

  const originalSave=save;
  save=function(){
    originalSave();
    // Automatický zápis je povolený až po úspešnom ručnom načítaní/nahratí v tejto relácii.
    if(cloudReady&&sessionWriteEnabled&&!suppressPush){clearTimeout(pushTimer);pushTimer=setTimeout(()=>pushCloud(false),900)}
  };

  function dialog(){
    let dlg=document.getElementById('cloudSyncDialog');
    if(!dlg){dlg=document.createElement('dialog');dlg.id='cloudSyncDialog';document.body.appendChild(dlg)}
    dlg.innerHTML=`<div class="dialog" style="min-width:min(620px,calc(100vw - 30px))"><div class="dialoghead"><div><h3>Cloud synchronizácia</h3><div class="mini">Rovnaký kód akcie a PIN používaj na všetkých zariadeniach.</div></div><button id="closeCloudSync">×</button></div><div class="dialogbody"><div class="field"><label>Kód akcie</label><input id="cloudEventCode" value="${esc(cloudSettings.eventCode||'KOSTOLISTE2026')}"></div><div class="field" style="margin-top:10px"><label>PIN</label><input id="cloudPin" type="password" inputmode="numeric" value="${esc(cloudSettings.pin||'')}"></div><div class="hint" style="margin-top:12px"><strong>Bezpečný režim:</strong> cloud sa po otvorení stránky nenačíta ani neprepíše automaticky. Na novom zariadení vždy najprv použi <strong>Načítať z cloudu</strong>. Nahratie zariadenia s menším počtom produktov než má cloud je automaticky zablokované.</div><div id="cloudStatus" class="status" style="margin-top:10px"></div></div><div class="dialogactions" style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" id="cloudPull">Načítať z cloudu</button><button id="cloudPush">Nahrať toto zariadenie do cloudu</button></div></div>`;
    dlg.querySelector('#closeCloudSync').onclick=()=>dlg.close();
    function capture(){cloudSettings.eventCode=dlg.querySelector('#cloudEventCode').value.trim().toUpperCase();cloudSettings.pin=dlg.querySelector('#cloudPin').value;saveSettings();return validSettings()}
    dlg.querySelector('#cloudPull').onclick=async()=>{if(!capture()){alert('Zadaj kód akcie a PIN s aspoň 4 znakmi.');return}await pullCloud(true)};
    dlg.querySelector('#cloudPush').onclick=async()=>{if(!capture()){alert('Zadaj kód akcie a PIN s aspoň 4 znakmi.');return}cloudReady=true;await pushCloud(true)};
    dlg.showModal();setStatus(cloudReady?'Cloud pripojený ✓':'Bezpečný režim – čaká na ručnú akciu');
  }

  function init(){
    const actions=document.querySelector('.top .actions');
    if(actions&&!document.getElementById('openCloudSync')){const b=document.createElement('button');b.id='openCloudSync';b.textContent='Cloud sync';b.onclick=dialog;actions.prepend(b)}
    // Zámerne žiadny automatický pull pri štarte.
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
