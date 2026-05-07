import { describe, it, expect } from 'vitest';
import { SDD } from './index.js';
import { SDDEventType, type SDDEvent } from './types.js';

describe('SDD runtime bridge options', () => {
  it('strictSdk option is honored by createTools dispatch seam', async () => {
    const sdd = new SDD({
      projectDir: process.cwd(),
      strictSdk: true,
      allowFallbackToSubprocess: true,
      sessionId: 'test-session',
    });

    const events: SDDEvent[] = [];
    sdd.onEvent((event) => events.push(event));

    await expect(sdd.createTools().exec('nonexistent-command', [])).rejects.toThrow(
      "Strict SDK mode: command 'nonexistent-command' has no native adapter",
    );

    const streamEvent = events.find((event) => event.type === SDDEventType.StreamEvent);
    expect(streamEvent).toBeDefined();
    expect(streamEvent).toMatchObject({
      type: SDDEventType.StreamEvent,
      sessionId: 'test-session',
      event: {
        type: 'query_dispatch',
        command: 'nonexistent-command',
        outcome: 'error',
      },
    });
  });
});
