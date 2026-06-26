/**
 * Selective Panel Router
 *
 * Routes input to panels based on size vs each panel's context limit:
 * - input ≤ panelLimit: full context
 * - panelLimit < input ≤ skipThreshold: compacted context
 * - input > skipThreshold AND panelLimit < skipThreshold: skip panel
 *
 * Also skips text-only panels when input contains images.
 */

import type { FusionConfig, PanelModel } from "./config.js";
import { packContext, estimatePromptTokens } from "./context-packer.js";
import type { MultimodalMessage } from "./types.js";

export type PanelContextMode = "full" | "compact" | "skip";

export interface PanelAssignment {
  panelModel: PanelModel;
  mode: PanelContextMode;
  messages: MultimodalMessage[];
  textOnlyMessages?: MultimodalMessage[];
}

const KNOWN_CONTEXT_LIMITS: Record<string, number> = {
  "kimi-2.5": 1048576,
  "qwen3-coder-next": 1048576,
  "qwen.qwen3-coder-next": 1048576,
  "deepseek-3.2": 128000,
  "glm-5": 128000,
  "glm-4.7": 128000,
  "glm-4.7-flash": 128000,
  "qwen-3": 128000,
  "sonnet-4.5": 200000,
  "sonnet-4.6": 200000,
  "opus-4.5": 200000,
  "opus-4.6": 200000,
  "opus-4.7": 200000,
  "opus-4.8": 200000,
};

const KNOWN_IMAGE_SUPPORT: Record<string, boolean> = {
  "kimi-2.5": true,
  "glm-5": true,
  "glm-4.7": true,
  "glm-4.7-flash": true,
  "qwen-3": true,
  "qwen.qwen3-vl-235b-a22b": true,
  "sonnet-4.5": true,
  "sonnet-4.6": true,
  "opus-4.5": true,
  "opus-4.6": true,
  "opus-4.7": true,
  "opus-4.8": true,
  "deepseek-3.2": false,
  "qwen3-coder-next": false,
  "qwen.qwen3-coder-next": false,
};

function getModelId(panel: PanelModel): string {
  if (typeof panel === "string") {
    const parts = panel.split("/");
    return parts[parts.length - 1]!;
  }
  const parts = panel.model.split("/");
  return parts[parts.length - 1]!;
}

function getPanelMaxContext(panel: PanelModel, defaultLimit: number): number {
  if (typeof panel !== "string" && panel.maxContext) {
    return panel.maxContext;
  }

  const modelId = getModelId(panel);
  if (KNOWN_CONTEXT_LIMITS[modelId]) {
    return KNOWN_CONTEXT_LIMITS[modelId]!;
  }

  return defaultLimit;
}

function panelSupportsImages(panel: PanelModel): boolean {
  if (typeof panel !== "string" && panel.supportsImages !== undefined) {
    return panel.supportsImages;
  }
  const modelId = getModelId(panel);
  return KNOWN_IMAGE_SUPPORT[modelId] ?? false;
}

export function hasImages(messages: MultimodalMessage[]): boolean {
  return messages.some((m) =>
    Array.isArray(m.content) && m.content.some((p) => p.type === "image")
  );
}

function stripImages(messages: MultimodalMessage[]): MultimodalMessage[] {
  return messages.map((m) => {
    if (!Array.isArray(m.content)) return m;
    const textParts = m.content.filter((p) => p.type === "text");
    if (textParts.length === 0) return { ...m, content: [{ type: "text" as const, text: "[image omitted - model does not support images]" }] };
    return { ...m, content: textParts };
  });
}

export function routePanels(
  config: FusionConfig,
  messages: MultimodalMessage[]
): PanelAssignment[] {
  const textMessages = messages.map((m) => ({
    role: m.role,
    content: Array.isArray(m.content)
      ? m.content.filter((p) => p.type === "text").map((p) => (p as any).text).join("\n")
      : m.content,
  }));
  const inputTokens = estimatePromptTokens(textMessages);
  const defaultLimit = config.contextLimits.default;
  const skipThreshold = config.contextLimits.skipThreshold;
  const inputHasImages = hasImages(messages);

  const assignments: PanelAssignment[] = [];

  for (const panel of config.panel) {
    const panelLimit = getPanelMaxContext(panel, defaultLimit);
    const supportsImg = panelSupportsImages(panel);

    const panelMessages = (inputHasImages && !supportsImg)
      ? stripImages(messages)
      : messages;

    if (inputTokens <= panelLimit) {
      assignments.push({ panelModel: panel, mode: "full", messages: panelMessages });
    } else if (inputTokens <= skipThreshold) {
      const packed = packContext(textMessages, panelLimit);
      assignments.push({ panelModel: panel, mode: "compact", messages: packed.messages as MultimodalMessage[] });
    } else {
      if (panelLimit >= inputTokens) {
        assignments.push({ panelModel: panel, mode: "full", messages: panelMessages });
      } else if (panelLimit >= skipThreshold) {
        const packed = packContext(textMessages, panelLimit);
        assignments.push({ panelModel: panel, mode: "compact", messages: packed.messages as MultimodalMessage[] });
      } else {
        assignments.push({ panelModel: panel, mode: "skip", messages: [] });
      }
    }
  }

  const active = assignments.filter((a) => a.mode !== "skip");
  if (active.length === 0) {
    const largest = [...config.panel].sort((a, b) =>
      getPanelMaxContext(b, defaultLimit) - getPanelMaxContext(a, defaultLimit)
    )[0]!;
    const largestLimit = getPanelMaxContext(largest, defaultLimit);
    const packed = packContext(textMessages, largestLimit);
    assignments.length = 0;
    assignments.push({ panelModel: largest, mode: "compact", messages: packed.messages as MultimodalMessage[] });
    for (const panel of config.panel) {
      if (panel !== largest) {
        assignments.push({ panelModel: panel, mode: "skip", messages: [] });
      }
    }
  }

  return assignments;
}

export function getRoutingSummary(assignments: PanelAssignment[]): string {
  const lines: string[] = [];
  for (const a of assignments) {
    const modelId = getModelId(a.panelModel);
    switch (a.mode) {
      case "full":
        lines.push(`- ${modelId}: received FULL context`);
        break;
      case "compact":
        lines.push(`- ${modelId}: received COMPACTED context (some older messages omitted)`);
        break;
      case "skip":
        lines.push(`- ${modelId}: SKIPPED (context too large for model's window)`);
        break;
    }
  }
  return lines.join("\n");
}
