/* ------------------------------------------------------------------
   store.js — état, persistance, calculs
   Toute écriture passe par ML.store.* : c'est le seul endroit qui
   touche au stockage, donc le seul à changer pour brancher SQLite.
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.store = (() => {
  const KEY = 'molow:beta:v3';
  const blank = () => ({profile:null, goal:2000, entries:[], weights:[]});
  let S = blank();

  /* Deux dorsales possibles : l'API hôte quand elle existe (bac à sable
     de prévisualisation), localStorage partout ailleurs. Sans ce repli,
     l'app tourne en mémoire et perd tout au rechargement.            */
  const hasHost = () => !!(window.storage && window.storage.get && window.storage.set);
  let failed = false;

  /* Migration sans changement de clé de stockage : les anciennes entrées
     restent intactes, seul le nom du restaurant est actualisé. */
  function migrateNames(){
    let changed = false;
    S.entries.forEach(entry => {
      if (typeof entry.n === 'string' && entry.n.startsWith('Les Boucaniers · ')){
        entry.n = entry.n.replace('Les Boucaniers · ', 'Bololos · ');
        changed = true;
      }
      if (typeof entry.q === 'string'){
        const renamed = entry.q.replaceAll('Les Boucaniers · ', 'Bololos · ');
        if (renamed !== entry.q){ entry.q = renamed; changed = true; }
      }
    });
    return changed;
  }

  async function load(){
    try {
      let raw = null;
      if (hasHost()){
        const r = await window.storage.get(KEY);
        raw = r && r.value ? r.value : null;
      } else {
        raw = localStorage.getItem(KEY);
      }
      if (raw){
        S = Object.assign(blank(), JSON.parse(raw));
        if (migrateNames()) await save();
      }
    } catch (e) {
      console.warn('Chargement impossible', e);
    }
    return S;
  }

  async function save(){
    const raw = JSON.stringify(S);
    try {
      if (hasHost()) await window.storage.set(KEY, raw);
      else localStorage.setItem(KEY, raw);
      failed = false;
    } catch (e) {
      /* Quota dépassé ou stockage bloqué : on prévient une fois, mais
         on ne casse pas l'interface — la session reste utilisable.  */
      console.warn('Sauvegarde impossible', e);
      if (!failed && window.ML && ML.shell){
        failed = true;
        ML.shell.toast('Sauvegarde impossible sur cet appareil');
      }
    }
  }

  /* --- export / import ---
     Le stockage du navigateur est effacé avec les données de navigation.
     Sans export, six mois de journal partent sans avertissement.      */
  function exportData(){
    return JSON.stringify({app:'MO LOW', version:3, exported:new Date().toISOString(), data:S}, null, 2);
  }
  async function importData(text){
    const parsed = JSON.parse(text);
    const d = parsed && parsed.data ? parsed.data : parsed;
    if (!d || !Array.isArray(d.entries)) throw new Error('Fichier non reconnu');
    S = Object.assign(blank(), d);
    migrateNames();
    await save();
    return S;
  }

  /* --- journal --- */
  const entriesOf = d => S.entries.filter(x => x.d === d);
  const totalOf   = d => entriesOf(d).reduce((s, x) => s + x.k, 0);
  const drinkOf   = d => entriesOf(d).filter(x => x.t === 'd').reduce((s, x) => s + x.k, 0);

  /* macros : {p, c, f, a} en grammes. Stockées avec l'entrée pour que
     le détail du jour n'ait jamais à re-résoudre les aliments.        */
  function addEntry(name, kcal, qty, type, macros, day){
    const now = new Date();
    /* day permet de rattraper une journée oubliée depuis le calendrier.
       Sur une journée passée, l'heure n'a pas de sens : on la laisse vide. */
    const d = day || ML.today();
    S.entries.push({id:ML.uid(), d, h:d === ML.today() ? now.toTimeString().slice(0,5) : '—',
                    n:name, k:Math.round(kcal), q:qty, t:type,
                    m:macros || {p:0, c:0, f:0, a:0}});
    save();
  }
  function removeEntry(id){ S.entries = S.entries.filter(x => x.id !== id); save(); }

  /* Les six derniers noms distincts, et les plus répétés : c'est ce qui
     alimente les blocs d'ajout en un geste.                            */
  function recent(type, n = 6){
    const seen = [];
    for (let i = S.entries.length - 1; i >= 0 && seen.length < n; i--){
      const e = S.entries[i];
      if (e.t === type && !seen.includes(e.n)) seen.push(e.n);
    }
    return seen;
  }
  function frequent(type, n = 6){
    const c = {};
    S.entries.filter(x => x.t === type).forEach(x => c[x.n] = (c[x.n] || 0) + 1);
    return Object.keys(c).filter(k => c[k] > 1).sort((a,b) => c[b] - c[a]).slice(0, n);
  }
  const lastOf = name => [...S.entries].reverse().find(x => x.n === name);

  /* --- macronutriments --- */
  function macrosOf(d){
    const t = {p:0, c:0, f:0, a:0};
    entriesOf(d).forEach(x => {
      if (!x.m) return;
      t.p += x.m.p || 0; t.c += x.m.c || 0; t.f += x.m.f || 0; t.a += x.m.a || 0;
    });
    return t;
  }

  /* Répartition de référence pour un déficit : protéines calées sur le
     poids corporel à 1,6 g/kg (préserver la masse maigre), lipides à 30 %,
     glucides en variable d'ajustement. Pas de cible sur l'alcool, qui
     n'apporte rien d'autre que des calories.                          */
  function macroTargets(){
    const w = S.profile ? S.profile.w : 0;
    const p = w ? Math.round(w * 1.6) : Math.round(S.goal * .25 / 4);
    const f = Math.round(S.goal * .30 / 9);
    const c = Math.max(0, Math.round((S.goal - p * 4 - f * 9) / 4));
    return {p, c, f};
  }

  /* --- poids --- */
  function addWeight(kg){
    S.weights = S.weights.filter(x => x.d !== ML.today());
    S.weights.push({d:ML.today(), kg});
    S.weights.sort((a,b) => a.d < b.d ? -1 : 1);
    save();
  }

  /* --- métabolisme (Mifflin-St Jeor) --- */
  function bmr(p = S.profile){
    if (!p) return 0;
    const b = 10*p.w + 6.25*p.h - 5*p.age;
    return p.sex === 'h' ? b + 5 : b - 161;
  }
  const tdee = (p = S.profile) => bmr(p) * (p ? p.act : 1);

  /* --- couleur du calendrier : verdict sur la journée --- */
  function dayState(d){
    if (!entriesOf(d).length) return '';
    const t = totalOf(d);
    return t <= S.goal ? 'v' : t <= S.goal * 1.1 ? 'o' : 'r';
  }

  function setGoal(v){ S.goal = v; save(); }
  function setProfile(p, goal){ S.profile = p; S.goal = goal; save(); }
  async function reset(){ S = blank(); await save(); }

  return {
    get s(){ return S; },
    get goal(){ return S.goal; },
    get profile(){ return S.profile; },
    get weights(){ return S.weights; },
    load, save, entriesOf, totalOf, drinkOf, addEntry, removeEntry,
    recent, frequent, lastOf, addWeight, bmr, tdee, dayState,
    macrosOf, macroTargets,
    setGoal, setProfile, reset, exportData, importData,
    today: () => ML.today(),
    left: () => S.goal - totalOf(ML.today())
  };
})();
