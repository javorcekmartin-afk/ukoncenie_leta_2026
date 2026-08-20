function update(scope,id,key,value){
  if(scope==="product"){const x=state.products.find(x=>x.id===id);if(x)x[key]=value}
  if(scope==="item"){const x=state.items.find(x=>x.id===id);if(x)x[key]=value}
  if(scope==="inventory"){state.inventory[id]=state.inventory[id]||{actualPackages:"",actualUnitPrice:"",supplierOverride:"",note:""};state.inventory[id][key]=value}
  if(scope==="manual"){const x=state.manualInventory.find(x=>x.id===id);if(x)x[key]=value}
  if(scope==="cost"){const x=state.supplementalCosts.find(x=>x.id===id);if(x)x[key]=value}
}
const numericFields=new Set(["saleAmount","packageAmount","packagePrice","salePrice","plannedQty","plannedPackages","actualPackages","actualUnitPrice","qty","unitPrice"]);
document.addEventListener("input",e=>{
  const el=e.target,scope=el.dataset.scope,id=el.dataset.id,key=el.dataset.field;
  if(scope&&id&&key){update(scope,id,key,numericFields.has(key)?n(el.value):el.value);save();updateSummary();if(scope==="inventory"||scope==="manual")renderShops();return}
  if(el.id==="productSearch"){productQuery=el.value;renderProducts();return}
  if(["eventName","eventDate","eventPlace","targetMarkup","cashRevenue","terminalRevenue","cashFloat"].includes(el.id)){state.meta[el.id]=el.id==="targetMarkup"?n(el.value):el.value;save();updateSummary()}
});
document.addEventListener("change",e=>{const el=e.target,scope=el.dataset.scope,id=el.dataset.id,key=el.dataset.field;if(scope&&id&&key){update(scope,id,key,numericFields.has(key)?n(el.value):el.value);save();renderAll()}});
document.addEventListener("input",e=>{
  const el=e.target;
  if(el.dataset.scope!=="cost")return;
  const c=state.supplementalCosts.find(x=>x.id===el.dataset.id);
  const total=el.closest("tr")?.querySelector("[data-cost-total]");
  if(c&&total)total.textContent=eur.format(suppCalc(c).actual);
});

document.addEventListener("click",e=>{
  const tab=e.target.closest("[data-tab]");if(tab){document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active",b===tab));document.querySelectorAll(".tab").forEach(s=>s.classList.toggle("active",s.id==="tab-"+tab.dataset.tab));return}
  const b=e.target.closest("[data-action]");if(!b)return;const id=b.dataset.id;
  if(b.dataset.action==="recipe"){activeProduct=id;renderRecipe();recipeDialog.showModal()}
  if(b.dataset.action==="deleteProduct"){state.products=state.products.filter(x=>x.id!==id);delete state.inventory["product:"+id];save();renderAll()}
  if(b.dataset.action==="deleteItem"){const used=state.products.some(p=>(p.components||[]).some(c=>c.itemId===id));if(used&&!confirm("Položka sa používa v recepte. Naozaj ju zmazať?"))return;state.items=state.items.filter(x=>x.id!==id);state.products.forEach(p=>p.components=(p.components||[]).filter(c=>c.itemId!==id));delete state.inventory["item:"+id];save();renderAll()}
  if(b.dataset.action==="deleteCost"){state.supplementalCosts=state.supplementalCosts.filter(x=>x.id!==id);save();renderAll()}
  if(b.dataset.action==="deleteManualInventory"){state.manualInventory=state.manualInventory.filter(x=>x.id!==id);save();renderAll()}
  if(b.dataset.action==="deleteRecipeRow"){const p=state.products.find(x=>x.id===activeProduct);if(p){p.components.splice(Number(b.dataset.index),1);save();renderRecipe();renderAll()}}
});
addProduct.onclick=()=>{state.products.push({id:uid(),name:"Nový produkt",category:"Iné",mode:"simple",supplier:"",unit:"L",saleAmount:.5,packageAmount:1,packagePrice:0,salePrice:0,plannedQty:0,plannedPackages:0,components:[]});save();renderAll()};
addItem.onclick=()=>{state.items.push({id:uid(),name:"Nová položka",kind:"Surovina",unit:"L",packageAmount:1,packagePrice:0,plannedPackages:0,supplier:"",note:""});save();renderAll()};
addCost.onclick=()=>{state.supplementalCosts.push({id:uid(),name:"Nový náklad",category:"Ostatné",qty:1,unitPrice:0,note:""});save();renderAll()};
addManualInventory.onclick=()=>{state.manualInventory.push({id:uid(),name:"Nová nákupná položka",supplier:"",packageLabel:"1 balenie",packagePrice:0,plannedPackages:0,actualPackages:"",actualUnitPrice:"",note:""});save();renderAll()};
prefillActual.onclick=()=>{inventoryRows().forEach(r=>{const v=invState(r);if(String(v.actualPackages??"").trim()==="")v.actualPackages=n(r.planned);if(String(v.actualUnitPrice??"").trim()==="")v.actualUnitPrice=n(r.packagePrice)});save();renderAll()};

function renderRecipe(){const p=state.products.find(x=>x.id===activeProduct);if(!p)return;recipeTitle.textContent=(p.mode==="simple"?"Doplnky – ":"Receptúra – ")+p.name;recipeHelp.textContent=p.mode==="simple"?"Sem pridaj napr. pohár, slamku alebo servítku.":"Sem pridaj všetky suroviny a materiál jedného drinku.";recipeRows.innerHTML=(p.components||[]).map((c,idx)=>`<div class="recipe-row"><select data-ridx="${idx}" data-rfield="itemId">${state.items.map(i=>`<option value="${i.id}" ${i.id===c.itemId?"selected":""}>${esc(i.name)} (${esc(i.unit)})</option>`).join("")}</select><input type="text" inputmode="decimal" value="${esc(inputNum(c.amount))}" data-ridx="${idx}" data-rfield="amount"><button class="small danger" data-action="deleteRecipeRow" data-index="${idx}">×</button></div>`).join("")||`<div class="empty">Zatiaľ bez položiek.</div>`}
addRecipeRow.onclick=()=>{const p=state.products.find(x=>x.id===activeProduct);if(!p)return;if(!state.items.length){alert("Najprv pridaj položku v záložke 2.");return}p.components.push({itemId:state.items[0].id,amount:1});save();renderRecipe();renderAll()};
recipeRows.addEventListener("input",e=>{const p=state.products.find(x=>x.id===activeProduct);if(!p)return;const idx=Number(e.target.dataset.ridx),key=e.target.dataset.rfield;if(!Number.isInteger(idx)||!key)return;p.components[idx][key]=key==="amount"?n(e.target.value):e.target.value;save();updateSummary()});
recipeRows.addEventListener("change",e=>{const p=state.products.find(x=>x.id===activeProduct);if(!p)return;const idx=Number(e.target.dataset.ridx),key=e.target.dataset.rfield;if(!Number.isInteger(idx)||!key)return;p.components[idx][key]=key==="amount"?n(e.target.value):e.target.value;save();renderRecipe();renderAll()});
closeRecipe.onclick=()=>recipeDialog.close();doneRecipe.onclick=()=>recipeDialog.close();

function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500)}
exportJson.onclick=()=>download("stanok-data-v15.json",JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2),"application/json");
importJson.onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{state=normalize(JSON.parse(await f.text()));save();renderAll()}catch(err){alert("JSON sa nepodarilo načítať.")}e.target.value=""};
exportCsv.onclick=()=>{const t=totals(),rows=[["AKCIA",state.meta.eventName],["Pokladňa",t.rev.cash],["Terminál",t.rev.terminal],["- Vklad",-t.rev.float],["Skutočná tržba",t.rev.total??""],[],["INVENTÚRA","Položka","Obchod","Plán balení","Skutočne minuté balenia","Cena/balenie","Reálny náklad"]];inventoryRows().forEach(r=>{const c=invCalc(r);rows.push(["INVENTÚRA",r.name,rowSupplier(r),r.planned,c.actual,c.unitPrice,c.realCost])});rows.push([]);rows.push(["SÚHRN","Plán nákup",t.planPurchase,"Reálny náklad tovaru",t.actualPurchase,"Doplnkové náklady",t.suppActual,"Celkové reálne náklady",t.totalActualCosts,"Skutočný výsledok",t.actualResult??""]);const q=v=>`"${String(v??"").replaceAll('"','""')}"`;download("stanok-prehlad-v15.csv","\ufeff"+rows.map(r=>r.map(q).join(";")).join("\n"),"text/csv;charset=utf-8")};
window.addEventListener("load",async()=>{try{if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}}catch(e){}});
renderAll();
