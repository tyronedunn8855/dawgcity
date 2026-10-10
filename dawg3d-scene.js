/* Dawg City: the live 3D dawg scene (loaded on demand by dawg3d.js) (three.js 0.169, import map in index.html).
   Built from code, not a model file, so it costs no download beyond three.js itself:
   an all-beef dawg in natural casing (glossy, grill-marked), a split bun, then mustard and ketchup
   in the brand's own yellow and red that draw on as you scroll through the section.
   - Scroll turns the dawg about one and a quarter times and loads the toppings.
   - The cursor tilts it on springs (mouse only). Phones get the scroll turn and a slow idle sway.
   - Motion turned off (footer toggle): one still frame, fully loaded.
   - No WebGL, or anything fails: the poster image (a render of this scene) simply stays.
   Renders only while the section is on screen. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const section = document.getElementById('dawg3d');
const stage = section && section.querySelector('.d3-stage');
const canvas = stage && stage.querySelector('canvas');
const reduce = !!window.__rm;

export function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: /[?&]poster\b/.test(location.search) });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  // Warm market-hall key, a ketchup-red rim from behind, mustard bounce from below
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x2a1810, 0.9));
  const key = new THREE.DirectionalLight(0xffe2bd, 2.6); key.position.set(-4, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xe3292b, 3.2); rim.position.set(5, 2.5, -5); scene.add(rim);
  const bounce = new THREE.DirectionalLight(0xf4ba12, 0.8); bounce.position.set(0, -4, 3); scene.add(bounce);

  const dawg = new THREE.Group();
  scene.add(dawg);

  // ── Sausage: a slightly bowed tube with round ends, natural-casing gloss and grill marks on top
  const L = 3.5, R = 0.33;
  const sagY = (x) => 0.07 * (x * x) - 0.05;
  const path = new THREE.CatmullRomCurve3([-1, -0.5, 0, 0.5, 1].map((t) => new THREE.Vector3(t * L / 2, sagY(t * L / 2), 0)));
  const tube = new THREE.TubeGeometry(path, 96, R, 32, false);
  const casing = new THREE.Color(0x9a3a21), seared = new THREE.Color(0x2a0e07);
  function paintGrill(geo) {
    const pos = geo.attributes.position, nor = geo.attributes.normal, col = new Float32Array(pos.count * 3), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), ny = nor.getY(i);
      const band = ((x + 0.55 * z) / 0.42) % 1;
      const mark = ny > 0.15 && Math.abs(band < 0 ? band + 1 : band) < 0.13 ? Math.min(1, (ny - 0.15) * 2.2) * 0.85 : 0;
      c.copy(casing).lerp(seared, mark);
      c.toArray(col, i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  paintGrill(tube);
  const casingMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.36, clearcoat: 0.85, clearcoatRoughness: 0.22, sheen: 0.3, sheenColor: new THREE.Color(0xff8a5c) });
  const sausage = new THREE.Group();
  sausage.add(new THREE.Mesh(tube, casingMat));
  [-1, 1].forEach((s) => {
    const cap = new THREE.SphereGeometry(R, 32, 16);
    paintGrill(cap);
    const m = new THREE.Mesh(cap, casingMat);
    m.position.set(s * L / 2, sagY(L / 2), 0);
    sausage.add(m);
  });
  sausage.position.y = 0.16;
  dawg.add(sausage);

  // ── Bun: two soft halves, crust outside and pale crumb on the cut side
  const crust = new THREE.Color(0xc58d4e), crustDark = new THREE.Color(0x8f5426), crumb = new THREE.Color(0xf0dcb4);
  function bunHalf(side) {
    const g = new THREE.SphereGeometry(1, 64, 32);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      if (y < -0.35) y = -0.35 - (y + 0.35) * 0.35; // flatter base
      pos.setXYZ(i, x * 2.05, y * 0.5, z * 0.46);
      const inner = THREE.MathUtils.clamp(-z * side * 1.3 + y * 0.6, 0, 1); // the cut side, facing the sausage
      const top = THREE.MathUtils.clamp(y * 1.4, 0, 1);
      c.copy(crust).lerp(crustDark, top * 0.6 * (1 - inner)).lerp(crumb, Math.pow(inner, 1.4));
      c.offsetHSL(0, 0, (Math.sin(x * 37.1 + z * 91.7) * Math.sin(y * 53.3 + x * 17.9)) * 0.025); // crumb grain
      c.toArray(col, i * 3);
    }
    g.computeVertexNormals();
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 }));
    m.position.set(0, -0.12, side * 0.38);
    m.rotation.x = side * 0.42;
    return m;
  }
  dawg.add(bunHalf(1), bunHalf(-1));

  // ── Toppings: mustard and ketchup zigzags that draw on with scroll
  function squiggle(color, phase, lift, wobble) {
    const pts = [];
    const n = 15;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = (t - 0.5) * (L - 0.3);
      pts.push(new THREE.Vector3(x, sagY(x) + 0.16 + R * 0.92 + lift, Math.sin(t * Math.PI * 7 + phase) * wobble));
    }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 260, 0.055, 10, false);
    const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.3 }));
    m.userData.total = g.index.count;
    g.setDrawRange(0, 0);
    dawg.add(m);
    return m;
  }
  const mustard = squiggle(0xf4ba12, 0, 0.0, 0.2);
  const ketchup = squiggle(0xe3292b, Math.PI * 0.55, 0.05, 0.16);

  // A soft contact shadow under the bun
  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.9), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.62;
  scene.add(shadow);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 2.1, 8.2);
  camera.lookAt(0, 0, 0);

  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole dawg in frame on narrow screens
    camera.position.z = w / h < 1 ? 8.2 / Math.max(0.62, w / h) : 8.2;
    camera.updateProjectionMatrix();
  }

  // Springs for the cursor tilt (stiffness, damping)
  const spring = (k, c) => ({ x: 0, v: 0, to: 0, step(dt) { this.v += ((this.to - this.x) * k - this.v * c) * dt; this.x += this.v * dt; return this.x; } });
  const tx = spring(60, 11), ty = spring(60, 11);
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  window.addEventListener('pointermove', (e) => {
    if (!fine.matches || e.pointerType !== 'mouse' || reduce) return;
    const r = stage.getBoundingClientRect();
    tx.to = THREE.MathUtils.clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.5), -1, 1);
    ty.to = THREE.MathUtils.clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight * 0.6), -1, 1);
    kick();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { tx.to = 0; ty.to = 0; });

  function progress() {
    const r = section.getBoundingClientRect(), vh = window.innerHeight;
    return THREE.MathUtils.clamp((vh - r.top) / (vh + r.height), 0, 1);
  }
  const ease = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  let pCur = null, t = 0, forceP = null;
  function pose(dt) {
    const p = forceP !== null ? forceP : reduce ? 0.62 : progress();
    pCur = pCur === null || forceP !== null ? p : pCur + (p - pCur) * (1 - Math.exp(-dt * 8));
    tx.step(Math.min(dt, 1 / 30)); ty.step(Math.min(dt, 1 / 30));
    const sway = reduce || fine.matches ? 0 : Math.sin(t * 0.8) * 0.12;
    dawg.rotation.set(0.28 + ty.x * 0.22, -0.9 + pCur * Math.PI * 2.5 + tx.x * 0.55 + sway, -tx.x * 0.06);
    dawg.position.y = reduce ? 0 : Math.sin(t * 1.4) * 0.04;
    mustard.geometry.setDrawRange(0, Math.floor(mustard.userData.total * ease(0.22, 0.5, pCur) / 3) * 3);
    ketchup.geometry.setDrawRange(0, Math.floor(ketchup.userData.total * ease(0.42, 0.7, pCur) / 3) * 3);
  }

  let raf = 0, last = performance.now(), onScreen = false, live = false;
  function frame(now) {
    raf = 0;
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; t += dt;
    pose(dt);
    renderer.render(scene, camera);
    if (!live) { live = true; requestAnimationFrame(() => { stage.dataset.state = 'live'; }); }
    if (onScreen && !reduce && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && onScreen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  new IntersectionObserver((en) => { onScreen = en[0].isIntersecting; kick(); }, { rootMargin: '100px 0px' }).observe(section);
  document.addEventListener('visibilitychange', kick);
  new ResizeObserver(() => { size(); if (reduce || !raf) { pose(0); renderer.render(scene, camera); } }).observe(canvas);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stage.dataset.state = 'fallback'; onScreen = false; });
  size();
  if (reduce) { pose(0); renderer.render(scene, camera); stage.dataset.state = 'live'; }
  // Poster capture for the fallback image (only with ?poster in the URL)
  if (/[?&]poster\b/.test(location.search)) window.__dawgPoster = () => { forceP = 0.62; tx.x = ty.x = 0; t = 0; dawg.position.y = 0; pose(0); renderer.render(scene, camera); return canvas.toDataURL('image/png'); };
}
