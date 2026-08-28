// v40 – evidencia položiek uhradených pred akciou + sumár podľa osoby.
(function(){
  if(window.__V40_PREPAID__)return;window.__V40_PREPAID__=true;

  state.prepaidBeforeEvent=state.prepaidBeforeEvent&&typeof state.prepaidBeforeEvent==='object'?state.prepaidBeforeEvent:{};

  function ensureTab(){
    const tabs=document.querySelector('.tabs');
    if(tabs&&!tabs.querySelector('[data-tab="prepaid"]')){
      const btn=document.createElement('button');
      btn.dataset.tab='prepaid';
      btn.textContent='6. Uhradené pred akciou';
      tabs.appendChild(btn);
    }
    if(!document.getElementById('tab-prepaid')){
      const shops=document.getElementById('tab-shops');
      const sec=document.createElement('section');
      sec.className='tab';sec.id='tab-prepaid';
      sec.innerHTML=`
        <div class="panel">
          <div class="sectionhead">
            <div><h2>Uhradené pred akciou</h2><p>Kompletný zoznam plánovaných nákupov. Označ, čo už bolo zaplatené a kto položku uhradil.</p></div>
          </div>
          <div class="prepaid-cards" id="prepaidCards"></div>
          <div class="tablewrap" style="margin-top:12px"><table class="prepaid-table" style="min-width:1150px"><thead><tr><th>Typ</th><th>Položka</th><th>Obchod</th><th>Plánované množstvo</th><th>Plánovaný náklad</th><th>Uhradené</th><th>Kto</th></tr></thead><tbody id="prepaidBody"></tbody></table></div>
        </div>
        <div class="panel box" style="margin-top:12px">
          <h2>Koľko komu vrátiť</h2>
          <p class="category-note">Počíta iba položky označené „Uhradené = Áno“.</p>
          <div id="prepaidPeopleSummary" style="margin-top:10px"></div>
        </div>`;
      if(shops)shops.insertAdjacentElement('afterend',sec);else document.querySelector('.wrap')?.appendChild(sec);
    }
  }

  function statusKey(type,id){return type+':'+id}
  function statusFor(type,id){
    const key=statusKey(type,id);
    state.prepaidBeforeEvent[key]=state.prepaidBeforeEvent[key]||{paid:'nie',who:''};
    return state.prepaidBeforeEvent[key];
  }
  function ynSelect(type,id,value){
    const v=String(value||'nie').toLowerCase()==='ano'?'ano':'nie';
    return `<select data-prepaid-type="${esc(type)}" data-prepaid-id="${esc(id)}" data-prepaid-field="paid"><option value="nie" ${v==='nie'?'selected':''}>Nie</option><option value="ano" ${v==='ano'?'selected':''}>Áno</option></select>`;
  }

  function prepaidRows(){
    const rows=[];
    inventoryRows().forEach(r=>{
      const c=invCalc(r);
      rows.push({type:r.source==='product'?'Produkt':r.source==='item'?'Materiál / surovina':'Manuálna položka',id:r.key,name:r.name,supplier:rowSupplier(r),planned:n(r.planned),detail:r.packageLabel||'',cost:n(c.planPurchase)});
    });
    state.supplementalCosts.forEach(c=>{
      const plannedQty=n(c.plannedQty===undefined?(c.qty??1):c.plannedQty);
      const plannedUnit=n(c.plannedUnitPrice===undefined?(c.unitPrice??0):c.plannedUnitPrice);
      rows.push({type:'Doplnkový náklad',id:c.id,name:c.name,supplier:(c.supplier||'').trim()||'Bez obchodu',planned:plannedQty,detail:c.category||'',cost:typeof window.suppPlanCalc==='function'?n(window.suppPlanCalc(c)):plannedQty*plannedUnit});
    });
    return rows;
  }

  function renderPrepaid(){
    ensureTab();
    const body=document.getElementById('prepaidBody'),cards=document.getElementById('prepaidCards'),summary=document.getElementById('prepaidPeopleSummary');
    if(!body||!cards||!summary)return;
    const rows=prepaidRows();
    const people=new Set();
    Object.values(state.prepaidBeforeEvent).forEach(x=>{if((x.who||'').trim())people.add(x.who.trim())});
    let total=0,paidTotal=0;
    body.innerHTML=rows.map(r=>{
      const st=statusFor(r.type,r.id),isPaid=st.paid==='ano';total+=r.cost;if(isPaid)paidTotal+=r.cost;
      return `<tr class="${isPaid?'prepaid-paid':''}"><td class="mini">${esc(r.type)}</td><td><strong>${esc(r.name)}</strong><div class="mini">${esc(r.detail||'')}</div></td><td>${esc(r.supplier)}</td><td class="calc">${num.format(r.planned)}</td><td class="calc"><strong>${eur.format(r.cost)}</strong></td><td>${ynSelect(r.type,r.id,st.paid)}</td><td><input type="text" list="prepaidPeopleList" placeholder="Meno" value="${esc(st.who||'')}" data-prepaid-type="${esc(r.type)}" data-prepaid-id="${esc(r.id)}" data-prepaid-field="who"></td></tr>`;
    }).join('')||'<tr><td colspan="7" class="empty">Zatiaľ nie sú žiadne plánované nákupné položky.</td></tr>';

    let dl=document.getElementById('prepaidPeopleList');
    if(!dl){dl=document.createElement('datalist');dl.id='prepaidPeopleList';document.body.appendChild(dl)}
    dl.innerHTML=[...people].sort((a,b)=>a.localeCompare(b,'sk')).map(x=>`<option value="${esc(x)}"></option>`).join('');

    cards.innerHTML=`<div class="card"><div class="label">Plánované náklady spolu</div><div class="value">${eur.format(total)}</div></div><div class="card result-card"><div class="label">Uhradené spolu</div><div class="value">${eur.format(paidTotal)}</div></div><div class="card"><div class="label">Ešte neuhradené</div><div class="value">${eur.format(Math.max(0,total-paidTotal))}</div></div>`;

    const grouped={};
    rows.forEach(r=>{
      const st=statusFor(r.type,r.id);if(st.paid!=='ano')return;
      const who=(st.who||'').trim()||'Nepriradené';
      const g=grouped[who]||(grouped[who]={who,total:0,count:0,names:[]});
      g.total+=r.cost;g.count++;g.names.push(r.name);
    });
    const groups=Object.values(grouped).sort((a,b)=>b.total-a.total||a.who.localeCompare(b.who,'sk'));
    summary.innerHTML=groups.length?`<div class="tablewrap" style="max-height:none"><table style="min-width:760px"><thead><tr><th>Kto</th><th>Počet položiek</th><th>Čo uhradil</th><th>Vrátiť</th></tr></thead><tbody>${groups.map(g=>`<tr><td><strong>${esc(g.who)}</strong></td><td class="calc">${g.count}</td><td class="mini">${esc(g.names.join(', '))}</td><td class="calc"><strong>${eur.format(g.total)}</strong></td></tr>`).join('')}<tr class="total-line"><td colspan="3"><strong>Spolu na vrátenie</strong></td><td class="calc"><strong>${eur.format(paidTotal)}</strong></td></tr></tbody></table></div>`:'<div class="empty">Zatiaľ nie je žiadna položka označená ako uhradená.</div>';
  }
  window.renderPrepaidBeforeEvent=renderPrepaid;

  document.addEventListener('change',e=>{
    const el=e.target;if(!el?.dataset?.prepaidField)return;
    const st=statusFor(el.dataset.prepaidType,el.dataset.prepaidId);
    st[el.dataset.prepaidField]=el.dataset.prepaidField==='paid'?(el.value==='ano'?'ano':'nie'):el.value;
    save();renderPrepaid();
  });
  document.addEventListener('input',e=>{
    const el=e.target;if(el?.dataset?.prepaidField!=='who')return;
    const st=statusFor(el.dataset.prepaidType,el.dataset.prepaidId);st.who=el.value;save();
  });

  const previousRenderAll=renderAll;
  renderAll=function(){previousRenderAll();renderPrepaid()};

  const style=document.createElement('style');
  style.textContent=`
    #tab-prepaid .prepaid-cards{display:grid;grid-template-columns:repeat(3,minmax(160px,1fr));gap:10px;margin-top:12px}
    #tab-prepaid .prepaid-paid>td{background:#eef8f0!important}
    #tab-prepaid .prepaid-paid>td:first-child{box-shadow:inset 4px 0 0 #6da47f}
    #tab-prepaid select{min-width:85px;font-weight:700}
    #tab-prepaid input[data-prepaid-field="who"]{min-width:150px}
    @media(max-width:700px){#tab-prepaid .prepaid-cards{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  ensureTab();renderPrepaid();
})();
