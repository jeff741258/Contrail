// Hangar's other two collections: Airlines (a dex grouped by alliance) and Passport (a stamp for every
// airport you've flown through). Only flights you've actually taken count. No countries, on purpose.
(function(){
  "use strict";
  const App = window.ContrailApp;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = iso => { const [y, m, d] = iso.split("-"); return new Date(+y, +m - 1, +d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); };
  const today = () => { const t = new Date(); return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"); };
  const flown = () => App.flights().filter(f => f.date <= today()).sort((a, b) => a.date.localeCompare(b.date));
  const plural = (n, w) => n.toLocaleString() + " " + w + (n === 1 ? "" : "s");
  let alFilter = "all", ppSort = "first";
  try{ alFilter = localStorage.getItem("contrail.alFilter") || "all"; ppSort = localStorage.getItem("contrail.ppSort") || "first"; }catch(_){}

  // Members as of October 2026. Asiana leaves Star Alliance on 16 Dec 2026 when it merges into Korean Air.
  const ALLIANCES = [
    { id: "star", name: "Star Alliance", codes: ["A3","AC","CA","AI","NZ","NH","OZ","OS","AV","SN","CM","OU","MS","ET","BR","AZ","LO","LH","ZH","SQ","SA","LX","TP","TG","TK","UA"] },
    { id: "oneworld", name: "oneworld", codes: ["AS","AA","BA","CX","AY","IB","JL","MH","QF","QR","AT","RJ","UL","FJ","WY"] },
    { id: "skyteam", name: "SkyTeam", codes: ["AR","AM","UX","AF","CI","MU","DL","GA","KQ","KL","KE","ME","SK","SV","RO","VN","VS","MF"] }
  ];

  // ---------- Airlines ----------
  function airlines(el){
    const list = flown(), by = {};
    list.forEach(f => { if(!f.airline) return; (by[f.airline] = by[f.airline] || []).push(f); });
    const inAlliance = new Set(ALLIANCES.flatMap(a => a.codes));
    const others = Object.keys(by).filter(c => !inAlliance.has(c)).sort((a, b) => by[b].length - by[a].length || a.localeCompare(b));
    const total = Object.keys(by).length, catalog = ALLIANCES.reduce((n, a) => n + a.codes.length, 0) + others.length;
    const tile = (code, alliance) => {
      const fl = by[code], name = App.airlineName(code);
      if(!fl) return (alFilter === "flown") ? "" : '<div class="al-tile missing"><span class="al-code">' + code + '</span><b>' + esc(name) + '</b><span class="al-st">Not flown yet</span></div>';
      if(alFilter === "missing") return "";
      const types = new Set(fl.map(f => f.ac).filter(Boolean)), routes = {};
      fl.forEach(f => { const r = [f.from, f.to].sort().join("–"); routes[r] = (routes[r] || 0) + 1; });
      const top = Object.entries(routes).sort((a, b) => b[1] - a[1])[0], first = fl[0];
      return '<a class="al-tile flown a-' + alliance + '" href="#log" data-al="' + code + '" aria-label="' + esc(name) + ': show its flights">' +
        '<span class="al-code">' + code + '</span><b>' + esc(name) + '</b>' +
        '<span class="al-st">' + plural(fl.length, "flight") + (types.size ? " · " + plural(types.size, "aircraft type") : "") + '</span>' +
        '<span class="al-sub">First ' + fmt(first.date) + ' · ' + first.from + ' → ' + first.to + '</span>' +
        '<span class="al-sub">Top route ' + top[0] + ' ×' + top[1] + '</span></a>';
    };
    const group = (id, title, codes) => {
      const got = codes.filter(c => by[c]).length, tiles = codes.map(c => tile(c, id)).join("");
      if(!tiles) return "";
      return '<div class="hg-group"><div class="hg-gh"><h3>' + esc(title) + '</h3><span>' + got + ' / ' + codes.length + ' flown</span></div>' +
        (codes.length ? '<span class="al-bar"><i style="width:' + (got / codes.length * 100).toFixed(1) + '%"></i></span>' : "") +
        '<div class="al-tiles">' + tiles + '</div></div>';
    };
    const counts = { all: catalog, flown: total, missing: catalog - total };
    el.innerHTML =
      '<div class="hg-head"><div class="hg-count"><span class="label">Airlines flown</span><span class="hg-big">' + total + '</span></div>' +
      '<div class="hg-prog"><p>' + (total ? plural(list.filter(f => f.airline).length, "flight") + " across " + plural(total, "airline") + ". Collect the three alliances, plus any others you fly." : "Flights with a flight number show up here.") + '</p></div></div>' +
      '<div class="logtabs" role="tablist" aria-label="Show airlines">' + [["all", "All"], ["flown", "Flown"], ["missing", "Not yet"]].map(([id, l]) =>
        '<button type="button" role="tab" class="ltab" data-alf="' + id + '" aria-selected="' + (alFilter === id) + '">' + l + '<span>' + counts[id] + '</span></button>').join("") + '</div>' +
      ALLIANCES.map(a => group(a.id, a.name, a.codes)).join("") +
      (others.length ? group("other", "Other airlines", others) : "") +
      '<p class="hint al-note">Alliance members as of October 2026.</p>';
  }

  // ---------- Passport ----------
  const INKS = ["#C2410C", "#1D4ED8", "#047857", "#7E22CE", "#B91C1C", "#0E7490", "#A16207", "#BE185D"];
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
  // Runway layouts (runways.js, ~100 KB) load the first time the Passport opens.
  let RW = null, rwLoading = false;
  function runways(){
    if(RW) return RW;
    if(window.CONTRAIL_RUNWAYS){ RW = {}; window.CONTRAIL_RUNWAYS.split(";").forEach(r => { const [c, d] = r.split(":"); RW[c] = d.split(",").map(Number); }); return RW; }
    if(!rwLoading){
      rwLoading = true;
      const v = (document.querySelector('script[src*="collections.js"]') || {}).src || "", q = v.includes("?") ? v.slice(v.indexOf("?")) : "";
      window.ContrailUtil.loadScript("runways.js" + q).then(() => window.ContrailHangar.refresh()).catch(() => {});
    }
    return null;
  }
  // ---------- terminal outlines from OpenStreetMap ----------
  // Buildings tagged aeroway=terminal within 4 km of each airport, fetched in small batches the first time
  // an airport is stamped and kept on this device. Only airport coordinates are sent, never flights.
  const TKEY = "contrail.terminals.v1", RETRY = 30 * 864e5, OVERPASS = "https://overpass-api.de/api/interpreter";
  let TERM = null, termBusy = false, termNote = "", termFailed = 0; // after a failure, wait 10 minutes before asking again
  function terms(){ if(!TERM){ try{ TERM = JSON.parse(localStorage.getItem(TKEY) || "{}"); }catch(_){ TERM = {}; } } return TERM; }
  function saveTerms(){ try{ localStorage.setItem(TKEY, JSON.stringify(TERM)); }catch(_){} }
  // Douglas–Peucker, so big terminals stay small in storage
  function simplify(pts, tol){
    if(pts.length < 5) return pts;
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const st = [[0, pts.length - 1]];
    while(st.length){
      const [a, b] = st.pop(); let md = 0, mi = -1;
      const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
      for(let i = a + 1; i < b; i++){ // a closed ring starts and ends on the same point: measure from that point
        const d = L ? Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L : Math.hypot(pts[i][0] - ax, pts[i][1] - ay); if(d > md){ md = d; mi = i; } }
      if(md > tol){ keep[mi] = 1; st.push([a, mi], [mi, b]); }
    }
    return pts.filter((_, i) => keep[i]);
  }
  async function fetchTerminals(codes){
    if(termBusy || Date.now() - termFailed < 6e5) return; const T = terms(), now = Date.now();
    const need = codes.filter(c => !T[c] || (!T[c].p.length && now - T[c].t > RETRY)).filter(c => App.airportLatLon(c));
    if(!need.length) return;
    termBusy = true; termNote = "Fetching terminal outlines…"; window.ContrailHangar.refresh();
    try{
      for(let i = 0; i < need.length; i += 15){
        const batch = need.slice(i, i + 15);
        const q = "[out:json][timeout:60];(" + batch.map(c => { const [la, lo] = App.airportLatLon(c);
          return 'way["aeroway"="terminal"](around:4000,' + la + "," + lo + ');relation["aeroway"="terminal"](around:4000,' + la + "," + lo + ");"; }).join("") + ");out geom;";
        const r = await fetch(OVERPASS, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        if(!r.ok) throw new Error("OpenStreetMap is busy (" + r.status + ")");
        const els = (await r.json()).elements || [], polys = {};
        batch.forEach(c => polys[c] = []);
        els.forEach(el => {
          const rings = el.type === "way" ? [el.geometry] : (el.members || []).filter(m => m.role === "outer" && m.geometry).map(m => m.geometry);
          rings.filter(g => g && g.length > 2).forEach(g => {
            const cy = g.reduce((s, p) => s + p.lat, 0) / g.length, cx = g.reduce((s, p) => s + p.lon, 0) / g.length;
            let best = null, bd = 5000; // nearest airport in this batch
            batch.forEach(c => { const [la, lo] = App.airportLatLon(c); const d = Math.hypot((cy - la) * 110540, (cx - lo) * 111320 * Math.cos(la * Math.PI / 180)); if(d < bd){ bd = d; best = c; } });
            if(best) polys[best].push(g);
          });
        });
        batch.forEach(c => {
          const [la] = App.airportLatLon(c), k = Math.cos(la * Math.PI / 180), rings = polys[c];
          if(!rings.length){ T[c] = { t: now, p: [] }; return; }
          let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
          rings.forEach(g => g.forEach(p => { const x = p.lon * 111320 * k, y = p.lat * 110540; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }));
          const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, tol = Math.max(x1 - x0, y1 - y0) / 160;
          T[c] = { t: now, p: rings.map(g => simplify(g.map(p => [p.lon * 111320 * k - cx, p.lat * 110540 - cy]), tol).flatMap(([x, y]) => [Math.round(x), Math.round(y)])) };
        });
        saveTerms(); window.ContrailHangar.refresh();
        await new Promise(res => setTimeout(res, 1200)); // be gentle with the free OpenStreetMap service
      }
      termNote = "";
    }catch(e){ termFailed = Date.now(); termNote = "Couldn't reach OpenStreetMap for terminal outlines (" + ((e && e.message) || "offline") + "). Showing runways for now."; }
    finally{ termBusy = false; window.ContrailHangar.refresh(); }
  }
  // The stamp's shape is the airport's terminal buildings: filled outlines, north up.
  function terminalSVG(code){
    const t = terms()[code]; if(!t || !t.p.length) return "";
    let ext = 1; t.p.forEach(r => { for(let i = 0; i < r.length; i++) ext = Math.max(ext, Math.abs(r[i])); });
    const sc = 44 / ext, P = (x, y) => (50 + x * sc).toFixed(1) + "," + (50 - y * sc).toFixed(1);
    const d = t.p.map(r => { let s = "M"; for(let i = 0; i + 1 < r.length; i += 2) s += (i ? "L" : "") + P(r[i], r[i + 1]); return s + "Z"; }).join("");
    return '<svg class="pp-rw" viewBox="0 0 100 100" aria-hidden="true"><path d="' + d + '" style="fill:var(--ink);fill-opacity:.2;stroke:var(--ink);stroke-width:1.6;stroke-linejoin:round"/></svg>';
  }

  // Fallback shape while outlines load (or when OpenStreetMap has none): the runway layout, north up: outlined runways with dashed centre lines.
  function runwaySVG(code){
    const R = runways(), d = R && R[code]; if(!d || !d.length) return "";
    const segs = []; for(let i = 0; i + 4 < d.length; i += 5) segs.push(d.slice(i, i + 5));
    let ext = 1; segs.forEach(([x1, y1, x2, y2]) => { ext = Math.max(ext, Math.abs(x1), Math.abs(x2), Math.abs(y1), Math.abs(y2)); });
    const sc = 40 / ext, P = (x, y) => (50 + x * sc).toFixed(1) + " " + (50 - y * sc).toFixed(1);
    const sw = s => Math.max(7, Math.min(12, s[4] * sc * 2.2)).toFixed(1);
    const line = (s, w, style) => '<path d="M' + P(s[0], s[1]) + "L" + P(s[2], s[3]) + '" stroke-width="' + w + '" style="' + style + '"/>';
    return '<svg class="pp-rw" viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke-linecap="butt">' +
      segs.map(s => line(s, sw(s), "stroke:var(--ink)")).join("") +                       // outline of every runway…
      segs.map(s => line(s, (sw(s) - 3).toFixed(1), "stroke:var(--ppbg)")).join("") +       // …hollowed out, so crossings merge
      segs.map(s => line(s, 0.9, "stroke:var(--ink);stroke-dasharray:3 2.4")).join("") +    // centre lines
      "</svg>";
  }
  function passport(el){
    const list = flown(), ap = {};
    list.forEach(f => [f.from, f.to].forEach(c => { const a = ap[c] || (ap[c] = { code: c, n: 0, first: f.date, last: f.date }); a.n++; a.last = f.date; }));
    let stamps = Object.values(ap);
    stamps.sort(ppSort === "most" ? (a, b) => b.n - a.n || a.code.localeCompare(b.code) : ppSort === "az" ? (a, b) => a.code.localeCompare(b.code) : (a, b) => a.first.localeCompare(b.first) || a.code.localeCompare(b.code));
    const stamp = (s, i) => {
      const h = hash(s.code), ink = INKS[Math.abs(h) % INKS.length], rot = ((Math.abs(h) % 13) - 6) * 1.1, rw = terminalSVG(s.code) || runwaySVG(s.code);
      // airports without runway data keep a round stamp
      return '<a class="pp-stamp ' + (rw ? "rw" : "round") + '" href="#log" data-ap="' + s.code + '" style="--ink:' + ink + ';--rot:' + rot.toFixed(1) + 'deg" aria-label="' + s.code + ', ' + esc(App.airportCity(s.code)) + ': ' + plural(s.n, "flight") + ', first ' + fmt(s.first) + '">' +
        '<span class="pp-in">' + rw + '<span class="pp-no">No. ' + String(i + 1).padStart(3, "0") + '</span><b class="pp-code">' + s.code + '</b>' +
        '<span class="pp-city">' + esc(App.airportCity(s.code)) + '</span><span class="pp-date">' + fmt(s.first).toUpperCase() + '</span>' +
        '<span class="pp-n">' + plural(s.n, "flight") + '</span></span></a>';
    };
    // numbering always follows the order you first visited
    const order = Object.values(ap).sort((a, b) => a.first.localeCompare(b.first) || a.code.localeCompare(b.code)).map(a => a.code);
    fetchTerminals(stamps.map(s => s.code));
    el.innerHTML =
      '<div class="hg-head"><div class="hg-count"><span class="label">Airports stamped</span><span class="hg-big">' + stamps.length + '</span></div>' +
      '<div class="hg-prog"><p>' + (stamps.length ? "Your first stamp: " + order[0] + " on " + fmt(ap[order[0]].first) + "." : "Every airport you fly through gets a stamp.") + '</p></div></div>' +
      '<div class="logtabs" role="tablist" aria-label="Order stamps by">' + [["first", "First visit"], ["most", "Most flights"], ["az", "A–Z"]].map(([id, l]) =>
        '<button type="button" role="tab" class="ltab" data-pps="' + id + '" aria-selected="' + (ppSort === id) + '">' + l + '</button>').join("") + '</div>' +
      '<div class="pp-page">' + stamps.map(s => stamp(s, order.indexOf(s.code))).join("") + '</div>' +
      '<p class="hint">' + (termNote ? esc(termNote) + " " : "") + 'Stamps are shaped like each airport\'s terminal buildings, north up. Terminal outlines © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.</p>';
  }

  function render(section, el){ (section === "passport" ? passport : airlines)(el); }
  document.addEventListener("click", e => {
    const f = e.target.closest("[data-alf]"), s = e.target.closest("[data-pps]");
    if(f){ alFilter = f.dataset.alf; try{ localStorage.setItem("contrail.alFilter", alFilter); }catch(_){} window.ContrailHangar.refresh(); return; }
    if(s){ ppSort = s.dataset.pps; try{ localStorage.setItem("contrail.ppSort", ppSort); }catch(_){} window.ContrailHangar.refresh(); return; }
    const t = e.target.closest("a.al-tile[data-al]"); if(t){ e.preventDefault(); App.openLog({ al: t.dataset.al }); return; }
    const p = e.target.closest("a.pp-stamp[data-ap]"); if(p){ e.preventDefault(); App.openLog({ ap: p.dataset.ap }); }
  });
  window.ContrailCollections = { render };
})();
