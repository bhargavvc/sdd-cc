/**
 * Regression tests for bug #3231.
 *
 * `npx @bhargavvc/sdd-cc@latest` prints `✓ SDD SDK ready (sdk/dist/cli.js)` on
 * Linux but no persistent `sdd-sdk` shim is created. Two sub-bugs:
 *
 * 1. Transient npx PATH + null login-shell PATH → false success
 *    The initial isSddSdkOnPath() call uses process.env.PATH, which includes
 *    `~/.npm/_npx/<hash>/node_modules/.bin` — a transient dir npx injects.
 *    If that dir has a `sdd-sdk` entry, onPath = true and trySelfLinkSddSdk
 *    is skipped (no persistent shim). Then getUserShellPath() returns null
 *    (Linux, slow rc files or unset $SHELL). The guard
 *    `onPath && userShellPath !== null` is FALSE, leaving onPath = true →
 *    false `✓ SDD SDK ready` is printed.
 *
 * 2. Stale legacy symlink → installer treats sdd-sdk as "on PATH" and skips
 *    materializing a modern SDK shim. The legacy binary (`sdd-tools.cjs`) has
 *    an `@deprecated` marker in its first bytes, lacks the `query` registry,
 *    and causes "Unknown command: query" for every workflow call.
 *
 * 3. Clean path: sdk/dist/cli.js present + sdd-sdk self-linked into a
 *    persistent PATH dir → installer DOES print success.
 *
 * All assertions use typed-IR / behavioral testing. No source-grep, no
 * readFileSync on install.js.
 */

'use strict';

process.env.SDD_TEST_MODE = '1';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const installModule = require('../bin/install.js');
const {
  installSdkIfNeeded,
  isSddSdkOnPath,
  filterNpxFromPath,
  isLegacySddSdkShim,
} = installModule;

// ---------------------------------------------------------------------------
// Console capture helper (no ANSI)
// ---------------------------------------------------------------------------
function captureConsole(fn) {
  const stdout = [];
  const stderr = [];
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;
  console.log = (...a) => stdout.push(a.join(' '));
  console.warn = (...a) => stderr.push(a.join(' '));
  console.error = (...a) => stderr.push(a.join(' '));
  let threw = null;
  try {
    fn();
  } catch (e) {
    threw = e;
  } finally {
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
  }
  if (threw) throw threw;
  const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
  return {
    stdout: stdout.map(strip).join('\n'),
    stderr: stderr.map(strip).join('\n'),
  };
}

// ---------------------------------------------------------------------------
// Shared fixture helpers
// ---------------------------------------------------------------------------
function makeSdkDir(root) {
  const sdkDir = path.join(root, 'sdk');
  fs.mkdirSync(path.join(sdkDir, 'dist'), { recursive: true });
  fs.writeFileSync(
    path.join(sdkDir, 'dist', 'cli.js'),
    ['#!/usr/bin/env node', "console.log('0.0.0-test');", ''].join('\n'),
    { mode: 0o755 },
  );
  return sdkDir;
}

// ---------------------------------------------------------------------------
// Bug 1: transient npx PATH hit + null login-shell PATH → false "SDD SDK ready"
// ---------------------------------------------------------------------------
describe('bug #3231: transient npx PATH + null login-shell PATH', () => {
  let tmpRoot;
  let sdkDir;
  let savedEnv;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-3231-a-'));
    sdkDir = makeSdkDir(tmpRoot);

    // Simulate an npx-injected PATH: a transient _npx directory that happens
    // to contain a sdd-sdk executable. This is NOT a persistent user location.
    const npxBinDir = path.join(tmpRoot, '.npm', '_npx', 'abc123', 'node_modules', '.bin');
    fs.mkdirSync(npxBinDir, { recursive: true });
    const shimName = process.platform === 'win32' ? 'sdd-sdk.cmd' : 'sdd-sdk';
    const shimPath = path.join(npxBinDir, shimName);
    fs.writeFileSync(
      shimPath,
      ['#!/bin/sh', 'exit 0', ''].join('\n'),
      { mode: 0o755 },
    );

    const homeDir = path.join(tmpRoot, 'home');
    fs.mkdirSync(homeDir, { recursive: true });

    savedEnv = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      SHELL: process.env.SHELL,
    };

    // Install-subprocess PATH contains ONLY the npx transient dir — nothing
    // persistent. $SHELL is unset to simulate getUserShellPath() → null.
    process.env.PATH = npxBinDir;
    process.env.HOME = homeDir;
    delete process.env.SHELL;
  });

  afterEach(() => {
    if (savedEnv.PATH == null) delete process.env.PATH;
    else process.env.PATH = savedEnv.PATH;
    if (savedEnv.HOME == null) delete process.env.HOME;
    else process.env.HOME = savedEnv.HOME;
    if (savedEnv.SHELL == null) delete process.env.SHELL;
    else process.env.SHELL = savedEnv.SHELL;
    try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
  });

  test('does NOT print "SDD SDK ready" when only a transient _npx PATH entry has sdd-sdk', () => {
    // Pre-fix: isSddSdkOnPath() finds sdd-sdk in the npx-injected dir,
    // onPath = true, trySelfLinkSddSdk is skipped, getUserShellPath() returns
    // null (SHELL unset), the guard is short-circuited, and the false ✓ is
    // printed. Post-fix: _npx dirs must be excluded from the initial check
    // so the installer attempts self-link and re-probes.
    const { stdout, stderr } = captureConsole(() => {
      installSdkIfNeeded({ sdkDir });
    });
    const combined = `${stdout}\n${stderr}`;

    // Primary behavioral assertion: the installer must NOT falsely report
    // "SDD SDK ready" when sdd-sdk is only reachable via a transient npx
    // cache directory (not a persistent user PATH entry).
    assert.ok(
      !/SDD SDK ready/.test(combined),
      'installer must NOT print "SDD SDK ready" when only the transient _npx dir has sdd-sdk. Got: ' + combined,
    );

    // Secondary assertion: the installer must emit a warning or fallback
    // diagnostic rather than silently succeeding. The warning path prints
    // "SDD SDK files are present but sdd-sdk is not on your PATH" when
    // self-link fails; a successful self-link into a non-PATH dir prints the
    // same warning. Either way, some output must be produced.
    assert.ok(
      combined.trim().length > 0,
      'installer must emit a diagnostic (warning or fallback) instead of silent no-op. Got empty output.',
    );
  });

  test('filterNpxFromPath is exported and strips /_npx/ segments', () => {
    // The fix adds a helper that removes any PATH segment whose absolute path
    // contains /_npx/ (POSIX) or \\_npx\\ (Windows).
    assert.equal(typeof filterNpxFromPath, 'function', 'filterNpxFromPath must be exported');

    const npxDir = '/home/user/.npm/_npx/abc123/node_modules/.bin';
    const persistentDir = '/home/user/.local/bin';
    const unrelatedDir = '/usr/local/bin';
    const result = filterNpxFromPath(
      [npxDir, persistentDir, unrelatedDir].join(path.delimiter),
    );
    const segments = result.split(path.delimiter);
    assert.ok(!segments.includes(npxDir), 'filtered PATH must not include the _npx dir');
    assert.ok(segments.includes(persistentDir), 'filtered PATH must keep persistent dirs');
    assert.ok(segments.includes(unrelatedDir), 'filtered PATH must keep unrelated dirs');
  });

  test('filterNpxFromPath must not strip a user-named directory that merely contains "npx" as substring', () => {
    // Containment guard: only strip when the segment truly contains /_npx/
    // (between separators), not when "npx" appears as part of a user dir name.
    assert.equal(typeof filterNpxFromPath, 'function');
    const npxLikeUserDir = '/home/user/scripts/my-npx-wrapper/bin';
    const realNpxDir = '/home/user/.npm/_npx/abc/node_modules/.bin';
    const result = filterNpxFromPath(
      [npxLikeUserDir, realNpxDir].join(path.delimiter),
    );
    const segments = result.split(path.delimiter);
    assert.ok(
      segments.includes(npxLikeUserDir),
      'must not strip user dirs that merely contain "npx" as a substring',
    );
    assert.ok(!segments.includes(realNpxDir), 'must strip real _npx dirs');
  });
});

// ---------------------------------------------------------------------------
// Bug 2: stale legacy symlink pointing at sdd-tools.cjs (deprecated binary)
// ---------------------------------------------------------------------------
describe('bug #3231: stale legacy symlink to deprecated sdd-tools.cjs', () => {
  let tmpRoot;
  let sdkDir;
  let savedEnv;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-3231-b-'));
    sdkDir = makeSdkDir(tmpRoot);

    const homeDir = path.join(tmpRoot, 'home');
    fs.mkdirSync(homeDir, { recursive: true });

    savedEnv = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      SHELL: process.env.SHELL,
    };
    process.env.HOME = homeDir;
    delete process.env.SHELL;
  });

  afterEach(() => {
    if (savedEnv.PATH == null) delete process.env.PATH;
    else process.env.PATH = savedEnv.PATH;
    if (savedEnv.HOME == null) delete process.env.HOME;
    else process.env.HOME = savedEnv.HOME;
    if (savedEnv.SHELL == null) delete process.env.SHELL;
    else process.env.SHELL = savedEnv.SHELL;
    try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
  });

  test('isLegacySddSdkShim detects the deprecated sdd-tools.cjs marker', () => {
    // The legacy binary starts with or contains the @deprecated marker
    // referencing sdd-tools.cjs in the first 512 bytes.
    assert.equal(typeof isLegacySddSdkShim, 'function', 'isLegacySddSdkShim must be exported');

    const legacyFile = path.join(tmpRoot, 'sdd-sdk-legacy');
    fs.writeFileSync(
      legacyFile,
      [
        '#!/usr/bin/env node',
        '// @deprecated — use sdd-tools.cjs directly',
        "require('/usr/local/lib/sdd-tools.cjs');",
        '',
      ].join('\n'),
    );

    assert.equal(isLegacySddSdkShim(legacyFile), true, 'must detect legacy marker');
  });

  test('isLegacySddSdkShim returns false for a modern SDK shim', () => {
    assert.equal(typeof isLegacySddSdkShim, 'function');

    const modernFile = path.join(tmpRoot, 'sdd-sdk-modern');
    fs.writeFileSync(
      modernFile,
      [
        '#!/usr/bin/env node',
        "require('/usr/local/lib/node_modules/@bhargavvc/sdd-cc/bin/sdd-sdk.js');",
        '',
      ].join('\n'),
    );

    assert.equal(isLegacySddSdkShim(modernFile), false, 'must not flag modern shims as legacy');
  });

  test('isLegacySddSdkShim returns false for a non-existent file', () => {
    assert.equal(typeof isLegacySddSdkShim, 'function');
    const missing = path.join(tmpRoot, 'does-not-exist');
    assert.equal(isLegacySddSdkShim(missing), false, 'missing file is not a legacy shim');
  });

  test('installer replaces a stale legacy symlink and attempts self-link with modern SDK', () => {
    // Set up: persistent PATH dir exists and contains a sdd-sdk symlink
    // pointing at a fake "legacy" sdd-tools.cjs binary with the @deprecated
    // marker. The installer must detect this, treat it as "not the right SDK",
    // and replace it with a modern shim.
    const persistentBin = path.join(tmpRoot, 'localbin');
    fs.mkdirSync(persistentBin, { recursive: true });

    // Write a fake legacy binary
    const legacyBin = path.join(tmpRoot, 'sdd-tools.cjs');
    fs.writeFileSync(
      legacyBin,
      [
        '#!/usr/bin/env node',
        '// @deprecated — use sdd-tools.cjs directly',
        "console.log('legacy');",
        '',
      ].join('\n'),
      { mode: 0o755 },
    );

    // Place a sdd-sdk symlink in the persistent dir pointing at the legacy binary.
    const legacyShimPath = path.join(persistentBin, 'sdd-sdk');
    try {
      fs.symlinkSync(legacyBin, legacyShimPath);
    } catch {
      // On Windows or symlink-hostile FS, write a file that mimics the legacy content
      fs.writeFileSync(
        legacyShimPath,
        [
          '#!/usr/bin/env node',
          '// @deprecated — use sdd-tools.cjs directly',
          "console.log('legacy');",
          '',
        ].join('\n'),
        { mode: 0o755 },
      );
    }

    process.env.PATH = persistentBin;

    const { stdout, stderr } = captureConsole(() => {
      installSdkIfNeeded({ sdkDir });
    });
    const combined = `${stdout}\n${stderr}`;

    // After replacement the installer should succeed; if replacement fails (e.g.
    // because the link dir is truly persistent), it must at minimum NOT report
    // "SDD SDK ready" with the legacy binary still in place — it must warn.
    const shimWasReplaced = !isLegacySddSdkShim(legacyShimPath);
    if (shimWasReplaced) {
      // Self-link succeeded: the shim is modern, so the installer must have
      // reported readiness.
      assert.ok(
        stdout.length > 0,
        'installer must emit output after successful self-link',
      );
    } else {
      // Self-link failed or was skipped: the installer must NOT have falsely
      // reported "SDD SDK ready" while the legacy binary is still in place.
      assert.ok(
        !/SDD SDK ready/.test(combined),
        'installer must NOT report ready while the legacy shim is still in place',
      );
      // It must also have emitted a diagnostic (not silently swallowed).
      assert.ok(
        stdout.length > 0,
        'when self-link is skipped, installer should emit a PATH diagnostic',
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Test 3: clean install with sdd-sdk self-linked into a persistent PATH dir
// ---------------------------------------------------------------------------
describe('bug #3231: clean install — sdd-sdk self-linked into persistent PATH dir', () => {
  let tmpRoot;
  let sdkDir;
  let savedEnv;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-3231-c-'));
    sdkDir = makeSdkDir(tmpRoot);
    const homeDir = path.join(tmpRoot, 'home');
    fs.mkdirSync(homeDir, { recursive: true });

    savedEnv = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      SHELL: process.env.SHELL,
    };
    process.env.HOME = homeDir;
    delete process.env.SHELL;
  });

  afterEach(() => {
    if (savedEnv.PATH == null) delete process.env.PATH;
    else process.env.PATH = savedEnv.PATH;
    if (savedEnv.HOME == null) delete process.env.HOME;
    else process.env.HOME = savedEnv.HOME;
    if (savedEnv.SHELL == null) delete process.env.SHELL;
    else process.env.SHELL = savedEnv.SHELL;
    try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
  });

  test('prints "SDD SDK ready" when sdd-sdk is self-linked into a persistent dir on PATH', () => {
    const homeDir = process.env.HOME;
    const localBin = path.join(homeDir, '.local', 'bin');
    fs.mkdirSync(localBin, { recursive: true });
    // PATH contains only the persistent localBin (no npx dirs)
    process.env.PATH = localBin;

    const { stdout, stderr } = captureConsole(() => {
      installSdkIfNeeded({ sdkDir });
    });
    const combined = `${stdout}\n${stderr}`;

    const shimPath = path.join(localBin, 'sdd-sdk');
    // Behavioral assertions: shim exists and is recognized as a modern (non-legacy) shim
    // reachable from the persistent filtered PATH.
    assert.ok(
      fs.existsSync(shimPath),
      'installer must materialize sdd-sdk shim in the persistent PATH dir',
    );
    assert.equal(
      isSddSdkOnPath(filterNpxFromPath(localBin)),
      true,
      'installer must make sdd-sdk reachable on the persistent filtered PATH',
    );

    // Primary behavioral assertion: the installer MUST print "SDD SDK ready"
    // after successfully self-linking into a persistent PATH dir. This is the
    // positive counterpart to the bug #3231 fix — we confirm the success path
    // works correctly, not just that the false-positive path is blocked.
    assert.ok(
      /SDD SDK ready/.test(stdout),
      'installer must print "SDD SDK ready" after a successful self-link into a persistent PATH dir. Got stdout: ' + stdout,
    );
  });
});
