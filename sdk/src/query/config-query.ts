/**
 * Config-get and resolve-model query handlers.
 *
 * Ported from sdd/bin/lib/config.cjs and commands.cjs.
 * Provides raw config.json traversal and model profile resolution.
 *
 * @example
 * ```typescript
 * import { configGet, resolveModel } from './config-query.js';
 *
 * const result = await configGet(['workflow.auto_advance'], '/project');
 * // { data: true }
 *
 * const model = await resolveModel(['sdd-planner'], '/project');
 * // { data: { model: 'opus', profile: 'balanced' } }
 * ```
 */

import { readFile } from 'node:fs/promises';
import { SDDError, ErrorClassification } from '../errors.js';
import { loadConfig } from '../config.js';
import { planningPaths } from './helpers.js';
import type { QueryHandler } from './utils.js';

// ─── MODEL_PROFILES ─────────────────────────────────────────────────────────

/**
 * Mapping of SDD agent type to model alias for each profile tier.
 *
 * Ported from sdd/bin/lib/model-profiles.cjs.
 */
export const MODEL_PROFILES: Record<string, Record<string, string>> = {
  'sdd-planner': { quality: 'opus', balanced: 'opus', budget: 'sonnet', adaptive: 'opus' },
  'sdd-roadmapper': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet', adaptive: 'sonnet' },
  'sdd-executor': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet', adaptive: 'sonnet' },
  'sdd-phase-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku', adaptive: 'sonnet' },
  'sdd-project-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku', adaptive: 'sonnet' },
  'sdd-research-synthesizer': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', adaptive: 'haiku' },
  'sdd-debugger': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet', adaptive: 'opus' },
  'sdd-codebase-mapper': { quality: 'sonnet', balanced: 'haiku', budget: 'haiku', adaptive: 'haiku' },
  'sdd-verifier': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', adaptive: 'sonnet' },
  'sdd-plan-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', adaptive: 'haiku' },
  'sdd-integration-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', adaptive: 'haiku' },
  'sdd-nyquist-auditor': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', adaptive: 'haiku' },
  'sdd-ui-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku', adaptive: 'sonnet' },
  'sdd-ui-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', adaptive: 'haiku' },
  'sdd-ui-auditor': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', adaptive: 'haiku' },
  'sdd-doc-writer': { quality: 'opus', balanced: 'sonnet', budget: 'haiku', adaptive: 'sonnet' },
  'sdd-doc-verifier': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', adaptive: 'haiku' },
};

/** Valid model profile names. */
export const VALID_PROFILES: string[] = Object.keys(MODEL_PROFILES['sdd-planner']);

// ─── configGet ──────────────────────────────────────────────────────────────

/**
 * Query handler for config-get command.
 *
 * Reads raw .planning/config.json and traverses dot-notation key paths.
 * Does NOT merge with defaults (matches sdd-tools.cjs behavior).
 *
 * @param args - args[0] is the dot-notation key path (e.g., 'workflow.auto_advance')
 * @param projectDir - Project root directory
 * @returns QueryResult with the config value at the given path
 * @throws SDDError with Validation classification if key missing or not found
 */
export const configGet: QueryHandler = async (args, projectDir) => {
  const keyPath = args[0];
  if (!keyPath) {
    throw new SDDError('Usage: config-get <key.path>', ErrorClassification.Validation);
  }

  const paths = planningPaths(projectDir);
  let raw: string;
  try {
    raw = await readFile(paths.config, 'utf-8');
  } catch {
    throw new SDDError(`No config.json found at ${paths.config}`, ErrorClassification.Validation);
  }

  let config: Record<string, unknown>;
  try {
    config = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new SDDError(`Malformed config.json at ${paths.config}`, ErrorClassification.Validation);
  }

  const keys = keyPath.split('.');
  let current: unknown = config;
  for (const key of keys) {
    if (current === undefined || current === null || typeof current !== 'object') {
      throw new SDDError(`Key not found: ${keyPath}`, ErrorClassification.Validation);
    }
    current = (current as Record<string, unknown>)[key];
  }
  if (current === undefined) {
    throw new SDDError(`Key not found: ${keyPath}`, ErrorClassification.Validation);
  }

  return { data: current };
};

// ─── resolveModel ───────────────────────────────────────────────────────────

/**
 * Query handler for resolve-model command.
 *
 * Resolves the model alias for a given agent type based on the current profile.
 * Uses loadConfig (with defaults) and MODEL_PROFILES for lookup.
 *
 * @param args - args[0] is the agent type (e.g., 'sdd-planner')
 * @param projectDir - Project root directory
 * @returns QueryResult with { model, profile } or { model, profile, unknown_agent: true }
 * @throws SDDError with Validation classification if agent type not provided
 */
export const resolveModel: QueryHandler = async (args, projectDir) => {
  const agentType = args[0];
  if (!agentType) {
    throw new SDDError('agent-type required', ErrorClassification.Validation);
  }

  const config = await loadConfig(projectDir);
  const profile = String(config.model_profile || 'balanced').toLowerCase();

  // Check per-agent override first
  const overrides = (config as Record<string, unknown>).model_overrides as Record<string, string> | undefined;
  const override = overrides?.[agentType];
  if (override) {
    const agentModels = MODEL_PROFILES[agentType];
    const result = agentModels
      ? { model: override, profile }
      : { model: override, profile, unknown_agent: true };
    return { data: result };
  }

  // resolve_model_ids: "omit" -- return empty string
  const resolveModelIds = (config as Record<string, unknown>).resolve_model_ids;
  if (resolveModelIds === 'omit') {
    const agentModels = MODEL_PROFILES[agentType];
    const result = agentModels
      ? { model: '', profile }
      : { model: '', profile, unknown_agent: true };
    return { data: result };
  }

  // Fall back to profile lookup
  const agentModels = MODEL_PROFILES[agentType];
  if (!agentModels) {
    return { data: { model: 'sonnet', profile, unknown_agent: true } };
  }

  if (profile === 'inherit') {
    return { data: { model: 'inherit', profile } };
  }

  const alias = agentModels[profile] || agentModels['balanced'] || 'sonnet';
  return { data: { model: alias, profile } };
};
