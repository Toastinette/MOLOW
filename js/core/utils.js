/* ------------------------------------------------------------------
   utils.js — helpers sans dépendance
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.$ = id => document.getElementById(id);

/* 1420 -> "1 420" (espace fine insécable remplacée par une espace simple
   pour éviter les rendus incohérents selon la police).                */
ML.fmt = n => Math.round(n).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');

/* Clé de journée locale au format AAAA-MM-JJ. On décale du fuseau
   avant l'ISO, sinon les soirées basculent sur le lendemain en UTC.   */
ML.dkey = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
ML.today = () => ML.dkey(new Date());

ML.uid = () => Math.random().toString(36).slice(2, 10);

/* esc : chaîne destinée à un attribut onclick (guillemets seulement).
   h   : échappement HTML réel, pour tout texte inséré dans innerHTML.
   Les deux ne sont pas interchangeables : esc() ne protège pas d'une
   balise, et devient dangereux dès que les noms viennent du réseau.  */
ML.esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
ML.h = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* Nom venant d'une source externe (Open Food Facts, modèle d'analyse) :
   on borne la longueur et on retire tout ce qui n'est pas du texte.   */
ML.cleanName = s => String(s || '').replace(/[<>&"']/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
ML.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

ML.longDate = k => new Date(k + 'T12:00').toLocaleDateString('fr-FR',
  {weekday:'long', day:'numeric', month:'long'});
ML.shortDate = k => new Date(k + 'T12:00').toLocaleDateString('fr-FR',
  {day:'numeric', month:'short'});
