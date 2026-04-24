/**
 * Regression guard for #1766: $SDD_TOOLS env var undefined
 *
 * All command files must use the resolved path to sdd-tools.cjs
 * ($HOME/.claude/sdd/bin/sdd-tools.cjs), not the undefined
 * $SDD_TOOLS variable. This test catches any command file that
 * references the undefined variable.
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const COMMANDS_DIR = path.join(__dirname, '..', 'commands', 'sdd');

describe('command files: sdd-tools path references (#1766)', () => {
  test('no command file references undefined $SDD_TOOLS variable', () => {
    const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md'));
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
      // Match $SDD_TOOLS or "$SDD_TOOLS" or ${SDD_TOOLS} used as a path
      // (not as a documentation reference)
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/\$SDD_TOOLS\b/.test(line) && /node\s/.test(line)) {
          violations.push(`${file}:${i + 1}: ${line.trim()}`);
        }
      }
    }

    assert.strictEqual(violations.length, 0,
      'Command files must not reference undefined $SDD_TOOLS. ' +
      'Use $HOME/.claude/sdd/bin/sdd-tools.cjs instead.\n' +
      'Violations:\n' + violations.join('\n'));
  });

  test('workstreams.md documents sdd-sdk query or legacy sdd-tools.cjs', () => {
    const content = fs.readFileSync(
      path.join(COMMANDS_DIR, 'workstreams.md'), 'utf-8'
    );

    assert.ok(
      /sdd-sdk\s+query/.test(content) || /sdd-tools\.cjs/.test(content),
      'workstreams.md should document sdd-sdk query or sdd-tools.cjs'
    );

    const lines = content.split('\n');
    for (const line of lines) {
      if (/node\s/.test(line)) {
        assert.ok(
          line.includes('sdd-tools.cjs'),
          'Each node invocation must reference sdd-tools.cjs, got: ' + line.trim()
        );
      }
    }
  });
});
