export const UNKNOWN_COMMAND_HINTS: readonly string[] = [
  'Use a registered `sdd-sdk query` subcommand (see sdk/src/query/QUERY-HANDLERS.md).',
  'Invoke `node …/sdd-tools.cjs` for CJS-only operations.',
  'Unset SDD_QUERY_FALLBACK or set it to a non-restricted value to enable fallback.',
] as const;
