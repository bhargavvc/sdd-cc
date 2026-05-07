import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const BUNDLED_SDD_TOOLS_PATH = fileURLToPath(
  new URL('../../sdd/bin/sdd-tools.cjs', import.meta.url),
);

/**
 * Resolve sdd-tools.cjs path.
 * Probe order: SDK-bundled repo copy → project/.claude/sdd → ~/.claude/sdd
 */
export function resolveSddToolsPath(projectDir: string): string {
  const candidates = [
    BUNDLED_SDD_TOOLS_PATH,
    join(projectDir, '.claude', 'sdd', 'bin', 'sdd-tools.cjs'),
    join(homedir(), '.claude', 'sdd', 'bin', 'sdd-tools.cjs'),
  ];

  return candidates.find(candidate => existsSync(candidate)) ?? candidates[candidates.length - 1]!;
}

export { BUNDLED_SDD_TOOLS_PATH };
