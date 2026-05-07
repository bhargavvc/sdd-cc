import { describe, expect, it } from 'vitest';
import { SDDToolsError } from './sdd-tools-error.js';
import { QueryNativeDirectAdapter } from './query-native-direct-adapter.js';

describe('QueryNativeDirectAdapter', () => {
  it('wraps native failures as typed failure errors', async () => {
    const adapter = new QueryNativeDirectAdapter({
      timeoutMs: 1000,
      dispatch: async () => {
        throw new Error('boom');
      },
      createNativeTimeoutError: (message, command, args) => SDDToolsError.timeout(message, command, args),
      createNativeFailureError: (message, command, args, cause) => SDDToolsError.failure(message, command, args, 1, '', { cause }),
    });

    await expect(adapter.dispatchJson('state', ['load'], 'state.load', [])).rejects.toMatchObject({
      classification: SDDToolsError.failure('x', 'state', ['load'], 1).classification,
      command: 'state',
    });
  });

  it('preserves timeout errors', async () => {
    const timeoutErr = SDDToolsError.timeout('timeout', 'state', ['load']);
    const adapter = new QueryNativeDirectAdapter({
      timeoutMs: 1000,
      dispatch: async () => {
        throw timeoutErr;
      },
      createNativeTimeoutError: (message, command, args) => SDDToolsError.timeout(message, command, args),
      createNativeFailureError: (message, command, args, cause) => SDDToolsError.failure(message, command, args, 1, '', { cause }),
    });

    await expect(adapter.dispatchJson('state', ['load'], 'state.load', [])).rejects.toBe(timeoutErr);
  });
});
