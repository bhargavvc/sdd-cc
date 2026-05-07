import { describe, it, expect } from 'vitest';
import { SDDEventType } from '../types.js';
import { buildMutationEvent } from './mutation-event-mapper.js';

describe('buildMutationEvent', () => {
  const sid = 'corr-1';

  it('maps template family', () => {
    const e = buildMutationEvent(sid, 'template.fill', ['project', '/tmp/x'], { data: { created: true } });
    expect(e.type).toBe(SDDEventType.TemplateFill);
  });

  it('maps git family', () => {
    const e = buildMutationEvent(sid, 'commit', [], { data: { hash: 'abc', committed: true } });
    expect(e.type).toBe(SDDEventType.GitCommit);
  });

  it('maps frontmatter family', () => {
    const e = buildMutationEvent(sid, 'frontmatter.set', ['file.md', 'k=v'], { data: null });
    expect(e.type).toBe(SDDEventType.FrontmatterMutation);
  });

  it('maps config + validate to config mutation', () => {
    expect(buildMutationEvent(sid, 'config-set', ['x'], { data: null }).type).toBe(SDDEventType.ConfigMutation);
    expect(buildMutationEvent(sid, 'validate.context', ['x'], { data: null }).type).toBe(SDDEventType.ConfigMutation);
  });

  it('maps phase/state/default to state mutation', () => {
    expect(buildMutationEvent(sid, 'phase.add', ['x'], { data: null }).type).toBe(SDDEventType.StateMutation);
    expect(buildMutationEvent(sid, 'state.update', ['x'], { data: null }).type).toBe(SDDEventType.StateMutation);
    expect(buildMutationEvent(sid, 'roadmap.update-plan-progress', ['x'], { data: null }).type).toBe(SDDEventType.StateMutation);
  });
});
