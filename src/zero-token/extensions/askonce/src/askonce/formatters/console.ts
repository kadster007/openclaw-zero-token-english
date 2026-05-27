/**
 * Console output formatter
 */

import chalk from "chalk";
import type { QueryResult, ModelResponse } from "../types.js";

export class ConsoleFormatter {
  format(result: QueryResult): string {
    const lines: string[] = [];

    // Title
    lines.push(chalk.bold.blue("\n═══════════════════════════════════════════════════════════"));
    lines.push(chalk.bold.blue("                    AskOnce Query Results                   "));
    lines.push(chalk.bold.blue("═══════════════════════════════════════════════════════════\n"));

    // Question
    lines.push(chalk.gray("Question: ") + chalk.white(result.question));
    lines.push(
      chalk.gray(
        `Duration: ${result.totalTime}ms | Success: ${result.successCount} | Failed: ${result.errorCount}`,
      ),
    );
    lines.push("");

    // Sort by response time
    const sortedResponses = [...result.responses].sort((a, b) => a.responseTime - b.responseTime);

    // Each model's response
    for (let i = 0; i < sortedResponses.length; i++) {
      const response = sortedResponses[i];
      lines.push(this.formatResponse(response, i + 1));
    }

    // Summary statistics
    lines.push(this.formatSummary(result));

    return lines.join("\n");
  }

  private formatResponse(response: ModelResponse, index: number): string {
    const lines: string[] = [];

    // Status icon
    const statusIcon = this.getStatusIcon(response.status);

    // Header
    lines.push(chalk.gray("┌─────────────────────────────────────────────────────────┐"));
    lines.push(
      chalk.gray("│ ") +
        statusIcon +
        " " +
        chalk.bold(response.modelName) +
        chalk.gray(` | ${response.responseTime}ms | ${response.charCount} chars`),
    );
    lines.push(chalk.gray("├─────────────────────────────────────────────────────────┤"));

    // Content
    if (response.status === "completed") {
      const content = this.truncateContent(response.content, 500);
      lines.push(chalk.gray("│ ") + chalk.white(content));
    } else {
      lines.push(chalk.gray("│ ") + chalk.red(`Error: ${response.error}`));
    }

    lines.push(chalk.gray("└─────────────────────────────────────────────────────────┘"));
    lines.push("");

    return lines.join("\n");
  }

  private getStatusIcon(status: ModelResponse["status"]): string {
    switch (status) {
      case "completed":
        return chalk.green("✓");
      case "error":
        return chalk.red("✗");
      case "timeout":
        return chalk.yellow("⏱");
      default:
        return chalk.gray("○");
    }
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.slice(0, maxLength) + "...";
  }

  private formatSummary(result: QueryResult): string {
    const lines: string[] = [];

    lines.push(chalk.bold("\n📊 Summary Statistics:"));
    lines.push(chalk.gray("─────────────────────────────────────────"));

    // Speed ranking
    const completed = result.responses.filter((r) => r.status === "completed");
    const speedRank = [...completed].sort((a, b) => a.responseTime - b.responseTime).slice(0, 3);

    if (speedRank.length > 0) {
      lines.push(chalk.bold("\n⚡ Response Speed Ranking:"));
      speedRank.forEach((r, i) => {
        lines.push(`  ${i + 1}. ${r.modelName} (${r.responseTime}ms)`);
      });
    }

    // Length statistics
    if (completed.length > 0) {
      lines.push(chalk.bold("\n📏 Response Length:"));
      completed
        .sort((a, b) => b.charCount - a.charCount)
        .forEach((r) => {
          const bar = "█".repeat(Math.min(Math.floor(r.charCount / 50), 20));
          lines.push(`  ${r.modelName.padEnd(15)} ${bar} (${r.charCount})`);
        });
    }

    return lines.join("\n");
  }
}
