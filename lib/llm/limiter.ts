import Bottleneck from 'bottleneck';

export class GroqLimiter {
  private limiter: Bottleneck;

  constructor() {
    const tpmLimit = parseInt(process.env.GROQ_TPM_LIMIT || '12000');
    const minTimeMs = parseInt(process.env.GROQ_MIN_TIME_MS || '100');

    // Simple TPM-based limiter without concurrency limits
    this.limiter = new Bottleneck({
      reservoir: tpmLimit,
      reservoirRefreshAmount: tpmLimit,
      reservoirRefreshInterval: 60 * 1000, // 1 minute
      minTime: minTimeMs,
      maxConcurrent: null, // No concurrency limit
      retryCount: 3,
      retryDelay: (retryCount: number) => Math.min(1000 * Math.pow(2, retryCount), 10000),
    });
  }

  async schedule<T>(fn: () => Promise<T>, options?: { priority?: number }): Promise<T> {
    return this.limiter.schedule(fn, options);
  }

  async scheduleWithWeight<T>(fn: () => Promise<T>, weight: number, options?: { priority?: number }): Promise<T> {
    // Use weight for token counting but no concurrency limits
    return this.limiter.schedule(fn, { ...options, weight });
  }

  async disconnect(): Promise<void> {
    return this.limiter.disconnect();
  }
}

// Create a singleton instance
export const groqLimiter = new GroqLimiter();


