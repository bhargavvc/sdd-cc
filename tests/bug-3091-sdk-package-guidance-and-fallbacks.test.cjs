'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

describe('bug #3091: sdk install guidance and agent fallbacks use query-capable CLI', () => {
  test('quick workflow install hint references @bhargavvc/sdd-cc (not @bhargavvc/sdk)', () => {
    const content = read('sdd/workflows/quick.md');
    assert.ok(content.includes('npm install -g @bhargavvc/sdd-cc'));
    assert.ok(!content.includes('npm install -g @bhargavvc/sdk'));
  });

  test('agent docs no longer reference node_modules/@bhargavvc/sdk/dist/cli.js query fallback', () => {
    const files = [
      'agents/sdd-planner.md',
      'agents/sdd-executor.md',
      'agents/sdd-plan-checker.md',
      'agents/sdd-roadmapper.md',
    ];

    const offenders = files.filter((f) => read(f).includes('@bhargavvc/sdk/dist/cli.js query'));
    assert.deepStrictEqual(offenders, [], `stale @bhargavvc/sdk query fallback references: ${offenders.join(', ')}`);
  });
});
