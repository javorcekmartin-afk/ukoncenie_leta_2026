// v14 – zjednodušenie doplnkových nákladov
// Doplnkový náklad = skutočné množstvo × cena za jednotku.

// Jednorazová migrácia starého poľa „Plán“: ak nebola zadaná reálna cena,
// prenesieme plánovanú sumu ako 1 × cena, aby sa starý údaj nestratil.
state.supplementalCosts = (state.supplementalCosts || []).map(c => {
  const unitPrice = n(c.unitPrice);
  const oldPlan = n(c.planAmount);
  if (unitPrice === 0 && oldPlan > 0) {
    return {...c, qty: 1, unitPrice: oldPlan};
  }
  return {...c, qty: n(c.qty || 1)};
});
save();

suppCalc = function(c) {
  return {actual: Math.max(0, n(c.qty) * n(c.unitPrice))};
};

totals = function() {
  let planRevenue = 0;
  state.products.forEach(p => planRevenue += n(p.salePrice) * n(p.plannedQty));

  let planPurchase = 0, actualPurchase = 0;
  inventoryRows().forEach(r => {
    const c = invCalc(r);
    planPurchase += c.planPurchase;
    actualPurchase += c.realCost;
  });

  let suppActual = 0;
  state.supplementalCosts.forEach(c => suppActual += suppCalc(c).actual);

  const rev = revenueCalc();
  const planResult = planRevenue - planPurchase;
  const actualResult = rev.filled ? rev.total - actualPurchase - suppActual : null;
  const cover = hasInventory() ? actualPurchase + suppActual : planPurchase;

  return {
    planRevenue,
    planPurchase,
    suppPlan: 0,
    planResult,
    breakEven: cover,
    actualRevenue: rev.total,
    actualPurchase,
    suppActual,
    actualResult,
    revenueFilled: rev.filled,
    rev
  };
};

renderCosts = function() {
  costBody.innerHTML = state.supplementalCosts.map(c => `<tr>
    <td>${field("cost",c.id,"name",c.name,"text","name")}</td>
    <td>${costCategory(c.id,c.category)}</td>
    <td>${field("cost",c.id,"qty",c.qty,"num")}</td>
    <td>${moneyField("cost",c.id,"unitPrice",c.unitPrice)}</td>
    <td class="calc" data-cost-total>${eur.format(suppCalc(c).actual)}</td>
    <td>${field("cost",c.id,"note",c.note||"")}</td>
    <td><button class="small danger" data-action="deleteCost" data-id="${c.id}">×</button></td>
  </tr>`).join("");
  costEmpty.hidden = state.supplementalCosts.length > 0;
};

addCost.onclick = () => {
  state.supplementalCosts.push({
    id: uid(),
    name: "Nový náklad",
    category: "Ostatné",
    qty: 1,
    unitPrice: 0,
    note: ""
  });
  save();
  renderAll();
};

// Pri písaní množstva/ceny aktualizuj súčet v riadku okamžite bez straty fokusu.
document.addEventListener("input", e => {
  const el = e.target;
  if (el.dataset.scope !== "cost") return;
  const c = state.supplementalCosts.find(x => x.id === el.dataset.id);
  const row = el.closest("tr");
  const total = row?.querySelector("[data-cost-total]");
  if (c && total) total.textContent = eur.format(suppCalc(c).actual);
  updateSummary();
});

renderCosts();
updateSummary();
