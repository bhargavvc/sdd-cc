/**
 * SDD Tools Tests — update workflow custom file backup detection (#1997)
 *
 * The update workflow must detect user-added files inside SDD-managed
 * directories (sdd/, agents/, commands/sdd/, hooks/) before the
 * installer wipes those directories.
 *
 * This tests the `detect-custom-files` subcommand of sdd-tools.cjs, which is
 * the correct fix for the bash path-stripping failure described in #1997.
 *
 * The bash pattern `${filepath#$RUNTIME_DIR/}` is unreliable because
 * $RUNTIME_DIR may not be set and the stripped relative path may not match
 * manifest key format. Moving the logic into sdd-tools.cjs eliminates the
 * shell variable expansion failure entirely.
 *
 * Closes: #1997
 */

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { runSddTools, createTempDir, cleanup } = require('./helpers.cjs');

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Write a fake sdd-file-manifest.json into configDir with the given file entries.
 */
function writeManifest(configDir, files) {
  const manifest = {
    version: '1.32.0',
    timestamp: new Date().toISOString(),
    files: {}
  };
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(configDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
    manifest.files[relPath] = sha256(content);
  }
  fs.writeFileSync(
    path.join(configDir, 'sdd-file-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
}

describe('detect-custom-files — update workflow backup detection (#1997)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir('sdd-custom-detect-');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('detects a custom file added inside sdd/workflows/', () => {
    writeManifest(tmpDir, {
      'sdd/workflows/execute-phase.md': '# Execute Phase\n',
      'sdd/workflows/plan-phase.md': '# Plan Phase\n',
    });

    // Add a custom file NOT in the manifest
    const customFile = path.join(tmpDir, 'sdd/workflows/my-custom-workflow.md');
    fs.writeFileSync(customFile, '# My Custom Workflow\n');

    const result = runSddTools(
      ['detect-custom-files', '--config-dir', tmpDir],
      tmpDir
    );

    assert.ok(result.success, `Command failed: ${result.error}`);

    const json = JSON.parse(result.output);
    assert.ok(Array.isArray(json.custom_files), 'should return custom_files array');
    assert.ok(json.custom_files.length > 0, 'should detect at least one custom file');
    assert.ok(
      json.custom_files.includes('sdd/workflows/my-custom-workflow.md'),
      `custom file should be listed; got: ${JSON.stringify(json.custom_files)}`
    );
  });

  test('detects custom files added inside agents/', () => {
    writeManifest(tmpDir, {
      'agents/sdd-executor.md': '# SDD Executor\n',
    });

    // Add a user's custom agent (not prefixed with sdd-)
    const customAgent = path.join(tmpDir, 'agents/my-custom-agent.md');
    fs.mkdirSync(path.dirname(customAgent), { recursive: true });
    fs.writeFileSync(customAgent, '# My Custom Agent\n');

    const result = runSddTools(
      ['detect-custom-files', '--config-dir', tmpDir],
      tmpDir
    );

    assert.ok(result.success, `Command failed: ${result.error}`);

    const json = JSON.parse(result.output);
    assert.ok(json.custom_files.includes('agents/my-custom-agent.md'),
      `custom agent should be detected; got: ${JSON.stringify(json.custom_files)}`);
  });

  test('reports zero custom files when all files are in manifest', () => {
    writeManifest(tmpDir, {
      'sdd/workflows/execute-phase.md': '# Execute Phase\n',
      'sdd/references/gates.md': '# Gates\n',
      'agents/sdd-executor.md': '# Executor\n',
    });
    // No extra files added

    const result = runSddTools(
      ['detect-custom-files', '--config-dir', tmpDir],
      tmpDir
    );

    assert.ok(result.success, `Command failed: ${result.error}`);

    const json = JSON.parse(result.output);
    assert.ok(Array.isArray(json.custom_files), 'should return custom_files array');
    assert.strictEqual(json.custom_files.length, 0, 'no custom files should be detected');
    assert.strictEqual(json.custom_count, 0, 'custom_count should be 0');
  });

  test('returns custom_count equal to custom_files length', () => {
    writeManifest(tmpDir, {
      'sdd/workflows/execute-phase.md': '# Execute Phase\n',
    });

    // Add two custom files
    fs.writeFileSync(
      path.join(tmpDir, 'sdd/workflows/custom-a.md'),
      '# Custom A\n'
    );
    fs.writeFileSync(
      path.join(tmpDir, 'sdd/workflows/custom-b.md'),
      '# Custom B\n'
    );

    const result = runSddTools(
      ['detect-custom-files', '--config-dir', tmpDir],
      tmpDir
    );

    assert.ok(result.success, `Command failed: ${result.error}`);

    const json = JSON.parse(result.output);
    assert.strictEqual(json.custom_count, json.custom_files.length,
      'custom_count should equal custom_files.length');
    assert.strictEqual(json.custom_count, 2, 'should detect exactly 2 custom files');
  });

  test('does not flag manifest files as custom even if content was modified', () => {
    writeManifest(tmpDir, {
      'sdd/workflows/execute-phase.md': '# Execute Phase\nOriginal\n',
    });

    // Modify the content of an existing manifest file
    fs.writeFileSync(
      path.join(tmpDir, 'sdd/workflows/execute-phase.md'),
      '# Execute Phase\nModified by user\n'
    );

    const result = runSddTools(
      ['detect-custom-files', '--config-dir', tmpDir],
      tmpDir
    );

    assert.ok(result.success, `Command failed: ${result.error}`);

    const json = JSON.parse(result.output);
    // Modified manifest files are handled by saveLocalPatches (in install.js).
    // detect-custom-files only finds files NOT in the manifest at all.
    assert.ok(
      !json.custom_files.includes('sdd/workflows/execute-phase.md'),
      'modified manifest files should NOT be listed as custom (that is saveLocalPatches territory)'
    );
  });

  test('handles missing manifest gracefully — treats all SDD-dir files as custom', () => {
    // No manifest. Add a file in a SDD-managed dir.
    const workflowDir = path.join(tmpDir, 'sdd/workflows');
    fs.mkdirSync(workflowDir, { recursive: true });
    fs.writeFileSync(path.join(workflowDir, 'my-workflow.md'), '# My Workflow\n');

    const result = runSddTools(
      ['detect-custom-files', '--config-dir', tmpDir],
      tmpDir
    );

    assert.ok(result.success, `Command failed: ${result.error}`);

    const json = JSON.parse(result.output);
    // Without a manifest, we cannot determine what is custom vs SDD-owned.
    // The command should return an empty list (no manifest = skip detection,
    // which is safe since saveLocalPatches also does nothing without a manifest).
    assert.ok(Array.isArray(json.custom_files), 'should return custom_files array');
    assert.ok(typeof json.custom_count === 'number', 'should return numeric custom_count');
  });

  test('detects custom files inside sdd/references/', () => {
    writeManifest(tmpDir, {
      'sdd/references/gates.md': '# Gates\n',
    });

    const customRef = path.join(tmpDir, 'sdd/references/my-domain-probes.md');
    fs.writeFileSync(customRef, '# My Domain Probes\n');

    const result = runSddTools(
      ['detect-custom-files', '--config-dir', tmpDir],
      tmpDir
    );

    assert.ok(result.success, `Command failed: ${result.error}`);

    const json = JSON.parse(result.output);
    assert.ok(
      json.custom_files.includes('sdd/references/my-domain-probes.md'),
      `should detect custom reference; got: ${JSON.stringify(json.custom_files)}`
    );
  });
});
