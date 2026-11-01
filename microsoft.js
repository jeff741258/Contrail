// OneDrive storage.
// Sign-in: Microsoft identity platform via providers/msauth.js (redirect, PKCE, no server).
// Storage: contrail.json in the app's own OneDrive folder (Apps/Contrail). The
// Files.ReadWrite.AppFolder scope can't read or change anything else in the user's OneDrive.
(function(){
  "use strict";
  const U = window.ContrailUtil;
  const ITEM = "/me/drive/special/approot:/contrail.json:";
  const auth = window.ContrailMsAuth.session({
    purpose: "storage",
    scopes: "openid profile offline_access User.Read Files.ReadWrite.AppFolder",
    storage: localStorage, // stays signed in across visits
    tokensKey: "contrail.ms.tokens",
    userKey: "contrail.ms.user"
  });
  let hooks;

  const Microsoft = {
    id: "microsoft",
    label: "OneDrive",
    configured: c => !!(c && c.clientId),

    async init(c, h, { remembered }){
      hooks = h;
      auth.configure(c);
      const back = await auth.handleRedirect(); // throws if Microsoft reported an error
      if(back){ hooks.onSignedIn("microsoft", auth.user, { auto: false }); return; }
      if(!remembered || !auth.hasTokens()) return;
      try{ await auth.accessToken(); hooks.onSignedIn("microsoft", auth.user, { auto: true }); }
      catch(_){ hooks.onNeedsReconnect("microsoft", auth.user); }
    },

    signIn(){ return auth.signIn(); },

    async signOut(){ auth.signOut(); hooks.onSignedOut("microsoft"); },

    async load(){
      // Browsers can't follow /content's redirect with CORS, so fetch the pre-authorized download URL instead.
      const meta = await auth.graph(ITEM);
      if(meta.status === 404) return null;
      if(!meta.ok) throw U.err("http", "OneDrive returned an error (" + meta.status + ").");
      const url = (await meta.json())["@microsoft.graph.downloadUrl"];
      const r = await fetch(url);
      if(!r.ok) throw U.err("http", "OneDrive returned an error (" + r.status + ").");
      return r.json();
    },

    async save(doc){
      const r = await auth.graph(ITEM + "/content", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(doc)
      });
      if(!r.ok) throw U.err("http", "OneDrive returned an error (" + r.status + ").");
    }
  };

  window.ContrailProviders.microsoft = Microsoft;
})();
