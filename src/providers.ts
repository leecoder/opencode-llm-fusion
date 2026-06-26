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

function createOpenAICompatibleModel(
  provider: string,
  model: string,
  apiKey?: string,
  baseURL?: string
): LanguageModelV3 {
  const { createOpenAI } = require("@ai-sdk/openai");

  const providerBaseURLs: Record<string, string> = {
    litellm: process.env.LITELLM_BASE_URL ?? "",
    openrouter: "https://openrouter.ai/api/v1",
  };

  const resolvedBaseURL = baseURL ?? providerBaseURLs[provider];
  const resolvedApiKey = apiKey
    ?? process.env[`${provider.toUpperCase()}_API_KEY`]
    ?? process.env.LITELLM_API_KEY;

  if (!resolvedBaseURL) {
    throw new Error(
      `Unknown provider "${provider}". Set baseURL explicitly or use a known provider (openai, google, anthropic, litellm).`
    );
  }

  const openai = createOpenAI({
    apiKey: resolvedApiKey ?? "",
    baseURL: resolvedBaseURL,
  });
  return openai(model);
}
