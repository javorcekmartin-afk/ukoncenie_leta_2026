const KEY="kostoliste_stanok_v15";
const OLD_KEYS=["kostoliste_stanok_v13","kostoliste_stanok_v12","kostoliste_stanok_v11","kostoliste_stanok_v10","kostoliste_stanok_v9","kostoliste_stanok_v8","kostoliste_stanok_v3"];
const eur=new Intl.NumberFormat("sk-SK",{style:"currency",currency:"EUR",minimumFractionDigits:2});
const num=new Intl.NumberFormat("sk-SK",{maximumFractionDigits:2});
const pct0=new Intl.NumberFormat("sk-SK",{maximumFractionDigits:0});
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random();
const n=v=>{const x=Number(String(v??0).trim().replace(/\s/g,"").replace(",","."));return Number.isFinite(x)?x:0};
const inputNum=v=>String(v??"").replace(".",",");
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const roundUp=(v,step=.1)=>step>0?Math.ceil((v-1e-9)/step)*step:v;

function baseState(){
  const cup=uid(),gin=uid(),tonic=uid();
  return {
    version:15,
    meta:{eventName:"Ukončenie leta 2026",eventDate:"",eventPlace:"Kostolište",targetMarkup:200,cashRevenue:"",terminalRevenue:"",cashFloat:""},
    products:[
      {id:uid(),name:"Urpiner Classic 10°",category:"Pivo",mode:"simple",supplier:"Urpiner",unit:"L",saleAmount:.5,packageAmount:50,packagePrice:79,salePrice:2,plannedQty:500,plannedPackages:5,components:[{itemId:cup,amount:1}]},
      {id:uid(),name:"Gin & Tonic",category:"Mix drink",mode:"recipe",supplier:"",unit:"ks",saleAmount:1,packageAmount:1,packagePrice:0,salePrice:4.5,plannedQty:60,plannedPackages:0,components:[{itemId:gin,amount:.04},{itemId:tonic,amount:.15},{itemId:cup,amount:1}]}
    ],
    items:[
      {id:cup,name:"Pohár 0,5 l",kind:"Spotrebný materiál",unit:"ks",packageAmount:100,packagePrice:5,plannedPackages:5,supplier:"Metro",note:"Demo"},
      {id:gin,name:"Gin",kind:"Surovina",unit:"L",packageAmount:.7,packagePrice:13.9,plannedPackages:4,supplier:"Ruža",note:"Demo"},
      {id:tonic,name:"Tonic",kind:"Surovina",unit:"L",packageAmount:1.5,packagePrice:1.32,plannedPackages:6,supplier:"Metro",note:"Demo"}
    ],
    inventory:{},manualInventory:[],
    supplementalCosts:[
      {id:uid(),name:"Prenájom miesta",category:"Prenájom",qty:1,unitPrice:0,note:""},
      {id:uid(),name:"Ľad",category:"Spotrebný materiál",qty:1,unitPrice:0,note:""},
      {id:uid(),name:"Výčap / technika",category:"Technika",qty:1,unitPrice:0,note:""}
    ]
  };
}
function migrateOld(old){
  if(!old||typeof old!=="object")return baseState();
  const s=baseState();s.products=[];s.items=[];s.inventory={};s.manualInventory=[];s.supplementalCosts=[];
  s.meta={eventName:old.meta?.eventName||"Ukončenie leta 2026",eventDate:old.meta?.eventDate||"",eventPlace:old.meta?.eventPlace||"Kostolište",targetMarkup:n(old.meta?.targetMarkup)||200,cashRevenue:old.meta?.cashRevenue??"",terminalRevenue:old.meta?.terminalRevenue??"",cashFloat:old.meta?.cashFloat??""};
  if(Array.isArray(old.items))s.items=old.items.map(i=>({...i,id:i.id||uid(),supplier:i.supplier||"",plannedPackages:n(i.plannedPackages)}));
  else if(Array.isArray(old.ingredients))s.items=old.ingredients.map(i=>({id:i.id||uid(),name:i.name||"Položka",kind:i.category==="Spotrebný materiál"?"Spotrebný materiál":"Surovina",unit:i.unit||"L",packageAmount:n(i.packageSize)||1,packagePrice:n(i.packagePrice),plannedPackages:0,supplier:i.supplier||"",note:i.note||""}));
  s.products=(old.products||[]).map(p=>{const saleAmount=n(p.saleAmount??p.unitLiters)||.5,packageAmount=n(p.packageAmount??p.packageLiters)||1,suggested=packageAmount>0&&saleAmount>0?Math.ceil(n(p.plannedQty??p.estimatedUnits)*saleAmount/packageAmount):0;return {id:p.id||uid(),name:p.name||"Produkt",category:p.category||"Iné",mode:p.mode||"simple",supplier:p.supplier||"",unit:p.unit||"L",saleAmount,packageAmount,packagePrice:n(p.packagePrice),salePrice:n(p.salePrice),plannedQty:n(p.plannedQty??p.estimatedUnits),plannedPackages:n(p.plannedPackages)||suggested,components:Array.isArray(p.components)?p.components:(Array.isArray(p.recipe)?p.recipe.map(r=>({itemId:r.ingredientId,amount:n(r.amount)})):[])}});
  const oldInv=old.inventory&&typeof old.inventory==="object"?old.inventory:{};
  Object.entries(oldInv).forEach(([key,v])=>{const actual=String(v.usedPackages??"").trim()!==""?v.usedPackages:(String(v.actualPackages??"").trim()!==""?v.actualPackages:"");s.inventory[key]={actualPackages:actual,actualUnitPrice:v.actualUnitPrice??"",supplierOverride:v.supplierOverride??"",note:v.note??""}});
  if(Array.isArray(old.manualInventory))s.manualInventory=old.manualInventory.map(x=>({id:x.id||uid(),name:x.name||"Manuálna položka",supplier:x.supplier||"",packageLabel:x.packageLabel||"1 balenie",packagePrice:n(x.packagePrice),plannedPackages:n(x.plannedPackages),actualPackages:String(x.usedPackages??"").trim()!==""?x.usedPackages:(x.actualPackages??""),actualUnitPrice:x.actualUnitPrice??"",note:x.note||""}));
  s.supplementalCosts=(old.supplementalCosts||old.fixedCosts||[]).map(c=>{let qty=n(c.qty||1),unitPrice=n(c.unitPrice??c.amount),oldPlan=n(c.planAmount??c.amount);if(unitPrice===0&&oldPlan>0){qty=1;unitPrice=oldPlan}return {id:c.id||uid(),name:c.name||"Náklad",category:c.category||"Ostatné",qty,unitPrice,note:c.note||""}});
  return s;
}
function normalize(s){
  if(!s||typeof s!=="object")return baseState();
  s.meta={eventName:"Ukončenie leta 2026",eventDate:"",eventPlace:"Kostolište",targetMarkup:200,cashRevenue:"",terminalRevenue:"",cashFloat:"",...(s.meta||{})};
  s.products=Array.isArray(s.products)?s.products:[];s.items=Array.isArray(s.items)?s.items:[];s.inventory=s.inventory&&typeof s.inventory==="object"?s.inventory:{};s.manualInventory=Array.isArray(s.manualInventory)?s.manualInventory:[];s.supplementalCosts=Array.isArray(s.supplementalCosts)?s.supplementalCosts:[];
  s.supplementalCosts=s.supplementalCosts.map(c=>{let qty=n(c.qty||1),unitPrice=n(c.unitPrice),oldPlan=n(c.planAmount);if(unitPrice===0&&oldPlan>0){qty=1;unitPrice=oldPlan}return {id:c.id||uid(),name:c.name||"Náklad",category:c.category||"Ostatné",qty,unitPrice,note:c.note||""}});
  s.products=s.products.map(p=>({...p,supplier:p.supplier||""}));s.items=s.items.map(i=>({...i,supplier:i.supplier||"",plannedPackages:n(i.plannedPackages)}));s.version=15;return s;
}
function load(){try{const raw=localStorage.getItem(KEY);if(raw)return normalize(JSON.parse(raw));for(const k of OLD_KEYS){const old=localStorage.getItem(k);if(old){const m=normalize(migrateOld(JSON.parse(old)));localStorage.setItem(KEY,JSON.stringify(m));return m}}}catch(e){}return baseState()}
let state=load(),productQuery="",activeProduct=null;
function save(){localStorage.setItem(KEY,JSON.stringify(state));const el=document.getElementById("saveStatus");if(el){el.textContent="Uložené ✓";clearTimeout(window._sv);window._sv=setTimeout(()=>el.textContent="Uložené lokálne",900)}}
function item(id){return state.items.find(x=>x.id===id)}
function itemUnitCost(i){return i&&n(i.packageAmount)>0?n(i.packagePrice)/n(i.packageAmount):0}
function componentsCost(p){return (p.components||[]).reduce((s,c)=>s+n(c.amount)*itemUnitCost(item(c.itemId)),0)}
function baseCost(p){return p.mode==="simple"&&n(p.packageAmount)>0?n(p.saleAmount)*(n(p.packagePrice)/n(p.packageAmount)):0}
function productCalc(p){const b=baseCost(p),comp=componentsCost(p),cost=b+comp,profit=n(p.salePrice)-cost,servings=p.mode==="simple"&&n(p.saleAmount)>0?n(p.packageAmount)/n(p.saleAmount):0,suggested=p.mode==="simple"&&n(p.packageAmount)>0?Math.ceil(n(p.plannedQty)*n(p.saleAmount)/n(p.packageAmount)):0,planned=n(p.plannedPackages)||suggested;return {base:b,components:comp,cost,profit,markup:cost>0?profit/cost*100:0,recommended:roundUp(cost*(1+n(state.meta.targetMarkup)/100),.1),servingsPerPackage:servings,suggestedPackages:suggested,plannedPackages:planned,capacity:servings*planned}}
function itemDemand(id){let total=0;state.products.forEach(p=>(p.components||[]).forEach(c=>{if(c.itemId===id)total+=n(c.amount)*n(p.plannedQty)}));return total}
function itemSuggestedPackages(i){const need=itemDemand(i.id);return n(i.packageAmount)>0?Math.ceil(need/n(i.packageAmount)):0}
function itemPlannedPackages(i){return n(i.plannedPackages)||itemSuggestedPackages(i)}
function sourceInventoryRows(){const rows=[];state.products.forEach(p=>{if(p.mode==="simple"&&n(p.packageAmount)>0&&n(p.saleAmount)>0){const c=productCalc(p);rows.push({key:"product:"+p.id,source:"product",sourceId:p.id,name:p.name,supplier:p.supplier||"Bez obchodu",packageLabel:`${num.format(n(p.packageAmount))} ${p.unit||"L"}`,packagePrice:n(p.packagePrice),minimum:c.suggestedPackages,planned:c.plannedPackages,manual:false})}});state.items.forEach(i=>{const need=itemDemand(i.id);if(need>0)rows.push({key:"item:"+i.id,source:"item",sourceId:i.id,name:i.name,supplier:i.supplier||"Bez obchodu",packageLabel:`${num.format(n(i.packageAmount))} ${i.unit||"L"}`,packagePrice:n(i.packagePrice),minimum:itemSuggestedPackages(i),planned:itemPlannedPackages(i),manual:false})});return rows}
function inventoryRows(){return [...sourceInventoryRows(),...state.manualInventory.map(m=>({key:"manual:"+m.id,source:"manual",sourceId:m.id,name:m.name||"Manuálna položka",supplier:m.supplier||"Bez obchodu",packageLabel:m.packageLabel||"1 balenie",packagePrice:n(m.packagePrice),minimum:0,planned:n(m.plannedPackages),manual:true}))]}
function invState(row){if(row.manual)return state.manualInventory.find(x=>x.id===row.sourceId);state.inventory[row.key]=state.inventory[row.key]||{actualPackages:"",actualUnitPrice:"",supplierOverride:"",note:""};return state.inventory[row.key]}
function rowSupplier(row){const v=invState(row);if(row.manual)return (v.supplier||"").trim()||"Bez obchodu";return (v.supplierOverride||"").trim()||row.supplier||"Bez obchodu"}
function invCalc(row){const v=invState(row),actual=String(v.actualPackages??"").trim()===""?0:n(v.actualPackages),unitPrice=String(v.actualUnitPrice??"").trim()===""?n(row.packagePrice):n(v.actualUnitPrice);return {actual,unitPrice,realCost:actual*unitPrice,planPurchase:n(row.planned)*n(row.packagePrice)}}
function suppCalc(c){return {actual:Math.max(0,n(c.qty)*n(c.unitPrice))}}
function revenueCalc(){const cashFilled=String(state.meta.cashRevenue??"").trim()!=="",terminalFilled=String(state.meta.terminalRevenue??"").trim()!=="",floatFilled=String(state.meta.cashFloat??"").trim()!=="",filled=cashFilled||terminalFilled||floatFilled,cash=n(state.meta.cashRevenue),terminal=n(state.meta.terminalRevenue),float=n(state.meta.cashFloat);return {filled,cash,terminal,float,total:filled?(-float+cash+terminal):null}}
function totals(){let planRevenue=0;state.products.forEach(p=>planRevenue+=n(p.salePrice)*n(p.plannedQty));let planPurchase=0,actualPurchase=0;inventoryRows().forEach(r=>{const c=invCalc(r);planPurchase+=c.planPurchase;actualPurchase+=c.realCost});let suppActual=0;state.supplementalCosts.forEach(c=>suppActual+=suppCalc(c).actual);const rev=revenueCalc(),planResult=planRevenue-planPurchase,totalActualCosts=actualPurchase+suppActual,actualResult=rev.filled?rev.total-totalActualCosts:null;return {planRevenue,planPurchase,planResult,actualRevenue:rev.total,actualPurchase,suppActual,totalActualCosts,actualResult,revenueFilled:rev.filled,rev}}
function shopSummary(){const groups={};inventoryRows().forEach(r=>{const supplier=rowSupplier(r),g=groups[supplier]||(groups[supplier]={supplier,rows:[],plan:0,actual:0}),c=invCalc(r);g.rows.push({name:r.name,planned:r.planned,planValue:c.planPurchase,actual:c.actual,actualValue:c.realCost});g.plan+=c.planPurchase;g.actual+=c.realCost});return Object.values(groups).sort((a,b)=>a.supplier.localeCompare(b.supplier,"sk"))}
function suppliers(){const set=new Set();state.products.forEach(p=>{if((p.supplier||"").trim())set.add(p.supplier.trim())});state.items.forEach(i=>{if((i.supplier||"").trim())set.add(i.supplier.trim())});state.manualInventory.forEach(i=>{if((i.supplier||"").trim())set.add(i.supplier.trim())});Object.values(state.inventory).forEach(i=>{if((i.supplierOverride||"").trim())set.add(i.supplierOverride.trim())});return [...set].sort((a,b)=>a.localeCompare(b,"sk"))}
function field(scope,id,key,value,type="text",cls="",attrs=""){const numeric=type==="num";return `<input class="${cls}" data-scope="${scope}" data-id="${id}" data-field="${key}" type="text" ${numeric?'inputmode="decimal" autocomplete="off"':""} ${attrs} value="${esc(numeric?inputNum(value):value)}">`}
function moneyField(scope,id,key,value){return `<div class="inline" style="flex-wrap:nowrap">${field(scope,id,key,value,"num")}<span class="mini">€</span></div>`}
function supplierField(scope,id,key,value){return field(scope,id,key,value,"text","",'list="supplierList" placeholder="napr. Metro"')}
function categorySelect(id,val){const cats=["Pivo","Víno","Destilát","Nealko","Mix drink","Iné"];return `<select data-scope="product" data-id="${id}" data-field="category">${cats.map(c=>`<option ${c===val?"selected":""}>${c}</option>`).join("")}</select>`}
function modeSelect(p){return `<select data-scope="product" data-id="${p.id}" data-field="mode"><option value="simple" ${p.mode==="simple"?"selected":""}>Jednoduchý</option><option value="recipe" ${p.mode==="recipe"?"selected":""}>Receptúra</option></select>`}
function unitSelect(scope,id,val){return `<select data-scope="${scope}" data-id="${id}" data-field="unit"><option ${val==="L"?"selected":""}>L</option><option ${val==="ks"?"selected":""}>ks</option></select>`}
function kindSelect(i){return `<select data-scope="item" data-id="${i.id}" data-field="kind"><option ${i.kind==="Surovina"?"selected":""}>Surovina</option><option ${i.kind==="Spotrebný materiál"?"selected":""}>Spotrebný materiál</option></select>`}
function unitField(p,key){if(p.mode==="recipe")return `<span class="mini">cez receptúru</span>`;return `<div class="inline" style="flex-wrap:nowrap">${field("product",p.id,key,p[key],"num")}<span class="mini">${esc(p.unit||"L")}</span></div>`}
