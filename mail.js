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

  // Most emails one import will read. Each email is checked for flights as soon as it arrives and
  // then dropped, so a large import doesn't hold thousands of emails in memory.
  const MAX_EMAILS = Number(CFG.maxEmailsPerImport) || 5000;
  const CONCURRENCY = 3; // Gmail refuses too many simultaneous requests from one user
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const yearsAgo = years => { const d = new Date(); d.setFullYear(d.getFullYear() - years); return d; };
  const LAST_KEY = source => "contrail.mail.last." + source; // when the last complete import of this inbox ran

  // range: a number of years, or "since" for emails newer than the last complete import.
  function startDate(source, range){
    if(range === "since"){
      let last = null; try{ last = Number(localStorage.getItem(LAST_KEY(source))) || null; }catch(_){}
      if(last) return new Date(last - 3 * 864e5); // a few days of overlap; duplicates are skipped anyway
      return yearsAgo(5); // first import from this inbox
    }
    return yearsAgo(Number(range) || 2);
  }

  // Search terms airlines and travel agencies use in booking, check-in and receipt emails.
  const TERMS = ["boarding pass", "itinerary", "e-ticket", "eticket", "flight confirmation", "confirmation code",
                 "record locator", "trip confirmation", "your flight", "flight receipt", "check in for your flight",
                 "flight details", "reservation details", "reservation number", "booking reference", "booking confirmation"];

  // Runs worker over items a few at a time until done or the job is stopped. Counts failures on the job.
  async function pool(items, worker, job, onEach){
    let next = 0, done = 0;
    async function run(){
      while(next < items.length && !job.stopped){
        const item = items[next++];
        try{ await worker(item); }catch(e){ if(e && e.code === "auth") throw e; if(!job.stopped) job.failed++; }
        onEach(++done);
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, run));
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

  // Gmail allows each user 6,000 "units" per minute, and reading one email costs 5, so at most
  // ~1,200 emails a minute across every app and tab. Contrail paces itself under that (about 13
  // emails a second, leaving room for searches and other apps). If Gmail still says to slow down,
  // every request pauses together until the minute rolls over instead of giving up.
  const GMAIL_GAP_MS = 75;
  let nextSlot = 0, pausedUntil = 0;
  const gmailStatus = { onPause: null, stopped: false };
  async function waitTurn(){
    for(;;){
      if(gmailStatus.stopped) throw U.err("stopped", "Stopped.");
      const now = Date.now();
      if(pausedUntil > now){ await sleep(Math.min(500, pausedUntil - now)); continue; } // short naps so Stop is instant
      if(nextSlot > now){ const wait = nextSlot - now; nextSlot += GMAIL_GAP_MS; await sleep(wait); return; }
      nextSlot = now + GMAIL_GAP_MS; return;
    }
  }

  async function gapi(path, tries = 0){
    await waitTurn();
    const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/" + path, { headers: { Authorization: "Bearer " + gmail.token } });
    if(r.status === 401){ gmail.token = null; throw U.err("auth", "Gmail access expired. Start the import again."); }
    let rateLimited = r.status === 429 || r.status >= 500;
    if(r.status === 403){
      // Gmail answers 403 (not 429) for per-minute quotas and "too many concurrent requests".
      const j = await r.clone().json().catch(()=>({}));
      const reason = ((j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason) || "") + " " + ((j.error && j.error.message) || "");
      rateLimited = /rateLimit|concurrent|quota/i.test(reason);
    }
    if(rateLimited && tries < 8){
      // Back off for everyone: 5s, 10s, 20s… capped at a minute, which always clears a per-minute quota.
      const wait = Math.min(60000, 5000 * Math.pow(2, tries)) + Math.random() * 1000;
      if(Date.now() + wait > pausedUntil){ pausedUntil = Date.now() + wait; if(gmailStatus.onPause) gmailStatus.onPause(wait); }
      return gapi(path, tries + 1);
    }
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

  // Reads matching emails and hands each one to job.consume(). Returns how many were read.
  async function scanGmail(after, job, progress){
    gmailStatus.stopped = false; pausedUntil = 0;
    const q = "(flight OR flights OR airline) {" + TERMS.map(t => t.includes(" ") ? '"' + t + '"' : t).join(" ") + "}" +
              " after:" + after.getFullYear() + "/" + (after.getMonth() + 1) + "/" + after.getDate() +
              " -in:spam -in:trash -category:promotions -category:social"; // skip fare sales and newsletters
    progress("Searching Gmail…");
    const ids = []; let page = "";
    do{
      const r = await gapi("messages?maxResults=500&q=" + encodeURIComponent(q) + (page ? "&pageToken=" + page : ""));
      (r.messages || []).forEach(m => ids.push(m.id));
      page = r.nextPageToken || "";
      progress("Searching Gmail… " + ids.length + " matching emails");
    }while(page && ids.length < MAX_EMAILS && !job.stopped);
    const list = ids.slice(0, MAX_EMAILS);
    job.capped = !!page || ids.length > MAX_EMAILS;
    let read = 0, pauseNote = "", lastN = 0;
    const show = () => progress("Reading Gmail… " + lastN + " of " + list.length + " emails · " + job.found.length + " flights so far" + pauseNote);
    gmailStatus.onPause = wait => {
      pauseNote = " · Gmail asked Contrail to slow down, resuming in " + Math.ceil(wait / 1000) + "s";
      show();
      setTimeout(() => { pauseNote = ""; }, wait);
    };
    await pool(list, async id => {
      const m = await gapi("messages/" + id + "?format=full");
      const subject = ((m.payload && m.payload.headers) || []).find(h => h.name.toLowerCase() === "subject");
      job.consume({ date: new Date(Number(m.internalDate)), subject: subject ? subject.value : "", text: gmailText(m.payload) });
      read++;
    }, job, n => { lastN = n; show(); });
    gmailStatus.onPause = null;
    return read;
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

  async function scanOutlook(after, job, progress){
    // Outlook search (KQL). Graph doesn't allow a date $filter together with $search, so the date goes in the query.
    const kql = "(flight OR airline) AND (" + TERMS.map(t => '\\"' + t + '\\"').join(" OR ") + ") AND received>=" + after.toISOString().slice(0, 10);
    let url = "/me/messages?$top=50&$select=subject,receivedDateTime,body&$search=" + encodeURIComponent('"' + kql + '"');
    let read = 0;
    progress("Searching Outlook…");
    while(url && read < MAX_EMAILS && !job.stopped){
      const r = await outlook.graph(url, { headers: { Prefer: 'outlook.body-content-type="html"' } });
      if(r.status === 429 || r.status === 503){ await sleep(Number(r.headers.get("Retry-After") || 2) * 1000); continue; }
      if(!r.ok) throw U.err("http", "Outlook returned an error (" + r.status + ").");
      const j = await r.json();
      (j.value || []).forEach(m => {
        const date = new Date(m.receivedDateTime);
        if(date >= after && read < MAX_EMAILS){ job.consume({ date, subject: m.subject || "", text: (m.body && m.body.content) || "" }); read++; }
      });
      url = j["@odata.nextLink"] || "";
      progress("Reading Outlook… " + read + " emails · " + job.found.length + " flights so far");
    }
    job.capped = !!url && read >= MAX_EMAILS;
    return read;
  }

  // ---------- shared flow ----------
  let busy = false, lastImport = [], job = null;
  function setBusy(on){
    busy = on;
    ["scanGmail", "scanOutlook", "mailRange"].forEach(id => { const el = $(id); if(el) el.disabled = on; });
    $("scanStop").hidden = !on;
    $("scanStop").disabled = false;
  }
  $("scanStop").addEventListener("click", () => {
    if(!job) return;
    job.stopped = true;
    gmailStatus.stopped = true;
    $("scanStop").disabled = true;
    say("Stopping… adding the flights found so far.");
  });
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

  async function scan(source, range){
    setBusy(true);
    const label = source === "gmail" ? "Gmail" : "Outlook";
    const startedAt = Date.now();
    const seen = new Set();
    job = { stopped: false, failed: 0, capped: false, found: [],
      // Each email is parsed the moment it's read; only the flights are kept.
      consume(m){
        let flights = [];
        try{ flights = App.parseEmails(m.text, m.date, { requireNumber: true }); }catch(_){}
        flights.forEach(f => {
          const k = App.keyOf(f);
          if(seen.has(k)) return;
          seen.add(k);
          job.found.push(Object.assign(f, { src: m.subject || "(no subject)" }));
        });
      }
    };
    try{
      const after = startDate(source, range);
      const read = source === "gmail" ? await scanGmail(after, job, say) : await scanOutlook(after, job, say);
      const emails = { length: read };
      // Remember a complete import so "New since last import" can pick up from here next time.
      if(!job.stopped && !job.failed){ try{ localStorage.setItem(LAST_KEY(source), String(startedAt)); }catch(_){} }
      const flights = App.dropNumberless(job.found).sort((a, b) => b.date.localeCompare(a.date));
      const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");
      const unread = (job.failed ? " " + plural(job.failed, "email") + " couldn't be read; run the import again to retry them." : "") +
        (job.stopped ? " Stopped early; import again to read the rest." : "") +
        (job.capped ? " That's the most one import reads (" + MAX_EMAILS.toLocaleString() + " emails), so the oldest matches were skipped." : "");

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
        (result.already ? " (" + result.already + " already in your log)" : "") + "." +
        (result.filled ? " Added the aircraft to " + plural(result.filled, "flight") + " already in your log." : "") + unread;
      added ? sayWithUndo(summary) : say(summary);
      App.reviewCandidates(upcoming, upcoming.length
        ? plural(upcoming.length, "upcoming flight") + " found. Tick any you want to add now, or import again after you fly."
        : "");
    }catch(e){
      if(e && e.code === "cancelled") say("");
      else if(e && e.code === "stopped") say("Stopped before any emails were read.");
      else say((e && e.message) || "The import stopped. Try again.", true);
    }finally{
      job = null;
      setBusy(false);
    }
  }

  const years = () => $("mailRange").value;

  if(gmailOn || outlookOn){
    $("inbox").hidden = false;
    $("inboxOr").hidden = false;
    // After a first complete import, default to reading only newer emails.
    let hasLast = false; try{ hasLast = !!(localStorage.getItem(LAST_KEY("gmail")) || localStorage.getItem(LAST_KEY("outlook"))); }catch(_){}
    $("mailRange").value = hasLast ? "since" : "2";
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
        if(location.hash !== "#add") location.hash = "add"; // results appear on the Add flights tab
        $("mailRange").value = String(back.resume.years);
        if(!$("mailRange").value) $("mailRange").value = "2";
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
