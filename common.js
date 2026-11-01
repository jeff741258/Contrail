// Shared helpers for the storage providers.
// Every provider exposes the same shape on window.ContrailProviders[id]:
//   configured(cfg)         -> true when config.js has what it needs
//   init(cfg, hooks, opts)  -> load SDKs, restore a session if there is one
//   signIn() / signOut()    -> start from a click
//   load()                  -> the stored log document, or null if none yet
//   save(doc)               -> write the whole log document
// Hooks the sync engine passes in:
//   onSignedIn(id, user, {auto}), onSignedOut(id), onNeedsReconnect(id, user)
// Errors carry a .code: "auth" (sign in again), "conflict" (someone else saved first),
// "cancelled" (user closed the sign-in window), or "http".
(function(){
  "use strict";
  window.ContrailProviders = window.ContrailProviders || {};
  window.ContrailUtil = {
    // Shares an image through the phone's share sheet (Instagram, Messages, …) where the browser can,
    // otherwise saves it to downloads. Resolves "shared", "cancelled" or "saved".
    async shareImage(blob, name, title, text){
      const save = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); return "saved"; };
      let file = null; try{ file = new File([blob], name, { type: blob.type || "image/png" }); }catch(_){}
      if(file && navigator.canShare && navigator.canShare({ files: [file] })){
        try{ await navigator.share({ files: [file], title, text }); return "shared"; }
        catch(e){ if(e && e.name === "AbortError") return "cancelled"; }
      }
      return save();
    },
    err(code, message){ const e = new Error(message || code); e.code = code; return e; },
    loadScript(src){
      const cache = window.ContrailUtil._scripts || (window.ContrailUtil._scripts = {});
      if(cache[src]) return cache[src];
      return cache[src] = new Promise((resolve, reject)=>{
        const s = document.createElement("script");
        s.src = src; s.async = true;
        s.onload = resolve;
        s.onerror = ()=>reject(window.ContrailUtil.err("http", "Couldn't load " + src));
        document.head.appendChild(s);
      });
    },
    readJSON(storage, key){ try{ return JSON.parse(storage.getItem(key) || "null"); }catch(_){ return null; } },
    writeJSON(storage, key, value){ try{ value == null ? storage.removeItem(key) : storage.setItem(key, JSON.stringify(value)); }catch(_){} }
  };
})();
