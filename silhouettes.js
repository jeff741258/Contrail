// Top-view silhouettes for the Hangar, drawn from each type's real proportions (length, wingspan,
// fuselage width, sweep, engine count and where the engines hang). Nose points up in a 64×64 box.
// Small planes are drawn smaller than big ones, but not to strict scale, so a CRJ is still readable.
(function(){
  "use strict";
  // [regex, length m, span m, fuselage m, kind]   kind: narrow | wide | quad | tail | regional | prop
  const SPECS = [
    [/A380/, 72.7, 79.8, 7.1, "quad"],
    [/747-8/, 76.3, 68.4, 6.5, "quad"], [/747/, 70.6, 64.4, 6.5, "quad"],
    [/A340/, 63.6, 60.3, 5.6, "quad"],
    [/A350-1000/, 73.8, 64.8, 6.0, "wide"], [/A350/, 66.8, 64.8, 6.0, "wide"],
    [/A330-8|A330-200/, 58.8, 62, 5.6, "wide"], [/A330/, 63.7, 62, 5.6, "wide"],
    [/777-300ER/, 73.9, 64.8, 6.2, "wide"], [/777-300/, 73.9, 60.9, 6.2, "wide"], [/777-200LR/, 63.7, 64.8, 6.2, "wide"], [/777/, 63.7, 60.9, 6.2, "wide"],
    [/787-10/, 68.3, 60.1, 5.8, "wide"], [/787-9/, 62.8, 60.1, 5.8, "wide"], [/787/, 56.7, 60.1, 5.8, "wide"],
    [/767-400/, 61.4, 51.9, 5.0, "wide"], [/767-200/, 48.5, 47.6, 5.0, "wide"], [/767/, 54.9, 47.6, 5.0, "wide"],
    [/757-300/, 54.4, 38, 3.8, "narrow"], [/757/, 47.3, 38, 3.8, "narrow"],
    [/A321/, 44.5, 35.8, 3.95, "narrow"], [/A320/, 37.6, 35.8, 3.95, "narrow"], [/A319/, 33.8, 35.8, 3.95, "narrow"], [/A318/, 31.4, 34.1, 3.95, "narrow"],
    [/A220-300/, 38.7, 35.1, 3.5, "narrow"], [/A220/, 35, 35.1, 3.5, "narrow"],
    [/MAX 10/, 43.8, 35.9, 3.8, "narrow"], [/MAX 9|737-900/, 42.2, 35.9, 3.8, "narrow"], [/MAX 8|737-800/, 39.5, 35.9, 3.8, "narrow"], [/MAX 7|737-700/, 35.6, 35.8, 3.8, "narrow"],
    [/737-600/, 31.2, 34.3, 3.8, "narrow"], [/737-400/, 36.4, 28.9, 3.8, "narrow"], [/737-500/, 31, 28.9, 3.8, "narrow"], [/737-300/, 33.4, 28.9, 3.8, "narrow"], [/737-200/, 30.5, 28.3, 3.8, "narrow"], [/737/, 39.5, 35.9, 3.8, "narrow"],
    [/717/, 37.8, 28.4, 3.3, "tail"],
    [/CRJ1000/, 39.1, 26.2, 2.7, "tail"], [/CRJ900/, 36.2, 24.9, 2.7, "tail"], [/CRJ700/, 32.3, 23.2, 2.7, "tail"], [/CRJ/, 26.8, 21.2, 2.7, "tail"],
    [/195-E2/, 41.5, 35.1, 3.0, "regional"], [/190-E2/, 36.2, 33.7, 3.0, "regional"], [/195/, 38.7, 28.7, 3.0, "regional"], [/190/, 36.2, 28.7, 3.0, "regional"],
    [/175/, 31.7, 26, 3.0, "regional"], [/170/, 29.9, 26, 3.0, "regional"],
    [/Dash 8-400/, 32.8, 28.4, 2.7, "prop"], [/Dash 8/, 25.7, 27.4, 2.7, "prop"],
    [/ATR 42/, 22.7, 24.6, 2.6, "prop"], [/ATR/, 27.2, 27.1, 2.6, "prop"]
  ];
  const r1 = n => Math.round(n * 10) / 10;

  function build(name){
    const s = SPECS.find(x => x[0].test(name)); if(!s) return null;
    const [, len, span, fus, kind] = s;
    // overall size: the larger of length and span maps to 34–60 px
    const d = Math.max(len, span), k = (34 + (Math.min(d, 80) - 21) / 59 * 26) / d;
    const L = len * k, B = span * k / 2, F = Math.max(fus * k, 2.6), cx = 32, y0 = 32 - L / 2, y1 = 32 + L / 2;
    const prop = kind === "prop", wide = kind === "wide" || kind === "quad";
    const sweep = prop ? 0.03 : wide ? 0.62 : 0.5;           // tan of leading-edge sweep
    const wy = y0 + L * (prop ? 0.40 : kind === "tail" ? 0.47 : 0.38); // wing root leading edge
    const cr = L * (prop ? 0.11 : wide ? 0.21 : 0.2), ct = cr * (prop ? 0.6 : 0.32);
    const parts = [];
    // fuselage: rounded nose, straight body, tapering tail cone
    const h = F / 2, nose = Math.min(F * 1.3, L * 0.12), cone = L * 0.2;
    parts.push(`M${r1(cx)} ${r1(y0)}C${r1(cx + h * .9)} ${r1(y0)} ${r1(cx + h)} ${r1(y0 + nose * .5)} ${r1(cx + h)} ${r1(y0 + nose)}` +
      `L${r1(cx + h)} ${r1(y1 - cone)}L${r1(cx + h * .3)} ${r1(y1)}L${r1(cx - h * .3)} ${r1(y1)}L${r1(cx - h)} ${r1(y1 - cone)}L${r1(cx - h)} ${r1(y0 + nose)}` +
      `C${r1(cx - h)} ${r1(y0 + nose * .5)} ${r1(cx - h * .9)} ${r1(y0)} ${r1(cx)} ${r1(y0)}Z`);
    // wings
    [1, -1].forEach(sg => {
      const tipLE = wy + (B - h) * sweep;
      parts.push(`M${r1(cx + sg * h * .8)} ${r1(wy)}L${r1(cx + sg * B)} ${r1(tipLE)}L${r1(cx + sg * B)} ${r1(tipLE + ct)}L${r1(cx + sg * h * .8)} ${r1(wy + cr)}Z`);
    });
    // horizontal tail
    const tb = B * (prop ? 0.36 : 0.34), ty = y1 - L * (prop || kind === "tail" ? 0.1 : 0.13), tc = L * 0.07;
    [1, -1].forEach(sg => parts.push(`M${r1(cx + sg * h * .5)} ${r1(ty)}L${r1(cx + sg * tb)} ${r1(ty + (tb - h) * (prop ? .1 : .6))}L${r1(cx + sg * tb)} ${r1(ty + (tb - h) * (prop ? .1 : .6) + tc * .45)}L${r1(cx + sg * h * .5)} ${r1(ty + tc)}Z`));
    // engines
    const pod = (x, y, w, l) => `M${r1(x - w / 2)} ${r1(y)}h${r1(w)}v${r1(l)}h${r1(-w)}Z`;
    if(kind === "tail"){
      const ew = Math.max(1.6 * k * 1.3, 2.4), el = L * 0.13, ey = y1 - cone - el * 0.4;
      [1, -1].forEach(sg => { const ex = cx + sg * (h + ew / 2 + .5); parts.push(pod(ex, ey, ew, el), pod((cx + ex) / 2, ey + el * .35, Math.abs(ex - cx), el * .25)); });
    }else{
      const dia = prop ? 1.4 : kind === "quad" ? 3.0 : wide ? 3.3 : kind === "regional" ? 1.6 : 2.1;
      const ew = Math.max(dia * k * 1.15, 1.8), el = prop ? cr * 1.3 : dia * k * 2.2;
      const at = kind === "quad" ? [0.36, 0.66] : prop ? [0.34] : [0.34];
      at.forEach(f => [1, -1].forEach(sg => {
        const ex = cx + sg * (h + (B - h) * f), le = wy + (B - h) * f * sweep;
        parts.push(pod(ex, le - el * (prop ? .35 : .55), ew, el));
        if(prop){ const pr = 3.9 * k * 1.2; parts.push(`M${r1(ex - pr)} ${r1(le - el * .35 - .9)}h${r1(pr * 2)}v1h${r1(-pr * 2)}Z`); }
      }));
    }
    return parts.join("|");
  }
  const cache = {};
  window.ContrailSilhouette = {
    // SVG markup for an aircraft type, or "" when the type isn't known
    svg(name){ if(!(name in cache)) cache[name] = build(name); const p = cache[name];
      // one <path> per part, so overlapping parts always fill solid (mirrored parts wind the other way)
    return p ? '<svg viewBox="0 0 64 64" aria-hidden="true" class="typed">' + p.split("|").map(d => '<path d="' + d + '"/>').join("") + '</svg>' : ""; },
    known: name => SPECS.some(x => x[0].test(name))
  };
})();
