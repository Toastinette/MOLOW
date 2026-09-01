/* ------------------------------------------------------------------
   app.js — routeur et amorçage. Chargé en dernier.
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.VIEWS = {
  home:    () => ML.home.render(),
  journal: () => ML.journal.render(),
  profile: () => ML.profile.render()
};

/* Re-rend la vue active. Utilisé après un ajout : selon qu'on est sur
   l'accueil ou dans le calendrier, ce n'est pas le même écran à mettre
   à jour.                                                            */
ML.refresh = function(){
  const active = Object.keys(ML.VIEWS).find(v => !ML.$(v).classList.contains('hide'));
  if (active) ML.VIEWS[active]();
};

ML.go = function(view){
  Object.keys(ML.VIEWS).concat('onboarding').forEach(v => ML.$(v).classList.add('hide'));
  ML.$(view).classList.remove('hide');
  ML.shell.nav(view);
  (ML.VIEWS[view] || (() => {}))();
  window.scrollTo(0, 0);
};

/* Raccourcis du manifeste : ?a=eat / ?a=drink ouvrent directement le
   panneau d'ajout depuis l'appui long sur l'icône.                  */
function handleShortcut(){
  const a = new URLSearchParams(location.search).get('a');
  if (a === 'eat') ML.add.open('f');
  if (a === 'drink') ML.add.open('d');
  if (a) history.replaceState({}, '', location.pathname);
}

(async function boot(){
  await ML.store.load();
  if (!ML.store.profile){
    ML.$('onboarding').classList.remove('hide');
    ML.profile.bindOnboarding();
  } else {
    ML.go('home');
    handleShortcut();
  }
})();

/* Le service worker n'existe que sur une page servie en HTTP(S).
   Ouverte en file://, l'app fonctionne, simplement sans hors ligne. */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .catch(err => console.warn('Service worker indisponible', err));
  });
}
