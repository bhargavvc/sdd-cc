/**
 * Workspace-aware state resolution — scopes .planning/ paths to a
 * SDD_WORKSTREAM or SDD_PROJECT environment context.
 *
 * Port of planningDir() workspace logic from sdd/bin/lib/core.cjs
 * (line 669+). Provides WorkspaceContext reading and validated path scoping.
 *
 * Security: workspace names are validated to reject path traversal (T-14-05).
 *
 * @example
 * ```typescript
 * import { resolveWorkspaceContext, workspacePlanningPaths } from './workspace.js';
 *
 * const ctx = resolveWorkspaceContext();
 * // { workstream: 'backend', project: null }
 *
 * const paths = workspacePlanningPaths('/my/project', ctx);
 * // paths.state → '/my/project/.planning/workstreams/backend/STATE.md'
 * ```
 */

import { join } from 'node:path';
import { SDDError, ErrorClassification } from '../errors.js';
import { toPosixPath } from './helpers.js';
import type { PlanningPaths } from './helpers.js';

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * Resolved workspace context from environment variables.
 */
export interface WorkspaceContext {
  /** Active workstream name (from SDD_WORKSTREAM env var), or null */
  workstream: string | null;
  /** Active project name (from SDD_PROJECT env var), or null */
  project: string | null;
}

// ─── Validation ────────────────────────────────────────────────────────────

/**
 * Validate a workspace or project name.
 *
 * Rejects names that could cause path traversal (T-14-05):
 * - Empty string
 * - Names containing '/' or '\'
 * - Names containing '..' sequences
 *
 * @param name - Workspace or project name to validate
 * @param kind - Label for error messages ('workstream' or 'project')
 * @throws SDDError with Validation classification on invalid name
 */
function validateWorkspaceName(name: string, kind: string): void {
  if (!name || name.trim() === '') {
    throw new SDDError(
      `${kind} name must not be empty`,
      ErrorClassification.Validation,
    );
  }
  if (name.includes('/') || name.includes('\\')) {
    throw new SDDError(
      `${kind} name must not contain path separators: ${name}`,
      ErrorClassification.Validation,
    );
  }
  if (name.includes('..')) {
    throw new SDDError(
      `${kind} name must not contain '..' (path traversal): ${name}`,
      ErrorClassification.Validation,
    );
  }
}

// ─── resolveWorkspaceContext ───────────────────────────────────────────────

/**
 * Read SDD_WORKSTREAM and SDD_PROJECT environment variables.
 *
 * Returns a WorkspaceContext with null values when the env vars are not set.
 *
 * @returns Resolved workspace context
 */
export function resolveWorkspaceContext(): WorkspaceContext {
  return {
    workstream: process.env['SDD_WORKSTREAM'] || null,
    project: process.env['SDD_PROJECT'] || null,
  };
}

// ─── workspacePlanningPaths ────────────────────────────────────────────────

/**
 * Return PlanningPaths scoped to the active workspace or project.
 *
 * When context has a workstream set: base = .planning/workstreams/<ws>/
 * When context has a project set: base = .planning/projects/<project>/
 * When context is null or empty: base = .planning/ (default)
 *
 * Workspace and project names are validated before path construction.
 *
 * @param projectDir - Absolute project root path
 * @param context - Optional workspace context (defaults to no scoping)
 * @returns PlanningPaths scoped to the active workspace
 * @throws SDDError if workspace/project name fails validation
 */
export function workspacePlanningPaths(
  projectDir: string,
  context?: WorkspaceContext,
): PlanningPaths {
  let base: string;

  if (context?.workstream != null) {
    validateWorkspaceName(context.workstream, 'workstream');
    base = join(projectDir, '.planning', 'workstreams', context.workstream);
  } else if (context?.project != null) {
    validateWorkspaceName(context.project, 'project');
    base = join(projectDir, '.planning', 'projects', context.project);
  } else {
    base = join(projectDir, '.planning');
  }

  return {
    planning: toPosixPath(base),
    state: toPosixPath(join(base, 'STATE.md')),
    roadmap: toPosixPath(join(base, 'ROADMAP.md')),
    project: toPosixPath(join(base, 'PROJECT.md')),
    config: toPosixPath(join(base, 'config.json')),
    phases: toPosixPath(join(base, 'phases')),
    requirements: toPosixPath(join(base, 'REQUIREMENTS.md')),
  };
}
