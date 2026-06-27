import type { FusionConfig, FusionMultiConfig } from "./config.js";
import { FusionConfigSchema, FusionModelConfigSchema } from "./config.js";
import { createFusionLanguageModel } from "./fusion-model.js";
import { shouldUseFusion } from "./routing.js";

export type { FusionConfig, FusionMultiConfig, SynthesisStrategy, PanelModel, JudgeModel, ContextLimits } from "./config.js";
export { FusionConfigSchema, FusionModelConfigSchema, DEFAULT_JUDGE_SYSTEM_PROMPT } from "./config.js";
export { createFusionLanguageModel } from "./fusion-model.js";
export { shouldUseFusion } from "./routing.js";
export { packContext, estimatePromptTokens } from "./context-packer.js";
export { routePanels, getRoutingSummary, hasImages } from "./panel-router.js";
export type { PanelContextMode, PanelAssignment } from "./panel-router.js";
export type { MultimodalMessage, ContentPart } from "./types.js";
export { isInternalProvider, queryViaSDK } from "./sdk-panel.js";

interface LoadedConfig {
  type: "single" | "multi";
  single?: FusionConfig;
  multi?: FusionMultiConfig;
}

function loadConfig(): LoadedConfig | null {
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

        if (parsed.models && typeof parsed.models === "object" && !Array.isArray(parsed.models)) {
          const defaults = parsed.defaults ?? {};
          const models: Record<string, FusionConfig> = {};
          for (const [id, modelConf] of Object.entries(parsed.models)) {
            models[id] = FusionModelConfigSchema.parse({ ...defaults, ...(modelConf as any) });
          }
          return { type: "multi", multi: { models, defaults } };
        }

        return { type: "single", single: FusionModelConfigSchema.parse(parsed) };
      }
    } catch {
      continue;
    }
  }

  return null;
}

function resolveConfigForModel(loaded: LoadedConfig, modelId: string): FusionConfig {
  if (loaded.type === "single" && loaded.single) {
    return loaded.single;
  }

  if (loaded.type === "multi" && loaded.multi) {
    const modelConfig = loaded.multi.models[modelId];
    if (modelConfig) return modelConfig;

    const firstKey = Object.keys(loaded.multi.models)[0];
    if (firstKey) return loaded.multi.models[firstKey]!;
  }

  throw new Error(`[opencode-llm-fusion] No config found for model "${modelId}"`);
}

export function createFusion(_options?: Record<string, any>) {
  const loaded = loadConfig();

  if (!loaded) {
    throw new Error(
      "[opencode-llm-fusion] No configuration found. Create .opencode/opencode-llm-fusion.json or ~/.config/opencode/opencode-llm-fusion.json"
    );
  }

  if (loaded.type === "multi" && loaded.multi) {
    const modelNames = Object.keys(loaded.multi.models).join(", ");
    console.log(`[opencode-llm-fusion] Loaded multi-model config: ${modelNames}`);
  } else if (loaded.single) {
    const judgeLabel = typeof loaded.single.judge === "string" ? loaded.single.judge : `${loaded.single.provider}/${loaded.single.model}`;
    console.log(
      `[opencode-llm-fusion] Loaded: ${loaded.single.panel.length} panel models, judge=${judgeLabel}, strategy=${loaded.single.strategy}`
    );
  }

  const provider = (modelId: string) => {
    const config = resolveConfigForModel(loaded, modelId);

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
