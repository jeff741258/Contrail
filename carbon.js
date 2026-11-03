// Carbon page (#carbon): how much new forest would soak up the CO₂e of your flights, drawn as trees
// on American football fields (when distances are in miles) or soccer pitches (in km).
// Assumptions: a young planted tree takes up about 10 kg of CO₂ a year on average over its first
// 20 years, planted at about 1,000 trees per hectare (One Tree Planted's figures).
(function(){
  "use strict";
  const App = window.ContrailApp;
  const $ = id => document.getElementById(id);
  const KG_PER_TREE_YEAR = 10, TREES_PER_HA = 1000;
  // American football field with end zones: 120 × 53⅓ yd (0.535 ha). Soccer pitch: FIFA's 105 × 68 m (0.714 ha).
  const FIELDS = {
    mi: { name: "American football field", plural: "American football fields", ha: 0.5351, w: 120, h: 53.33 },
    km: { name: "soccer field", plural: "soccer fields", ha: 0.714, w: 105, h: 68 }
  };
  let years = 10;
  try{ years = Number(localStorage.getItem("contrail.carbonYears")) || 10; }catch(_){}
  const MAX_DRAWN = 12;

  // one field drawing, with `n` of its trees planted (the rest of the grass left empty)
  function field(kind, F, n, per){
    const W = 240, H = Math.round(240 * F.h / F.w);
    let lines = "";
    if(kind === "mi"){ // end zones and yard lines every 10 yards
      const ez = W * 10 / 120;
      lines += '<rect x="0" y="0" width="' + ez + '" height="' + H + '" class="cb-ez"/><rect x="' + (W - ez) + '" y="0" width="' + ez + '" height="' + H + '" class="cb-ez"/>';
      for(let yd = 10; yd <= 110; yd += 10){ const x = W * yd / 120; lines += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + H + '"/>'; }
    }else{ // halfway line, centre circle, penalty boxes
      const sx = W / 105, sy = H / 68;
      lines += '<line x1="' + W / 2 + '" y1="0" x2="' + W / 2 + '" y2="' + H + '"/><circle cx="' + W / 2 + '" cy="' + H / 2 + '" r="' + 9.15 * sx + '"/>' +
        '<rect x="0" y="' + (H / 2 - 20.16 * sy) + '" width="' + 16.5 * sx + '" height="' + 40.32 * sy + '"/><rect x="' + (W - 16.5 * sx) + '" y="' + (H / 2 - 20.16 * sy) + '" width="' + 16.5 * sx + '" height="' + 40.32 * sy + '"/>';
    }
    // trees on an even grid across the field
    const cols = Math.max(1, Math.round(Math.sqrt(per * W / H))), rows = Math.ceil(per / cols), dx = W / cols, dy = H / rows, r = Math.min(dx, dy) * 0.42;
    let trees = "";
    for(let i = 0; i < n; i++){ const c = i % cols, rr = Math.floor(i / cols); trees += '<circle cx="' + (dx * (c + .5)).toFixed(1) + '" cy="' + (dy * (rr + .5)).toFixed(1) + '" r="' + r.toFixed(2) + '"/>'; }
    return '<svg viewBox="-3 -3 ' + (W + 6) + ' ' + (H + 6) + '" class="cb-field"><rect x="0" y="0" width="' + W + '" height="' + H + '" class="cb-grass"/>' +
      '<g class="cb-lines">' + lines + '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="none"/></g><g class="cb-trees">' + trees + '</g></svg>';
  }

  function render(){
    const kg = App.co2Total(), kind = App.unit() === "km" ? "km" : "mi", F = FIELDS[kind];
    const trees = Math.ceil(kg / (KG_PER_TREE_YEAR * years)), per = Math.round(F.ha * TREES_PER_HA), fields = trees / per;
    $("cbTotal").textContent = App.fmtCo2(kg);
    $("cbLead").textContent = (App.isExample() ? "Example log: " : "") + "Plant about " + trees.toLocaleString() + (trees === 1 ? " tree" : " trees") +
      " and let " + (trees === 1 ? "it" : "them") + " grow for " + years + (years === 1 ? " year" : " years") + " to soak up the carbon from your flights so far.";
    $("cbYears").innerHTML = [1, 10, 20].map(y => '<button type="button" role="tab" class="ltab" data-y="' + y + '" aria-selected="' + (y === years) + '">In ' + y + (y === 1 ? " year" : " years") + '</button>').join("");
    $("cbFields").textContent = fields >= 100 ? Math.round(fields).toLocaleString() : fields >= 1 ? fields.toFixed(1) : fields.toFixed(2);
    $("cbFieldsLabel").textContent = (fields === 1 ? F.name : F.plural) + " of new forest";
    // draw up to 12 fields; beyond that, the last drawing stands for the rest
    const full = Math.floor(fields), part = trees - full * per, drawn = [];
    for(let i = 0; i < Math.min(full, MAX_DRAWN); i++) drawn.push(field(kind, F, per, per));
    if(full < MAX_DRAWN && part > 0) drawn.push(field(kind, F, part, per));
    const more = full > MAX_DRAWN ? full - MAX_DRAWN + (part > 0 ? 1 : 0) : 0;
    $("cbGrid").innerHTML = drawn.map(d => '<div class="cb-cell">' + d + '</div>').join("") + (more ? '<div class="cb-more">+ ' + more.toLocaleString() + " more</div>" : "");
    $("cbGrid").setAttribute("aria-label", trees.toLocaleString() + " trees, filling " + $("cbFields").textContent + " " + $("cbFieldsLabel").textContent);
    $("cbNote").textContent = "Each dot is a tree. Estimates assume a young tree takes up about " + KG_PER_TREE_YEAR + " kg of CO₂ a year over its first 20 years, " +
      "planted about 1,000 to a hectare (" + per.toLocaleString() + " per " + F.name + "). Carbon is for one economy seat, including contrail and other high-altitude effects. " +
      (kind === "mi" ? "Switch to km for soccer fields." : "Switch to mi for American football fields.");
  }
  $("cbYears").addEventListener("click", e => {
    const b = e.target.closest("[data-y]"); if(!b) return;
    years = Number(b.dataset.y); try{ localStorage.setItem("contrail.carbonYears", years); }catch(_){}
    render();
  });
  const maybe = () => { if(location.hash === "#carbon") render(); };
  addEventListener("hashchange", maybe);
  $("u-mi").addEventListener("click", maybe); $("u-km").addEventListener("click", maybe);
  maybe();
})();
