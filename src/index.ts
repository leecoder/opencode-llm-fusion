import type { FusionConfig } from "./config.js";
import { FusionConfigSchema } from "./config.js";
import { createFusionLanguageModel } from "./fusion-model.js";
import { shouldUseFusion } from "./routing.js";

export type { FusionConfig, SynthesisStrategy, PanelModel, JudgeModel, ContextLimits } from "./config.js";
export { FusionConfigSchema, DEFAULT_JUDGE_SYSTEM_PROMPT } from "./config.js";
export { createFusionLanguageModel } from "./fusion-model.js";
export { shouldUseFusion } from "./routing.js";
export { packContext, estimatePromptTokens } from "./context-packer.js";
export { routePanels, getRoutingSummary, hasImages } from "./panel-router.js";
export type { PanelContextMode, PanelAssignment } from "./panel-router.js";
export type { MultimodalMessage, ContentPart } from "./types.js";

function loadConfig(): FusionConfig | null {
  const fs = require("fs");
  const path = require("path");

  const candidates = [
    path.join(process.cwd(), ".opencode", "opencode-llm-fusion.json"),
    path.join(process.cwd(), ".opencode", "opencode-llm-fusion.jsonc"),
    path.join(process.cwd(), "opencode-llm-fusion.json"),
    path.join(process.env.HOME ?? "~", ".config", "opencode", "opencode-llm-fusion.json"),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const raw = fs.readFileSync(candidate, "utf-8");
        const cleaned = candidate.endsWith(".jsonc")
          ? raw.replace(/(?<![:"\\])\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")
          : raw;
        const parsed = JSON.parse(cleaned);
        return FusionConfigSchema.parse(parsed);
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function createFusion(_options?: Record<string, any>) {
  const config = loadConfig();

  if (!config) {
    throw new Error(
      "[opencode-llm-fusion] No configuration found. Create .opencode/opencode-llm-fusion.json or ~/.config/opencode/opencode-llm-fusion.json"
    );
  }

  const judgeLabel = typeof config.judge === "string" ? config.judge : `${config.judge.provider}/${config.judge.model}`;
  console.log(
    `[opencode-llm-fusion] Loaded: ${config.panel.length} panel models, judge=${judgeLabel}, strategy=${config.strategy}`
  );

  const provider = (modelId: string) => {
    let effectiveConfig = config;
    if (modelId.includes("majority_vote")) {
      effectiveConfig = { ...config, strategy: "majority_vote" as const };
    } else if (modelId.includes("best_of_n")) {
      effectiveConfig = { ...config, strategy: "best_of_n" as const };
    } else if (modelId.includes("single_judge")) {
      effectiveConfig = { ...config, strategy: "single_judge" as const };
    }
    return createFusionLanguageModel(effectiveConfig);
  };

  provider.languageModel = provider;
  provider.chat = provider;

  return provider;
}
