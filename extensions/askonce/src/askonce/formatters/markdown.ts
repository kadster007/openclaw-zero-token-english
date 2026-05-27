/**
 * Markdown Output Formatter
 */

import type { QueryResult, ModelResponse } from "../types.js";

export class MarkdownFormatter {
  format(result: QueryResult): string {
    const lines: string[] = [];

    // Title
    lines.push("# AskOnce Query Results\n");
    lines.push("---");
    lines.push("");

    // Question info
    lines.push("## Question");
    lines.push(result.question);
    lines.push("");

    // Statistics
    lines.push("## Statistics");
    lines.push(`- **Duration**: ${result.totalTime}ms`);
    lines.push(`- **Success**: ${result.successCount}`);
    lines.push(`- **Failed**: ${result.errorCount}`);
    lines.push("");

    // Sort by response time
    const sortedResponses = [...result.responses].sort((a, b) => a.responseTime - b.responseTime);

    // Per-model answers
    lines.push("## Response Details\n");

    for (const response of sortedResponses) {
      lines.push(this.formatResponse(response));
    }

    // Speed ranking
    lines.push("## Speed Ranking\n");
    const completed = result.responses.filter((r) => r.status === "completed");
    const speedRank = [...completed].sort((a, b) => a.responseTime - b.responseTime).slice(0, 5);

    speedRank.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.modelName} - ${r.responseTime}ms`);
    });
    lines.push("");

    return lines.join("\n");
  }

  private formatResponse(response: ModelResponse): string {
    const lines: string[] = [];

    const statusEmoji = response.status === "completed" ? "✅" : "❌";

    lines.push(`### ${statusEmoji} ${response.modelName}`);
    lines.push("");
    lines.push(`- **Model**: ${response.modelId}`);
    lines.push(`- **Provider**: ${response.provider}`);
    lines.push(`- **Duration**: ${response.responseTime}ms`);
    lines.push(`- **Characters**: ${response.charCount}`);
    lines.push("");

    if (response.status === "completed") {
      lines.push("**Answer:**");
      lines.push("");
      lines.push(response.content);
    } else {
      lines.push(`**Error**: ${response.error}`);
    }

    lines.push("");
    lines.push("---");
    lines.push("");

    return lines.join("\n");
  }
}
