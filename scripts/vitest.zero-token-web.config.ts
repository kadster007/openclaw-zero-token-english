import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const scriptsDir = fileURLToPath(new URL(".", import.meta.url));
const root = path.resolve(scriptsDir, "..");
const pluginSdkDist = path.resolve(root, "dist/plugin-sdk");

/** Run only Zero Token web stream related unit tests, no dependency on browser-playwright or main vitest multi-project config. */
export default defineConfig({
  resolve: {
    // extensions/browser (indirectly referenced by several web-streams) uses openclaw/plugin-sdk/*;
    // When the root package is not symlinked as openclaw under node_modules, Vite needs explicit aliases to dist.
    alias: [
      {
        find: /^openclaw\/plugin-sdk\/(.+)$/,
        replacement: `${pluginSdkDist}/$1.js`,
      },
    ],
  },
  test: {
    environment: "node",
    include: [
      "src/zero-token/streams/web-stream-factories.test.ts",
      "src/zero-token/streams/doubao-web-stream.test.ts",
    ],
  },
});
