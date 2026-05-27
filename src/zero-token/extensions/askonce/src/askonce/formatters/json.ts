/**
 * JSON output formatter
 */

import type { QueryResult } from "../types.js";

export class JsonFormatter {
  format(result: QueryResult): string {
    return JSON.stringify(result, null, 2);
  }
}
