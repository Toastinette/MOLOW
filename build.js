/* ------------------------------------------------------------------
   build.js — assemble index.html + css/ + js/ en un fichier unique.
   Usage : node build.js
   Sortie : dist/molow-beta.html
   Le développement se fait sur les modules ; le fichier assemblé
   sert uniquement à prévisualiser ou partager d'un seul bloc.
------------------------------------------------------------------- */
const fs = require('fs');
const path = require('path');
const root = __dirname;

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

/* Le fichier unique n'a pas de dossier autour de lui : manifeste, icônes
   et service worker n'ont aucun sens ici, on les retire.              */
html = html.replace(/\s*<link rel="manifest"[^>]*>/g, '')
           .replace(/\s*<link rel="icon"[^>]*>/g, '')
           .replace(/\s*<link rel="preload"[^>]*>/g, '');

/* CSS locaux -> <style> inline */
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => {
  if (/^https?:/.test(href)) return m;
  return `<style>\n/* ${href} */\n${fs.readFileSync(path.join(root, href), 'utf8')}</style>`;
});

/* Police embarquée en base64 : sans elle, la version assemblée
   retomberait sur la police système et ne montrerait plus le vrai
   traitement typographique.                                       */
const woff2 = fs.readFileSync(path.join(root, 'fonts/archivo-var.woff2')).toString('base64');
html = html.replace(/src:url\('\.\.\/fonts\/archivo-var\.woff2'\) format\('woff2-variations'\);/,
  `src:url(data:font/woff2;base64,${woff2}) format('woff2-variations');`);

/* Scripts locaux -> <script> inline, dans l'ordre du document */
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  if (/^https?:/.test(src)) return m;
  return `<script>\n/* ${src} */\n${fs.readFileSync(path.join(root, src), 'utf8')}</script>`;
});

fs.mkdirSync(path.join(root, 'dist'), {recursive: true});
const out = path.join(root, 'dist', 'molow-beta.html');
fs.writeFileSync(out, html);
console.log('Assemblé :', out, '·', (html.length / 1024).toFixed(1), 'ko');
