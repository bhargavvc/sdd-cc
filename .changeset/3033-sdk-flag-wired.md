---
type: Fixed
pr: 3033
---
**`--sdk` flag now wired into SDK deployment** — `hasSdk` was parsed in `bin/install.js` but never passed to `installSdkIfNeeded`, so `npx @bhargavvc/sdd-cc@latest --sdk` silently skipped SDK deployment and produced a misleading "✓ SDD SDK ready" message. `installSdkIfNeeded` now accepts `forceSdk: true` (set when `--sdk` is passed), which bypasses the local-install soft-skip and runs the full shim-link path so `sdd-sdk` is materialized on PATH. The `#2678` soft-skip for local installs without `--sdk` is preserved. (#3033)
