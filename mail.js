// Import flights from Gmail or Outlook.
// Contrail searches the inbox for airline emails, reads the matches in the browser, runs them
// through the same parser as pasted emails, and shows the flights for review. Email contents
// are never stored or sent anywhere; only the flights the user chooses to add are kept.
// Mail access is separate from cloud storage: signing in to OneDrive doesn't grant mail access,
// and the mail permission is only asked for when the user starts a scan.
(function(){
  "use strict";
  const U = window.ContrailUtil;
  const CFG = window.CONTRAIL_CONFIG || {};
  const App = window.ContrailApp;
  const $ = id => document.getElementById(id);

  const MAX_EMAILS = 400; // per scan
  const CONCURRENCY = 3; // Gmail refuses too many simultaneous requests from one user
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const since = years => { const d = new Date(); d.setFullYear(d.getFullYear() - years); return d; };

  // Search terms airlines and travel agencies use in booking, check-in and receipt emails.
  const TERMS = ["boarding pass", "itinerary", "e-ticket", "eticket", "flight confirmation", "confirmation code",
                 "record locator", "trip confirmation", "your flight", "flight receipt", "check in for your flight"];

  // Runs worker over items a few at a time. Returns the results plus how many items failed.
  async function pool(items, worker, onEach){
    const out = new Array(items.length); let next = 0, done = 0, failed = 0;
    async function run(){
      while(next < items.length){
        const i = next++;
        try{ out[i] = await worker(items[i]); }catch(e){ if(e && e.code === "auth") throw e; out[i] = null; failed++; }
        onEach(++done);
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, run));
    const results = out.filter(Boolean);
    results.failed = failed;
    return results;
  }

  // ---------- Gmail ----------
  const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
  const gmail = { client: null, waiter: null, token: null, expires: 0 };
  const gmailOn = !!(CFG.google && CFG.google.clientId && CFG.google.gmailImport !== false);

  function gmailSetup(){
    return U.loadScript("https://accounts.google.com/gsi/client").then(()=>{
      gmail.client = google.accounts.oauth2.initTokenClient({
        client_id: CFG.google.clientId,
        scope: GMAIL_SCOPE,
        callback: r => { const w = gmail.waiter; gmail.waiter = null; if(w) r.error ? w.reject(U.err("auth", r.error_description || r.error)) : w.resolve(r); },
        error_callback: e => { const w = gmail.waiter; gmail.waiter = null; if(w) w.reject(U.err(e && e.type === "popup_closed" ? "cancelled" : "auth", (e && (e.message || e.type)) || "Google sign-in failed.")); }
      });
    });
  }

  // Must be called straight from a click: the permission popup opens before the first await.
  function gmailAuthorize(){
    if(gmail.token && Date.now() < gmail.expires) return Promise.resolve();
    return new Promise((resolve, reject)=>{
      gmail.waiter = { resolve, reject };
      gmail.client.requestAccessToken({ prompt: "" });
    }).then(r => {
      if(!google.accounts.oauth2.hasGrantedAllScopes(r, GMAIL_SCOPE)) throw U.err("auth", "Contrail needs permission to read your Gmail to find airline emails.");
      gmail.token = r.access_token;
      gmail.expires = Date.now() + (Number(r.expires_in) || 3600) * 1000 - 60000;
    });
  }

  async function gapi(path, tries = 0){
    const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/" + path, { headers: { Authorization: "Bearer " + gmail.token } });
    if(r.status === 401){ gmail.token = null; throw U.err("auth", "Gmail access expired. Start the import again."); }
    let rateLimited = r.status === 429 || r.status >= 500;
    if(r.status === 403){
      // Gmail answers 403 (not 429) for "too many concurrent requests" and per-user rate limits.
      const j = await r.clone().json().catch(()=>({}));
      const reason = ((j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason) || "") + " " + ((j.error && j.error.message) || "");
      rateLimited = /rateLimit|concurrent|quota/i.test(reason);
    }
    if(rateLimited && tries < 5){ await sleep(600 * Math.pow(2, tries) + Math.random() * 400); return gapi(path, tries + 1); }
    if(!r.ok) throw U.err("http", "Gmail returned an error (" + r.status + ").");
    return r.json();
  }

  function decodeB64url(data){
    const bin = atob(data.replace(/-/g, "+").replace(/_/g, "/"));
    return new TextDecoder("utf-8").decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  }
  function gmailText(payload){
    let plain = "", html = "";
    (function walk(p){
      if(!p) return;
      if(p.body && p.body.data){
        if(p.mimeType === "text/plain") plain += decodeB64url(p.body.data) + "\n";
        else if(p.mimeType === "text/html") html += decodeB64url(p.body.data) + "\n";
      }
      (p.parts || []).forEach(walk);
    })(payload);
    return html || plain; // airline HTML keeps the itinerary layout; app.js strips the tags
  }

  async function scanGmail(years, progress){
    const after = since(years);
    const q = "(flight OR flights OR airline) {" + TERMS.map(t => t.includes(" ") ? '"' + t + '"' : t).join(" ") + "}" +
              " after:" + after.getFullYear() + "/" + (after.getMonth() + 1) + "/" + after.getDate() +
              " -in:spam -in:trash -category:promotions -category:social"; // skip fare sales and newsletters
    progress("Searching Gmail…");
    const ids = []; let page = "";
    do{
      const r = await gapi("messages?maxResults=100&q=" + encodeURIComponent(q) + (page ? "&pageToken=" + page : ""));
      (r.messages || []).forEach(m => ids.push(m.id));
      page = r.nextPageToken || "";
      progress("Searching Gmail… " + ids.length + " matching emails");
    }while(page && ids.length < MAX_EMAILS);
    const list = ids.slice(0, MAX_EMAILS);
    return pool(list, async id => {
      const m = await gapi("messages/" + id + "?format=full");
      const subject = ((m.payload && m.payload.headers) || []).find(h => h.name.toLowerCase() === "subject");
      return { date: new Date(Number(m.internalDate)), subject: subject ? subject.value : "", text: gmailText(m.payload) };
    }, n => progress("Reading Gmail… " + n + " of " + list.length + " emails"));
  }

  // ---------- Outlook / Microsoft 365 ----------
  const outlookOn = !!(CFG.microsoft && CFG.microsoft.clientId && CFG.microsoft.mailImport !== false);
  const outlook = window.ContrailMsAuth && window.ContrailMsAuth.session({
    purpose: "mail",
    scopes: "openid profile offline_access User.Read Mail.Read",
    storage: sessionStorage, // mail access ends when the browser session does
    tokensKey: "contrail.msmail.tokens",
    userKey: "contrail.msmail.user"
  });

  async function scanOutlook(years, progress){
    const after = since(years);
    // Outlook search (KQL). Graph doesn't allow a date $filter together with $search, so the date goes in the query.
    const kql = "(flight OR airline) AND (" + TERMS.map(t => '\\"' + t + '\\"').join(" OR ") + ") AND received>=" + after.toISOString().slice(0, 10);
    let url = "/me/messages?$top=50&$select=subject,receivedDateTime,body&$search=" + encodeURIComponent('"' + kql + '"');
    const out = [];
    progress("Searching Outlook…");
    while(url && out.length < MAX_EMAILS){
      const r = await outlook.graph(url, { headers: { Prefer: 'outlook.body-content-type="html"' } });
      if(r.status === 429){ await sleep(Number(r.headers.get("Retry-After") || 2) * 1000); continue; }
      if(!r.ok) throw U.err("http", "Outlook returned an error (" + r.status + ").");
      const j = await r.json();
      (j.value || []).forEach(m => {
        const date = new Date(m.receivedDateTime);
        if(date >= after) out.push({ date, subject: m.subject || "", text: (m.body && m.body.content) || "" });
      });
      url = j["@odata.nextLink"] || "";
      progress("Reading Outlook… " + out.length + " emails");
    }
    return out.slice(0, MAX_EMAILS);
  }

  // ---------- shared flow ----------
  let busy = false, lastImport = [];
  function setBusy(on){
    busy = on;
    ["scanGmail", "scanOutlook", "mailRange"].forEach(id => { const el = $(id); if(el) el.disabled = on; });
  }
  function say(text, isErr){ const m = $("mailMsg"); m.textContent = text; m.classList.toggle("err", !!isErr); }
  function sayWithUndo(text){
    const m = $("mailMsg"); m.classList.remove("err"); m.textContent = text + " ";
    const b = document.createElement("button");
    b.className = "btn quiet"; b.type = "button"; b.textContent = "Undo";
    b.addEventListener("click", () => {
      App.removeFlights(lastImport);
      say("Removed the " + lastImport.length + " imported " + (lastImport.length === 1 ? "flight" : "flights") + ".");
      lastImport = [];
    });
    m.appendChild(b);
  }

  async function scan(source, years){
    setBusy(true);
    const label = source === "gmail" ? "Gmail" : "Outlook";
    try{
      const emails = source === "gmail" ? await scanGmail(years, say) : await scanOutlook(years, say);
      say("Finding flights in " + emails.length + " emails…");
      await sleep(0);
      const seen = new Set(), found = [];
      emails.sort((a, b) => b.date - a.date).forEach(m => {
        let flights = [];
        try{ flights = App.parseEmails(m.text, m.date); }catch(_){}
        flights.forEach(f => {
          const k = App.keyOf(f);
          if(seen.has(k)) return;
          seen.add(k);
          found.push(Object.assign(f, { src: m.subject || "(no subject)" }));
        });
      });
      const flights = App.dropNumberless(found).sort((a, b) => b.date.localeCompare(a.date));
      const unread = emails.failed ? " " + emails.failed + " " + (emails.failed === 1 ? "email" : "emails") + " couldn't be read; run the import again to retry them." : "";
      const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");

      if(CFG.autoAddImported === false){
        say("");
        App.reviewCandidates(flights, flights.length
          ? "Found " + plural(flights.length, "flight") + " in " + plural(emails.length, label + " email") + ". Check the list, then add." + unread
          : "Looked through " + plural(emails.length, label + " email") + " and didn't find any flights." + unread);
        return;
      }
      // Flights already flown go straight into the log; upcoming ones wait until they've happened.
      const today = new Date().toISOString().slice(0, 10);
      const past = flights.filter(f => f.date <= today), upcoming = flights.filter(f => f.date > today);
      const result = App.addImported(past);
      lastImport = result.ids;
      const added = result.ids.length;
      const summary = (added ? "Added " + plural(added, "flight") : "No new flights") + " from " + plural(emails.length, label + " email") +
        (result.already ? " (" + result.already + " already in your log)" : "") + "." + unread;
      added ? sayWithUndo(summary) : say(summary);
      App.reviewCandidates(upcoming, upcoming.length
        ? plural(upcoming.length, "upcoming flight") + " found. Tick any you want to add now, or import again after you fly."
        : "");
    }catch(e){
      if(e && e.code === "cancelled") say("");
      else say((e && e.message) || "The import stopped. Try again.", true);
    }finally{
      setBusy(false);
    }
  }

  const years = () => Number($("mailRange").value) || 2;

  if(gmailOn || outlookOn){
    $("inbox").hidden = false;
    $("inboxOr").hidden = false;
  }
  if(gmailOn){
    const b = $("scanGmail");
    b.hidden = false; b.disabled = true;
    gmailSetup().then(()=>{ b.disabled = busy; }, ()=>{ say("Gmail import couldn't load. Check your connection and reload.", true); });
    b.addEventListener("click", ()=>{
      if(busy || !gmail.client) return;
      const y = years();
      say("Waiting for Google…");
      gmailAuthorize().then(()=>scan("gmail", y), e => say(e && e.code === "cancelled" ? "" : (e && e.message) || "Google sign-in failed.", !(e && e.code === "cancelled")));
    });
  }
  if(outlookOn && outlook){
    const b = $("scanOutlook");
    b.hidden = false;
    outlook.configure(CFG.microsoft);
    // Back from Microsoft's sign-in page? Pick up the scan the user started.
    outlook.handleRedirect().then(back => {
      if(back && back.resume && back.resume.source === "outlook"){
        $("mailRange").value = String(back.resume.years);
        scan("outlook", back.resume.years);
      }
    }, e => say(e && e.code === "cancelled" ? "" : (e && e.message) || "Microsoft sign-in failed.", !(e && e.code === "cancelled")));
    b.addEventListener("click", async ()=>{
      if(busy) return;
      const y = years();
      if(outlook.hasTokens()){
        try{ await outlook.accessToken(); return scan("outlook", y); }catch(_){}
      }
      say("Taking you to Microsoft to allow mail access…");
      outlook.signIn({ source: "outlook", years: y });
    });
  }
})();
