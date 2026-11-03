// Principal components and principal angles between subspaces, plus the random floor and split-half ceiling.
// Plain arrays, no dependencies; vectors are arrays and a basis is an array of orthonormal vectors.
(function (root) {
  "use strict";
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const norm = a => Math.sqrt(dot(a, a));

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    let u = 0;
    while (!u) u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  }

  // Symmetric eigendecomposition (cyclic Jacobi); eigenvectors returned as arrays, largest eigenvalue first.
  function jacobi(A) {
    const n = A.length, a = A.map(r => r.slice());
    const V = a.map((_, i) => a.map((_, j) => (i === j ? 1 : 0)));
    for (let sweep = 0; sweep < 100; sweep++) {
      let off = 0;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q];
      if (off < 1e-22) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-300) continue;
        const th = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) { const x = a[k][p], y = a[k][q]; a[k][p] = c * x - s * y; a[k][q] = s * x + c * y; }
        for (let k = 0; k < n; k++) { const x = a[p][k], y = a[q][k]; a[p][k] = c * x - s * y; a[q][k] = s * x + c * y; }
        for (let k = 0; k < n; k++) { const x = V[k][p], y = V[k][q]; V[k][p] = c * x - s * y; V[k][q] = s * x + c * y; }
      }
    }
    const idx = [...Array(n).keys()].sort((i, j) => a[j][j] - a[i][i]);
    return { vals: idx.map(i => a[i][i]), vecs: idx.map(i => V.map(r => r[i])) };
  }

  // A component's sign is arbitrary; pick the one whose weights sum to a positive number, so that similar directions
  // in different groups point the same way (a weight that is largest by a hair can't flip it).
  function signFix(v) {
    return v.reduce((t, x) => t + x, 0) < 0 ? -1 : 1;
  }

  function pca(Z, r) {
    const N = Z.length, n = Z[0].length, m = Array(n).fill(0);
    Z.forEach(z => z.forEach((x, j) => (m[j] += x / N)));
    const C = [...Array(n)].map(() => Array(n).fill(0));
    Z.forEach(z => {
      const d = z.map((x, j) => x - m[j]);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) C[i][j] += d[i] * d[j] / (N - 1);
    });
    const { vals, vecs } = jacobi(C);
    const tot = vals.reduce((a, b) => a + Math.max(b, 0), 0) || 1;
    return {
      U: vecs.slice(0, r).map(v => { const s = signFix(v); return v.map(x => s * x); }),
      frac: vals.slice(0, r).map(v => Math.max(v, 0) / tot)
    };
  }

  function gramSchmidt(vs) {
    const out = [];
    vs.forEach(v => {
      let w = v.slice();
      out.forEach(u => { const d = dot(w, u); w = w.map((x, i) => x - d * u[i]); });
      const nr = norm(w);
      if (nr > 1e-10) out.push(w.map(x => x / nr));
    });
    return out;
  }
  const randomBasis = (n, r, rng) => gramSchmidt([...Array(r)].map(() => [...Array(n)].map(() => gauss(rng))));
  const combine = (U, c) => U[0].map((_, j) => c.reduce((t, ck, k) => t + ck * U[k][j], 0));

  // Principal angles: SVD of M = U1ᵀU2 via the eigendecomposition of MᵀM.
  function compare(U1, U2) {
    const r = U1.length;
    const M = U1.map(a => U2.map(b => dot(a, b)));
    const MtM = [...Array(r)].map((_, i) => [...Array(r)].map((_, j) => M.reduce((s, row) => s + row[i] * row[j], 0)));
    const e = jacobi(MtM);
    const s = e.vals.map(v => Math.sqrt(Math.min(1, Math.max(0, v))));
    const Q = e.vecs, P = [];
    Q.forEach(q => {
      let p = M.map(row => dot(row, q)), nr = norm(p);
      for (let k = 0; k < r && nr < 1e-9; k++) {  // cos θ = 0: any remaining direction of S₁ will do
        p = [...Array(r)].map((_, j) => (j === k ? 1 : 0));
        P.forEach(pp => { const d = dot(p, pp); p = p.map((x, j) => x - d * pp[j]); });
        nr = norm(p);
      }
      P.push(p.map(x => x / nr));
    });
    const a = P.map(p => combine(U1, p)), b = Q.map(q => combine(U2, q));
    a.forEach((v, i) => { if (signFix(v) < 0) { a[i] = v.map(x => -x); b[i] = b[i].map(x => -x); } });
    const F = M.flat().reduce((t, x) => t + x * x, 0) / r;
    return { M, s, a, b, F };
  }

  const stats = xs => {
    const v = xs.slice().sort((x, y) => x - y);
    return { mean: v.reduce((a, b) => a + b, 0) / v.length, lo: v[Math.floor(.05 * (v.length - 1))], hi: v[Math.ceil(.95 * (v.length - 1))] };
  };

  // Standardize a dataset in place: it.x is the transformed row, it.z its z-score across all items.
  function prepare(ds) {
    ds.items = ds.rows.map(r => ({ name: r[0], g: r[1], raw: r.slice(2) }));
    ds.items.forEach(it => (it.x = ds.tf ? ds.tf(it.raw) : it.raw.slice()));
    const n = ds.feats.length, N = ds.items.length;
    const mu = [], sd = [];
    for (let j = 0; j < n; j++) {
      const col = ds.items.map(it => it.x[j]);
      const m = col.reduce((a, b) => a + b, 0) / N;
      mu.push(m);
      sd.push(Math.sqrt(col.reduce((a, b) => a + (b - m) ** 2, 0) / (N - 1)) || 1);
    }
    ds.items.forEach(it => (it.z = it.x.map((x, j) => (x - mu[j]) / sd[j])));
    return ds;
  }
  const members = (ds, g) => (g === "all" ? ds.items : ds.items.filter(it => it.g === g));

  function shuffle(n, rng) {
    const idx = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx;
  }

  const cache = {};
  // Overlap between two random r-dimensional subspaces of R^n: mean and 5th-95th percentiles, also for cos θ₁.
  function floorStats(n, r) {
    const key = "f" + n + "_" + r;
    if (!cache[key]) {
      const rng = mulberry32(11 * n + r);
      const runs = [...Array(400)].map(() => compare(randomBasis(n, r, rng), randomBasis(n, r, rng)));
      cache[key] = { ...stats(runs.map(c => c.F)), c1: stats(runs.map(c => c.s[0])) };
    }
    return cache[key];
  }
  // Overlap between the top-r principal subspaces of two random halves of Z; null if a half is too small.
  function ceilStats(key, Z, r) {
    key = "c" + key + "_" + r;
    if (!(key in cache)) {
      const half = Math.floor(Z.length / 2);
      if (half < r + 2) return (cache[key] = null);
      const rng = mulberry32(97 + r);
      cache[key] = stats([...Array(80)].map(() => {
        const idx = shuffle(Z.length, rng);
        return compare(pca(idx.slice(0, half).map(i => Z[i]), r).U, pca(idx.slice(half).map(i => Z[i]), r).U).F;
      }));
    }
    return cache[key];
  }

  const api = { dot, norm, mulberry32, gauss, jacobi, signFix, pca, gramSchmidt, randomBasis, combine, compare, stats,
    prepare, members, shuffle, floorStats, ceilStats };
  if (typeof module !== "undefined") module.exports = api;
  else root.Subspace = api;
})(globalThis);
