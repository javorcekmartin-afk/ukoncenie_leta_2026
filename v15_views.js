function renderProducts(){
  const q=productQuery.toLowerCase(),rows=state.products.filter(p=>!q||(p.name||"").toLowerCase().includes(q));
  productBody.innerHTML=rows.map(p=>{const c=productCalc(p),comp=(p.components||[]).map(x=>{const i=item(x.itemId);return i?`${i.name}: ${num.format(n(x.amount))} ${i.unit}`:""}).filter(Boolean).join(" + "),shortage=c.plannedPackages<c.suggestedPackages;return `<tr><td>${field("product",p.id,"name",p.name,"text","name")}</td><td>${categorySelect(p.id,p.category)}</td><td>${modeSelect(p)}</td><td>${p.mode==="simple"?supplierField("product",p.id,"supplier",p.supplier||""):"—"}</td><td>${unitField(p,"saleAmount")}</td><td>${p.mode==="simple"?unitField(p,"packageAmount"):`<span class="mini">cez receptúru</span>`}</td><td class="calc">${p.mode==="simple"?num.format(c.servingsPerPackage):"—"}</td><td>${p.mode==="simple"?moneyField("product",p.id,"packagePrice",p.packagePrice):`<span class="mini">cez receptúru</span>`}</td><td class="calc">${eur.format(c.cost)}</td><td>${moneyField("product",p.id,"salePrice",p.salePrice)}</td><td class="calc ${c.profit>=0?"good":"bad"}">${eur.format(c.profit)}</td><td class="calc">${pct0.format(c.markup)} %</td><td>${field("product",p.id,"plannedQty",p.plannedQty,"num")}</td><td class="calc">${p.mode==="simple"?c.suggestedPackages:"—"}</td><td>${p.mode==="simple"?field("product",p.id,"plannedPackages",p.plannedPackages||c.suggestedPackages,"num"):`<span class="mini">z receptúry</span>`}${shortage?`<div class="mini bad">chýba ${c.suggestedPackages-c.plannedPackages}</div>`:""}</td><td class="calc">${p.mode==="simple"?`${num.format(c.capacity)} ks`:"—"}</td><td><button class="small" data-action="recipe" data-id="${p.id}">${p.mode==="simple"?"Doplnky":"Receptúra"}</button><div class="mini">${esc(comp||"bez položiek")}</div></td><td class="calc">${eur.format(c.recommended)}</td><td><button class="small danger" data-action="deleteProduct" data-id="${p.id}">×</button></td></tr>`}).join("");
  productEmpty.hidden=rows.length>0;
}
function renderItems(){
  itemBody.innerHTML=state.items.map(i=>{const need=itemDemand(i.id),min=itemSuggestedPackages(i),planned=itemPlannedPackages(i);return `<tr><td>${field("item",i.id,"name",i.name,"text","name")}</td><td>${kindSelect(i)}</td><td>${unitSelect("item",i.id,i.unit)}</td><td>${field("item",i.id,"packageAmount",i.packageAmount,"num")}</td><td>${moneyField("item",i.id,"packagePrice",i.packagePrice)}</td><td class="calc">${eur.format(itemUnitCost(i))} / ${esc(i.unit)}</td><td>${supplierField("item",i.id,"supplier",i.supplier||"")}</td><td class="calc">${num.format(need)} ${esc(i.unit)}</td><td class="calc">${min}</td><td>${field("item",i.id,"plannedPackages",planned,"num")}</td><td class="calc">${eur.format(planned*n(i.packagePrice))}</td><td>${field("item",i.id,"note",i.note||"")}</td><td><button class="small danger" data-action="deleteItem" data-id="${i.id}">×</button></td></tr>`}).join("");
  itemEmpty.hidden=state.items.length>0;
}
function renderInventory(){
  const rows=inventoryRows();
  inventoryBody.innerHTML=rows.map(r=>{
    const v=invState(r),c=invCalc(r),supplier=rowSupplier(r);
    const nameCell=r.manual?field("manual",r.sourceId,"name",v.name||"","text","name"):`<strong>${esc(r.name)}</strong>`;
    const supplierCell=r.manual?supplierField("manual",r.sourceId,"supplier",v.supplier||""):supplierField("inventory",r.key,"supplierOverride",v.supplierOverride||supplier);
    const packageCell=r.manual?field("manual",r.sourceId,"packageLabel",v.packageLabel||"1 balenie"):esc(r.packageLabel);
    const planCell=r.manual?field("manual",r.sourceId,"plannedPackages",v.plannedPackages||0,"num"):r.planned;
    const scope=r.manual?"manual":"inventory", id=r.manual?r.sourceId:r.key;
    return `<tr><td>${nameCell}</td><td>${supplierCell}</td><td>${packageCell}</td><td class="calc">${r.minimum||"—"}</td><td>${planCell}</td><td class="calc">${eur.format(c.planPurchase)}</td><td>${field(scope,id,"actualPackages",v.actualPackages??"","num")}</td><td>${moneyField(scope,id,"actualUnitPrice",v.actualUnitPrice??"")}</td><td class="calc">${eur.format(c.realCost)}</td><td>${field(scope,id,"note",v.note||"")}</td><td>${r.manual?`<button class="small danger" data-action="deleteManualInventory" data-id="${r.sourceId}">×</button>`:""}</td></tr>`;
  }).join("");
  inventoryEmpty.hidden=rows.length>0;
}
function costCategory(id,val){const cats=["Prenájom","Spotrebný materiál","Technika","Doprava","Personál","Poplatky","Ostatné"];return `<select data-scope="cost" data-id="${id}" data-field="category">${cats.map(c=>`<option ${c===val?"selected":""}>${c}</option>`).join("")}</select>`}
function renderCosts(){
  costBody.innerHTML=state.supplementalCosts.map(c=>`<tr>
    <td>${field("cost",c.id,"name",c.name,"text","name")}</td>
    <td>${costCategory(c.id,c.category)}</td>
    <td>${field("cost",c.id,"qty",c.qty,"num")}</td>
    <td>${moneyField("cost",c.id,"unitPrice",c.unitPrice)}</td>
    <td class="calc" data-cost-total>${eur.format(suppCalc(c).actual)}</td>
    <td>${field("cost",c.id,"note",c.note||"")}</td>
    <td><button class="small danger" data-action="deleteCost" data-id="${c.id}">×</button></td>
  </tr>`).join("");
  costEmpty.hidden=state.supplementalCosts.length>0
}
function renderSuppliers(){supplierList.innerHTML=suppliers().map(s=>`<option value="${esc(s)}"></option>`).join("")}
function renderShops(){const groups=shopSummary();shopGroups.innerHTML=groups.length?groups.map(g=>`<div class="panel box shopbox"><div class="sectionhead" style="padding:0 0 10px"><div><h2>${esc(g.supplier)}</h2><p>Plán ${eur.format(g.plan)} · Reálny náklad ${eur.format(g.actual)}</p></div></div><div class="tablewrap" style="max-height:none"><table style="min-width:760px"><thead><tr><th>Položka</th><th>Plán balení</th><th>Plán nákup</th><th>Skutočne minuté balenia</th><th>Reálny náklad</th></tr></thead><tbody>${g.rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${num.format(r.planned)}</td><td>${eur.format(r.planValue)}</td><td>${num.format(r.actual)}</td><td class="calc">${eur.format(r.actualValue)}</td></tr>`).join("")}</tbody></table></div></div>`).join(""):`<div class="panel empty">Zatiaľ nie sú nákupné položky.</div>`}
function setMoney(id,v,filled=true){const el=document.getElementById(id);if(el)el.textContent=filled?eur.format(v):"—"}
function updateSummary(){
  const t=totals();
  setMoney("planRevenue",t.planRevenue);
  setMoney("planPurchase",t.planPurchase);
  setMoney("planResult",t.planResult);
  setMoney("actualRevenue",t.actualRevenue,t.revenueFilled);
  setMoney("actualPurchase",t.actualPurchase);
  setMoney("actualSupplemental",t.suppActual);
  setMoney("totalActualCosts",t.totalActualCosts);
  setMoney("actualResult",t.actualResult,t.revenueFilled);
  setMoney("rPlanRevenue",t.planRevenue);
  setMoney("rPlanPurchase",t.planPurchase);
  setMoney("rPlanResult",t.planResult);
  setMoney("rCashRevenue",t.rev.cash,String(state.meta.cashRevenue??"").trim()!=="");
  setMoney("rTerminalRevenue",t.rev.terminal,String(state.meta.terminalRevenue??"").trim()!=="");
  setMoney("rCashFloat",-t.rev.float,String(state.meta.cashFloat??"").trim()!=="");
  setMoney("rActualRevenue",t.actualRevenue,t.revenueFilled);
  setMoney("rActualPurchase",t.actualPurchase);
  setMoney("rSuppActual",t.suppActual);
  setMoney("rTotalActualCosts",t.totalActualCosts);
  setMoney("rActualResult",t.actualResult,t.revenueFilled);
}
function renderMeta(){eventName.value=state.meta.eventName||"";eventDate.value=state.meta.eventDate||"";eventPlace.value=state.meta.eventPlace||"";targetMarkup.value=inputNum(state.meta.targetMarkup);cashRevenue.value=inputNum(state.meta.cashRevenue??"");terminalRevenue.value=inputNum(state.meta.terminalRevenue??"");cashFloat.value=inputNum(state.meta.cashFloat??"")}
function renderAll(){renderMeta();renderSuppliers();renderProducts();renderItems();renderInventory();renderCosts();renderShops();updateSummary()}
