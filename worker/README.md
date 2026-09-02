# Proxy photo MO LOW

Cloudflare Worker chargé d'envoyer une photo de repas à Gemini sans exposer
la clé d'API dans l'application publique.

## Configuration

- Worker : `molow-photo-analysis`
- Modèle par défaut : `gemini-3.5-flash`
- Secret obligatoire : `GEMINI_API_KEY`
- Origine autorisée : `https://toastinette.github.io`

## Déploiement

Depuis ce dossier :

```sh
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npx wrangler deploy
```

Ne jamais placer la clé dans `wrangler.toml`, le code JavaScript, GitHub ou
une capture d'écran. Après le déploiement, ouvrir l'URL du Worker dans un
navigateur : la réponse doit contenir `{"ok":true,"configured":true}`.

La photo est transmise à Gemini pour l'analyse. Le Worker ne l'enregistre pas,
mais l'usage du niveau gratuit Gemini reste soumis aux conditions de Google.
