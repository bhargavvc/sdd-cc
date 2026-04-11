process.env.SDD_TEST_MODE = '1';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createTempDir, cleanup } = require('./helpers.cjs');

const {
  getDirName,
  getGlobalDir,
  getConfigDirFromHome,
  install,
  uninstall,
  writeManifest,
} = require('../bin/install.js');

describe('Qwen Code runtime directory mapping', () => {
  test('maps Qwen to .qwen for local installs', () => {
    assert.strictEqual(getDirName('qwen'), '.qwen');
  });

  test('maps Qwen to ~/.qwen for global installs', () => {
    assert.strictEqual(getGlobalDir('qwen'), path.join(os.homedir(), '.qwen'));
  });

  test('returns .qwen config fragments for local and global installs', () => {
    assert.strictEqual(getConfigDirFromHome('qwen', false), "'.qwen'");
    assert.strictEqual(getConfigDirFromHome('qwen', true), "'.qwen'");
  });
});

describe('getGlobalDir (Qwen Code)', () => {
  let originalQwenConfigDir;

  beforeEach(() => {
    originalQwenConfigDir = process.env.QWEN_CONFIG_DIR;
  });

  afterEach(() => {
    if (originalQwenConfigDir !== undefined) {
      process.env.QWEN_CONFIG_DIR = originalQwenConfigDir;
    } else {
      delete process.env.QWEN_CONFIG_DIR;
    }
  });

  test('returns ~/.qwen with no env var or explicit dir', () => {
    delete process.env.QWEN_CONFIG_DIR;
    const result = getGlobalDir('qwen');
    assert.strictEqual(result, path.join(os.homedir(), '.qwen'));
  });

  test('returns explicit dir when provided', () => {
    const result = getGlobalDir('qwen', '/custom/qwen-path');
    assert.strictEqual(result, '/custom/qwen-path');
  });

  test('respects QWEN_CONFIG_DIR env var', () => {
    process.env.QWEN_CONFIG_DIR = '~/custom-qwen';
    const result = getGlobalDir('qwen');
    assert.strictEqual(result, path.join(os.homedir(), 'custom-qwen'));
  });

  test('explicit dir takes priority over QWEN_CONFIG_DIR', () => {
    process.env.QWEN_CONFIG_DIR = '~/from-env';
    const result = getGlobalDir('qwen', '/explicit/path');
    assert.strictEqual(result, '/explicit/path');
  });

  test('does not break other runtimes', () => {
    assert.strictEqual(getGlobalDir('claude'), path.join(os.homedir(), '.claude'));
    assert.strictEqual(getGlobalDir('codex'), path.join(os.homedir(), '.codex'));
  });
});

describe('Qwen Code local install/uninstall', () => {
  let tmpDir;
  let previousCwd;

  beforeEach(() => {
    tmpDir = createTempDir('sdd-qwen-install-');
    previousCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(previousCwd);
    cleanup(tmpDir);
  });

  test('installs SDD into ./.qwen and removes it cleanly', () => {
    const result = install(false, 'qwen');
    const targetDir = path.join(tmpDir, '.qwen');

    assert.strictEqual(result.runtime, 'qwen');
    assert.strictEqual(result.configDir, fs.realpathSync(targetDir));

    assert.ok(fs.existsSync(path.join(targetDir, 'skills', 'sdd-help', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(targetDir, 'sdd', 'VERSION')));
    assert.ok(fs.existsSync(path.join(targetDir, 'agents')));

    const manifest = writeManifest(targetDir, 'qwen');
    assert.ok(Object.keys(manifest.files).some(file => file.startsWith('skills/sdd-help/')), manifest);

    uninstall(false, 'qwen');

    assert.ok(!fs.existsSync(path.join(targetDir, 'skills', 'sdd-help')), 'Qwen skill directory removed');
    assert.ok(!fs.existsSync(path.join(targetDir, 'sdd')), 'sdd removed');
  });
});

describe('E2E: Qwen Code uninstall skills cleanup', () => {
  let tmpDir;
  let previousCwd;

  beforeEach(() => {
    tmpDir = createTempDir('sdd-qwen-uninstall-');
    previousCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(previousCwd);
    cleanup(tmpDir);
  });

  test('removes all sdd-* skill directories on --qwen --uninstall', () => {
    const targetDir = path.join(tmpDir, '.qwen');
    install(false, 'qwen');

    const skillsDir = path.join(targetDir, 'skills');
    assert.ok(fs.existsSync(skillsDir), 'skills dir exists after install');

    const installedSkills = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name.startsWith('sdd-'));
    assert.ok(installedSkills.length > 0, `found ${installedSkills.length} sdd-* skill dirs before uninstall`);

    uninstall(false, 'qwen');

    if (fs.existsSync(skillsDir)) {
      const remainingGsd = fs.readdirSync(skillsDir, { withFileTypes: true })
        .filter(e => e.isDirectory() && e.name.startsWith('sdd-'));
      assert.strictEqual(remainingGsd.length, 0,
        `Expected 0 sdd-* skill dirs after uninstall, found: ${remainingGsd.map(e => e.name).join(', ')}`);
    }
  });

  test('preserves non-SDD skill directories during --qwen --uninstall', () => {
    const targetDir = path.join(tmpDir, '.qwen');
    install(false, 'qwen');

    const customSkillDir = path.join(targetDir, 'skills', 'my-custom-skill');
    fs.mkdirSync(customSkillDir, { recursive: true });
    fs.writeFileSync(path.join(customSkillDir, 'SKILL.md'), '# My Custom Skill\n');

    assert.ok(fs.existsSync(path.join(customSkillDir, 'SKILL.md')), 'custom skill exists before uninstall');

    uninstall(false, 'qwen');

    assert.ok(fs.existsSync(path.join(customSkillDir, 'SKILL.md')),
      'Non-SDD skill directory should be preserved after Qwen uninstall');
  });

  test('removes engine directory on --qwen --uninstall', () => {
    const targetDir = path.join(tmpDir, '.qwen');
    install(false, 'qwen');

    assert.ok(fs.existsSync(path.join(targetDir, 'sdd', 'VERSION')),
      'engine exists before uninstall');

    uninstall(false, 'qwen');

    assert.ok(!fs.existsSync(path.join(targetDir, 'sdd')),
      'sdd engine should be removed after Qwen uninstall');
  });
});
