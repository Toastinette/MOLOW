/* ------------------------------------------------------------------
   add.js — MANGER, BOIRE, réglage de portion, J'AI FAIM
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.add = (() => {
  const src = t => t === 'f' ? [...ML.FOODS, ...ML.store.restaurantFoods] : ML.DRINKS;
  const unit = t => t === 'f' ? ' g' : ' ml';
  const searchIcon = `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="20" cy="20" r="13"></circle><path d="m30 30 11 11"></path></svg>`;
  const cameraIcon = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M19 18l5-7h16l5 7h8a5 5 0 0 1 5 5v27a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V23a5 5 0 0 1 5-5z"></path><circle cx="32" cy="35" r="13"></circle><path d="M32 26a9 9 0 0 1 9 9"></path></svg>`;
  const barcodeIcon = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 21V9h12M43 9h12v12M55 43v12H43M21 55H9V43"></path><path d="M19 20v24M25 20v24M31 20v24M38 20v24M45 20v24"></path></svg>`;
  let cur = {}, restaurantFilter = '', deletePendingId = '';
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
    restaurantFilter = '';
    deletePendingId = '';
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
        ${type === 'f' ? `<div class="restaurant-tabs" id="restaurantTabs"></div>
          <div id="restaurantActions"></div>` : ''}
        ${remembered.length ? `<div class="addsection"><h2>Récents</h2></div>
          <div class="addrecent">${remembered.map(quick).join('')}</div>` : ''}
        <div class="addsection"><h2 id="listTitle">${type === 'f' ? 'Tous les aliments' : 'Toutes les boissons'}</h2></div>
        <div class="addlist" id="list"></div>
      </div>
      <nav class="nav addnav"></nav>
    </div>`, 'add-panel');
    ML.shell.nav('home');
    if (type === 'f') renderRestaurantTabs();
    filter(type);
  }

  function restaurantGroups(){
    return [...new Set(src('f').map(x => x.restaurant).filter(Boolean))];
  }
  function renderRestaurantTabs(){
    const tabs = ML.$('restaurantTabs');
    if (!tabs) return;
    tabs.innerHTML = `<button class="${restaurantFilter ? '' : 'on'}" onclick="ML.add.selectRestaurant('')">Tous</button>` +
      restaurantGroups().map(name => `<button class="${restaurantFilter === name ? 'on' : ''}"
        onclick="ML.add.selectRestaurant('${ML.esc(name)}')">${ML.h(name)}</button>`).join('');
    const dynamic = ML.store.restaurants.find(x => x.name === restaurantFilter);
    const actions = ML.$('restaurantActions');
    if (actions) actions.innerHTML = dynamic ? `<div class="restaurant-manage ${deletePendingId === dynamic.id ? 'danger' : ''}">
      <span>${deletePendingId === dynamic.id ? 'Le journal déjà enregistré sera conservé.' : `${dynamic.foods.length} plat${dynamic.foods.length > 1 ? 's' : ''} enregistrés`}</span>
      ${deletePendingId === dynamic.id
        ? `<button onclick="ML.add.deleteRestaurant('${ML.esc(dynamic.id)}')">Confirmer</button>
           <button onclick="ML.add.cancelDelete()">Annuler</button>`
        : `<button onclick="ML.add.deleteRestaurant('${ML.esc(dynamic.id)}')">Supprimer le restaurant</button>`}</div>` : '';
    const title = ML.$('listTitle');
    if (title) title.textContent = restaurantFilter || 'Tous les aliments';
  }
  function selectRestaurant(name){
    restaurantFilter = name || '';
    deletePendingId = '';
    renderRestaurantTabs();
    filter('f');
  }
  function deleteRestaurant(id){
    const restaurant = ML.store.restaurants.find(x => x.id === id);
    if (!restaurant) return;
    if (deletePendingId !== id){ deletePendingId = id; renderRestaurantTabs(); return; }
    ML.store.removeRestaurant(id);
    deletePendingId = '';
    restaurantFilter = '';
    renderRestaurantTabs();
    filter('f');
    ML.shell.toast(`${restaurant.name} supprimé du catalogue`);
  }
  function cancelDelete(){ deletePendingId = ''; renderRestaurantTabs(); }

  function filter(type){
    const q = (ML.$('q').value || '').toLowerCase().trim();
    const list = src(type);
    ML.$('list').innerHTML = list
      .map((x, i) => ({x, i}))
      .filter(({x}) => x.n.toLowerCase().includes(q) &&
        (type !== 'f' || !restaurantFilter || x.restaurant === restaurantFilter))
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
      ${x.kcalHigh ? `<div class="prudence"><b>Estimation prudente : ${ML.fmt(x.kcalHigh)} kcal retenues</b>
        <span>Fourchette IA : ${ML.fmt(x.kcalLow)}–${ML.fmt(x.kcalHigh)} kcal</span></div>` : ''}
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

  /* ---- J'AI FAIM : collations dédiées, jamais les repas complets ---- */
  const dailySnackScore = (name, category) => {
    const today = new Date();
    const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}|${category}|${name}`;
    let hash = 2166136261;
    for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
    return (hash >>> 0) / 4294967295;
  };

  function hungry(){
    day = null;
    const left = ML.store.left();
    const categories = ['Léger','Santé','Plaisir'];
    const targets = {Léger:Math.min(left, 100), Santé:Math.min(left, 230), Plaisir:Math.min(left, 360)};
    const suggestions = categories.map(category => [category, ML.SNACKS
      .map((snack, index) => ({snack, index}))
      .filter(({snack}) => snack.category === category && snack.portionKcal <= left)
      .sort((a, b) => {
        const target = Math.max(1, targets[category]);
        const score = ({snack}) => Math.abs(snack.portionKcal - target) / target * .45 +
          dailySnackScore(snack.n, category) * .55;
        return score(a) - score(b);
      })
      .slice(0, 5)]).filter(([, list]) => list.length);
    const content = left <= 0
      ? `<div class="hungry-empty"><b>Budget du jour atteint</b><p>Si c'est de la soif, commence par un grand verre d'eau. Sinon, tu peux toujours noter honnêtement une collation.</p>
           <button onclick="ML.add.open('d')">Voir les boissons</button></div>`
      : suggestions.length ? suggestions.map(([category, list]) => `<section class="snack-section ${category.toLowerCase().replace('é','e')}">
          <div class="snack-heading"><h2>${category}</h2><span>${category === 'Léger' ? 'petite faim' : category === 'Santé' ? 'plus rassasiant' : 'envie gourmande'}</span></div>
          <div class="snack-grid">${list.map(({snack, index}) => `<button class="snack-card" onclick="ML.add.snackDetail(${index})">
            <b>${ML.h(snack.n)}</b><span><strong>${ML.fmt(snack.portionKcal)}</strong> kcal</span>
            <small>${ML.h(snack.portionLabel)} · ${snack.u} g${snack.p * snack.u / 100 >= 5 ? ` · ${ML.fmt(snack.p * snack.u / 100)} g protéines` : ''}</small>
          </button>`).join('')}</div></section>`).join('')
        : `<div class="hungry-empty"><b>Moins de ${ML.fmt(Math.max(0,left))} kcal disponibles</b><p>Aucune portion complète du catalogue ne rentre dans ce budget.</p></div>`;

    ML.shell.panel(`<div class="addpage hungry-page"><div class="addscroll">
      <div class="addmast"><span class="display logo">MO<br>LOW</span>
        <button class="addclose" onclick="ML.shell.close()" aria-label="Fermer">×</button></div>
      <div class="addtitle"><h1 class="display">J'ai faim</h1><p>Une collation qui rentre dans la journée</p></div>
      <div class="hungry-budget"><span>Calories disponibles</span><b>${ML.fmt(Math.max(0,left))}</b><small>kcal</small></div>
      <p class="hungry-intro">Des idées différentes chaque jour, adaptées à tes calories restantes. Choisis une envie, puis ajuste la quantité si nécessaire.</p>
      ${content}
    </div><nav class="nav addnav"></nav></div>`, 'add-panel');
    ML.shell.nav('home');
  }

  function snackDetail(index){
    const snack = ML.SNACKS[index];
    if (!snack) return;
    detailCustom(snack, 'f', [[snack.u, snack.portionLabel], [snack.u * 2, '2 portions'], [100, '100 g']]);
  }

  return {open, filter, detail, detailCustom, setQty, confirm, commit, repeat, hungry, snackDetail,
          selectRestaurant, deleteRestaurant, cancelDelete,
          get day(){ return day; }, cancel(){ day = null; }};
})();
