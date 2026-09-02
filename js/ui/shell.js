/* ------------------------------------------------------------------
   shell.js — chrome de l'application : nav, panneaux, toasts
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.shell = (() => {
  const TABS = [
    ['home',    '⌂', 'Accueil', "ML.shell.jump('home')"],
    ['journal', '▤', 'Journal', "ML.shell.jump('journal')"],
    ['photo',   '○', 'Photo',   "ML.shell.jump('photo')"],
    ['profile', '◍', 'Profil',  "ML.shell.jump('profile')"]
  ];

  function nav(active){
    const html = TABS.map(([k, g, l, act]) =>
      `<button class="${k === active ? 'on' : ''}" onclick="${act}">
         <span class="g">${g}</span>${l}</button>`).join('');
    document.querySelectorAll('.nav').forEach(n => n.innerHTML = html);
  }

  const panel = (html, extraClass = '') =>
    ML.$('panel').innerHTML = `<div class="panel ${extraClass}">${html}</div>`;
  const close = () => {
    /* Coupe le flux caméra s'il tournait : sans ça, la LED reste
       allumée et la batterie continue de se vider.              */
    if (window.ML && ML.photo) ML.photo.stopCamera();
    ML.$('panel').innerHTML = '';
  };

  function jump(view){
    close();
    if (view === 'photo') ML.photo.open();
    else ML.go(view);
  }

  const head = title =>
    `<div class="phead"><span class="display">${ML.h(title)}</span>
       <button class="x" onclick="ML.add.cancel();ML.shell.close()" aria-label="Fermer">×</button></div>`;

  /* Rappel du budget restant en tête de chaque panneau d'ajout :
     c'est l'information qui pilote la décision.                   */
  function budget(day){
    if (day){
      const t = ML.store.totalOf(day);
      return `<div class="budget">Rattrapage du ${ML.longDate(day)} —
        <b>${ML.fmt(t)} kcal</b> notées sur ${ML.fmt(ML.store.goal)}.</div>`;
    }
    const l = ML.store.left();
    return `<div class="budget">${l >= 0
      ? `Il te reste <b>${ML.fmt(l)} kcal</b> aujourd'hui.`
      : `Tu es à <b>${ML.fmt(-l)} kcal</b> au-dessus.`}</div>`;
  }

  let timer;
  function toast(msg){
    ML.$('toast').innerHTML = `<div class="toast">${msg}</div>`;
    clearTimeout(timer);
    timer = setTimeout(() => ML.$('toast').innerHTML = '', 2200);
  }

  return {nav, panel, close, jump, head, budget, toast};
})();
