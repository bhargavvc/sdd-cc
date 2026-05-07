/**
 * Golden test helpers — run `sdd-tools.cjs` as a subprocess and capture JSON or raw stdout.
 *
 * Used by `golden.integration.test.ts` and `read-only-parity.integration.test.ts` to assert
 * SDK `createRegistry()` output matches the legacy CJS CLI.
 */

import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';

import { resolveSddToolsPath } from '../sdd-tools.js';

const CAPTURE_TIMEOUT_MS = 120_000;
const MAX_BUFFER = 10 * 1024 * 1024;

function execSddTools(
  projectDir: string,
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  const script = resolveSddToolsPath(projectDir);
  const fullArgs = [script, command, ...args];
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      fullArgs,
      {
        cwd: projectDir,
        maxBuffer: MAX_BUFFER,
        timeout: CAPTURE_TIMEOUT_MS,
        env: { ...process.env },
      },
      (err, stdout, stderr) => {
        if (err) {
          const code = typeof err === 'object' && err && 'code' in err ? String((err as NodeJS.ErrnoException).code) : '';
          const stderrStr = stderr?.toString() ?? '';
          reject(
            new Error(
              `sdd-tools failed (exit ${code}): ${stderrStr || (err instanceof Error ? err.message : String(err))}`,
            ),
          );
          return;
        }
        resolve({ stdout: stdout?.toString() ?? '', stderr: stderr?.toString() ?? '' });
      },
    );
  });
}

/** Same `@file:` indirection handling as {@link SDDTools} private parseOutput (cwd = projectDir). */
async function parseSddToolsJson(raw: string, projectDir: string): Promise<unknown> {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }

  let jsonStr = trimmed;
  if (jsonStr.startsWith('@file:')) {
    const rel = jsonStr.slice(6).trim();
    const filePath = isAbsolute(rel) ? rel : join(projectDir, rel);
    try {
      jsonStr = await readFile(filePath, 'utf-8');
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to read sdd-tools @file: indirection at "${filePath}": ${reason}`);
    }
  }

  return JSON.parse(jsonStr);
}

/**
 * Run `node sdd-tools.cjs <command> [...args]` in `projectDir` and parse stdout as JSON.
 */
export async function captureSddToolsOutput(
  command: string,
  args: string[],
  projectDir: string,
): Promise<unknown> {
  const { stdout } = await execSddTools(projectDir, command, args);
  return parseSddToolsJson(stdout, projectDir);
}

/**
 * Run `node sdd-tools.cjs <command> [...args]` and return raw stdout (no JSON parse).
 */
export async function captureSddToolsStdout(
  command: string,
  args: string[],
  projectDir: string,
): Promise<string> {
  const { stdout } = await execSddTools(projectDir, command, args);
  return stdout;
}
