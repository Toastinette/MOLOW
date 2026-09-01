/* ------------------------------------------------------------------
   journal.js — calendrier et recul hebdomadaire
   Attention : l'échelle de couleur du calendrier est INDÉPENDANTE de
   celle de l'accueil. Ici, vert = objectif tenu (un verdict sur la
   journée close). Sur l'accueil, la couleur est une jauge de budget.
   Deux questions différentes, deux échelles.
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.journal = (() => {
  let cursor = new Date(), selected = null;
  const DOW = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'];

  function render(){
    ML.theme.sync();
    const y = cursor.getFullYear(), m = cursor.getMonth();
    ML.$('mlabel').textContent = cursor.toLocaleDateString('fr-FR', {month:'long', year:'numeric'});

    const offset = (new Date(y, m, 1).getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    let html = DOW.map(d => `<div class="dow">${d}</div>`).join('');
    for (let i = 0; i < offset; i++) html += '<div></div>';
    for (let d = 1; d <= days; d++){
      const k = ML.dkey(new Date(y, m, d));
      const has = ML.store.entriesOf(k).length;
      html += `<div class="day ${ML.store.dayState(k)} ${k === ML.today() ? 'today' : ''}"
                 onclick="ML.journal.select('${k}')">${d}
               ${has ? `<small>${ML.fmt(ML.store.totalOf(k))}</small>` : ''}</div>`;
    }
    ML.$('cal').innerHTML = html;
    week();
    if (selected) select(selected);
  }

  function week(){
    const keys = [...Array(7)].map((_, i) => ML.dkey(new Date(Date.now() - i * 864e5)))
                   .filter(k => ML.store.entriesOf(k).length);
    const avg = keys.length ? keys.reduce((s, k) => s + ML.store.totalOf(k), 0) / keys.length : 0;
    const inGoal = keys.filter(k => ML.store.totalOf(k) <= ML.store.goal).length;
    /* Déficit réel = dépense estimée − consommé, cumulé sur les jours
       renseignés. C'est ce chiffre que le suivi du poids vient vérifier. */
    const spend = ML.store.profile ? ML.store.tdee() : ML.store.goal;
    const deficit = keys.length ? (spend - avg) * keys.length : 0;
    const w = ML.store.weights;
    const delta = w.length > 1 ? (w[w.length - 1].kg - w[0].kg) : null;

    ML.$('wk').innerHTML = `
      <div><b>${keys.length ? ML.fmt(avg) : '—'}</b><span>moyenne sur 7 jours</span></div>
      <div><b>${keys.length ? inGoal + '/' + keys.length : '—'}</b><span>journées dans l'objectif</span></div>
      <div><b>${keys.length ? ML.fmt(deficit) : '—'}</b><span>déficit estimé cumulé</span></div>
      <div><b>${delta !== null ? (delta > 0 ? '+' : '') + delta.toFixed(1) + ' kg' : '—'}</b><span>évolution du poids</span></div>`;
  }

  function select(k){
    selected = k;
    const rows = ML.store.entriesOf(k);
    ML.$('daydet').innerHTML =
      `<div class="sec" style="margin-top:26px">${ML.longDate(k)} — ${ML.fmt(ML.store.totalOf(k))} kcal</div>` +
      (rows.length
        ? rows.map(x => `<div class="jrow" style="padding-left:0;padding-right:0">
            <span class="dot ${x.t === 'd' ? 'd' : ''}"></span>
            <span class="nm"><b>${ML.h(x.n)}</b><span>${ML.h(x.h)} · ${ML.h(x.q)}</span></span>
            <span class="kc num">${ML.fmt(x.k)}</span>
            <button class="del" onclick="ML.journal.remove('${x.id}')" aria-label="Supprimer">×</button>
          </div>`).join('')
        : `<div class="empty" style="padding-left:0">Rien noté ce jour-là.</div>`)
      /* Rattrapage : sans ça, une journée oubliée reste fausse pour
         toujours et la moyenne hebdomadaire ment.                  */
      + `<div class="catchup">
           <button onclick="ML.add.open('f','${k}')">Ajouter à manger</button>
           <button onclick="ML.add.open('d','${k}')">Ajouter à boire</button>
         </div>`;
  }

  function remove(id){ ML.store.removeEntry(id); render(); }
  function shift(n){ cursor.setMonth(cursor.getMonth() + n); render(); }

  return {render, select, shift, remove};
})();
