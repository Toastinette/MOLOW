/* ------------------------------------------------------------------
   macros.js — détail du jour, derrière la flèche de l'accueil
   Volontairement en second rang : l'accueil ne montre que les calories,
   ce détail ne s'affiche que si on le demande.
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.macros = (() => {
  /* Couleurs fixes, indépendantes de la jauge d'accueil : ces barres
     doivent rester identifiables quelle que soit la couleur du jour. */
  const DEF = [
    {k:'p', label:'Protéines', color:'#25E8A0', kcal:4},
    {k:'c', label:'Glucides',  color:'#FFC400', kcal:4},
    {k:'f', label:'Lipides',   color:'#FF7A45', kcal:9},
    {k:'a', label:'Alcool',    color:'#B98BFF', kcal:7}
  ];

  /* Sans cible (l'alcool), la barre montre la part de l'alcool dans
     les calories du jour : une barre vide n'apprendrait rien.      */
  function bar(def, got, target, share){
    const pct = target ? ML.clamp(got / target * 100, 0, 100) : ML.clamp(share * 100, 0, 100);
    const over = target && got > target;
    const right = target
      ? `${ML.fmt(got)} <span class="of">/ ${ML.fmt(target)} g</span>`
      : `${ML.fmt(got)} <span class="of">g</span>`;
    return `<div class="mrow2">
      <div class="mtop"><span class="mlab">${def.label}</span><span class="mval num">${right}</span></div>
      <div class="mtrack">
        <div class="mfill${over ? ' over' : ''}" style="width:${target ? pct : 0}%;background:${def.color}"></div>
      </div>
      <div class="mfoot">${ML.fmt(got * def.kcal)} kcal${
        target ? (over ? ` · ${ML.fmt(got - target)} g au-dessus` : ` · ${ML.fmt(target - got)} g restants`)
               : ` · ${Math.round(share * 100)} % des calories du jour`}</div>
    </div>`;
  }

  /* Répartition en une seule barre empilée : la part de chaque
     macronutriment dans les calories réellement avalées.        */
  function split(got){
    const parts = DEF.map(d => ({...d, kc: got[d.k] * d.kcal})).filter(x => x.kc > 0);
    const sum = parts.reduce((s, x) => s + x.kc, 0);
    if (!sum) return '';
    return `<div class="sec">Répartition des calories</div>
      <div class="mtrack stack">${parts.map(x =>
        `<span style="width:${x.kc / sum * 100}%;background:${x.color}"></span>`).join('')}</div>
      <div class="mlegend">${parts.map(x =>
        `<span><i style="background:${x.color}"></i>${x.label} ${Math.round(x.kc / sum * 100)} %</span>`).join('')}</div>`;
  }

  function open(){
    const d = ML.today();
    const got = ML.store.macrosOf(d), tgt = ML.store.macroTargets();
    const consumed = ML.store.totalOf(d);
    /* Écart entre les calories du journal et celles reconstituées à
       partir des macros : sert de contrôle de cohérence.           */
    const fromMacros = DEF.reduce((s, x) => s + got[x.k] * x.kcal, 0);
    /* Seuil relatif : les tables de composition laissent naturellement
       2 à 5 % d'écart. On n'alerte que sur des entrées réellement
       dépourvues de macros.                                          */
    const gap = consumed - fromMacros;
    const orphan = gap > 80 && gap > consumed * .15;

    ML.shell.panel(ML.shell.head('Détail du jour') +
      `<div class="budget">${ML.fmt(consumed)} kcal consommées sur ${ML.fmt(ML.store.goal)}.</div>
       <div class="pbody">
         ${bar(DEF[0], got.p, tgt.p)}
         ${bar(DEF[1], got.c, tgt.c)}
         ${bar(DEF[2], got.f, tgt.f)}
         ${got.a > 0 ? bar(DEF[3], got.a, 0, consumed ? got.a * 7 / consumed : 0) : ''}
         ${split(got)}
         ${orphan ? `<p class="note">${ML.fmt(gap)} kcal du journal ne sont rattachées à aucun
            macronutriment — des entrées anciennes, enregistrées avant le détail.</p>` : ''}
         <p class="note">Cibles indicatives : protéines calées sur ton poids, lipides à 30 % des
            calories, glucides pour le reste. À ajuster si tu veux, elles ne conditionnent rien
            d'autre que ces barres.</p>
       </div>`);
  }

  return {open};
})();
