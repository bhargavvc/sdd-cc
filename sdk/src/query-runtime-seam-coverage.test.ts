import { describe, it, expect, vi } from 'vitest';
import { createSDDToolsRuntime } from './query-sdd-tools-runtime.js';

describe('SDK Runtime Bridge seam coverage', () => {
  it('exposes bridge as the single runtime seam', () => {
    const runtime = createSDDToolsRuntime({
      projectDir: '/tmp/project',
      sddToolsPath: '/tmp/sdd-tools.cjs',
      timeoutMs: 1_000,
      shouldUseNativeQuery: () => true,
      execJsonFallback: vi.fn(async () => ({})),
      execRawFallback: vi.fn(async () => ''),
    });

    expect(Object.keys(runtime)).toEqual(['bridge']);
    expect(typeof runtime.bridge.resolve).toBe('function');
    expect(typeof runtime.bridge.execute).toBe('function');
    expect(typeof runtime.bridge.dispatchHotpath).toBe('function');
  });
});
