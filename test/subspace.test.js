"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../js/subspace.js");
const STATES = S.prepare(require("../js/states.js"));

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);
const h = Math.SQRT1_2;

test("worked example: floor plane vs the plane tilted 45° about x", () => {
  const c = S.compare([[1, 0, 0], [0, 1, 0]], [[1, 0, 0], [0, h, h]]);
  close(c.s[0], 1); close(c.s[1], h); close(c.F, 0.75);
});

test("a different basis for S1 changes U1ᵀU2 but not the angles", () => {
  const S2 = [[1, 0, 0], [0, h, h]];
  const a = S.compare([[1, 0, 0], [0, 1, 0]], S2), b = S.compare([[h, h, 0], [h, -h, 0]], S2);
  assert.notDeepEqual(a.M, b.M);
  a.s.forEach((x, i) => close(x, b.s[i]));
  close(a.F, b.F);
});

test("random rotations of a basis leave angles unchanged", () => {
  const rng = S.mulberry32(3);
  const U1 = S.randomBasis(8, 3, rng), U2 = S.randomBasis(8, 3, rng), R = S.randomBasis(3, 3, rng);
  const a = S.compare(U1, U2), b = S.compare(R.map(row => S.combine(U1, row)), U2);
  a.s.forEach((x, i) => close(x, b.s[i], 1e-9));
});

test("principal vectors are unit length and pair up with cosine = singular value", () => {
  const rng = S.mulberry32(4);
  const c = S.compare(S.randomBasis(8, 3, rng), S.randomBasis(8, 3, rng));
  c.a.forEach((v, i) => { close(S.norm(v), 1, 1e-9); close(S.norm(c.b[i]), 1, 1e-9); close(S.dot(v, c.b[i]), c.s[i], 1e-9); });
});

test("identical and orthogonal subspaces score 1 and 0", () => {
  close(S.compare([[1, 0, 0, 0], [0, 1, 0, 0]], [[0, 1, 0, 0], [1, 0, 0, 0]]).F, 1);
  close(S.compare([[1, 0, 0, 0], [0, 1, 0, 0]], [[0, 0, 1, 0], [0, 0, 0, 1]]).F, 0);
});

test("random subspaces average r/n", () => {
  for (const [n, r] of [[8, 1], [8, 2], [8, 3], [20, 2]]) close(S.floorStats(n, r).mean, r / n, 0.03);
});

test("jacobi reconstructs a symmetric matrix", () => {
  const A = [[4, 1, 2], [1, 3, 0.5], [2, 0.5, 5]], e = S.jacobi(A);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
    close(e.vecs.reduce((t, v, k) => t + e.vals[k] * v[i] * v[j], 0), A[i][j], 1e-9);
  assert.ok(e.vals[0] >= e.vals[1] && e.vals[1] >= e.vals[2]);
});

test("state data: 50 states, 8 features, four regions", () => {
  assert.equal(STATES.items.length, 50);
  STATES.items.forEach(it => assert.equal(it.z.length, 8));
  assert.deepEqual(["N", "M", "S", "W"].map(g => S.members(STATES, g).length), [9, 12, 16, 13]);
  assert.equal(Object.keys(STATES.postal).length, 50);
});

test("the write-up's headline numbers still hold", () => {
  const Z = g => S.members(STATES, g).map(it => it.z);
  const nat = S.pca(Z("all"), 2).U;
  const top = v => v.map((x, i) => [Math.abs(x), STATES.feats[i]]).sort((a, b) => b[0] - a[0]).slice(0, 3).map(t => t[1]);
  assert.deepEqual(top(nat[0]).sort(), ["Bachelor's", "Income", "Urban"]);
  close(S.compare(nat, S.pca(Z("S"), 2).U).F, 0.94, 0.01);
  close(S.compare(S.pca(Z("all"), 1).U, S.pca(Z("M"), 1).U).F, 0.14, 0.01);
});
