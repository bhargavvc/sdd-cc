---
type: Fixed
pr: 3293
---
**`sdd-tools.cjs` and CJS fallback bridge work again post-install** — the install manifest now copies `sdk/shared/model-catalog.json` into the sdd payload at `sdd/bin/shared/model-catalog.json`, and `model-catalog.cjs` uses a resolve chain (co-located install path → source-repo dev path → `SDD_MODEL_CATALOG` env override). Regression introduced by #3230.
