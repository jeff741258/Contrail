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

  // ---------- export: the page as a shareable image ----------
  function exportImage(){
    const total = App.totalKm();
    const W = 1200, H = 1560, k = 2, PAD = 64;
    const cv = document.createElement("canvas"); cv.width = W * k; cv.height = H * k;
    const x = cv.getContext("2d"); x.scale(k, k);
    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const FD = css("--f-display"), FB = css("--f-body"), FM = css("--f-mono");
    // night sky with a fixed scatter of stars (the same every time)
    x.fillStyle = "#070B14"; x.fillRect(0, 0, W, H);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for(let i = 0; i < 260; i++){ x.globalAlpha = .15 + rnd() * .55; x.fillStyle = "#E9EEF7"; x.beginPath(); x.arc(rnd() * W, rnd() * H, rnd() * 1.3 + .2, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    // header
    x.fillStyle = "#fff"; x.font = "800 22px " + FD; x.fillText("CONTRAIL", PAD, PAD + 18);
    x.fillStyle = "#86A9FF"; x.fillText(".", PAD + x.measureText("CONTRAIL").width, PAD + 18);
    x.fillStyle = "#8E9BB5"; x.font = "600 13px " + FM; x.fillText("TOTAL DISTANCE FLOWN", PAD, PAD + 70);
    x.fillStyle = "#fff"; x.font = "800 84px " + FD; x.fillText(big(total), PAD, PAD + 150, W - PAD * 2);
    x.fillStyle = "#B9C4D8"; x.font = "18px " + FB; x.fillText($("spLead").textContent, PAD, PAD + 190, W - PAD * 2);
    // ladder, on the same log scale as the page
    const top = PAD + 260, bot = H - 170, LH = bot - top, lx = PAD + 130;
    const Y = km => bot - pos(km) * LH;
    const toKm = v => App.unit() === "mi" ? v / 0.621371 : v;
    x.font = "12px " + FM; x.textAlign = "right";
    for(let e = 3; e <= 9; e++){
      const p = pos(toKm(Math.pow(10, e))); if(p > .99) continue;
      const y = bot - p * LH;
      x.strokeStyle = "#1E2A44"; x.setLineDash([3, 4]); x.beginPath(); x.moveTo(PAD, y); x.lineTo(lx, y); x.stroke(); x.setLineDash([]);
      x.fillStyle = "#5F6E8C"; x.fillText(["1K","10K","100K","1M","10M","100M","1B"][e - 3] + " " + App.unit(), lx - 12, y - 6);
    }
    x.textAlign = "start";
    x.fillStyle = "#1E2A44"; x.fillRect(lx - 1, top, 2, LH);
    const you = bot - pos(total) * LH;
    const g = x.createLinearGradient(0, bot, 0, you); g.addColorStop(0, "#86A9FF"); g.addColorStop(1, "#86A9FF55");
    x.fillStyle = g; x.fillRect(lx - 2.5, you, 5, bot - you);
    let last = 1e9;
    PLACES.forEach(p => {
      const st = status(total, p), y = Y(p.km), ly = Math.min(y, last - 22); last = ly;
      x.fillStyle = "#070B14"; x.beginPath(); x.arc(lx, y, p.r * 1.6 + 4, 0, 7); x.fill();
      x.fillStyle = p.color; x.beginPath(); x.arc(lx, y, p.r * 1.6, 0, 7); x.fill();
      x.fillStyle = st.done ? "#C7D0E2" : "#7F8BA5"; x.font = "15px " + FB; x.fillText(p.short, lx + 26, ly + 5);
    });
    const eg = x.createRadialGradient(lx - 5, bot - 5, 2, lx, bot, 18); eg.addColorStop(0, "#7FC4FF"); eg.addColorStop(.6, "#2C6CD6"); eg.addColorStop(1, "#1B3F86");
    x.fillStyle = eg; x.beginPath(); x.arc(lx, bot + 4, 16, 0, 7); x.fill();
    x.fillStyle = "#E9EEF7"; x.font = "600 15px " + FB; x.fillText("Earth", lx + 26, bot + 9);
    x.shadowColor = "#F2A93B"; x.shadowBlur = 18; x.fillStyle = "#F2A93B"; x.beginPath(); x.arc(lx, you, 9, 0, 7); x.fill(); x.shadowBlur = 0;
    x.font = "600 14px " + FM; x.fillText("You · " + big(total), lx + 120, you + 5);
    // milestones
    const mx = PAD + 430, mw = W - PAD - mx, rowH = (bot - top) / PLACES.length;
    PLACES.slice().reverse().forEach((p, i) => {
      const st = status(total, p), y = top + i * rowH + rowH / 2;
      x.fillStyle = p.color; x.beginPath(); x.arc(mx + 7, y, 7, 0, 7); x.fill();
      x.fillStyle = "#E9EEF7"; x.font = "600 18px " + FB; x.fillText(p.name, mx + 28, y - 4);
      x.fillStyle = "#8E9BB5"; x.font = "14px " + FB; x.fillText(big(p.km) + (p.note ? " · " + p.note.toLowerCase() : ""), mx + 28, y + 18);
      x.textAlign = "right"; x.fillStyle = st.done ? "#F2A93B" : "#8E9BB5"; x.font = "600 15px " + FM; x.fillText(st.text, mx + mw, y - 4); x.textAlign = "start";
      if(!st.done){ const bw = 140; x.fillStyle = "#1A2540"; x.fillRect(mx + mw - bw, y + 10, bw, 5); x.fillStyle = "#86A9FF"; x.fillRect(mx + mw - bw, y + 10, Math.max(3, bw * st.pct / 100), 5); }
      x.fillStyle = "#1A2540"; x.fillRect(mx, y + rowH / 2 - 1, mw, 1);
    });
    // footer
    x.fillStyle = "#5F6E8C"; x.font = "13px " + FB;
    x.fillText("Log scale: each step up is ten times farther. Planets at their closest to Earth.", PAD, H - 92);
    x.font = "12px " + FM; x.fillText("Made with Contrail · " + new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }), PAD, H - PAD + 6);
    cv.toBlob(b => {
      const msg = $("spExMsg");
      if(!b){ msg.textContent = "Couldn't create the image. Try again."; return; }
      const d = new Date(), iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "contrail-to-the-moon-" + iso + ".png";
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      msg.textContent = "Downloaded " + a.download + ".";
    }, "image/png");
  }
  $("spExport").addEventListener("click", () => { try{ exportImage(); }catch(e){ $("spExMsg").textContent = "The export didn't work (" + ((e && e.message) || "error") + ")."; } });

  function maybeRender(){ if(location.hash === "#space") render(); }
  addEventListener("hashchange", maybeRender);
  // stay current if flights or units change while the page is open
  document.getElementById("u-mi").addEventListener("click", maybeRender);
  document.getElementById("u-km").addEventListener("click", maybeRender);
  maybeRender();
})();
