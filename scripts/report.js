// Prints the numbers behind "Reading the state subspaces" in index.html:
// the national principal directions, and each region's subspace against the nation with its controls.
// Usage: node scripts/report.js
"use strict";
const S = require("../js/subspace.js");
const STATES = S.prepare(require("../js/states.js"));

const F = STATES.feats, REGIONS = ["S", "W", "N", "M"];
const Z = g => S.members(STATES, g).map(it => it.z);
const deg = c => (Math.acos(Math.min(1, c)) * 180 / Math.PI).toFixed(0) + "°";
const terms = v => v.map((x, i) => [x, i]).sort((p, q) => Math.abs(q[0]) - Math.abs(p[0])).slice(0, 4)
  .map(([x, i]) => x.toFixed(2) + " " + F[i]).join(", ");
const ends = (items, v) => {
  const sc = items.map(it => [S.dot(it.z, v), it.name]).sort((p, q) => p[0] - q[0]);
  return { low: sc.slice(0, 3).map(s => s[1]), high: sc.slice(-3).reverse().map(s => s[1]) };
};
const variance = (rows, v) => {
  const p = rows.map(z => S.dot(z, v)), m = p.reduce((a, b) => a + b, 0) / p.length;
  return p.reduce((a, b) => a + (b - m) ** 2, 0) / (p.length - 1);
};
// Size-matched null: random groups of N states, compared with the nation like a region is.
// Returns where a region's overlap falls among them, and how often a random group is as compressed
// along both of the nation's top two directions as the region is.
function randomGroups(N, r, F, spread, reps = 2000) {
  const rng = S.mulberry32(1000 + 10 * N + r), all = Z("all"), natU = S.pca(all, r).U;
  let below = 0, compressed = 0;
  const v = [];
  for (let i = 0; i < reps; i++) {
    const z = S.shuffle(50, rng).slice(0, N).map(j => all[j]), f = S.compare(natU, S.pca(z, r).U).F;
    v.push(f);
    if (f <= F) below++;
    if (spreadOf(z).every((x, k) => x <= spread[k])) compressed++;
  }
  v.sort((a, b) => a - b);
  return { median: v[reps >> 1], pct: below / reps, compressed: compressed / reps };
}
const nat = S.pca(Z("all"), 3);
const spreadOf = z => [0, 1].map(k => variance(z, nat.U[k]) / variance(Z("all"), nat.U[k]));
console.log("National directions (all 50 states)");
nat.U.forEach((v, k) => {
  const e = ends(STATES.items, v);
  console.log(`  ${k + 1}. ${(nat.frac[k] * 100).toFixed(0)}%  ${terms(v)}`);
  console.log(`     low: ${e.low.join(", ")}   high: ${e.high.join(", ")}`);
});

for (const r of [1, 2, 3]) {
  console.log(`\nEach region vs the nation, r = ${r}  (floor: random subspaces ${S.floorStats(8, r).mean.toFixed(2)})`);
  console.log("  region      N  angles         overlap  random N: median  percentile  vs other states");
  const natU = S.pca(Z("all"), r).U;
  for (const g of REGIONS) {
    const z = Z(g), c = S.compare(natU, S.pca(z, r).U);
    const rest = STATES.items.filter(it => it.g !== g).map(it => it.z);
    const loo = S.compare(S.pca(rest, r).U, S.pca(z, r).U).F;
    const b = randomGroups(z.length, r, c.F, spreadOf(z));
    console.log(`  ${STATES.groups[g].padEnd(10)} ${String(z.length).padStart(2)}  ${c.s.map(deg).join(", ").padEnd(13)}  ` +
      `${c.F.toFixed(2).padStart(7)}  ${b.median.toFixed(2).padStart(16)}  ${(Math.round(100 * b.pct) + "%").padStart(10)}  ${loo.toFixed(2).padStart(15)}`);
  }
}

console.log("\nSpread along the nation's top two directions (nation = 1), vs random groups of the same size");
for (const g of REGIONS) {
  const z = Z(g), sp = spreadOf(z), b = randomGroups(z.length, 2, 0, sp);
  console.log(`  ${STATES.groups[g].padEnd(10)} ${sp.map(x => x.toFixed(2)).join(", ")}   random groups this compressed on both: ${(100 * b.compressed).toFixed(1)}%`);
}

console.log("\nEach region's own top two directions");
for (const g of REGIONS) {
  const items = S.members(STATES, g), p = S.pca(items.map(it => it.z), 2);
  p.U.forEach((v, k) => {
    const e = ends(items, v);
    console.log(`  ${STATES.groups[g].padEnd(10)} u${k + 1} ${(p.frac[k] * 100).toFixed(0)}%  ${terms(v)}`);
    console.log(`  ${"".padEnd(10)}    high: ${e.high.join(", ")}   low: ${e.low.join(", ")}`);
  });
}
