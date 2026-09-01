# MO LOW — beta

Application web installable (PWA). Sans compilation, sans dépendance,
sans compte utilisateur. Les données restent sur l'appareil.

## Structure

```
MOLOW/
├── index.html                 point d'entrée — c'est ce fichier qui fait autorité
├── manifest.webmanifest       installation sur l'écran d'accueil
├── service-worker.js          fonctionnement hors ligne
├── build.js                   assemble tout en un fichier unique
├── css/      tokens · layout · components
├── js/       core/ · ui/ · screens/ · data/
├── fonts/    archivo-var.woff2 (SIL OFL, voir OFL.txt)
├── icons/    192 · 512 · favicon
└── dist/     molow-beta.html — aperçu autonome, jamais édité à la main
```

`dist/molow-beta.html` est **généré**. Toute modification faite dedans est
perdue au prochain `node build.js`. Le code source, ce sont les modules.

## Lancer en local

Le service worker et le manifeste exigent HTTP. Ouvrir `index.html` en
`file://` fonctionne, mais sans hors ligne ni installation.

```
python3 -m http.server 8000     puis  http://localhost:8000
node build.js                   →  dist/molow-beta.html
```

## Installer sur le téléphone

1. Publier le dossier sous HTTPS (GitHub Pages convient et reste gratuit).
2. Ouvrir l'URL dans Chrome Android.
3. Menu → « Installer l'application ».

L'icône arrive sur l'écran d'accueil, l'app démarre en plein écran sans
barre de navigateur, et fonctionne sans réseau après la première visite.
Un appui long sur l'icône propose les raccourcis Manger et Boire.

**Après toute modification, incrémenter `CACHE` dans `service-worker.js`.**
Sans ça, les appareils déjà installés continuent de servir l'ancienne version.

## Où modifier quoi

| Je veux changer… | Fichier |
|---|---|
| la palette, l'échelle de couleur | `js/core/theme.js` → `STOPS` |
| les polices, l'encre, les surfaces | `css/tokens.css` |
| les aliments et boissons | `js/data/catalog.js` |
| la barre de progression | `js/screens/home.js` → `progress()` |
| l'écran d'accueil, la flèche | `js/screens/home.js` |
| les macronutriments | `js/screens/macros.js` |
| les cibles protéines / lipides / glucides | `js/core/store.js` → `macroTargets()` |
| MANGER / BOIRE / portions / J'AI FAIM | `js/screens/add.js` |
| l'analyse photo et le scan | `js/screens/photo.js` |
| le calendrier, le rattrapage d'une journée | `js/screens/journal.js` |
| l'onboarding, le profil, l'export | `js/screens/profile.js` |
| le stockage, les formules métaboliques | `js/core/store.js` |
| les écrans et leur ordre | `index.html` |

## Données

Stockage dans `localStorage` sous la clé `molow:beta:v3`, avec repli
automatique sur l'API hôte quand elle existe. **Ne pas changer la clé
sans prévoir de migration** : les données existantes paraîtraient perdues.

Vider les données de navigation efface aussi celles de MO LOW. D'où
l'export JSON dans Profil → Sauvegarde, à faire de temps en temps.
L'import remplace intégralement le contenu, il ne fusionne pas.

## Macronutriments

Chaque entrée stocke ses macros (`m: {p, c, f, a}` en grammes), calculées
à l'ajout via `ML.scale()`. Le détail du jour additionne, il ne re-résout
jamais les aliments.

`a` = grammes d'alcool pur (degré × 0,789), comptés à 7 kcal/g. Sans cette
colonne, les calories d'un rhum n'auraient aucun macronutriment pour les
porter. Cibles par défaut : protéines à 1,6 g/kg, lipides à 30 % des
calories, glucides pour le reste. Aucune cible sur l'alcool.

## Sécurité des données externes

- `ML.h()` — échappement HTML, pour tout texte inséré dans `innerHTML`.
- `ML.esc()` — guillemets seulement, réservé aux attributs `onclick`.
  **Ne protège pas d'une balise**, ne jamais l'utiliser sur du contenu réseau.
- `ML.cleanName()` — à appliquer à tout nom venant d'Open Food Facts ou
  d'un modèle : bornage à 60 caractères et retrait des caractères actifs.

Un aliment renvoyé par l'analyse photo est en plus rejeté s'il n'existe
pas dans le catalogue local. Un modèle ne peut donc rien injecter.

## Les deux points de branchement réseau

Tout le réseau est isolé dans `js/screens/photo.js` :

- `analyze(hint)` — photo + texte vers un modèle multimodal, qui répond
  `[{n, g}]` où `n` appartient obligatoirement à `ML.FOODS`. Simulé.
- `lookup(ean)` — code-barres vers Open Food Facts. Simulé.

Ces deux fonctions sont clairement identifiées comme simulées dans
l'interface. La clé d'API du modèle ne devra jamais se trouver dans ce
code : elle vit sur un proxy, côté serveur.

## Deux échelles de couleur, volontairement différentes

- **Accueil** : jauge de budget. Turquoise quand la journée est entière,
  rouge puis violet quand le budget se vide. « Combien il me reste. »
- **Calendrier** : verdict. Vert quand l'objectif a été tenu, orange
  au-delà, rouge au-delà de 10 %. « Est-ce que j'ai tenu. »

Ne pas unifier : ce sont deux questions distinctes.
