// v36 – DPH prehľad skutočného výsledku pre platcu DPH.
(function(){
  if(window.__V36_VAT_SUMMARY__)return;window.__V36_VAT_SUMMARY__=true;

  if(state.meta.vatRate===undefined||state.meta.vatRate===null||state.meta.vatRate==='')state.meta.vatRate=23;
  numericFields.add('vatRate');

  function vatRate(){return Math.max(0,n(state.meta.vatRate))}
  function splitGross(gross){
    const rate=vatRate()/100;
    const g=Math.max(0,n(gross));
    const net=rate>0?g/(1+rate):g;
    return {gross:g,net,vat:g-net};
  }
  function vatStats(){
    const t=totals();
    const purchasesGross=n(t.actualPurchase)+n(t.suppActual);
    const purchase=splitGross(purchasesGross);
    const revenueFilled=!!t.revenueFilled;
    const revenue=revenueFilled?splitGross(n(t.actualRevenue)):{gross:null,net:null,vat:null};
    const vatDue=revenueFilled?revenue.vat-purchase.vat:null;
    const netProfit=revenueFilled?revenue.net-purchase.net:null;
    return {rate:vatRate(),purchase,revenue,vatDue,netProfit,revenueFilled,goodsGross:n(t.actualPurchase),suppGross:n(t.suppActual)};
  }
  window.vatSummaryStats=vatStats;

  function moneyOrDash(v){return v===null||v===undefined?'—':eur.format(v)}

  function renderVatSummary(){
    const tab=document.getElementById('tab-shops');if(!tab)return;
    let panel=document.getElementById('vatSummaryPanel');
    if(!panel){
      panel=document.createElement('div');panel.id='vatSummaryPanel';panel.className='panel box vat-summary-panel';panel.style.marginTop='12px';
      const actual=document.getElementById('actualProfitPanel');
      if(actual)actual.insertAdjacentElement('afterend',panel);else tab.appendChild(panel);
    }
    const s=vatStats();
    const dueLabel=s.vatDue!==null&&s.vatDue<0?'Nadmerný odpočet DPH':'DPH na úhradu';
    const dueValue=s.vatDue!==null&&s.vatDue<0?Math.abs(s.vatDue):s.vatDue;
    panel.innerHTML=`
      <div class="sectionhead" style="padding:0 0 10px;align-items:flex-end">
        <div><h2>DPH prehľad – skutočnosť</h2><p class="category-note">Počíta zo skutočne otvorených/minutých balení vrátane receptúr a doplnkov a zo skutočných doplnkových nákladov.</p></div>
        <label class="vat-rate-field"><span>DPH</span><div class="inline" style="flex-wrap:nowrap"><input id="vatRateInput" type="text" inputmode="decimal" value="${esc(inputNum(s.rate))}"><span class="mini">%</span></div></label>
      </div>
      <div class="vat-summary-grid">
        <div class="vat-block">
          <h3>Nákupy a náklady</h3>
          <div class="vat-row"><span>Skutočný nákup s DPH</span><strong>${eur.format(s.purchase.gross)}</strong></div>
          <div class="vat-detail"><span>Tovar, suroviny, receptúry a materiál</span><span>${eur.format(s.goodsGross)}</span></div>
          <div class="vat-detail"><span>Doplnkové náklady</span><span>${eur.format(s.suppGross)}</span></div>
          <div class="vat-row"><span>Nákup bez DPH</span><strong>${eur.format(s.purchase.net)}</strong></div>
          <div class="vat-row"><span>DPH na vstupe / odpočet</span><strong>${eur.format(s.purchase.vat)}</strong></div>
        </div>
        <div class="vat-block">
          <h3>Tržby a DPH</h3>
          <div class="vat-row"><span>Skutočná tržba s DPH</span><strong>${moneyOrDash(s.revenue.gross)}</strong></div>
          <div class="vat-row"><span>Tržba bez DPH</span><strong>${moneyOrDash(s.revenue.net)}</strong></div>
          <div class="vat-row"><span>DPH na výstupe</span><strong>${moneyOrDash(s.revenue.vat)}</strong></div>
          <div class="vat-row vat-due"><span>${dueLabel}</span><strong>${moneyOrDash(dueValue)}</strong></div>
          <div class="vat-row vat-profit"><span>Zisk očistený o DPH</span><strong class="${s.netProfit===null?'':s.netProfit>=0?'good':'bad'}">${moneyOrDash(s.netProfit)}</strong></div>
        </div>
      </div>
      <div class="hint" style="margin-top:10px">Výpočet predpokladá, že evidované ceny a tržby sú sumy s DPH a že sa na ne uplatňuje zvolená sadzba. Zisk očistený o DPH = tržba bez DPH − skutočné náklady bez DPH.</div>`;
  }

  const _renderShopsV36=renderShops;
  renderShops=function(){_renderShopsV36();renderVatSummary()};

  document.addEventListener('input',e=>{
    if(e.target?.id!=='vatRateInput')return;
    state.meta.vatRate=Math.max(0,n(e.target.value));
    save();renderVatSummary();
  });
  document.addEventListener('change',e=>{
    if(e.target?.id!=='vatRateInput')return;
    state.meta.vatRate=Math.max(0,n(e.target.value));save();renderVatSummary();
  });

  const style=document.createElement('style');
  style.textContent=`
    #tab-shops .vat-rate-field{display:grid;gap:4px;min-width:105px;font-size:12px;font-weight:700;color:#606a79}
    #tab-shops .vat-rate-field input{width:72px;text-align:right;font-weight:800}
    #tab-shops .vat-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    #tab-shops .vat-block{border:1px solid #e3e8ef;border-radius:12px;padding:14px;background:#fbfcfe}
    #tab-shops .vat-block h3{margin:0 0 9px;font-size:14px}
    #tab-shops .vat-row,#tab-shops .vat-detail{display:flex;justify-content:space-between;gap:18px;padding:7px 0;border-top:1px solid #edf0f4}
    #tab-shops .vat-row:first-of-type{border-top:0}
    #tab-shops .vat-row strong{white-space:nowrap}
    #tab-shops .vat-detail{font-size:11px;color:#747d8e;padding:4px 0 4px 12px;border-top:0}
    #tab-shops .vat-due{margin-top:5px;padding-top:10px;border-top:2px solid #dce2ea}
    #tab-shops .vat-profit{margin-top:4px;background:#f3f7f4;border-radius:8px;padding:9px 8px}
    @media(max-width:780px){#tab-shops .vat-summary-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  renderVatSummary();
})();
