/* ------------------------------------------------------------------
   MO LOW — proxy d'analyse photo
   Déployé comme Cloudflare Worker. La clé Gemini est fournie dans le
   secret GEMINI_API_KEY et ne doit jamais apparaître dans ce fichier.
------------------------------------------------------------------- */

const APP_ORIGIN = 'https://toastinette.github.io';
const WORKER_VERSION = 'photo-menu-v3';
const DEFAULT_MODEL = 'gemini-3.6-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash';
const MENU_MODEL = 'gemini-3.5-flash-lite';
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_VOCABULARY = 300;
const MAX_ITEMS = 12;
const MAX_MENU_IMAGES = 4;
const MAX_MENU_ITEMS = 60;
const MENU_BATCH_SIZE = 20;
const MAX_MENU_BYTES = 10 * 1024 * 1024;

const allowedOrigin = origin => origin === APP_ORIGIN ||
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');

function cors(origin){
  return {
    'Access-Control-Allow-Origin': allowedOrigin(origin) ? origin : APP_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(data, status, origin){
  return new Response(JSON.stringify(data), {
    status,
    headers: {...cors(origin), 'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control':'no-store'}
  });
}

const fail = (error, status, origin, requestId, code) =>
  json({error, code:code || 'analysis_error', requestId}, status, origin);

function imageToBase64(buffer){
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk){
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function readModelText(payload){
  const parts = payload && payload.candidates && payload.candidates[0] &&
    payload.candidates[0].content && payload.candidates[0].content.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map(part => typeof part.text === 'string' ? part.text : '').join('');
}

function parseModelJson(payload){
  const text = readModelText(payload).trim().replace(/^```json\s*|\s*```$/g, '');
  if (!text) throw new Error('empty_model_result');
  return JSON.parse(text);
}

function normalizeText(value){
  return String(value || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

const STOP_WORDS = new Set(['a','au','aux','avec','d','de','des','du','et','l','la','le','les','un','une']);
const stem = word => word.length > 4 ? word.replace(/s$/,'') : word;
const tokens = value => normalizeText(value).split(' ').filter(Boolean)
  .filter(word => !STOP_WORDS.has(word)).map(stem);

function textScore(left, right){
  const a = normalizeText(left), b = normalizeText(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)){
    return .9 - Math.min(.25, Math.abs(a.length - b.length) / 80);
  }
  const aa = new Set(tokens(a)), bb = new Set(tokens(b));
  if (!aa.size || !bb.size) return 0;
  let common = 0;
  aa.forEach(word => { if (bb.has(word)) common++; });
  return common / (aa.size + bb.size - common);
}

function matchFoodName(value, vocabulary, catalog){
  const wanted = normalizeText(value);
  if (!wanted) return '';
  const exact = vocabulary.find(name => normalizeText(name) === wanted);
  if (exact) return exact;

  let best = '', bestScore = 0;
  const details = new Map((catalog || []).map(item => [item.n, item]));
  for (const name of vocabulary){
    const item = details.get(name) || {};
    const choices = [name, ...(Array.isArray(item.aliases) ? item.aliases : [])];
    const score = Math.max(...choices.map(choice => textScore(value, choice)));
    if (score > bestScore){ best = name; bestScore = score; }
  }
  return bestScore >= .32 ? best : '';
}

function cleanItems(value, vocabulary, catalog){
  const source = value && Array.isArray(value.items) ? value.items : [];
  const merged = new Map(), unmatched = [];
  source.slice(0, MAX_ITEMS).forEach(item => {
    const rawName = typeof item.n === 'string' ? item.n : String(item.name || '');
    const grams = Math.round(Number(item.g === undefined ? item.grams : item.g));
    const name = matchFoodName(rawName, vocabulary, catalog);
    if (!name){
      if (rawName.trim()) unmatched.push(rawName.trim().slice(0,80));
      return;
    }
    if (grams < 1 || grams > 2000) return;
    merged.set(name, (merged.get(name) || 0) + grams);
  });
  return {
    items:[...merged].map(([n,g]) => ({n,g:Math.min(2000,g)})),
    unmatched:[...new Set(unmatched)].slice(0,6)
  };
}

const cleanText = (input, length) => String(input || '').replace(/[<>&"']/g, '')
  .replace(/\s+/g, ' ').trim().slice(0, length);

function cleanMenuDrafts(value){
  const source = value && Array.isArray(value.items) ? value.items : [];
  const seen = new Set();
  return source.slice(0, MAX_MENU_ITEMS).map(item => ({
    name:cleanText(item.name,80), description:cleanText(item.description,240),
    category:cleanText(item.category,50)
  })).filter(item => {
    const key = normalizeText(item.name);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

function matchDraftName(value, drafts){
  const wanted = normalizeText(value);
  const exact = drafts.find(item => normalizeText(item.name) === wanted);
  if (exact) return exact;
  let best = null, score = 0;
  drafts.forEach(item => {
    const next = textScore(value,item.name);
    if (next > score){ best = item; score = next; }
  });
  return score >= .55 ? best : null;
}

function cleanMenuItems(value, drafts){
  const source = value && Array.isArray(value.items) ? value.items : [];
  const number = (input, min, max) => Math.max(min, Math.min(max, Number(input) || 0));
  const seen = new Set();
  return source.map(item => {
    const draft = matchDraftName(item.name,drafts);
    if (!draft) return null;
    const low = Math.round(number(item.kcalLow, 1, 3000));
    const high = Math.round(number(item.kcalHigh, low, 4000));
    return {
      name:draft.name, description:cleanText(item.description,240) || draft.description,
      grams:Math.round(number(item.grams, 30, 2000)), kcalLow:low, kcalHigh:high,
      protein:Math.round(number(item.protein, 0, 500) * 10) / 10,
      carbs:Math.round(number(item.carbs, 0, 700) * 10) / 10,
      fat:Math.round(number(item.fat, 0, 500) * 10) / 10
    };
  }).filter(item => {
    if (!item) return false;
    const key = normalizeText(item.name);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

async function requestGemini(url, options, timeoutMs = 20000){
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(),timeoutMs);
  try { return await fetch(url,{...options,signal:controller.signal}); }
  finally { clearTimeout(timer); }
}

class GeminiFailure extends Error {
  constructor(status, detail){
    super(`Gemini HTTP ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

async function generateJson(env, parts, responseSchema, maxOutputTokens, label, requestId, preferredModels){
  const body = {
    contents:[{role:'user',parts}],
    generationConfig:{maxOutputTokens,responseMimeType:'application/json',responseSchema}
  };
  const models = [...new Set(preferredModels || [env.GEMINI_MODEL || DEFAULT_MODEL,FALLBACK_MODEL])];
  let lastFailure = new GeminiFailure(502,'unavailable');
  for (let index=0; index<models.length; index++){
    const model = models[index];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    let response;
    try {
      response = await requestGemini(url,{
        method:'POST',
        headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},
        body:JSON.stringify(body)
      });
    } catch (error){
      console.error(label,'network',model,requestId,error && error.message ? error.message : error);
      lastFailure = new GeminiFailure(502,'network');
      continue;
    }
    if (!response.ok){
      const detail = (await response.text()).slice(0,700);
      console.error(label,'HTTP',response.status,model,requestId,detail);
      lastFailure = new GeminiFailure(response.status,detail);
      if ([429,500,502,503,504].includes(response.status) && index < models.length - 1) continue;
      throw lastFailure;
    }
    try {
      const parsed = parseModelJson(await response.json());
      console.log(label,'ok',model,requestId);
      return parsed;
    }
    catch (error){
      console.error(label,'invalid JSON',model,requestId,error && error.message ? error.message : error);
      lastFailure = new GeminiFailure(502,'invalid_json');
      if (index < models.length - 1) continue;
    }
  }
  throw lastFailure;
}

function geminiError(error, origin, requestId){
  const status = error instanceof GeminiFailure ? error.status : 502;
  if (status === 400) return fail('requête Gemini refusée',502,origin,requestId,'gemini_invalid_request');
  if (status === 401 || status === 403){
    return fail('clé Gemini refusée',401,origin,requestId,'gemini_key_rejected');
  }
  if (status === 404) return fail('modèle Gemini indisponible',502,origin,requestId,'gemini_model_unavailable');
  if (status === 429) return fail('quota Gemini atteint',429,origin,requestId,'gemini_quota');
  return fail('service Gemini temporairement indisponible',502,origin,requestId,'gemini_unavailable');
}

async function analyzeRestaurantMenu(form, env, origin, requestId){
  const restaurant = cleanText(form.get('restaurant'),80);
  const images = form.getAll('images').filter(image => image instanceof File && image.size)
    .slice(0,MAX_MENU_IMAGES);
  if (!restaurant) return fail('nom du restaurant manquant',400,origin,requestId,'restaurant_missing');
  if (!images.length) return fail('photo manquante',400,origin,requestId,'image_missing');
  if (images.some(image => !['image/jpeg','image/png','image/webp'].includes(image.type))){
    return fail('format de photo incompatible',415,origin,requestId,'image_format');
  }
  if (images.some(image => image.size > MAX_IMAGE_BYTES) ||
      images.reduce((sum,image) => sum + image.size,0) > MAX_MENU_BYTES){
    return fail('photos trop volumineuses',413,origin,requestId,'images_too_large');
  }

  /* Étape 1 : lecture fidèle de la carte. Aucun calcul nutritionnel ne
     vient distraire le modèle pendant l'OCR. */
  const extractionPrompt = [
    `Lis toutes les photos de la carte du restaurant « ${restaurant} ».`,
    "Recopie les plats préparés proposés au client, dans l'ordre de la carte.",
    "Ignore les titres, prix, boissons et suppléments isolés.",
    "Conserve séparément les variantes (par exemple poulet, bœuf ou camarons).",
    "La description contient uniquement les ingrédients écrits sur la carte ; n'invente rien à cette étape.",
    "Fusionne seulement les vrais doublons entre plusieurs photos."
  ].join('\n');
  const extractionSchema = {type:'OBJECT',properties:{items:{type:'ARRAY',items:{
    type:'OBJECT',properties:{name:{type:'STRING'},description:{type:'STRING'},category:{type:'STRING'}},
    required:['name','description','category']
  }}},required:['items']};
  const extractionParts = [{text:extractionPrompt}];
  for (const image of images){
    extractionParts.push({inline_data:{mime_type:image.type,data:imageToBase64(await image.arrayBuffer())}});
  }

  let drafts;
  try {
    drafts = cleanMenuDrafts(await generateJson(
      env,extractionParts,extractionSchema,6000,'Gemini menu OCR',requestId,
      [MENU_MODEL,FALLBACK_MODEL]
    ));
  } catch (error){ return geminiError(error,origin,requestId); }
  console.log('Gemini menu drafts',drafts.length,requestId);
  if (!drafts.length){
    return fail('aucun plat lisible sur cette carte',422,origin,requestId,'menu_empty');
  }

  /* Étape 2 : estimation par petits groupes. Le schéma reste court et la
     valeur haute inclut les matières grasses et accompagnements plausibles. */
  const nutritionSchema = {type:'OBJECT',properties:{items:{type:'ARRAY',items:{
    type:'OBJECT',properties:{
      name:{type:'STRING'},description:{type:'STRING'},grams:{type:'INTEGER'},
      kcalLow:{type:'INTEGER'},kcalHigh:{type:'INTEGER'},protein:{type:'NUMBER'},
      carbs:{type:'NUMBER'},fat:{type:'NUMBER'}
    },required:['name','description','grams','kcalLow','kcalHigh','protein','carbs','fat']
  }}},required:['items']};
  const items = [];
  for (let index=0; index<drafts.length; index+=MENU_BATCH_SIZE){
    const batch = drafts.slice(index,index+MENU_BATCH_SIZE);
    const prompt = [
      `Estime les valeurs nutritionnelles des plats suivants du restaurant « ${restaurant} » :`,
      JSON.stringify(batch),
      "Retourne chaque plat une fois avec exactement le même nom.",
      "grams est le poids d'une portion complète plausible au restaurant.",
      "kcalLow et kcalHigh forment une fourchette réaliste.",
      "La borne haute est prudente : portion généreuse, huiles, sauces, fromage, sucre et accompagnements habituels inclus.",
      "protein, carbs et fat correspondent en grammes à la borne haute de la portion entière.",
      "Ce sont des estimations informatives, jamais des mesures exactes."
    ].join('\n');
    try {
      const estimated = await generateJson(
        env,[{text:prompt}],nutritionSchema,5000,'Gemini menu nutrition',requestId,
        [MENU_MODEL,FALLBACK_MODEL]
      );
      items.push(...cleanMenuItems(estimated,batch));
      console.log('Gemini menu batch',index / MENU_BATCH_SIZE + 1,items.length,requestId);
    } catch (error){ return geminiError(error,origin,requestId); }
  }
  if (!items.length){
    return fail('résultat Gemini invalide',502,origin,requestId,'menu_result_invalid');
  }
  return json({restaurant,items:items.slice(0,MAX_MENU_ITEMS),version:WORKER_VERSION,requestId},200,origin);
}

export default {
  async fetch(request, env){
    const origin = request.headers.get('Origin') || '';
    const requestId = crypto.randomUUID().slice(0,8);

    if (request.method === 'OPTIONS'){
      if (!allowedOrigin(origin)) return fail('origine refusée',403,origin,requestId,'origin_rejected');
      return new Response(null, {status:204, headers:cors(origin)});
    }

    if (request.method === 'GET'){
      return json({ok:true,configured:!!env.GEMINI_API_KEY,version:WORKER_VERSION,
        model:env.GEMINI_MODEL || DEFAULT_MODEL,fallbackModel:FALLBACK_MODEL,
        menuModel:MENU_MODEL},200,origin);
    }

    if (request.method !== 'POST') return fail('méthode refusée',405,origin,requestId,'method_rejected');
    if (!allowedOrigin(origin)) return fail('origine refusée',403,origin,requestId,'origin_rejected');
    if (!env.GEMINI_API_KEY) return fail('service non configuré',503,origin,requestId,'not_configured');

    let form;
    try { form = await request.formData(); }
    catch (error){ return fail('formulaire invalide',400,origin,requestId,'invalid_form'); }

    if (String(form.get('mode') || '') === 'menu'){
      return analyzeRestaurantMenu(form,env,origin,requestId);
    }

    const image = form.get('image');
    const hint = cleanText(form.get('hint'),300);
    if (!(image instanceof File) || !image.size){
      return fail('photo manquante',400,origin,requestId,'image_missing');
    }
    if (!['image/jpeg','image/png','image/webp'].includes(image.type)){
      return fail('format de photo incompatible',415,origin,requestId,'image_format');
    }
    if (image.size > MAX_IMAGE_BYTES){
      return fail('photo trop volumineuse',413,origin,requestId,'image_too_large');
    }

    let vocabulary;
    try {
      const parsed = JSON.parse(String(form.get('vocabulary') || '[]'));
      vocabulary = Array.isArray(parsed)
        ? [...new Set(parsed.filter(x => typeof x === 'string').map(x => x.trim())
          .filter(x => x && x.length <= 80))].slice(0, MAX_VOCABULARY)
        : [];
    } catch (error){ return fail('vocabulaire invalide',400,origin,requestId,'invalid_vocabulary'); }
    if (!vocabulary.length) return fail('vocabulaire vide',400,origin,requestId,'empty_vocabulary');

    /* Le catalogue enrichi est facultatif pour rester compatible avec les
       anciennes versions de l'application. Les alias aident le modèle à
       rattacher une recette visible au nom exact attendu par MO LOW. */
    let catalog = [];
    try {
      const parsed = JSON.parse(String(form.get('catalog') || '[]'));
      if (Array.isArray(parsed)){
        const allowed = new Set(vocabulary);
        catalog = parsed.filter(x => x && allowed.has(x.n)).slice(0, MAX_VOCABULARY).map(x => ({
          n:x.n,
          aliases:Array.isArray(x.aliases)
            ? x.aliases.filter(a => typeof a === 'string').map(a => a.trim().slice(0, 80)).filter(Boolean).slice(0, 6)
            : [],
          visual:cleanText(x.visual,240)
        }));
      }
    } catch (error){ /* le vocabulaire simple reste utilisable */ }

    const described = catalog.filter(x => x.aliases.length || x.visual)
      .map(x => ({n:x.n,a:x.aliases,v:x.visual}));

    const prompt = [
      "Analyse cette photo de repas pour une application de suivi calorique.",
      hint ? `INDICATION PRIORITAIRE DE L'UTILISATEUR : ${hint}` : '',
      "Identifie les éléments réellement présents et estime leur masse totale visible en grammes.",
      "Utilise de préférence le nom exact le plus proche dans la liste de noms connus.",
      "Si la photo et l'indication correspondent à une recette personnelle décrite, renvoie cette recette une seule fois.",
      "Regroupe les éléments identiques. Ne renvoie jamais de calories.",
      "Si une cuisson à la poêle, un aspect huilé ou une indication de matière grasse le justifie clairement, ajoute séparément une petite quantité d'huile ou de beurre.",
      described.length ? `Recettes et synonymes connus : ${JSON.stringify(described)}` : '',
      `Noms connus : ${JSON.stringify(vocabulary)}`
    ].filter(Boolean).join('\n');

    /* Le nom reste une simple chaîne. L'ancien enum contenait jusqu'à
       150 aliments et faisait rejeter toute la requête par Gemini. */
    const mealSchema = {type:'OBJECT',properties:{items:{type:'ARRAY',items:{
      type:'OBJECT',properties:{
        n:{type:'STRING',description:'Nom observé ou nom connu le plus proche'},
        g:{type:'INTEGER',description:'Masse visible estimée en grammes'}
      },required:['n','g']
    }}},required:['items']};

    let decoded;
    try {
      decoded = await generateJson(
        env,[{text:prompt},{inline_data:{mime_type:image.type,
          data:imageToBase64(await image.arrayBuffer())}}],
        mealSchema,900,'Gemini meal',requestId
      );
    } catch (error){ return geminiError(error,origin,requestId); }

    const cleaned = cleanItems(decoded,vocabulary,catalog);
    return json({...cleaned,version:WORKER_VERSION,requestId},200,origin);
  }
};

export {normalizeText, textScore, matchFoodName, cleanItems, cleanMenuDrafts, cleanMenuItems};
