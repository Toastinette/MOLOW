# Proxy photo MO LOW

Cloudflare Worker chargé d'envoyer une photo de repas à Gemini sans exposer
la clé d'API dans l'application publique.

Le même Worker traite aussi jusqu'à quatre photos d'une carte de restaurant.
Il extrait les plats, produit une fourchette nutritionnelle et renvoie une
borne haute prudente destinée au catalogue personnel de l'utilisateur.

## Configuration

- Worker : `molow-photo-analysis`
- Version attendue : `photo-menu-v3`
- Modèle par défaut : `gemini-3.6-flash`
- Repli automatique : `gemini-3.5-flash` si le modèle principal est saturé
- Cartes de restaurant : `gemini-3.5-flash-lite` pour limiter le délai
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
navigateur : la réponse doit contenir `{"ok":true,"configured":true,` puis
`"version":"photo-menu-v3"}`. Si la version est absente, l'ancien Worker est
encore actif et l'analyse des cartes ne peut pas fonctionner.

La photo est transmise à Gemini pour l'analyse. Le Worker ne l'enregistre pas.
Les assiettes utilisent un schéma court sans grand enum. Les cartes sont lues
en deux temps : extraction fidèle des plats, puis estimation nutritionnelle par
petits groupes. L'usage du niveau gratuit reste soumis aux conditions de Google.
