import type { LanguageModelV3 } from "@ai-sdk/provider";
import type { PanelModel, JudgeModel } from "./config.js";

export interface ResolvedModelConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseURL?: string;
  weight?: number;
}

export function resolveModelConfig(config: PanelModel | JudgeModel): ResolvedModelConfig {
  if (typeof config === "string") {
    const parts = config.split("/");
    if (parts.length < 2) {
      throw new Error(`Invalid model reference "${config}". Use "provider/model" format.`);
    }
    const provider = parts[0]!;
    const model = parts.slice(1).join("/");
    return { provider, model };
  }

  if (config.model?.includes("/") && !config.provider) {
    const parts = config.model.split("/");
    const provider = parts[0]!;
    const model = parts.slice(1).join("/");
    return { provider, model, apiKey: config.apiKey, baseURL: config.baseURL, weight: (config as any).weight };
  }

  return {
    provider: config.provider ?? "openai",
    model: config.model,
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    weight: (config as any).weight,
  };
}

export function createProviderModel(config: PanelModel | JudgeModel): LanguageModelV3 {
  const resolved = resolveModelConfig(config);
  const { provider, model, apiKey, baseURL } = resolved;

  switch (provider) {
    case "@ai-sdk/openai":
    case "openai":
      return createOpenAIModel(model, apiKey, baseURL);
    case "@ai-sdk/google":
    case "google":
      return createGoogleModel(model, apiKey, baseURL);
    case "@ai-sdk/anthropic":
    case "anthropic":
      return createAnthropicModel(model, apiKey, baseURL);
    default:
      return createOpenAICompatibleModel(provider, model, apiKey, baseURL);
  }
}

function createOpenAIModel(
  model: string,
  apiKey?: string,
  baseURL?: string
): LanguageModelV3 {
  const { createOpenAI } = require("@ai-sdk/openai");
  const openai = createOpenAI({
    ...(apiKey && { apiKey }),
    ...(baseURL && { baseURL }),
  });
  return openai(model);
}

function createGoogleModel(
  model: string,
  apiKey?: string,
  baseURL?: string
): LanguageModelV3 {
  const { createGoogleGenerativeAI } = require("@ai-sdk/google");
  const google = createGoogleGenerativeAI({
    ...(apiKey && { apiKey }),
    ...(baseURL && { baseURL }),
  });
  return google(model);
}

function createAnthropicModel(
  model: string,
  apiKey?: string,
  baseURL?: string
): LanguageModelV3 {
  const { createAnthropic } = require("@ai-sdk/anthropic");
  const anthropic = createAnthropic({
    ...(apiKey && { apiKey }),
    ...(baseURL && { baseURL }),
  });
  return anthropic(model);
}

function loadOpenCodeProviderConfig(providerName: string): { baseURL?: string; apiKey?: string } | null {
  const fs = require("fs");
  const path = require("path");

  const candidates = [
    path.join(process.cwd(), ".opencode", "opencode.json"),
    path.join(process.cwd(), ".opencode", "opencode.jsonc"),
    path.join(process.env.HOME ?? "~", ".config", "opencode", "opencode.json"),
    path.join(process.env.HOME ?? "~", ".config", "opencode", "opencode.jsonc"),
  ];

  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      const raw = fs.readFileSync(candidate, "utf-8");
      const cleaned = candidate.endsWith(".jsonc")
        ? raw.replace(/(?<![:"\\])\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")
        : raw;
      const parsed = JSON.parse(cleaned);
      const provider = parsed?.provider?.[providerName];
      if (provider) {
        return {
          baseURL: provider.api || provider.baseURL,
          apiKey: provider.options?.apiKey || provider.apiKey,
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function createOpenAICompatibleModel(
  provider: string,
  model: string,
  apiKey?: string,
  baseURL?: string
): LanguageModelV3 {
  const { createOpenAI } = require("@ai-sdk/openai");

  let resolvedBaseURL = baseURL;
  let resolvedApiKey = apiKey;

  if (!resolvedBaseURL || !resolvedApiKey) {
    const opencodeConfig = loadOpenCodeProviderConfig(provider);
    if (opencodeConfig) {
      resolvedBaseURL = resolvedBaseURL ?? opencodeConfig.baseURL;
      resolvedApiKey = resolvedApiKey ?? opencodeConfig.apiKey;
    }
  }

  if (!resolvedBaseURL) {
    resolvedBaseURL = process.env[`${provider.toUpperCase()}_BASE_URL`]
      ?? process.env.LITELLM_BASE_URL;
  }
  if (!resolvedApiKey) {
    resolvedApiKey = process.env[`${provider.toUpperCase()}_API_KEY`]
      ?? process.env.LITELLM_API_KEY;
  }

  if (!resolvedBaseURL) {
    throw new Error(
      `Provider "${provider}" not found. Configure it in opencode.json, set ${provider.toUpperCase()}_BASE_URL env var, or use baseURL in panel config.`
    );
  }

  const openai = createOpenAI({
    apiKey: resolvedApiKey ?? "",
    baseURL: resolvedBaseURL,
  });
  return openai(model);
}
