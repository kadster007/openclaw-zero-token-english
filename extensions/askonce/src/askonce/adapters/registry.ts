/**
 * Adapter registry
 */

import type { ModelAdapter } from "../types.js";
import { ChatGPTAdapter } from "./chatgpt.js";
import { ClaudeAdapter } from "./claude.js";
import { DeepSeekAdapter } from "./deepseek.js";
import { DoubaoAdapter } from "./doubao.js";
import { GeminiAdapter } from "./gemini.js";
import { GLMAdapter } from "./glm.js";
import { GrokAdapter } from "./grok.js";
import { KimiAdapter } from "./kimi.js";
import { QwenCNAdapter } from "./qwen-cn.js";
import { QwenAdapter } from "./qwen.js";

/**
 * Adapter registry
 * Manages all available model adapters
 */
export class AdapterRegistry {
  private adapters: Map<string, ModelAdapter> = new Map();
  private initialized = false;

  constructor() {
    // Register all Web model adapters
    this.register(new ClaudeAdapter());
    this.register(new ChatGPTAdapter());
    this.register(new GeminiAdapter());
    this.register(new DeepSeekAdapter());
    this.register(new QwenAdapter());
    this.register(new KimiAdapter());
    this.register(new GLMAdapter());
    this.register(new DoubaoAdapter());
    this.register(new GrokAdapter());
    this.register(new QwenCNAdapter());
    this.initialized = true;
  }

  /**
   * Register an adapter
   */
  register(adapter: ModelAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  /**
   * Get all adapters
   */
  getAllAdapters(): ModelAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapter by ID
   */
  getAdapterById(id: string): ModelAdapter | undefined {
    return this.adapters.get(id);
  }

  /**
   * Get adapters by multiple IDs
   */
  getAdaptersByIds(ids: string[]): ModelAdapter[] {
    return ids
      .map((id) => this.adapters.get(id))
      .filter((adapter): adapter is ModelAdapter => adapter !== undefined);
  }

  /**
   * Get all adapter IDs
   */
  getAdapterIds(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get available adapters list
   */
  async getAvailableAdapters(): Promise<ModelAdapter[]> {
    const adapters = this.getAllAdapters();
    const availabilityChecks = await Promise.all(
      adapters.map(async (adapter) => ({
        adapter,
        isAvailable: await adapter.isAvailable(),
      })),
    );

    return availabilityChecks.filter((check) => check.isAvailable).map((check) => check.adapter);
  }
}

// Singleton instance
let registryInstance: AdapterRegistry | null = null;

/**
 * Get adapter registry singleton
 */
export function getAdapterRegistry(): AdapterRegistry {
  if (!registryInstance) {
    registryInstance = new AdapterRegistry();
  }
  return registryInstance;
}
