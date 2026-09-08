import type { HookDiagnostic, HookServices } from './shared.js';

// A hook's control result must not wait on observability indefinitely.
const recordBudgetMs = 50;
type RecordingServices = Pick<HookServices, 'diagnostic' | 'signal'>;

/** Fixed codes only: never disclose a command, argument, path, or error payload. */
export const reportHookDiagnostic = (services: RecordingServices, code: HookDiagnostic): void => {
  try {
    const result = services.diagnostic === undefined
      ? process.stderr.write(`[cargo-hauler] beforeTool ${code}\n`)
      : services.diagnostic(code);
    void Promise.resolve(result).catch(() => undefined);
  } catch {
    // A diagnostic sink is observability too, never a permission decision.
  }
};

/**
 * Bound the wait, not the underlying I/O. Late rejection remains observed
 * after timeout/cancellation; neither can replace an already chosen result.
 */
export const recordBestEffort = (
  record: () => void | Promise<void>,
  services: RecordingServices,
  operation: 'record' | 'recordAttempt' = 'record',
): Promise<void> => new Promise((resolve) => {
  let settled = false;
  const signal = services.signal;
  const onAbort = () => finish('cancelled');
  const timer = setTimeout(() => finish('timeout'), recordBudgetMs);

  function finish(reason?: 'failed' | 'timeout' | 'cancelled'): void {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
    if (reason !== undefined) reportHookDiagnostic(services, `${operation}-${reason}`);
    resolve();
  }

  signal?.addEventListener('abort', onAbort, { once: true });
  if (signal?.aborted === true) {
    finish('cancelled');
    return;
  }
  try {
    void Promise.resolve(record()).then(() => finish(), () => finish('failed'));
  } catch {
    finish('failed');
  }
});
