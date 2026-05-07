export interface FallbackPolicyState {
  cjsFallbackEnabled: boolean;
}

export function describeFallbackDisabledPolicy(): string {
  return 'CJS fallback is disabled (SDD_QUERY_FALLBACK=registered).';
}

export function canUseCjsFallback(policy: FallbackPolicyState): boolean {
  return policy.cjsFallbackEnabled;
}
