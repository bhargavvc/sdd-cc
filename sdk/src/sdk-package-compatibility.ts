import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SDDError, ErrorClassification } from './errors.js';

export type LegacySdkAsset = 'sdd-tools' | 'core-cjs';

export interface LegacySdkAssetResolution {
  asset: LegacySdkAsset;
  path: string | null;
  fallbackPath: string;
  probes: string[];
}

interface LegacySdkCompatibilityDeps {
  existsSync?: (path: string) => boolean;
  homeDir?: string;
  createRequire?: typeof createRequire;
}

export const BUNDLED_SDD_TOOLS_PATH = fileURLToPath(
  new URL('../../sdd/bin/sdd-tools.cjs', import.meta.url),
);

export const BUNDLED_CORE_CJS_PATH = fileURLToPath(
  new URL('../../sdd/bin/lib/core.cjs', import.meta.url),
);

export const BUNDLED_SDD_TEMPLATES_DIR = fileURLToPath(
  new URL('../../sdd/templates', import.meta.url),
);

export const BUNDLED_SDD_AGENTS_DIR = fileURLToPath(
  new URL('../../agents', import.meta.url),
);

const LEGACY_ASSET_SUBPATH: Record<LegacySdkAsset, string> = {
  'sdd-tools': 'sdd-tools.cjs',
  'core-cjs': join('lib', 'core.cjs'),
};

const BUNDLED_LEGACY_ASSET_PATH: Record<LegacySdkAsset, string> = {
  'sdd-tools': BUNDLED_SDD_TOOLS_PATH,
  'core-cjs': BUNDLED_CORE_CJS_PATH,
};

export function resolveLegacyInstallDir(homeDir: string = homedir()): string {
  return join(homeDir, '.claude', 'sdd');
}

export function resolveLegacyTemplatesDir(homeDir: string = homedir()): string {
  return join(resolveLegacyInstallDir(homeDir), 'templates');
}

export function resolveLegacyWorkflowsDir(homeDir: string = homedir()): string {
  return join(resolveLegacyInstallDir(homeDir), 'workflows');
}

export function resolveLegacyUserProfilePath(homeDir: string = homedir()): string {
  return join(resolveLegacyInstallDir(homeDir), 'USER-PROFILE.md');
}

export function resolveLegacySkillsDir(homeDir: string = homedir()): string {
  return join(resolveLegacyInstallDir(homeDir), 'skills');
}

export function resolveBundledTemplatesDir(): string {
  return BUNDLED_SDD_TEMPLATES_DIR;
}

export function resolveBundledAgentsDir(): string {
  return BUNDLED_SDD_AGENTS_DIR;
}

function legacyAssetProbes(asset: LegacySdkAsset, projectDir: string, homeDir: string): string[] {
  const suffix = LEGACY_ASSET_SUBPATH[asset];
  return [
    BUNDLED_LEGACY_ASSET_PATH[asset],
    join(projectDir, '.claude', 'sdd', 'bin', suffix),
    join(homeDir, '.claude', 'sdd', 'bin', suffix),
  ];
}

export function probeLegacySdkAsset(
  asset: LegacySdkAsset,
  projectDir: string,
  deps: LegacySdkCompatibilityDeps = {},
): LegacySdkAssetResolution {
  const pathExists = deps.existsSync ?? existsSync;
  const probes = legacyAssetProbes(asset, projectDir, deps.homeDir ?? homedir());
  return {
    asset,
    path: probes.find(candidate => pathExists(candidate)) ?? null,
    fallbackPath: probes[probes.length - 1]!,
    probes,
  };
}

/**
 * Resolve the legacy `sdd-tools.cjs` executable path through the SDK Package Seam Module.
 *
 * Preserves historical behavior: if no probe exists, return the final fallback path so
 * downstream subprocess errors still show a concrete location.
 */
export function resolveSddToolsPath(projectDir: string, deps: LegacySdkCompatibilityDeps = {}): string {
  const resolution = probeLegacySdkAsset('sdd-tools', projectDir, deps);
  return resolution.path ?? resolution.fallbackPath;
}

function missingLegacyCoreMessage(resolution: LegacySdkAssetResolution): string {
  return [
    'state load: sdd/bin/lib/core.cjs not found.',
    `Checked: ${resolution.probes.join(', ')}`,
    'Install SDD (e.g. npm i -g @bhargavvc/sdd-cc) or clone with sdd next to the SDK.',
  ].join(' ');
}

/**
 * Load `loadConfig(cwd)` from the legacy CJS install through one compatibility seam.
 */
export function loadLegacyCoreConfig(projectDir: string, deps: LegacySdkCompatibilityDeps = {}): Record<string, unknown> {
  const resolution = probeLegacySdkAsset('core-cjs', projectDir, deps);
  if (!resolution.path) {
    throw new SDDError(
      missingLegacyCoreMessage(resolution),
      ErrorClassification.Blocked,
    );
  }

  const req = (deps.createRequire ?? createRequire)(import.meta.url);
  const mod = req(resolution.path) as Partial<{ loadConfig: (cwd: string) => Record<string, unknown> }>;
  if (typeof mod.loadConfig !== 'function') {
    throw new SDDError(
      `state load: invalid core.cjs at ${resolution.path} (missing loadConfig(cwd)).`,
      ErrorClassification.Blocked,
    );
  }
  return mod.loadConfig(projectDir);
}
