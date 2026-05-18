'use strict';

// allow-test-rule: structural-regression-guard

/**
 * Slash-command namespace invariant (#3443).
 *
 * History:
 *   #3443 re-establishes `/sdd:<cmd>` as canonical in Claude-facing source text.
 *   The source repo is authored for Claude command registration under
 *   `.claude/commands/sdd/` (namespaced slash commands), while non-Claude runtimes
 *   perform install-time conversion (for example `/sdd:<cmd>` -> `/sdd-<cmd>`).
 *
 * Invariant enforced here:
 *   No `/sdd-<cmd>` pattern in Claude-facing source text.
 *
 * Exceptions:
 *   - CHANGELOG.md: historical entries document commands under their original names.
 *   - sdd-sdk / sdd-tools identifiers: never rewritten (not slash commands).
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const COMMANDS_DIR = path.join(ROOT, 'commands', 'sdd');

const SEARCH_DIRS = [
  path.join(ROOT, 'sdd', 'bin', 'lib'),
  path.join(ROOT, 'sdd', 'workflows'),
  path.join(ROOT, 'sdd', 'references'),
  path.join(ROOT, 'sdd', 'templates'),
  COMMANDS_DIR,
  path.join(ROOT, 'agents'),
  path.join(ROOT, 'hooks'),
];

const TOP_LEVEL_FILES = [
  path.join(ROOT, '.clinerules'),
];

// Re-use SKIP_DIRS from the production script so the test's directory walker
// stays in lockstep with the fixer's. EXTENSIONS legitimately diverges (the
// guard scans only `.md`/`.cjs`/`.js` per the no-source-grep standard, while
// the fixer also rewrites `.ts`/`.tsx`), so it is not shared.
const { SKIP_DIRS } = require(path.join(ROOT, 'scripts', 'fix-slash-commands.cjs'));

const EXTENSIONS = new Set(['.md', '.cjs', '.js']);

function collectFiles(dir, results = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      collectFiles(full, results);
    }
    else if (EXTENSIONS.has(path.extname(e.name))) results.push(full);
  }
  return results;
}

const cmdNames = fs.readdirSync(COMMANDS_DIR)
  .filter(f => f.endsWith('.md'))
  .map(f => f.replace(/\.md$/, ''))
  .sort((a, b) => b.length - a.length);

const retiredPattern = new RegExp(`/sdd-(${cmdNames.join('|')})(?=[^a-zA-Z0-9_-]|$)`);

const allFiles = SEARCH_DIRS.flatMap(d => collectFiles(d));
const topLevelFiles = TOP_LEVEL_FILES.filter((file) => fs.existsSync(file));
const allUserFacingFiles = allFiles.concat(topLevelFiles);

describe('slash-command namespace invariant (#3443)', () => {
  test('commands/sdd/ directory contains known command files', () => {
    assert.ok(cmdNames.length > 0, 'commands/sdd/ must contain .md files');
    assert.ok(cmdNames.includes('plan-phase'), 'plan-phase must be a known command');
    assert.ok(cmdNames.includes('execute-phase'), 'execute-phase must be a known command');
  });

  test('no /sdd-<cmd> retired syntax in Claude-facing source files', () => {
    const violations = [];
    for (const file of allUserFacingFiles) {
      const src = fs.readFileSync(file, 'utf-8');
      const lines = src.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (retiredPattern.test(lines[i])) {
          violations.push(`${path.relative(ROOT, file)}:${i + 1}: ${lines[i].trim().slice(0, 80)}`);
        }
      }
    }
    assert.strictEqual(
      violations.length,
      0,
      `Found ${violations.length} retired /sdd-<cmd> reference(s) — use /sdd:<cmd> instead:\n${violations.slice(0, 10).join('\n')}`,
    );
  });

  test('command filenames use canonical hyphenated command slugs', () => {
    const underscoreFiles = fs.readdirSync(COMMANDS_DIR)
      .filter((f) => f.endsWith('.md') && f.includes('_'));
    assert.deepStrictEqual(
      underscoreFiles,
      [],
      'command filenames feed generated skill/autocomplete names and must not contain underscores',
    );
  });

  describe('fix-slash-commands transformer behavior', () => {
    const { transformContent } = require(path.join(ROOT, 'scripts', 'fix-slash-commands.cjs'));
    // Use the live command names so the transformer matches the same surface
    // the production CLI rewrites.
    const liveCmdNames = cmdNames;

    test('rewrites /sdd-<cmd> to /sdd:<cmd>', () => {
      const out = transformContent('See /sdd-plan-phase for details.', liveCmdNames);
      assert.ok(out.includes('/sdd:plan-phase'), `expected /sdd:plan-phase, got: ${out}`);
      assert.ok(!out.includes('/sdd-plan-phase'), `dash form must not survive, got: ${out}`);
    });

    test('rewrites multiple occurrences in one pass', () => {
      const out = transformContent('Run /sdd-plan-phase then /sdd-execute-phase.', liveCmdNames);
      assert.ok(out.includes('/sdd:plan-phase'));
      assert.ok(out.includes('/sdd:execute-phase'));
      assert.ok(!out.match(/\/sdd-[a-z]/), `no dash form may remain, got: ${out}`);
    });

    test('does not rewrite canonical colon form (idempotent)', () => {
      const input = '/sdd:plan-phase is the canonical name.';
      assert.strictEqual(transformContent(input, liveCmdNames), input,
        'transformer must be a no-op when input is already canonical');
    });

    test('does not rewrite sdd-sdk or sdd-tools (not slash commands)', () => {
      const input = 'Run /sdd-sdk query and /sdd-tools init.';
      assert.strictEqual(transformContent(input, liveCmdNames), input,
        'transformer must leave non-command identifiers alone');
    });

    test('respects word boundary — does not rewrite /sdd-plan-phase-extra', () => {
      const out = transformContent('/sdd-plan-phase-extra', liveCmdNames);
      assert.strictEqual(out, '/sdd-plan-phase-extra',
        'word-boundary lookahead must prevent partial matches');
    });
  });

  test('transformer leaves non-command identifiers untouched', () => {
    const { transformContent } = require(path.join(ROOT, 'scripts', 'fix-slash-commands.cjs'));
    const sample = 'Use /sdd-sdk query and node bin/sdd-tools.cjs';
    assert.strictEqual(
      transformContent(sample, cmdNames),
      sample,
      'sdd-sdk and sdd-tools are not slash commands and must remain untouched'
    );
  });
});
