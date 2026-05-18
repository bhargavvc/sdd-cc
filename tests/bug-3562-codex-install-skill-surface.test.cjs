'use strict';

// allow-test-rule: structural check — asserts installed SKILL.md frontmatter
// shape (startsWith '---'); reading the materialized file IS the contract.

process.env.SDD_TEST_MODE = '1';

/**
 * Regression test for bug #3562 — Codex global install must create a
 * discoverable $sdd-* skill surface.
 *
 * Codex CLI 0.130.0 (the version in the issue report) does NOT auto-discover
 * commands from sdd/workflows/*.md or agents/*.md. It only registers
 * commands from skills/<name>/SKILL.md. Prior installer logic ("Codex now
 * discovers official skills from .agents/skills") was based on an assumption
 * that does not match the shipping Codex CLI behavior, leaving users with
 * workflows on disk and no $sdd-* entrypoints after `npx @bhargavvc/sdd-cc
 * --codex --global`.
 *
 * Fix: re-wire copyCommandsAsCodexSkills() back into the install dispatch path
 * so the same skill-shape that Claude / Copilot / Antigravity / Cursor /
 * Windsurf / Augment / Trae installs produce is also produced for Codex.
 */

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { install } = require('../bin/install.js');
const { createTempDir, cleanup } = require('./helpers.cjs');

const HOOKS_DIST = path.join(__dirname, '..', 'hooks', 'dist');
const BUILD_HOOKS_SCRIPT = path.join(__dirname, '..', 'scripts', 'build-hooks.js');

function withCodexHome(codexHome, fn) {
  const prev = process.env.CODEX_HOME;
  process.env.CODEX_HOME = codexHome;
  try {
    return fn();
  } finally {
    if (prev == null) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = prev;
  }
}

describe('#3562 — Codex install produces discoverable $sdd-* skill surface', { concurrency: false }, () => {
  let tmpRoot;
  let codexHome;

  beforeEach(() => {
    if (!fs.existsSync(HOOKS_DIST) || fs.readdirSync(HOOKS_DIST).length === 0) {
      execFileSync(process.execPath, [BUILD_HOOKS_SCRIPT], { stdio: 'pipe' });
    }
    tmpRoot = createTempDir('sdd-3562-');
    codexHome = path.join(tmpRoot, '.codex');
    fs.mkdirSync(codexHome, { recursive: true });
  });

  afterEach(() => {
    cleanup(tmpRoot);
  });

  test('global install creates skills/sdd-help/SKILL.md', () => {
    withCodexHome(codexHome, () => install(true, 'codex'));

    const skillPath = path.join(codexHome, 'skills', 'sdd-help', 'SKILL.md');
    assert.ok(
      fs.existsSync(skillPath),
      `Codex install must create ${skillPath} so $sdd-help is discoverable. ` +
        'Without this, Codex CLI 0.130.0 does not expose any $sdd-* command.',
    );
  });

  test('SKILL.md content has frontmatter expected by Codex skill discovery', () => {
    withCodexHome(codexHome, () => install(true, 'codex'));

    const skillPath = path.join(codexHome, 'skills', 'sdd-help', 'SKILL.md');
    assert.ok(fs.existsSync(skillPath), 'precondition: SKILL.md exists');

    const content = fs.readFileSync(skillPath, 'utf8');
    // SKILL.md is YAML frontmatter then body; convertClaudeCommandToCodexSkill
    // emits at minimum a `name:` field on the leading frontmatter block.
    assert.ok(
      content.startsWith('---'),
      'SKILL.md must begin with YAML frontmatter (---) for Codex discovery',
    );
    assert.ok(
      /^name:\s*["']?sdd-help["']?\s*$/m.test(content),
      'SKILL.md frontmatter must declare name: sdd-help so $sdd-help resolves',
    );
  });

  test('multiple core $sdd-* skills are produced (not just sdd-help)', () => {
    withCodexHome(codexHome, () => install(true, 'codex'));

    const skillsDir = path.join(codexHome, 'skills');
    assert.ok(fs.existsSync(skillsDir), 'skills/ directory must exist after install');

    const sddSkills = fs
      .readdirSync(skillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith('sdd-'))
      .map((e) => e.name);

    // Lower bound — exact count depends on the current command surface. The
    // commands/sdd/ directory holds dozens of *.md files; expecting more than
    // 10 generated skills is a conservative floor that catches "we generated
    // nothing" or "we only generated one accidentally" regressions.
    assert.ok(
      sddSkills.length >= 10,
      `Expected >= 10 generated sdd-* skill directories, found ${sddSkills.length}: ${sddSkills.join(', ')}`,
    );
  });

  test('install preserves existing user skills (does not remove unrelated dirs)', () => {
    fs.mkdirSync(path.join(codexHome, 'skills', 'custom-user-skill'), { recursive: true });
    fs.writeFileSync(
      path.join(codexHome, 'skills', 'custom-user-skill', 'SKILL.md'),
      '---\nname: custom-user-skill\n---\n# user skill\n',
    );

    withCodexHome(codexHome, () => install(true, 'codex'));

    const userSkill = path.join(codexHome, 'skills', 'custom-user-skill', 'SKILL.md');
    assert.ok(
      fs.existsSync(userSkill),
      'Codex install must preserve existing non-sdd user skill directories',
    );
  });
});
