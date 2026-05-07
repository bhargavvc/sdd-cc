export interface SDDToolsErrorClassification {
  kind: 'timeout' | 'failure';
  timeoutMs?: number;
}

function timeoutClassification(timeoutMs?: number): SDDToolsErrorClassification {
  return timeoutMs === undefined ? { kind: 'timeout' } : { kind: 'timeout', timeoutMs };
}

function failureClassification(): SDDToolsErrorClassification {
  return { kind: 'failure' };
}

export class SDDToolsError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly args: string[],
    public readonly exitCode: number | null,
    public readonly stderr: string,
    options?: { cause?: unknown; classification?: SDDToolsErrorClassification },
  ) {
    super(message, options);
    this.name = 'SDDToolsError';
    this.classification = options?.classification ?? failureClassification();
  }

  static timeout(
    message: string,
    command: string,
    args: string[],
    stderr = '',
    timeoutMs?: number,
    options?: { cause?: unknown; exitCode?: number | null },
  ): SDDToolsError {
    return new SDDToolsError(
      message,
      command,
      args,
      options?.exitCode ?? null,
      stderr,
      { cause: options?.cause, classification: timeoutClassification(timeoutMs) },
    );
  }

  static failure(
    message: string,
    command: string,
    args: string[],
    exitCode: number | null,
    stderr = '',
    options?: { cause?: unknown },
  ): SDDToolsError {
    return new SDDToolsError(
      message,
      command,
      args,
      exitCode,
      stderr,
      { cause: options?.cause, classification: failureClassification() },
    );
  }

  public readonly classification: SDDToolsErrorClassification;
}
