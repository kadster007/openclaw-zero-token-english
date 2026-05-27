/**
 * Concurrent execution engine
 * Responsible for concurrent scheduling of query requests across all model adapters
 */

import {
  DEFAULT_TIMEOUT,
  MAX_RETRIES,
  CONCURRENCY_LIMIT,
  RETRY_BASE_DELAY,
  MAX_RETRY_DELAY,
} from "./constants.js";
import type {
  ModelAdapter,
  ModelResponse,
  AdapterQueryOptions,
  ProgressCallback,
} from "./types.js";

/**
 * Concurrent engine configuration
 */
export interface ConcurrentEngineConfig {
  /** Default timeout (milliseconds) */
  timeout: number;
  /** Maximum retry count */
  maxRetries: number;
  /** Concurrency limit (max simultaneous executions) */
  concurrencyLimit: number;
}

const DEFAULT_CONFIG: ConcurrentEngineConfig = {
  timeout: DEFAULT_TIMEOUT,
  maxRetries: MAX_RETRIES,
  concurrencyLimit: CONCURRENCY_LIMIT,
};

/**
 * Concurrent execution engine
 */
export class ConcurrentEngine {
  private config: ConcurrentEngineConfig;

  constructor(config: Partial<ConcurrentEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute queries across multiple models concurrently
   *
   * @param adapters List of adapters to execute
   * @param question The question content
   * @param options Query options
   * @param onProgress Progress callback
   * @returns Response results from all models
   */
  async executeAll(
    adapters: ModelAdapter[],
    question: string,
    options: AdapterQueryOptions = {},
    onProgress?: ProgressCallback,
  ): Promise<ModelResponse[]> {
    // Filter to available adapters
    const availableAdapters = await this.filterAvailableAdapters(adapters);

    if (availableAdapters.length === 0) {
      console.warn("[ConcurrentEngine] No available model adapters");
      return [];
    }

    console.log(`[ConcurrentEngine] Starting concurrent query on ${availableAdapters.length} models`);

    // Create concurrent tasks
    const tasks = availableAdapters.map((adapter) =>
      this.executeWithRetry(adapter, question, options, onProgress),
    );

    // Use Promise.allSettled for concurrent execution, ensure individual failures don't affect others
    const results = await Promise.allSettled(tasks);

    // Aggregate results
    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        // Create error response
        const adapter = availableAdapters[index];
        return {
          modelId: adapter.defaultModel,
          modelName: adapter.name,
          provider: adapter.provider,
          status: "error" as const,
          content: "",
          error: result.reason?.message || "Unknown error",
          responseTime: 0,
          charCount: 0,
          timestamp: Date.now(),
        };
      }
    });
  }

  /**
   * Filter to available adapters
   */
  private async filterAvailableAdapters(adapters: ModelAdapter[]): Promise<ModelAdapter[]> {
    const availabilityChecks = await Promise.all(
      adapters.map(async (adapter) => ({
        adapter,
        isAvailable: await adapter.isAvailable(),
      })),
    );

    return availabilityChecks.filter((check) => check.isAvailable).map((check) => check.adapter);
  }

  /**
   * Execute with retry
   */
  private async executeWithRetry(
    adapter: ModelAdapter,
    question: string,
    options: AdapterQueryOptions,
    onProgress?: ProgressCallback,
  ): Promise<ModelResponse> {
    const maxRetries = this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff
        const delay = Math.min(RETRY_BASE_DELAY * Math.pow(2, attempt - 1), MAX_RETRY_DELAY);
        console.log(`[ConcurrentEngine] ${adapter.name} retry ${attempt}, waiting ${delay}ms`);
        await this.delay(delay);
      }

      try {
        // Send start event
        onProgress?.({
          type: "start",
          modelId: adapter.defaultModel,
        });

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          options.timeout || this.config.timeout,
        );

        const response = await adapter.query(question, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Send complete event
        onProgress?.({
          type: "complete",
          modelId: adapter.defaultModel,
          data: { content: response.content },
        });

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Timeout errors are not retried
        if (lastError.name === "AbortError") {
          onProgress?.({
            type: "error",
            modelId: adapter.defaultModel,
            data: { error: "Request timeout" },
          });

          return {
            modelId: adapter.defaultModel,
            modelName: adapter.name,
            provider: adapter.provider,
            status: "timeout",
            content: "",
            error: "Request timeout",
            responseTime: this.config.timeout,
            charCount: 0,
            timestamp: Date.now(),
          };
        }
      }
    }

    // All retries failed
    onProgress?.({
      type: "error",
      modelId: adapter.defaultModel,
      data: { error: lastError?.message || "Unknown error" },
    });

    return {
      modelId: adapter.defaultModel,
      modelName: adapter.name,
      provider: adapter.provider,
      status: "error",
      content: "",
      error: lastError?.message || "Unknown error",
      responseTime: 0,
      charCount: 0,
      timestamp: Date.now(),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
