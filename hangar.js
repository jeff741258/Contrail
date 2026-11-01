// Hangar (#hangar): collect aircraft types like trading cards.
// A type is CAUGHT only when an email imported from Gmail or Outlook names it on a flight you've
// already taken. Types you typed in yourself, or pasted, show as SEEN until an email confirms them.
(function(){
  "use strict";
  const App = window.ContrailApp;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const TIERS = [
    { id: "legendary", label: "Legendary", rx: /A380|747/ },
    { id: "epic", label: "Epic", rx: /A350|787|777|A340/ },
    { id: "rare", label: "Rare", rx: /A330|767|757|A220|A318/ },
    { id: "uncommon", label: "Uncommon", rx: /Embraer|CRJ|Dash|ATR|717/ },
    { id: "common", label: "Common", rx: /./ }
  ];
  const tierOf = name => TIERS.find(t => t.rx.test(name));
  const maker = name => /^De Havilland/.test(name) ? "De Havilland" : name.split(" ")[0];
  const MAKERS = ["Airbus", "Boeing", "Embraer", "Bombardier", "De Havilland", "ATR"];
  const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true });
  let filter = "all";
  try{ filter = localStorage.getItem("contrail.hangarFilter") || "all"; }catch(_){}

  const PLANE = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 4c2.2 0 3.4 2.6 3.4 6v13.5l22.6 13v5.2l-22.6-6.9v12.4l6.4 5v4.3L32 53.3l-9.8 3.2v-4.3l6.4-5V34.8L6 41.7v-5.2l22.6-13V10c0-3.4 1.2-6 3.4-6Z"/></svg>';
  const fmt = iso => { const [y, m, d] = iso.split("-"); return new Date(+y, +m - 1, +d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); };

  // airlines you've flown this type with, most flights first: [{code, name, n}]
  function tally(list){
    const n = {}; list.forEach(f => { if(f.airline) n[f.airline] = (n[f.airline] || 0) + 1; });
    return Object.entries(n).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([code, k]) => ({ code, name: App.airlineName(code), n: k }));
  }
  function airlines(c){
    if(!c.airlines.length) return "";
    const top = c.airlines.slice(0, 3), more = c.airlines.length - top.length;
    return '<span class="hg-als">' + top.map(a => '<span class="hg-alc" title="' + esc(a.name) + ' (' + a.code + ')"><b>' + esc(a.name) + '</b><i>×' + a.n + '</i></span>').join("") +
      (more > 0 ? '<span class="hg-alm">+' + more + ' more</span>' : "") + '</span>';
  }
  function build(){
    const today = new Date(), iso = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    const flown = App.flights().filter(f => f.ac && f.date <= iso); // only flights you've actually taken
    const by = {};
    flown.forEach(f => {
      const t = by[f.ac] || (by[f.ac] = { caught: [], seen: [] });
      (f.acv ? t.caught : t.seen).push(f);
    });
    const names = [...new Set(App.acList().concat(Object.keys(by)))];
    names.sort((a, b) => {
      const ma = MAKERS.indexOf(maker(a)), mb = MAKERS.indexOf(maker(b));
      return (ma < 0 ? 99 : ma) - (mb < 0 ? 99 : mb) || natural(a, b);
    });
    return names.map((name, i) => {
      const t = by[name] || { caught: [], seen: [] };
      const list = t.caught.concat(t.seen);
      const all = t.caught.concat(t.seen).sort((a, b) => a.date.localeCompare(b.date));
      const first = t.caught.slice().sort((a, b) => a.date.localeCompare(b.date))[0];
      return { no: i + 1, name, maker: maker(name), tier: tierOf(name), state: t.caught.length ? "caught" : t.seen.length ? "seen" : "missing",
        caught: t.caught.length, flights: all.length, first, airlines: tally(all), list };
    });
  }

  function card(c){
    const no = "#" + String(c.no).padStart(3, "0");
    let body;
    if(c.state === "caught"){
      const f = c.first;
      body = '<span class="hg-st">Caught · ' + c.flights + (c.flights === 1 ? " flight" : " flights") + '</span>' +
        '<span class="hg-sub">First caught ' + fmt(f.date) + ' · ' + f.from + ' → ' + f.to + (f.airline ? " · " + esc(f.airline + " " + f.num) : "") + '</span>' + airlines(c);
    }else if(c.state === "seen"){
      body = '<span class="hg-st">Seen · ' + c.flights + (c.flights === 1 ? " flight" : " flights") + '</span>' +
        '<span class="hg-sub">Added by hand. Import an email that names it to catch it.</span>' + airlines(c);
    }else{
      body = '<span class="hg-st">Not caught yet</span>';
    }
    const tag = c.state === "missing" ? "div" : "a";
    return '<' + tag + ' class="hg-card ' + c.state + ' t-' + c.tier.id + '"' + (tag === "a" ? ' href="#log" data-ac="' + esc(c.name) + '" aria-label="' + esc(c.name) + ': see airlines and photos"' : "") + '>' +
      '<span class="hg-top"><span class="hg-no">' + no + '</span><span class="hg-tier">' + c.tier.label + '</span></span>' +
      '<span class="hg-pic">' + PLANE + '</span>' +
      '<b class="hg-name">' + esc(c.name) + '</b>' + body + '</' + tag + '>';
  }

  // ---------- one aircraft: a square per airline you've flown it with, each with its own photos ----------
  let detail = null; // aircraft name being shown, or null for the whole collection
  const PH = () => window.ContrailPhotos;
  function airlineCards(c){
    const g = {};
    c.list.forEach(f => { const k = f.airline || ""; (g[k] = g[k] || []).push(f); });
    return Object.entries(g).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).map(([code, fl]) => {
      fl.sort((a, b) => a.date.localeCompare(b.date));
      const caught = fl.some(f => f.acv), name = code ? App.airlineName(code) : "Airline not known";
      const k = "ac:" + c.name + "|" + code, ids = App.photosFor(k), label = c.name + (code ? " · " + name : "");
      const regs = App.regsFor(k);
      // cover: newest general photo, or else the newest photo of one of its registrations
      const regPics = regs.flatMap(r => App.photosFor(k + "|" + r.reg));
      const coverIds = ids.length ? ids : regPics, coverK = ids.length ? k : "";
      const first = fl[0], last = fl[fl.length - 1];
      return '<div class="hg-alcard ' + (caught ? "caught" : "seen") + '">' +
        '<button type="button" class="hg-cover' + (coverIds.length ? " has" : "") + '" data-k="' + esc(coverK || k) + '"' + (coverK ? "" : ' data-reg="1"') + (coverIds.length ? ' aria-label="Open photos of ' + esc(label) + '"' : ' tabindex="-1" aria-hidden="true"') + '>' +
          (coverIds.length ? '<img alt="" data-thumb="' + coverIds[coverIds.length - 1] + '">' : '<span class="hg-pic">' + PLANE + '</span>') +
          '<span class="hg-badge">' + (caught ? "Caught" : "Seen") + '</span>' +
          (ids.length ? '<span class="hg-pcount">' + ids.length + (ids.length === 1 ? " photo" : " photos") + '</span>' : "") +
        '</button>' +
        '<div class="hg-albody"><a class="hg-allink" href="#log" data-al="' + esc(code || "-") + '" aria-label="Show your ' + esc(c.name) + ' flights with ' + esc(name) + ' in the flight log">' +
          '<b class="hg-alname">' + esc(name) + ' <span class="go">›</span></b>' +
          '<span class="hg-alsub">' + (code ? code + " · " : "") + fl.length + (fl.length === 1 ? " flight" : " flights") + '</span>' +
          '<span class="hg-alsub">' + (fl.length === 1 ? fmt(first.date) + " · " + first.from + " → " + first.to : "First " + fmt(first.date) + " · last " + fmt(last.date)) + '</span></a>' +
          regBlock(k, regs, label, caught) +
          (PH() ? PH().drawer(k, ids, label) : "") +
        '</div></div>';
    }).join("");
  }
  // registrations (tail numbers) for one aircraft + airline, each with a photo slot beside it
  function regBlock(k, regs, label, caught){
    const rows = regs.map(r => {
      const rk = k + "|" + r.reg, pics = App.photosFor(rk);
      return '<div class="legph hg-reg" data-k="' + esc(rk) + '">' +
        '<span class="hg-regpics">' + pics.map((id, i) => '<button type="button" class="pth" data-photo="' + id + '" aria-label="Open photo ' + (i + 1) + ' of ' + r.reg + '"><img alt="" data-thumb="' + id + '"></button>').join("") +
          '<label class="hg-regadd" title="Add a photo of ' + esc(r.reg) + '">' + (pics.length ? "+" : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/></svg>') +
          '<input type="file" accept="image/*" multiple data-k="' + esc(rk) + '" aria-label="Add a photo of ' + esc(r.reg) + '"></label></span>' +
        '<b class="hg-regno">' + esc(r.reg) + '</b>' +
        // a share card once there's a photo; it says "caught" only when an email confirmed the type with this airline
        (pics.length ? (caught ? '<button type="button" class="hg-share" data-rk="' + esc(rk) + '" aria-label="Share ' + esc(r.reg) + ' as a caught card"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v7h14v-7"/></svg>Share</button>'
          : '<span class="hg-lock" title="Import an email that names this aircraft on a ' + esc(label.split(" · ")[1] || "") + ' flight to catch it and unlock sharing">Seen</span>') : "") +
        '<button type="button" class="hg-regx" data-rid="' + r.id + '" aria-label="Remove ' + esc(r.reg) + '">×</button>' +
        '<p class="phmsg msg" role="status"></p></div>';
    }).join("");
    return '<div class="hg-regs"><span class="hg-regh">Registrations</span>' + rows +
      '<form class="hg-regform" data-k="' + esc(k) + '"><input type="text" maxlength="12" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="e.g. C-FIVM" aria-label="Add a registration for ' + esc(label) + '"><button class="btn" type="submit">Add</button></form>' +
      '<p class="hg-regmsg msg" role="status"></p></div>';
  }
  // ---------- share card: a trading card saying you caught this type, with your photo of the plane ----------
  const TCOL = { legendary: "#E0A021", epic: "#9B6CEB", rare: "#3B82F0", uncommon: "#22A06B", common: "#9AA6BA" };
  async function shareCard(rk, btn){
    const [type, code, reg] = rk.slice(3).split("|");
    const c = build().find(x => x.name === type); if(!c) return;
    const fl = c.list.filter(f => (f.airline || "") === code && f.acv).sort((a, b) => a.date.localeCompare(b.date));
    if(!fl.length) return;
    const ids = App.photosFor(rk), blob = ids.length && PH() ? await PH().getFull(ids[ids.length - 1]) : null;
    const msg = btn.closest(".hg-reg").querySelector(".phmsg");
    if(!blob){ msg.textContent = "This photo is on another device. Sign in to download it first."; return; }
    btn.disabled = true; msg.textContent = "Making your card…";
    try{
      if(document.fonts && document.fonts.ready) await document.fonts.ready;
      const img = await new Promise((res, rej) => { const u = URL.createObjectURL(blob), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); res(i); }; i.onerror = rej; i.src = u; });
      const W = 1080, H = 1350, col = TCOL[c.tier.id], airline = code ? App.airlineName(code) : "", first = fl[0];
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const x = cv.getContext("2d");
      const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
      const FD = css("--f-display"), FB = css("--f-body"), FM = css("--f-mono");
      const rr = (X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
      // card body with a frame in the rarity colour
      x.fillStyle = "#070B14"; x.fillRect(0, 0, W, H);
      const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, col); g.addColorStop(.5, "#FFFFFF"); g.addColorStop(1, col);
      rr(30, 30, W - 60, H - 60, 44); x.fillStyle = g; x.fill();
      rr(44, 44, W - 88, H - 88, 34); const bg = x.createLinearGradient(0, 44, 0, H); bg.addColorStop(0, "#16213A"); bg.addColorStop(1, "#0B1220"); x.fillStyle = bg; x.fill();
      // header
      x.fillStyle = col; x.font = "800 92px " + FD; x.textBaseline = "alphabetic"; x.fillText("CAUGHT!", 92, 160);
      x.textAlign = "right"; x.fillStyle = "#C9D3E6"; x.font = "600 28px " + FM; x.fillText("#" + String(c.no).padStart(3, "0"), W - 92, 112);
      x.fillStyle = col; x.font = "700 26px " + FM; x.fillText(c.tier.label.toUpperCase(), W - 92, 156); x.textAlign = "left";
      // photo, cropped to fill
      const px = 92, py = 196, pw = W - 184, ph = 600;
      x.save(); rr(px, py, pw, ph, 22); x.clip();
      const sc = Math.max(pw / img.width, ph / img.height), dw = img.width * sc, dh = img.height * sc;
      x.drawImage(img, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh); x.restore();
      x.strokeStyle = col; x.lineWidth = 4; rr(px, py, pw, ph, 22); x.stroke();
      // registration on a tag over the photo
      x.font = "700 64px " + FM; const tw = x.measureText(reg).width;
      rr(px + 24, py + ph - 108, tw + 56, 84, 16); x.fillStyle = "rgba(7,11,20,.82)"; x.fill();
      x.fillStyle = "#fff"; x.fillText(reg, px + 52, py + ph - 44);
      // aircraft and airline
      x.fillStyle = "#fff"; x.font = "800 76px " + FD; x.fillText(type.toUpperCase(), 92, 900, W - 184);
      x.fillStyle = "#C9D3E6"; x.font = "600 40px " + FB; x.fillText(airline || "Airline not known", 92, 958, W - 184);
      x.fillStyle = "#8E9BB5"; x.font = "30px " + FB;
      x.fillText("First caught " + fmt(first.date) + "  ·  " + first.from + " → " + first.to + (first.airline ? "  ·  " + first.airline + " " + first.num : ""), 92, 1012, W - 184);
      x.fillText(fl.length + (fl.length === 1 ? " flight" : " flights") + " on this type with " + (airline || "this airline"), 92, 1056, W - 184);
      // confirmation badge
      const badge = "✓  CONFIRMED BY EMAIL"; x.font = "700 26px " + FM; const bw = x.measureText(badge).width + 48;
      rr(92, 1098, bw, 58, 29); x.fillStyle = col; x.fill(); x.fillStyle = "#0B1220"; x.fillText(badge, 116, 1137);
      // footer
      x.fillStyle = "#fff"; x.font = "800 40px " + FD; x.fillText("CONTRAIL", 92, 1240);
      x.fillStyle = "#86A9FF"; x.fillText(".", 92 + x.measureText("CONTRAIL").width, 1240);
      x.textAlign = "right"; x.fillStyle = "#8E9BB5"; x.font = "24px " + FM; x.fillText("Hangar · aircraft collection", W - 92, 1236); x.textAlign = "left";
      const png = await new Promise(r => cv.toBlob(r, "image/png"));
      const name = "contrail-caught-" + reg + ".png", file = new File([png], name, { type: "image/png" });
      const text = "Caught the " + type + (airline ? " with " + airline : "") + " (" + reg + ") ✈️";
      if(navigator.canShare && navigator.canShare({ files: [file] })){
        try{ await navigator.share({ files: [file], title: "Caught: " + type, text }); msg.textContent = ""; }
        catch(e){ msg.textContent = e && e.name === "AbortError" ? "" : "Sharing didn't work, so the card was saved instead."; if(!(e && e.name === "AbortError")) save(png, name); }
      }else{ save(png, name); msg.textContent = "Saved " + name + ". Share it from your downloads."; }
    }catch(e){ msg.textContent = "Couldn't make the card (" + ((e && e.message) || "error") + ")."; }
    finally{ btn.disabled = false; }
  }
  function save(blob, name){
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function renderDetail(c){
    $("hgList").hidden = true; $("hgDetail").hidden = false;
    $("hgDetail").innerHTML = '<button type="button" class="btn quiet hg-back" id="hgBack">‹ All aircraft</button>' +
      '<div class="hg-dhead t-' + c.tier.id + ' ' + c.state + '"><span class="hg-pic">' + PLANE + '</span><div>' +
        '<span class="hg-top"><span class="hg-no">#' + String(c.no).padStart(3, "0") + '</span><span class="hg-tier">' + c.tier.label + '</span></span>' +
        '<h3>' + esc(c.name) + '</h3><span class="hg-dsub">' + (c.state === "caught" ? "Caught" : "Seen") + ' · ' + c.flights + (c.flights === 1 ? " flight" : " flights") +
        ' · ' + c.airlines.length + (c.airlines.length === 1 ? " airline" : " airlines") + '</span></div></div>' +
      '<div class="hg-alcards">' + airlineCards(c) + '</div>';
    if(PH()) PH().hydrate($("hgDetail"));
  }

  function render(){
    if(detail){
      const c = build().find(x => x.name === detail && x.state !== "missing");
      if(c){ renderDetail(c); return; }
      detail = null;
    }
    $("hgList").hidden = false; $("hgDetail").hidden = true;
    const dex = build(), caught = dex.filter(c => c.state === "caught").length, seen = dex.filter(c => c.state === "seen").length;
    $("hgCount").innerHTML = caught + '<small> / ' + dex.length + '</small>';
    $("hgBar").style.width = (caught / dex.length * 100).toFixed(1) + "%";
    $("hgLead").textContent = caught ? (caught === 1 ? "1 type caught" : caught + " types caught") + (seen ? " · " + seen + " seen, waiting for an email" : "") :
      seen ? seen + " seen, waiting for an email to catch them" : "Import your Gmail or Outlook to start catching aircraft.";
    const counts = { all: dex.length, caught, seen, missing: dex.length - caught - seen };
    $("hgFilters").innerHTML = [["all", "All"], ["caught", "Caught"], ["seen", "Seen"], ["missing", "Missing"]].map(([id, l]) =>
      '<button type="button" role="tab" class="ltab" data-f="' + id + '" aria-selected="' + (filter === id) + '">' + l + '<span>' + counts[id] + '</span></button>').join("");
    const shown = dex.filter(c => filter === "all" || c.state === filter);
    const groups = [...new Set(shown.map(c => c.maker))];
    $("hgGrid").innerHTML = shown.length ? groups.map(m => {
      const inG = dex.filter(c => c.maker === m), got = inG.filter(c => c.state === "caught").length;
      return '<div class="hg-group"><div class="hg-gh"><h3>' + esc(m) + '</h3><span>' + got + ' / ' + inG.length + ' caught</span></div>' +
        '<div class="hg-cards">' + shown.filter(c => c.maker === m).map(card).join("") + '</div></div>';
    }).join("") : '<p class="hg-empty">' + (filter === "caught" ? "Nothing caught yet. Import emails from Gmail or Outlook under Add flights." : filter === "seen" ? "No aircraft waiting for confirmation." : "You've caught them all!") + '</p>';
  }

  $("hgFilters").addEventListener("click", e => {
    const b = e.target.closest("[data-f]"); if(!b) return;
    filter = b.dataset.f; try{ localStorage.setItem("contrail.hangarFilter", filter); }catch(_){}
    render();
  });
  $("hgGrid").addEventListener("click", e => {
    const a = e.target.closest("a.hg-card"); if(!a) return;
    e.preventDefault(); detail = a.dataset.ac; render(); scrollTo(0, 0);
    const b = $("hgBack"); if(b) b.focus({ preventScroll: true });
  });
  $("hgDetail").addEventListener("click", e => {
    if(e.target.closest("#hgBack")){ const was = detail; detail = null; render();
      const card = $("hgGrid").querySelector('a.hg-card[data-ac="' + CSS.escape(was) + '"]'); if(card){ card.scrollIntoView({ block: "center" }); card.focus({ preventScroll: true }); } return; }
    // airline name and dates: that aircraft with that airline in the flight log
    const al = e.target.closest(".hg-allink");
    if(al){ e.preventDefault(); App.openLog({ ac: detail, al: al.dataset.al }); return; }
    const sh = e.target.closest(".hg-share");
    if(sh){ shareCard(sh.dataset.rk, sh); return; }
    const x = e.target.closest(".hg-regx");
    if(x){ // two taps: "×" then "Remove?"
      if(x.classList.contains("sure")){ App.removeReg(x.dataset.rid); return; }
      x.classList.add("sure"); x.textContent = "Remove?"; setTimeout(() => { if(x.isConnected){ x.classList.remove("sure"); x.textContent = "×"; } }, 3000); return;
    }
    const cov = e.target.closest(".hg-cover.has");
    if(cov && cov.dataset.reg && PH()){ // cover is a registration photo: show all of this airline's registration photos
      const card = cov.closest(".hg-alcard"), ids = [...card.querySelectorAll(".hg-reg .pth")].map(b => b.dataset.photo);
      PH().open(ids, ids.length - 1, card.querySelector(".hg-alname").firstChild.textContent.trim() + " · " + detail); return;
    }
    if(cov && PH()){ const ids = App.photosFor(cov.dataset.k); PH().open(ids, ids.length - 1, cov.closest(".hg-alcard").querySelector(".hg-alname").textContent + " · " + detail); }
  });
  const visible = () => location.hash === "#hangar";
  $("hgDetail").addEventListener("submit", e => {
    const f = e.target.closest(".hg-regform"); if(!f) return;
    e.preventDefault();
    const inp = f.querySelector("input"), v = inp.value.trim().toUpperCase().replace(/\s+/g, "-"), msg = f.parentNode.querySelector(".hg-regmsg");
    if(!/^[A-Z0-9][A-Z0-9-]{1,11}$/.test(v)){ msg.textContent = "Use letters, numbers and dashes, like C-FIVM or N12345."; msg.classList.add("err"); return; }
    if(!App.addReg(f.dataset.k, v)){ msg.textContent = v + " is already here."; msg.classList.add("err"); return; }
    // the page redraws; put the cursor back in this card's box for the next one
    const sel = '.hg-regform[data-k="' + CSS.escape(f.dataset.k) + '"] input', n = $("hgDetail").querySelector(sel); if(n) n.focus();
  });
  // tapping the Hangar tab while on an aircraft's page goes back to the whole collection
  document.querySelectorAll('.tabnav a[href="#hangar"]').forEach(t => t.addEventListener("click", () => { if(visible() && detail){ detail = null; render(); } }));
  let keep = false; // set by open(): show that aircraft instead of the collection
  addEventListener("hashchange", () => { if(visible()){ if(!keep) detail = null; keep = false; render(); } });
  window.ContrailHangar = { refresh(){ if(visible()) render(); },
    // name: an aircraft type to open straight to its airline page; "" for the whole collection
    open(name){ detail = name || null; if(visible()){ render(); scrollTo(0, 0); } else { keep = true; location.hash = "hangar"; } } };
  if(visible()) render();
})();
