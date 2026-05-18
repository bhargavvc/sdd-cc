---
type: Fixed
pr: 3363
---
**Installer SDK readiness now detects stale `sdd-sdk` executables earlier on PATH** — when the resolved `sdd-sdk --version` differs from the package/runtime version being installed, the installer withholds the ready message and prints the resolved path, detected version, expected version, and global update remediation. (#3359)
