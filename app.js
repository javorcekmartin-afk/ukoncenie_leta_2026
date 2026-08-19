const KEY="kostoliste_stanok_v8";
const OLD_KEY="kostoliste_stanok_v3";
const eur=new Intl.NumberFormat("sk-SK",{style:"currency",currency:"EUR",minimumFractionDigits:2});
const num=new Intl.NumberFormat("sk-SK",{maximumFractionDigits:2});
const pct0=new Intl.NumberFormat("sk-SK",{maximumFractionDigits:0});
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random();
const n=v=>{const x=Number(String(v??0).trim().replace(/\s/g,"").replace(",","."));return Number.isFinite(x)?x:0};
const inputNum=v=>String(v??"").replace(".",",");
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const roundUp=(v,step=.1)=>step>0?Math.ceil((v-1e-9)/step)*step:v;

function baseState(){
  const cup=uid(), gin=uid(), tonic=uid();
  return {
    version:8,
    meta:{eventName:"Ukončenie leta 2026",eventDate:"",eventPlace:"Kostolište",targetMarkup:200,cashRevenue:""},
    products:[
      {id:uid(),name:"Urpiner Classic 10°",category:"Pivo",mode:"simple",unit:"L",saleAmount:.5,packageAmount:50,packagePrice:66,salePrice:2,plannedQty:100,actualQty:0,otherCost:0,components:[{itemId:cup,amount:1}]},
      {id:uid(),name:"Gin & Tonic",category:"Mix drink",mode:"recipe",unit:"ks",saleAmount:1,packageAmount:1,packagePrice:0,salePrice:4.5,plannedQty:60,actualQty:0,otherCost:.06,components:[{itemId:gin,amount:.04},{itemId:tonic,amount:.15},{itemId:cup,amount:1}]}
    ],
    items:[
      {id:cup,name:"Pohár 0,5 l",kind:"Spotrebný materiál",unit:"ks",packageAmount:100,packagePrice:5,supplier:"",note:"Demo"},
      {id:gin,name:"Gin",kind:"Surovina",unit:"L",packageAmount:.7,packagePrice:13.9,supplier:"Ruža",note:"Demo"},
      {id:tonic,name:"Tonic",kind:"Surovina",unit:"L",packageAmount:1.5,packagePrice:1.32,supplier:"",note:"Demo"}
    ],
    inventory:{},
    supplementalCosts:[
      {id:uid(),name:"Prenájom miesta",category:"Prenájom",planAmount:0,qty:1,unitPrice:0,refund:0,note:""},
      {id:uid(),name:"Ľad",category:"Spotrebný materiál",planAmount:0,qty:1,unitPrice:0,refund:0,note:""},
      {id:uid(),name:"Výčap / technika",category:"Technika",planAmount:0,qty:1,unitPrice:0,refund:0,note:""}
    ]
  };
}

function migrateOld(old){
  if(!old||typeof old!=="object") return baseState();
  const s=baseState(); s.products=[]; s.items=[]; s.inventory={}; s.supplementalCosts=[];
  s.meta={
    eventName:old.meta?.eventName||"Ukončenie leta 2026",
    eventDate:old.meta?.eventDate||"",
    eventPlace:old.meta?.eventPlace||"Kostolište",
    targetMarkup:n(old.meta?.targetMarkup)||200,
    cashRevenue:old.meta?.cashRevenue??""
  };
  const oldIngredients=Array.isArray(old.ingredients)?old.ingredients:[];
  const ingMap=new Map(oldIngredients.map(i=>[i.id,i]));

  const sharedNeeded=new Set();
  (old.products||[]).forEach(p=>{
    const recipe=Array.isArray(p.recipe)?p.recipe:[];
    const directId=p.directIngredientId || recipe.find(r=>{
      const i=ingMap.get(r.ingredientId);
      return i && i.category!=="Spotrebný materiál";
    })?.ingredientId || null;
    const mode=p.mode==="recipe"?"recipe":"simple";

    if(mode==="recipe"){
      recipe.forEach(r=>sharedNeeded.add(r.ingredientId));
      s.products.push({
        id:p.id||uid(),name:p.name||"Produkt",category:p.category||"Iné",mode:"recipe",unit:"ks",
        saleAmount:1,packageAmount:1,packagePrice:0,salePrice:n(p.salePrice),plannedQty:n(p.plannedQty??p.estimatedUnits),
        actualQty:n(p.actualQty??p.actualUnits),otherCost:n(p.otherCost)+n(p.packagingCost),
        components:recipe.map(r=>({itemId:r.ingredientId,amount:n(r.amount)}))
      });
    } else {
      const direct=ingMap.get(directId);
      const directRow=recipe.find(r=>r.ingredientId===directId);
      recipe.filter(r=>r.ingredientId!==directId).forEach(r=>sharedNeeded.add(r.ingredientId));
      s.products.push({
        id:p.id||uid(),name:p.name||"Produkt",category:p.category||"Iné",mode:"simple",
        unit:direct?.unit||"L",saleAmount:n(directRow?.amount)||n(p.unitLiters)||.5,
        packageAmount:n(direct?.packageSize)||n(p.packageLiters)||1,
        packagePrice:n(direct?.packagePrice)||n(p.packagePrice),
        salePrice:n(p.salePrice),plannedQty:n(p.plannedQty??p.estimatedUnits),
        actualQty:n(p.actualQty??p.actualUnits),otherCost:n(p.otherCost)+n(p.packagingCost),
        components:recipe.filter(r=>r.ingredientId!==directId).map(r=>({itemId:r.ingredientId,amount:n(r.amount)}))
      });
    }
  });
  oldIngredients.forEach(i=>{
    if(sharedNeeded.has(i.id)){
      s.items.push({id:i.id,name:i.name||"Položka",kind:i.category==="Spotrebný materiál"?"Spotrebný materiál":"Surovina",unit:i.unit||"L",packageAmount:n(i.packageSize)||1,packagePrice:n(i.packagePrice),supplier:i.supplier||"",note:i.note||""});
    }
  });
  const oldCosts=old.supplementalCosts||old.fixedCosts||[];
  s.supplementalCosts=oldCosts.map(c=>({
    id:c.id||uid(),name:c.name||"Náklad",category:c.category||"Ostatné",
    planAmount:n(c.planAmount??c.amount),qty:n(c.qty||1),unitPrice:n(c.unitPrice??c.amount),refund:n(c.refund),note:c.note||""
  }));
  return s;
}

function normalize(s){
  if(!s||typeof s!=="object") return baseState();
  if(s.version!==8) return migrateOld(s);
  s.meta={eventName:"Ukončenie leta 2026",eventDate:"",eventPlace:"Kostolište",targetMarkup:200,cashRevenue:"",...(s.meta||{})};
  s.products=Array.isArray(s.products)?s.products:[];
  s.items=Array.isArray(s.items)?s.items:[];
  s.inventory=s.inventory&&typeof s.inventory==="object"?s.inventory:{};
  s.supplementalCosts=Array.isArray(s.supplementalCosts)?s.supplementalCosts:[];
  return s;
}

function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw) return normalize(JSON.parse(raw));
    const old=localStorage.getItem(OLD_KEY);
    if(old){
      const migrated=migrateOld(JSON.parse(old));
      localStorage.setItem(KEY,JSON.stringify(migrated));
      return migrated;
    }
  }catch(e){}
  return baseState();
}
let state=load(), productQuery="", activeProduct=null;

function save(){
  localStorage.setItem(KEY,JSON.stringify(state));
  const el=document.getElementById("saveStatus");
  if(el){el.textContent="Uložené ✓";clearTimeout(window._sv);window._sv=setTimeout(()=>el.textContent="Uložené lokálne",900)}
}
function item(id){return state.items.find(x=>x.id===id)}
function itemUnitCost(i){return i&&n(i.packageAmount)>0?n(i.packagePrice)/n(i.packageAmount):0}
function componentsCost(p){return (p.components||[]).reduce((s,c)=>s+n(c.amount)*itemUnitCost(item(c.itemId)),0)}
function baseCost(p){return p.mode==="simple"&&n(p.packageAmount)>0?n(p.saleAmount)*(n(p.packagePrice)/n(p.packageAmount)):0}
function productCalc(p){
  const b=baseCost(p), comp=componentsCost(p), other=n(p.otherCost), cost=b+comp+other, profit=n(p.salePrice)-cost;
  return {base:b,components:comp,cost,profit,markup:cost>0?profit/cost*100:0,recommended:roundUp(cost*(1+n(state.meta.targetMarkup)/100),.1)};
}

function inventoryRows(){
  const rows=[];
  state.products.forEach(p=>{
    if(p.mode==="simple" && n(p.packageAmount)>0 && n(p.saleAmount)>0){
      rows.push({
        key:"product:"+p.id,sourceId:p.id,name:p.name,type:"Produkt",unit:p.unit||"L",
        plannedNeed:n(p.saleAmount)*n(p.plannedQty),packageAmount:n(p.packageAmount),packagePrice:n(p.packagePrice),
        servingsPerPackage:n(p.packageAmount)/n(p.saleAmount)
      });
    }
  });
  const demand=new Map();
  state.products.forEach(p=>(p.components||[]).forEach(c=>{
    const prev=demand.get(c.itemId)||0; demand.set(c.itemId,prev+n(c.amount)*n(p.plannedQty));
  }));
  state.items.forEach(i=>{
    const need=demand.get(i.id)||0;
    if(need>0){
      rows.push({
        key:"item:"+i.id,sourceId:i.id,name:i.name,type:i.kind||"Surovina",unit:i.unit||"L",
        plannedNeed:need,packageAmount:n(i.packageAmount),packagePrice:n(i.packagePrice),servingsPerPackage:null
      });
    }
  });
  return rows;
}
function invState(key){
  state.inventory[key]=state.inventory[key]||{actualPackages:"",grossPurchase:"",returnedPackages:0,refund:"",openRemainder:0,note:""};
  return state.inventory[key];
}
function invCalc(r){
  const v=invState(r.key);
  const planPackages=r.packageAmount>0?Math.ceil(r.plannedNeed/r.packageAmount):0;
  const planPurchase=planPackages*r.packagePrice;
  const actualPackages=String(v.actualPackages)===""?0:n(v.actualPackages);
  const gross=String(v.grossPurchase)===""?0:n(v.grossPurchase);
  const returned=Math.min(actualPackages,n(v.returnedPackages));
  const avgPrice=actualPackages>0?gross/actualPackages:r.packagePrice;
  const autoRefund=returned*avgPrice;
  const refund=String(v.refund)===""?autoRefund:n(v.refund);
  const netAmount=Math.max(0,(actualPackages-returned)*r.packageAmount);
  const remainder=Math.max(0,n(v.openRemainder));
  const used=Math.max(0,netAmount-remainder);
  return {planPackages,planPurchase,actualPackages,gross,returned,refund,netAmount,remainder,used,netCost:Math.max(0,gross-refund)};
}
function suppCalc(c){const gross=n(c.qty)*n(c.unitPrice);return {gross,actual:Math.max(0,gross-n(c.refund))}}
function totals(){
  let planRevenue=0,planUnitCost=0,otherActual=0,actualByQty=0;
  state.products.forEach(p=>{
    const c=productCalc(p);
    planRevenue+=n(p.salePrice)*n(p.plannedQty);
    planUnitCost+=c.cost*n(p.plannedQty);
    otherActual+=n(p.otherCost)*n(p.actualQty);
    actualByQty+=n(p.salePrice)*n(p.actualQty);
  });
  const rows=inventoryRows();
  let planPurchase=0,actualPurchase=0,returnedValue=0;
  rows.forEach(r=>{const c=invCalc(r);planPurchase+=c.planPurchase;actualPurchase+=c.netCost;returnedValue+=c.refund});
  let suppPlan=0,suppActual=0;
  state.supplementalCosts.forEach(c=>{suppPlan+=n(c.planAmount);suppActual+=suppCalc(c).actual});
  const actualRevenue=String(state.meta.cashRevenue??"").trim()!==""?n(state.meta.cashRevenue):actualByQty;
  const contribution=planRevenue-planUnitCost;
  const ratio=planRevenue>0?contribution/planRevenue:0;
  const breakEven=ratio>0?suppPlan/ratio:0;
  return {
    planRevenue,planUnitCost,planPurchase,suppPlan,planResult:planRevenue-planUnitCost-suppPlan,breakEven,
    actualRevenue,actualPurchase,suppActual,otherActual,returnedValue,
    actualResult:actualRevenue-actualPurchase-suppActual-otherActual
  };
}

function field(scope,id,field,value,type="text",cls=""){
  const numeric=type==="num";
  return `<input class="${cls}" data-scope="${scope}" data-id="${id}" data-field="${field}" type="text" ${numeric?'inputmode="decimal" autocomplete="off"':""} value="${esc(numeric?inputNum(value):value)}">`;
}
function categorySelect(id,val){
  const cats=["Pivo","Víno","Destilát","Nealko","Mix drink","Iné"];
  return `<select data-scope="product" data-id="${id}" data-field="category">${cats.map(c=>`<option ${c===val?"selected":""}>${c}</option>`).join("")}</select>`
}
function modeSelect(p){
  return `<select data-scope="product" data-id="${p.id}" data-field="mode"><option value="simple" ${p.mode==="simple"?"selected":""}>Jednoduchý</option><option value="recipe" ${p.mode==="recipe"?"selected":""}>Receptúra</option></select>`
}
function unitSelect(scope,id,val){
  return `<select data-scope="${scope}" data-id="${id}" data-field="unit"><option ${val==="L"?"selected":""}>L</option><option ${val==="ks"?"selected":""}>ks</option></select>`
}
function kindSelect(i){
  return `<select data-scope="item" data-id="${i.id}" data-field="kind"><option ${i.kind==="Surovina"?"selected":""}>Surovina</option><option ${i.kind==="Spotrebný materiál"?"selected":""}>Spotrebný materiál</option></select>`
}
function unitField(p,fieldName){
  if(p.mode==="recipe") return `<span class="mini">cez receptúru</span>`;
  return `<div class="inline" style="flex-wrap:nowrap">${field("product",p.id,fieldName,p[fieldName],"num")}<span class="mini">${esc(p.unit||"L")}</span></div>`;
}

function renderProducts(){
  const body=document.getElementById("productBody"),q=productQuery.toLowerCase();
  const rows=state.products.filter(p=>!q||(p.name||"").toLowerCase().includes(q));
  body.innerHTML=rows.map(p=>{
    const c=productCalc(p), comp=(p.components||[]).map(x=>{const i=item(x.itemId);return i?`${i.name}: ${num.format(n(x.amount))} ${i.unit}`:""}).filter(Boolean).join(" + ");
    return `<tr>
      <td>${field("product",p.id,"name",p.name,"text","name")}</td>
      <td>${categorySelect(p.id,p.category)}</td><td>${modeSelect(p)}</td>
      <td>${unitField(p,"saleAmount")}</td>
      <td>${p.mode==="simple"?unitField(p,"packageAmount"):`<span class="mini">cez receptúru</span>`}</td>
      <td>${p.mode==="simple"?field("product",p.id,"packagePrice",p.packagePrice,"num"):`<span class="mini">cez receptúru</span>`}</td>
      <td>${field("product",p.id,"salePrice",p.salePrice,"num")}</td>
      <td>${field("product",p.id,"plannedQty",p.plannedQty,"num")}</td>
      <td>${field("product",p.id,"actualQty",p.actualQty,"num")}</td>
      <td><button class="small" data-action="recipe" data-id="${p.id}">${p.mode==="simple"?"Doplnky":"Receptúra"}</button><div class="mini" style="max-width:220px;margin-top:4px">${esc(comp||"bez položiek")}</div></td>
      <td class="calc">${eur.format(c.base)}</td><td class="calc">${eur.format(c.components)}</td>
      <td>${field("product",p.id,"otherCost",p.otherCost,"num")}</td>
      <td class="calc">${eur.format(c.cost)}</td><td class="calc ${c.profit>=0?"good":"bad"}">${eur.format(c.profit)}</td>
      <td class="calc">${pct0.format(c.markup)} %</td><td class="calc">${eur.format(c.recommended)}</td>
      <td><div class="row-actions"><button class="small" data-action="duplicateProduct" data-id="${p.id}">⧉</button><button class="small danger" data-action="deleteProduct" data-id="${p.id}">×</button></div></td>
    </tr>`;
  }).join("");
  productEmpty.hidden=rows.length>0;
}

function renderItems(){
  itemBody.innerHTML=state.items.map(i=>`<tr>
    <td>${field("item",i.id,"name",i.name,"text","name")}</td><td>${kindSelect(i)}</td><td>${unitSelect("item",i.id,i.unit)}</td>
    <td>${field("item",i.id,"packageAmount",i.packageAmount,"num")}</td><td>${field("item",i.id,"packagePrice",i.packagePrice,"num")}</td>
    <td class="calc">${eur.format(itemUnitCost(i))} / ${esc(i.unit)}</td>
    <td>${field("item",i.id,"supplier",i.supplier||"","text")}</td><td>${field("item",i.id,"note",i.note||"","text","note")}</td>
    <td><button class="small danger" data-action="deleteItem" data-id="${i.id}">×</button></td>
  </tr>`).join("");
  itemEmpty.hidden=state.items.length>0;
}

function renderInventory(){
  const rows=inventoryRows();
  inventoryBody.innerHTML=rows.map(r=>{
    const v=invState(r.key),c=invCalc(r);
    return `<tr>
      <td><strong>${esc(r.name)}</strong></td><td>${esc(r.type)}</td><td>${esc(r.unit)}</td>
      <td class="calc">${num.format(r.plannedNeed)} ${esc(r.unit)}</td>
      <td class="calc">${num.format(r.packageAmount)} ${esc(r.unit)}</td>
      <td class="calc">${r.servingsPerPackage?`${num.format(r.servingsPerPackage)} porcií`:"—"}</td>
      <td class="calc"><span class="pill">${c.planPackages}</span></td><td class="calc">${eur.format(c.planPurchase)}</td>
      <td>${field("inventory",r.key,"actualPackages",v.actualPackages,"num")}</td>
      <td>${field("inventory",r.key,"grossPurchase",v.grossPurchase,"num")}</td>
      <td>${field("inventory",r.key,"returnedPackages",v.returnedPackages,"num")}</td>
      <td>${field("inventory",r.key,"refund",v.refund,"num")}</td>
      <td>${field("inventory",r.key,"openRemainder",v.openRemainder,"num")}</td>
      <td class="calc">${num.format(c.used)} ${esc(r.unit)}</td>
      <td class="calc">${eur.format(c.netCost)}</td>
      <td>${field("inventory",r.key,"note",v.note||"","text","note")}</td>
    </tr>`;
  }).join("");
  inventoryEmpty.hidden=rows.length>0;
}

function costCategory(id,val){
  const cats=["Prenájom","Spotrebný materiál","Technika","Doprava","Personál","Poplatky","Ostatné"];
  return `<select data-scope="cost" data-id="${id}" data-field="category">${cats.map(c=>`<option ${c===val?"selected":""}>${c}</option>`).join("")}</select>`
}
function renderCosts(){
  costRows.innerHTML=state.supplementalCosts.map(c=>`<div class="costrow">
    ${field("cost",c.id,"name",c.name)}${costCategory(c.id,c.category)}
    ${field("cost",c.id,"planAmount",c.planAmount,"num")}${field("cost",c.id,"qty",c.qty,"num")}${field("cost",c.id,"unitPrice",c.unitPrice,"num")}
    ${field("cost",c.id,"note",c.note||"")}<button class="small danger" data-action="deleteCost" data-id="${c.id}">×</button>
  </div><div class="mini" style="margin:-4px 0 8px 2px">Skutočný náklad: ${eur.format(suppCalc(c).actual)} ${n(c.refund)>0?`(refund ${eur.format(n(c.refund))})`:""}</div>`).join("");
}

function updateSummary(){
  const t=totals(), map={
    planRevenue:t.planRevenue,planPurchase:t.planPurchase,planResult:t.planResult,breakEven:t.breakEven,
    actualRevenue:t.actualRevenue,actualPurchase:t.actualPurchase,actualSupplemental:t.suppActual,actualResult:t.actualResult,
    rPlanRevenue:t.planRevenue,rPlanUnitCost:t.planUnitCost,rSuppPlan:t.suppPlan,rPlanResult:t.planResult,rBreakEven:t.breakEven,
    rActualRevenue:t.actualRevenue,rActualPurchase:t.actualPurchase,rOtherActual:t.otherActual,rSuppActual:t.suppActual,rActualResult:t.actualResult
  };
  Object.entries(map).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=eur.format(v)});
  planResult.className="value "+(t.planResult>=0?"good":"bad");
  actualResult.className="value "+(t.actualResult>=0?"good":"bad");
  rPlanResult.className=t.planResult>=0?"good":"bad";rActualResult.className=t.actualResult>=0?"good":"bad";
}
function renderMeta(){
  eventName.value=state.meta.eventName||"";eventDate.value=state.meta.eventDate||"";eventPlace.value=state.meta.eventPlace||"";
  targetMarkup.value=inputNum(state.meta.targetMarkup);cashRevenue.value=inputNum(state.meta.cashRevenue??"");
}
function renderAll(){renderMeta();renderProducts();renderItems();renderInventory();renderCosts();updateSummary()}

function update(scope,id,key,value){
  if(scope==="product"){const x=state.products.find(x=>x.id===id);if(x)x[key]=value}
  if(scope==="item"){const x=state.items.find(x=>x.id===id);if(x)x[key]=value}
  if(scope==="inventory"){const x=invState(id);x[key]=value}
  if(scope==="cost"){const x=state.supplementalCosts.find(x=>x.id===id);if(x)x[key]=value}
}
const numericFields=new Set(["saleAmount","packageAmount","packagePrice","salePrice","plannedQty","actualQty","otherCost","actualPackages","grossPurchase","returnedPackages","refund","openRemainder","planAmount","qty","unitPrice"]);

document.addEventListener("input",e=>{
  const el=e.target,scope=el.dataset.scope,id=el.dataset.id,key=el.dataset.field;
  if(scope&&id&&key){update(scope,id,key,numericFields.has(key)?n(el.value):el.value);save();updateSummary();return}
  if(el.id==="productSearch"){productQuery=el.value;renderProducts();return}
  if(["eventName","eventDate","eventPlace","targetMarkup","cashRevenue"].includes(el.id)){
    state.meta[el.id]=["targetMarkup"].includes(el.id)?n(el.value):el.value;save();updateSummary();
  }
});
document.addEventListener("change",e=>{
  const el=e.target,scope=el.dataset.scope,id=el.dataset.id,key=el.dataset.field;
  if(scope&&id&&key){update(scope,id,key,numericFields.has(key)?n(el.value):el.value);save();renderAll()}
});

document.addEventListener("click",e=>{
  const tab=e.target.closest("[data-tab]");
  if(tab){document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active",b===tab));document.querySelectorAll(".tab").forEach(s=>s.classList.toggle("active",s.id==="tab-"+tab.dataset.tab));return}
  const b=e.target.closest("[data-action]");if(!b)return;const id=b.dataset.id;
  if(b.dataset.action==="recipe"){activeProduct=id;renderRecipe();recipeDialog.showModal()}
  if(b.dataset.action==="duplicateProduct"){const p=state.products.find(x=>x.id===id);if(p){const cp=structuredClone(p);cp.id=uid();cp.name+=" – kópia";state.products.push(cp);save();renderAll()}}
  if(b.dataset.action==="deleteProduct"){state.products=state.products.filter(x=>x.id!==id);delete state.inventory["product:"+id];save();renderAll()}
  if(b.dataset.action==="deleteItem"){
    const used=state.products.some(p=>(p.components||[]).some(c=>c.itemId===id));
    if(used&&!confirm("Položka sa používa v recepte alebo doplnkoch. Naozaj ju zmazať?"))return;
    state.items=state.items.filter(x=>x.id!==id);state.products.forEach(p=>p.components=(p.components||[]).filter(c=>c.itemId!==id));delete state.inventory["item:"+id];save();renderAll()
  }
  if(b.dataset.action==="deleteCost"){state.supplementalCosts=state.supplementalCosts.filter(x=>x.id!==id);save();renderAll()}
  if(b.dataset.action==="deleteRecipeRow"){const p=state.products.find(x=>x.id===activeProduct);if(p){p.components.splice(Number(b.dataset.index),1);save();renderRecipe();renderAll()}}
});

addProduct.onclick=()=>{state.products.push({id:uid(),name:"Nový produkt",category:"Iné",mode:"simple",unit:"L",saleAmount:.5,packageAmount:1,packagePrice:0,salePrice:0,plannedQty:0,actualQty:0,otherCost:0,components:[]});save();renderAll()};
addItem.onclick=()=>{state.items.push({id:uid(),name:"Nová položka",kind:"Surovina",unit:"L",packageAmount:1,packagePrice:0,supplier:"",note:""});save();renderAll()};
addCost.onclick=()=>{state.supplementalCosts.push({id:uid(),name:"Nový náklad",category:"Ostatné",planAmount:0,qty:1,unitPrice:0,refund:0,note:""});save();renderAll()};
prefillActual.onclick=()=>{
  inventoryRows().forEach(r=>{const v=invState(r.key),c=invCalc(r);v.actualPackages=c.planPackages;v.grossPurchase=c.planPurchase;if(String(v.refund)==="")v.refund=""});
  save();renderAll()
};

function renderRecipe(){
  const p=state.products.find(x=>x.id===activeProduct);if(!p)return;
  recipeTitle.textContent=(p.mode==="simple"?"Doplnky – ":"Receptúra – ")+p.name;
  recipeHelp.textContent=p.mode==="simple"?"Sem pridaj napr. pohár, slamku alebo servítku. Samotné pivo/víno je už zadané priamo pri produkte.":"Sem pridaj všetky suroviny a materiál, ktoré tvoria jeden predaný drink.";
  recipeRows.innerHTML=(p.components||[]).map((c,idx)=>`<div class="recipe-row">
    <select data-ridx="${idx}" data-rfield="itemId">${state.items.map(i=>`<option value="${i.id}" ${i.id===c.itemId?"selected":""}>${esc(i.name)} (${esc(i.unit)})</option>`).join("")}</select>
    <input type="text" inputmode="decimal" value="${esc(inputNum(c.amount))}" data-ridx="${idx}" data-rfield="amount">
    <button class="small danger" data-action="deleteRecipeRow" data-index="${idx}">×</button>
  </div>`).join("")||`<div class="empty">Zatiaľ bez položiek.</div>`;
}
addRecipeRow.onclick=()=>{const p=state.products.find(x=>x.id===activeProduct);if(!p)return;if(!state.items.length){alert("Najprv pridaj položku v záložke 2.");return}p.components.push({itemId:state.items[0].id,amount:1});save();renderRecipe();renderAll()};
recipeRows.addEventListener("input",e=>{const p=state.products.find(x=>x.id===activeProduct);if(!p)return;const idx=Number(e.target.dataset.ridx),key=e.target.dataset.rfield;if(!Number.isInteger(idx)||!key)return;p.components[idx][key]=key==="amount"?n(e.target.value):e.target.value;save();updateSummary()});
recipeRows.addEventListener("change",e=>{const p=state.products.find(x=>x.id===activeProduct);if(!p)return;const idx=Number(e.target.dataset.ridx),key=e.target.dataset.rfield;if(!Number.isInteger(idx)||!key)return;p.components[idx][key]=key==="amount"?n(e.target.value):e.target.value;save();renderRecipe();renderAll()});
closeRecipe.onclick=()=>recipeDialog.close();doneRecipe.onclick=()=>recipeDialog.close();

function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500)}
exportJson.onclick=()=>download("stanok-data-v8.json",JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2),"application/json");
importJson.onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{state=normalize(JSON.parse(await f.text()));save();renderAll()}catch(err){alert("JSON sa nepodarilo načítať.")}e.target.value=""};
exportCsv.onclick=()=>{
  const rows=[["Produkt","Typ","Predávané množstvo","Jednotka","Nákupné balenie","Nákupná cena balenia","Predajná cena","Plán ks","Skutočne ks","Celkový náklad/ks","Zisk/ks","Prirážka %"]];
  state.products.forEach(p=>{const c=productCalc(p);rows.push([p.name,p.mode,p.saleAmount,p.unit,p.packageAmount,p.packagePrice,p.salePrice,p.plannedQty,p.actualQty,c.cost,c.profit,c.markup])});
  rows.push([]);rows.push(["Inventúra","Položka","Plán spotreby","Balenie","Plán balení","Plán nákup","Kúpené balenia","Nákup brutto","Vrátené balenia","Vratka","Zvyšok otvoreného","Reálne minuté","Náklad po vratke"]);
  inventoryRows().forEach(r=>{const c=invCalc(r),v=invState(r.key);rows.push(["Inventúra",r.name,r.plannedNeed,r.packageAmount,c.planPackages,c.planPurchase,v.actualPackages,v.grossPurchase,v.returnedPackages,c.refund,v.openRemainder,c.used,c.netCost])});
  const q=v=>`"${String(v??"").replaceAll('"','""')}"`;download("stanok-prehlad-v8.csv","\ufeff"+rows.map(r=>r.map(q).join(";")).join("\n"),"text/csv;charset=utf-8")
};

window.addEventListener("load",async()=>{try{if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}}catch(e){}});

renderAll();