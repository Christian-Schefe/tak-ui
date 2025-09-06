export const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL;

export function logDebug(...args: unknown[]) {
  if (LOG_LEVEL === 'debug') {
    // eslint-disable-next-line no-console
    console.debug('[DEBUG]', ...args);
  }
}

export function logInfo(...args: unknown[]) {
  if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') {
    // eslint-disable-next-line no-console
    console.info('[INFO]', ...args);
  }
}

export function logWarn(...args: unknown[]) {
  if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info' || LOG_LEVEL === 'warn') {
    // eslint-disable-next-line no-console
    console.warn('[WARN]', ...args);
  }
}

export function logError(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.error('[ERROR]', ...args);
}
