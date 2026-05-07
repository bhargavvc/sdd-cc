---
type: Fixed
pr: 2994
---
/sdd-reapply-patches Step 5 verifier now resolves at runtime — moved scripts/verify-reapply-patches.cjs to sdd/bin/ which is shipped by the installer. The legacy scripts/ directory is not copied to user installs. See #2994.
