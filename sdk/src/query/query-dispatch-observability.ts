export function fallbackBridgeNotices(command: string): string[] {
  return [
    `[sdd-sdk] '${command}' not in native registry; falling back to sdd-tools.cjs.`,
    '[sdd-sdk] Transparent bridge — prefer adding a native handler when parity matters.',
  ];
}
