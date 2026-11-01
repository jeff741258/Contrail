// Sync engine and the sign-in bar at the top of the page.
// One provider is active at a time. Every sync is "load, merge, save", so edits made on
// other devices are never overwritten blindly.
(function(){
  "use strict";
  const CONFIG = window.CONTRAIL_CONFIG || {};
  const PROVIDERS = window.ContrailProviders || {};
  const ORDER = ["google", "microsoft", "apple"];
  const ACTIVE_KEY = "contrail.provider";
  const $ = id => document.getElementById(id);

  // ---------- merging ----------
  // A flight survives if it was added after the last time it was deleted, on any device.
  const keyOf = f => (f.airline && f.flight ? f.airline + f.flight : f.from + f.to) + "|" + f.date;
  function merge(a, b){
    const added = new Map(), deleted = new Map();
    [a, b].forEach(doc => {
      if(!doc) return;
      (doc.flights || []).forEach(f => {
        const k = keyOf(f), cur = added.get(k);
        const ver = x => Math.max(x.added || 0, x.edited || 0); // an edit (e.g. aircraft) makes that copy newer
        if(!cur || ver(f) > ver(cur)) added.set(k, f);
      });
      (doc.removed || []).forEach(r => {
        if(r && typeof r.k === "string" && typeof r.at === "number") deleted.set(r.k, Math.max(deleted.get(r.k) || 0, r.at));
      });
    });
    const flights = [...added.entries()]
      .filter(([k, f]) => !deleted.has(k) || (f.added || 0) > deleted.get(k))
      .map(([, f]) => f)
      .sort((x, y) => x.date.localeCompare(y.date) || keyOf(x).localeCompare(keyOf(y)));
    // Photos follow the same rule, keyed "p:<id>" in the removed list, and need their flight to still exist.
    const pics = new Map();
    [a, b].forEach(doc => (doc && Array.isArray(doc.photos) ? doc.photos : []).forEach(p => {
      if(p && typeof p.id === "string" && !pics.has(p.id)) pics.set(p.id, p);
    }));
    const liveFlights = new Set(flights.map(keyOf));
    const photos = [...pics.values()]
      .filter(p => liveFlights.has(p.k) && (!deleted.has("p:" + p.id) || (p.added || 0) > deleted.get("p:" + p.id)))
      .sort((x, y) => (x.added || 0) - (y.added || 0));
    const removed = [...deleted.entries()].map(([k, at]) => ({ k, at })).sort((x, y) => x.at - y.at).slice(-1000);
    const wipedAt = Math.max((a && a.wipedAt) || 0, (b && b.wipedAt) || 0);
    return { app: "Contrail", format: 2, updatedAt: Date.now(), wipedAt, flights, photos, removed };
  }
  function fingerprint(doc){
    if(!doc) return "";
    const f = (doc.flights || []).map(x => keyOf(x) + "@" + (x.added || 0) + "/" + (x.edited || 0) + ":" + (x.aircraft || "")).sort().join(",");
    const r = (doc.removed || []).map(x => x.k + "@" + x.at).sort().join(",");
    const p = (doc.photos || []).map(x => x.id + ">" + x.k).sort().join(",");
    return f + "#" + r + "#" + p;
  }

  // ---------- state ----------
  const S = { active: null, user: null, state: "off", last: 0, message: "" };
  let running = null, again = false, timer = 0, lastPull = 0;
  const remembered = () => { try{ return localStorage.getItem(ACTIVE_KEY); }catch(_){ return null; } };
  const remember = id => { try{ id ? localStorage.setItem(ACTIVE_KEY, id) : localStorage.removeItem(ACTIVE_KEY); }catch(_){} };
  function set(state, message){ S.state = state; S.message = message || ""; render(); }

  async function syncOnce(){
    const p = PROVIDERS[S.active];
    const remote = await p.load();
    // Another device used "Delete all data" since this one last synced: clear this device's copy too.
    if(remote && (remote.wipedAt || 0) > window.ContrailApp.wipeSeen()){
      await window.ContrailApp.wipeLocal(false, remote.wipedAt);
    }
    const local = window.ContrailApp.getDoc();
    const merged = merge(local, remote);
    if(fingerprint(merged) !== fingerprint(local)) window.ContrailApp.setDoc(merged); // also folds duplicate trips
    const final = window.ContrailApp.getDoc();
    if(!remote || fingerprint(final) !== fingerprint(remote)) await p.save(final);
  }

  // quiet: a background check. The status keeps its "Synced at" line instead of flashing "Syncing…".
  function sync(quiet){
    if(!S.active || S.state === "reconnect") return Promise.resolve();
    if(running){ if(!quiet) again = true; return running; }
    clearTimeout(timer);
    if(!quiet) set("syncing");
    running = (async ()=>{
      try{
        try{ await syncOnce(); }
        catch(e){ if(e && e.code === "conflict") await syncOnce(); else throw e; } // another device saved first: merge again
        S.last = lastPull = Date.now();
        set("ok");
        if(window.ContrailPhotos) window.ContrailPhotos.pump(); // upload new photos, delete removed ones
      }catch(e){
        if(e && e.code === "auth") set("reconnect", e.message);
        else set("error", (e && e.message) || "Sync failed.");
      }finally{
        running = null;
        if(again){ again = false; sync(); }
      }
    })();
    return running;
  }

  const hooks = {
    onSignedIn(id, user, opts){
      // A session restored on page load only counts for the provider the user picked last.
      if(opts && opts.auto && remembered() && remembered() !== id) return;
      if(S.active && S.active !== id){
        const prev = PROVIDERS[S.active];
        if(!prev.usesOwnButtons) prev.signOut().catch(()=>{});
      }
      S.active = id; S.user = user; remember(id);
      sync();
    },
    onSignedOut(id){
      if(S.active !== id) return;
      S.active = null; S.user = null; remember(null);
      set("off");
    },
    onNeedsReconnect(id, user){
      S.active = id; S.user = user;
      set("reconnect", "Your " + PROVIDERS[id].label + " session expired.");
    }
  };

  // ---------- sign-in bar ----------
  const configured = ORDER.filter(id => PROVIDERS[id] && PROVIDERS[id].configured(CONFIG[id]));
  const dateTime = t => new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  function render(){
    const signedIn = !!S.active;
    $("cbOut").hidden = signedIn;
    $("cbIn").hidden = !signedIn;
    ORDER.forEach(id => { const el = $("pb-" + id); if(el) el.hidden = signedIn || !configured.includes(id); });
    // With no provider set up in config.js, visitors see no sign-in box at all.
    $("cloudBar").hidden = configured.length === 0;
    $("cbErr").hidden = signedIn || !S.message;
    $("cbErr").textContent = signedIn ? "" : S.message;
    $("footStore").textContent = signedIn
      ? "Contrail keeps your log in this browser and syncs it to your " + PROVIDERS[S.active].label + "."
      : "Contrail keeps your log in this browser and, once you sign in, in your own cloud account.";
    if(!signedIn) return;

    const p = PROVIDERS[S.active];
    $("cbProv").textContent = p.label;
    $("cbUser").textContent = (S.user && (S.user.email || S.user.name)) || "Signed in";
    const status = {
      syncing: "Syncing…",
      pending: "Changes waiting to sync",
      ok: "Synced" + (S.last ? " at " + dateTime(S.last) : ""),
      reconnect: (S.message || "Session expired.") + " Reconnect to keep syncing.",
      error: S.message + " Your log is still saved on this device."
    }[S.state] || "";
    $("cbStatus").textContent = status;
    $("cbIn").dataset.state = S.state;
    $("cbSync").hidden = S.state === "reconnect";
    $("cbReconnect").hidden = S.state !== "reconnect" || p.usesOwnButtons;
    $("cbSignOut").hidden = !!p.usesOwnButtons;
    $("apple-sign-out-button").hidden = !p.usesOwnButtons;
  }

  // The provider is only remembered once sign-in actually succeeds (hooks.onSignedIn),
  // so an abandoned popup never leaves the bar saying "session expired".
  function startSignIn(id){
    S.message = "";
    PROVIDERS[id].signIn().catch(e => {
      set(S.active ? S.state : "off", e && e.code === "cancelled" ? "" : ((e && e.message) || "Sign-in failed."));
    });
  }

  ["google", "microsoft"].forEach(id => {
    const b = $("pb-" + id);
    if(b) b.addEventListener("click", () => startSignIn(id));
  });
  $("cbReconnect").addEventListener("click", () => {
    const id = S.active;
    S.state = "off";
    PROVIDERS[id].signIn().catch(e => set("reconnect", e && e.code === "cancelled" ? "" : (e && e.message)));
  });
  $("cbSync").addEventListener("click", () => sync());
  function signOut(){
    const p = PROVIDERS[S.active];
    if(p) p.signOut().catch(()=>{});
    S.active = null; S.user = null; remember(null); set("off");
  }
  $("cbSignOut").addEventListener("click", signOut);

  // Pick up changes from other devices: right away when the user comes back to the tab,
  // and every minute (config: sync.intervalSeconds) while the app is open and on screen.
  // Hidden tabs don't check, so a backgrounded app costs no requests.
  const INTERVAL = Math.max(15, Number(CONFIG.sync && CONFIG.sync.intervalSeconds) || 60) * 1000;
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "visible" && S.active && Date.now() - lastPull > 30000) sync(true);
  });
  setInterval(() => {
    if(document.visibilityState !== "visible" || !S.active) return;
    if(S.state !== "ok" && S.state !== "error") return; // signed out, waiting to reconnect, or a sync is already queued
    if(Date.now() - lastPull < INTERVAL - 1000) return;
    sync(true);
  }, Math.min(INTERVAL, 15000));

  window.ContrailSync = {
    merge, fingerprint, state: S,
    // The signed-in storage provider, if it's connected right now.
    provider(){ return S.active && S.state !== "reconnect" ? PROVIDERS[S.active] : null; },
    signOut,
    // Waits for any sync in progress, so "Delete all data" doesn't race with one.
    idle(){ clearTimeout(timer); return running || Promise.resolve(); },
    // Called by app.js after every local edit; batches quick edits into one sync.
    changed(){
      if(!S.active || S.state === "reconnect") return;
      clearTimeout(timer);
      set("pending");
      timer = setTimeout(sync, 1500);
    }
  };

  render();
  configured.forEach(id => {
    PROVIDERS[id].init(CONFIG[id], hooks, { remembered: remembered() === id })
      .then(() => { if(remembered() === id && S.active !== id) remember(null); }) // nothing to restore
      .catch(e => {
        console.warn("Contrail: " + id + " didn't start", e);
        if(remembered() === id) remember(null);
        if(e && e.code !== "cancelled") set(S.active ? S.state : "off", (e && e.message) || PROVIDERS[id].label + " sign-in isn't available right now.");
      });
  });
})();
