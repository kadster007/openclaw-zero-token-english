/**
 * Natural conversation message pool for E2E testing.
 * CN messages for Chinese providers, EN for international providers.
 */

const CN_MESSAGES = [
  "Please explain quantum computing in simple terms",
  "Write a five-character quatrain about spring",
  "What are three parks in Beijing suitable for a weekend visit?",
  "Make this paragraph more formal: I think this plan is okay",
  "Briefly describe the process of photosynthesis",
  "Recommend three Python programming books for beginners",
  "What are the customs of the Spring Festival? Briefly explain",
  "Please explain the main differences between TCP and UDP",
  "Write a concise and impactful self-introduction for a job interview",
  "Describe your understanding of the development trends in artificial intelligence",
];

const EN_MESSAGES = [
  "Explain the concept of machine learning in simple terms",
  "Write a short poem about the ocean",
  "What are three tips for improving public speaking skills?",
  "Briefly describe how photosynthesis works",
  "What are the key differences between Python and JavaScript?",
  "Recommend three classic science fiction novels",
  "Explain the difference between REST and GraphQL APIs",
  "Write a brief motivational message for someone starting a new job",
  "What are the main causes of climate change?",
  "Describe the basics of how blockchain technology works",
];

// Provider → language mapping
const PROVIDER_LANG: Record<string, "cn" | "en"> = {
  "claude-web": "en",
  "chatgpt-web": "en",
  "deepseek-web": "cn",
  "doubao-web": "cn",
  "qwen-web": "cn",
  "qwen-cn-web": "cn",
  "kimi-web": "cn",
  "gemini-web": "en",
  "grok-web": "en",
  "glm-web": "cn",
  "glm-intl-web": "en",
  "perplexity-web": "en",
  "xiaomimo-web": "cn",
};

export class MessagePool {
  private usedCN = new Set<number>();
  private usedEN = new Set<number>();

  /** Pick a random message for the given provider, no repeat within a run. */
  pick(provider: string): string {
    const lang = PROVIDER_LANG[provider] ?? "en";
    const pool = lang === "cn" ? CN_MESSAGES : EN_MESSAGES;
    const used = lang === "cn" ? this.usedCN : this.usedEN;

    // Reset if exhausted
    if (used.size >= pool.length) {
      used.clear();
    }

    let idx: number;
    do {
      idx = Math.floor(Math.random() * pool.length);
    } while (used.has(idx));

    used.add(idx);
    return pool[idx];
  }

  /** Get language for a provider */
  static lang(provider: string): "cn" | "en" {
    return PROVIDER_LANG[provider] ?? "en";
  }
}
