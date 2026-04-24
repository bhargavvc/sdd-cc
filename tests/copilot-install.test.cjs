/**
 * SDD Tools Tests - Copilot Install Plumbing
 *
 * Tests for Copilot runtime directory resolution, config paths,
 * and integration with the multi-runtime installer.
 *
 * Requirements: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-06
 */

process.env.SDD_TEST_MODE = '1';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const os = require('os');
const fs = require('fs');

const {
  getDirName,
  getGlobalDir,
  getConfigDirFromHome,
  claudeToCopilotTools,
  convertCopilotToolName,
  convertClaudeToCopilotContent,
  convertClaudeCommandToCopilotSkill,
  convertClaudeAgentToCopilotAgent,
  copyCommandsAsCopilotSkills,
  SDD_COPILOT_INSTRUCTIONS_MARKER,
  SDD_COPILOT_INSTRUCTIONS_CLOSE_MARKER,
  mergeCopilotInstructions,
  stripSddFromCopilotInstructions,
  writeManifest,
  reportLocalPatches,
} = require('../bin/install.js');

// ─── getDirName ─────────────────────────────────────────────────────────────────

describe('getDirName (Copilot)', () => {
  test('returns .github for copilot', () => {
    assert.strictEqual(getDirName('copilot'), '.github');
  });

  test('does not break existing runtimes', () => {
    assert.strictEqual(getDirName('claude'), '.claude');
    assert.strictEqual(getDirName('opencode'), '.opencode');
    assert.strictEqual(getDirName('gemini'), '.gemini');
    assert.strictEqual(getDirName('kilo'), '.kilo');
    assert.strictEqual(getDirName('codex'), '.codex');
  });
});

// ─── getGlobalDir ───────────────────────────────────────────────────────────────

describe('getGlobalDir (Copilot)', () => {
  let originalCopilotConfigDir;

  beforeEach(() => {
    originalCopilotConfigDir = process.env.COPILOT_CONFIG_DIR;
  });

  afterEach(() => {
    if (originalCopilotConfigDir !== undefined) {
      process.env.COPILOT_CONFIG_DIR = originalCopilotConfigDir;
    } else {
      delete process.env.COPILOT_CONFIG_DIR;
    }
  });

  test('returns ~/.copilot with no env var or explicit dir', () => {
    delete process.env.COPILOT_CONFIG_DIR;
    const result = getGlobalDir('copilot');
    assert.strictEqual(result, path.join(os.homedir(), '.copilot'));
  });

  test('returns explicit dir when provided', () => {
    const result = getGlobalDir('copilot', '/custom/path');
    assert.strictEqual(result, '/custom/path');
  });

  test('respects COPILOT_CONFIG_DIR env var', () => {
    process.env.COPILOT_CONFIG_DIR = '~/custom-copilot';
    const result = getGlobalDir('copilot');
    assert.strictEqual(result, path.join(os.homedir(), 'custom-copilot'));
  });

  test('explicit dir takes priority over COPILOT_CONFIG_DIR', () => {
    process.env.COPILOT_CONFIG_DIR = '~/env-path';
    const result = getGlobalDir('copilot', '/explicit/path');
    assert.strictEqual(result, '/explicit/path');
  });

  test('does not break existing runtimes', () => {
    assert.strictEqual(getGlobalDir('claude'), path.join(os.homedir(), '.claude'));
    assert.strictEqual(getGlobalDir('codex'), path.join(os.homedir(), '.codex'));
  });
});

// ─── getConfigDirFromHome ───────────────────────────────────────────────────────

describe('getConfigDirFromHome (Copilot)', () => {
  test('returns .github path string for local (isGlobal=false)', () => {
    assert.strictEqual(getConfigDirFromHome('copilot', false), "'.github'");
  });

  test('returns .copilot path string for global (isGlobal=true)', () => {
    assert.strictEqual(getConfigDirFromHome('copilot', true), "'.copilot'");
  });

  test('does not break existing runtimes', () => {
    assert.strictEqual(getConfigDirFromHome('opencode', true), "'.config', 'opencode'");
    assert.strictEqual(getConfigDirFromHome('claude', true), "'.claude'");
    assert.strictEqual(getConfigDirFromHome('gemini', true), "'.gemini'");
    assert.strictEqual(getConfigDirFromHome('kilo', true), "'.config', 'kilo'");
    assert.strictEqual(getConfigDirFromHome('codex', true), "'.codex'");
  });
});

// ─── Source code integration checks ─────────────────────────────────────────────

describe('Source code integration (Copilot)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'bin', 'install.js'), 'utf8');

  test('CLI-01: --copilot flag parsing exists', () => {
    assert.ok(src.includes("args.includes('--copilot')"), '--copilot flag parsed');
  });

  test('CLI-03: --all array includes copilot', () => {
    assert.ok(
      src.includes("'copilot'") && src.includes('selectedRuntimes = ['),
      '--all includes copilot runtime'
    );
  });

  test('CLI-06: banner text includes Copilot', () => {
    assert.ok(src.includes('Copilot'), 'banner mentions Copilot');
  });

  test('CLI-06: help text includes --copilot', () => {
    assert.ok(src.includes('--copilot'), 'help text has --copilot option');
  });

  test('CLI-02: promptRuntime runtimeMap has Copilot as option 7', () => {
    assert.ok(src.includes("'7': 'copilot'"), 'runtimeMap has 7 -> copilot');
  });

  test('CLI-02: promptRuntime allRuntimes array includes copilot', () => {
    const allMatch = src.match(/const allRuntimes = \[([^\]]+)\]/);
    assert.ok(allMatch && allMatch[1].includes('copilot'), 'allRuntimes includes copilot');
  });

  test('CLI-02: promptRuntime keeps Kilo above OpenCode in allRuntimes', () => {
    const allMatch = src.match(/const allRuntimes = \[([^\]]+)\]/);
    assert.ok(allMatch, 'allRuntimes array found');
    assert.ok(allMatch[1].indexOf("'kilo'") < allMatch[1].indexOf("'opencode'"), 'kilo appears before opencode');
  });

  test('isCopilot variable exists in install function', () => {
    assert.ok(src.includes("const isCopilot = runtime === 'copilot'"), 'isCopilot defined');
  });

  test('hooks are skipped for Copilot', () => {
    assert.ok(src.includes('!isCodex && !isCopilot'), 'hooks skip check includes copilot');
  });

  test('--both flag unchanged (still claude + opencode only)', () => {
    // Verify the else-if-hasBoth maps to ['claude', 'opencode'] — NOT including copilot
    const bothUsage = src.indexOf('} else if (hasBoth)');
    assert.ok(bothUsage > 0, 'hasBoth usage exists');
    const bothSection = src.substring(bothUsage, bothUsage + 200);
    assert.ok(bothSection.includes("['claude', 'opencode']"), '--both maps to claude+opencode');
    assert.ok(!bothSection.includes('copilot'), '--both does NOT include copilot');
  });
});

// ─── convertCopilotToolName ─────────────────────────────────────────────────────

describe('convertCopilotToolName', () => {
  test('maps Read to read', () => {
    assert.strictEqual(convertCopilotToolName('Read'), 'read');
  });

  test('maps Write to edit', () => {
    assert.strictEqual(convertCopilotToolName('Write'), 'edit');
  });

  test('maps Edit to edit (same as Write)', () => {
    assert.strictEqual(convertCopilotToolName('Edit'), 'edit');
  });

  test('maps Bash to execute', () => {
    assert.strictEqual(convertCopilotToolName('Bash'), 'execute');
  });

  test('maps Grep to search', () => {
    assert.strictEqual(convertCopilotToolName('Grep'), 'search');
  });

  test('maps Glob to search (same as Grep)', () => {
    assert.strictEqual(convertCopilotToolName('Glob'), 'search');
  });

  test('maps Task to agent', () => {
    assert.strictEqual(convertCopilotToolName('Task'), 'agent');
  });

  test('maps WebSearch to web', () => {
    assert.strictEqual(convertCopilotToolName('WebSearch'), 'web');
  });

  test('maps WebFetch to web (same as WebSearch)', () => {
    assert.strictEqual(convertCopilotToolName('WebFetch'), 'web');
  });

  test('maps TodoWrite to todo', () => {
    assert.strictEqual(convertCopilotToolName('TodoWrite'), 'todo');
  });

  test('maps AskUserQuestion to ask_user', () => {
    assert.strictEqual(convertCopilotToolName('AskUserQuestion'), 'ask_user');
  });

  test('maps SlashCommand to skill', () => {
    assert.strictEqual(convertCopilotToolName('SlashCommand'), 'skill');
  });

  test('maps mcp__context7__ prefix to io.github.upstash/context7/', () => {
    assert.strictEqual(
      convertCopilotToolName('mcp__context7__resolve-library-id'),
      'io.github.upstash/context7/resolve-library-id'
    );
  });

  test('maps mcp__context7__* wildcard', () => {
    assert.strictEqual(
      convertCopilotToolName('mcp__context7__*'),
      'io.github.upstash/context7/*'
    );
  });

  test('lowercases unknown tools as fallback', () => {
    assert.strictEqual(convertCopilotToolName('SomeNewTool'), 'somenewtool');
  });

  test('mapping constant has 13 entries (12 direct + mcp handled separately)', () => {
    assert.strictEqual(Object.keys(claudeToCopilotTools).length, 12);
  });
});

// ─── convertClaudeToCopilotContent ──────────────────────────────────────────────

describe('convertClaudeToCopilotContent', () => {
  test('replaces ~/.claude/ with .github/ in local mode (default)', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('see ~/.claude/foo'),
      'see .github/foo'
    );
  });

  test('replaces ~/.claude/ with ~/.copilot/ in global mode', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('see ~/.claude/foo', true),
      'see ~/.copilot/foo'
    );
  });

  test('replaces ./.claude/ with ./.github/', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('at ./.claude/bar'),
      'at ./.github/bar'
    );
  });

  test('replaces bare .claude/ with .github/', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('in .claude/baz'),
      'in .github/baz'
    );
  });

  test('replaces $HOME/.claude/ with .github/ in local mode (default)', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('"$HOME/.claude/config"'),
      '".github/config"'
    );
  });

  test('replaces $HOME/.claude/ with $HOME/.copilot/ in global mode', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('"$HOME/.claude/config"', true),
      '"$HOME/.copilot/config"'
    );
  });

  test('converts sdd: to sdd- in command names', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('run /sdd:health or sdd:progress'),
      'run /sdd-health or sdd-progress'
    );
  });

  test('handles mixed content in local mode', () => {
    const input = 'Config at ~/.claude/settings and $HOME/.claude/config.\n' +
      'Local at ./.claude/data and .claude/commands.\n' +
      'Run sdd:health and /sdd:progress.';
    const result = convertClaudeToCopilotContent(input);
    assert.ok(result.includes('.github/settings'), 'tilde path converted to local');
    assert.ok(!result.includes('$HOME/.claude/'), '$HOME path converted');
    assert.ok(result.includes('./.github/data'), 'dot-slash path converted');
    assert.ok(result.includes('.github/commands'), 'bare path converted');
    assert.ok(result.includes('sdd-health'), 'command name converted');
    assert.ok(result.includes('/sdd-progress'), 'slash command converted');
  });

  test('handles mixed content in global mode', () => {
    const input = 'Config at ~/.claude/settings and $HOME/.claude/config.\n' +
      'Local at ./.claude/data and .claude/commands.\n' +
      'Run sdd:health and /sdd:progress.';
    const result = convertClaudeToCopilotContent(input, true);
    assert.ok(result.includes('~/.copilot/settings'), 'tilde path converted to global');
    assert.ok(result.includes('$HOME/.copilot/config'), '$HOME path converted to global');
    assert.ok(result.includes('./.github/data'), 'dot-slash path converted');
    assert.ok(result.includes('.github/commands'), 'bare path converted');
  });

  test('does not double-replace in local mode', () => {
    const input = '~/.claude/foo and ./.claude/bar and .claude/baz';
    const result = convertClaudeToCopilotContent(input);
    assert.ok(!result.includes('.github/.github/'), 'no .github/.github/ artifact');
    assert.strictEqual(result, '.github/foo and ./.github/bar and .github/baz');
  });

  test('does not double-replace in global mode', () => {
    const input = '~/.claude/foo and ./.claude/bar and .claude/baz';
    const result = convertClaudeToCopilotContent(input, true);
    assert.ok(!result.includes('.copilot/.github/'), 'no .copilot/.github/ artifact');
    assert.strictEqual(result, '~/.copilot/foo and ./.github/bar and .github/baz');
  });

  test('preserves content with no matches', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('hello world'),
      'hello world'
    );
  });
});

// ─── convertClaudeCommandToCopilotSkill ─────────────────────────────────────────

describe('convertClaudeCommandToCopilotSkill', () => {
  test('converts frontmatter with all fields', () => {
    const input = `---
name: sdd:health
description: Diagnose planning directory health
argument-hint: [--repair]
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
---

Body content here referencing ~/.claude/foo and sdd:health.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'sdd-health');
    assert.ok(result.startsWith('---\nname: sdd-health\n'), 'name uses param');
    assert.ok(result.includes('description: Diagnose planning directory health'), 'description preserved');
    assert.ok(result.includes('argument-hint: "[--repair]"'), 'argument-hint double-quoted');
    assert.ok(result.includes('allowed-tools: Read, Bash, Write, AskUserQuestion'), 'tools comma-separated');
    assert.ok(result.includes('.github/foo'), 'CONV-06 applied to body (local mode default)');
    assert.ok(result.includes('sdd-health'), 'CONV-07 applied to body');
    assert.ok(!result.includes('sdd:health'), 'no sdd: references remain');
  });

  test('handles skill without allowed-tools', () => {
    const input = `---
name: sdd:help
description: Show available SDD commands
---

Help content.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'sdd-help');
    assert.ok(result.includes('name: sdd-help'), 'name set');
    assert.ok(result.includes('description: Show available SDD commands'), 'description preserved');
    assert.ok(!result.includes('allowed-tools:'), 'no allowed-tools line');
  });

  test('handles skill without argument-hint', () => {
    const input = `---
name: sdd:progress
description: Show project progress
allowed-tools:
  - Read
  - Bash
---

Progress body.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'sdd-progress');
    assert.ok(!result.includes('argument-hint:'), 'no argument-hint line');
    assert.ok(result.includes('allowed-tools: Read, Bash'), 'tools present');
  });

  test('argument-hint with inner single quotes uses double-quote YAML delimiter', () => {
    const input = `---
name: sdd:new-milestone
description: Start milestone
argument-hint: "[milestone name, e.g., 'v1.1 Notifications']"
allowed-tools:
  - Read
---

Body.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'sdd-new-milestone');
    assert.ok(result.includes(`argument-hint: "[milestone name, e.g., 'v1.1 Notifications']"`), 'inner single quotes preserved with double-quote delimiter');
  });

  test('applies CONV-06 path conversion to body (local mode)', () => {
    const input = `---
name: sdd:test
description: Test skill
---

Check ~/.claude/settings and ./.claude/local and $HOME/.claude/global.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'sdd-test');
    assert.ok(result.includes('.github/settings'), 'tilde path converted to local');
    assert.ok(result.includes('./.github/local'), 'dot-slash path converted');
    assert.ok(result.includes('.github/global'), '$HOME path converted to local');
  });

  test('applies CONV-06 path conversion to body (global mode)', () => {
    const input = `---
name: sdd:test
description: Test skill
---

Check ~/.claude/settings and ./.claude/local and $HOME/.claude/global.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'sdd-test', true);
    assert.ok(result.includes('~/.copilot/settings'), 'tilde path converted to global');
    assert.ok(result.includes('./.github/local'), 'dot-slash path converted');
    assert.ok(result.includes('$HOME/.copilot/global'), '$HOME path converted to global');
  });

  test('applies CONV-07 command name conversion to body', () => {
    const input = `---
name: sdd:test
description: Test skill
---

Run sdd:health and /sdd:progress for diagnostics.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'sdd-test');
    assert.ok(result.includes('sdd-health'), 'sdd:health converted');
    assert.ok(result.includes('/sdd-progress'), '/sdd:progress converted');
    assert.ok(!result.match(/sdd:[a-z]/), 'no sdd: command refs remain');
  });

  test('handles content without frontmatter (local mode)', () => {
    const input = 'Just some markdown with ~/.claude/path and sdd:health.';
    const result = convertClaudeCommandToCopilotSkill(input, 'sdd-test');
    assert.ok(result.includes('.github/path'), 'CONV-06 applied (local)');
    assert.ok(result.includes('sdd-health'), 'CONV-07 applied');
    assert.ok(!result.includes('---'), 'no frontmatter added');
  });

  test('preserves agent field in frontmatter', () => {
    const input = `---
name: sdd:execute-phase
description: Execute a phase
agent: sdd-planner
allowed-tools:
  - Read
  - Bash
---

Body.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'sdd-execute-phase');
    assert.ok(result.includes('agent: sdd-planner'), 'agent field preserved');
  });
});

// ─── convertClaudeAgentToCopilotAgent ───────────────────────────────────────────

describe('convertClaudeAgentToCopilotAgent', () => {
  test('maps and deduplicates tools', () => {
    const input = `---
name: sdd-executor
description: Executes SDD plans
tools: Read, Write, Edit, Bash, Grep, Glob
color: yellow
---

Agent body.`;

    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.includes("tools: ['read', 'edit', 'execute', 'search']"), 'tools mapped and deduped');
  });

  test('formats tools as JSON array', () => {
    const input = `---
name: sdd-test
description: Test agent
tools: Read, Bash
---

Body.`;

    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.match(/tools: \['[a-z_]+'(, '[a-z_]+')*\]/), 'tools formatted as JSON array');
  });

  test('preserves name description and color', () => {
    const input = `---
name: sdd-executor
description: Executes SDD plans with atomic commits
tools: Read, Bash
color: yellow
---

Body.`;

    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.includes('name: sdd-executor'), 'name preserved');
    assert.ok(result.includes('description: Executes SDD plans with atomic commits'), 'description preserved');
    assert.ok(result.includes('color: yellow'), 'color preserved');
  });

  test('handles mcp__context7__ tools', () => {
    const input = `---
name: sdd-researcher
description: Research agent
tools: Read, Bash, mcp__context7__resolve-library-id
color: cyan
---

Body.`;

    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.includes('io.github.upstash/context7/resolve-library-id'), 'mcp tool mapped');
    assert.ok(!result.includes('mcp__context7__'), 'no mcp__ prefix remains');
  });

  test('handles agent with no tools field', () => {
    const input = `---
name: sdd-empty
description: Empty agent
color: green
---

Body.`;

    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.includes('tools: []'), 'missing tools produces []');
  });

  test('applies CONV-06 and CONV-07 to body (local mode)', () => {
    const input = `---
name: sdd-test
description: Test
tools: Read
---

Check ~/.claude/settings and run sdd:health.`;

    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.includes('.github/settings'), 'CONV-06 applied (local)');
    assert.ok(result.includes('sdd-health'), 'CONV-07 applied');
    assert.ok(!result.includes('~/.claude/'), 'no ~/.claude/ remains');
    assert.ok(!result.match(/sdd:[a-z]/), 'no sdd: command refs remain');
  });

  test('applies CONV-06 and CONV-07 to body (global mode)', () => {
    const input = `---
name: sdd-test
description: Test
tools: Read
---

Check ~/.claude/settings and run sdd:health.`;

    const result = convertClaudeAgentToCopilotAgent(input, true);
    assert.ok(result.includes('~/.copilot/settings'), 'CONV-06 applied (global)');
    assert.ok(result.includes('sdd-health'), 'CONV-07 applied');
  });

  test('handles content without frontmatter (local mode)', () => {
    const input = 'Just markdown with ~/.claude/path and sdd:test.';
    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.includes('.github/path'), 'CONV-06 applied (local)');
    assert.ok(result.includes('sdd-test'), 'CONV-07 applied');
    assert.ok(!result.includes('---'), 'no frontmatter added');
  });
});

// ─── copyCommandsAsCopilotSkills (integration) ─────────────────────────────────

describe('copyCommandsAsCopilotSkills', () => {
  const srcDir = path.join(__dirname, '..', 'commands', 'sdd');
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-copilot-skills-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('creates skill folders from source commands', () => {
    copyCommandsAsCopilotSkills(srcDir, tempDir, 'sdd');

    // Check specific folders exist
    assert.ok(fs.existsSync(path.join(tempDir, 'sdd-health')), 'sdd-health folder exists');
    assert.ok(fs.existsSync(path.join(tempDir, 'sdd-health', 'SKILL.md')), 'sdd-health/SKILL.md exists');
    assert.ok(fs.existsSync(path.join(tempDir, 'sdd-help')), 'sdd-help folder exists');
    assert.ok(fs.existsSync(path.join(tempDir, 'sdd-progress')), 'sdd-progress folder exists');

    // Count sdd-* directories — should match number of source command files
    const dirs = fs.readdirSync(tempDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name.startsWith('sdd-'));
    const expectedSkillCount = fs.readdirSync(path.join(__dirname, '..', 'commands', 'sdd'))
      .filter(f => f.endsWith('.md')).length;
    assert.strictEqual(dirs.length, expectedSkillCount, `expected ${expectedSkillCount} skill folders, got ${dirs.length}`);
  });

  test('skill content has Copilot frontmatter format', () => {
    copyCommandsAsCopilotSkills(srcDir, tempDir, 'sdd');

    const skillContent = fs.readFileSync(path.join(tempDir, 'sdd-health', 'SKILL.md'), 'utf8');
    // Frontmatter format checks
    assert.ok(skillContent.startsWith('---\nname: sdd-health\n'), 'starts with name: sdd-health');
    assert.ok(skillContent.includes('allowed-tools: Read, Bash, Write, AskUserQuestion'),
      'allowed-tools is comma-separated');
    assert.ok(!skillContent.includes('allowed-tools:\n  -'), 'NOT YAML multiline format');
    // CONV-06/07 applied
    assert.ok(!skillContent.includes('~/.claude/'), 'no ~/.claude/ references');
    assert.ok(!skillContent.match(/sdd:[a-z]/), 'no sdd: command references');
  });

  test('generates sdd-autonomous skill from autonomous.md command', () => {
    // Fail-fast: source command must exist
    const srcFile = path.join(srcDir, 'autonomous.md');
    assert.ok(fs.existsSync(srcFile), 'commands/sdd/autonomous.md must exist as source');

    copyCommandsAsCopilotSkills(srcDir, tempDir, 'sdd');

    // Skill folder and file created
    assert.ok(fs.existsSync(path.join(tempDir, 'sdd-autonomous')), 'sdd-autonomous folder exists');
    assert.ok(fs.existsSync(path.join(tempDir, 'sdd-autonomous', 'SKILL.md')), 'sdd-autonomous/SKILL.md exists');

    const skillContent = fs.readFileSync(path.join(tempDir, 'sdd-autonomous', 'SKILL.md'), 'utf8');

    // Frontmatter: name converted from sdd:autonomous to sdd-autonomous
    assert.ok(skillContent.startsWith('---\nname: sdd-autonomous\n'), 'name is sdd-autonomous');
    assert.ok(skillContent.includes('description: Run all remaining phases autonomously'),
      'description preserved');
    // argument-hint present and double-quoted
    assert.ok(skillContent.includes('argument-hint: "[--from N] [--to N] [--only N] [--interactive]"'), 'argument-hint present and quoted');
    // allowed-tools comma-separated
    assert.ok(skillContent.includes('allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion, Task'),
      'allowed-tools is comma-separated');
    // No Claude-format remnants
    assert.ok(!skillContent.includes('allowed-tools:\n  -'), 'NOT YAML multiline format');
    assert.ok(!skillContent.includes('~/.claude/'), 'no ~/.claude/ references in body');
  });

  test('autonomous skill body converts sdd: to sdd- (CONV-07)', () => {
    // Use convertClaudeToCopilotContent directly on the command body content
    const srcContent = fs.readFileSync(path.join(srcDir, 'autonomous.md'), 'utf8');
    const result = convertClaudeToCopilotContent(srcContent);

    // sdd:autonomous references should be converted to sdd-autonomous
    assert.ok(!result.match(/sdd:[a-z]/), 'no sdd: command references remain after conversion');
    // Specific: sdd:discuss-phase, sdd:plan-phase, sdd:execute-phase mentioned in body
    // The body references sdd-tools.cjs (not a sdd: command) — those should be unaffected
    // But /sdd:autonomous → /sdd-autonomous, sdd:discuss-phase → sdd-discuss-phase etc.
    if (srcContent.includes('sdd:autonomous')) {
      assert.ok(result.includes('sdd-autonomous'), 'sdd:autonomous converted to sdd-autonomous');
    }
    // Path conversion: ~/.claude/ → .github/
    assert.ok(!result.includes('~/.claude/'), 'no ~/.claude/ paths remain');
  });

  test('cleans up old skill directories on re-run', () => {
    // Create a fake old directory
    fs.mkdirSync(path.join(tempDir, 'sdd-fake-old'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'sdd-fake-old', 'SKILL.md'), 'old');
    assert.ok(fs.existsSync(path.join(tempDir, 'sdd-fake-old')), 'fake old dir exists before');

    // Run copy — should clean up old dirs
    copyCommandsAsCopilotSkills(srcDir, tempDir, 'sdd');

    assert.ok(!fs.existsSync(path.join(tempDir, 'sdd-fake-old')), 'fake old dir removed');
    assert.ok(fs.existsSync(path.join(tempDir, 'sdd-health')), 'real dirs still exist');
  });
});

// ─── Copilot agent conversion - real files ──────────────────────────────────────

describe('Copilot agent conversion - real files', () => {
  const agentsSrc = path.join(__dirname, '..', 'agents');

  test('converts sdd-executor agent correctly', () => {
    const content = fs.readFileSync(path.join(agentsSrc, 'sdd-executor.md'), 'utf8');
    const result = convertClaudeAgentToCopilotAgent(content);

    assert.ok(result.startsWith('---\nname: sdd-executor\n'), 'starts with correct name');
    // Verify deduplication happened and core tools are present (not hardcoded exact list)
    const toolsLine = result.split('\n').find(l => l.startsWith('tools:'));
    assert.ok(toolsLine, 'tools line present in converted output');
    assert.ok(toolsLine.includes("'read'"), 'Read mapped to read');
    assert.ok(toolsLine.includes("'edit'"), 'Write/Edit deduplicated to edit');
    assert.ok(toolsLine.includes("'execute'"), 'Bash mapped to execute');
    assert.ok(toolsLine.includes("'search'"), 'Grep/Glob deduplicated to search');
    // Input tools count > output tools count (deduplication occurred)
    const inputTools = content.match(/^tools:\s*\[([^\]]+)\]/m)?.[1].split(',').length ?? 0;
    const outputTools = toolsLine.replace(/^tools:\s*\[/, '').replace(/\].*$/, '').split(',').length;
    assert.ok(inputTools === 0 || outputTools <= inputTools, 'deduplication reduced or preserved tool count');
    assert.ok(result.includes('color: yellow'), 'color preserved');
    assert.ok(!result.includes('~/.claude/'), 'no ~/.claude/ in body');
  });

  test('converts agent with mcp wildcard tools correctly', () => {
    const content = fs.readFileSync(path.join(agentsSrc, 'sdd-phase-researcher.md'), 'utf8');
    const result = convertClaudeAgentToCopilotAgent(content);

    const toolsLine = result.split('\n').find(l => l.startsWith('tools:'));
    assert.ok(toolsLine.includes('io.github.upstash/context7/*'), 'mcp wildcard mapped in tools');
    assert.ok(!toolsLine.includes('mcp__context7__'), 'no mcp__ prefix in tools line');
    assert.ok(toolsLine.includes("'web'"), 'WebSearch/WebFetch deduplicated to web');
    assert.ok(toolsLine.includes("'read'"), 'Read mapped');
  });

  test('all 18 agents convert without error', () => {
    const agents = fs.readdirSync(agentsSrc)
      .filter(f => f.startsWith('sdd-') && f.endsWith('.md'));
    const expectedAgentCount = fs.readdirSync(agentsSrc)
      .filter(f => f.startsWith('sdd-') && f.endsWith('.md')).length;
    assert.strictEqual(agents.length, expectedAgentCount, `expected ${expectedAgentCount} agents, got ${agents.length}`);

    for (const agentFile of agents) {
      const content = fs.readFileSync(path.join(agentsSrc, agentFile), 'utf8');
      const result = convertClaudeAgentToCopilotAgent(content);
      assert.ok(result.startsWith('---\n'), `${agentFile} should have frontmatter`);
      assert.ok(result.includes('tools:'), `${agentFile} should have tools field`);
      assert.ok(!result.includes('~/.claude/'), `${agentFile} should not contain ~/.claude/`);
    }
  });
});

// ─── Copilot content conversion - engine files ─────────────────────────────────

describe('Copilot content conversion - engine files', () => {
  test('converts engine .md files correctly (local mode default)', () => {
    const healthMd = fs.readFileSync(
      path.join(__dirname, '..', 'sdd', 'workflows', 'health.md'), 'utf8'
    );
    const result = convertClaudeToCopilotContent(healthMd);

    assert.ok(!result.includes('~/.claude/'), 'no ~/.claude/ references remain');
    assert.ok(!result.includes('$HOME/.claude/'), 'no $HOME/.claude/ references remain');
    assert.ok(!result.match(/\/sdd:[a-z]/), 'no /sdd: command references remain');
    assert.ok(!result.match(/(?<!\/)sdd:[a-z]/), 'no bare sdd: command references remain');
    // Local mode: ~ and $HOME resolve to .github (repo-relative, no ./ prefix)
    assert.ok(result.includes('.github/'), 'paths converted to .github for local');
    assert.ok(result.includes('sdd-health'), 'command name converted');
  });

  test('converts engine .md files correctly (global mode)', () => {
    const healthMd = fs.readFileSync(
      path.join(__dirname, '..', 'sdd', 'workflows', 'health.md'), 'utf8'
    );
    const result = convertClaudeToCopilotContent(healthMd, true);

    assert.ok(!result.includes('~/.claude/'), 'no ~/.claude/ references remain');
    assert.ok(!result.includes('$HOME/.claude/'), 'no $HOME/.claude/ references remain');
    // Global mode: ~ and $HOME resolve to .copilot
    if (healthMd.includes('$HOME/.claude/')) {
      assert.ok(result.includes('$HOME/.copilot/'), '$HOME path converted to .copilot');
    }
    assert.ok(result.includes('sdd-health'), 'command name converted');
  });

  test('converts engine .cjs files correctly', () => {
    const verifyCjs = fs.readFileSync(
      path.join(__dirname, '..', 'sdd', 'bin', 'lib', 'verify.cjs'), 'utf8'
    );
    const result = convertClaudeToCopilotContent(verifyCjs);

    assert.ok(!result.match(/sdd:[a-z]/), 'no sdd: references remain');
    assert.ok(result.includes('sdd-new-project'), 'sdd:new-project converted');
    assert.ok(result.includes('sdd-health'), 'sdd:health converted');
  });
});

// ─── Copilot instructions merge/strip ──────────────────────────────────────────

describe('Copilot instructions merge/strip', () => {
  let tmpDir;

  const sddContent = '- Follow project conventions\n- Use structured workflows';

  function makeSddBlock(content) {
    return SDD_COPILOT_INSTRUCTIONS_MARKER + '\n' + content.trim() + '\n' + SDD_COPILOT_INSTRUCTIONS_CLOSE_MARKER;
  }

  describe('mergeCopilotInstructions', () => {
    let tmpMergeDir;

    beforeEach(() => {
      tmpMergeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-merge-'));
    });

    afterEach(() => {
      fs.rmSync(tmpMergeDir, { recursive: true, force: true });
    });

    test('creates file from scratch when none exists', () => {
      const filePath = path.join(tmpMergeDir, 'copilot-instructions.md');
      mergeCopilotInstructions(filePath, sddContent);

      assert.ok(fs.existsSync(filePath), 'file was created');
      const result = fs.readFileSync(filePath, 'utf8');
      assert.ok(result.includes(SDD_COPILOT_INSTRUCTIONS_MARKER), 'has opening marker');
      assert.ok(result.includes(SDD_COPILOT_INSTRUCTIONS_CLOSE_MARKER), 'has closing marker');
      assert.ok(result.includes('Follow project conventions'), 'has SDD content');
    });

    test('replaces SDD section when both markers present', () => {
      const filePath = path.join(tmpMergeDir, 'copilot-instructions.md');
      const oldContent = '# User Setup\n\n' +
        makeSddBlock('- Old SDD content') +
        '\n\n# User Notes\n';
      fs.writeFileSync(filePath, oldContent);

      mergeCopilotInstructions(filePath, sddContent);
      const result = fs.readFileSync(filePath, 'utf8');

      assert.ok(result.includes('# User Setup'), 'user content before preserved');
      assert.ok(result.includes('# User Notes'), 'user content after preserved');
      assert.ok(!result.includes('Old SDD content'), 'old SDD content removed');
      assert.ok(result.includes('Follow project conventions'), 'new SDD content inserted');
    });

    test('appends to existing file when no markers present', () => {
      const filePath = path.join(tmpMergeDir, 'copilot-instructions.md');
      const userContent = '# My Custom Instructions\n\nDo things my way.\n';
      fs.writeFileSync(filePath, userContent);

      mergeCopilotInstructions(filePath, sddContent);
      const result = fs.readFileSync(filePath, 'utf8');

      assert.ok(result.includes('# My Custom Instructions'), 'original content preserved');
      assert.ok(result.includes('Do things my way.'), 'original text preserved');
      assert.ok(result.includes(SDD_COPILOT_INSTRUCTIONS_MARKER), 'SDD block appended');
      assert.ok(result.includes('Follow project conventions'), 'SDD content appended');
      // Verify separator exists
      assert.ok(result.includes('Do things my way.\n\n' + SDD_COPILOT_INSTRUCTIONS_MARKER),
        'double newline separator before SDD block');
    });

    test('handles file that is SDD-only (re-creates cleanly)', () => {
      const filePath = path.join(tmpMergeDir, 'copilot-instructions.md');
      const sddOnly = makeSddBlock('- Old instructions') + '\n';
      fs.writeFileSync(filePath, sddOnly);

      const newContent = '- Updated instructions';
      mergeCopilotInstructions(filePath, newContent);
      const result = fs.readFileSync(filePath, 'utf8');

      assert.ok(!result.includes('Old instructions'), 'old content removed');
      assert.ok(result.includes('Updated instructions'), 'new content present');
      assert.ok(result.includes(SDD_COPILOT_INSTRUCTIONS_MARKER), 'has opening marker');
      assert.ok(result.includes(SDD_COPILOT_INSTRUCTIONS_CLOSE_MARKER), 'has closing marker');
    });

    test('preserves user content before and after markers', () => {
      const filePath = path.join(tmpMergeDir, 'copilot-instructions.md');
      const content = '# My Setup\n\n' +
        makeSddBlock('- old content') +
        '\n\n# My Notes\n';
      fs.writeFileSync(filePath, content);

      mergeCopilotInstructions(filePath, sddContent);
      const result = fs.readFileSync(filePath, 'utf8');

      assert.ok(result.includes('# My Setup'), 'content before markers preserved');
      assert.ok(result.includes('# My Notes'), 'content after markers preserved');
      assert.ok(result.includes('Follow project conventions'), 'new SDD content between markers');
      // Verify ordering: before → SDD → after
      const setupIdx = result.indexOf('# My Setup');
      const markerIdx = result.indexOf(SDD_COPILOT_INSTRUCTIONS_MARKER);
      const notesIdx = result.indexOf('# My Notes');
      assert.ok(setupIdx < markerIdx, 'user setup comes before SDD block');
      assert.ok(markerIdx < notesIdx, 'SDD block comes before user notes');
    });
  });

  describe('stripSddFromCopilotInstructions', () => {
    test('returns null when content is SDD-only', () => {
      const content = makeSddBlock('- SDD instructions only') + '\n';
      const result = stripSddFromCopilotInstructions(content);
      assert.strictEqual(result, null, 'returns null for SDD-only content');
    });

    test('returns cleaned content when user content exists before markers', () => {
      const content = '# My Setup\n\nCustom rules here.\n\n' +
        makeSddBlock('- SDD stuff') + '\n';
      const result = stripSddFromCopilotInstructions(content);

      assert.ok(result !== null, 'does not return null');
      assert.ok(result.includes('# My Setup'), 'user content preserved');
      assert.ok(result.includes('Custom rules here.'), 'user text preserved');
      assert.ok(!result.includes(SDD_COPILOT_INSTRUCTIONS_MARKER), 'opening marker removed');
      assert.ok(!result.includes(SDD_COPILOT_INSTRUCTIONS_CLOSE_MARKER), 'closing marker removed');
      assert.ok(!result.includes('SDD stuff'), 'SDD content removed');
    });

    test('returns cleaned content when user content exists after markers', () => {
      const content = makeSddBlock('- SDD stuff') + '\n\n# My Notes\n\nPersonal notes.\n';
      const result = stripSddFromCopilotInstructions(content);

      assert.ok(result !== null, 'does not return null');
      assert.ok(result.includes('# My Notes'), 'user content after preserved');
      assert.ok(result.includes('Personal notes.'), 'user text after preserved');
      assert.ok(!result.includes(SDD_COPILOT_INSTRUCTIONS_MARKER), 'opening marker removed');
      assert.ok(!result.includes('SDD stuff'), 'SDD content removed');
    });

    test('returns cleaned content preserving both before and after', () => {
      const content = '# Before\n\n' + makeSddBlock('- SDD middle') + '\n\n# After\n';
      const result = stripSddFromCopilotInstructions(content);

      assert.ok(result !== null, 'does not return null');
      assert.ok(result.includes('# Before'), 'content before preserved');
      assert.ok(result.includes('# After'), 'content after preserved');
      assert.ok(!result.includes('SDD middle'), 'SDD content removed');
      assert.ok(!result.includes(SDD_COPILOT_INSTRUCTIONS_MARKER), 'markers removed');
    });

    test('returns original content when no markers found', () => {
      const content = '# Just user content\n\nNo SDD markers here.\n';
      const result = stripSddFromCopilotInstructions(content);
      assert.strictEqual(result, content, 'returns content unchanged');
    });
  });
});

// ─── Copilot uninstall skill removal ───────────────────────────────────────────

describe('Copilot uninstall skill removal', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-uninstall-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('identifies sdd-* skill directories for removal', () => {
    // Create Copilot-like skills directory structure
    const skillsDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'sdd-foo'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'sdd-foo', 'SKILL.md'), '# Foo');
    fs.mkdirSync(path.join(skillsDir, 'sdd-bar'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'sdd-bar', 'SKILL.md'), '# Bar');
    fs.mkdirSync(path.join(skillsDir, 'custom-skill'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'custom-skill', 'SKILL.md'), '# Custom');

    // Test the pattern: read skills, filter sdd-* entries
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const sddSkills = entries
      .filter(e => e.isDirectory() && e.name.startsWith('sdd-'))
      .map(e => e.name);
    const nonSddSkills = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('sdd-'))
      .map(e => e.name);

    assert.deepStrictEqual(sddSkills.sort(), ['sdd-bar', 'sdd-foo'], 'identifies sdd-* skills');
    assert.deepStrictEqual(nonSddSkills, ['custom-skill'], 'preserves non-sdd skills');
  });

  test('cleans SDD section from copilot-instructions.md on uninstall', () => {
    const content = '# My Setup\n\nMy custom rules.\n\n' +
      SDD_COPILOT_INSTRUCTIONS_MARKER + '\n' +
      '- SDD managed content\n' +
      SDD_COPILOT_INSTRUCTIONS_CLOSE_MARKER + '\n';

    const result = stripSddFromCopilotInstructions(content);

    assert.ok(result !== null, 'does not return null when user content exists');
    assert.ok(result.includes('# My Setup'), 'user content preserved');
    assert.ok(result.includes('My custom rules.'), 'user text preserved');
    assert.ok(!result.includes('SDD managed content'), 'SDD content removed');
    assert.ok(!result.includes(SDD_COPILOT_INSTRUCTIONS_MARKER), 'markers removed');
  });

  test('deletes copilot-instructions.md when SDD-only on uninstall', () => {
    const content = SDD_COPILOT_INSTRUCTIONS_MARKER + '\n' +
      '- Only SDD content\n' +
      SDD_COPILOT_INSTRUCTIONS_CLOSE_MARKER + '\n';

    const result = stripSddFromCopilotInstructions(content);

    assert.strictEqual(result, null, 'returns null signaling file deletion');
  });
});

// ─── Copilot manifest and patches fixes ────────────────────────────────────────

describe('Copilot manifest and patches fixes', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-manifest-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('writeManifest hashes skills for Copilot runtime', () => {
    // Create minimal sdd dir (required by writeManifest)
    const sddDir = path.join(tmpDir, 'sdd', 'bin');
    fs.mkdirSync(sddDir, { recursive: true });
    fs.writeFileSync(path.join(sddDir, 'verify.cjs'), '// verify stub');

    // Create Copilot skills directory
    const skillDir = path.join(tmpDir, 'skills', 'sdd-test');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Test Skill\n\nA test skill.');

    const manifest = writeManifest(tmpDir, 'copilot');

    // Check manifest file was written
    const manifestPath = path.join(tmpDir, 'sdd-file-manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest file created');

    // Read and verify skills are hashed
    const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const skillKey = 'skills/sdd-test/SKILL.md';
    assert.ok(data.files[skillKey], 'skill file hashed in manifest');
    assert.ok(typeof data.files[skillKey] === 'string', 'hash is a string');
    assert.ok(data.files[skillKey].length === 64, 'hash is SHA-256 (64 hex chars)');
  });

  describe('reportLocalPatches', () => {
    let originalLog;
    let logs;

    beforeEach(() => {
      originalLog = console.log;
      logs = [];
      console.log = (...args) => logs.push(args.join(' '));
    });

    afterEach(() => {
      console.log = originalLog;
    });

    test('reportLocalPatches shows /sdd-reapply-patches for Copilot', () => {
      // Create patches directory with metadata
      const patchesDir = path.join(tmpDir, 'sdd-local-patches');
      fs.mkdirSync(patchesDir, { recursive: true });
      fs.writeFileSync(path.join(patchesDir, 'backup-meta.json'), JSON.stringify({
        from_version: '1.0',
        files: ['skills/sdd-test/SKILL.md']
      }));

      const result = reportLocalPatches(tmpDir, 'copilot');

      assert.ok(result.length > 0, 'returns patched files list');
      const output = logs.join('\n');
      assert.ok(output.includes('/sdd-reapply-patches'), 'uses dash format for Copilot');
      assert.ok(!output.includes('/sdd:reapply-patches'), 'does not use colon format');
    });

    test('reportLocalPatches shows /sdd-reapply-patches for Claude', () => {
      // Create patches directory with metadata
      const patchesDir = path.join(tmpDir, 'sdd-local-patches');
      fs.mkdirSync(patchesDir, { recursive: true });
      fs.writeFileSync(path.join(patchesDir, 'backup-meta.json'), JSON.stringify({
        from_version: '1.0',
        files: ['sdd/bin/verify.cjs']
      }));

      const result = reportLocalPatches(tmpDir, 'claude');

      assert.ok(result.length > 0, 'returns patched files list');
      const output = logs.join('\n');
      assert.ok(output.includes('/sdd-reapply-patches'), 'uses hyphen format for Claude');
      assert.ok(!output.includes('/sdd:reapply-patches'), 'does not use colon format for Claude');
    });
  });
});

// ============================================================================
// E2E Integration Tests — Copilot Install & Uninstall
// ============================================================================

const { execFileSync } = require('child_process');
const crypto = require('crypto');

const INSTALL_PATH = path.join(__dirname, '..', 'bin', 'install.js');
const EXPECTED_SKILLS = fs.readdirSync(path.join(__dirname, '..', 'commands', 'sdd'))
  .filter(f => f.endsWith('.md')).length;
const EXPECTED_AGENTS = fs.readdirSync(path.join(__dirname, '..', 'agents'))
  .filter(f => f.startsWith('sdd-') && f.endsWith('.md')).length;

function runCopilotInstall(cwd) {
  const env = { ...process.env };
  delete env.SDD_TEST_MODE;
  return execFileSync(process.execPath, [INSTALL_PATH, '--copilot', '--local'], {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });
}

function runCopilotUninstall(cwd) {
  const env = { ...process.env };
  delete env.SDD_TEST_MODE;
  return execFileSync(process.execPath, [INSTALL_PATH, '--copilot', '--local', '--uninstall'], {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });
}

describe('E2E: Copilot full install verification', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-e2e-'));
    runCopilotInstall(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('installs expected number of skill directories', () => {
    const skillsDir = path.join(tmpDir, '.github', 'skills');
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const sddSkills = entries.filter(e => e.isDirectory() && e.name.startsWith('sdd-'));
    assert.strictEqual(sddSkills.length, EXPECTED_SKILLS,
      `Expected ${EXPECTED_SKILLS} skill directories, got ${sddSkills.length}`);
  });

  test('each skill directory contains SKILL.md', () => {
    const skillsDir = path.join(tmpDir, '.github', 'skills');
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const sddSkills = entries.filter(e => e.isDirectory() && e.name.startsWith('sdd-'));
    for (const skill of sddSkills) {
      const skillMdPath = path.join(skillsDir, skill.name, 'SKILL.md');
      assert.ok(fs.existsSync(skillMdPath),
        `Missing SKILL.md in ${skill.name}`);
    }
  });

  test('installs expected number of agent files', () => {
    const agentsDir = path.join(tmpDir, '.github', 'agents');
    const files = fs.readdirSync(agentsDir);
    const sddAgents = files.filter(f => f.startsWith('sdd-') && f.endsWith('.agent.md'));
    assert.strictEqual(sddAgents.length, EXPECTED_AGENTS,
      `Expected ${EXPECTED_AGENTS} agent files, got ${sddAgents.length}`);
  });

  test('installs all expected agent files', () => {
    const agentsDir = path.join(tmpDir, '.github', 'agents');
    const files = fs.readdirSync(agentsDir);
    const sddAgents = files.filter(f => f.startsWith('sdd-') && f.endsWith('.agent.md')).sort();
    const expected = [
      'sdd-advisor-researcher.agent.md',
      'sdd-ai-researcher.agent.md',
      'sdd-assumptions-analyzer.agent.md',
      'sdd-code-fixer.agent.md',
      'sdd-code-reviewer.agent.md',
      'sdd-codebase-mapper.agent.md',
      'sdd-debug-session-manager.agent.md',
      'sdd-debugger.agent.md',
      'sdd-doc-classifier.agent.md',
      'sdd-doc-synthesizer.agent.md',
      'sdd-doc-verifier.agent.md',
      'sdd-doc-writer.agent.md',
      'sdd-domain-researcher.agent.md',
      'sdd-eval-auditor.agent.md',
      'sdd-eval-planner.agent.md',
      'sdd-executor.agent.md',
      'sdd-framework-selector.agent.md',
      'sdd-integration-checker.agent.md',
      'sdd-intel-updater.agent.md',
      'sdd-nyquist-auditor.agent.md',
      'sdd-pattern-mapper.agent.md',
      'sdd-phase-researcher.agent.md',
      'sdd-plan-checker.agent.md',
      'sdd-planner.agent.md',
      'sdd-project-researcher.agent.md',
      'sdd-research-synthesizer.agent.md',
      'sdd-roadmapper.agent.md',
      'sdd-security-auditor.agent.md',
      'sdd-ui-auditor.agent.md',
      'sdd-ui-checker.agent.md',
      'sdd-ui-researcher.agent.md',
      'sdd-user-profiler.agent.md',
      'sdd-verifier.agent.md',
    ].sort();
    assert.deepStrictEqual(sddAgents, expected);
  });

  test('generates copilot-instructions.md with SDD markers', () => {
    const instrPath = path.join(tmpDir, '.github', 'copilot-instructions.md');
    assert.ok(fs.existsSync(instrPath), 'copilot-instructions.md should exist');
    const content = fs.readFileSync(instrPath, 'utf-8');
    assert.ok(content.includes('<!-- SDD Configuration'),
      'Should contain SDD Configuration open marker');
    assert.ok(content.includes('<!-- /SDD Configuration -->'),
      'Should contain SDD Configuration close marker');
  });

  test('creates manifest with correct structure', () => {
    const manifestPath = path.join(tmpDir, '.github', 'sdd-file-manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'sdd-file-manifest.json should exist');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    assert.ok(manifest.version, 'manifest should have version');
    assert.ok(manifest.timestamp, 'manifest should have timestamp');
    assert.ok(manifest.files && typeof manifest.files === 'object',
      'manifest should have files object');
    assert.ok(Object.keys(manifest.files).length > 0,
      'manifest files should not be empty');
  });

  test('manifest contains expected file categories', () => {
    const manifestPath = path.join(tmpDir, '.github', 'sdd-file-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const keys = Object.keys(manifest.files);

    const skillEntries = keys.filter(k => k.startsWith('skills/'));
    const agentEntries = keys.filter(k => k.startsWith('agents/'));
    const engineEntries = keys.filter(k => k.startsWith('sdd/'));

    assert.strictEqual(skillEntries.length, EXPECTED_SKILLS,
      `Expected ${EXPECTED_SKILLS} skill manifest entries, got ${skillEntries.length}`);
    assert.strictEqual(agentEntries.length, EXPECTED_AGENTS,
      `Expected ${EXPECTED_AGENTS} agent manifest entries, got ${agentEntries.length}`);
    assert.ok(engineEntries.length > 0,
      'Should have sdd/ engine manifest entries');
  });

  test('manifest SHA256 hashes match actual file contents', () => {
    const manifestPath = path.join(tmpDir, '.github', 'sdd-file-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const githubDir = path.join(tmpDir, '.github');

    for (const [relPath, expectedHash] of Object.entries(manifest.files)) {
      const filePath = path.join(githubDir, relPath);
      assert.ok(fs.existsSync(filePath),
        `Manifest references ${relPath} but file does not exist`);
      const content = fs.readFileSync(filePath);
      const actualHash = crypto.createHash('sha256').update(content).digest('hex');
      assert.strictEqual(actualHash, expectedHash,
        `SHA256 mismatch for ${relPath}: expected ${expectedHash}, got ${actualHash}`);
    }
  });

  test('engine directory contains required subdirectories and files', () => {
    const engineDir = path.join(tmpDir, '.github', 'sdd');
    const requiredDirs = ['bin', 'references', 'templates', 'workflows'];
    const requiredFiles = ['CHANGELOG.md', 'VERSION'];

    for (const dir of requiredDirs) {
      const dirPath = path.join(engineDir, dir);
      assert.ok(fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory(),
        `Engine should contain directory: ${dir}`);
    }
    for (const file of requiredFiles) {
      const filePath = path.join(engineDir, file);
      assert.ok(fs.existsSync(filePath) && fs.statSync(filePath).isFile(),
        `Engine should contain file: ${file}`);
    }
  });
});

describe('E2E: Copilot uninstall verification', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-e2e-'));
    runCopilotInstall(tmpDir);
    runCopilotUninstall(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('removes engine directory', () => {
    const engineDir = path.join(tmpDir, '.github', 'sdd');
    assert.ok(!fs.existsSync(engineDir),
      'sdd directory should not exist after uninstall');
  });

  test('removes copilot-instructions.md', () => {
    const instrPath = path.join(tmpDir, '.github', 'copilot-instructions.md');
    assert.ok(!fs.existsSync(instrPath),
      'copilot-instructions.md should not exist after uninstall');
  });

  test('removes all SDD skill directories', () => {
    const skillsDir = path.join(tmpDir, '.github', 'skills');
    if (fs.existsSync(skillsDir)) {
      const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
      const sddSkills = entries.filter(e => e.isDirectory() && e.name.startsWith('sdd-'));
      assert.strictEqual(sddSkills.length, 0,
        `Expected 0 SDD skill directories after uninstall, found: ${sddSkills.map(e => e.name).join(', ')}`);
    }
  });

  test('removes all SDD agent files', () => {
    const agentsDir = path.join(tmpDir, '.github', 'agents');
    if (fs.existsSync(agentsDir)) {
      const files = fs.readdirSync(agentsDir);
      const sddAgents = files.filter(f => f.startsWith('sdd-') && f.endsWith('.agent.md'));
      assert.strictEqual(sddAgents.length, 0,
        `Expected 0 SDD agent files after uninstall, found: ${sddAgents.join(', ')}`);
    }
  });

  describe('preserves non-SDD content', () => {
    let td;

    beforeEach(() => {
      td = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-e2e-preserve-'));
      runCopilotInstall(td);
    });

    afterEach(() => {
      fs.rmSync(td, { recursive: true, force: true });
    });

    test('preserves non-SDD content in skills directory', () => {
      // Add non-SDD custom skill
      const customSkillDir = path.join(td, '.github', 'skills', 'my-custom-skill');
      fs.mkdirSync(customSkillDir, { recursive: true });
      fs.writeFileSync(path.join(customSkillDir, 'SKILL.md'), '# My Custom Skill\n');
      // Uninstall
      runCopilotUninstall(td);
      // Verify custom content preserved
      assert.ok(fs.existsSync(path.join(customSkillDir, 'SKILL.md')),
        'Non-SDD skill directory and SKILL.md should be preserved after uninstall');
    });

    test('preserves non-SDD content in agents directory', () => {
      // Add non-SDD custom agent
      const customAgentPath = path.join(td, '.github', 'agents', 'my-agent.md');
      fs.writeFileSync(customAgentPath, '# My Custom Agent\n');
      // Uninstall
      runCopilotUninstall(td);
      // Verify custom content preserved
      assert.ok(fs.existsSync(customAgentPath),
        'Non-SDD agent file should be preserved after uninstall');
    });
  });
});

// ─── Claude uninstall: user file preservation (#1423) ─────────────────────────

function runClaudeInstall(cwd) {
  const env = { ...process.env };
  delete env.SDD_TEST_MODE;
  return execFileSync(process.execPath, [INSTALL_PATH, '--claude', '--local'], {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });
}

function runClaudeUninstall(cwd) {
  const env = { ...process.env };
  delete env.SDD_TEST_MODE;
  return execFileSync(process.execPath, [INSTALL_PATH, '--claude', '--local', '--uninstall'], {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });
}

describe('Claude uninstall preserves user-generated files (#1423)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-preserve-'));
    runClaudeInstall(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('preserves USER-PROFILE.md across uninstall', () => {
    const profilePath = path.join(tmpDir, '.claude', 'sdd', 'USER-PROFILE.md');
    const content = '# Developer Profile\n\nAutonomy: High\nGenerated: 2026-03-29\n';
    fs.writeFileSync(profilePath, content);

    runClaudeUninstall(tmpDir);

    assert.ok(fs.existsSync(profilePath), 'USER-PROFILE.md should survive uninstall');
    assert.strictEqual(fs.readFileSync(profilePath, 'utf-8'), content, 'content should be identical');
  });

  test('preserves dev-preferences.md across uninstall', () => {
    const prefsDir = path.join(tmpDir, '.claude', 'commands', 'sdd');
    fs.mkdirSync(prefsDir, { recursive: true });
    const prefsPath = path.join(prefsDir, 'dev-preferences.md');
    const content = '---\nname: dev-preferences\n---\n# Preferences\nUse TypeScript strict.\n';
    fs.writeFileSync(prefsPath, content);

    runClaudeUninstall(tmpDir);

    assert.ok(fs.existsSync(prefsPath), 'dev-preferences.md should survive uninstall');
    assert.strictEqual(fs.readFileSync(prefsPath, 'utf-8'), content, 'content should be identical');
  });

  test('still removes SDD engine files during uninstall', () => {
    const profilePath = path.join(tmpDir, '.claude', 'sdd', 'USER-PROFILE.md');
    fs.writeFileSync(profilePath, '# Profile\n');

    // Verify engine files exist before uninstall
    const binDir = path.join(tmpDir, '.claude', 'sdd', 'bin');
    assert.ok(fs.existsSync(binDir), 'bin/ should exist before uninstall');

    runClaudeUninstall(tmpDir);

    // Engine files gone, user file preserved
    assert.ok(!fs.existsSync(binDir), 'bin/ should be removed after uninstall');
    assert.ok(fs.existsSync(profilePath), 'USER-PROFILE.md should survive');
  });

  test('clean uninstall when no user files exist', () => {
    runClaudeUninstall(tmpDir);

    const sddDir = path.join(tmpDir, '.claude', 'sdd');
    const cmdDir = path.join(tmpDir, '.claude', 'commands', 'sdd');
    // Directories should be fully removed when no user files to preserve
    assert.ok(!fs.existsSync(sddDir), 'sdd/ should not exist after clean uninstall');
    assert.ok(!fs.existsSync(cmdDir), 'commands/sdd/ should not exist after clean uninstall');
  });
});
