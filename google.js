// Google Drive storage.
// Sign-in: Google Identity Services token model (popup, no server needed).
// Storage: one file, contrail.json, in Drive's hidden appDataFolder. Only Contrail can see it,
// it doesn't clutter the user's Drive, and the scope can't touch any of their other files.
(function(){
  "use strict";
  const U = window.ContrailUtil;
  const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
  const SCOPE = DRIVE_SCOPE + " openid email profile";
  const FILE = "contrail.json";
  const TOKEN_KEY = "contrail.google.token"; // localStorage: shared by every tab until it expires (1 hour)
  const USER_KEY = "contrail.google.user";   // localStorage: lets "Reconnect" pre-fill the account

  let cfg, hooks, client, token = null, expires = 0, fileId = null, user = null, waiter = null;

  async function api(url, opt = {}){
    if(!token || Date.now() > expires) throw U.err("auth", "Your Google session expired.");
    const r = await fetch(url, Object.assign({}, opt, {
      headers: Object.assign({ Authorization: "Bearer " + token }, opt.headers || {})
    }));
    if(r.status === 401){ token = null; U.writeJSON(localStorage, TOKEN_KEY, null); throw U.err("auth", "Your Google session expired."); }
    if(!r.ok) throw U.err("http", "Google Drive returned an error (" + r.status + ").");
    return r;
  }

  async function findFile(){
    if(fileId) return fileId;
    const q = encodeURIComponent("name='" + FILE + "'");
    const r = await (await api("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&pageSize=1&fields=files(id)&q=" + q)).json();
    fileId = r.files && r.files[0] ? r.files[0].id : null;
    return fileId;
  }

  const Google = {
    id: "google",
    label: "Google Drive",
    configured: c => !!(c && c.clientId),

    async init(c, h, { remembered }){
      cfg = c; hooks = h;
      await U.loadScript("https://accounts.google.com/gsi/client");
      client = google.accounts.oauth2.initTokenClient({
        client_id: cfg.clientId,
        scope: SCOPE,
        callback: r => {
          const w = waiter; waiter = null; if(!w) return;
          r.error ? w.reject(U.err("auth", r.error_description || r.error)) : w.resolve(r);
        },
        error_callback: e => {
          const w = waiter; waiter = null; if(!w) return;
          w.reject(U.err(e && e.type === "popup_closed" ? "cancelled" : "auth", (e && (e.message || e.type)) || "Google sign-in failed."));
        }
      });
      if(!remembered) return;
      // A token from the last hour, from this tab or another one, is still good.
      const saved = U.readJSON(localStorage, TOKEN_KEY);
      if(saved && saved.expires > Date.now() + 60000){
        token = saved.token; expires = saved.expires; user = saved.user;
        hooks.onSignedIn("google", user, { auto: true });
        return;
      }
      // Otherwise Google needs a click before it hands out a new token. Only offer "Reconnect"
      // to someone who really signed in before; anyone else just sees the sign-in button.
      user = U.readJSON(localStorage, USER_KEY);
      if(user) hooks.onNeedsReconnect("google", user);
    },

    // Must be called straight from a click handler: the popup opens before the first await.
    async signIn(){
      const r = await new Promise((resolve, reject)=>{
        waiter = { resolve, reject };
        client.requestAccessToken({ prompt: "", login_hint: (user && user.email) || undefined });
      });
      if(!google.accounts.oauth2.hasGrantedAllScopes(r, DRIVE_SCOPE)){
        throw U.err("auth", "Contrail needs permission to use its own Google Drive app folder. Sign in again and allow it.");
      }
      token = r.access_token;
      expires = Date.now() + (Number(r.expires_in) || 3600) * 1000 - 60000;
      const me = await (await api("https://www.googleapis.com/oauth2/v3/userinfo")).json();
      user = { name: me.name || "", email: me.email || "" };
      U.writeJSON(localStorage, TOKEN_KEY, { token, expires, user });
      U.writeJSON(localStorage, USER_KEY, user);
      hooks.onSignedIn("google", user, { auto: false });
      return user;
    },

    async signOut(){
      if(token){ try{ google.accounts.oauth2.revoke(token, ()=>{}); }catch(_){} }
      token = null; fileId = null; user = null;
      U.writeJSON(localStorage, TOKEN_KEY, null);
      U.writeJSON(localStorage, USER_KEY, null);
      hooks.onSignedOut("google");
    },

    async load(){
      const id = await findFile();
      if(!id) return null;
      return (await api("https://www.googleapis.com/drive/v3/files/" + id + "?alt=media")).json();
    },

    async save(doc){
      const body = JSON.stringify(doc);
      const id = await findFile();
      if(id){
        await api("https://www.googleapis.com/upload/drive/v3/files/" + id + "?uploadType=media", {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body
        });
        return;
      }
      const b = "contrail" + Math.random().toString(36).slice(2);
      const multipart =
        "--" + b + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify({ name: FILE, parents: ["appDataFolder"] }) + "\r\n" +
        "--" + b + "\r\nContent-Type: application/json\r\n\r\n" + body + "\r\n--" + b + "--";
      const r = await (await api("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
        method: "POST", headers: { "Content-Type": "multipart/related; boundary=" + b }, body: multipart
      })).json();
      fileId = r.id;
    }
  };

  window.ContrailProviders.google = Google;
})();
