export interface LogContext {
  [key: string]: unknown;
}

function debug(message: string, context?: LogContext): void {
  console.debug(message, context ?? "");
}

function info(message: string, context?: LogContext): void {
  console.info(message, context ?? "");
}

function warn(message: string, context?: LogContext): void {
  console.warn(message, context ?? "");
}

function error(message: string, err?: unknown, context?: LogContext): void {
  // console.error always receives 3 arguments: message, the error (undefined when
  // none was passed), and the context (or "" so the arg position is stable).
  console.error(message, err, context ?? "");
}

export const logger = { debug, info, warn, error };
