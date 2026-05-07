/**
 * Regression tests for issue #2256 — per-agent model_overrides transport
 * for Codex and OpenCode runtimes.
 *
 * The bug: model_overrides set in per-project `.planning/config.json` were
 * never read by the Codex / OpenCode install paths, which only probed
 * `~/.sdd/defaults.json`. As a result, the configured per-agent model was
 * dropped and child agents inherited the runtime's default model.
 *
 * These tests lock in the fix: per-project overrides must be honored, and
 * per-project keys must win over global when both are present.
 */

process.env.SDD_TEST_MODE = '1';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  readSddEffectiveModelOverrides,
  generateCodexAgentToml,
  convertClaudeToOpencodeFrontmatter,
  getCodexSkillAdapterHeader,
} = require('../bin/install.js');

function makeTmp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `sdd-2256-${prefix}-`));
}

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

function rmr(p) {
  try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* noop */ }
}

describe('bug #2256 — readSddEffectiveModelOverrides', () => {
  let projectDir;
  let homeDir;
  let origHome;

  beforeEach(() => {
    projectDir = makeTmp('proj');
    homeDir = makeTmp('home');
    origHome = process.env.HOME;
    process.env.HOME = homeDir;
  });

  afterEach(() => {
    if (origHome === undefined) delete process.env.HOME;
    else process.env.HOME = origHome;
    rmr(projectDir);
    rmr(homeDir);
  });

  test('returns null when neither source defines model_overrides', () => {
    const result = readSddEffectiveModelOverrides(projectDir);
    assert.strictEqual(result, null);
  });

  test('reads overrides from ~/.sdd/defaults.json (global only)', () => {
    writeJson(path.join(homeDir, '.sdd', 'defaults.json'), {
      model_overrides: { 'sdd-codebase-mapper': 'gpt-5-mini' },
    });
    const result = readSddEffectiveModelOverrides(projectDir);
    assert.deepStrictEqual(result, { 'sdd-codebase-mapper': 'gpt-5-mini' });
  });

  test('reads overrides from per-project .planning/config.json', () => {
    writeJson(path.join(projectDir, '.planning', 'config.json'), {
      model_overrides: { 'sdd-codebase-mapper': 'claude-haiku-4-5' },
    });
    const result = readSddEffectiveModelOverrides(projectDir);
    assert.deepStrictEqual(result, { 'sdd-codebase-mapper': 'claude-haiku-4-5' });
  });

  test('per-project overrides win over global on conflict', () => {
    writeJson(path.join(homeDir, '.sdd', 'defaults.json'), {
      model_overrides: { 'sdd-codebase-mapper': 'global-model', 'sdd-planner': 'opus' },
    });
    writeJson(path.join(projectDir, '.planning', 'config.json'), {
      model_overrides: { 'sdd-codebase-mapper': 'project-model' },
    });
    const result = readSddEffectiveModelOverrides(projectDir);
    // Per-project wins on conflict; non-conflicting global keys are preserved.
    assert.deepStrictEqual(result, {
      'sdd-codebase-mapper': 'project-model',
      'sdd-planner': 'opus',
    });
  });

  test('walks up from nested targetDir to find .planning/', () => {
    writeJson(path.join(projectDir, '.planning', 'config.json'), {
      model_overrides: { 'sdd-planner': 'project-opus' },
    });
    const nested = path.join(projectDir, '.codex');
    fs.mkdirSync(nested, { recursive: true });
    const result = readSddEffectiveModelOverrides(nested);
    assert.deepStrictEqual(result, { 'sdd-planner': 'project-opus' });
  });
});

describe('bug #2256 — Codex adapter embeds per-project override', () => {
  const agentContent = `---\nname: sdd-codebase-mapper\ndescription: Maps codebase\n---\n\nbody\n`;

  test('generateCodexAgentToml embeds model when override provided', () => {
    const toml = generateCodexAgentToml(
      'sdd-codebase-mapper',
      agentContent,
      { 'sdd-codebase-mapper': 'gpt-5-mini' },
    );
    assert.match(toml, /^model = "gpt-5-mini"$/m);
  });

  test('generateCodexAgentToml omits model when no override', () => {
    const toml = generateCodexAgentToml('sdd-codebase-mapper', agentContent, null);
    assert.doesNotMatch(toml, /^model\s*=/m);
  });
});

describe('bug #2256 — OpenCode adapter embeds per-project override', () => {
  test('convertClaudeToOpencodeFrontmatter embeds model on agent frontmatter', () => {
    const input = `---\nname: sdd-codebase-mapper\ndescription: Maps codebase\n---\n\nbody\n`;
    const out = convertClaudeToOpencodeFrontmatter(input, {
      isAgent: true,
      modelOverride: 'claude-haiku-4-5',
    });
    assert.match(out, /^model: claude-haiku-4-5$/m);
    assert.match(out, /^mode: subagent$/m);
  });

  test('convertClaudeToOpencodeFrontmatter omits model when override absent', () => {
    const input = `---\nname: sdd-codebase-mapper\ndescription: Maps codebase\n---\n\nbody\n`;
    const out = convertClaudeToOpencodeFrontmatter(input, { isAgent: true, modelOverride: null });
    assert.doesNotMatch(out, /^model:/m);
  });
});

describe('bug #2256 — Codex skill adapter header documents transport', () => {
  test('Task(model=...) line no longer says "omit" without explanation', () => {
    const header = getCodexSkillAdapterHeader('sdd-plan-phase');
    // Header must mention that per-agent model_overrides are embedded in agent
    // TOML so spawn_agent picks them up automatically — the old text said
    // "Codex uses per-role config, not inline model selection" which left
    // users thinking their model_overrides were silently ignored.
    assert.match(header, /model_overrides/);
  });
});
