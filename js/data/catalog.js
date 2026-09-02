/* ------------------------------------------------------------------
   catalog.js — base nutritionnelle embarquée
   Pour 100 g (aliments) ou 100 ml (boissons) :
     k = kcal · p = protéines · c = glucides · f = lipides · a = alcool
   u = poids d'une pièce (g) · v = volume d'un service (ml)
   C'est ce fichier qui deviendra l'extrait CIQUAL en production, et
   c'est aussi le vocabulaire fermé envoyé au modèle d'analyse photo.
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.FOODS = [
  {n:"Riz cuit",k:130,p:2.7,c:28,f:.3},        {n:"Pâtes cuites",k:158,p:5.8,c:31,f:.9},
  {n:"Semoule cuite",k:112,p:3.8,c:23,f:.2},   {n:"Quinoa cuit",k:120,p:4.4,c:21,f:1.9},
  {n:"Poulet grillé",k:165,p:31,c:0,f:3.6},    {n:"Blanc de poulet",k:110,p:23,c:0,f:1.5},
  {n:"Steak haché 5%",k:130,p:21,c:0,f:5},     {n:"Jambon",k:110,p:18,c:1,f:3.5},
  {n:"Saumon",k:200,p:20,c:0,f:13},            {n:"Thon",k:130,p:26,c:0,f:1},
  {n:"Crevettes",k:100,p:21,c:.5,f:1},         {n:"Œuf",k:145,p:12.6,c:.7,f:10,u:55},
  {n:"Pain",k:265,p:9,c:49,f:3.2},             {n:"Baguette",k:270,p:9,c:55,f:1.5},
  {n:"Beurre",k:750,p:.7,c:.6,f:83},           {n:"Huile d'olive",k:900,p:0,c:0,f:100},
  {n:"Fromage",k:350,p:25,c:1.3,f:28},         {n:"Yaourt nature",k:60,p:4.5,c:5,f:3},
  {n:"Salade verte",k:15,p:1.4,c:1.5,f:.2},    {n:"Tomate",k:18,p:.9,c:3,f:.2},
  {n:"Avocat",k:160,p:2,c:2,f:15},             {n:"Courgette",k:17,p:1.2,c:2,f:.3},
  {n:"Haricots verts",k:31,p:1.8,c:4,f:.2},    {n:"Lentilles cuites",k:116,p:9,c:20,f:.4},
  {n:"Pomme de terre",k:85,p:2,c:18,f:.1},     {n:"Patate douce",k:90,p:1.6,c:20,f:.1},
  {n:"Banane",k:90,p:1.1,c:20,f:.3,u:120},     {n:"Pomme",k:52,p:.3,c:12,f:.2,u:150},
  {n:"Frites",k:310,p:3.9,c:41,f:15},          {n:"Pizza",k:260,p:11,c:30,f:10},
  {n:"Burger",k:250,p:13,c:22,f:12},           {n:"Sandwich",k:230,p:10,c:27,f:9},
  {n:"Nuggets",k:240,p:14,c:15,f:14},          {n:"Chips",k:540,p:6,c:50,f:34},
  {n:"Chocolat",k:550,p:6,c:50,f:33},          {n:"Amandes",k:600,p:21,c:8,f:53},
  {n:"Cookie",k:480,p:5.5,c:62,f:23,u:40},     {n:"Croissant",k:400,p:8,c:42,f:22,u:60},
  {n:"Pain au chocolat",k:420,p:7.5,c:45,f:23,u:70},
  {n:"Rougail saucisse",k:250,p:13,c:6,f:19},  {n:"Cari poulet",k:150,p:15,c:5,f:8},
  {n:"Grain (haricots)",k:110,p:7,c:18,f:.6},  {n:"Achard",k:120,p:1.5,c:8,f:9},
  {n:"Bouchon",k:200,p:9,c:22,f:8,u:25},       {n:"Samoussa",k:300,p:7,c:30,f:17,u:20}
];

/* a = grammes d'alcool pur pour 100 ml (degré × 0,789).
   L'alcool pèse 7 kcal/g : sans cette colonne, les calories d'un rhum
   n'auraient aucun macronutriment pour les porter.                    */
ML.DRINKS = [
  {n:"Café noir",k:2,p:.2,c:0,f:0,a:0,v:100},      {n:"Eau",k:0,p:0,c:0,f:0,a:0,v:500},
  {n:"Bière (demi)",k:43,p:.5,c:3.6,f:0,a:3.9,v:250},
  {n:"Bière (pinte)",k:43,p:.5,c:3.6,f:0,a:3.9,v:500},
  {n:"Dodo (33 cl)",k:43,p:.5,c:3.6,f:0,a:3.9,v:330},
  {n:"Vin rouge",k:85,p:.1,c:2.6,f:0,a:9.9,v:125}, {n:"Vin blanc",k:82,p:.1,c:2.6,f:0,a:9.6,v:125},
  {n:"Rhum",k:231,p:0,c:0,f:0,a:31.6,v:40},
  {n:"Ricard maison",k:38,p:0,c:0,f:0,a:5.3,v:200,portionLabel:"3 cl + eau"},
  {n:"Gin tonic maison",k:83,p:0,c:6.4,f:0,a:7.9,v:200,portionLabel:"5 cl + tonic"},
  {n:"Aperol Spritz",k:83.3,p:0,c:8.9,f:0,a:7.8,s:7.8,v:180,portionLabel:"1 verre",category:"Alcool / Cocktail"},
  {n:"Coca",k:42,p:0,c:10.6,f:0,a:0,v:330},        {n:"Coca zéro",k:.3,p:0,c:0,f:0,a:0,v:330},
  {n:"Soda",k:40,p:0,c:10,f:0,a:0,v:330},          {n:"Jus d'orange",k:45,p:.7,c:10,f:.1,a:0,v:200},
  {n:"Sirop",k:60,p:0,c:15,f:0,a:0,v:250},         {n:"Lait",k:46,p:3.3,c:4.8,f:1.6,a:0,v:200}
];

/* Recherche par nom : l'analyse photo renvoie des noms du vocabulaire,
   les macros sont ensuite reprises ici et jamais inventées par le modèle. */
ML.byName = name => ML.FOODS.find(x => x.n === name) || ML.DRINKS.find(x => x.n === name) || null;

/* Macros d'une quantité donnée, à partir d'une entrée du catalogue. */
ML.scale = (item, qty) => ({
  p:(item.p || 0) * qty / 100, c:(item.c || 0) * qty / 100,
  f:(item.f || 0) * qty / 100, a:(item.a || 0) * qty / 100
});

ML.MOCK_MEALS = [
  [{n:"Poulet grillé",g:160},{n:"Riz cuit",g:220},{n:"Salade verte",g:80},{n:"Huile d'olive",g:12}],
  [{n:"Rougail saucisse",g:200},{n:"Riz cuit",g:250},{n:"Grain (haricots)",g:120}],
  [{n:"Pizza",g:280},{n:"Salade verte",g:60}]
];

ML.MOCK_PRODUCT = {n:"Biscuits sablés",k:495,p:6,c:64,f:23,portion:33};
