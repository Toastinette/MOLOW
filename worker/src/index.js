/* ------------------------------------------------------------------
   MO LOW — proxy d'analyse photo
   Déployé comme Cloudflare Worker. La clé Gemini est fournie dans le
   secret GEMINI_API_KEY et ne doit jamais apparaître dans ce fichier.
------------------------------------------------------------------- */

const APP_ORIGIN = 'https://toastinette.github.io';
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_VOCABULARY = 150;
const MAX_ITEMS = 12;

const allowedOrigin = origin => origin === APP_ORIGIN ||
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');

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
    headers: {...cors(origin), 'Content-Type': 'application/json; charset=utf-8'}
  });
}

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

function cleanItems(value, vocabulary){
  const source = value && Array.isArray(value.items) ? value.items : [];
  const allowed = new Set(vocabulary);
  return source.slice(0, MAX_ITEMS).map(item => ({
    n: typeof item.n === 'string' ? item.n.trim() : '',
    g: Math.round(Number(item.g))
  })).filter(item => allowed.has(item.n) && item.g >= 1 && item.g <= 2000);
}

export default {
  async fetch(request, env){
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS'){
      if (!allowedOrigin(origin)) return json({error:'origine refusée'}, 403, origin);
      return new Response(null, {status:204, headers:cors(origin)});
    }

    if (request.method === 'GET'){
      return json({ok:true, configured:!!env.GEMINI_API_KEY}, 200, origin);
    }

    if (request.method !== 'POST') return json({error:'méthode refusée'}, 405, origin);
    if (!allowedOrigin(origin)) return json({error:'origine refusée'}, 403, origin);
    if (!env.GEMINI_API_KEY) return json({error:'service non configuré'}, 503, origin);

    let form;
    try { form = await request.formData(); }
    catch (e) { return json({error:'formulaire invalide'}, 400, origin); }

    const image = form.get('image');
    const hint = String(form.get('hint') || '').trim().slice(0, 300);
    if (!(image instanceof File) || !image.size) return json({error:'photo manquante'}, 400, origin);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)){
      return json({error:'format de photo refusé'}, 415, origin);
    }
    if (image.size > MAX_IMAGE_BYTES) return json({error:'photo trop volumineuse'}, 413, origin);

    let vocabulary;
    try {
      const parsed = JSON.parse(String(form.get('vocabulary') || '[]'));
      vocabulary = Array.isArray(parsed)
        ? [...new Set(parsed.filter(x => typeof x === 'string').map(x => x.trim())
          .filter(x => x && x.length <= 80))].slice(0, MAX_VOCABULARY)
        : [];
    } catch (e) {
      return json({error:'vocabulaire invalide'}, 400, origin);
    }
    if (!vocabulary.length) return json({error:'vocabulaire vide'}, 400, origin);

    const prompt = [
      "Analyse cette photo de repas pour une application de suivi calorique.",
      "Identifie uniquement les aliments réellement visibles.",
      "Pour chaque aliment, choisis n EXACTEMENT dans le vocabulaire fourni, sans variante ni ajout.",
      "Estime g, la masse visible en grammes. Ne renvoie jamais de calories.",
      "Regroupe les éléments identiques et ne renvoie pas les ingrédients invisibles.",
      hint ? `Précision de l'utilisateur : ${hint}` : '',
      `Vocabulaire autorisé : ${JSON.stringify(vocabulary)}`
    ].filter(Boolean).join('\n');

    const body = {
      contents: [{role:'user', parts:[
        {text:prompt},
        {inline_data:{mime_type:image.type, data:imageToBase64(await image.arrayBuffer())}}
      ]}],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 700,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            items: {
              type: 'ARRAY',
              maxItems: MAX_ITEMS,
              items: {
                type: 'OBJECT',
                properties: {
                  n: {type:'STRING', enum:vocabulary},
                  g: {type:'INTEGER', minimum:1, maximum:2000}
                },
                required: ['n', 'g']
              }
            }
          },
          required: ['items']
        }
      }
    };

    const model = env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    let response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method:'POST',
          headers:{'Content-Type':'application/json', 'x-goog-api-key':env.GEMINI_API_KEY},
          body:JSON.stringify(body)
        }
      );
    } catch (e) {
      return json({error:'modèle indisponible'}, 502, origin);
    }

    if (!response.ok){
      console.error('Gemini HTTP', response.status, (await response.text()).slice(0, 500));
      return json({error:'analyse indisponible'}, 502, origin);
    }

    let modelData;
    try { modelData = await response.json(); }
    catch (e) { return json({error:'réponse du modèle invalide'}, 502, origin); }

    let decoded;
    try { decoded = JSON.parse(readModelText(modelData)); }
    catch (e) { return json({error:'résultat non reconnu'}, 502, origin); }

    const items = cleanItems(decoded, vocabulary);
    return json({items}, 200, origin);
  }
};

