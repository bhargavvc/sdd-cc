import type { SDDEventStream } from './event-stream.js';
import { createRegistry } from './query/index.js';
import { SDDTransport } from './sdd-transport.js';
import { QueryExecutionPolicy } from './query-execution-policy.js';
import { QuerySubprocessAdapter } from './query-subprocess-adapter.js';
import { QueryNativeDirectAdapter } from './query-native-direct-adapter.js';
import { QueryNativeHotpathAdapter } from './query-native-hotpath-adapter.js';
import { formatQueryRawOutput } from './query-raw-output-projection.js';
import { createQueryNativeErrorFactory, createQueryToolsErrorFactory } from './query-tools-error-factory.js';
import { QueryRuntimeBridge, type RuntimeBridgeOptions } from './query-runtime-bridge.js';

export interface SDDToolsRuntime {
  bridge: QueryRuntimeBridge;
}

export function createSDDToolsRuntime(opts: {
  projectDir: string;
  sddToolsPath: string;
  timeoutMs: number;
  workstream?: string;
  eventStream?: SDDEventStream;
  sessionId?: string;
  shouldUseNativeQuery: () => boolean;
  execJsonFallback: (legacyCommand: string, legacyArgs: string[]) => Promise<unknown>;
  execRawFallback: (legacyCommand: string, legacyArgs: string[]) => Promise<string>;
  strictSdk?: boolean;
  allowFallbackToSubprocess?: boolean;
  onDispatchEvent?: RuntimeBridgeOptions['onDispatchEvent'];
}): SDDToolsRuntime {
  const registry = createRegistry(opts.eventStream, opts.sessionId);

  const queryToolsErrorFactory = createQueryToolsErrorFactory();

  const subprocessAdapter = new QuerySubprocessAdapter({
    projectDir: opts.projectDir,
    sddToolsPath: opts.sddToolsPath,
    timeoutMs: opts.timeoutMs,
    workstream: opts.workstream,
    ...queryToolsErrorFactory,
  });

  const nativeErrorFactory = createQueryNativeErrorFactory(opts.timeoutMs);

  const nativeDirectAdapter = new QueryNativeDirectAdapter({
    timeoutMs: opts.timeoutMs,
    dispatch: (registryCommand, registryArgs) => registry.dispatch(registryCommand, registryArgs, opts.projectDir),
    ...nativeErrorFactory,
  });

  const transport = new SDDTransport(registry, {
    dispatchNative: (request) => nativeDirectAdapter.dispatchResult(
      request.legacyCommand,
      request.legacyArgs,
      request.registryCommand,
      request.registryArgs,
    ),
    execSubprocessJson: (legacyCommand, legacyArgs) => subprocessAdapter.execJson(legacyCommand, legacyArgs),
    execSubprocessRaw: (legacyCommand, legacyArgs) => subprocessAdapter.execRaw(legacyCommand, legacyArgs),
    formatNativeRaw: (registryCommand, data) => formatQueryRawOutput(registryCommand, data),
  });

  const executionPolicy = new QueryExecutionPolicy(transport);
  const nativeHotpathAdapter = new QueryNativeHotpathAdapter(
    opts.shouldUseNativeQuery,
    nativeDirectAdapter,
    opts.execJsonFallback,
    opts.execRawFallback,
  );

  const bridge = new QueryRuntimeBridge(
    registry,
    executionPolicy,
    nativeHotpathAdapter,
    opts.shouldUseNativeQuery,
    {
      strictSdk: opts.strictSdk,
      allowFallbackToSubprocess: opts.allowFallbackToSubprocess,
      onDispatchEvent: opts.onDispatchEvent,
    },
  );

  return { bridge };
}
