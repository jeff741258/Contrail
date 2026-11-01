// Microsoft sign-in for single-page apps: authorization code flow with PKCE, no library.
// ContrailMsAuth.session({...}) returns an independent sign-in with its own scopes and storage,
// so OneDrive storage and Outlook mail import never share permissions.
// Both use the same redirect URI; each pending sign-in remembers which session started it.
(function(){
  "use strict";
  const U = window.ContrailUtil;
  const PKCE_KEY = "contrail.ms.pkce"; // sessionStorage, only while away at Microsoft's sign-in page

  const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const random = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return b64url(a); };

  // Read Microsoft's reply from the address bar once, before any session asks for it.
  let reply = null;
  (function(){
    const q = new URLSearchParams(location.search);
    const pending = U.readJSON(sessionStorage, PKCE_KEY);
    if(pending && (q.get("code") || q.get("error"))){
      reply = { pending, code: q.get("code"), state: q.get("state"), error: q.get("error"), description: q.get("error_description") };
      U.writeJSON(sessionStorage, PKCE_KEY, null);
      history.replaceState(null, "", location.pathname + location.hash);
    }
  })();

  function session({ purpose, scopes, storage, tokensKey, userKey }){
    let cfg = null, tokens = null, user = null;
    const authBase = () => "https://login.microsoftonline.com/" + (cfg.tenant || "common") + "/oauth2/v2.0";
    const redirectUri = () => cfg.redirectUri || (location.origin + location.pathname);

    async function tokenRequest(params){
      const r = await fetch(authBase() + "/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(Object.assign({ client_id: cfg.clientId, scope: scopes }, params))
      });
      const j = await r.json().catch(()=>({}));
      if(!r.ok) throw U.err("auth", j.error_description || j.error || "Microsoft sign-in failed.");
      tokens = {
        access: j.access_token,
        refresh: j.refresh_token || (tokens && tokens.refresh),
        expires: Date.now() + ((Number(j.expires_in) || 3600) - 60) * 1000
      };
      U.writeJSON(storage, tokensKey, tokens);
    }

    const S = {
      configure(c){ cfg = c; tokens = U.readJSON(storage, tokensKey); user = U.readJSON(storage, userKey); },
      get user(){ return user; },
      hasTokens(){ return !!tokens; },

      // Finishes a sign-in this session started before the redirect. Returns {state} it was given, or null.
      async handleRedirect(){
        if(!reply || reply.pending.purpose !== purpose) return null;
        const r = reply; reply = null;
        if(r.error) throw U.err(r.error === "access_denied" ? "cancelled" : "auth", r.description || "Microsoft sign-in failed.");
        if(r.state !== r.pending.state) throw U.err("auth", "Microsoft sign-in didn't match this browser. Try again.");
        await tokenRequest({ grant_type: "authorization_code", code: r.code, redirect_uri: redirectUri(), code_verifier: r.pending.verifier });
        const me = await (await S.graph("/me?$select=displayName,mail,userPrincipalName")).json();
        user = { name: me.displayName || "", email: me.mail || me.userPrincipalName || "" };
        U.writeJSON(storage, userKey, user);
        return { resume: r.pending.resume || null };
      },

      // Leaves the page. `resume` is handed back by handleRedirect() when Microsoft sends the user back.
      async signIn(resume){
        const verifier = random(48), state = random(16);
        const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
        U.writeJSON(sessionStorage, PKCE_KEY, { purpose, verifier, state, resume: resume || null });
        const p = new URLSearchParams({
          client_id: cfg.clientId, response_type: "code", response_mode: "query",
          redirect_uri: redirectUri(), scope: scopes, state,
          code_challenge: challenge, code_challenge_method: "S256", prompt: "select_account"
        });
        if(user && user.email) p.set("login_hint", user.email);
        location.assign(authBase() + "/authorize?" + p.toString());
        return new Promise(()=>{});
      },

      async accessToken(){
        if(tokens && tokens.expires > Date.now()) return tokens.access;
        if(tokens && tokens.refresh){
          try{ await tokenRequest({ grant_type: "refresh_token", refresh_token: tokens.refresh }); return tokens.access; }catch(_){}
        }
        tokens = null; U.writeJSON(storage, tokensKey, null);
        throw U.err("auth", "Your Microsoft session expired.");
      },

      async graph(path, opt = {}){
        const t = await S.accessToken();
        const url = path.startsWith("https://") ? path : "https://graph.microsoft.com/v1.0" + path;
        const r = await fetch(url, Object.assign({}, opt, {
          headers: Object.assign({ Authorization: "Bearer " + t }, opt.headers || {})
        }));
        if(r.status === 401){ if(tokens) tokens.expires = 0; throw U.err("auth", "Your Microsoft session expired."); }
        return r;
      },

      signOut(){
        tokens = null; user = null;
        U.writeJSON(storage, tokensKey, null);
        U.writeJSON(storage, userKey, null);
      }
    };
    return S;
  }

  window.ContrailMsAuth = { session };
})();
