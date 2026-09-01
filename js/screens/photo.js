/* ------------------------------------------------------------------
   photo.js — analyse d'un repas et scan de code-barres
   Les deux entrées réseau sont isolées ici : analyze() et lookup().
   Pour brancher le vrai moteur, il n'y a que ces deux fonctions à
   réécrire, le reste de l'écran ne bouge pas.
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.photo = (() => {
  let items = [];

  /* --- POINT DE BRANCHEMENT 1 : analyse multimodale ---
     Production : POST {image, hint, vocabulaire: ML.FOODS} vers le
     proxy, qui renvoie [{n, g}] où n appartient obligatoirement au
     vocabulaire. Ici, tirage dans ML.MOCK_MEALS.                  */
  async function analyze(hint){
    await new Promise(r => setTimeout(r, 900));
    const meal = ML.MOCK_MEALS[Math.floor(Math.random() * ML.MOCK_MEALS.length)];
    /* Le modèle ne renvoie qu'un nom et un grammage. Les valeurs
       nutritionnelles sont reprises dans le catalogue local.      */
    /* Frontière réseau : le nom est nettoyé et doit exister dans le
       catalogue local, sinon l'aliment est écarté. Un modèle ne peut
       donc pas injecter de contenu arbitraire dans l'interface.     */
    return meal.map(x => ({n:ML.cleanName(x.n), g:+x.g || 0, ref:ML.byName(x.n)}))
               .filter(x => x.ref);
  }

  /* --- POINT DE BRANCHEMENT 2 : code-barres ---
     Production : GET Open Food Facts sur l'EAN, puis écriture du
     produit dans la base personnelle pour que le scan suivant soit
     instantané et hors ligne.                                     */
  async function lookup(ean){
    await new Promise(r => setTimeout(r, 700));
    const raw = {...ML.MOCK_PRODUCT, src:'Open Food Facts ·'};
    /* Open Food Facts est contributif : le nom du produit est du texte
       arbitraire, jamais inséré tel quel dans l'interface.          */
    return {...raw, n:ML.cleanName(raw.n) || 'Produit scanné',
            k:+raw.k || 0, p:+raw.p || 0, c:+raw.c || 0, f:+raw.f || 0};
  }

  function open(){
    ML.shell.panel(ML.shell.head('Photo') + ML.shell.budget() + `<div class="pbody">
      <div class="frame"><div>
        <div style="font-size:42px;opacity:.35">○</div>
        <div class="sub" style="margin-top:10px;line-height:1.5">
          Ici s'ouvrira l'appareil photo.<br>Le prototype simule le retour du modèle.</div></div></div>
      <input class="search" id="hint" style="margin-top:14px"
             placeholder="Précision : « cuit à l'huile, sauce yaourt »">
      <button class="cta" id="go" onclick="ML.photo.run()">Analyser</button>
      <p class="note">La photo et le texte partent ensemble. Le modèle ne renvoie pas de calories :
      il nomme les aliments dans le vocabulaire de ta base et estime les grammages. Le calcul, lui,
      reste local.</p></div>`);
  }

  async function run(){
    ML.$('go').textContent = 'Analyse…';
    items = await analyze((ML.$('hint') || {}).value || '');
    ML.shell.panel(ML.shell.head('À valider') + `<div class="pbody">
      <p class="sub" style="line-height:1.55;margin-bottom:4px">
        Corrige les quantités si besoin, le total se recalcule.</p>
      <div id="ests"></div>
      <div class="big2 num" id="tot"></div>
      <div class="sub">estimation, marge d'environ 20 %</div>
      <button class="cta" onclick="ML.photo.save()">Enregistrer le repas</button>
      <button class="cta ghost" onclick="ML.shell.close()">Annuler</button></div>`);
    renderItems();
  }

  function renderItems(){
    ML.$('ests').innerHTML = items.map((x, i) => `<div class="est">
      <span class="nm">${ML.h(x.n)}</span>
      <input type="number" inputmode="numeric" value="${x.g}"
             oninput="ML.photo.setGrams(${i}, +this.value)">
      <span class="sub">g</span>
      <span class="kc num">${ML.fmt(x.g * x.ref.k / 100)}</span>
      <button class="rm" onclick="ML.photo.drop(${i})" aria-label="Retirer">×</button></div>`).join('');
    const t = total();
    /* Fourchette plutôt qu'un chiffre net : une photo ne connaît ni
       l'huile de cuisson ni la densité réelle du plat.             */
    ML.$('tot').textContent = t ? `≈ ${ML.fmt(t * .92)}–${ML.fmt(t * 1.08)} kcal` : '0 kcal';
  }

  const total = () => items.reduce((s, x) => s + x.g * x.ref.k / 100, 0);
  function totalMacros(){
    const t = {p:0, c:0, f:0, a:0};
    items.forEach(x => {
      const m = ML.scale(x.ref, x.g);
      t.p += m.p; t.c += m.c; t.f += m.f; t.a += m.a;
    });
    return t;
  }
  function setGrams(i, g){ items[i].g = g || 0; renderItems(); }
  function drop(i){ items.splice(i, 1); renderItems(); }

  function save(){
    const t = total();
    if (!t) return ML.shell.close();
    ML.add.commit('Repas photographié', t, items.map(x => x.n).join(', '), 'f', totalMacros());
  }

  function scan(){
    ML.shell.panel(ML.shell.head('Code-barres') + `<div class="pbody">
      <div class="frame"><div class="sub" style="line-height:1.5">
        Ici s'ouvrira le lecteur de code-barres.</div></div>
      <button class="cta" id="go" onclick="ML.photo.runScan()">Simuler un produit</button>
      <p class="note">Un produit scanné rejoint définitivement ta base : le deuxième scan est
      instantané, hors ligne, et le produit devient disponible pour l'analyse photo.</p></div>`);
  }

  async function runScan(){
    ML.$('go').textContent = 'Recherche…';
    const p = await lookup('3560070462025');
    ML.add.detailCustom(p, 'f',
      [[p.portion, '1 portion'], [p.portion * 2, '2 portions'], [100, '100 g'], [200, 'Le paquet']]);
  }

  return {open, run, scan, runScan, setGrams, drop, save, analyze, lookup};
})();
