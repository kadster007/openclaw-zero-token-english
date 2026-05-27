/**
 * Adapter base class
 */

import type { ModelAdapter, ModelResponse, AdapterQueryOptions } from "../types.js";

/**
 * Abstract adapter base class
 */
export abstract class BaseAdapter implements ModelAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly provider: string;
  abstract readonly models: string[];
  abstract readonly defaultModel: string;

  /**
   * Check if the adapter is available
   * Subclasses must implement authentication check logic
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Execute a query
   * Subclasses must implement specific query logic
   */
  abstract query(question: string, options?: AdapterQueryOptions): Promise<ModelResponse>;

  /**
   * Create a response object
   */
  protected createResponse(
    modelId: string,
    status: ModelResponse["status"],
    content: string = "",
    error?: string,
    startTime: number = Date.now(),
  ): ModelResponse {
    return {
      modelId,
      modelName: this.name,
      provider: this.provider,
      status,
      content,
      error,
      responseTime: Date.now() - startTime,
      charCount: content.length,
      timestamp: Date.now(),
    };
  }

  /**
   * Delay execution
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse error message
   */
  protected parseError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
