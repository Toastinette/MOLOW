/* ------------------------------------------------------------------
   add.js — MANGER, BOIRE, réglage de portion, J'AI FAIM
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.add = (() => {
  const src = t => t === 'f' ? ML.FOODS : ML.DRINKS;
  const unit = t => t === 'f' ? ' g' : ' ml';
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
  function quick(name, type){
    const last = ML.store.lastOf(name);
    if (!last) return '';
    return `<button class="chip" onclick="ML.add.repeat('${ML.esc(name)}')">
      <b>${ML.h(name)}</b><span>${ML.h(last.q)} · ${ML.fmt(last.k)} kcal</span></button>`;
  }
  function repeat(name){
    const last = ML.store.lastOf(name);
    if (last) commit(last.n, last.k, last.q, last.t, last.m);
  }

  function open(type, forDay){
    day = forDay || null;
    const title = type === 'f' ? 'Manger' : 'Boire';
    const fav = ML.store.frequent(type), rec = ML.store.recent(type);
    const extra = type === 'f'
      ? `<button class="cta ghost" style="margin:0 0 6px" onclick="ML.photo.open()">Photographier l'assiette</button>
         <button class="cta ghost" style="margin:0" onclick="ML.photo.scan()">Scanner un code-barres</button>`
      : '';
    ML.shell.panel(ML.shell.head(title) + ML.shell.budget(day) + `<div class="pbody">
      <input class="search" id="q" placeholder="Chercher ${type === 'f' ? 'un aliment' : 'une boisson'}"
             oninput="ML.add.filter('${type}')">
      ${extra}
      ${fav.length ? `<div class="sec">Tes habitudes</div><div class="chips">${fav.map(n => quick(n, type)).join('')}</div>` : ''}
      ${rec.length ? `<div class="sec">Récent${type === 'd' ? 'es' : 's'}</div><div class="chips">${rec.map(n => quick(n, type)).join('')}</div>` : ''}
      <div class="sec">${type === 'f' ? 'Tous les aliments' : 'Toutes les boissons'}</div>
      <div class="chips list" id="list"></div></div>`);
    filter(type);
  }

  function filter(type){
    const q = (ML.$('q').value || '').toLowerCase().trim();
    const list = src(type);
    ML.$('list').innerHTML = list
      .map((x, i) => ({x, i}))
      .filter(({x}) => x.n.toLowerCase().includes(q))
      .map(({x, i}) => `<button class="chip" onclick="ML.add.detail('${type}',${i})">
        <b>${ML.h(x.n)}</b><span>${x.k} kcal / 100 ${type === 'f' ? 'g' : 'ml'}</span></button>`).join('')
      || `<div class="empty" style="padding:14px 0">Pas dans la base. Un scan de code-barres l'y ajoutera définitivement.</div>`;
  }

  /* Portions proposées : pièces si l'aliment se compte, sinon paliers
     de grammage. Le curseur reste là pour les cas hors gabarit.      */
  function presets(type, x){
    if (type === 'd') return [[x.v, '1 verre'], [x.v * 2, '2 verres'], [100, '100 ml'], [250, '250 ml'], [500, '500 ml']];
    if (x.u) return [[x.u, '1 pièce'], [x.u * 2, '2 pièces'], [x.u * 3, '3 pièces'], [100, '100 g']];
    return [[50, '50 g'], [100, '100 g'], [150, '150 g'], [200, '200 g'], [300, '300 g']];
  }

  function detail(type, i){
    const x = src(type)[i];
    cur = {type, x, q: type === 'd' ? x.v : (x.u || 100)};
    ML.shell.panel(ML.shell.head(x.n) + `<div class="pbody">
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
      <p class="sub" style="margin-bottom:12px">${ML.h(item.src || '')} ${item.k} kcal / 100 g</p>
      <div class="qty">${presetList.map(([v, l]) =>
        `<button data-q="${v}" onclick="ML.add.setQty(${v})">${l}</button>`).join('')}</div>
      <input class="slide" type="range" min="10" max="300" step="5" value="${cur.q}"
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
        Un thé, un café noir ou un grand verre d'eau passent sans rien coûter.</p>
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
