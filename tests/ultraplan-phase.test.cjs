/**
 * /sdd-ultraplan-phase [BETA] Tests
 *
 * Structural assertions for the ultraplan-phase command and workflow files.
 * This command offloads SDD plan phase to Claude Code's ultraplan cloud infrastructure.
 */

'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const CMD_PATH = path.join(__dirname, '..', 'commands', 'sdd', 'ultraplan-phase.md');
const WF_PATH = path.join(__dirname, '..', 'sdd', 'workflows', 'ultraplan-phase.md');

// ─── File Existence ────────────────────────────────────────────────────────────

describe('ultraplan-phase file existence', () => {
  test('command file exists', () => {
    assert.ok(fs.existsSync(CMD_PATH), 'commands/sdd/ultraplan-phase.md should exist');
  });

  test('workflow file exists', () => {
    assert.ok(fs.existsSync(WF_PATH), 'sdd/workflows/ultraplan-phase.md should exist');
  });
});

// ─── Command Frontmatter ───────────────────────────────────────────────────────

describe('ultraplan-phase command frontmatter', () => {
  const content = fs.readFileSync(CMD_PATH, 'utf-8');

  test('has correct name field', () => {
    assert.match(content, /^name:\s*sdd:ultraplan-phase$/m);
  });

  test('description marks feature as BETA', () => {
    assert.match(content, /^description:.*\[BETA\]/m);
  });

  test('has argument-hint', () => {
    assert.match(content, /^argument-hint:/m);
  });
});

// ─── Command References ────────────────────────────────────────────────────────

describe('ultraplan-phase command references', () => {
  const content = fs.readFileSync(CMD_PATH, 'utf-8');

  test('references the ultraplan-phase workflow', () => {
    assert.ok(
      content.includes('@~/.claude/sdd/workflows/ultraplan-phase.md'),
      'command should reference ultraplan-phase workflow'
    );
  });

  test('references ui-brand', () => {
    assert.ok(content.includes('ui-brand'), 'command should reference ui-brand');
  });
});

// ─── Workflow: Beta Marker ─────────────────────────────────────────────────────

describe('ultraplan-phase workflow beta marker', () => {
  const content = fs.readFileSync(WF_PATH, 'utf-8');

  test('workflow displays a BETA warning', () => {
    assert.ok(content.includes('BETA') || content.includes('beta'), 'workflow should display a BETA warning');
  });

  test('workflow notes ultraplan is in research preview', () => {
    assert.ok(content.includes('research preview') || content.includes('preview'), 'workflow should note ultraplan is in research preview');
  });
});

// ─── Workflow: Runtime Gate ────────────────────────────────────────────────────

describe('ultraplan-phase workflow runtime gate', () => {
  const content = fs.readFileSync(WF_PATH, 'utf-8');

  test('checks CLAUDE_CODE_VERSION to detect Claude Code runtime', () => {
    assert.ok(content.includes('CLAUDE_CODE_VERSION'), 'workflow must gate on CLAUDE_CODE_VERSION env var');
  });

  test('error message references /sdd-plan-phase as local alternative', () => {
    assert.ok(
      content.includes('sdd-plan-phase'),
      'error message should direct users to /sdd-plan-phase as the local alternative'
    );
  });
});

// ─── Workflow: Initialization ──────────────────────────────────────────────────

describe('ultraplan-phase workflow initialization', () => {
  const content = fs.readFileSync(WF_PATH, 'utf-8');

  test('loads SDD phase context via sdd-sdk query init.plan-phase', () => {
    assert.ok(content.includes('sdd-sdk query init.plan-phase'), 'workflow must load phase context via sdd-sdk query init.plan-phase');
  });

  test('handles missing .planning directory', () => {
    assert.ok(
      content.includes('sdd-new-project') || content.includes('/sdd-new-project'),
      'workflow should direct user to /sdd-new-project when .planning is missing'
    );
  });
});

// ─── Workflow: Ultraplan Prompt ────────────────────────────────────────────────

describe('ultraplan-phase workflow prompt construction', () => {
  const content = fs.readFileSync(WF_PATH, 'utf-8');

  test('includes phase scope from ROADMAP in ultraplan prompt', () => {
    assert.ok(
      content.includes('ROADMAP') || content.includes('phase scope') || content.includes('phase_name'),
      'workflow should include phase scope from ROADMAP.md in the ultraplan prompt'
    );
  });

  test('includes REQUIREMENTS context in ultraplan prompt', () => {
    assert.ok(content.includes('REQUIREMENTS'), 'workflow should include requirements context in the ultraplan prompt');
  });

  test('includes existing RESEARCH when available', () => {
    assert.ok(
      content.includes('RESEARCH') || content.includes('research_path'),
      'workflow should include existing research in the ultraplan prompt'
    );
  });
});

// ─── Workflow: Ultraplan Trigger ───────────────────────────────────────────────

describe('ultraplan-phase workflow ultraplan trigger', () => {
  const content = fs.readFileSync(WF_PATH, 'utf-8');

  test('triggers /ultraplan command', () => {
    assert.ok(content.includes('/ultraplan'), 'workflow must trigger /ultraplan');
  });
});

// ─── Workflow: Return Path Instructions ───────────────────────────────────────

describe('ultraplan-phase workflow return path', () => {
  const content = fs.readFileSync(WF_PATH, 'utf-8');

  test('instructs user to choose Cancel to save plan to file', () => {
    assert.ok(content.includes('Cancel'), 'workflow must instruct user to choose Cancel to save the plan to a file');
  });

  test('directs user to run /sdd-import --from after ultraplan completes', () => {
    assert.ok(content.includes('sdd-import'), 'workflow must direct user to run /sdd-import --from with the saved file path');
  });

  test('mentions the --from flag for sdd-import', () => {
    assert.ok(content.includes('--from'), 'workflow should reference /sdd-import --from <file-path>');
  });

  test('return-path instructions appear before the /ultraplan trigger', () => {
    const ultraplanTriggerIndex = content.indexOf('/ultraplan');
    const importIndex = content.indexOf('sdd-import');
    assert.ok(
      importIndex < ultraplanTriggerIndex,
      'return-path instructions (sdd-import) must appear before /ultraplan trigger so they are visible in scroll-back'
    );
  });
});

// ─── Workflow: Isolation from Core Pipeline ────────────────────────────────────

describe('ultraplan-phase workflow isolation', () => {
  const content = fs.readFileSync(WF_PATH, 'utf-8');

  test('does NOT directly write PLAN.md files', () => {
    assert.ok(
      !content.includes('write PLAN.md') && !content.includes('Write(\'.planning'),
      'workflow must NOT directly write PLAN.md — delegates to /sdd-import --from'
    );
  });

  test('does NOT reference ultrareview', () => {
    assert.ok(!content.includes('ultrareview'), 'workflow must not reference ultrareview');
  });
});
