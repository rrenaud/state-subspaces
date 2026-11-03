// The interactive tool: pick two groups of states, see their principal subspaces, angles and overlap.
(function () {
  "use strict";
  const { dot, mulberry32, pca, randomBasis, combine, compare, members, floorStats } = Subspace;
  const DS = { us: Subspace.prepare(STATES) };
  const ceilStats = (g, r) => Subspace.ceilStats(g, members(STATES, g).map(it => it.z), r);
  const SUB = ["₁", "₂", "₃"];

  const st = { ds: "us", g1: "all", g2: "S", r: 2, rot: null, rotSeed: 1, pair: [0, 1] };
  const $ = id => document.getElementById(id);
  const f2 = x => (Math.abs(x) < 0.005 ? "0.00" : x.toFixed(2)).replace("-", "−");
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  // The vector as a weighted sum of its largest terms, e.g. "0.51 Income + 0.48 Bachelor's + 0.43 Urban + …".
  function describe(v, feats) {
    const order = v.map((x, i) => [x, i]).sort((p, q) => Math.abs(q[0]) - Math.abs(p[0]));
    const top = order.filter(([x]) => Math.abs(x) >= 0.25).slice(0, 3);
    if (!top.length) return "spread evenly";
    const more = order.slice(top.length).some(([x]) => Math.abs(x) >= 0.15);
    return top.map(([x, i], k) => (k ? (x > 0 ? " + " : " − ") : (x > 0 ? "" : "−")) + Math.abs(x).toFixed(2) + " " + feats[i]).join("") + (more ? " + …" : "");
  }
  // Rows whose weight matters are emphasized; near-zero rows fade.
  function rowCls(series, j) {
    const m = Math.max(...series.map(s => Math.abs(s.v[j])));
    return m >= 0.3 ? " hi" : m < 0.15 ? " lo" : "";
  }
  // The members at each end of a direction, e.g. the three highest and three lowest states along it.
  function ends(items, v) {
    const sc = items.map(it => [dot(it.z, v), it.name]).sort((p, q) => q[0] - p[0]);
    const k = Math.min(3, Math.floor(sc.length / 2));
    const hi = sc.slice(0, k).map(x => x[1]).join(", "), lo = sc.slice(-k).reverse().map(x => x[1]).join(", ");
    return '<div class="ends"><span title="' + esc(hi) + '">▲ ' + esc(hi) + '</span><span title="' + esc(lo) + '">▼ ' + esc(lo) + "</span></div>";
  }
  // All 50 states projected onto a basis, equal scale on both axes; the group's states are colored and labeled.
  // Each region has a color and a shape, so regions stay apart without relying on color alone.
  const SHAPE = { N: "circle", M: "square", S: "triangle", W: "diamond" };
  function marker(g, x, y, s, extra) {
    const c = ' class="rg r' + g + (extra || "") + '"';
    switch (SHAPE[g]) {
      case "square": return "<rect" + c + ' x="' + (x - s * .88).toFixed(1) + '" y="' + (y - s * .88).toFixed(1) + '" width="' + (s * 1.76).toFixed(1) + '" height="' + (s * 1.76).toFixed(1) + '"/>';
      case "triangle": return "<path" + c + ' d="M' + x.toFixed(1) + " " + (y - s * 1.15).toFixed(1) + "L" + (x + s * 1.1).toFixed(1) + " " + (y + s * .8).toFixed(1) + "L" + (x - s * 1.1).toFixed(1) + " " + (y + s * .8).toFixed(1) + 'Z"/>';
      case "diamond": return "<path" + c + ' d="M' + x.toFixed(1) + " " + (y - s * 1.2).toFixed(1) + "L" + (x + s * 1.2).toFixed(1) + " " + y.toFixed(1) + "L" + x.toFixed(1) + " " + (y + s * 1.2).toFixed(1) + "L" + (x - s * 1.2).toFixed(1) + " " + y.toFixed(1) + 'Z"/>';
      default: return "<circle" + c + ' cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + s + '"/>';
    }
  }
  function regionLegend(ds) {
    return Object.keys(SHAPE).map(g => '<span><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">' + marker(g, 6, 6, 4.2) + "</svg>" + esc(ds.groups[g]) + "</span>").join("");
  }

  // All 50 states projected onto a basis. Two or more dimensions: a scatter of the chosen pair of basis vectors,
  // equal scale on both axes. One dimension: one lane per region, so the marks spread out instead of piling up.
  // The group's states are full size and labeled; the rest are small and faded.
  function scatter(ds, members, U, sym) {
    const inG = new Set(members);
    const tip = (p, coords) => p.it.name + " (" + ds.groups[p.it.g] + ") · " + coords;
    let g, hits = "";
    if (U.length === 1) {
      const lanes = Object.keys(SHAPE), laneH = 46, top = 4, left = 74, pad = 12, W = 300;
      const H = top + lanes.length * laneH + 18;
      const pts = ds.items.map(it => ({ it, x: dot(it.z, U[0]), m: inG.has(it) }));
      const ext = Math.max(...pts.map(p => Math.abs(p.x))) * 1.06 || 1;
      const X = x => left + (x / ext + 1) / 2 * (W - left - pad);
      g = '<svg class="sc" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="States by region along ' + sym + SUB[0] + '">' +
        '<line class="ax" x1="' + X(0) + '" x2="' + X(0) + '" y1="' + top + '" y2="' + (top + lanes.length * laneH) + '"/>' +
        '<text class="al" x="' + (W - pad) + '" y="' + (H - 4) + '" text-anchor="end">' + sym + SUB[0] + " →</text>";
      lanes.forEach((r, li) => {
        const y = top + li * laneH + laneH / 2;
        g += '<line class="lane" x1="' + left + '" x2="' + (W - pad) + '" y1="' + y + '" y2="' + y + '"/>' +
          '<text class="al" x="0" y="' + (y + 3.5) + '">' + esc(ds.groups[r]) + "</text>";
        const lp = pts.filter(p => p.it.g === r);
        lp.filter(p => !p.m).forEach(p => (g += marker(r, X(p.x), y, 2.6, " dim")));
        // Greedy label rows: each label takes the first row (just above, just below, then further out) whose
        // previous label is at least a label's width to the left, or else the row that has been free longest.
        const rows = [-7, 13, -16, 22], last = rows.map(() => -Infinity);
        lp.filter(p => p.m).sort((a, b) => a.x - b.x).forEach(p => {
          const x = X(p.x);
          let ri = rows.findIndex((_, i) => x - last[i] >= 12);
          if (ri < 0) ri = last.indexOf(Math.min(...last));
          last[ri] = x;
          g += marker(r, x, y, 4) +
            '<text class="lb" text-anchor="middle" x="' + x.toFixed(1) + '" y="' + (y + rows[ri]).toFixed(1) + '">' + ds.postal[p.it.name] + "</text>";
        });
        lp.forEach(p => (hits += '<circle class="hit" cx="' + X(p.x).toFixed(1) + '" cy="' + y + '" r="6" data-t="' + esc(tip(p, sym + SUB[0] + " " + f2(p.x))) + '"/>'));
      });
      return g + hits + "</svg>";
    }
    const [a, b] = U.length > 2 ? st.pair : [0, 1];
    const W = 300, H = 260, pad = 16;
    const pts = ds.items.map(it => ({ it, x: dot(it.z, U[a]), y: dot(it.z, U[b]), m: inG.has(it) }));
    const ext = Math.max(...pts.map(p => Math.max(Math.abs(p.x), Math.abs(p.y)))) * 1.08 || 1;
    const k = (H - 2 * pad) / (2 * ext);
    const X = x => W / 2 + x * k, Y = y => H / 2 - y * k;
    g = '<svg class="sc" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="States projected onto this basis">' +
      '<line class="ax" x1="' + pad + '" x2="' + (W - pad) + '" y1="' + H / 2 + '" y2="' + H / 2 + '"/>' +
      '<text class="al" x="' + (W - pad) + '" y="' + (H / 2 - 5) + '" text-anchor="end">' + sym + SUB[a] + " →</text>" +
      '<line class="ax" x1="' + W / 2 + '" x2="' + W / 2 + '" y1="' + pad + '" y2="' + (H - pad) + '"/>' +
      '<text class="al" x="' + (W / 2 + 5) + '" y="' + (pad + 8) + '">' + sym + SUB[b] + " ↑</text>";
    pts.filter(p => !p.m).forEach(p => (g += marker(p.it.g, X(p.x), Y(p.y), 2.6, " dim")));
    pts.filter(p => p.m).forEach(p => {
      g += marker(p.it.g, X(p.x), Y(p.y), 4.2) +
        '<text class="lb" x="' + (X(p.x) + 6).toFixed(1) + '" y="' + (Y(p.y) + 3).toFixed(1) + '">' + ds.postal[p.it.name] + "</text>";
    });
    pts.forEach(p => (hits += '<circle class="hit" cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="8" data-t="' +
      esc(tip(p, sym + SUB[a] + " " + f2(p.x) + " · " + sym + SUB[b] + " " + f2(p.y))) + '"/>'));
    return g + hits + "</svg>";
  }

  function barStyle(v) {
    const w = Math.min(1, Math.abs(v)) * 50;
    return "left:" + (v >= 0 ? 50 : 50 - w) + "%;width:" + w + "%";
  }
  function bars(feats, series) {
    const two = series.length === 2;
    return '<div class="bars">' + feats.map((f, j) =>
      '<div class="br' + rowCls(series, j) + '"><span>' + esc(f) + '</span><span class="bt">' +
      series.map((s, k) => '<i class="bar ' + s.cls + (two ? (k ? " bot" : " top") : "") + '" style="' + barStyle(s.v[j]) + '"></i>').join("") +
      '</span><span class="bv">' + series.map(s => f2(s.v[j])).join(" ") + "</span></div>").join("") + "</div>";
  }

  function randomRotation(r, seed) {
    const rng = mulberry32(seed * 7919);
    return randomBasis(r, r, rng);
  }

  function render() {
    const ds = DS[st.ds], feats = ds.feats, n = feats.length, r = st.r;
    const I1 = members(ds, st.g1), I2 = members(ds, st.g2);
    const p1 = pca(I1.map(i => i.z), r), p2 = pca(I2.map(i => i.z), r);
    let U1 = p1.U;
    if (st.rot) U1 = st.rot.map(row => combine(p1.U, row));
    const cmp = compare(U1, p2.U);

    const basisPanel = (which, label, items, U, frac, rotated) => {
      const cnt = items.length;
      const cls = which === 1 ? "s1" : "s2", sym = which === 1 ? "u" : "v";
      let h = '<h4><span class="sw ' + cls + '"></span>S' + SUB[which - 1] + " · " + esc(label) + " <small>" + cnt + " " + ds.noun + "</small></h4>" +
        scatter(ds, items, U, sym) + '<p class="cap">All 50 states projected onto ' +
        (U.length === 1 ? sym + SUB[0] + ", one lane per region. " : U.length > 2
          ? sym + SUB[st.pair[0]] + " and " + sym + SUB[st.pair[1]] + " (pick the pair under Plot axes). " : "this basis. ") +
        (items.length === ds.items.length ? "" : esc(label) + " full size and labeled. ") + "Hover a mark for the state.</p>";
      U.forEach((v, k) => {
        const meta = rotated ? "rotated basis vector" : Math.round(frac[k] * 100) + "% of the group's variance";
        h += '<div class="vec"><div class="vt">' + sym + SUB[k] + " <span>· " + meta + '</span></div><div class="vd">' +
          esc(describe(v, feats)) + "</div>" + ends(items, v) + bars(feats, [{ v, cls }]) + "</div>";
      });
      return h;
    };
    $("b1").innerHTML = basisPanel(1, ds.groups[st.g1], I1, U1, p1.frac, !!st.rot);
    $("b2").innerHTML = basisPanel(2, ds.groups[st.g2], I2, p2.U, p2.frac, false);

    // angles
    let h = "<h4>Principal angles</h4>";
    h += '<div class="mat"><span>U' + SUB[0] + "ᵀU" + SUB[1] + ' =</span><span class="brk"><table>' +
      cmp.M.map(row => "<tr>" + row.map(x => "<td>" + f2(x) + "</td>").join("") + "</tr>").join("") +
      "</table></span><span>singular values: " + cmp.s.map(f2).join(", ") + "</span></div>";
    cmp.s.forEach((c, i) => {
      const deg = Math.acos(Math.min(1, c)) * 180 / Math.PI;
      h += '<div class="ang"><div class="ah"><b>θ' + SUB[i] + " = " + deg.toFixed(0) + "°</b><span>cos θ" + SUB[i] + " = " + f2(c) + "</span></div>" +
        '<div class="cosbar"><i style="width:' + (c * 100).toFixed(1) + '%"></i></div>' +
        '<div class="vd"><span class="sw s1"></span>' + esc(describe(cmp.a[i], feats)) + '<br><span class="sw s2"></span>' + esc(describe(cmp.b[i], feats)) + "</div>" +
        bars(feats, [{ v: cmp.a[i], cls: "s1" }, { v: cmp.b[i], cls: "s2" }]) + "</div>";
    });
    $("angles").innerHTML = h;

    // score
    const fl = floorStats(n, r), c1 = ceilStats(st.g1, r), c2 = ceilStats(st.g2, r);
    const ceils = [c1, c2].filter(Boolean).map(c => c.mean);
    let verdict;
    if (st.g1 === st.g2) verdict = "Same group on both sides, so the subspaces are identical. Rotating S₁'s basis changes the matrix, not the score.";
    else if (cmp.F <= fl.hi) verdict = "Inside the range of two random " + r + "-dimensional subspaces of ℝ" + supN(n) + ". No evidence of shared structure.";
    else if (ceils.length && cmp.F >= Math.min(...ceils)) verdict = "As high as two halves of one group score against each other. The two groups vary along essentially the same directions.";
    else verdict = "Above chance, but below what a group shares with itself. The groups share some directions and not others; the principal angles show which.";
    if (st.g1 !== st.g2 && ceils.length && Math.max(...ceils) <= fl.hi)
      verdict = "Even two halves of the same group don't agree beyond chance here: the group's variance is spread almost evenly across directions, so its top " + r + " are not well determined. No comparison of these subspaces can say much.";
    else if (st.g1 !== st.g2) {
      const d1 = Math.acos(Math.min(1, cmp.s[0])) * 180 / Math.PI, dHi = Math.acos(fl.c1.hi) * 180 / Math.PI;
      verdict += cmp.s[0] > fl.c1.hi
        ? " The closest pair of directions (θ₁ = " + d1.toFixed(0) + "°) is tighter than random subspaces get: 95% of random pairs have θ₁ above " + dHi.toFixed(0) + "°."
        : " Even the closest pair of directions (θ₁ = " + d1.toFixed(0) + "°) is within what random subspaces give.";
    }
    const pos = x => (Math.max(0, Math.min(1, x)) * 100).toFixed(1) + "%";
    let strip = '<div class="strip" aria-hidden="true"><div class="axis"></div>' +
      '<div class="band" style="left:' + pos(fl.lo) + ";width:" + ((fl.hi - fl.lo) * 100).toFixed(1) + '%"></div>' +
      '<div class="mk" style="left:' + pos(fl.mean) + ';background:var(--frozen)"></div>';
    if (c1) strip += '<div class="mk" style="left:' + pos(c1.mean) + ';background:var(--s1)"></div>';
    if (c2) strip += '<div class="mk" style="left:' + pos(c2.mean) + ';background:var(--s2)"></div>';
    strip += '<div class="dot" style="left:' + pos(cmp.F) + '"></div>' +
      [0, .25, .5, .75, 1].map(t => '<span class="tick" style="left:' + t * 100 + '%">' + t + "</span>").join("") + "</div>";
    const ceilRow = (c, cls, g) => '<div><span><span class="sw ' + cls + '"></span>Ceiling: ' + esc(ds.groups[g]) + " split in half</span><b>" +
      (c ? f2(c.mean) + " (" + f2(c.lo) + "–" + f2(c.hi) + ")" : "too few " + ds.noun) + "</b></div>";
    $("scorebox").innerHTML = "<h4>Overlap ‖U" + SUB[0] + "ᵀU" + SUB[1] + "‖²<sub>F</sub> / r</h4>" +
      '<div class="big">' + cmp.F.toFixed(2) + '</div><p class="verdict">' + verdict + "</p>" + strip +
      '<div class="legend">' +
      '<div><span><span class="sw fg"></span>This pair</span><b>' + f2(cmp.F) + "</b></div>" +
      '<div><span><span class="sw fl"></span>Floor: random subspaces, r/n = ' + f2(r / n) + "</span><b>" + f2(fl.mean) + " (" + f2(fl.lo) + "–" + f2(fl.hi) + ")</b></div>" +
      ceilRow(c1, "s1", st.g1) + (st.g2 !== st.g1 ? ceilRow(c2, "s2", st.g2) : "") +
      '</div><p class="fine" style="margin:0">Ranges are 5th to 95th percentiles: 400 random subspace pairs for the floor, 80 random half-splits for each ceiling.</p>';

    $("unrot").disabled = !st.rot;
    $("pairs").hidden = r < 3;
    document.querySelectorAll("#pairseg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.pair === st.pair.join(","))));
  }
  function supN(n) { return String(n).split("").map(d => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]).join(""); }

  function fillSelects() {
    const ds = DS[st.ds];
    ["g1", "g2"].forEach(id => {
      $(id).innerHTML = Object.entries(ds.groups).map(([k, label]) =>
        '<option value="' + k + '"' + (st[id] === k ? " selected" : "") + ">" + esc(label) + " (" + members(ds, k).length + ")</option>").join("");
    });
    $("dsnote").textContent = ds.note;
    $("rlegend").innerHTML = regionLegend(ds);
  }

  function setDs(k) {
    st.ds = k; st.g1 = DS[k].def[0]; st.g2 = DS[k].def[1]; st.rot = null;
    fillSelects(); render();
  }

  if (typeof document !== "undefined" && document.getElementById("lab")) {
    document.querySelectorAll("#rseg button").forEach(b => (b.onclick = () => {
      st.r = +b.dataset.r; st.rot = null; st.pair = [0, 1];
      document.querySelectorAll("#rseg button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      render();
    }));
    $("g1").onchange = e => { st.g1 = e.target.value; st.rot = null; render(); };
    $("g2").onchange = e => { st.g2 = e.target.value; render(); };
    const lab = $("lab"), tip = document.createElement("div");
    tip.className = "tip"; tip.hidden = true; lab.appendChild(tip);
    lab.addEventListener("pointermove", e => {
      const t = e.target.closest && e.target.closest(".hit");
      if (!t) { tip.hidden = true; return; }
      tip.textContent = t.dataset.t; tip.hidden = false;
      const b = lab.getBoundingClientRect();
      tip.style.left = Math.max(4, Math.min(e.clientX - b.left + 12, b.width - tip.offsetWidth - 4)) + "px";
      tip.style.top = (e.clientY - b.top + 14) + "px";
    });
    lab.addEventListener("pointerleave", () => (tip.hidden = true));
    $("rot").onclick = () => { st.rotSeed++; st.rot = randomRotation(st.r, st.rotSeed); render(); };
    $("unrot").onclick = () => { st.rot = null; render(); };
    document.querySelectorAll("#pairseg button").forEach(b => (b.onclick = () => { st.pair = b.dataset.pair.split(",").map(Number); render(); }));
    setDs("us");
  }
})();
