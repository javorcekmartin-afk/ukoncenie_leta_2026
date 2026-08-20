// v17 – kategórie produktov dostávajú praktický význam vo výsledku.
// Skutočné tržby podľa kategórií neodhadujeme, pretože neevidujeme skutočne predané kusy.

function categorySummary(){
  const groups={};
  let totalRevenue=0;
  state.products.forEach(p=>{
    const category=(p.category||"Iné").trim()||"Iné";
    const qty=n(p.plannedQty);
    const revenue=n(p.salePrice)*qty;
    const calc=productCalc(p);
    const theoreticalCost=calc.cost*qty;
    const theoreticalProfit=revenue-theoreticalCost;
    const g=groups[category]||(groups[category]={category,qty:0,revenue:0,cost:0,profit:0,products:0});
    g.qty+=qty;
    g.revenue+=revenue;
    g.cost+=theoreticalCost;
    g.profit+=theoreticalProfit;
    g.products+=1;
    totalRevenue+=revenue;
  });
  return Object.values(groups)
    .map(g=>({...g,share:totalRevenue>0?g.revenue/totalRevenue*100:0}))
    .sort((a,b)=>b.revenue-a.revenue||a.category.localeCompare(b.category,"sk"));
}

function renderCategorySummary(){
  const host=document.getElementById("categorySummary");
  if(!host)return;
  const rows=categorySummary();
  if(!rows.length){
    host.innerHTML='<div class="empty">Zatiaľ nie sú produkty na kategorizáciu.</div>';
    return;
  }
  host.innerHTML=`<div class="tablewrap" style="max-height:none;margin-top:0"><table style="min-width:850px">
    <thead><tr><th>Kategória</th><th>Produktov</th><th>Plán predaja ks</th><th>Plánovaná tržba</th><th>Kalkulačný náklad</th><th>Plánovaný zisk z predaja</th><th>Podiel na tržbe</th></tr></thead>
    <tbody>${rows.map(g=>`<tr>
      <td><strong>${esc(g.category)}</strong></td>
      <td class="calc">${num.format(g.products)}</td>
      <td class="calc">${num.format(g.qty)}</td>
      <td class="calc">${eur.format(g.revenue)}</td>
      <td class="calc">${eur.format(g.cost)}</td>
      <td class="calc ${g.profit>=0?"good":"bad"}">${eur.format(g.profit)}</td>
      <td class="calc">${num.format(g.share)} %</td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

const _renderShopsV16=renderShops;
renderShops=function(){
  _renderShopsV16();
  renderCategorySummary();
};

renderCategorySummary();
