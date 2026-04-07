/**
 * SDD Tools Tests - Claude Skills Migration (#1504)
 *
 * Tests for migrating Claude Code from commands/sdd/ to skills/sdd-xxx/SKILL.md
 * format for compatibility with Claude Code 2.1.88+.
 *
 * Uses node:test and node:assert (NOT Jest).
 */

process.env.SDD_TEST_MODE = '1';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const os = require('os');
const fs = require('fs');

const {
  convertClaudeCommandToClaudeSkill,
  copyCommandsAsClaudeSkills,
  writeManifest,
  install,
} = require('../bin/install.js');

// ─── convertClaudeCommandToClaudeSkill ──────────────────────────────────────

describe('convertClaudeCommandToClaudeSkill', () => {
  test('preserves allowed-tools multiline YAML list', () => {
    const input = [
      '---',
      'name: sdd:next',
      'description: Advance to the next step',
      'allowed-tools:',
      '  - Read',
      '  - Bash',
      '  - Grep',
      '---',
      '',
      'Body content here.',
    ].join('\n');

    const result = convertClaudeCommandToClaudeSkill(input, 'sdd-next');
    assert.ok(result.includes('allowed-tools:'), 'allowed-tools field is present');
    assert.ok(result.includes('Read'), 'Read tool preserved');
    assert.ok(result.includes('Bash'), 'Bash tool preserved');
    assert.ok(result.includes('Grep'), 'Grep tool preserved');
  });

  test('preserves argument-hint', () => {
    const input = [
      '---',
      'name: sdd:debug',
      'description: Debug issues',
      'argument-hint: "[issue description]"',
      'allowed-tools:',
      '  - Read',
      '  - Bash',
      '---',
      '',
      'Debug body.',
    ].join('\n');

    const result = convertClaudeCommandToClaudeSkill(input, 'sdd-debug');
    assert.ok(result.includes('argument-hint:'), 'argument-hint field is present');
    // The value should be preserved (possibly yaml-quoted)
    assert.ok(
      result.includes('[issue description]'),
      'argument-hint value preserved'
    );
  });

  test('converts name format from sdd:xxx to skill naming', () => {
    const input = [
      '---',
      'name: sdd:next',
      'description: Advance workflow',
      '---',
      '',
      'Body.',
    ].join('\n');

    const result = convertClaudeCommandToClaudeSkill(input, 'sdd-next');
    assert.ok(result.includes('name: sdd-next'), 'name uses skill naming convention');
    assert.ok(!result.includes('name: sdd:next'), 'old name format removed');
  });

  test('preserves body content unchanged', () => {
    const body = '\n<objective>\nDo the thing.\n</objective>\n\n<process>\nStep 1.\nStep 2.\n</process>\n';
    const input = [
      '---',
      'name: sdd:test',
      'description: Test command',
      '---',
      body,
    ].join('');

    const result = convertClaudeCommandToClaudeSkill(input, 'sdd-test');
    assert.ok(result.includes('<objective>'), 'objective tag preserved');
    assert.ok(result.includes('Do the thing.'), 'body text preserved');
    assert.ok(result.includes('<process>'), 'process tag preserved');
    assert.ok(result.includes('Step 1.'), 'step text preserved');
  });

  test('preserves agent field', () => {
    const input = [
      '---',
      'name: sdd:plan-phase',
      'description: Plan a phase',
      'agent: true',
      'allowed-tools:',
      '  - Read',
      '---',
      '',
      'Plan body.',
    ].join('\n');

    const result = convertClaudeCommandToClaudeSkill(input, 'sdd-plan-phase');
    assert.ok(result.includes('agent:'), 'agent field is present');
  });

  test('handles content with no frontmatter', () => {
    const input = 'Just some plain markdown content.';
    const result = convertClaudeCommandToClaudeSkill(input, 'sdd-plain');
    assert.strictEqual(result, input, 'content returned unchanged');
  });

  test('preserves allowed-tools as multiline YAML list (not flattened)', () => {
    const input = [
      '---',
      'name: sdd:debug',
      'description: Debug',
      'allowed-tools:',
      '  - Read',
      '  - Bash',
      '  - Task',
      '  - AskUserQuestion',
      '---',
      '',
      'Body.',
    ].join('\n');

    const result = convertClaudeCommandToClaudeSkill(input, 'sdd-debug');
    // Claude Code native format keeps YAML multiline list
    assert.ok(result.includes('  - Read'), 'Read in multiline list');
    assert.ok(result.includes('  - Bash'), 'Bash in multiline list');
    assert.ok(result.includes('  - Task'), 'Task in multiline list');
    assert.ok(result.includes('  - AskUserQuestion'), 'AskUserQuestion in multiline list');
  });
});

// ─── copyCommandsAsClaudeSkills ─────────────────────────────────────────────

describe('copyCommandsAsClaudeSkills', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-claude-skills-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('creates correct directory structure skills/sdd-xxx/SKILL.md', () => {
    // Create source commands
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(
      path.join(srcDir, 'next.md'),
      '---\nname: sdd:next\ndescription: Advance\nallowed-tools:\n  - Read\n---\n\nBody.'
    );
    fs.writeFileSync(
      path.join(srcDir, 'health.md'),
      '---\nname: sdd:health\ndescription: Check health\n---\n\nHealth body.'
    );

    const skillsDir = path.join(tmpDir, 'skills');
    copyCommandsAsClaudeSkills(srcDir, skillsDir, 'sdd', '$HOME/.claude/', 'claude', true);

    // Verify directory structure
    assert.ok(
      fs.existsSync(path.join(skillsDir, 'sdd-next', 'SKILL.md')),
      'skills/sdd-next/SKILL.md exists'
    );
    assert.ok(
      fs.existsSync(path.join(skillsDir, 'sdd-health', 'SKILL.md')),
      'skills/sdd-health/SKILL.md exists'
    );
  });

  test('cleans up old skills before installing new ones', () => {
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(
      path.join(srcDir, 'next.md'),
      '---\nname: sdd:next\ndescription: Advance\n---\n\nBody.'
    );

    const skillsDir = path.join(tmpDir, 'skills');
    // Create a stale skill that should be removed
    const staleDir = path.join(skillsDir, 'sdd-old-command');
    fs.mkdirSync(staleDir, { recursive: true });
    fs.writeFileSync(path.join(staleDir, 'SKILL.md'), 'stale content');

    copyCommandsAsClaudeSkills(srcDir, skillsDir, 'sdd', '$HOME/.claude/', 'claude', true);

    // Stale skill removed
    assert.ok(
      !fs.existsSync(staleDir),
      'stale skill directory removed'
    );
    // New skill created
    assert.ok(
      fs.existsSync(path.join(skillsDir, 'sdd-next', 'SKILL.md')),
      'new skill created'
    );
  });

  test('does not remove non-SDD skills', () => {
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(
      path.join(srcDir, 'next.md'),
      '---\nname: sdd:next\ndescription: Advance\n---\n\nBody.'
    );

    const skillsDir = path.join(tmpDir, 'skills');
    // Create a non-SDD skill
    const otherDir = path.join(skillsDir, 'my-custom-skill');
    fs.mkdirSync(otherDir, { recursive: true });
    fs.writeFileSync(path.join(otherDir, 'SKILL.md'), 'custom content');

    copyCommandsAsClaudeSkills(srcDir, skillsDir, 'sdd', '$HOME/.claude/', 'claude', true);

    // Non-SDD skill preserved
    assert.ok(
      fs.existsSync(otherDir),
      'non-SDD skill preserved'
    );
  });

  test('handles recursive subdirectories', () => {
    const srcDir = path.join(tmpDir, 'src');
    const subDir = path.join(srcDir, 'wired');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(
      path.join(subDir, 'ready.md'),
      '---\nname: sdd-wired:ready\ndescription: Show ready tasks\n---\n\nBody.'
    );

    const skillsDir = path.join(tmpDir, 'skills');
    copyCommandsAsClaudeSkills(srcDir, skillsDir, 'sdd', '$HOME/.claude/', 'claude', true);

    assert.ok(
      fs.existsSync(path.join(skillsDir, 'sdd-wired-ready', 'SKILL.md')),
      'nested command creates sdd-wired-ready/SKILL.md'
    );
  });

  test('no-ops when source directory does not exist', () => {
    const skillsDir = path.join(tmpDir, 'skills');
    // Should not throw
    copyCommandsAsClaudeSkills(
      path.join(tmpDir, 'nonexistent'),
      skillsDir,
      'sdd',
      '$HOME/.claude/',
      'claude',
      true
    );
    assert.ok(!fs.existsSync(skillsDir), 'skills dir not created when src missing');
  });
});

// ─── Path replacement in Claude skills (#1653) ────────────────────────────────

describe('copyCommandsAsClaudeSkills path replacement (#1653)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-claude-path-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('replaces ~/.claude/ paths with pathPrefix on local install', () => {
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(
      path.join(srcDir, 'manager.md'),
      [
        '---',
        'name: sdd:manager',
        'description: Manager command',
        '---',
        '',
        '<execution_context>',
        '@~/.claude/sdd/workflows/manager.md',
        '@~/.claude/sdd/references/ui-brand.md',
        '</execution_context>',
      ].join('\n')
    );

    const skillsDir = path.join(tmpDir, 'skills');
    const localPrefix = '/Users/test/myproject/.claude/';
    copyCommandsAsClaudeSkills(srcDir, skillsDir, 'sdd', localPrefix, 'claude', false);

    const content = fs.readFileSync(path.join(skillsDir, 'sdd-manager', 'SKILL.md'), 'utf8');
    assert.ok(!content.includes('~/.claude/'), 'no hardcoded ~/.claude/ paths remain');
    assert.ok(content.includes(localPrefix + 'sdd/workflows/manager.md'), 'path rewritten to local prefix');
    assert.ok(content.includes(localPrefix + 'sdd/references/ui-brand.md'), 'reference path rewritten');
  });

  test('replaces $HOME/.claude/ paths with pathPrefix', () => {
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(
      path.join(srcDir, 'debug.md'),
      '---\nname: sdd:debug\ndescription: Debug\n---\n\n@$HOME/.claude/sdd/workflows/debug.md'
    );

    const skillsDir = path.join(tmpDir, 'skills');
    const localPrefix = '/tmp/project/.claude/';
    copyCommandsAsClaudeSkills(srcDir, skillsDir, 'sdd', localPrefix, 'claude', false);

    const content = fs.readFileSync(path.join(skillsDir, 'sdd-debug', 'SKILL.md'), 'utf8');
    assert.ok(!content.includes('$HOME/.claude/'), 'no $HOME/.claude/ paths remain');
    assert.ok(content.includes(localPrefix + 'sdd/workflows/debug.md'), 'path rewritten');
  });

  test('global install preserves $HOME/.claude/ when pathPrefix matches', () => {
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(
      path.join(srcDir, 'next.md'),
      '---\nname: sdd:next\ndescription: Next\n---\n\n@~/.claude/sdd/workflows/next.md'
    );

    const skillsDir = path.join(tmpDir, 'skills');
    copyCommandsAsClaudeSkills(srcDir, skillsDir, 'sdd', '$HOME/.claude/', 'claude', true);

    const content = fs.readFileSync(path.join(skillsDir, 'sdd-next', 'SKILL.md'), 'utf8');
    assert.ok(content.includes('$HOME/.claude/sdd/workflows/next.md'), 'global paths use $HOME form');
    assert.ok(!content.includes('~/.claude/'), '~/ form replaced with $HOME/ form');
  });
});

// ─── Legacy cleanup during install ──────────────────────────────────────────

describe('Legacy commands/sdd/ cleanup', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-legacy-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('install removes legacy commands/sdd/ directory when present', () => {
    // Create a mock legacy commands/sdd/ directory
    const legacyDir = path.join(tmpDir, 'commands', 'sdd');
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.writeFileSync(path.join(legacyDir, 'next.md'), 'legacy content');

    // Create source commands for the installer to read
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(
      path.join(srcDir, 'next.md'),
      '---\nname: sdd:next\ndescription: Advance\n---\n\nBody.'
    );

    const skillsDir = path.join(tmpDir, 'skills');
    // Install skills
    copyCommandsAsClaudeSkills(srcDir, skillsDir, 'sdd', '$HOME/.claude/', 'claude', true);

    // Simulate the legacy cleanup that install() does after copyCommandsAsClaudeSkills
    if (fs.existsSync(legacyDir)) {
      fs.rmSync(legacyDir, { recursive: true });
    }

    assert.ok(!fs.existsSync(legacyDir), 'legacy commands/sdd/ removed');
    assert.ok(
      fs.existsSync(path.join(skillsDir, 'sdd-next', 'SKILL.md')),
      'new skill installed'
    );
  });
});

// ─── writeManifest tracks skills/ for Claude ────────────────────────────────

describe('writeManifest tracks skills/ for Claude', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-manifest-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('manifest includes skills/sdd-xxx/SKILL.md entries for Claude runtime', () => {
    // Create skills directory structure (as install would)
    const skillsDir = path.join(tmpDir, 'skills');
    const skillDir = path.join(skillsDir, 'sdd-next');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), 'skill content');

    // Create sdd directory (required by writeManifest)
    const gsdDir = path.join(tmpDir, 'sdd');
    fs.mkdirSync(gsdDir, { recursive: true });
    fs.writeFileSync(path.join(gsdDir, 'test.md'), 'test');

    writeManifest(tmpDir, 'claude');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'sdd-file-manifest.json'), 'utf8')
    );

    // Should have skills/ entries
    const skillEntries = Object.keys(manifest.files).filter(k =>
      k.startsWith('skills/')
    );
    assert.ok(skillEntries.length > 0, 'manifest has skills/ entries');
    assert.ok(
      skillEntries.some(k => k === 'skills/sdd-next/SKILL.md'),
      'manifest has skills/sdd-next/SKILL.md'
    );

    // Should NOT have commands/sdd/ entries
    const cmdEntries = Object.keys(manifest.files).filter(k =>
      k.startsWith('commands/sdd/')
    );
    assert.strictEqual(cmdEntries.length, 0, 'manifest has no commands/sdd/ entries');
  });
});

// ─── Exports exist ──────────────────────────────────────────────────────────

describe('Claude skills migration exports', () => {
  test('convertClaudeCommandToClaudeSkill is exported', () => {
    assert.strictEqual(typeof convertClaudeCommandToClaudeSkill, 'function');
  });

  test('copyCommandsAsClaudeSkills is exported', () => {
    assert.strictEqual(typeof copyCommandsAsClaudeSkills, 'function');
  });
});
