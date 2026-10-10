/* Dawg City: starts the live 3D dawg (dawg3d-scene.js) without slowing the first paint.
   three.js and the scene load only after the loader has lifted and the section is within a screen
   or so of the viewport. No WebGL, or anything fails: the poster image simply stays. */
const section = document.getElementById('dawg3d');
const stage = section && section.querySelector('.d3-stage');
const canvas = stage && stage.querySelector('canvas');

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}
function build() {
  import('./dawg3d-scene.js').then((m) => m.start()).catch(() => { stage.dataset.state = 'fallback'; });
}
function afterLoader(fn) {
  if (!document.body.classList.contains('loading')) { fn(); return; }
  const mo = new MutationObserver(() => { if (!document.body.classList.contains('loading')) { mo.disconnect(); setTimeout(fn, 400); } });
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}
function boot() {
  if (!canvas || !webglOK()) return;
  afterLoader(() => {
    if (!('IntersectionObserver' in window)) { build(); return; }
    const io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { io.disconnect(); build(); } }, { rootMargin: '600px 0px' });
    io.observe(section);
  });
}
if (document.readyState === 'complete') setTimeout(boot, 50);
else window.addEventListener('load', () => setTimeout(boot, 50), { once: true });
