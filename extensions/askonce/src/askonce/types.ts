/**
 * AskOnce type definitions
 */

import type { Readable } from "node:stream";

/**
 * Model response result
 */
export interface ModelResponse {
  /** Model ID */
  modelId: string;
  /** Model display name */
  modelName: string;
  /** Provider ID */
  provider: string;
  /** Response status */
  status: "pending" | "streaming" | "completed" | "error" | "timeout";
  /** Response text content */
  content: string;
  /** Error message (if failed) */
  error?: string;
  /** Response time (milliseconds) */
  responseTime: number;
  /** Character count */
  charCount: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Query options
 */
export interface QueryOptions {
  /** Question content */
  question: string;
  /** Selected model list (default all) */
  models?: string[];
  /** Timeout (milliseconds, default 60000) */
  timeout?: number;
  /** Maximum retry count (default 2) */
  maxRetries?: number;
  /** Whether to use streaming output */
  stream?: boolean;
  /** System prompt */
  systemPrompt?: string;
}

/**
 * Query result
 */
export interface QueryResult {
  /** Query ID */
  queryId: string;
  /** Original question */
  question: string;
  /** Start time */
  startTime: number;
  /** End time */
  endTime: number;
  /** Total duration */
  totalTime: number;
  /** All model responses */
  responses: ModelResponse[];
  /** Success count */
  successCount: number;
  /** Error count */
  errorCount: number;
}

/**
 * Model adapter interface
 */
export interface ModelAdapter {
  /** Adapter ID */
  id: string;
  /** Display name */
  name: string;
  /** Provider */
  provider: string;
  /** Supported model list */
  models: string[];
  /** Default model */
  defaultModel: string;
  /** Check if adapter is available (authenticated) */
  isAvailable(): Promise<boolean>;
  /** Execute a query */
  query(question: string, options?: AdapterQueryOptions): Promise<ModelResponse>;
  /** Streaming query */
  queryStream?(
    question: string,
    options: AdapterQueryOptions,
    onChunk: (chunk: string) => void,
  ): Promise<ModelResponse>;
}

/**
 * Adapter query options
 */
export interface AdapterQueryOptions {
  /** Model ID */
  modelId?: string;
  /** Timeout */
  timeout?: number;
  /** System prompt */
  systemPrompt?: string;
  /** AbortSignal */
  signal?: AbortSignal;
}

/**
 * Progress event
 */
export interface ProgressEvent {
  /** Event type */
  type: "start" | "progress" | "complete" | "error";
  /** Model ID */
  modelId: string;
  /** Progress data */
  data?: {
    content?: string;
    delta?: string;
    error?: string;
    progress?: number;
  };
}

/**
 * Progress callback function
 */
export type ProgressCallback = (event: ProgressEvent) => void;

/**
 * Stream event types
 */
export interface StreamEvent {
  type: "text_delta" | "text_start" | "thinking_delta" | "thinking_start" | "done" | "error";
  delta?: string;
  contentIndex?: number;
  reason?: string;
  error?: Error;
}

/**
 * Stream adapter interface
 */
export interface StreamAdapter {
  /** Streaming query */
  queryStream(question: string, options: AdapterQueryOptions): ReadableStream<StreamEvent>;
}

/**
 * Configuration options
 */
export interface AskOnceConfig {
  /** Default timeout (milliseconds) */
  timeout: number;
  /** Maximum retry count */
  maxRetries: number;
  /** Concurrency limit */
  concurrencyLimit: number;
  /** Default model list */
  defaultModels: string[];
}

export const DEFAULT_CONFIG: AskOnceConfig = {
  timeout: 60000,
  maxRetries: 2,
  concurrencyLimit: 10,
  defaultModels: ["claude-web", "chatgpt-web", "gemini-web", "deepseek-web", "qwen-web"],
};
