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

  $("wipeOpen").addEventListener("click", openConfirm);
  $("wipeCancel").addEventListener("click", closeConfirm);
  $("wipeType").addEventListener("input", e => { $("wipeGo").disabled = e.target.value.trim().toUpperCase() !== "DELETE"; });
  $("wipeForm").addEventListener("submit", e => { e.preventDefault(); if(!$("wipeGo").disabled) run(); });
})();
