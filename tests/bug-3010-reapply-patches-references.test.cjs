// allow-test-rule: source-text-is-the-product
// Reads .md and .js product files whose deployed text IS what the user
// sees — testing text content tests the deployed contract.

/**
 * Regression test for bug #3010
 *
 * After PR #2824 consolidated 86 skills into ~58, the standalone slash
 * command `/sdd-reapply-patches` was removed and folded into a flag on
 * `/sdd-update` (i.e. `/sdd-update --reapply`). The 1.39.1 hotfix (#2954)
 * fixed `help.md` to reflect the consolidated commands, but missed two
 * other surfaces that still printed/recommended the removed command:
 *
 *   1. `bin/install.js` — the post-install message (`reportLocalPatches`)
 *      told every runtime to "Run /sdd-reapply-patches", which is no
 *      longer a registered command and prints "Unknown command".
 *   2. `sdd/workflows/update.md` Step 4 — the auto-commit text
 *      appended at the end of the `/sdd-update` flow recommended the
 *      same dead command.
 *   3. English `docs/USER-GUIDE.md`, `docs/manual-update.md`,
 *      `docs/ARCHITECTURE.md`, `docs/FEATURES.md`, `docs/INVENTORY.md`
 *      and the translated docs under `docs/{zh-CN,ja-JP,ko-KR}/` carried
 *      stale references in the same recommendation positions.
 *
 * Fix: every user-facing recommendation now points at `/sdd-update --reapply`.
 *
 * This test verifies the user-facing contract:
 * 1. `bin/install.js` source emits the consolidated form for every runtime.
 * 2. No file under `sdd/workflows/` recommends running
 *    `/sdd-reapply-patches` (the historical "replaces the former" mention
 *    in `help.md` is allowed because it's the deprecation notice itself).
 * 3. No file under `docs/` recommends running `/sdd-reapply-patches`
 *    (CHANGELOG history references are excluded — they document the
 *    past and must not be rewritten).
 *
 * Defensive scope: the workflow file `reapply-patches.md` and code
 * comments naming the workflow file (`scripts/verify-reapply-patches.cjs`,
 * comments in `bin/install.js`) are NOT user-facing recommendations —
 * those reference the workflow's *implementation name*, which is
 * unchanged. Only strings that prompt the user to *run* the command
 * are in scope here.
 */

'use strict';

process.env.SDD_TEST_MODE = '1';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const INSTALL_JS = path.join(ROOT, 'bin', 'install.js');
const WORKFLOWS_DIR = path.join(ROOT, 'sdd', 'workflows');
const DOCS_DIR = path.join(ROOT, 'docs');

// Files that are allowed to mention the dead command for legitimate reasons:
//   - help.md   — explicitly documents that --reapply *replaces* the former
//                 standalone command. Removing this would erase the deprecation
//                 trail for users who still type the old form.
//   - CHANGELOG.md — historical entries describing past bugs/fixes referencing
//                 the old command name. Rewriting history would falsify
//                 release notes.
const ALLOWED_HISTORICAL_MENTIONS = new Set([
  path.join(WORKFLOWS_DIR, 'help.md'),
  path.join(ROOT, 'CHANGELOG.md'),
]);

function walkMd(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkMd(full));
    else if (entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

describe('bug-3010: post-install message and docs recommend /sdd-update --reapply', () => {
  test('bin/install.js emits /sdd-update --reapply (no /sdd-reapply-patches recommendations)', () => {
    const src = fs.readFileSync(INSTALL_JS, 'utf-8');

    // Locate the reportLocalPatches function — that is the runtime emitter
    // a user sees after every install. Scope the assertion to that function
    // body only so historical doc-comments (e.g. JSDoc explaining the
    // verifier history) are not flagged. The function body runs from the
    // declaration line to the next top-level `function ` declaration.
    const fnStart = src.indexOf('function reportLocalPatches');
    assert.ok(fnStart >= 0, 'reportLocalPatches function must exist in bin/install.js');
    const afterFn = src.indexOf('\nfunction ', fnStart + 1);
    const fnBody = afterFn > 0 ? src.slice(fnStart, afterFn) : src.slice(fnStart);

    // The body must reference the consolidated command for every runtime
    // path. The negative assertion is what catches drift — adding a
    // forgotten `/sdd-reapply-patches` literal here regresses #3010.
    assert.ok(
      fnBody.includes('/sdd-update --reapply'),
      'reportLocalPatches must emit the consolidated /sdd-update --reapply form',
    );
    assert.ok(
      !fnBody.includes('/sdd-reapply-patches'),
      'reportLocalPatches must NOT emit the removed /sdd-reapply-patches command',
    );
    assert.ok(
      !fnBody.includes('/sdd:reapply-patches'),
      'reportLocalPatches must NOT emit the removed /sdd:reapply-patches Gemini-style command',
    );
    assert.ok(
      !fnBody.includes('$sdd-reapply-patches'),
      'reportLocalPatches must NOT emit the removed $sdd-reapply-patches Codex-style command',
    );
  });

  // All three legacy spellings of the removed command. The slash/dollar
  // prefix is the slash-command marker — bare "reapply-patches" without a
  // prefix is not a user-typable command and is allowed (file path refs,
  // workflow filename, verify-reapply-patches.cjs script).
  //   /sdd-reapply-patches    — claude/opencode/kilo/copilot
  //   /sdd:reapply-patches    — gemini namespace
  //   $sdd-reapply-patches    — codex prefix
  const DEAD_COMMAND_PATTERNS = [
    /\/sdd-reapply-patches\b/g,
    /\/sdd:reapply-patches\b/g,
    /\$sdd-reapply-patches\b/g,
  ];

  function findDeadCommands(stripped) {
    const matches = [];
    for (const re of DEAD_COMMAND_PATTERNS) {
      const m = stripped.match(re);
      if (m) matches.push(...m);
    }
    return matches;
  }

  test('no workflow file recommends a removed reapply-patches command', () => {
    const workflowFiles = walkMd(WORKFLOWS_DIR);
    assert.ok(workflowFiles.length > 0, `expected workflow markdown files under ${WORKFLOWS_DIR}`);

    const offenders = [];
    for (const file of workflowFiles) {
      if (ALLOWED_HISTORICAL_MENTIONS.has(file)) continue;

      const src = fs.readFileSync(file, 'utf-8');
      // Strip HTML comments to avoid matching commented-out examples
      // and prose that quotes the old command for context.
      const stripped = src.replace(/<!--[\s\S]*?-->/g, '');
      const matches = findDeadCommands(stripped);
      if (matches.length) offenders.push(`${path.relative(ROOT, file)}: ${matches.length} mention(s) [${[...new Set(matches)].join(', ')}]`);
    }

    assert.deepStrictEqual(
      offenders,
      [],
      'workflow files must not recommend any removed reapply-patches command form:\n  ' +
        offenders.join('\n  '),
    );
  });

  test('no doc under docs/ recommends a removed reapply-patches command (excluding CHANGELOG history)', () => {
    const docFiles = walkMd(DOCS_DIR);
    assert.ok(docFiles.length > 0, `expected docs under ${DOCS_DIR}`);

    const offenders = [];
    for (const file of docFiles) {
      if (ALLOWED_HISTORICAL_MENTIONS.has(file)) continue;

      const src = fs.readFileSync(file, 'utf-8');
      const stripped = src.replace(/<!--[\s\S]*?-->/g, '');
      const matches = findDeadCommands(stripped);
      if (matches.length) offenders.push(`${path.relative(ROOT, file)}: ${matches.length} mention(s) [${[...new Set(matches)].join(', ')}]`);
    }

    assert.deepStrictEqual(
      offenders,
      [],
      'docs must not recommend any removed reapply-patches command form:\n  ' +
        offenders.join('\n  '),
    );
  });

  test('reportLocalPatches output text includes the consolidated form for every runtime branch', () => {
    // Functional check: dynamically require the installer, capture
    // console.log, and assert each runtime branch emits the new form.
    // This guards against future refactors that could re-introduce a
    // runtime-specific stale string the static text scan would miss.
    const { reportLocalPatches } = require(INSTALL_JS);
    assert.ok(typeof reportLocalPatches === 'function', 'reportLocalPatches must be exported');

    const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'sdd-bug-3010-'));
    try {
      const patchesDir = path.join(tmpDir, 'sdd-local-patches');
      fs.mkdirSync(patchesDir, { recursive: true });
      fs.writeFileSync(
        path.join(patchesDir, 'backup-meta.json'),
        JSON.stringify({ from_version: '1.0', files: ['skills/sdd-test/SKILL.md'] }),
      );

      // Cover every runtime branch in the conditional with the EXACT token
      // each branch is contractually required to emit. A loose substring
      // like 'update --reapply' would let a malformed prefix slip through
      // (e.g. emitting '/sdd-update --reapply' for the gemini branch when
      // it should be '/sdd:update --reapply').
      const expectedByRuntime = {
        claude:   '/sdd-update --reapply',
        opencode: '/sdd-update --reapply',
        kilo:     '/sdd-update --reapply',
        copilot:  '/sdd-update --reapply',
        gemini:   '/sdd:update --reapply',
        codex:    '$sdd-update --reapply',
        cursor:   'sdd-update --reapply',
      };
      for (const [runtime, expectedToken] of Object.entries(expectedByRuntime)) {
        const logs = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(' '));
        try {
          reportLocalPatches(tmpDir, runtime);
        } finally {
          console.log = originalLog;
        }
        const output = logs.join('\n');
        assert.ok(
          output.includes(expectedToken),
          `runtime ${runtime}: output must include exact token "${expectedToken}", got:\n${output}`,
        );
        // The cursor runtime expects a BARE token without slash/dollar/colon
        // prefix. The bare form is a substring of every prefixed variant, so
        // the positive substring check above can't tell correct cursor output
        // from a regression that wrongly emitted '/sdd-update --reapply'
        // (claude form) or '$sdd-update --reapply' (codex form) for cursor.
        // Add an explicit prefix-absence guard for cursor so that regression
        // is caught.
        if (runtime === 'cursor') {
          assert.ok(
            !/[/$:]sdd-update --reapply/.test(output),
            `runtime cursor: output must use bare "sdd-update --reapply" without slash/dollar/colon prefix, got:\n${output}`,
          );
        }
        // Negative: none of the dead command forms may appear, regardless of runtime.
        for (const re of DEAD_COMMAND_PATTERNS) {
          assert.ok(
            !re.test(output),
            `runtime ${runtime}: output must not reference removed command (matched ${re.source}), got:\n${output}`,
          );
          re.lastIndex = 0; // reset stateful global regex
        }
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
