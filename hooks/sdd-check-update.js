#!/usr/bin/env node
// sdd-hook-version: {{SDD_VERSION}}
// Check for SDD updates in background, write result to cache
// Called by SessionStart hook - runs once per session

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const homeDir = os.homedir();
const cwd = process.cwd();

// Detect runtime config directory (supports Claude, OpenCode, Kilo, Gemini)
// Respects CLAUDE_CONFIG_DIR for custom config directory setups
function detectConfigDir(baseDir) {
  // Check env override first (supports multi-account setups)
  const envDir = process.env.CLAUDE_CONFIG_DIR;
  if (envDir && fs.existsSync(path.join(envDir, 'sdd', 'VERSION'))) {
    return envDir;
  }
  for (const dir of ['.claude', '.gemini', '.config/kilo', '.kilo', '.config/opencode', '.opencode']) {
    if (fs.existsSync(path.join(baseDir, dir, 'sdd', 'VERSION'))) {
      return path.join(baseDir, dir);
    }
  }
  return envDir || path.join(baseDir, '.claude');
}

const globalConfigDir = detectConfigDir(homeDir);
const projectConfigDir = detectConfigDir(cwd);
// Use a shared, tool-agnostic cache directory to avoid multi-runtime
// resolution mismatches where check-update writes to one runtime's cache
// but statusline reads from another (#1421).
const cacheDir = path.join(homeDir, '.cache', 'sdd');
const cacheFile = path.join(cacheDir, 'sdd-update-check.json');

// VERSION file locations (check project first, then global)
const projectVersionFile = path.join(projectConfigDir, 'sdd', 'VERSION');
const globalVersionFile = path.join(globalConfigDir, 'sdd', 'VERSION');

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Run check in background via a dedicated worker script.
// Spawning a file (rather than node -e '<inline code>') keeps the worker logic
// in plain JS with no template-literal regex-escaping concerns, and makes the
// worker independently testable.
const workerPath = path.join(__dirname, 'sdd-check-update-worker.js');
const child = spawn(process.execPath, [workerPath], {
  stdio: 'ignore',
  windowsHide: true,
  detached: true,  // Required on Windows for proper process detachment
  env: {
    ...process.env,
    SDD_CACHE_FILE: cacheFile,
    SDD_PROJECT_VERSION_FILE: projectVersionFile,
    SDD_GLOBAL_VERSION_FILE: globalVersionFile,
  },
});

child.unref();
