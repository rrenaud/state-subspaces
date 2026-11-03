# state-subspaces

An explainer for **principal angles between subspaces**, worked on the 50 US states.

Each state is a point in 8 dimensions (log population, log density, median household income, median age,
bachelor's share, urban share, 65+ share, poverty rate), z-scored across all 50. Each Census region's top
r principal components span a subspace. The page compares those subspaces with principal angles and an
overlap score, ‖U₁ᵀU₂‖²_F / r, and judges each score against two baselines:
- the random floor, r/n;
- a split-half ceiling.

It also lets you:
- rotate a basis to see that the angles don't depend on it;
- plot every state projected onto each subspace.

The state figures are approximate, typed from memory for illustration. Don't cite them.

## Run

Live at https://rrenaud.github.io/state-subspaces/, or open `index.html` in a browser. There is no build step and no dependencies; the page loads fonts from Google Fonts.

```sh
node --test test/*.test.js   # math checks and the write-up's headline numbers
node scripts/report.js       # every number in the "Reading the state subspaces" section
```

## Layout

| path | what |
|---|---|
| `index.html`, `style.css` | the page |
| `js/subspace.js` | the math (Jacobi eigendecomposition, PCA, principal angles) plus the random floor and split-half ceiling |
| `js/states.js` | the data, grouped by Census region |
| `js/app.js` | the interactive tool |
| `scripts/report.js` | the national directions and each region against the nation, with size-matched random groups |
| `test/subspace.test.js` | `node:test` checks |

Both `js/subspace.js` and `js/states.js` work as browser globals (`Subspace`, `STATES`) and as CommonJS modules.

## Origin

The page started as part of an explainer on comparing LoRA adapters trained on different domains. An adapter's update
writes into a subspace, so the same comparison applies.
