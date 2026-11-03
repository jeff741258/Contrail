// Carbon page (#carbon): how much new forest would soak up the CO₂e of your flights, drawn as trees
// on American football fields (when distances are in miles) or soccer pitches (in km).
// Assumptions: a young planted tree takes up about 10 kg of CO₂ a year on average over its first
// 20 years, planted at about 1,000 trees per hectare (One Tree Planted's figures).
(function(){
  "use strict";
  const App = window.ContrailApp;
  const $ = id => document.getElementById(id);
  const KG_PER_TREE_YEAR = 10, TREES_PER_HA = 1000;
  // American football field with end zones: 120 × 53⅓ yd (0.535 ha). Soccer pitch: FIFA's 105 × 68 m (0.714 ha).
  const FIELDS = {
    mi: { name: "American football field", plural: "American football fields", ha: 0.5351, w: 120, h: 53.33 },
    km: { name: "soccer field", plural: "soccer fields", ha: 0.714, w: 105, h: 68 }
  };
  let years = 10, no3D = false;
  try{ years = Number(localStorage.getItem("contrail.carbonYears")) || 10; }catch(_){}
  const MAX_DRAWN = 12;

  // One field seen from the stands: a tilted slab with perspective (the far side narrower), its
  // markings, and `n` of its `per` trees standing on it, drawn back to front with small shadows.
  function field(kind, F, n, per){
    const VW = 300, top = 18, depth = 120, slab = 9;                 // picture size and slab thickness
    const P = (u, v) => { const t = v / F.h, s = 0.66 + 0.34 * t;   // u along the length, v across (0 = far side)
      return [VW / 2 + (u - F.w / 2) / F.w * (VW - 24) * s, top + t * depth]; };
    const pt = q => q[0].toFixed(1) + "," + q[1].toFixed(1);
    const poly = (pts, cls, extra) => '<polygon points="' + pts.map(pt).join(" ") + '" class="' + cls + '"' + (extra || "") + '/>';
    const ln = (u1, v1, u2, v2) => { const a = P(u1, v1), c = P(u2, v2); return '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + c[0].toFixed(1) + '" y2="' + c[1].toFixed(1) + '"/>'; };
    const box = (u0, v0, u1, v1) => '<polygon points="' + [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)].map(pt).join(" ") + '"/>';
    const corners = [P(0, 0), P(F.w, 0), P(F.w, F.h), P(0, F.h)];
    // slab: grass top, darker earth on the near side
    let g = poly([corners[3], corners[2], [corners[2][0], corners[2][1] + slab], [corners[3][0], corners[3][1] + slab]], "cb-side");
    g += poly(corners, "cb-grass");
    // mowing stripes for depth
    for(let i = 0; i < 12; i += 2){ const u0 = F.w * i / 12, u1 = F.w * (i + 1) / 12; g += poly([P(u0, 0), P(u1, 0), P(u1, F.h), P(u0, F.h)], "cb-stripe"); }
    let lines = "";
    if(kind === "mi"){
      lines += poly([P(0, 0), P(10, 0), P(10, F.h), P(0, F.h)], "cb-ez") + poly([P(110, 0), P(120, 0), P(120, F.h), P(110, F.h)], "cb-ez");
      for(let yd = 10; yd <= 110; yd += 10) lines += ln(yd, 0, yd, F.h);
    }else{
      const c = []; for(let i = 0; i <= 36; i++){ const a = i / 36 * Math.PI * 2; c.push(P(52.5 + Math.cos(a) * 9.15, 34 + Math.sin(a) * 9.15)); }
      lines += ln(52.5, 0, 52.5, 68) + '<polyline points="' + c.map(pt).join(" ") + '"/>' + box(0, 13.84, 16.5, 54.16) + box(88.5, 13.84, 105, 54.16);
    }
    lines += '<polygon points="' + corners.map(pt).join(" ") + '"/>';
    // trees on an even grid, planted from the far side forward; drawn far to near so near trees overlap
    const cols = Math.max(1, Math.round(Math.sqrt(per * F.w / F.h))), rows = Math.ceil(per / cols);
    let trees = "", shadows = "";
    for(let i = 0; i < n; i++){
      const c = i % cols, r = Math.floor(i / cols), [x, y] = P(F.w * (c + .5) / cols, F.h * (r + .5) / rows), s = 0.66 + 0.34 * (r + .5) / rows;
      const k = (s * Math.min((VW - 24) / cols, depth / rows * 2.2)).toFixed(2);
      shadows += '<ellipse cx="' + (x + 1.2 * k).toFixed(1) + '" cy="' + (y + .3 * k).toFixed(1) + '" rx="' + (.55 * k) + '" ry="' + (.22 * k) + '"/>';
      trees += '<use href="#cbTree" transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ") scale(" + k + ')"/>';
    }
    return '<svg viewBox="0 0 ' + VW + " " + (top + depth + slab + 6) + '" class="cb-field">' + g + '<g class="cb-lines">' + lines + '</g>' +
      '<g class="cb-shadows">' + shadows + '</g><g class="cb-trees">' + trees + '</g></svg>';
  }
  // the tree every field reuses: a trunk and a rounded canopy, about one unit tall, standing on (0,0)
  const TREE_DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<radialGradient id="cbLeaf" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#6BC57A"/><stop offset=".6" stop-color="#2E8B47"/><stop offset="1" stop-color="#1A5A2C"/></radialGradient>' +
    '<g id="cbTree"><rect x="-.07" y="-.42" width=".14" height=".42" fill="#6B4A2B"/><circle cx="0" cy="-.62" r=".42" fill="url(#cbLeaf)"/></g></defs></svg>';

  // ---------- real 3D: the fields as slabs of turf with a forest of trees, lit by the sun ----------
  // Uses three.js (loaded the first time this page opens). Drag to turn the view, scroll to zoom;
  // it turns slowly on its own until you touch it. Falls back to the flat drawings without WebGL.
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  const DIMS = { mi: { w: 109.7, h: 48.8 }, km: { w: 105, h: 68 } }; // metres, end zones included
  let V = null; // the live view: {renderer, scene, camera, raf, ...}
  function stop3D(){ if(V){ cancelAnimationFrame(V.raf); V.raf = 0; } }
  function dispose3D(){
    if(!V) return; stop3D();
    V.scene.traverse(o => { if(o.geometry) o.geometry.dispose(); [].concat(o.material || []).forEach(m => { if(m.map) m.map.dispose(); m.dispose(); }); });
    V.renderer.dispose(); V.ro && V.ro.disconnect(); V = null;
  }
  function turf(THREE, kind, D){ // the field's top: mowing stripes and markings, painted on a canvas
    const W = 1024, H = Math.round(1024 * D.h / D.w), c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"), m = W / D.w;
    for(let i = 0; i < 12; i++){ x.fillStyle = i % 2 ? "#3E8F4E" : "#46A058"; x.fillRect(W * i / 12, 0, W / 12 + 1, H); }
    x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 3; x.strokeRect(4, 4, W - 8, H - 8);
    if(kind === "mi"){
      const ez = 9.14 * m; x.fillStyle = "rgba(255,255,255,.18)"; x.fillRect(0, 0, ez, H); x.fillRect(W - ez, 0, ez, H);
      for(let yd = 10; yd <= 110; yd += 10){ const px = W * yd / 120; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, H); x.stroke(); }
      x.fillStyle = "rgba(255,255,255,.85)"; x.font = "bold " + Math.round(H * .09) + "px sans-serif"; x.textAlign = "center";
      [10, 20, 30, 40, 50, 40, 30, 20, 10].forEach((n, i) => { const px = W * (20 + i * 10) / 120; x.fillText(n, px, H * .2); x.fillText(n, px, H * .87); });
    }else{
      x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.stroke();
      x.beginPath(); x.arc(W / 2, H / 2, 9.15 * m, 0, 7); x.stroke();
      [[0, 1], [W, -1]].forEach(([e, d]) => { x.strokeRect(e === 0 ? 0 : W - 16.5 * m, H / 2 - 20.16 * m, 16.5 * m, 40.32 * m); x.strokeRect(e === 0 ? 0 : W - 5.5 * m, H / 2 - 9.16 * m, 5.5 * m, 18.32 * m); });
    }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  async function draw3D(kind, nFields, trees, per){
    await window.ContrailUtil.loadScript(THREE_URL);
    const THREE = window.THREE, el = $("cbGrid");
    dispose3D(); el.innerHTML = ""; el.classList.add("cb-3d");
    const D = DIMS[kind], dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), sky = new THREE.Color(dark ? 0x13233F : 0xCFE6F7);
    scene.background = sky; scene.fog = new THREE.Fog(sky, 400, 1400);
    // fields in rows of up to 4, 12 m apart; the last one only partly planted
    const COLS = Math.min(4, nFields), gap = 12, rowsF = Math.ceil(nFields / COLS);
    const totalW = COLS * D.w + (COLS - 1) * gap, totalH = rowsF * D.h + (rowsF - 1) * gap;
    const origin = i => [-totalW / 2 + (i % COLS) * (D.w + gap) + D.w / 2, -totalH / 2 + Math.floor(i / COLS) * (D.h + gap) + D.h / 2];
    const soil = new THREE.MeshLambertMaterial({ color: 0x6B4A2B }), top = new THREE.MeshLambertMaterial({ map: turf(THREE, kind, D) });
    const slab = new THREE.BoxGeometry(D.w, 2, D.h);
    for(let i = 0; i < nFields; i++){
      const f = new THREE.Mesh(slab, [soil, soil, top, soil, soil, soil]); const [ox, oz] = origin(i);
      f.position.set(ox, -1, oz); f.receiveShadow = true; scene.add(f);
    }
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshLambertMaterial({ color: dark ? 0x1C2E1F : 0xB9D7A8 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -2; ground.receiveShadow = true; scene.add(ground);
    // the trees: two instanced meshes (canopy and trunk), each tree a little different
    const canopy = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 4.2, 7), new THREE.MeshLambertMaterial({ color: 0xffffff }), trees);
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .3, 1.4, 5), new THREE.MeshLambertMaterial({ color: 0x6B4A2B }), trees);
    canopy.castShadow = trunk.castShadow = true;
    const cols = Math.max(1, Math.round(Math.sqrt(per * D.w / D.h))), rows = Math.ceil(per / cols), dx = D.w / cols, dz = D.h / rows;
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    for(let t = 0; t < trees; t++){
      const fi = Math.floor(t / per), k = t % per, [ox, oz] = origin(fi);
      const x = ox - D.w / 2 + dx * ((k % cols) + .5 + (rnd() - .5) * .5), z = oz - D.h / 2 + dz * (Math.floor(k / cols) + .5 + (rnd() - .5) * .5), s = .75 + rnd() * .5;
      q.setFromAxisAngle(up, rnd() * 6.28); sc.set(s, s * (.85 + rnd() * .35), s);
      m.compose(pos.set(x, 1.4 * sc.y + 2.1 * sc.y, z), q, sc); canopy.setMatrixAt(t, m);
      m.compose(pos.set(x, .7 * sc.y, z), q, sc); trunk.setMatrixAt(t, m);
      canopy.setColorAt(t, col.setHSL(.3 + rnd() * .06, .45 + rnd() * .15, .26 + rnd() * .1));
    }
    scene.add(canopy, trunk);
    // light: sky fill plus a low sun for long shadows
    scene.add(new THREE.HemisphereLight(0xDDEEFF, 0x3A5A2A, dark ? .55 : .75));
    const sun = new THREE.DirectionalLight(0xFFF2D6, dark ? .8 : 1);
    const R = Math.hypot(totalW, totalH) / 2 + 20;
    sun.position.set(-R * .8, R * .9, -R * .5); sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: R * 4 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0005;
    scene.add(sun);
    const camera = new THREE.PerspectiveCamera(38, 1.6, 1, 6000);
    V = { renderer, scene, camera, az: .6, el: .42, dist: R * 1.55, base: R * 1.55, raf: 0, touched: false, last: performance.now() };
    const place = () => { const d = V.dist; camera.position.set(Math.sin(V.az) * Math.cos(V.el) * d, Math.sin(V.el) * d, Math.cos(V.az) * Math.cos(V.el) * d); camera.lookAt(0, 0, 0); };
    const size = () => { const w = el.clientWidth || 600, h = Math.round(w * .62); renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    size(); place();
    V.ro = new ResizeObserver(size); V.ro.observe(el);
    const loop = now => {
      if(!V) return;
      if(!V.touched) V.az += (now - V.last) / 1000 * .12; // slow turn until you take over
      V.last = now; place(); renderer.render(scene, camera);
      V.raf = location.hash === "#carbon" ? requestAnimationFrame(loop) : 0;
    };
    V.raf = requestAnimationFrame(loop);
    // drag to orbit, wheel to zoom
    const cv = renderer.domElement; let drag = null;
    cv.addEventListener("pointerdown", e => { drag = [e.clientX, e.clientY]; V.touched = true; try{ cv.setPointerCapture(e.pointerId); }catch(_){} });
    cv.addEventListener("pointermove", e => { if(!drag) return; V.az -= (e.clientX - drag[0]) * .008; V.el = Math.max(.12, Math.min(1.35, V.el + (e.clientY - drag[1]) * .006)); drag = [e.clientX, e.clientY]; });
    cv.addEventListener("pointerup", () => { drag = null; }); cv.addEventListener("pointercancel", () => { drag = null; });
    cv.addEventListener("wheel", e => { e.preventDefault(); V.touched = true; V.dist = Math.max(V.base * .25, Math.min(V.base * 2, V.dist * Math.exp(e.deltaY * .001))); }, { passive: false });
    cv.style.touchAction = "pan-y"; cv.setAttribute("aria-hidden", "true");
  }

  function render(){
    const kg = App.co2Total(), kind = App.unit() === "km" ? "km" : "mi", F = FIELDS[kind];
    const trees = Math.ceil(kg / (KG_PER_TREE_YEAR * years)), per = Math.round(F.ha * TREES_PER_HA), fields = trees / per;
    $("cbTotal").textContent = App.fmtCo2(kg);
    $("cbLead").textContent = (App.isExample() ? "Example log: " : "") + "Plant about " + trees.toLocaleString() + (trees === 1 ? " tree" : " trees") +
      " and let " + (trees === 1 ? "it" : "them") + " grow for " + years + (years === 1 ? " year" : " years") + " to soak up the carbon from your flights so far.";
    $("cbYears").innerHTML = [1, 10, 20].map(y => '<button type="button" role="tab" class="ltab" data-y="' + y + '" aria-selected="' + (y === years) + '">In ' + y + (y === 1 ? " year" : " years") + '</button>').join("");
    $("cbFields").textContent = fields >= 100 ? Math.round(fields).toLocaleString() : fields >= 1 ? fields.toFixed(1) : fields.toFixed(2);
    $("cbFieldsLabel").textContent = (fields === 1 ? F.name : F.plural) + " of new forest";
    const full = Math.floor(fields), part = trees - full * per, drawn = [];
    const nF = Math.min(full + (part > 0 ? 1 : 0), MAX_DRAWN), shownTrees = Math.min(trees, MAX_DRAWN * per);
    const more = full > MAX_DRAWN ? full - MAX_DRAWN + (part > 0 ? 1 : 0) : 0;
    $("cbMore").textContent = more ? "+ " + more.toLocaleString() + " more " + (more === 1 ? F.name : F.plural) + " not shown" : "";
    $("cbGrid").setAttribute("aria-label", trees.toLocaleString() + " trees, filling " + $("cbFields").textContent + " " + $("cbFieldsLabel").textContent);
    if(trees > 0 && window.WebGLRenderingContext && !no3D){
      draw3D(kind, nF, shownTrees, per).then(() => note(kind, F, per)).catch(() => { no3D = true; dispose3D(); render(); });
      return note(kind, F, per);
    }
    // flat drawings: up to 12 fields
    for(let i = 0; i < Math.min(full, MAX_DRAWN); i++) drawn.push(field(kind, F, per, per));
    if(full < MAX_DRAWN && part > 0) drawn.push(field(kind, F, part, per));
    $("cbGrid").classList.remove("cb-3d");
    $("cbGrid").innerHTML = TREE_DEFS + drawn.map(d => '<div class="cb-cell">' + d + '</div>').join("") + (more ? '<div class="cb-more">+ ' + more.toLocaleString() + " more</div>" : "");
    note(kind, F, per);
  }
  function note(kind, F, per){
    $("cbNote").textContent = (V ? "Drag to turn the view, scroll to zoom. " : "") + "Every little tree stands for one real tree. Estimates assume a young tree takes up about " + KG_PER_TREE_YEAR + " kg of CO₂ a year over its first 20 years, " +
      "planted about 1,000 to a hectare (" + per.toLocaleString() + " per " + F.name + "). Carbon is for one economy seat, including contrail and other high-altitude effects. " +
      (kind === "mi" ? "Switch to km for soccer fields." : "Switch to mi for American football fields.");
  }
  $("cbYears").addEventListener("click", e => {
    const b = e.target.closest("[data-y]"); if(!b) return;
    years = Number(b.dataset.y); try{ localStorage.setItem("contrail.carbonYears", years); }catch(_){}
    render();
  });
  const maybe = () => { if(location.hash === "#carbon") render(); else stop3D(); };
  addEventListener("hashchange", maybe);
  $("u-mi").addEventListener("click", maybe); $("u-km").addEventListener("click", maybe);
  maybe();
})();
