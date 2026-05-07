'use strict';

/**
 * For every `commands/sdd/*.md`, assert its `/sdd-<name>` slash command
 * appears either (a) as a `### /sdd-...` heading in docs/COMMANDS.md or
 * (b) as a row in docs/INVENTORY.md's Commands table. At least one of
 * these must be true so every shipped command is reachable from docs.
 *
 * Related: docs readiness refresh, lane-12 recommendation.
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const COMMANDS_DIR = path.join(ROOT, 'commands', 'sdd');
const COMMANDS_MD = fs.readFileSync(path.join(ROOT, 'docs', 'COMMANDS.md'), 'utf8');
const INVENTORY_MD = fs.readFileSync(path.join(ROOT, 'docs', 'INVENTORY.md'), 'utf8');

const commandFiles = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.md'));

function mentionedInCommandsDoc(slug) {
  // Match a heading like: ### /sdd-<slug>  or  ## /sdd-<slug>
  const headingRe = new RegExp(`^#{2,4}\\s+\\\`?/sdd-${slug}\\\`?(?:[\\s(]|$)`, 'm');
  return headingRe.test(COMMANDS_MD);
}

function mentionedInInventory(slug) {
  // Match a row like: | `/sdd-<slug>` | ... |
  const rowRe = new RegExp(`\\|\\s*\\\`/sdd-${slug}\\\`\\s*\\|`, 'm');
  return rowRe.test(INVENTORY_MD);
}

describe('every shipped command is documented somewhere', () => {
  for (const file of commandFiles) {
    const slug = file.replace(/\.md$/, '');
    test(`/sdd-${slug}`, () => {
      const inCommandsDoc = mentionedInCommandsDoc(slug);
      const inInventory = mentionedInInventory(slug);
      assert.ok(
        inCommandsDoc || inInventory,
        `commands/sdd/${file} is not mentioned in docs/COMMANDS.md (as a heading) or docs/INVENTORY.md (as a Commands row) — add a one-line entry to at least one`,
      );
    });
  }
});
