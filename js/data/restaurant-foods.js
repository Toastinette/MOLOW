/* ------------------------------------------------------------------
   restaurant-foods.js — plats complets et valeurs estimées

   FICHIER À COMPLÉTER : ajouter une ligne dans RESTAURANT_PORTIONS avec :
     name       = nom affiché dans MO LOW
     category   = famille du plat
     grams      = poids estimé de la portion complète
     kcal       = calories de la portion complète
     protein    = protéines totales de la portion
     carbs      = glucides totaux de la portion
     fat        = lipides totaux de la portion

   Le convertisseur situé sous la liste produit automatiquement les valeurs
   par 100 g attendues par le reste de l'application. Ces données proviennent
   d'estimations de carte : elles ne remplacent pas les informations du
   restaurant ni une pesée réelle.
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.RESTAURANT_PORTIONS = [
  /* Les Boucaniers — Américains */
  {name:"Américain Épaule",category:"Américains",grams:350,kcal:700,protein:28,carbs:85,fat:27},
  {name:"Américain Hot-Dog",category:"Américains",grams:350,kcal:720,protein:25,carbs:88,fat:30},
  {name:"Américain Bouchons porc",category:"Américains",grams:350,kcal:760,protein:30,carbs:90,fat:31},
  {name:"Américain Poulet",category:"Américains",grams:350,kcal:680,protein:38,carbs:85,fat:21},
  {name:"Américain Steak bœuf",category:"Américains",grams:350,kcal:750,protein:38,carbs:85,fat:29},
  {name:"Américain Saucisses chipolata",category:"Américains",grams:350,kcal:820,protein:30,carbs:85,fat:39},
  {name:"Américain Sarcives",category:"Américains",grams:350,kcal:760,protein:31,carbs:91,fat:30},

  /* Les Boucaniers — Gratinés */
  {name:"Gratiné Hot-Dog",category:"Gratinés",grams:330,kcal:760,protein:29,carbs:72,fat:38},
  {name:"Gratiné Bouchons porc",category:"Gratinés",grams:330,kcal:800,protein:34,carbs:74,fat:39},
  {name:"Gratiné Poulet",category:"Gratinés",grams:330,kcal:700,protein:42,carbs:70,fat:27},
  {name:"Gratiné Steak bœuf",category:"Gratinés",grams:330,kcal:780,protein:42,carbs:70,fat:36},
  {name:"Gratiné Saucisse chipolata",category:"Gratinés",grams:330,kcal:850,protein:34,carbs:70,fat:47},
  {name:"Gratiné Sarcives",category:"Gratinés",grams:330,kcal:800,protein:35,carbs:77,fat:38},

  /* Les Boucaniers — Sandwichs crudités */
  {name:"Épaule – sandwich crudités",category:"Sandwichs crudités",grams:300,kcal:520,protein:27,carbs:60,fat:18},
  {name:"Steak – sandwich crudités",category:"Sandwichs crudités",grams:300,kcal:590,protein:36,carbs:59,fat:23},
  {name:"Poulet – sandwich crudités",category:"Sandwichs crudités",grams:300,kcal:500,protein:41,carbs:59,fat:11},
  {name:"Bouchons porc – sandwich crudités",category:"Sandwichs crudités",grams:300,kcal:590,protein:31,carbs:63,fat:23},
  {name:"Jambon cru – sandwich crudités",category:"Sandwichs crudités",grams:300,kcal:510,protein:31,carbs:59,fat:16},
  {name:"Saucisse chipolata – sandwich crudités",category:"Sandwichs crudités",grams:300,kcal:650,protein:29,carbs:59,fat:31},
  {name:"Sarcives – sandwich crudités",category:"Sandwichs crudités",grams:300,kcal:590,protein:31,carbs:66,fat:22},
  {name:"Thon frais à la plancha – sandwich crudités",category:"Sandwichs crudités",grams:300,kcal:480,protein:43,carbs:59,fat:9},

  /* Les Boucaniers — Burgers */
  {name:"Classic Burger",category:"Burgers",grams:240,kcal:600,protein:34,carbs:47,fat:30},
  {name:"Chicken Burger",category:"Burgers",grams:240,kcal:570,protein:38,carbs:48,fat:25},
  {name:"Bacon Burger",category:"Burgers",grams:240,kcal:680,protein:39,carbs:47,fat:37},
  {name:"Fish Burger",category:"Burgers",grams:240,kcal:590,protein:30,carbs:52,fat:29},

  /* Les Boucaniers — Sandwichs spéciaux */
  {name:"Biquette jambon cru",category:"Sandwichs spéciaux",grams:300,kcal:610,protein:31,carbs:62,fat:27},
  {name:"Biquette steak",category:"Sandwichs spéciaux",grams:300,kcal:700,protein:39,carbs:62,fat:34},
  {name:"Biquette MMS",category:"Sandwichs spéciaux",grams:300,kcal:650,protein:34,carbs:62,fat:30},
  {name:"Spécial chip péi",category:"Sandwichs spéciaux",grams:300,kcal:730,protein:31,carbs:65,fat:39},
  {name:"Texan",category:"Sandwichs spéciaux",grams:300,kcal:720,protein:37,carbs:70,fat:33},
  {name:"Sicilien",category:"Sandwichs spéciaux",grams:300,kcal:630,protein:31,carbs:69,fat:26},

  /* Les Boucaniers — Croque-monsieur */
  {name:"Croc' Tradi",category:"Croque-monsieur",grams:180,kcal:370,protein:20,carbs:35,fat:16},
  {name:"Croc' Chèvre",category:"Croque-monsieur",grams:180,kcal:420,protein:20,carbs:35,fat:21},
  {name:"Croc' Assiette + frites et salade",category:"Assiettes",grams:450,kcal:800,protein:25,carbs:90,fat:38},

  /* Les Boucaniers — Paninis */
  {name:"Panini Les Roches",category:"Paninis",grams:300,kcal:650,protein:33,carbs:70,fat:27},
  {name:"Panini Le Pêcheur – thon frais",category:"Paninis",grams:300,kcal:590,protein:40,carbs:68,fat:18},
  {name:"Panini Le Cot-Cot – poulet",category:"Paninis",grams:300,kcal:620,protein:42,carbs:68,fat:20},
  {name:"Panini Bacon et chèvre",category:"Paninis",grams:300,kcal:750,protein:36,carbs:67,fat:37},
  {name:"Panini Beef-Steak",category:"Paninis",grams:300,kcal:700,protein:40,carbs:68,fat:30},
  {name:"Panini Italien",category:"Paninis",grams:300,kcal:650,protein:30,carbs:72,fat:27},
  {name:"Panini 3 Fromages",category:"Paninis",grams:300,kcal:760,protein:35,carbs:67,fat:39},

  /* Les Boucaniers — Salades */
  {name:"Salade La Poulet",category:"Salades",grams:350,kcal:500,protein:35,carbs:40,fat:20},
  {name:"Salade La Parisienne",category:"Salades",grams:350,kcal:520,protein:27,carbs:42,fat:25},
  {name:"Salade Thon frais à la plancha",category:"Salades",grams:350,kcal:400,protein:40,carbs:25,fat:14},
  {name:"Salade La Ritale",category:"Salades",grams:350,kcal:520,protein:23,carbs:35,fat:31},
  {name:"Salade Carpaccio",category:"Salades",grams:350,kcal:400,protein:33,carbs:25,fat:18},

  /* Les Boucaniers — Assiettes et suppléments */
  {name:"Steak haché + œuf + frites + salade",category:"Assiettes",grams:500,kcal:850,protein:40,carbs:70,fat:43},
  {name:"Saucisse chip péi + frites + salade",category:"Assiettes",grams:500,kcal:950,protein:31,carbs:70,fat:56},
  {name:"Barquette de frites",category:"Suppléments",grams:150,kcal:450,protein:6,carbs:60,fat:21},
  {name:"5 bouchons artisanaux porc",category:"Suppléments",grams:125,kcal:275,protein:12.5,carbs:30,fat:11.3},
  {name:"Œuf supplémentaire",category:"Suppléments",grams:55,kcal:75,protein:6,carbs:0,fat:5},
  {name:"Fromage supplémentaire",category:"Suppléments",grams:30,kcal:100,protein:7.1,carbs:.4,fat:8},
  {name:"Bacon supplémentaire",category:"Suppléments",grams:30,kcal:115,protein:8,carbs:.5,fat:9}
];

const restaurantPer100 = (value, grams) => Math.round(value * 1000 / grams) / 10;

ML.RESTAURANT_FOODS = ML.RESTAURANT_PORTIONS.map(item => ({
  n:`Les Boucaniers · ${item.name}`,
  k:restaurantPer100(item.kcal, item.grams),
  p:restaurantPer100(item.protein, item.grams),
  c:restaurantPer100(item.carbs, item.grams),
  f:restaurantPer100(item.fat, item.grams),
  u:item.grams,
  portionLabel:'1 portion',
  restaurant:'Les Boucaniers',
  category:item.category,
  estimated:true,
  confidence:'medium',
  src:'Estimation de la carte'
}));

ML.FOODS.push(...ML.RESTAURANT_FOODS);
