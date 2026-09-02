/* ------------------------------------------------------------------
   personal-foods.js — habitudes et recettes personnelles

   FICHIER À COMPLÉTER : chaque ligne décrit une portion habituelle.
   Les calories et macronutriments sont des estimations modifiables.
   Le convertisseur crée automatiquement les valeurs par 100 g utilisées
   par le calcul interne de MO LOW.
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.PERSONAL_PORTIONS = [
  {
    name:"Poulet Press",category:"Maison",grams:180,kcal:430,
    protein:42,carbs:0,fat:29,
    aliases:["cuisse de poulet désossée","poulet à la poêle avec peau"],
    visual:"Cuisse de poulet désossée cuite à la poêle, peau conservée et très peu d'huile."
  },
  {
    name:"Tartare de thon rouge",category:"Maison",grams:150,kcal:240,
    protein:36,carbs:2,fat:9,
    aliases:["tartare de thon","thon rouge en tartare"],
    visual:"Thon rouge cru coupé en petits dés, assaisonné avec herbes et une petite quantité de sauce."
  },
  {
    name:"Thon rouge cru – sashimi",category:"Maison",grams:150,kcal:195,
    protein:39,carbs:0,fat:2,
    aliases:["sashimi de thon","thon cru en tranches"],
    visual:"Tranches épaisses de thon rouge cru servies sans riz."
  },
  {
    name:"Bœuf basilic, riz et œuf au plat",category:"Plats complets",grams:500,kcal:820,
    protein:42,carbs:90,fat:31,
    aliases:["boeuf basilic thaï","pad kra pao","bœuf basilic avec riz et œuf"],
    visual:"Bœuf sauté au basilic de style thaïlandais, servi avec du riz blanc et un œuf au plat."
  },
  {
    name:"Pâtes Lorraine",category:"Plats complets",grams:350,kcal:760,
    protein:28,carbs:85,fat:34,
    aliases:["pâtes carbonara française","pâtes crème lardons"],
    visual:"Pâtes avec sauce à la crème et lardons, façon carbonara française."
  },
  {
    name:"Pâtes à l'arrabbiata",category:"Plats complets",grams:350,kcal:560,
    protein:18,carbs:92,fat:13,
    aliases:["pâtes arrabiata","penne arrabbiata","pâtes sauce tomate pimentée"],
    visual:"Pâtes avec sauce tomate rouge relevée au piment, sans crème."
  },
  {
    name:"Sandwich jambon-beurre-fromage",category:"Golf",grams:250,kcal:610,
    protein:29,carbs:69,fat:24,
    aliases:["demi-baguette jambon beurre emmental","sandwich golf jambon fromage"],
    visual:"Demi-baguette garnie de jambon, beurre et tranches d'emmental."
  },
  {
    name:"Sandwich fromage-crudités",category:"Golf",grams:300,kcal:730,
    protein:27,carbs:72,fat:37,
    aliases:["demi-baguette emmental crudités","sandwich fromage mayonnaise œuf tomate salade"],
    visual:"Demi-baguette avec emmental, mayonnaise, œuf dur, tomate et salade."
  }
];

const personalPer100 = (value, grams) => Math.round(value * 1000 / grams) / 10;

ML.PERSONAL_FOODS = ML.PERSONAL_PORTIONS.map(item => ({
  n:item.name,
  k:personalPer100(item.kcal, item.grams),
  p:personalPer100(item.protein, item.grams),
  c:personalPer100(item.carbs, item.grams),
  f:personalPer100(item.fat, item.grams),
  u:item.grams,
  portionLabel:'1 portion',
  category:item.category,
  estimated:true,
  confidence:'medium',
  aliases:item.aliases || [],
  visual:item.visual || '',
  src:'Recette personnelle estimée'
}));

/* Aliments renseignés directement pour 100 g. Cette liste convient aux
   préparations dont la composition est déjà connue dans ce format. */
ML.PERSONAL_FOODS.push({
  n:"Légumes rôtis maison",k:75,p:1.5,c:15,f:1.5,
  category:"Maison",aliases:["légumes rôtis","légumes au four"],
  visual:"Mélange de légumes coupés et rôtis au four avec une petite quantité d'huile.",
  src:'Recette personnelle · valeurs pour 100 g'
});

ML.FOODS.push(...ML.PERSONAL_FOODS);
