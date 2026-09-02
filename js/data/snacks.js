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
  {name:"1 kiwi",category:"Léger",grams:100,kcal:61,protein:1.1,carbs:11,fat:.5},
  {name:"1 poire",category:"Léger",grams:160,kcal:91,protein:.6,carbs:21,fat:.2},
  {name:"1 pêche",category:"Léger",grams:150,kcal:59,protein:1.4,carbs:13,fat:.4},
  {name:"2 abricots",category:"Léger",grams:90,kcal:43,protein:1.3,carbs:8,fat:.4},
  {name:"1 petite grappe de raisin",category:"Léger",grams:120,kcal:83,protein:.8,carbs:19,fat:.2},
  {name:"1 tranche d'ananas",category:"Léger",grams:150,kcal:75,protein:.8,carbs:17,fat:.2},
  {name:"1 petite mangue",category:"Léger",grams:140,kcal:84,protein:1.1,carbs:19,fat:.5},
  {name:"Bol de melon",category:"Léger",grams:220,kcal:75,protein:1.7,carbs:16,fat:.4},
  {name:"Concombre à croquer",category:"Léger",grams:200,kcal:30,protein:1.3,carbs:5,fat:.2},
  {name:"Radis à croquer",category:"Léger",grams:150,kcal:24,protein:1,carbs:3,fat:.2},
  {name:"Petit bol de framboises",category:"Léger",grams:125,kcal:65,protein:1.5,carbs:7,fat:.8},
  {name:"Yaourt nature",category:"Léger",grams:125,kcal:75,protein:5.6,carbs:6.3,fat:3.8},
  {name:"Petit-suisse 0 %",category:"Léger",grams:120,kcal:72,protein:10,carbs:5,fat:.4},
  {name:"Gelée sans sucre",category:"Léger",grams:125,kcal:18,protein:1.5,carbs:2,fat:0},

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
  {name:"1 œuf dur",category:"Santé",grams:55,kcal:80,protein:6.3,carbs:.4,fat:5.3},
  {name:"1 œuf dur et tomates cerises",category:"Santé",grams:155,kcal:98,protein:7.2,carbs:3.4,fat:5.5},
  {name:"Skyr et fraises",category:"Santé",grams:250,kcal:127,protein:16.7,carbs:12,fat:.6},
  {name:"Fromage blanc et pomme",category:"Santé",grams:250,kcal:135,protein:12.3,carbs:18,fat:.5},
  {name:"Yaourt nature et kiwi",category:"Santé",grams:225,kcal:136,protein:6.7,carbs:17,fat:4.3},
  {name:"Poignée de noix",category:"Santé",grams:20,kcal:132,protein:3,carbs:1.4,fat:13},
  {name:"Poignée de pistaches non salées",category:"Santé",grams:25,kcal:143,protein:5,carbs:4.5,fat:11.5},
  {name:"Poignée de noisettes",category:"Santé",grams:20,kcal:126,protein:3,carbs:1.4,fat:12.2},
  {name:"Tartine complète et fromage frais",category:"Santé",grams:75,kcal:165,protein:6.5,carbs:22,fat:5.5},
  {name:"2 tranches de jambon",category:"Santé",grams:80,kcal:88,protein:14.4,carbs:.8,fat:2.8},
  {name:"Blanc de poulet froid",category:"Santé",grams:80,kcal:110,protein:23,carbs:0,fat:2},
  {name:"Roulés jambon et fromage frais",category:"Santé",grams:100,kcal:160,protein:15,carbs:3,fat:9},
  {name:"Thon et 2 crackers complets",category:"Santé",grams:100,kcal:155,protein:19,carbs:14,fat:3},
  {name:"Avocat sur pain complet",category:"Santé",grams:110,kcal:205,protein:5,carbs:25,fat:10},
  {name:"Houmous et 2 crackers complets",category:"Santé",grams:80,kcal:180,protein:5,carbs:22,fat:8},
  {name:"Edamame décortiqué",category:"Santé",grams:120,kcal:145,protein:13,carbs:9,fat:6},
  {name:"Flocons d'avoine et skyr",category:"Santé",grams:180,kcal:205,protein:18,carbs:27,fat:3},
  {name:"Banane et 10 amandes",category:"Santé",grams:135,kcal:198,protein:4.5,carbs:26,fat:8.5},
  {name:"Pomme et petit morceau d'emmental",category:"Santé",grams:175,kcal:168,protein:6.8,carbs:18,fat:7.3},
  {name:"Pain complet et jambon",category:"Santé",grams:85,kcal:185,protein:12,carbs:26,fat:3.5},

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
  ,{name:"Œuf dur mayonnaise",category:"Plaisir",grams:65,kcal:155,protein:6.5,carbs:.6,fat:14.1}
  ,{name:"Petit morceau d'emmental",category:"Plaisir",grams:30,kcal:114,protein:8.4,carbs:.2,fat:8.7}
  ,{name:"4 olives et fromage",category:"Plaisir",grams:50,kcal:145,protein:7,carbs:1,fat:12.5}
  ,{name:"2 dattes",category:"Plaisir",grams:40,kcal:113,protein:1,carbs:28,fat:.2}
  ,{name:"Banane au chocolat noir",category:"Plaisir",grams:140,kcal:185,protein:2.6,carbs:32,fat:5.5}
  ,{name:"Tartine beurre de cacahuète",category:"Plaisir",grams:55,kcal:215,protein:8,carbs:23,fat:10.5}
  ,{name:"Petit bol de céréales et lait",category:"Plaisir",grams:180,kcal:230,protein:7,carbs:39,fat:5}
  ,{name:"Crêpe au sucre",category:"Plaisir",grams:75,kcal:190,protein:4.5,carbs:32,fat:5}
  ,{name:"Mini part de gâteau maison",category:"Plaisir",grams:60,kcal:210,protein:3,carbs:28,fat:10}
  ,{name:"2 biscuits sablés",category:"Plaisir",grams:30,kcal:150,protein:1.8,carbs:19,fat:7.5}
  ,{name:"Petit sachet de cacahuètes",category:"Plaisir",grams:25,kcal:153,protein:6.5,carbs:3,fat:12.5}
  ,{name:"Mini-wrap jambon-fromage",category:"Plaisir",grams:120,kcal:285,protein:16,carbs:29,fat:11}
  ,{name:"Toast fromage et miel",category:"Plaisir",grams:70,kcal:220,protein:7,carbs:29,fat:8}
  ,{name:"Yaourt vanille",category:"Plaisir",grams:125,kcal:125,protein:4.5,carbs:19,fat:3.5}
  ,{name:"Compote et 2 biscuits",category:"Plaisir",grams:130,kcal:145,protein:1.5,carbs:27,fat:3.5}
];

const snackPer100 = (value, grams) => Math.round(value * 1000 / grams) / 10;

ML.SNACKS = ML.SNACK_PORTIONS.map(item => ({
  n:item.name, category:item.category, u:item.grams, portionLabel:'1 portion',
  k:snackPer100(item.kcal,item.grams), p:snackPer100(item.protein,item.grams),
  c:snackPer100(item.carbs,item.grams), f:snackPer100(item.fat,item.grams),
  portionKcal:item.kcal, src:'Collation estimée'
}));
