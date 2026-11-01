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
      const first = fl[0], last = fl[fl.length - 1];
      return '<div class="hg-alcard ' + (caught ? "caught" : "seen") + '">' +
        '<button type="button" class="hg-cover' + (ids.length ? " has" : "") + '" data-k="' + esc(k) + '"' + (ids.length ? ' aria-label="Open photos of ' + esc(label) + '"' : ' tabindex="-1" aria-hidden="true"') + '>' +
          (ids.length ? '<img alt="" data-thumb="' + ids[ids.length - 1] + '">' : '<span class="hg-pic">' + PLANE + '</span>') +
          '<span class="hg-badge">' + (caught ? "Caught" : "Seen") + '</span>' +
          (ids.length ? '<span class="hg-pcount">' + ids.length + (ids.length === 1 ? " photo" : " photos") + '</span>' : "") +
        '</button>' +
        '<div class="hg-albody"><b class="hg-alname">' + esc(name) + '</b>' +
          '<span class="hg-alsub">' + (code ? code + " · " : "") + fl.length + (fl.length === 1 ? " flight" : " flights") + '</span>' +
          '<span class="hg-alsub">' + (fl.length === 1 ? fmt(first.date) + " · " + first.from + " → " + first.to : "First " + fmt(first.date) + " · last " + fmt(last.date)) + '</span>' +
          (PH() ? PH().drawer(k, ids, label) : "") +
        '</div></div>';
    }).join("");
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
    const cov = e.target.closest(".hg-cover.has");
    if(cov && PH()){ const ids = App.photosFor(cov.dataset.k); PH().open(ids, ids.length - 1, cov.closest(".hg-alcard").querySelector(".hg-alname").textContent + " · " + detail); }
  });
  const visible = () => location.hash === "#hangar";
  addEventListener("hashchange", () => { if(visible()){ detail = null; render(); } });
  window.ContrailHangar = { refresh(){ if(visible()) render(); } };
  if(visible()) render();
})();
