/**
 * AskOnce CLI Commands
 * Plugin Version
 */

import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import type { Command } from "commander";
import type { OpenClawPluginCliContext } from "openclaw/plugin-sdk/askonce";
import { ConsoleFormatter, MarkdownFormatter, JsonFormatter } from "../askonce/formatters/index.js";
import { QueryOrchestrator } from "../askonce/query-orchestrator.js";

/**
 * Auto-detect and set OPENCLAW_STATE_DIR
 * Prefer .openclaw-zero-state under project directory
 */
function setupOpenclawStateDir(): void {
  if (process.env.OPENCLAW_STATE_DIR || process.env.OPENCLAW_ZERO_STATE_DIR) {
    return; // Already set
  }

  // Try to find .openclaw-zero-state in common locations
  const possiblePaths = [
    path.join(process.cwd(), ".openclaw-zero-state"),
    path.join(process.cwd(), ".openclaw-state"),
    path.resolve(process.cwd(), "..", ".openclaw-zero-state"),
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
        process.env.OPENCLAW_STATE_DIR = p;
        console.log(`[AskOnce] Using state directory: ${p}`);
        break;
      }
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Register AskOnce CLI Commands
 */
export async function registerAskOnceCli(
  program: Command,
  options: any,
  question?: string[],
): Promise<void> {
  // Setup state directory before any auth checks
  setupOpenclawStateDir();

  const orchestrator = new QueryOrchestrator();

  // List available models
  if (options.list) {
    console.log("\nAvailable model list:");
    const models = await orchestrator.listAvailableModels();
    for (const model of models) {
      const status = model.available ? chalk.green("✓") : chalk.red("✗");
      console.log(`  ${status} ${model.id} (${model.provider})`);
    }
    return;
  }

  // Check question parameter
  if (!question || question.length === 0) {
    console.error("Error: Please provide a question parameter");
    console.error("");
    console.error("Usage:");
    console.error('  openclaw askonce "your question"              # Ask a question');
    console.error("  openclaw askonce --list                 # List available models");
    console.error('  openclaw askonce "question" -m claude-web   # Specify model');
    console.error("");
    console.error("Tip: Use openclaw onboard <provider> to configure authentication");
    process.exit(1);
  }

  // Join multi-word question
  const questionStr = question.join(" ");

  // Parse model list
  const modelIds = options.models
    ? options.models.split(",").map((m: string) => m.trim())
    : undefined;

  // Select formatter
  let formatter;
  switch (options.output) {
    case "markdown":
      formatter = new MarkdownFormatter();
      break;
    case "json":
      formatter = new JsonFormatter();
      break;
    default:
      formatter = new ConsoleFormatter();
  }

  // Progress callback
  const onProgress = (event: any) => {
    if (options.stream) {
      process.stdout.write(`\r[${event.modelId}] ${event.type}...`);
    }
  };

  try {
    // Execute query
    const result = await orchestrator.query(
      {
        question: questionStr,
        models: modelIds,
        timeout: parseInt(options.timeout),
        stream: options.stream,
      },
      onProgress,
    );

    // Format output
    const output = formatter.format(result);

    if (options.file) {
      // Write to file
      const fs = await import("fs/promises");
      await fs.writeFile(options.file, output, "utf-8");
      console.log(`\nResult saved to: ${options.file}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error("Query failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
