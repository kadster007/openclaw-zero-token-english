import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { getHeadersWithAuth } from "../../../extensions/browser/src/browser/cdp.helpers.js";
import {
  getChromeWebSocketUrl,
  launchOpenClawChrome,
} from "../../../extensions/browser/src/browser/chrome.js";
import {
  resolveBrowserConfig,
  resolveProfile,
} from "../../../extensions/browser/src/browser/config.js";
import { loadConfig } from "../../config/io.js";

export interface GeminiWebClientOptions {
  cookie: string;
  userAgent: string;
  headless?: boolean;
}

export class GeminiWebClientBrowser {
  private options: GeminiWebClientOptions;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private initialized = false;

  constructor(options: GeminiWebClientOptions) {
    this.options = options;
  }

  private parseCookies(): Array<{ name: string; value: string; domain: string; path: string }> {
    return this.options.cookie
      .split(";")
      .filter((c) => c.trim().includes("="))
      .map((cookie) => {
        const [name, ...valueParts] = cookie.trim().split("=");
        return {
          name: name?.trim() ?? "",
          value: valueParts.join("=").trim(),
          domain: ".google.com",
          path: "/",
        };
      })
      .filter((c) => c.name.length > 0);
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const rootConfig = loadConfig();
    const browserConfig = resolveBrowserConfig(rootConfig.browser, rootConfig);
    const profile = resolveProfile(browserConfig, browserConfig.defaultProfile);
    if (!profile) {
      throw new Error(`Could not resolve browser profile '${browserConfig.defaultProfile}'`);
    }

    let wsUrl: string | null = null;

    if (browserConfig.attachOnly) {
      console.log(`[Gemini Web Browser] Connecting to existing Chrome at ${profile.cdpUrl}`);
      for (let i = 0; i < 10; i++) {
        wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 2000);
        if (wsUrl) {
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!wsUrl) {
        throw new Error(
          `Failed to connect to Chrome at ${profile.cdpUrl}. ` +
            `Make sure Chrome is running in debug mode (./start-chrome-debug.sh)`,
        );
      }
    } else {
      const running = await launchOpenClawChrome(browserConfig, profile);
      const cdpUrl = `http://127.0.0.1:${running.cdpPort}`;
      for (let i = 0; i < 10; i++) {
        wsUrl = await getChromeWebSocketUrl(cdpUrl, 2000);
        if (wsUrl) {
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!wsUrl) {
        throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl}`);
      }
    }

    const connectedBrowser = await chromium.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl),
    });
    this.browser = connectedBrowser;
    this.context = connectedBrowser.contexts()[0];

    const pages = this.context.pages();
    const geminiPage = pages.find((p) => p.url().includes("gemini.google.com"));
    if (geminiPage) {
      console.log(`[Gemini Web Browser] Found existing Gemini page`);
      this.page = geminiPage;
    } else {
      this.page = await this.context.newPage();
      await this.page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded" });
    }

    const cookies = this.parseCookies();
    if (cookies.length > 0) {
      try {
        await this.context.addCookies(cookies);
      } catch (e) {
        console.warn("[Gemini Web Browser] Failed to add some cookies:", e);
      }
    }

    this.initialized = true;
  }

  /**
   * DOM simulation: send messages through real browser interaction, bypassing Bard RPC protocol complexity
   */
  private async chatCompletionsViaDOM(params: {
    message: string;
    signal?: AbortSignal;
  }): Promise<ReadableStream<Uint8Array>> {
    if (!this.page) {
      throw new Error("GeminiWebClientBrowser not initialized");
    }

    const page = this.page;

    // Find input using Playwright selector
    const inputSelectors = [
      'textarea[placeholder*="Gemini"]',
      'textarea[placeholder*="问问"]',
      'textarea[aria-label*="prompt"]',
      "textarea",
      'div[role="textbox"]',
      '[contenteditable="true"]',
    ];
    let inputHandle = null;
    for (const sel of inputSelectors) {
      inputHandle = await page.$(sel);
      if (inputHandle) {
        break;
      }
    }
    if (!inputHandle) {
      throw new Error("Gemini DOM simulation failed: input field not found");
    }

    // Use Playwright native APIs for reliable input
    await inputHandle.click();
    await page.waitForTimeout(300);
    await page.keyboard.type(params.message, { delay: 20 });
    await page.waitForTimeout(300);
    await page.keyboard.press("Enter");
    console.log("[Gemini Web Browser] DOM: typed message and pressed Enter");

    console.log("[Gemini Web Browser] DOM simulation sent, polling for reply...");

    const maxWaitMs = 120000;
    const pollIntervalMs = 2000;
    let lastText = "";
    let stableCount = 0;
    const signal = params.signal;

    for (let elapsed = 0; elapsed < maxWaitMs; elapsed += pollIntervalMs) {
      if (signal?.aborted) {
        throw new Error("Gemini request cancelled");
      }

      await new Promise((r) => setTimeout(r, pollIntervalMs));

      const result = await this.page.evaluate(() => {
        // Clean invisible Unicode characters
        const clean = (t: string) => t.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();

        // Use innerText (excludes hidden elements and CSS-controlled invisible content) instead of textContent
        const getText = (el: Element): string => {
          const raw = (el as HTMLElement).innerText ?? "";
          return clean(raw);
        };

        // Excluded area detection
        const sidebarRoot = document.querySelector('[aria-label*="对话"], [class*="sidebar"], nav');
        const inputEl = document.querySelector(
          '[contenteditable="true"], textarea, [placeholder*="Gemini"], [placeholder*="问问"]',
        );
        const inputRoot =
          inputEl?.closest("form") ??
          inputEl?.closest("[class*='input']") ??
          inputEl?.parentElement?.parentElement;

        const isExcluded = (el: Element) => sidebarRoot?.contains(el) || inputRoot?.contains(el);

        // Noise text filtering
        const noisePatterns = [
          "Ask Gemini",
          "Enter a prompt",
          "Upgrade to Google AI Plus",
          "Loading",
          "Copy",
          "Share",
          "Modify",
          "Read aloud",
          "What can I help you with",
          "Start new chat",
          "My content",
          "Settings and help",
          "Create image",
          "Create music",
          "Help me learn",
          "Write something",
          "Energize my day",
        ];
        const isNoise = (t: string) =>
          t.length < 20 ||
          noisePatterns.some((p) => t.includes(p)) ||
          /^(hello|help|sage)/i.test(t);

        // Remove UI button text from replies (such as "Copy Share Modify Read aloud" etc. trailing noise)
        const stripTrailingUI = (t: string) =>
          t
            .replace(
              /\n?\s*(Copy|Share|Modify|Read aloud|thumb_up|thumb_down|more_vert)[\s\n]*/gi,
              "",
            )
            .replace(/\s+$/, "");

        const main =
          document.querySelector("main") ??
          document.querySelector('[role="main"]') ??
          document.querySelector('[class*="chat"]') ??
          document.body;
        const scoped = main === document.body ? document : main;

        let text = "";

        // Strategy 1: Exact match Gemini model response container (only take the last one)
        const modelSelectors = [
          "model-response message-content", // Gemini 2025+ web component
          '[data-message-author="model"] .message-content',
          '[data-message-author="model"]',
          '[data-sender="model"]',
          '[class*="model-response"] [class*="markdown"]',
          '[class*="model-response"]',
          '[class*="response-content"] [class*="markdown"]',
          '[class*="response-content"]',
        ];

        for (const sel of modelSelectors) {
          const els = scoped.querySelectorAll(sel);
          // Start from the last element (latest reply)
          for (let i = els.length - 1; i >= 0; i--) {
            const el = els[i];
            if (isExcluded(el)) {
              continue;
            }
            const t = getText(el);
            if (t.length >= 30 && !isNoise(t)) {
              text = stripTrailingUI(t);
              break;
            }
          }
          if (text) {
            break;
          }
        }

        // Strategy 2 (restricted fallback): only look for markdown rendered blocks in the main area, don't match generic selectors
        if (!text) {
          const fallbackSelectors = ['[class*="markdown"]', "article"];
          for (const sel of fallbackSelectors) {
            const els = scoped.querySelectorAll(sel);
            for (let i = els.length - 1; i >= 0; i--) {
              const el = els[i];
              if (isExcluded(el)) {
                continue;
              }
              const t = getText(el);
              if (t.length >= 30 && !isNoise(t)) {
                text = stripTrailingUI(t);
                break;
              }
            }
            if (text) {
              break;
            }
          }
        }

        const stopBtn = document.querySelector(
          '[aria-label*="Stop"], [aria-label*="stop"], [aria-label*="停止"]',
        );
        const isStreaming = !!stopBtn;
        return { text, isStreaming };
      });

      // Ignore too-short content (<40 chars is often greetings/buttons; log 38 chars was mis-captured greeting)
      const minLen = 40;
      if (result.text && result.text.length < minLen && result.text.length > 0) {
        console.log(
          `[Gemini Web Browser] Ignoring too-short content (${result.text.length} chars): ${result.text.slice(0, 50)}...`,
        );
      }
      if (result.text && result.text.length >= minLen) {
        if (result.text !== lastText) {
          lastText = result.text;
          stableCount = 0;
        } else {
          stableCount++;
          if (!result.isStreaming && stableCount >= 2) {
            break;
          }
        }
      }
    }

    if (!lastText) {
      throw new Error(
        "Gemini DOM simulation: no reply detected. Please ensure gemini.google.com is open, logged in, and the input box is visible.",
      );
    }

    // Output data: format parseable by gemini-web-stream
    const sseLine = `data: ${JSON.stringify({ text: lastText })}\n`;
    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(sseLine));
        controller.close();
      },
    });
  }

  async chatCompletions(params: {
    conversationId?: string;
    message: string;
    model: string;
    signal?: AbortSignal;
  }): Promise<ReadableStream<Uint8Array>> {
    if (!this.page) {
      throw new Error("GeminiWebClientBrowser not initialized");
    }

    const { message } = params;
    console.log("[Gemini Web Browser] Sending message via DOM simulation...");

    return this.chatCompletionsViaDOM({
      message,
      signal: params.signal,
    });
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.initialized = false;
  }
}
