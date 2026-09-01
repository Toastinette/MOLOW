/* ------------------------------------------------------------------
   home.js — écran principal
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.home = (() => {
  /* L'échelle de la barre va au-delà de l'objectif pour que le
     dépassement ait de la place : sans ça, la jauge sature et
     n'apprend plus rien passé la limite.                        */
  const OVERSHOOT = 1.3;

  function progress(consumed, goal){
    const max  = goal * OVERSHOOT;
    const pos  = ML.clamp(consumed / max * 100, 0, 100);
    const tick = 100 / OVERSHOOT;
    const over = consumed > goal;
    return `<div class="prog">
      <div class="track">
        <div class="fill${over ? ' over' : ''}" style="width:${pos}%"></div>
        <div class="tick" style="left:${tick}%"></div>
        <div class="head" style="left:${pos}%"></div>
      </div>
      <div class="scale">
        <span class="l">0</span>
        <span class="o" style="left:${tick}%"><b>${ML.fmt(goal)}</b><span>objectif</span></span>
        <span class="r">${ML.fmt(max)}</span>
      </div></div>`;
  }

  function render(){
    const d = ML.store.today(), consumed = ML.store.totalOf(d), goal = ML.store.goal;
    const left = goal - consumed;
    ML.theme.apply(left / goal);

    /* Le chiffre et la flèche sont deux colonnes d'une même ligne :
       la flèche ne se superpose plus au texte quel que soit le nombre
       de chiffres, et devient l'entrée vers le détail du jour.      */
    ML.$('hero').innerHTML = `
      <div class="heroTxt"><div class="big">${left >= 0 ? ML.fmt(left) : '+' + ML.fmt(-left)}
        <small>${left >= 0 ? 'kcal restantes' : 'kcal au-dessus'}</small></div></div>
      <button class="arrow" onclick="ML.macros.open()" aria-label="Détail des macronutriments">
        ${left >= 0 ? '↘' : '↑'}</button>`;

    ML.$('prog').innerHTML = progress(consumed, goal);
    ML.$('hcons').textContent = ML.fmt(consumed);
    ML.$('hgoal').textContent = ML.fmt(goal);

    const drinks = ML.store.drinkOf(d);
    ML.$('hdrink').textContent = drinks > 0 ? `${ML.fmt(drinks)} kcal de boissons` : '';

    const rows = ML.store.entriesOf(d).slice().reverse();
    ML.$('hlist').innerHTML = rows.length
      ? rows.map(x => `<div class="jrow">
          <span class="dot ${x.t === 'd' ? 'd' : ''}"></span>
          <span class="nm"><b>${ML.h(x.n)}</b><span>${ML.h(x.h)} · ${ML.h(x.q)}</span></span>
          <span class="kc num">${ML.fmt(x.k)}</span>
          <button class="del" onclick="ML.home.remove('${x.id}')" aria-label="Supprimer">×</button>
        </div>`).join('')
      : `<div class="empty">Rien de noté aujourd'hui. Le premier café compte aussi.</div>`;
  }

  function remove(id){ ML.store.removeEntry(id); render(); }

  return {render, remove, progress};
})();
