/* ------------------------------------------------------------------
   snacks.js — portions cohérentes pour l'écran J'AI FAIM

   Catalogue volontairement séparé des repas et des restaurants : une
   entrée représente une collation complète, prête à manger sur le pouce.
   Les valeurs sont des estimations par portion et restent modifiables.
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.SNACK_PORTIONS = [
  /* Léger */
  {name:"1 clémentine",category:"Léger",grams:70,kcal:33,protein:.6,carbs:7.5,fat:.1},
  {name:"Compote sans sucres ajoutés",category:"Léger",grams:100,kcal:55,protein:.3,carbs:12.5,fat:.1},
  {name:"Barquette de fraises",category:"Léger",grams:200,kcal:64,protein:1.4,carbs:12,fat:.6},
  {name:"Tomates cerises à croquer",category:"Léger",grams:200,kcal:36,protein:1.8,carbs:6,fat:.4},
  {name:"2 galettes de riz",category:"Léger",grams:18,kcal:69,protein:1.4,carbs:14.4,fat:.5},
  {name:"Fromage blanc 0 %",category:"Léger",grams:150,kcal:75,protein:12,carbs:6,fat:.3},
  {name:"Skyr nature",category:"Léger",grams:150,kcal:95,protein:16,carbs:6,fat:.3},
  {name:"Bol de pastèque",category:"Léger",grams:250,kcal:75,protein:1.5,carbs:17,fat:.5},

  /* Santé */
  {name:"1 pomme",category:"Santé",grams:150,kcal:78,protein:.5,carbs:18,fat:.3},
  {name:"1 banane",category:"Santé",grams:120,kcal:108,protein:1.3,carbs:24,fat:.4},
  {name:"Poignée d'amandes",category:"Santé",grams:25,kcal:150,protein:5.3,carbs:2,fat:13.3},
  {name:"2 œufs durs",category:"Santé",grams:110,kcal:160,protein:13.9,carbs:.8,fat:11},
  {name:"Skyr et banane",category:"Santé",grams:270,kcal:205,protein:17,carbs:30,fat:1},
  {name:"Pomme et beurre de cacahuète",category:"Santé",grams:170,kcal:195,protein:4.5,carbs:22,fat:10},
  {name:"Bâtonnets de carotte et houmous",category:"Santé",grams:180,kcal:210,protein:6,carbs:25,fat:10},
  {name:"Barre protéinée",category:"Santé",grams:55,kcal:210,protein:18,carbs:20,fat:7},
  {name:"Yaourt et granola",category:"Santé",grams:200,kcal:260,protein:10,carbs:35,fat:8},
  {name:"Tartine complète au jambon",category:"Santé",grams:100,kcal:220,protein:14,carbs:25,fat:6},

  /* Plaisir */
  {name:"2 carrés de chocolat noir",category:"Plaisir",grams:20,kcal:110,protein:1.5,carbs:8,fat:8},
  {name:"Petit paquet de chips",category:"Plaisir",grams:30,kcal:162,protein:1.8,carbs:15,fat:10.2},
  {name:"1 cookie",category:"Plaisir",grams:40,kcal:192,protein:2.2,carbs:25,fat:9.2},
  {name:"1 glace en bâtonnet",category:"Plaisir",grams:70,kcal:190,protein:3,carbs:24,fat:9},
  {name:"1 croissant",category:"Plaisir",grams:60,kcal:240,protein:4.8,carbs:25.2,fat:13.2},
  {name:"1 pain au chocolat",category:"Plaisir",grams:70,kcal:294,protein:5.3,carbs:31.5,fat:16.1},
  {name:"Mini-sandwich jambon-fromage",category:"Plaisir",grams:150,kcal:360,protein:18,carbs:42,fat:13},
  {name:"Pop-corn caramélisé",category:"Plaisir",grams:50,kcal:220,protein:2.5,carbs:35,fat:8},
  {name:"2 samoussas",category:"Plaisir",grams:40,kcal:120,protein:2.8,carbs:12,fat:6.8},
  {name:"3 bouchons",category:"Plaisir",grams:75,kcal:150,protein:6.8,carbs:16.5,fat:6},
  {name:"1 muffin",category:"Plaisir",grams:90,kcal:360,protein:5,carbs:48,fat:17}
];

const snackPer100 = (value, grams) => Math.round(value * 1000 / grams) / 10;

ML.SNACKS = ML.SNACK_PORTIONS.map(item => ({
  n:item.name, category:item.category, u:item.grams, portionLabel:'1 portion',
  k:snackPer100(item.kcal,item.grams), p:snackPer100(item.protein,item.grams),
  c:snackPer100(item.carbs,item.grams), f:snackPer100(item.fat,item.grams),
  portionKcal:item.kcal, src:'Collation estimée'
}));
