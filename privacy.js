// Privacy section: "Delete all data".
// Deletes the log, photos, sign-ins and settings from this browser. If the user is signed in and
// chooses to, it also empties their cloud copy (log and photo files) and leaves a tiny marker with
// the time of the wipe, so their other devices clear their own copies on their next sync instead of
// uploading the old data again. Signing out of Google also revokes Contrail's access.
(function(){
  "use strict";
  const App = window.ContrailApp;
  const $ = id => document.getElementById(id);
  const plural = (n, w) => n.toLocaleString() + " " + w + (n === 1 ? "" : "s");

  function say(text, isErr){ const m = $("wipeMsg"); m.textContent = text; m.classList.toggle("err", !!isErr); }

  function openConfirm(){
    const S = window.ContrailSync && window.ContrailSync.state;
    const P = window.ContrailProviders || {};
    const label = S && S.active ? P[S.active].label : "";
    const connected = !!(window.ContrailSync && window.ContrailSync.provider());
    const c = App.counts();
    $("wipeWhat").textContent = "This deletes " + plural(c.flights, "flight") + " and " + plural(c.photos, "photo") +
      " from this browser, along with your sign-ins and settings. It can't be undone.";
    $("wipeCloudRow").hidden = !label;
    $("wipeCloud").checked = connected;
    $("wipeCloud").disabled = !connected;
    $("wipeCloudLabel").textContent = connected
      ? "Also delete my copy in " + label + ", which clears my other devices the next time they open Contrail"
      : "Your " + label + " session expired. Reconnect in Sync and backups first to delete your cloud copy too.";
    $("wipeType").value = "";
    $("wipeGo").disabled = true;
    $("wipeForm").hidden = false;
    $("wipeOpen").hidden = true;
    say("");
    $("wipeType").focus();
  }
  function closeConfirm(){
    $("wipeForm").hidden = true;
    $("wipeOpen").hidden = false;
    $("wipeOpen").focus();
  }

  async function run(){
    $("wipeGo").disabled = true; $("wipeCancel").disabled = true;
    const Sync = window.ContrailSync, S = Sync && Sync.state;
    const P = window.ContrailProviders || {};
    const p = S && S.active ? P[S.active] : null;
    const cloud = !!(p && $("wipeCloud").checked && Sync.provider() && p.wipe);
    const label = p ? p.label : "";
    const wipedAt = Date.now();
    say("Deleting…");
    try{
      if(Sync) await Sync.idle().catch(()=>{});
      if(cloud){
        try{
          await p.wipe({ app: "Contrail", format: 2, updatedAt: wipedAt, wipedAt, flights: [], photos: [], removed: [] });
        }catch(e){
          say("Couldn't delete your " + label + " copy (" + ((e && e.message) || "error") + "). Nothing was deleted; try again.", true);
          $("wipeGo").disabled = false; $("wipeCancel").disabled = false;
          return;
        }
      }
      if(S && S.active) Sync.signOut(); // signing out of Google also revokes Contrail's access
      await App.wipeLocal(true, cloud ? wipedAt : 0);
      $("wipeForm").hidden = true;
      $("wipeOpen").hidden = false;
      say("Deleted. All Contrail data is gone from this browser" +
        (cloud ? " and from your " + label + ". Your other devices will clear their copies the next time they open Contrail." : ".") +
        (p && p.usesOwnButtons ? " Use Apple's Sign out button above to finish signing out of iCloud." : ""));
    }finally{
      $("wipeCancel").disabled = false;
    }
  }

  // ---------- export ----------
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  function download(name, blob){
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function exSay(t, err){ const m = $("exMsg"); m.textContent = t; m.classList.toggle("err", !!err); }
  const csvCell = v => { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };

  $("exCsv").addEventListener("click", () => {
    const rows = App.exportRows();
    if(!rows.length){ exSay("Your log is empty, so there's nothing to export yet.", true); return; }
    const cols = Object.keys(rows[0]);
    const csv = "\ufeff" + [cols.join(",")].concat(rows.map(r => cols.map(c => csvCell(r[c])).join(","))).join("\r\n");
    download("contrail-flights-" + today() + ".csv", new Blob([csv], { type: "text/csv;charset=utf-8" }));
    exSay("Downloaded " + plural(rows.length, "flight") + ".");
  });

  $("exJson").addEventListener("click", () => {
    const doc = App.getDoc();
    if(!doc.flights.length){ exSay("Your log is empty, so there's nothing to export yet.", true); return; }
    download("contrail-data-" + today() + ".json", new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" }));
    exSay("Downloaded your full data file: " + plural(doc.flights.length, "flight") + " and " + plural((doc.photos || []).length, "photo") + " listed.");
  });

  $("exPhotos").addEventListener("click", async () => {
    const list = App.exportPhotos();
    if(!list.length){ exSay("You haven't added any photos yet.", true); return; }
    const btn = $("exPhotos"); btn.disabled = true;
    try{
      exSay("Preparing…");
      await window.ContrailUtil.loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
      const zip = new JSZip(), per = {};
      let added = 0, missing = 0;
      for(let i = 0; i < list.length; i++){
        const p = list[i];
        exSay("Adding photo " + (i + 1) + " of " + list.length + "…");
        const blob = await window.ContrailPhotos.getFull(p.id);
        if(!blob){ missing++; continue; }
        const base = p.base || p.date + "_" + p.from + "-" + p.to; // Hangar photos are named after the aircraft and airline
        per[base] = (per[base] || 0) + 1;
        zip.file(base + "_" + per[base] + ".jpg", blob, { binary: true, compression: "STORE" });
        added++;
      }
      if(!added){ exSay("Couldn't get any photos. If they were added on another device, sign in under Sync and backups first.", true); return; }
      exSay("Creating the zip file…");
      download("contrail-photos-" + today() + ".zip", await zip.generateAsync({ type: "blob" }));
      exSay("Downloaded " + plural(added, "photo") + "." + (missing ? " " + plural(missing, "photo") + " couldn't be fetched; sign in under Sync and backups to include photos added on other devices." : ""));
    }catch(e){
      exSay("The photo export didn't work (" + ((e && e.message) || "error") + "). Check your connection and try again.", true);
    }finally{ btn.disabled = false; }
  });

  $("wipeOpen").addEventListener("click", openConfirm);
  $("wipeCancel").addEventListener("click", closeConfirm);
  $("wipeType").addEventListener("input", e => { $("wipeGo").disabled = e.target.value.trim().toUpperCase() !== "DELETE"; });
  $("wipeForm").addEventListener("submit", e => { e.preventDefault(); if(!$("wipeGo").disabled) run(); });
})();
