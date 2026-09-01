/* ------------------------------------------------------------------
   theme.js — jauge chromatique journalière
   Une seule entrée : ML.theme.apply(ratio) où ratio = restant / objectif.
   Tout l'écran découle de cette valeur. Pour retoucher la palette,
   il suffit de modifier STOPS : rien d'autre à changer.
------------------------------------------------------------------- */
window.ML = window.ML || {};

ML.theme = (() => {
  /* Registre acide : saturations poussées, luminosités hautes.
     Les teintes descendent en continu (168 -> -95) pour que
     l'interpolation suive l'arc turquoise > vert > lime > orange >
     rouge > violet, et non le plus court chemin sur la roue.        */
  const STOPS = [
    {p: 1.00, h: 168, s:100, l:44},   // réservoir plein — turquoise électrique
    {p: 0.72, h: 145, s: 92, l:46},   // vert acide
    {p: 0.48, h:  72, s:100, l:50},   // lime
    {p: 0.26, h:  30, s:100, l:52},   // orange vif
    {p: 0.00, h:  -7, s: 92, l:52},   // rouge — budget épuisé
    {p:-0.35, h: -95, s: 85, l:48}    // violet — au-dessus
  ];

  const hsl = (h, s, l) => `hsl(${((h % 360) + 360) % 360} ${ML.clamp(s,0,100)}% ${ML.clamp(l,3,97)}%)`;

  /* Luminance relative approchée, pour décider encre claire ou sombre.
     Indispensable ici : un lime et un rouge de même L en HSL n'ont pas
     du tout la même clarté perçue.                                    */
  function lum(h, s, l){
    h = (((h % 360) + 360) % 360) / 360; s /= 100; l /= 100;
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const hue = t => {
      t = (t + 1) % 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const lin = c => c <= .03928 ? c/12.92 : Math.pow((c + .055)/1.055, 2.4);
    return .2126*lin(hue(h + 1/3)) + .7152*lin(hue(h)) + .0722*lin(hue(h - 1/3));
  }
  const inkFor = (h, s, l) => lum(h, s, l) > .29 ? 'var(--ink)' : 'var(--paper)';

  function apply(ratio){
    const p = ML.clamp(ratio, -0.35, 1);
    let i = 0;
    while (i < STOPS.length - 2 && p < STOPS[i + 1].p) i++;
    const a = STOPS[i], b = STOPS[i + 1];
    const t = (a.p - p) / (a.p - b.p);
    const h = a.h + (b.h - a.h) * t;
    const s = a.s + (b.s - a.s) * t;
    const l = a.l + (b.l - a.l) * t;

    /* Surfaces dérivées d'une seule teinte : un seul curseur pilote
       le fond, les deux boutons, le bandeau et le pied d'écran.      */
    /* deep n'est plus une simple version sombre du fond : c'est un
       gris quasi noir teinté de la couleur du moment. Les écrans de
       lecture (journal, profil, panneaux) s'y posent, ce qui règle la
       lisibilité sans toucher au dégradé de l'accueil.             */
    const tint = Math.min(s * .38, 34);
    const surf = [
      ['bg',    h, s,      l],
      ['raise', h, s,      l + 9],
      ['sink',  h, s - 4,  l - 15],
      ['sink2', h, s - 14, l - 26],
      ['deep',  h, tint,   9],
      ['deep2', h, tint,   13]
    ];
    const r = document.documentElement.style;
    surf.forEach(([name, hh, ss, ll]) => {
      r.setProperty('--' + name, hsl(hh, ss, ll));
      r.setProperty('--on-' + name, inkFor(hh, ss, ll));
    });

    /* La barre système Android reprend la couleur du haut d'écran,
       sinon l'effet plein écran se casse net sous la barre d'état.  */
    let m = document.querySelector('meta[name=theme-color]');
    if (!m){ m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.content = hsl(h, s, l);
  }

  /* Applique la couleur de la journée en cours. */
  const sync = () => apply(ML.store.left() / ML.store.goal);

  return {apply, sync, STOPS};
})();
