export interface LogContext {
  [key: string]: unknown;
}

export const logger = {
  info(message: string, context?: LogContext): void {
    const payload: Record<string, unknown> = {
      severity: "INFO",
      message: message,
      ...(context || {}),
    };
    console.log(JSON.stringify(payload));
  },
  warn(message: string, context?: LogContext): void {
    const payload: Record<string, unknown> = {
      severity: "WARNING",
      message: message,
      ...(context || {}),
    };
    console.log(JSON.stringify(payload));
  },
  error(message: string, error?: unknown, context?: LogContext): void {
    let payload: Record<string, unknown> = {
      severity: "ERROR",
      message: message,
      ...(context || {}),
    };

    if (error instanceof Error) {
      // Per spec: include an 'error' field whose string value contains error.message or error.stack
      payload = {
        ...payload,
        error: error.stack ?? error.message,
      };
    } else if (error !== undefined && error !== null) {
      // Handle non-Error but defined error object by stringifying it as a fallback
      payload = {
        ...payload,
        error: JSON.stringify(error),
      };
    }

    console.log(JSON.stringify(payload));
  },
};
