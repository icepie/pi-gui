export interface FetchRetryOptions {
  readonly attempts?: number;
  readonly initialDelayMs?: number;
  readonly maxDelayMs?: number;
}

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_INITIAL_DELAY_MS = 300;
const DEFAULT_MAX_DELAY_MS = 2_000;

export async function fetchWithRetry(
  input: string | URL | Request,
  init: RequestInit = {},
  options: FetchRetryOptions = {},
): Promise<Response> {
  const attempts = Math.max(1, options.attempts ?? DEFAULT_ATTEMPTS);
  const initialDelayMs = Math.max(0, options.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS);
  const maxDelayMs = Math.max(initialDelayMs, options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS);
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (!shouldRetryStatus(response.status) || attempt === attempts) {
        return response;
      }
      response.body?.cancel().catch(() => undefined);
      await delay(backoffDelayMs(attempt, initialDelayMs, maxDelayMs));
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        throw error;
      }
      await delay(backoffDelayMs(attempt, initialDelayMs, maxDelayMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

function backoffDelayMs(attempt: number, initialDelayMs: number, maxDelayMs: number): number {
  return Math.min(maxDelayMs, initialDelayMs * (2 ** (attempt - 1)));
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}
