/**
 * AskOnce Plugin
 *
 * Query multiple AI models simultaneously with a single question
 */

import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import type { Command } from "commander";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/askonce";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk/askonce";
import { ConsoleFormatter, MarkdownFormatter, JsonFormatter } from "../askonce/formatters/index.js";
import { QueryOrchestrator } from "../askonce/query-orchestrator.js";

/**
 * Auto-detect and set OPENCLAW_STATE_DIR
 */
function setupOpenclawStateDir(): void {
  if (process.env.OPENCLAW_STATE_DIR || process.env.OPENCLAW_ZERO_STATE_DIR) {
    return;
  }

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

const askoncePlugin = {
  id: "askonce",
  name: "AskOnce",
  description: "Query multiple AI models simultaneously with a single question",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    // Register CLI commands
    api.registerCli((ctx) => {
      ctx.program
        .command("askonce [question...]")
        .alias("ask")
        .description("Query multiple AI models simultaneously with a single question")
        .option("-m, --models <models>", "Specify models (comma-separated)", "")
        .option("-t, --timeout <ms>", "Timeout (milliseconds)", "60000")
        .option("-o, --output <format>", "Output format (console/markdown/json)", "console")
        .option("-f, --file <path>", "Export file path")
        .option("-s, --stream", "Enable streaming output", false)
        .option("-l, --list", "List all available models", false)
        .allowUnknownOption()
        .action(async (question: string[] | undefined, options) => {
          await runAskOnce(ctx.program, options, question);
        });
    });
  },
};

async function runAskOnce(_program: Command, options: any, question?: string[]): Promise<void> {
  setupOpenclawStateDir();

  const orchestrator = new QueryOrchestrator();

  // List available models
  if (options.list) {
    console.log("\nAvailable models:");
    const models = await orchestrator.listAvailableModels();
    for (const model of models) {
      const status = model.available ? chalk.green("✓") : chalk.red("✗");
      console.log(`  ${status} ${model.id} (${model.provider})`);
    }
    return;
  }

  // Check question arguments
  if (!question || question.length === 0) {
    console.error("Error: Please provide a question");
    console.error("");
    console.error("Usage:");
    console.error('  openclaw askonce "your question"              # Ask a question');
    console.error("  openclaw askonce --list                 # List available models");
    console.error('  openclaw askonce "question" -m claude-web   # Specify a model');
    console.error("");
    console.error("Tip: Configure authentication with openclaw onboard <provider>");
    process.exit(1);
  }

  const questionStr = question.join(" ");

  const modelIds = options.models
    ? options.models.split(",").map((m: string) => m.trim())
    : undefined;

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

  const onProgress = (event: any) => {
    if (options.stream) {
      process.stdout.write(`\r[${event.modelId}] ${event.type}...`);
    }
  };

  try {
    const result = await orchestrator.query(
      {
        question: questionStr,
        models: modelIds,
        timeout: parseInt(options.timeout),
        stream: options.stream,
      },
      onProgress,
    );

    const output = formatter.format(result);

    if (options.file) {
      const fsPromises = await import("fs/promises");
      await fsPromises.writeFile(options.file, output, "utf-8");
      console.log(`\nResults saved to: ${options.file}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error("Query failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export default askoncePlugin;
