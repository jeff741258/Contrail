// Space page (#space): your total distance flown, measured against how far things are from Earth.
// The ladder is on a log scale: each step up is ten times farther, so the space station, the Moon
// and Neptune all fit on one screen. Planet distances are at their closest approach to Earth.
(function(){
  "use strict";
  const App = window.ContrailApp;
  const $ = id => document.getElementById(id);
  const PLACES = [
    { name: "International Space Station", short: "Space station", km: 408, color: "#E8EEF8", r: 3, note: "Its orbit, straight up" },
    { name: "The Moon", short: "Moon", km: 384400, color: "#C9CED8", r: 6 },
    { name: "Venus", short: "Venus", km: 38.2e6, color: "#E9D19B", r: 7, note: "At its closest" },
    { name: "Mars", short: "Mars", km: 54.6e6, color: "#E07A4F", r: 6, note: "At its closest" },
    { name: "Mercury", short: "Mercury", km: 77.3e6, color: "#B8AFA6", r: 5, note: "At its closest" },
    { name: "The Sun", short: "Sun", km: 149.6e6, color: "#FFC94D", r: 11 },
    { name: "Jupiter", short: "Jupiter", km: 588e6, color: "#D9B38C", r: 10, note: "At its closest" },
    { name: "Saturn", short: "Saturn", km: 1.2e9, color: "#E6CF8B", r: 9, note: "At its closest" },
    { name: "Uranus", short: "Uranus", km: 2.6e9, color: "#9FD8E0", r: 8, note: "At its closest" },
    { name: "Neptune", short: "Neptune", km: 4.3e9, color: "#6E8FEA", r: 8, note: "At its closest" }
  ];
  const MIN = 100, MAX = 6e9; // km, bottom and top of the ladder
  const lg = Math.log10;
  const pos = km => (lg(Math.max(MIN, km)) - lg(MIN)) / (lg(MAX) - lg(MIN)); // 0 = Earth, 1 = top

  function big(km){
    const d = App.unit() === "mi" ? km * 0.621371 : km, u = App.unit();
    if(d >= 1e9) return (d / 1e9).toFixed(1) + " billion " + u;
    if(d >= 1e6) return (d / 1e6).toFixed(1) + " million " + u;
    return Math.round(d).toLocaleString() + " " + u;
  }
  function status(total, p){
    if(total >= p.km){
      const n = total / p.km;
      return { done: true, text: n >= 1.05 ? "Reached " + (n >= 100 ? Math.floor(n).toLocaleString() : n.toFixed(1)) + "×" : "Reached" };
    }
    const pct = total / p.km * 100;
    return { done: false, text: (pct >= 1 ? pct.toFixed(1) : pct.toFixed(pct >= 0.01 ? 2 : 4)) + "% of the way", pct };
  }

  function render(){
    const total = App.totalKm();
    const next = PLACES.find(p => p.km > total);
    const reached = PLACES.filter(p => p.km <= total);
    $("spTotal").textContent = big(total);
    $("spLead").textContent =
      (App.isExample() ? "Example log: " : "") +
      (reached.length ? "Past " + reached[reached.length - 1].name.replace(/^The /, "the ") : "Not yet at the space station") +
      (next ? ". Next stop: " + next.name.replace(/^The /, "the ") + ", " + status(total, next).text + "." : ". Beyond Neptune!");

    // ladder
    const L = $("spLadder");
    const H = L.clientHeight || 560;
    const you = pos(total);
    let html = '<div class="sp-track"></div><div class="sp-trail" style="height:' + (you * 100).toFixed(2) + '%"></div>';
    // round marks in the chosen unit: 1K, 10K … 1B miles or km
    const toKm = v => App.unit() === "mi" ? v / 0.621371 : v;
    const short = e => ["1K", "10K", "100K", "1M", "10M", "100M", "1B"][e - 3] + " " + App.unit();
    for(let e = 3; e <= 9; e++){
      const p = pos(toKm(Math.pow(10, e)));
      if(p > 0.99) continue;
      html += '<div class="sp-tick" style="bottom:' + (p * 100).toFixed(2) + '%"><span>' + short(e) + '</span></div>';
    }
    // dots at their true heights; labels nudged apart so neighbours don't overlap
    const GAP = 15; let last = -1e9;
    PLACES.forEach(p => {
      const st = status(total, p), y = pos(p.km) * H;
      const ly = Math.max(y, last + GAP); last = ly;
      html += '<div class="sp-body' + (st.done ? " done" : "") + '" style="bottom:' + y.toFixed(1) + 'px">' +
        '<i style="width:' + p.r * 2 + 'px;height:' + p.r * 2 + 'px;background:' + p.color + '"></i></div>' +
        '<div class="sp-lab' + (st.done ? " done" : "") + '" style="bottom:' + ly.toFixed(1) + 'px">' + p.short + '</div>';
    });
    html += '<div class="sp-earth"><i></i><span>Earth</span></div>';
    html += '<div class="sp-you" style="bottom:' + (you * 100).toFixed(2) + '%"><span>You · ' + big(total) + '</span></div>';
    L.innerHTML = html;

    // milestones
    $("spList").innerHTML = PLACES.map(p => {
      const st = status(total, p);
      return '<li class="' + (st.done ? "done" : "") + '"><i style="background:' + p.color + '"></i>' +
        '<div class="sp-name"><b>' + p.name + '</b><span>' + big(p.km) + (p.note ? " · " + p.note.toLowerCase() : "") + '</span></div>' +
        '<div class="sp-st">' + st.text + (st.done ? "" : '<span class="sp-bar"><span style="width:' + Math.max(1.5, st.pct).toFixed(2) + '%"></span></span>') + '</div></li>';
    }).join("");
  }

  function maybeRender(){ if(location.hash === "#space") render(); }
  addEventListener("hashchange", maybeRender);
  // stay current if flights or units change while the page is open
  document.getElementById("u-mi").addEventListener("click", maybeRender);
  document.getElementById("u-km").addEventListener("click", maybeRender);
  maybeRender();
})();
