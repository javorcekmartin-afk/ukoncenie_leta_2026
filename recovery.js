// v20 – manuálna obnova lokálnych dát. Tento skript pri načítaní NIČ neprepisuje.
(function(){
  const PREFIX='kostoliste_stanok_';
  function escHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function snapshots(){
    const out=[];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(!key||!key.startsWith(PREFIX))continue;
      try{
        const raw=localStorage.getItem(key);if(!raw)continue;
        const data=JSON.parse(raw);if(!data||!Array.isArray(data.products))continue;
        out.push({key,raw,data,products:data.products.length,items:Array.isArray(data.items)?data.items.length:0,manual:Array.isArray(data.manualInventory)?data.manualInventory.length:0,names:data.products.map(p=>p?.name).filter(Boolean)});
      }catch(e){}
    }
    return out.sort((a,b)=>b.products-a.products||b.items-a.items||a.key.localeCompare(b.key));
  }
  function download(name,content){
    const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  function showRecovery(){
    const snaps=snapshots();
    let dlg=document.getElementById('recoveryDialog');
    if(!dlg){dlg=document.createElement('dialog');dlg.id='recoveryDialog';document.body.appendChild(dlg)}
    dlg.innerHTML=`<div class="dialog" style="min-width:min(920px,calc(100vw - 30px))"><div class="dialoghead"><div><h3>Obnova lokálnych dát</h3><div class="mini">Nič sa neobnoví automaticky. Vyber kópiu až po kontrole názvov produktov.</div></div><button id="closeRecovery">×</button></div><div class="dialogbody">${snaps.length?snaps.map((s,idx)=>`<div class="panel box" style="margin-bottom:10px"><div class="sectionhead" style="padding:0 0 8px"><div><strong>${escHtml(s.key)}</strong><div class="mini">${s.products} produktov · ${s.items} surovín/materiálov · ${s.manual} manuálnych položiek</div></div><div class="actions"><button class="small" data-export-snap="${idx}">Export JSON</button><button class="small primary" data-restore-snap="${idx}">Obnoviť túto kópiu</button></div></div><div class="mini" style="line-height:1.5"><strong>Produkty:</strong> ${s.names.length?escHtml(s.names.join(' · ')):'—'}</div></div>`).join(''):'<div class="empty">V tomto prehliadači sa nenašla žiadna lokálna kópia dát.</div>'}</div><div class="dialogactions"><button id="closeRecovery2">Zavrieť</button></div></div>`;
    dlg.querySelectorAll('[data-export-snap]').forEach(b=>b.onclick=()=>{const s=snaps[Number(b.dataset.exportSnap)];download('obnova-'+s.key+'.json',s.raw)});
    dlg.querySelectorAll('[data-restore-snap]').forEach(b=>b.onclick=()=>{
      const s=snaps[Number(b.dataset.restoreSnap)];
      if(!confirm(`Obnoviť kópiu „${s.key}“ s ${s.products} produktmi? Aktuálny stav sa predtým odloží do núdzovej zálohy.`))return;
      try{
        const currentKey=(typeof KEY!=='undefined'&&KEY)||'kostoliste_stanok_v15';
        const current=localStorage.getItem(currentKey);
        if(current)localStorage.setItem('kostoliste_stanok_emergency_before_restore_'+Date.now(),current);
        localStorage.setItem(currentKey,s.raw);
        location.reload();
      }catch(e){alert('Obnova sa nepodarila.');}
    });
    dlg.querySelector('#closeRecovery').onclick=()=>dlg.close();dlg.querySelector('#closeRecovery2').onclick=()=>dlg.close();dlg.showModal();
  }
  window.addEventListener('DOMContentLoaded',()=>{
    const actions=document.querySelector('.top .actions');if(!actions)return;
    const btn=document.createElement('button');btn.id='openRecovery';btn.textContent='Obnova dát';btn.onclick=showRecovery;actions.prepend(btn);
  });
})();
