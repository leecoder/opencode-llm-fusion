import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  clean: true,
  sourcemap: true,
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
  external: [
    "@ai-sdk/provider",
    "@opencode-ai/plugin",
    "effect",
  ],
});
