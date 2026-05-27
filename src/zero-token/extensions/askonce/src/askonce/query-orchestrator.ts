/**
 * Query orchestrator
 * Coordinates the entire query flow
 */

import { randomUUID } from "node:crypto";
import { getAdapterRegistry, type ModelAdapter } from "./adapters/index.js";
import { ConcurrentEngine } from "./concurrent-engine.js";
import type { QueryOptions, QueryResult, ModelResponse, ProgressCallback } from "./types.js";

/**
 * Query orchestrator
 * Coordinates the entire query flow
 */
export class QueryOrchestrator {
  private engine: ConcurrentEngine;
  private registry: ReturnType<typeof getAdapterRegistry>;

  constructor() {
    this.engine = new ConcurrentEngine();
    this.registry = getAdapterRegistry();
  }

  /**
   * Execute multi-model query
   */
  async query(options: QueryOptions, onProgress?: ProgressCallback): Promise<QueryResult> {
    const queryId = randomUUID();
    const startTime = Date.now();

    console.log(`[QueryOrchestrator] Starting query: "${options.question.slice(0, 50)}..."`);

    // Get adapters to use
    let adapters: ModelAdapter[];
    if (options.models && options.models.length > 0) {
      // Get adapter by model ID (supports model ID and adapter ID)
      const adapterSet = new Set<ModelAdapter>();
      for (const modelId of options.models) {
        const adapter = getAdapterByModelId(this.registry, modelId);
        if (adapter) {
          adapterSet.add(adapter);
        }
      }
      adapters = Array.from(adapterSet);
    } else {
      adapters = this.registry.getAllAdapters();
    }

    if (adapters.length === 0) {
      throw new Error("No available model adapters, please configure authentication first");
    }

    console.log(
      `[QueryOrchestrator] Using ${adapters.length} models: ${adapters.map((a) => a.name).join(", ")}`,
    );

    // Execute concurrent query
    const responses = await this.engine.executeAll(
      adapters,
      options.question,
      {
        timeout: options.timeout,
        systemPrompt: options.systemPrompt,
      },
      onProgress,
    );

    const endTime = Date.now();

    // Build result
    const result: QueryResult = {
      queryId,
      question: options.question,
      startTime,
      endTime,
      totalTime: endTime - startTime,
      responses,
      successCount: responses.filter((r) => r.status === "completed").length,
      errorCount: responses.filter((r) => r.status !== "completed").length,
    };

    console.log(
      `[QueryOrchestrator] Query complete: success ${result.successCount}, failed ${result.errorCount}, duration ${result.totalTime}ms`,
    );

    return result;
  }

  /**
   * Get list of all available models
   */
  async listAvailableModels(): Promise<
    Array<{ id: string; name: string; provider: string; available: boolean }>
  > {
    const adapters = this.registry.getAllAdapters();
    const results: Array<{ id: string; name: string; provider: string; available: boolean }> = [];

    for (const adapter of adapters) {
      const isAvailable = await adapter.isAvailable();
      for (const modelId of adapter.models) {
        results.push({
          id: modelId,
          name: adapter.name, // Use adapter name directly, e.g. "Claude", "ChatGPT", etc.
          provider: adapter.provider,
          available: isAvailable,
        });
      }
    }

    return results;
  }

  /**
   * Get all models list (including unauthenticated)
   */
  getAllModels(): Array<{ id: string; name: string; provider: string }> {
    const adapters = this.registry.getAllAdapters();
    const results: Array<{ id: string; name: string; provider: string }> = [];

    for (const adapter of adapters) {
      for (const modelId of adapter.models) {
        results.push({
          id: modelId,
          name: adapter.name, // Use adapter name directly
          provider: adapter.provider,
        });
      }
    }

    return results;
  }
}
