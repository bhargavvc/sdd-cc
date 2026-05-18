// allow-test-rule: source-text-is-the-product
// sdd/workflows/reapply-patches.md is the installed runtime workflow —
// its text IS the deployed behavioral contract for the --reapply flag.

'use strict';

/**
 * Bug #3516: reapply-patches.md git-enhanced two-way merge filter misses
 * commits authored by the renamed `/sdd-update` flow.
 *
 * The `grep -v` alternation on line 231 only included the legacy `sdd:update`
 * marker. After the slash-command rename `/sdd:update` → `/sdd-update`, commits
 * authored by the current flow fall through the filter and are misclassified as
 * user customizations, prompting spurious merge conflicts during `--reapply`.
 *
 * Fix: add `sdd-update` arm to the alternation so both the legacy and current
 * commit-message prefixes are excluded. `SDD update` and `sdd-install`
 * exclusions are preserved.
 *
 * Per the repo's source-text-is-the-product exception: the workflow file's text
 * IS the deployed behavioral contract. Structural assertion against the parsed
 * shell command string is the correct test form here.
 */

const { describe, test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WORKFLOW_PATH = path.join(
  __dirname,
  '..',
  'sdd',
  'workflows',
  'reapply-patches.md',
);

/**
 * Extract the git log filter command from the workflow.
 *
 * Looks for the `grep -v "..."` shell snippet inside the Git-enhanced two-way
 * merge section and returns the alternation string between the quotes.
 * Returns null if the snippet is absent (signals a structural regression).
 */
function extractFilterAlternation(content) {
  // Match the grep -v "..." line in the bash block
  const match = content.match(/grep\s+-v\s+"([^"]+)"/);
  if (!match) return null;
  return match[1];
}

/**
 * Parse the alternation string (pipe-delimited) into individual arms.
 * Handles escaped pipes produced by shell regex syntax (`\|`).
 */
function parseAlternationArms(alternation) {
  // Shell grep alternation uses \| (escaped pipe); split on that
  return alternation.split(/\\\|/).map((arm) => arm.trim());
}

describe('Bug #3516: git-enhanced two-way merge filter includes sdd-update arm', () => {
  let content;
  let alternation;
  let arms;

  before(() => {
    content = fs.readFileSync(WORKFLOW_PATH, 'utf8');
    alternation = extractFilterAlternation(content);
    arms = alternation ? parseAlternationArms(alternation) : [];
  });

  test('workflow file exists', () => {
    assert.ok(
      fs.existsSync(WORKFLOW_PATH),
      'sdd/workflows/reapply-patches.md must exist',
    );
  });

  test('git-enhanced two-way merge section contains a grep -v filter', () => {
    assert.ok(
      alternation !== null,
      'reapply-patches.md must contain a `grep -v "..."` filter in the git-enhanced two-way merge section',
    );
  });

  test('filter excludes legacy sdd:update commits (back-compat)', () => {
    assert.ok(
      arms.some((arm) => arm === 'sdd:update'),
      `filter must include 'sdd:update' arm for back-compat; got arms: ${JSON.stringify(arms)}`,
    );
  });

  test('filter excludes renamed sdd-update commits (primary fix)', () => {
    assert.ok(
      arms.some((arm) => arm === 'sdd-update'),
      `filter must include 'sdd-update' arm (renamed flow); got arms: ${JSON.stringify(arms)}`,
    );
  });

  test('filter excludes SDD update commits (no regression)', () => {
    assert.ok(
      arms.some((arm) => arm === 'SDD update'),
      `filter must include 'SDD update' arm; got arms: ${JSON.stringify(arms)}`,
    );
  });

  test('filter excludes sdd-install commits (no regression)', () => {
    assert.ok(
      arms.some((arm) => arm === 'sdd-install'),
      `filter must include 'sdd-install' arm; got arms: ${JSON.stringify(arms)}`,
    );
  });

  test('all four expected exclusion patterns are present in the filter', () => {
    const required = ['sdd:update', 'sdd-update', 'SDD update', 'sdd-install'];
    const missing = required.filter((p) => !arms.some((arm) => arm === p));
    assert.deepEqual(
      missing,
      [],
      `filter is missing required exclusion patterns: ${JSON.stringify(missing)}; got arms: ${JSON.stringify(arms)}`,
    );
  });
});
