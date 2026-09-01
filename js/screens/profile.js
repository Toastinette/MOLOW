/* ------------------------------------------------------------------
   profile.js — première ouverture et réglages
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.profile = (() => {

  /* ---- onboarding ---- */
  function bindOnboarding(){
    document.querySelectorAll('#o-sex button').forEach(b => b.onclick = () => {
      document.querySelectorAll('#o-sex button').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); preview();
    });
    ['o-age', 'o-h', 'o-w', 'o-act', 'o-def'].forEach(id => {
      const el = ML.$(id); el.oninput = preview; el.onchange = preview;
    });
    preview();
  }

  function compute(){
    const sex = document.querySelector('#o-sex .on').dataset.v;
    const p = {sex, age:+ML.$('o-age').value, h:+ML.$('o-h').value,
               w:+ML.$('o-w').value, act:+ML.$('o-act').value};
    const spend = ML.store.tdee(p);
    /* Objectif arrondi à la dizaine : la précision au kcal près serait
       une fausse précision sur une estimation à ±10 %.               */
    const goal = Math.round((spend - (+ML.$('o-def').value || 0)) / 10) * 10;
    return {p, spend, goal};
  }

  function preview(){
    const {spend, goal} = compute();
    ML.$('o-recap').innerHTML =
      `Maintien estimé <b>${ML.fmt(spend)} kcal</b><br>Objectif quotidien <b>${ML.fmt(goal)} kcal</b>`;
    ML.theme.apply(1);
  }

  function finish(){
    const {p, goal} = compute();
    ML.store.setProfile(p, goal);
    if (p.w) ML.store.addWeight(p.w);
    ML.$('onboarding').classList.add('hide');
    ML.go('home');
  }

  /* ---- écran profil ---- */
  function render(){
    ML.theme.sync();
    const g = ML.$('p-goal');
    g.value = ML.store.goal;
    g.oninput = () => { ML.store.setGoal(+g.value || 2000); recap(); ML.theme.sync(); };
    recap();
    ML.$('wlist').innerHTML = ML.store.weights.slice().reverse().map(w =>
      `<div><span>${ML.shortDate(w.d)}</span><b>${w.kg} kg</b></div>`).join('')
      || `<div class="empty" style="padding:16px 0">Aucune pesée. Note ton poids une fois par semaine, au réveil.</div>`;
  }

  function recap(){
    const p = ML.store.profile;
    ML.$('p-recap').textContent = p
      ? `Maintien estimé ${ML.fmt(ML.store.tdee())} kcal · déficit actuel ${ML.fmt(ML.store.tdee() - ML.store.goal)} kcal par jour.`
      : '';
  }

  function saveWeight(){
    const v = parseFloat(ML.$('p-w').value);
    if (!v) return;
    ML.store.addWeight(v);
    ML.$('p-w').value = '';
    render();
    ML.shell.toast('Poids noté');
  }

  /* --- sauvegarde manuelle ---
     Les données vivent dans le stockage du navigateur, qui part avec
     un nettoyage de l'historique. L'export est la seule assurance.  */
  function exportFile(){
    const blob = new Blob([ML.store.exportData()], {type:'application/json'});
    const name = `molow-${ML.today()}.json`;
    const file = new File([blob], name, {type:'application/json'});
    if (navigator.canShare && navigator.canShare({files:[file]})){
      navigator.share({files:[file], title:'Sauvegarde MO LOW'}).catch(() => {});
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    ML.shell.toast('Sauvegarde exportée');
  }

  function importFile(input){
    const f = input.files && input.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        await ML.store.importData(r.result);
        ML.shell.toast('Sauvegarde restaurée');
        setTimeout(() => location.reload(), 700);
      } catch (e) {
        ML.shell.toast('Fichier illisible');
      }
    };
    r.readAsText(f);
    input.value = '';
  }

  async function reset(){
    if (!confirm('Effacer le profil, tout le journal et l\'historique de poids ? Cette action est définitive.')) return;
    await ML.store.reset();
    location.reload();
  }

  return {bindOnboarding, preview, finish, render, saveWeight, reset, exportFile, importFile};
})();
