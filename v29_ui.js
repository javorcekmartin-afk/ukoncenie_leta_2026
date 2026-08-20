// v29 – uprataný horný dashboard + odporúčaná cena v produktovom prehľade.
(function(){
  function enhanceProductOverview(){
    document.querySelectorAll('#tab-products tbody tr').forEach(tr=>{
      const id=tr.querySelector('[data-scope="product"]')?.dataset.id;
      const p=state.products.find(x=>x.id===id);if(!p)return;
      const c=productCalc(p);
      const metrics=[...tr.querySelectorAll('.stacked-metrics > div')];
      const target=metrics.find(div=>div.querySelector('span')?.textContent.trim()==='Zisk / balenie');
      if(target){
        const label=target.querySelector('span'),value=target.querySelector('strong');
        label.textContent='Odpor. cena';
        value.textContent=eur.format(c.recommended);
        value.classList.remove('good','bad');
      }
    });
  }

  const _renderProductsV29=renderProducts;
  renderProducts=function(){_renderProductsV29();enhanceProductOverview()};

  const style=document.createElement('style');
  style.textContent=`
    .top{align-items:flex-start;gap:18px;margin-bottom:14px}
    .top>div:first-child{min-width:280px;flex:1}
    .top .actions{display:flex;flex-wrap:wrap;gap:7px;justify-content:flex-end}
    .top h1{margin-bottom:4px}
    .top .subtitle{max-width:900px;line-height:1.45}

    .panel.event{padding:16px 18px;margin-bottom:14px;border-radius:16px}
    .panel.event .eventgrid{display:grid;grid-template-columns:minmax(220px,2fr) repeat(3,minmax(145px,1fr));gap:10px 12px;align-items:end}
    .panel.event .eventgrid>.field{margin:0;min-width:0}
    .panel.event .eventgrid>.field:nth-child(1){grid-column:span 2}
    .panel.event .eventgrid>.field:nth-child(n+4){background:#f7f9fc;border:1px solid #e7ebf2;border-radius:11px;padding:9px 10px}
    .panel.event .eventgrid>.field:nth-child(4){background:#f3f7ff;border-color:#dce7fb}
    .panel.event .eventgrid label{font-size:11px;font-weight:800;color:#586174;margin-bottom:5px}
    .panel.event .hint{background:#f8fafc;border-radius:9px;padding:8px 10px;color:#697386}

    .dashboard{gap:10px;margin-bottom:14px}
    .dashboard-group{padding:13px 14px;border-radius:16px}
    .dashboard-title{margin-bottom:10px;padding-bottom:7px;border-bottom:1px solid #edf0f5}
    .dashboard-group .card{min-height:92px;padding:11px 12px;display:flex;flex-direction:column;justify-content:center;border:1px solid #edf0f5;border-radius:12px}
    .dashboard-group .card .label{min-height:30px;display:flex;align-items:flex-end}
    .dashboard-group .card .value{margin:3px 0 2px}
    .dashboard-group .card .meta{line-height:1.25}
    .plan-group .group-cards{grid-template-columns:repeat(3,minmax(170px,1fr))}
    .actual-group .group-cards{grid-template-columns:repeat(5,minmax(150px,1fr))}

    #tab-products .stacked-metrics>div:has(span:first-child){min-height:18px}

    @media(max-width:1100px){
      .panel.event .eventgrid{grid-template-columns:repeat(2,minmax(180px,1fr))}
      .panel.event .eventgrid>.field:nth-child(1){grid-column:span 2}
      .actual-group .group-cards{grid-template-columns:repeat(3,1fr)}
    }
    @media(max-width:700px){
      .top{display:block}.top .actions{justify-content:flex-start;margin-top:10px}
      .panel.event .eventgrid{grid-template-columns:1fr}
      .panel.event .eventgrid>.field:nth-child(1){grid-column:auto}
      .plan-group .group-cards,.actual-group .group-cards{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);

  document.addEventListener('input',e=>{if(e.target?.id==='targetMarkup')setTimeout(enhanceProductOverview,0)});
  document.addEventListener('change',e=>{if(e.target?.id==='targetMarkup')setTimeout(enhanceProductOverview,0)});

  document.title='Stánok v29';
  const pill=document.querySelector('.top .pill');if(pill)pill.textContent='v29';
  enhanceProductOverview();
})();
