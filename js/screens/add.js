/* ------------------------------------------------------------------
   add.js — MANGER, BOIRE, réglage de portion, J'AI FAIM
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.add = (() => {
  const src = t => t === 'f' ? ML.FOODS : ML.DRINKS;
  const unit = t => t === 'f' ? ' g' : ' ml';
  const searchIcon = `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="20" cy="20" r="13"></circle><path d="m30 30 11 11"></path></svg>`;
  const cameraIcon = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M19 18l5-7h16l5 7h8a5 5 0 0 1 5 5v27a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V23a5 5 0 0 1 5-5z"></path><circle cx="32" cy="35" r="13"></circle><path d="M32 26a9 9 0 0 1 9 9"></path></svg>`;
  const barcodeIcon = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 21V9h12M43 9h12v12M55 43v12H43M21 55H9V43"></path><path d="M19 20v24M25 20v24M31 20v24M38 20v24M45 20v24"></path></svg>`;
  let cur = {};
  /* Journée visée par les ajouts. null = aujourd'hui. Renseignée quand
     on rattrape une journée oubliée depuis le calendrier.            */
  let day = null;

  /* Enregistrement : le seul point d'entrée du journal. */
  function commit(name, kcal, qty, type, macros){
    ML.store.addEntry(name, kcal, qty, type, macros, day);
    const target = day;
    day = null;
    ML.shell.close();
    ML.refresh();
    ML.shell.toast(`${name} · ${ML.fmt(kcal)} kcal${target ? ' · ' + ML.shortDate(target) : ''}`);
  }

  /* Répétition d'une consommation déjà enregistrée : un seul geste.
     On relit l'entrée au clic plutôt que de sérialiser ses macros
     dans l'attribut onclick.                                       */
  function quick(name){
    const last = ML.store.lastOf(name);
    if (!last) return '';
    return `<button class="addrecent-card" onclick="ML.add.repeat('${ML.esc(name)}')">
      <b>${ML.h(name)}</b><span><small>${ML.h(last.q)}</small><strong>${ML.fmt(last.k)}</strong> kcal</span></button>`;
  }
  function repeat(name){
    const last = ML.store.lastOf(name);
    if (last) commit(last.n, last.k, last.q, last.t, last.m);
  }

  function open(type, forDay){
    day = forDay || null;
    const title = type === 'f' ? 'Manger' : 'Boire';
    const fav = ML.store.frequent(type), rec = ML.store.recent(type);
    const remembered = [...new Set([...rec, ...fav])].slice(0, 10);
    const tools = type === 'f'
      ? `<div class="addtools">
           <button class="addtool" onclick="ML.photo.open()">${cameraIcon}<b>Photographier<br>l'assiette</b></button>
           <button class="addtool" onclick="ML.photo.scan('f')">${barcodeIcon}<b>Scanner un<br>code-barres</b></button>
         </div>`
      : `<div class="addtools single">
           <button class="addtool" onclick="ML.photo.scan('d')">${barcodeIcon}<b>Scanner une boisson</b></button>
         </div>`;
    ML.shell.panel(`<div class="addpage">
      <div class="addscroll">
        <div class="addmast"><span class="display logo">MO<br>LOW</span>
          <button class="addclose" onclick="ML.add.cancel();ML.shell.close()" aria-label="Fermer">×</button></div>
        <div class="addtitle"><h1 class="display">${title}</h1><p>Ajouter ${type === 'f' ? 'un aliment' : 'une boisson'}</p></div>
        ${day ? `<div class="addbudget">${ML.shell.budget(day)}</div>` : ''}
        <label class="addsearch">${searchIcon}<input id="q"
          placeholder="Rechercher ${type === 'f' ? 'un aliment' : 'une boisson'}"
          oninput="ML.add.filter('${type}')"></label>
        ${tools}
        ${remembered.length ? `<div class="addsection"><h2>Récents</h2></div>
          <div class="addrecent">${remembered.map(quick).join('')}</div>` : ''}
        <div class="addsection"><h2>${type === 'f' ? 'Tous les aliments' : 'Toutes les boissons'}</h2></div>
        <div class="addlist" id="list"></div>
      </div>
      <nav class="nav addnav"></nav>
    </div>`, 'add-panel');
    ML.shell.nav('home');
    filter(type);
  }

  function filter(type){
    const q = (ML.$('q').value || '').toLowerCase().trim();
    const list = src(type);
    ML.$('list').innerHTML = list
      .map((x, i) => ({x, i}))
      .filter(({x}) => x.n.toLowerCase().includes(q))
      .map(({x, i}) => {
        const portion = type === 'd' ? x.v : x.u;
        const portionKcal = portion ? ML.fmt(portion * x.k / 100) : null;
        const kcal = type === 'd' || x.estimated ? portionKcal : ML.fmt(x.k);
        const measure = type === 'd'
          ? (x.portionLabel || `${x.v} ml`)
          : x.estimated ? '1 portion estimée' : '100 g';
        return `<button class="addrow" onclick="ML.add.detail('${type}',${i})">
          <b>${ML.h(x.n)}</b><span><strong>${kcal}</strong> kcal<small>${ML.h(measure)}</small></span></button>`;
      }).join('')
      || `<div class="empty" style="padding:14px 0">Pas dans la base. Un scan de code-barres l'y ajoutera définitivement.</div>`;
  }

  /* Portions proposées : pièces si l'aliment se compte, sinon paliers
     de grammage. Le curseur reste là pour les cas hors gabarit.      */
  function presets(type, x){
    if (type === 'd'){
      const one = x.portionLabel || '1 verre';
      return [[x.v, one], [x.v * 2, '2 verres'], [100, '100 ml'], [250, '250 ml'], [500, '500 ml']];
    }
    if (x.u){
      const one = x.portionLabel || '1 pièce';
      const many = x.portionLabel ? 'portions' : 'pièces';
      return [[x.u, one], [x.u * 2, `2 ${many}`], [x.u * 3, `3 ${many}`], [100, '100 g']];
    }
    return [[50, '50 g'], [100, '100 g'], [150, '150 g'], [200, '200 g'], [300, '300 g']];
  }

  function detail(type, i){
    const x = src(type)[i];
    cur = {type, x, q: type === 'd' ? x.v : (x.u || 100)};
    ML.shell.panel(ML.shell.head(x.n) + `<div class="pbody">
      ${x.estimated ? `<p class="sub" style="margin-bottom:12px">${x.restaurant ? ML.h(x.restaurant) + ' · ' : ''}
        Valeur estimée pour une portion d'environ ${x.u} g.</p>` : ''}
      <div class="qty">${presets(type, x).map(([v, l]) =>
        `<button data-q="${v}" onclick="ML.add.setQty(${v})">${l}</button>`).join('')}</div>
      <input class="slide" type="range" min="10" max="${type === 'd' ? 700 : 400}" step="5"
             value="${cur.q}" oninput="ML.add.setQty(+this.value)">
      <div class="big2 num" id="dk"></div><div class="sub" id="dq"></div>
      <button class="cta" onclick="ML.add.confirm()">Ajouter</button></div>`);
    setQty(cur.q);
  }

  function setQty(v){
    cur.q = v;
    ML.$('dk').textContent = ML.fmt(v * cur.x.k / 100) + ' kcal';
    ML.$('dq').textContent = v + unit(cur.type);
    document.querySelectorAll('.qty button').forEach(b => b.classList.toggle('on', +b.dataset.q === v));
    const s = document.querySelector('.slide');
    if (s && +s.value !== v) s.value = v;
  }

  const confirm = () => commit(cur.x.n, cur.q * cur.x.k / 100,
                               cur.q + unit(cur.type), cur.type, ML.scale(cur.x, cur.q));

  /* Reprise d'un produit scanné : même écran de portion, base ad hoc. */
  function detailCustom(item, type, presetList){
    cur = {type, x:item, q:presetList[0][0]};
    ML.shell.panel(ML.shell.head(item.n) + `<div class="pbody">
      <p class="sub" style="margin-bottom:12px">${ML.h(item.src || '')} ${item.k} kcal / 100 ${type === 'd' ? 'ml' : 'g'}</p>
      <div class="qty">${presetList.map(([v, l]) =>
        `<button data-q="${v}" onclick="ML.add.setQty(${v})">${l}</button>`).join('')}</div>
      <input class="slide" type="range" min="10" max="${type === 'd' ? 700 : 400}" step="5" value="${cur.q}"
             oninput="ML.add.setQty(+this.value)">
      <div class="big2 num" id="dk"></div><div class="sub" id="dq"></div>
      <button class="cta" onclick="ML.add.confirm()">Ajouter</button></div>`);
    setQty(cur.q);
  }

  /* ---- J'AI FAIM : filtrage local, aucun appel réseau ---- */
  function hungry(){
    const left = ML.store.left();
    if (left <= 0){
      ML.shell.panel(ML.shell.head("J'ai faim") + `<div class="pbody">
        <p style="font-size:16px;line-height:1.6">Ton budget du jour est bouclé.
        Un café noir ou un grand verre d'eau passent sans presque rien coûter.</p>
        <button class="cta ghost" onclick="ML.add.open('d')">Voir les boissons</button></div>`);
      return;
    }
    const portion = x => x.u || 100;
    const kcal = x => portion(x) * x.k / 100;
    const fits = ML.FOODS.map((x, i) => ({x, i})).filter(({x}) => kcal(x) <= left)
                   .sort((a, b) => kcal(a.x) - kcal(b.x));
    const band = (lo, hi) => fits.filter(({x}) => kcal(x) >= lo && kcal(x) <= hi).slice(0, 4);
    const tiers = [['Léger', band(0, left * .35)],
                   ['Rassasiant', band(left * .35, left * .7)],
                   ['Vrai repas', band(left * .7, left)]];

    ML.shell.panel(ML.shell.head("J'ai faim") +
      `<div class="budget">Il te reste <b>${ML.fmt(left)} kcal</b>. Voilà ce qui rentre.</div>
       <div class="pbody">${tiers.filter(([, l]) => l.length).map(([t, l]) =>
        `<div class="sec">${t}</div><div class="chips list">${l.map(({x, i}) =>
          `<button class="chip" onclick="ML.add.detail('f',${i})">
             <b>${ML.h(x.n)}</b><span>${ML.fmt(kcal(x))} kcal pour ${portion(x)} g</span></button>`).join('')}</div>`).join('')}
       <p class="note">Suggestions tirées de ta base, sans appel à l'IA.</p></div>`);
  }

  return {open, filter, detail, detailCustom, setQty, confirm, commit, repeat, hungry,
          get day(){ return day; }, cancel(){ day = null; }};
})();
