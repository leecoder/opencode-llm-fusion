/**
 * Selective Panel Router
 *
 * Routes input to panels based on size vs each panel's context limit:
 * - input ≤ panelLimit: full context
 * - panelLimit < input ≤ skipThreshold: compacted context
 * - input > skipThreshold AND panelLimit < skipThreshold: skip panel
 */

import type { FusionConfig, PanelModel } from "./config.js";
import { packContext, estimatePromptTokens } from "./context-packer.js";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export type PanelContextMode = "full" | "compact" | "skip";

export interface PanelAssignment {
  panelModel: PanelModel;
  mode: PanelContextMode;
  messages: Message[];
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

export function routePanels(
  config: FusionConfig,
  messages: Message[]
): PanelAssignment[] {
  const inputTokens = estimatePromptTokens(messages);
  const defaultLimit = config.contextLimits.default;
  const skipThreshold = config.contextLimits.skipThreshold;

  const assignments: PanelAssignment[] = [];

  for (const panel of config.panel) {
    const panelLimit = getPanelMaxContext(panel, defaultLimit);

    if (inputTokens <= panelLimit) {
      assignments.push({ panelModel: panel, mode: "full", messages });
    } else if (inputTokens <= skipThreshold) {
      const packed = packContext(messages, panelLimit);
      assignments.push({ panelModel: panel, mode: "compact", messages: packed.messages });
    } else {
      if (panelLimit >= inputTokens) {
        assignments.push({ panelModel: panel, mode: "full", messages });
      } else if (panelLimit >= skipThreshold) {
        const packed = packContext(messages, panelLimit);
        assignments.push({ panelModel: panel, mode: "compact", messages: packed.messages });
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
    const packed = packContext(messages, largestLimit);
    assignments.length = 0;
    assignments.push({ panelModel: largest, mode: "compact", messages: packed.messages });
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
