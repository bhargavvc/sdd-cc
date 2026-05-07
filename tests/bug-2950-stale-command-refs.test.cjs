/**
 * Bug #2950: Stale deleted command references in workflow files
 *
 * Multiple workflow files referenced command names removed in #2790
 * (sdd-add-phase, sdd-insert-phase, sdd-remove-phase, sdd-add-todo,
 * sdd-set-profile, sdd-settings-integrations, sdd-settings-advanced,
 * sdd-spike-wrap-up, sdd-sketch-wrap-up, sdd-code-review-fix).
 *
 * Fix: Update every occurrence to the new consolidated forms:
 *   /sdd-phase (no flag | --insert | --remove)
 *   /sdd-capture
 *   /sdd-config (--profile | --integrations | --advanced)
 *   /sdd-spike --wrap-up
 *   /sdd-sketch --wrap-up
 *   /sdd-code-review --fix
 */

'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WORKFLOWS_DIR = path.join(__dirname, '..', 'sdd', 'workflows');

function read(filename) {
  return fs.readFileSync(path.join(WORKFLOWS_DIR, filename), 'utf-8');
}

// Deleted command names that must not appear anywhere in the fixed files.
const DELETED_COMMANDS = [
  '/sdd-add-phase',
  '/sdd-insert-phase',
  '/sdd-remove-phase',
  '/sdd-add-todo',
  '/sdd-set-profile',
  '/sdd-settings-integrations',
  '/sdd-settings-advanced',
  '/sdd-spike-wrap-up',
  '/sdd-sketch-wrap-up',
  '/sdd-code-review-fix',
];

// Per-file assertions: [file, deletedCmd, newForm]
const FILE_ASSERTIONS = [
  // help.md
  ['help.md', '/sdd-add-phase', '/sdd-phase "Add admin dashboard"'],
  ['help.md', '/sdd-insert-phase', '/sdd-phase --insert 7 "Fix critical auth bug"'],
  ['help.md', '/sdd-remove-phase', '/sdd-phase --remove 17'],
  ['help.md', '/sdd-spike-wrap-up', '/sdd-spike --wrap-up'],
  ['help.md', '/sdd-sketch-wrap-up', '/sdd-sketch --wrap-up'],
  ['help.md', '/sdd-add-todo', '/sdd-capture'],
  ['help.md', '/sdd-set-profile', '/sdd-config --profile budget'],

  // do.md
  ['do.md', '/sdd-spike-wrap-up', '/sdd-spike --wrap-up'],
  ['do.md', '/sdd-sketch-wrap-up', '/sdd-sketch --wrap-up'],
  ['do.md', '/sdd-add-phase', '/sdd-phase'],
  ['do.md', '/sdd-add-todo', '/sdd-capture'],

  // settings.md
  ['settings.md', '/sdd-code-review-fix', '/sdd-code-review --fix'],
  ['settings.md', '/sdd-settings-integrations', '/sdd-config --integrations'],
  ['settings.md', '/sdd-set-profile', '/sdd-config --profile'],
  ['settings.md', '/sdd-settings-advanced', '/sdd-config --advanced'],

  // discuss-phase.md
  ['discuss-phase.md', '/sdd-spike-wrap-up', '/sdd-spike --wrap-up'],
  ['discuss-phase.md', '/sdd-sketch-wrap-up', '/sdd-sketch --wrap-up'],

  // new-project.md
  ['new-project.md', '/sdd-spike-wrap-up', '/sdd-spike --wrap-up'],
  ['new-project.md', '/sdd-sketch-wrap-up', '/sdd-sketch --wrap-up'],

  // plan-phase.md
  ['plan-phase.md', '/sdd-insert-phase', '/sdd-phase --insert'],

  // spike.md
  ['spike.md', '/sdd-spike-wrap-up', '/sdd-spike --wrap-up'],

  // sketch.md
  ['sketch.md', '/sdd-sketch-wrap-up', '/sdd-sketch --wrap-up'],
];

describe('bug #2950: stale deleted-command references removed from workflow files', () => {
  // Build a map of file → content to avoid re-reading
  const files = [...new Set(FILE_ASSERTIONS.map(([f]) => f))];
  const contentMap = {};
  for (const f of files) {
    contentMap[f] = read(f);
  }

  // For each (file, deletedCmd) pair, assert the old name is absent
  for (const [file, deletedCmd] of FILE_ASSERTIONS) {
    test(`${file}: does not contain deleted command "${deletedCmd}"`, () => {
      const content = contentMap[file];
      assert.ok(
        !content.includes(deletedCmd),
        `${file} still contains deleted command "${deletedCmd}" — update to new form`
      );
    });
  }

  // For each (file, deletedCmd, newForm) triple, assert the new form is present
  for (const [file, , newForm] of FILE_ASSERTIONS) {
    test(`${file}: contains new form "${newForm}"`, () => {
      const content = contentMap[file];
      assert.ok(
        content.includes(newForm),
        `${file} is missing expected new form "${newForm}"`
      );
    });
  }

  // Blanket check: no affected workflow file contains any of the deleted command names
  // (catches any we might have missed in per-file assertions above)
  const affectedFiles = [
    'help.md',
    'do.md',
    'settings.md',
    'discuss-phase.md',
    'new-project.md',
    'plan-phase.md',
    'spike.md',
    'sketch.md',
  ];

  for (const file of affectedFiles) {
    const content = read(file);
    for (const deleted of DELETED_COMMANDS) {
      test(`${file}: blanket check — "${deleted}" not present`, () => {
        assert.ok(
          !content.includes(deleted),
          `${file} contains deleted command "${deleted}"`
        );
      });
    }
  }
});
