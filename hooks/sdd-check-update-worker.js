#!/usr/bin/env node
// sdd-hook-version: {{SDD_VERSION}}
// Background worker spawned by sdd-check-update.js (SessionStart hook).
// Checks for SDD updates and stale hooks, writes result to cache file.
// Receives paths via environment variables set by the parent hook.
//
// Using a separate file (rather than node -e '<inline code>') avoids the
// template-literal regex-escaping problem: regex source is plain JS here.

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const cacheFile = process.env.SDD_CACHE_FILE;
const projectVersionFile = process.env.SDD_PROJECT_VERSION_FILE;
const globalVersionFile = process.env.SDD_GLOBAL_VERSION_FILE;

// Compare semver: true if a > b (a is strictly newer than b)
// Strips pre-release suffixes (e.g. '3-beta.1' → '3') to avoid NaN from Number()
function isNewer(a, b) {
  const pa = (a || '').split('.').map(s => Number(s.replace(/-.*/, '')) || 0);
  const pb = (b || '').split('.').map(s => Number(s.replace(/-.*/, '')) || 0);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return true;
    if (pa[i] < pb[i]) return false;
  }
  return false;
}

// Check project directory first (local install), then global
let installed = '0.0.0';
let configDir = '';
try {
  if (fs.existsSync(projectVersionFile)) {
    installed = fs.readFileSync(projectVersionFile, 'utf8').trim();
    configDir = path.dirname(path.dirname(projectVersionFile));
  } else if (fs.existsSync(globalVersionFile)) {
    installed = fs.readFileSync(globalVersionFile, 'utf8').trim();
    configDir = path.dirname(path.dirname(globalVersionFile));
  }
} catch (e) {}

// Check for stale hooks — compare hook version headers against installed VERSION
// Hooks are installed at configDir/hooks/ (e.g. ~/.claude/hooks/) (#1421)
// Only check hooks that SDD currently ships — orphaned files from removed features
// (e.g., sdd-intel-*.js) must be ignored to avoid permanent stale warnings (#1750)
const MANAGED_HOOKS = [
  'sdd-check-update-worker.js',
  'sdd-check-update.js',
  'sdd-context-monitor.js',
  'sdd-phase-boundary.sh',
  'sdd-prompt-guard.js',
  'sdd-read-guard.js',
  'sdd-read-injection-scanner.js',
  'sdd-session-state.sh',
  'sdd-statusline.js',
  'sdd-validate-commit.sh',
  'sdd-workflow-guard.js',
];

let staleHooks = [];
if (configDir) {
  const hooksDir = path.join(configDir, 'hooks');
  try {
    if (fs.existsSync(hooksDir)) {
      const hookFiles = fs.readdirSync(hooksDir).filter(f => MANAGED_HOOKS.includes(f));
      for (const hookFile of hookFiles) {
        try {
          const content = fs.readFileSync(path.join(hooksDir, hookFile), 'utf8');
          // Match both JS (//) and bash (#) comment styles
          const versionMatch = content.match(/(?:\/\/|#) sdd-hook-version:\s*(.+)/);
          if (versionMatch) {
            const hookVersion = versionMatch[1].trim();
            if (isNewer(installed, hookVersion) && !hookVersion.includes('{{')) {
              staleHooks.push({ file: hookFile, hookVersion, installedVersion: installed });
            }
          } else {
            // No version header at all — definitely stale (pre-version-tracking)
            staleHooks.push({ file: hookFile, hookVersion: 'unknown', installedVersion: installed });
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
}

let latest = null;
try {
  latest = execFileSync('npm', ['view', '@bhargavvc/sdd-cc', 'version'], {
    encoding: 'utf8',
    timeout: 10000,
    windowsHide: true,
  }).trim();
} catch (e) {}

const result = {
  update_available: latest && isNewer(latest, installed),
  installed,
  latest: latest || 'unknown',
  checked: Math.floor(Date.now() / 1000),
  stale_hooks: staleHooks.length > 0 ? staleHooks : undefined,
};

if (cacheFile) {
  try { fs.writeFileSync(cacheFile, JSON.stringify(result)); } catch (e) {}
}
