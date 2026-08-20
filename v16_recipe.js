// v16 – receptúry môžu používať aj existujúce jednoduché produkty.
// Dáta sa nemenia ani neduplikujú: komponent stále obsahuje iba itemId + amount.

const _itemOnlyLookup = item;
item = function(id){
  return state.items.find(x=>x.id===id) || state.products.find(x=>x.id===id && x.mode==="simple") || null;
};

function productRecipeDemand(productId){
  let total=0;
  state.products.forEach(p=>{
    if(p.id===productId)return;
    (p.components||[]).forEach(c=>{
      if(c.itemId===productId) total += n(c.amount) * n(p.plannedQty);
    });
  });
  return total;
}

productCalc = function(p){
  const b=baseCost(p), comp=componentsCost(p), cost=b+comp, profit=n(p.salePrice)-cost;
  const servings=p.mode==="simple"&&n(p.saleAmount)>0?n(p.packageAmount)/n(p.saleAmount):0;
  const directNeed=p.mode==="simple"?n(p.plannedQty)*n(p.saleAmount):0;
  const recipeNeed=p.mode==="simple"?productRecipeDemand(p.id):0;
  const totalNeed=directNeed+recipeNeed;
  const suggested=p.mode==="simple"&&n(p.packageAmount)>0?Math.ceil(totalNeed/n(p.packageAmount)):0;
  const planned=n(p.plannedPackages)||suggested;
  return {
    base:b,components:comp,cost,profit,
    markup:cost>0?profit/cost*100:0,
    recommended:roundUp(cost*(1+n(state.meta.targetMarkup)/100),.1),
    servingsPerPackage:servings,
    suggestedPackages:suggested,
    plannedPackages:planned,
    capacity:servings*planned,
    directNeed,recipeNeed,totalNeed
  };
};

function recipeChoices(activeId){
  const materials=state.items.map(i=>({id:i.id,name:i.name,unit:i.unit||"ks",group:"Suroviny & materiál"}));
  const products=state.products
    .filter(p=>p.mode==="simple"&&p.id!==activeId&&n(p.packageAmount)>0)
    .map(p=>({id:p.id,name:p.name,unit:p.unit||"L",group:"Produkty"}));
  return {materials,products,all:[...products,...materials]};
}

function recipeOptions(activeId,selectedId){
  const c=recipeChoices(activeId);
  let html="";
  if(c.products.length){
    html+=`<optgroup label="Produkty">${c.products.map(x=>`<option value="${x.id}" ${x.id===selectedId?"selected":""}>${esc(x.name)} (${esc(x.unit)})</option>`).join("")}</optgroup>`;
  }
  if(c.materials.length){
    html+=`<optgroup label="Suroviny & materiál">${c.materials.map(x=>`<option value="${x.id}" ${x.id===selectedId?"selected":""}>${esc(x.name)} (${esc(x.unit)})</option>`).join("")}</optgroup>`;
  }
  return html;
}

renderRecipe = function(){
  const p=state.products.find(x=>x.id===activeProduct);if(!p)return;
  recipeTitle.textContent=(p.mode==="simple"?"Doplnky – ":"Receptúra – ")+p.name;
  recipeHelp.textContent=p.mode==="simple"
    ?"Sem pridaj napr. pohár alebo inú položku."
    :"Môžeš použiť existujúci produkt (napr. Gin 0,04 L) aj položku zo Surovín & materiálu.";
  const choices=recipeChoices(p.id);
  recipeRows.innerHTML=(p.components||[]).map((c,idx)=>{
    const source=item(c.itemId);
    const unit=source?.unit||"";
    return `<div class="recipe-row">
      <select data-ridx="${idx}" data-rfield="itemId">${recipeOptions(p.id,c.itemId)}</select>
      <div><input type="text" inputmode="decimal" value="${esc(inputNum(c.amount))}" data-ridx="${idx}" data-rfield="amount"><div class="mini">${esc(unit)}</div></div>
      <button class="small danger" data-action="deleteRecipeRow" data-index="${idx}">×</button>
    </div>`;
  }).join("") || `<div class="empty">Zatiaľ bez položiek.</div>`;
  addRecipeRow.disabled=choices.all.length===0;
};

addRecipeRow.onclick=()=>{
  const p=state.products.find(x=>x.id===activeProduct);if(!p)return;
  const choices=recipeChoices(p.id).all;
  if(!choices.length){alert("Najprv pridaj jednoduchý produkt alebo položku v záložke 2.");return}
  p.components=p.components||[];
  p.components.push({itemId:choices[0].id,amount:1});
  save();renderRecipe();renderAll();
};

// Po zmene produktu/suroviny v receptúre obnov aj jednotku pri množstve.
recipeRows.addEventListener("change",()=>setTimeout(renderRecipe,0));
renderAll();
