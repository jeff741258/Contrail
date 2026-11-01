// Flight photos.
// Every photo is resized and re-encoded as JPEG in the browser before it's kept anywhere. Re-encoding
// drops the camera's hidden metadata, including GPS location. The image itself lives in the browser's
// IndexedDB on this device, and, when the user is signed in to Google Drive or OneDrive, in the same
// private app folder as their log so it reaches their other devices. The list of which photos belong
// to which flight travels with the log (app.js / sync.js); this file handles the images themselves.
(function(){
  "use strict";
  const App = window.ContrailApp;
  const $ = id => document.getElementById(id);
  const FULL_MAX = 2048, FULL_Q = 0.85;  // longest side in pixels, JPEG quality
  const THUMB_MAX = 360, THUMB_Q = 0.8;
  const DEL_KEY = "contrail.photos.del"; // cloud copies still to delete (e.g. deleted while offline)

  // ---------- IndexedDB ----------
  let dbp = null;
  function db(){
    return dbp || (dbp = new Promise((resolve, reject) => {
      const r = indexedDB.open("contrail", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("photos", { keyPath: "id" });
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    }));
  }
  async function tx(mode, fn){
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction("photos", mode), st = t.objectStore("photos");
      const out = fn(st);
      t.oncomplete = () => resolve(out && "result" in out ? out.result : undefined);
      t.onerror = () => reject(t.error);
    });
  }
  const getRec = id => tx("readonly", st => st.get(id));
  const putRec = rec => tx("readwrite", st => st.put(rec));
  const delRec = id => tx("readwrite", st => st.delete(id));
  const allRecs = () => tx("readonly", st => st.getAll());

  // ---------- image processing ----------
  async function decode(blob){
    try{ return await createImageBitmap(blob, { imageOrientation: "from-image" }); }
    catch(_){
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("unsupported"));
        img.src = URL.createObjectURL(blob);
      });
    }
  }
  function encode(src, max, q){
    const w0 = src.width || src.naturalWidth, h0 = src.height || src.naturalHeight;
    const s = Math.min(1, max / Math.max(w0, h0));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w0 * s)); c.height = Math.max(1, Math.round(h0 * s));
    c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
    return new Promise(r => c.toBlob(r, "image/jpeg", q));
  }
  async function process(file){
    const img = await decode(file);
    return { full: await encode(img, FULL_MAX, FULL_Q), thumb: await encode(img, THUMB_MAX, THUMB_Q) };
  }
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // ---------- cloud ----------
  function provider(){
    const p = window.ContrailSync && window.ContrailSync.provider && window.ContrailSync.provider();
    return p && p.putPhoto ? p : null;
  }
  function pendingDeletes(){ try{ return JSON.parse(localStorage.getItem(DEL_KEY) || "[]"); }catch(_){ return []; } }
  function setPendingDeletes(ids){ try{ localStorage.setItem(DEL_KEY, JSON.stringify(ids.slice(-500))); }catch(_){} }

  let pumping = false;
  // Uploads photos not yet in the cloud and deletes ones removed while offline. Runs after each sync.
  async function pump(){
    const p = provider();
    if(!p || pumping) return;
    pumping = true;
    try{
      const live = new Set(App.photoIds());
      for(const rec of await allRecs()){
        if(rec.uploaded || !live.has(rec.id) || !rec.full) continue;
        try{ await p.putPhoto(rec.id, rec.full); rec.uploaded = true; await putRec(rec); }
        catch(e){ if(e && e.code === "auth") break; }
      }
      let dels = pendingDeletes();
      for(const id of dels.slice()){
        try{ await p.deletePhoto(id); dels = dels.filter(x => x !== id); }catch(e){ if(e && e.code === "auth") break; }
      }
      setPendingDeletes(dels);
    }finally{ pumping = false; }
  }

  // Full-size photo: from this device, or downloaded from the cloud if it was added elsewhere.
  const downloading = {};
  async function getFull(id){
    const rec = await getRec(id);
    if(rec && rec.full) return rec.full;
    const p = provider();
    if(!p || !p.getPhoto) return null;
    if(!downloading[id]){
      downloading[id] = (async () => {
        const blob = await p.getPhoto(id);
        if(!blob) return null;
        const img = await decode(blob);
        await putRec({ id, full: blob, thumb: await encode(img, THUMB_MAX, THUMB_Q), uploaded: true });
        return blob;
      })().finally(() => { delete downloading[id]; });
    }
    return downloading[id];
  }
  const urls = {};
  async function thumbUrl(id){
    if(urls[id]) return urls[id];
    let rec = await getRec(id);
    if(!rec || !rec.thumb){ await getFull(id).catch(() => null); rec = await getRec(id); }
    if(!rec || !rec.thumb) return null;
    return urls[id] = URL.createObjectURL(rec.thumb);
  }

  // ---------- adding and deleting ----------
  async function addFiles(k, files){
    const note = document.querySelector('.legph[data-k="' + CSS.escape(k) + '"] .phmsg');
    let ok = 0, bad = 0;
    for(const file of files){
      if(note) note.textContent = "Adding photo " + (ok + bad + 1) + " of " + files.length + "…";
      try{
        const { full, thumb } = await process(file);
        const id = newId();
        await putRec({ id, full, thumb, uploaded: false });
        App.addPhotoMeta(k, id); // updates the log and starts a sync
        ok++;
      }catch(_){ bad++; }
    }
    App.refreshLog();
    const n = document.querySelector('.legph[data-k="' + CSS.escape(k) + '"] .phmsg');
    if(n) n.textContent = bad ? bad + (bad === 1 ? " photo" : " photos") + " couldn't be opened. Use JPEG, PNG, WebP or HEIC from an iPhone." : "";
    pump();
  }

  async function deletePhoto(id){
    App.removePhotoMeta(id);
    if(urls[id]){ URL.revokeObjectURL(urls[id]); delete urls[id]; }
    const rec = await getRec(id);
    await delRec(id);
    // Only photos that ever reached the cloud need deleting there.
    if(rec && rec.uploaded || !rec){
      const p = provider();
      try{ if(p) await p.deletePhoto(id); else throw 0; }catch(_){ setPendingDeletes(pendingDeletes().concat(id)); }
    }
  }

  // Called by app.js when photos disappear from the log (deleted on another device, or with their flight).
  async function prune(liveIds){
    const live = new Set(liveIds);
    for(const rec of await allRecs()) if(!live.has(rec.id)){
      if(urls[rec.id]){ URL.revokeObjectURL(urls[rec.id]); delete urls[rec.id]; }
      await delRec(rec.id);
    }
  }

  // ---------- flight log drawer ----------
  function cloudNote(){
    const s = window.ContrailSync && window.ContrailSync.state;
    if(s && s.active === "apple") return "Photos stay on this device for now; iCloud photo sync isn't set up yet.";
    if(provider()) return "Photos are backed up to your " + window.ContrailProviders[s.active].label + " and sync to your other devices.";
    return "Photos are kept on this device. Sign in above to back them up and see them on your other devices.";
  }
  function drawer(k, ids, label){
    return '<div class="legph" data-k="' + k + '">' +
      (ids.length ? '<div class="phgrid">' + ids.map((id, i) =>
        '<button type="button" class="pth" data-photo="' + id + '" aria-label="Open photo ' + (i + 1) + ' of ' + ids.length + ' from ' + label + '"><img alt="" data-thumb="' + id + '"></button>').join("") + '</div>' : "") +
      '<div class="phbar"><label class="btn">Add photos<input type="file" accept="image/*" multiple data-k="' + k + '"></label>' +
      '<span class="phnote">' + cloudNote() + '</span></div><p class="phmsg msg" role="status"></p></div>';
  }
  // Fills in thumbnail images after the log renders.
  function hydrate(root){
    root.querySelectorAll("img[data-thumb]").forEach(img => {
      const id = img.dataset.thumb;
      thumbUrl(id).then(u => {
        if(u) img.src = u;
        else img.closest(".pth, .phb") && img.closest(".pth, .phb").classList.add("missing");
      }).catch(() => {});
    });
  }

  // ---------- viewer ----------
  let view = null; // {ids, i, label}
  function ensureViewer(){
    if($("phView")) return;
    const d = document.createElement("div");
    d.id = "phView"; d.className = "phview"; d.hidden = true;
    d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Flight photo");
    d.innerHTML =
      '<div class="pvtop"><span class="pvcap" id="pvCap"></span><div class="pvact">' +
      '<button type="button" class="pvbtn" id="pvDel">Delete</button><button type="button" class="pvbtn" id="pvClose" aria-label="Close">Close</button></div></div>' +
      '<div class="pvstage"><button type="button" class="pvnav" id="pvPrev" aria-label="Previous photo">‹</button>' +
      '<img id="pvImg" alt=""><p class="pvmsg" id="pvMsg"></p>' +
      '<button type="button" class="pvnav" id="pvNext" aria-label="Next photo">›</button></div>' +
      '<div class="pvconfirm" id="pvConfirm" hidden><span>Delete this photo from every device?</span>' +
      '<button type="button" class="btn" id="pvYes">Delete photo</button><button type="button" class="btn quiet" id="pvNo">Keep</button></div>';
    document.body.appendChild(d);
    $("pvClose").addEventListener("click", closeViewer);
    $("pvPrev").addEventListener("click", () => step(-1));
    $("pvNext").addEventListener("click", () => step(1));
    $("pvDel").addEventListener("click", () => { $("pvConfirm").hidden = false; $("pvYes").focus(); });
    $("pvNo").addEventListener("click", () => { $("pvConfirm").hidden = true; });
    $("pvYes").addEventListener("click", async () => {
      const id = view.ids[view.i];
      $("pvConfirm").hidden = true;
      await deletePhoto(id);
      view.ids.splice(view.i, 1);
      App.refreshLog();
      if(!view.ids.length) closeViewer(); else { view.i = Math.min(view.i, view.ids.length - 1); show(); }
    });
    d.addEventListener("click", e => { if(e.target === d || e.target.classList.contains("pvstage")) closeViewer(); });
    document.addEventListener("keydown", e => {
      if(!view || $("phView").hidden) return;
      if(e.key === "Escape") closeViewer();
      else if(e.key === "ArrowLeft") step(-1);
      else if(e.key === "ArrowRight") step(1);
    });
  }
  let fullUrl = null;
  async function show(){
    const id = view.ids[view.i];
    $("pvCap").textContent = view.label + " · " + (view.i + 1) + " of " + view.ids.length;
    $("pvPrev").disabled = view.i === 0; $("pvNext").disabled = view.i === view.ids.length - 1;
    $("pvMsg").textContent = "Loading…"; $("pvImg").hidden = true;
    const blob = await getFull(id).catch(() => null);
    if(view.ids[view.i] !== id) return;
    if(fullUrl) URL.revokeObjectURL(fullUrl);
    fullUrl = blob ? URL.createObjectURL(blob) : null;
    if(fullUrl){ $("pvImg").src = fullUrl; $("pvImg").hidden = false; $("pvMsg").textContent = ""; }
    else $("pvMsg").textContent = "This photo is on another device. Sign in above to download it here.";
  }
  function step(d){ const n = view.i + d; if(n >= 0 && n < view.ids.length){ view.i = n; show(); } }
  let returnFocus = null;
  function openViewer(ids, i, label){
    ensureViewer();
    returnFocus = document.activeElement;
    view = { ids: ids.slice(), i, label };
    $("phView").hidden = false; $("pvConfirm").hidden = true;
    document.body.classList.add("noscroll");
    show(); $("pvClose").focus();
  }
  function closeViewer(){
    $("phView").hidden = true; document.body.classList.remove("noscroll");
    if(fullUrl){ URL.revokeObjectURL(fullUrl); fullUrl = null; }
    view = null;
    if(returnFocus && returnFocus.focus) returnFocus.focus();
  }

  // ---------- events ----------
  $("log").addEventListener("click", e => {
    const t = e.target.closest(".pth");
    if(!t) return;
    const box = t.closest(".legph");
    const ids = [...box.querySelectorAll(".pth")].map(b => b.dataset.photo);
    openViewer(ids, ids.indexOf(t.dataset.photo), App.flightLabel(box.dataset.k));
  });
  $("log").addEventListener("change", e => {
    const inp = e.target.closest('input[type="file"][data-k]');
    if(!inp || !inp.files.length) return;
    const files = [...inp.files]; inp.value = "";
    addFiles(inp.dataset.k, files);
  });

  // Deletes every photo stored in this browser.
  async function wipe(){
    Object.keys(urls).forEach(id => { URL.revokeObjectURL(urls[id]); delete urls[id]; });
    if(dbp){ try{ (await dbp).close(); }catch(_){} dbp = null; }
    await new Promise(resolve => { const r = indexedDB.deleteDatabase("contrail"); r.onsuccess = r.onerror = r.onblocked = () => resolve(); });
  }

  window.ContrailPhotos = { drawer, hydrate, pump, prune, deletePhoto, wipe };
  App.refreshLog(); // draw photo buttons now that photos are available
})();
