/* ------------------------------------------------------------------
   photo.js — analyse d'un repas et scan de code-barres
   Deux frontières réseau, et elles seules :
     lookup(ean)     → Open Food Facts. Réel, sans clé, sans serveur.
     analyze(img)    → modèle multimodal. Exige un proxy : voir
                       ML.AI_ENDPOINT plus bas. Tant qu'il est vide,
                       l'écran fonctionne en démonstration assumée.
------------------------------------------------------------------- */
window.ML = window.ML || {};

/* URL du proxy d'analyse photo. Vide = mode démonstration.
   La clé du modèle vit sur ce proxy, JAMAIS dans ce fichier :
   ce dépôt est public.                                        */
ML.AI_ENDPOINT = 'https://molow-photo-analysis.adressedemorgan.workers.dev';

ML.photo = (() => {
  let items = [], stream = null, loop = null, scanTimer = null,
      scanControls = null, scanReader = null, shot = null, scanType = 'f';

  /* ---------------- caméra ---------------- */
  async function startCamera(videoEl){
    stream = await navigator.mediaDevices.getUserMedia({
      video: {facingMode: {ideal: 'environment'}}, audio: false
    });
    videoEl.srcObject = stream;
    await videoEl.play();
  }
  /* Le flux doit être coupé explicitement, sinon la LED de la caméra
     reste allumée après la fermeture du panneau.                  */
  function stopCamera(){
    if (scanControls){
      try { scanControls.stop(); } catch (e) { /* déjà arrêté */ }
      scanControls = null;
    }
    if (scanReader){
      try { scanReader.reset(); } catch (e) { /* rien à libérer */ }
      scanReader = null;
    }
    if (loop){ clearInterval(loop); loop = null; }
    if (scanTimer){ clearTimeout(scanTimer); scanTimer = null; }
    if (stream){ stream.getTracks().forEach(t => t.stop()); stream = null; }
  }

  /* ---------------- code-barres ---------------- */
  const hasZXing = () => !!(window.ZXingBrowser && ZXingBrowser.BrowserMultiFormatOneDReader);
  const canScan = () => !!(navigator.mediaDevices && (hasZXing() || 'BarcodeDetector' in window));

  function scan(type = 'f'){
    scanType = type === 'd' ? 'd' : 'f';
    ML.shell.panel(ML.shell.head('Code-barres') + `<div class="pbody">
      <div class="frame" id="scanFrame">
        <video id="cam" playsinline muted></video>
        <div class="reticle"></div>
      </div>
      <p class="sub" id="scanMsg" style="margin-top:12px">Vise le code-barres du produit.</p>
      <div class="sec">Ou saisis le code à la main</div>
      <div style="display:flex;gap:6px">
        <input class="search" style="margin:0" id="ean" inputmode="numeric"
               placeholder="Ex. 3017620422003">
        <button class="cta" style="width:auto;margin:0;padding:0 20px;font-size:17px"
                onclick="ML.photo.manual()">OK</button>
      </div>
      <p class="note">La caméra ne quitte pas le téléphone : seul le numéro lu part vers
      Open Food Facts. Un produit trouvé rejoint ta base et sera reconnu hors ligne ensuite.</p>
    </div>`);
    if (canScan()) startScan();
    else msg("Ouvre l'application installée depuis GitHub Pages pour activer la caméra, ou saisis le numéro.");
  }

  const msg = t => { const e = ML.$('scanMsg'); if (e) e.textContent = t; };

  async function startScan(){
    /* ZXing est utilisé en priorité : il fonctionne sur davantage de
       téléphones Android que l'API BarcodeDetector expérimentale. */
    if (hasZXing()){
      try {
        scanReader = new ZXingBrowser.BrowserMultiFormatOneDReader();
        scanControls = await scanReader.decodeFromConstraints({
          audio: false,
          video: {
            facingMode: {ideal: 'environment'},
            width: {ideal: 1280},
            height: {ideal: 720}
          }
        }, ML.$('cam'), result => {
          if (!result) return;
          const value = typeof result.getText === 'function' ? result.getText() : result.text;
          if (!value) return;
          stopCamera();
          resolve(value);
        });
        msg('Détection automatique active — place le code-barres au centre du cadre.');
        scanTimer = setTimeout(() => {
          msg("Toujours rien ? Éclaire le code, évite les reflets et remplis le cadre. Sinon, saisis les chiffres.");
        }, 12000);
        return;
      } catch (e) {
        stopCamera();
        if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')){
          msg("Caméra refusée. Autorise l'accès dans Chrome, puis réessaie.");
          return;
        }
        /* Si ZXing ne peut pas démarrer, on tente encore le détecteur
           natif avant de proposer la saisie manuelle. */
      }
    }

    if (!('BarcodeDetector' in window)){
      msg("Le lecteur automatique n'est pas disponible. Ouvre la version HTTPS installée, ou saisis le numéro.");
      return;
    }

    try {
      await startCamera(ML.$('cam'));
    } catch (e) {
      msg("Caméra refusée. Autorise l'accès, ou saisis le numéro à la main.");
      return;
    }

    /* Les formats disponibles dépendent du téléphone. Demander un format
       non pris en charge peut faire échouer le détecteur après l'ouverture
       de la caméra. On ne conserve donc que les formats annoncés par
       l'appareil, avec un détecteur sans filtre comme solution de repli. */
    const wanted = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
    let detector;
    try {
      const supported = typeof BarcodeDetector.getSupportedFormats === 'function'
        ? await BarcodeDetector.getSupportedFormats()
        : [];
      const formats = wanted.filter(f => supported.includes(f));
      detector = formats.length ? new BarcodeDetector({formats}) : new BarcodeDetector();
    } catch (e) {
      try { detector = new BarcodeDetector(); }
      catch (err) {
        stopCamera();
        msg("Le lecteur de ce téléphone est incompatible. Saisis le numéro à la main.");
        return;
      }
    }

    msg('Détection automatique active — centre le code-barres et rapproche doucement le téléphone.');
    let busy = false;
    loop = setInterval(async () => {
      const v = ML.$('cam');
      if (!v || v.readyState < 2 || busy) return;
      busy = true;
      try {
        const found = await detector.detect(v);
        if (found.length){
          stopCamera();
          return resolve(found[0].rawValue);
        }
      } catch (e) {
        /* Une image floue ou incomplète est normale pendant la visée.
           Le prochain passage réessaie automatiquement. */
      }
      busy = false;
    }, 300);

    scanTimer = setTimeout(() => {
      msg("Toujours rien ? Éclaire le code, évite les reflets et remplis le cadre. Sinon, saisis les chiffres.");
    }, 12000);
  }

  function manual(){
    const v = (ML.$('ean').value || '').replace(/\D/g, '');
    if (v.length < 8) return msg('Un code-barres fait au moins 8 chiffres.');
    stopCamera();
    resolve(v);
  }

  async function resolve(ean){
    msg('Recherche du produit…');
    let p;
    try { p = await lookup(ean, scanType); }
    catch (e) { return msg("Pas de réseau. Réessaie, ou ajoute le produit à la main."); }
    if (!p) return msg(`Code ${ean} inconnu d'Open Food Facts. Ajoute-le à la main depuis ${scanType === 'd' ? 'BOIRE' : 'MANGER'}.`);
    if (p.missingNutrition) return msg(`${p.n} est bien dans Open Food Facts, mais sa fiche nutritionnelle est incomplète.`);
    const presets = scanType === 'd'
      ? [[p.portion, '1 portion'], [330, '33 cl'], [500, '50 cl'], [100, '100 ml']]
      : [[p.portion, '1 portion'], [p.portion * 2, '2 portions'], [100, '100 g'], [p.pack, 'Le paquet']];
    ML.add.detailCustom(p, scanType, presets);
  }

  /* --- FRONTIÈRE RÉSEAU 1 : Open Food Facts ---
     API publique, sans clé, sans quota bloquant. Base contributive :
     tout ce qui en sort est nettoyé et borné avant affichage.     */
  async function lookup(ean, type){
    const url = 'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(ean)
              + '.json?product_type=all&fields=product_name,product_name_fr,brands,nutriments,serving_quantity,serving_size,quantity,product_quantity,product_quantity_unit';
    const r = await fetch(url);
    if (!r.ok) throw new Error('réseau');
    const j = await r.json();
    if (!j || j.status !== 1 || !j.product) return null;

    const pr = j.product, nu = pr.nutriments || {};
    const name = ML.cleanName(pr.product_name_fr || pr.product_name || '') || 'Produit ' + ean;
    const brand = ML.cleanName((pr.brands || '').split(',')[0] || '');
    const displayName = brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} (${brand})` : name;
    const number = (...values) => {
      for (const value of values){
        if (value === '' || value === null || value === undefined) continue;
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
      return null;
    };
    const amount = value => {
      const match = String(value || '').toLowerCase().replace(',', '.').match(/([0-9.]+)\s*(ml|cl|l|g|kg)?/);
      if (!match) return null;
      const valueNumber = Number(match[1]);
      if (!Number.isFinite(valueNumber)) return null;
      if (match[2] === 'cl') return valueNumber * 10;
      if (match[2] === 'l' || match[2] === 'kg') return valueNumber * 1000;
      return valueNumber;
    };
    const portion = number(pr.serving_quantity) || amount(pr.serving_size) || (type === 'd' ? 330 : 30);
    const pack = number(pr.product_quantity) || amount(pr.quantity) || (type === 'd' ? 330 : 200);

    /* Open Food Facts normalise les liquides pour 100 ml dans les champs
       suffixés _100g. Certaines fiches ne donnent toutefois qu'une portion.
       Une valeur de zéro est valide et ne doit pas être confondue avec une
       donnée manquante (eau, sodas sans sucre, etc.). */
    let kcal = number(nu['energy-kcal_100g']);
    if (kcal === null){
      const kj = number(nu['energy-kj_100g'], nu.energy_100g);
      if (kj !== null) kcal = kj / 4.184;
    }
    if (kcal === null && portion > 0){
      const servingKcal = number(nu['energy-kcal_serving']);
      const servingKj = number(nu['energy-kj_serving'], nu.energy_serving);
      if (servingKcal !== null) kcal = servingKcal * 100 / portion;
      else if (servingKj !== null) kcal = servingKj / 4.184 * 100 / portion;
    }
    if (kcal === null) return {n:displayName, missingNutrition:true};

    const nutrient = key => {
      const per100 = number(nu[`${key}_100g`]);
      if (per100 !== null) return per100;
      const perServing = number(nu[`${key}_serving`]);
      return perServing !== null && portion > 0 ? perServing * 100 / portion : 0;
    };

    return {
      n: displayName,
      k: Math.round(kcal * 10) / 10,
      p:nutrient('proteins'), c:nutrient('carbohydrates'), f:nutrient('fat'), a:nutrient('alcohol'),
      portion: ML.clamp(Math.round(portion), 5, type === 'd' ? 1000 : 300),
      pack: ML.clamp(Math.round(pack), 20, type === 'd' ? 2000 : 500),
      src: 'Open Food Facts ·'
    };
  }

  /* ---------------- photo du repas ---------------- */
  function open(){
    ML.shell.panel(ML.shell.head('Photo') + ML.shell.budget() + `<div class="pbody">
      <label class="frame" for="shot" id="shotFrame">
        <div><div style="font-size:42px;opacity:.4">○</div>
        <div class="sub" style="margin-top:10px">Prendre une photo de l'assiette</div></div>
      </label>
      <input type="file" id="shot" class="hide" accept="image/*" capture="environment"
             onchange="ML.photo.preview(this)">
      <input class="search" id="hint" style="margin-top:14px"
             placeholder="Précision : « cuit à l'huile, sauce yaourt »">
      <p class="note" style="margin-top:10px">Pour de meilleurs résultats : photographie tout le plat
        par-dessus, avec une bonne lumière, puis précise le nom d'une recette si tu le connais.</p>
      <button class="cta" id="go" onclick="ML.photo.run()">Analyser</button>
      ${ML.AI_ENDPOINT ? '' : `<p class="note"><b>Analyse non branchée.</b> Le bouton renvoie
        une estimation de démonstration pour tester l'écran de validation. Pour une vraie
        analyse, renseigne ML.AI_ENDPOINT dans js/screens/photo.js.</p>`}
    </div>`);
  }

  /* Aperçu local, aucun envoi à ce stade. */
  function preview(input){
    const f = input.files && input.files[0];
    if (!f) return;
    shot = f;
    const url = URL.createObjectURL(f);
    ML.$('shotFrame').innerHTML = `<img src="${url}" alt="Repas photographié">`;
  }

  /* Les photos prises par un téléphone dépassent souvent la limite du
     proxy. Elles sont redimensionnées ici, avant tout envoi, sans modifier
     la photo originale enregistrée sur l'appareil.                       */
  async function prepareImage(file){
    if (!(file instanceof File)) throw new Error('photo manquante');
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)){
      throw new Error('format de photo incompatible');
    }

    let source, release = () => {};
    if ('createImageBitmap' in window){
      try {
        source = await createImageBitmap(file, {imageOrientation:'from-image'});
        release = () => source.close();
      } catch (e) { /* certains Android refusent l'option EXIF */ }
    }
    if (!source){
      const url = URL.createObjectURL(file);
      source = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('photo illisible'));
        image.src = url;
      });
      release = () => URL.revokeObjectURL(url);
    }

    try {
      const width = source.width || source.naturalWidth;
      const height = source.height || source.naturalHeight;
      const scale = Math.min(1, 1600 / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('photo illisible');
      context.drawImage(source, 0, 0, canvas.width, canvas.height);

      const encode = quality => new Promise((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('photo illisible')),
          'image/jpeg', quality);
      });
      let blob = await encode(.85);
      if (blob.size > 2.8 * 1024 * 1024) blob = await encode(.68);
      if (blob.size > 3 * 1024 * 1024) throw new Error('photo trop volumineuse');
      return blob;
    } finally {
      release();
    }
  }

  /* --- FRONTIÈRE RÉSEAU 2 : modèle multimodal ---
     Le modèle ne renvoie jamais de calories : il nomme des aliments du
     vocabulaire local et estime des grammages. Le calcul reste ici.  */
  async function analyze(file, hint){
    if (!ML.AI_ENDPOINT){
      await new Promise(r => setTimeout(r, 700));
      const meal = ML.MOCK_MEALS[Math.floor(Math.random() * ML.MOCK_MEALS.length)];
      return meal.map(x => ({n:x.n, g:x.g}));
    }
    const body = new FormData();
    const prepared = await prepareImage(file);
    body.append('image', prepared, 'repas.jpg');
    body.append('hint', hint || '');
    body.append('vocabulary', JSON.stringify(ML.FOODS.map(x => x.n)));
    body.append('catalog', JSON.stringify(ML.FOODS.map(x => ({
      n:x.n, aliases:Array.isArray(x.aliases) ? x.aliases : [], visual:x.visual || ''
    }))));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    let r;
    try {
      r = await fetch(ML.AI_ENDPOINT, {method:'POST', body, signal:controller.signal});
    } catch (e) {
      throw new Error(e && e.name === 'AbortError' ? 'analyse trop longue' : 'réseau indisponible');
    } finally {
      clearTimeout(timer);
    }
    let j = {};
    try { j = await r.json(); } catch (e) { /* réponse non JSON */ }
    if (!r.ok) throw new Error(j.error || 'analyse indisponible');
    return Array.isArray(j.items) ? j.items : [];
  }

  async function run(){
    const btn = ML.$('go');
    if (!shot) return ML.shell.toast("Prends d'abord une photo de ton assiette");
    btn.textContent = 'Analyse…';
    let raw;
    try { raw = await analyze(shot, (ML.$('hint') || {}).value || ''); }
    catch (e) {
      btn.textContent = 'Analyser';
      const known = ['photo manquante', 'format de photo incompatible', 'photo illisible',
        'photo trop volumineuse', 'réseau indisponible', 'analyse trop longue',
        'quota Gemini atteint', 'clé Gemini refusée', 'service Gemini temporairement indisponible',
        'résultat Gemini invalide', 'service non configuré'];
      return ML.shell.toast(known.includes(e.message) ? e.message : "Analyse indisponible");
    }

    /* Un aliment inconnu du catalogue est écarté : le modèle ne peut
       donc introduire ni valeur ni contenu arbitraire.            */
    items = raw.map(x => ({n:ML.cleanName(x.n), g:+x.g || 0, ref:ML.byName(ML.cleanName(x.n))}))
               .filter(x => x.ref && x.g > 0);
    if (!items.length){
      btn.textContent = 'Analyser';
      return ML.shell.toast('Rien reconnu — précise le plat ou reprends la photo');
    }
    shot = null;

    ML.shell.panel(ML.shell.head('À valider') + `<div class="pbody">
      <p class="sub" style="line-height:1.55;margin-bottom:4px">
        Corrige les quantités si besoin, le total se recalcule.</p>
      <div id="ests"></div>
      <div class="big2 num" id="tot"></div>
      <div class="sub">estimation, marge d'environ 20 %</div>
      <button class="cta" onclick="ML.photo.save()">Enregistrer le repas</button>
      <button class="cta ghost" onclick="ML.shell.close()">Annuler</button></div>`);
    renderItems();
  }

  function renderItems(){
    ML.$('ests').innerHTML = items.map((x, i) => `<div class="est">
      <span class="nm">${ML.h(x.n)}</span>
      <input type="number" inputmode="numeric" value="${x.g}"
             oninput="ML.photo.setGrams(${i}, +this.value)">
      <span class="sub">g</span>
      <span class="kc num">${ML.fmt(x.g * x.ref.k / 100)}</span>
      <button class="rm" onclick="ML.photo.drop(${i})" aria-label="Retirer">×</button></div>`).join('');
    const t = total();
    /* Fourchette plutôt qu'un chiffre net : une photo ne connaît ni
       l'huile de cuisson ni la densité réelle du plat.           */
    ML.$('tot').textContent = t ? `≈ ${ML.fmt(t * .92)}–${ML.fmt(t * 1.08)} kcal` : '0 kcal';
  }

  const total = () => items.reduce((s, x) => s + x.g * x.ref.k / 100, 0);
  function setGrams(i, g){ items[i].g = g || 0; renderItems(); }
  function drop(i){ items.splice(i, 1); renderItems(); }

  function totalMacros(){
    const t = {p:0, c:0, f:0, a:0};
    items.forEach(x => {
      const m = ML.scale(x.ref, x.g);
      t.p += m.p; t.c += m.c; t.f += m.f; t.a += m.a;
    });
    return t;
  }

  function save(){
    const t = total();
    if (!t) return ML.shell.close();
    ML.add.commit('Repas photographié', t, items.map(x => x.n).join(', '), 'f', totalMacros());
  }

  return {open, preview, run, scan, manual, save, setGrams, drop, stopCamera, analyze, lookup};
})();
