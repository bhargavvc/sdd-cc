/**
 * Mapping of SDD agent to model for each profile.
 *
 * Should be in sync with the profiles table in `sdd/references/model-profiles.md`. But
 * possibly worth making this the single source of truth at some point, and removing the markdown
 * reference table in favor of programmatically determining the model to use for an agent (which
 * would be faster, use fewer tokens, and be less error-prone).
 */
const MODEL_PROFILES = {
  'sdd-planner': { quality: 'opus', balanced: 'opus', budget: 'sonnet' },
  'sdd-roadmapper': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
  'sdd-executor': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
  'sdd-phase-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
  'sdd-project-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
  'sdd-research-synthesizer': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'sdd-debugger': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
  'sdd-codebase-mapper': { quality: 'sonnet', balanced: 'haiku', budget: 'haiku' },
  'sdd-verifier': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'sdd-plan-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'sdd-integration-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'sdd-nyquist-auditor': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'sdd-ui-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
  'sdd-ui-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'sdd-ui-auditor': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
};
const VALID_PROFILES = Object.keys(MODEL_PROFILES['sdd-planner']);

/**
 * Formats the agent-to-model mapping as a human-readable table (in string format).
 *
 * @param {Object<string, string>} agentToModelMap - A mapping from agent to model
 * @returns {string} A formatted table string
 */
function formatAgentToModelMapAsTable(agentToModelMap) {
  const agentWidth = Math.max('Agent'.length, ...Object.keys(agentToModelMap).map((a) => a.length));
  const modelWidth = Math.max(
    'Model'.length,
    ...Object.values(agentToModelMap).map((m) => m.length)
  );
  const sep = '─'.repeat(agentWidth + 2) + '┼' + '─'.repeat(modelWidth + 2);
  const header = ' ' + 'Agent'.padEnd(agentWidth) + ' │ ' + 'Model'.padEnd(modelWidth);
  let agentToModelTable = header + '\n' + sep + '\n';
  for (const [agent, model] of Object.entries(agentToModelMap)) {
    agentToModelTable += ' ' + agent.padEnd(agentWidth) + ' │ ' + model.padEnd(modelWidth) + '\n';
  }
  return agentToModelTable;
}

/**
 * Returns a mapping from agent to model for the given model profile.
 *
 * @param {string} normalizedProfile - The normalized (lowercase and trimmed) profile name
 * @returns {Object<string, string>} A mapping from agent to model for the given profile
 */
function getAgentToModelMapForProfile(normalizedProfile) {
  const agentToModelMap = {};
  for (const [agent, profileToModelMap] of Object.entries(MODEL_PROFILES)) {
    agentToModelMap[agent] = profileToModelMap[normalizedProfile];
  }
  return agentToModelMap;
}

module.exports = {
  MODEL_PROFILES,
  VALID_PROFILES,
  formatAgentToModelMapAsTable,
  getAgentToModelMapForProfile,
};
