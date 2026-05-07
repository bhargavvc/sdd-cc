# @bhargavvc/sdk

TypeScript SDK for **Spec-Driven Development**: deterministic query/mutation handlers, plan execution, and event-stream telemetry so agents focus on judgment, not shell plumbing.

## Install

```bash
npm install @bhargavvc/sdk
```

## Quickstart — programmatic

```typescript
import { SDD, createRegistry } from '@bhargavvc/sdk';

const sdd = new SDD({ projectDir: process.cwd(), sessionId: 'my-run' });
const tools = sdd.createTools();

const registry = createRegistry(sdd.eventStream, 'my-run');
const { data } = await registry.dispatch('state.json', [], process.cwd());
```

## Quickstart — CLI

From a project that depends on this package, **invoke the CLI with Node** (recommended in CI and local dev):

```bash
node ./node_modules/@bhargavvc/sdk/dist/cli.js query state.json
node ./node_modules/@bhargavvc/sdk/dist/cli.js query roadmap.analyze
```

If no native handler is registered for a command, the CLI can transparently shell out to `sdd/bin/sdd-tools.cjs` (see stderr warning), unless `SDD_QUERY_FALLBACK=off`.

## What ships

| Area | Entry |
|------|--------|
| Query registry | `createRegistry()` in `src/query/index.ts` — same handlers as `sdd-sdk query` |
| Tools bridge | `SDDTools` — native dispatch with optional CJS subprocess fallback |
| Orchestrators | `PhaseRunner`, `InitRunner`, `SDD` |
| CLI | `sdd-sdk` — `query`, `run`, `init`, `auto` |

## Guides

- **Handler registry & contracts:** [`src/query/QUERY-HANDLERS.md`](src/query/QUERY-HANDLERS.md)
- **Repository docs** (when present): `docs/ARCHITECTURE.md`, `docs/CLI-TOOLS.md` at repo root

## Environment

| Variable | Purpose |
|----------|---------|
| `SDD_QUERY_FALLBACK` | `off` / `never` disables CLI fallback to `sdd-tools.cjs` for unknown commands |
| `SDD_AGENTS_DIR` | Override directory scanned for installed SDD agents (`~/.claude/agents` by default) |
