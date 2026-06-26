import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3StreamPart,
} from "@ai-sdk/provider";
import { generateText, streamText } from "ai";
import type { FusionConfig, PanelModel, JudgeModel, SynthesisStrategy } from "./config.js";
import { DEFAULT_JUDGE_SYSTEM_PROMPT } from "./config.js";
import { createProviderModel } from "./providers.js";
import { routePanels, getRoutingSummary, type PanelAssignment, type PanelContextMode } from "./panel-router.js";
import type { MultimodalMessage, ContentPart } from "./types.js";

export interface FusionUsage {
  panelTokens: { model: string; promptTokens: number; completionTokens: number }[];
  judgeTokens: { promptTokens: number; completionTokens: number };
  totalPromptTokens: number;
  totalCompletionTokens: number;
}

interface PanelResponse {
  model: string;
  text: string;
  usage: { promptTokens: number; completionTokens: number };
  finishReason: string;
  contextMode: PanelContextMode;
}

export function createFusionLanguageModel(config: FusionConfig): LanguageModelV3 {
  const modelId = `fusion-${config.panel.length}-panel`;

  return {
    specificationVersion: "v3" as const,
    provider: "fusion",
    modelId,
    defaultObjectGenerationMode: "json",

    async doGenerate(options: LanguageModelV3CallOptions) {
      const panelResponses = await queryPanel(config, options);
      const synthesisResult = await synthesize(config, panelResponses, options);

      const usage = {
        inputTokens: { total: synthesisResult.usage.totalPromptTokens, noCache: undefined, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: synthesisResult.usage.totalCompletionTokens, text: synthesisResult.usage.totalCompletionTokens, reasoning: undefined },
      };

      return {
        content: [{ type: "text" as const, text: synthesisResult.text }],
        finishReason: "stop" as const,
        usage,
        warnings: [],
        request: { body: { fusionConfig: config } },
        response: { headers: {} },
        providerMetadata: {
          fusion: {
            panelResponses: panelResponses.map((r) => ({
              model: r.model,
              text: r.text,
              contextMode: r.contextMode,
            })),
            strategy: config.strategy,
          },
        },
      };
    },

    async doStream(options: LanguageModelV3CallOptions) {
      const panelResponses = await queryPanel(config, options);
      const synthesisResult = await synthesize(config, panelResponses, options);

      const text = synthesisResult.text;
      const textId = `text-${Date.now()}`;
      const chunkSize = 50;
      const chunks: any[] = [];

      chunks.push({ type: "stream-start", warnings: [] });
      chunks.push({ type: "text-start", id: textId });

      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push({
          type: "text-delta",
          id: textId,
          delta: text.slice(i, i + chunkSize),
        });
      }

      chunks.push({ type: "text-end", id: textId });

      chunks.push({
        type: "finish",
        finishReason: "stop",
        usage: {
          inputTokens: { total: synthesisResult.usage.totalPromptTokens, noCache: undefined, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: synthesisResult.usage.totalCompletionTokens, text: synthesisResult.usage.totalCompletionTokens, reasoning: undefined },
        },
      });

      let index = 0;
      const stream = new ReadableStream({
        pull(controller) {
          if (index < chunks.length) {
            controller.enqueue(chunks[index]!);
            index++;
          } else {
            controller.close();
          }
        },
      });

      return {
        stream,
        request: { body: { fusionConfig: config } },
        response: { headers: {} },
      };
    },
  };
}

function getModelLabel(panelModel: PanelModel): string {
  if (typeof panelModel === "string") return panelModel;
  return panelModel.model;
}

const PANEL_SYSTEM_PREFIX = `You are one of several AI models answering the same question in parallel. Your response will be compared with others by a judge.

Rules:
- Answer the user's question directly and concisely.
- Do NOT ask the user for more context, clarification, or prior state.
- Do NOT roleplay as a specific assistant or agent.
- Do NOT mention that you lack context from previous sessions.
- If the question is a simple greeting, respond with a simple greeting.
- Focus on providing the best possible answer to what was asked.

---
`;

const REPETITION_MIN_LENGTH = 800;
// Keep repetition checks bounded to reduce per-chunk CPU while still catching loops quickly.
const REPETITION_WINDOW_CHARS = 3072;

function detectRepetition(text: string): boolean {
  if (text.length < 400) return false;
  const lastChunk = text.slice(-200);
  const earlier = text.slice(0, -200);
  if (earlier.includes(lastChunk)) return true;

  const sentences = text.split(/[.!?\n]+/).filter((s) => s.trim().length > 20);
  if (sentences.length < 6) return false;
  const lastThree = sentences.slice(-3).map((s) => s.trim());
  const rest = sentences.slice(0, -3).map((s) => s.trim());
  const repeated = lastThree.filter((s) => rest.includes(s));
  return repeated.length >= 2;
}

async function streamPanelWithCutoff(
  model: any,
  systemText: string,
  messages: any[],
  abortSignal: AbortSignal | undefined,
  maxTokens: number,
): Promise<{ text: string; usage: { promptTokens: number; completionTokens: number }; finishReason: string }> {
  const controller = new AbortController();
  const combinedSignal = abortSignal
    ? AbortSignal.any([abortSignal, controller.signal])
    : controller.signal;

  const panelSystem = PANEL_SYSTEM_PREFIX + systemText;

  const stream = streamText({
    model,
    ...(panelSystem && { system: panelSystem }),
    messages,
    abortSignal: combinedSignal,
    maxTokens,
  });

  const chunks: string[] = [];
  let rollingWindow = "";
  let totalLength = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let finishReason = "stop";

  try {
    for await (const chunk of stream.textStream) {
      chunks.push(chunk);
      totalLength += chunk.length;

      rollingWindow += chunk;
      if (rollingWindow.length > REPETITION_WINDOW_CHARS) {
        rollingWindow = rollingWindow.slice(-REPETITION_WINDOW_CHARS);
      }

      if (totalLength > REPETITION_MIN_LENGTH && detectRepetition(rollingWindow)) {
        controller.abort();
        finishReason = "repetition-cutoff";
        break;
      }
    }

    const usage = await stream.usage;
    inputTokens = usage?.inputTokens ?? 0;
    outputTokens = usage?.outputTokens ?? 0;
    if (finishReason === "stop") {
      finishReason = (await stream.finishReason) ?? "stop";
    }
  } catch (e: any) {
    if (e?.name === "AbortError" && finishReason === "repetition-cutoff") {
    } else if (e?.name === "AbortError") {
      finishReason = "aborted";
    } else {
      throw e;
    }
  }

  const fullText = chunks.join("");
  return { text: fullText, usage: { promptTokens: inputTokens, completionTokens: outputTokens }, finishReason };
}

async function queryPanel(
  config: FusionConfig,
  options: LanguageModelV3CallOptions
): Promise<PanelResponse[]> {
  const timeout = config.timeout;
  const allMessages = convertPromptToMessages(options.prompt);
  const assignments = routePanels(config, allMessages);

  const activeAssignments = assignments.filter((a) => a.mode !== "skip");

  if (activeAssignments.length === 0) {
    throw new Error("[opencode-llm-fusion] All panels were skipped. Input too large for any configured panel model.");
  }

  const timeoutController = new AbortController();
  const panelAbortSignal = options.abortSignal
    ? AbortSignal.any([options.abortSignal, timeoutController.signal])
    : timeoutController.signal;
  const timeoutMessage = `Fusion panel timeout after ${timeout}ms`;

  const panelPromises = activeAssignments.map(async (assignment): Promise<PanelResponse> => {
    const model = createProviderModel(assignment.panelModel);
    const promptMessages = assignment.messages;

    try {
      const systemTextParts: string[] = [];
      const aiMessages: { role: "user" | "assistant"; content: any }[] = [];
      for (const message of promptMessages) {
        if (message.role === "system") {
          if (typeof message.content === "string" && message.content) {
            systemTextParts.push(message.content);
          }
          continue;
        }
        aiMessages.push({
          role: message.role as "user" | "assistant",
          content: message.content,
        });
      }
      const systemText = systemTextParts.join("\n");

      const result = await streamPanelWithCutoff(
        model,
        systemText,
        aiMessages as any,
        panelAbortSignal,
        options.maxOutputTokens ?? 16384,
      );

      return {
        model: getModelLabel(assignment.panelModel),
        text: result.text,
        usage: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
        },
        finishReason: result.finishReason,
        contextMode: assignment.mode,
      };
    } catch (error) {
      return {
        model: getModelLabel(assignment.panelModel),
        text: `[ERROR: Model failed - ${error instanceof Error ? error.message : "unknown error"}]`,
        usage: { promptTokens: 0, completionTokens: 0 },
        finishReason: "error",
        contextMode: assignment.mode,
      };
    }
  });

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      timeoutController.abort();
      reject(new Error(timeoutMessage));
    }, timeout);
  });

  let results: PanelResponse[];
  try {
    results = await Promise.race([Promise.all(panelPromises), timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutController.abort();
  }

  return results.filter((r) => r.finishReason !== "error" || results.length <= 2);
}

async function synthesize(
  config: FusionConfig,
  panelResponses: PanelResponse[],
  _options: LanguageModelV3CallOptions
): Promise<{ text: string; usage: FusionUsage }> {
  const strategy = config.strategy;

  if (panelResponses.length === 1) {
    return {
      text: panelResponses[0]!.text,
      usage: {
        panelTokens: panelResponses.map((r) => ({
          model: r.model,
          ...r.usage,
        })),
        judgeTokens: { promptTokens: 0, completionTokens: 0 },
        totalPromptTokens: panelResponses[0]!.usage.promptTokens,
        totalCompletionTokens: panelResponses[0]!.usage.completionTokens,
      },
    };
  }

  switch (strategy) {
    case "majority_vote":
      return majorityVote(config, panelResponses);
    case "best_of_n":
      return bestOfN(config, panelResponses);
    case "single_judge":
    default:
      return singleJudge(config, panelResponses);
  }
}

function buildContextCoverageNote(panelResponses: PanelResponse[]): string {
  const hasCompact = panelResponses.some((r) => r.contextMode === "compact");
  if (!hasCompact) return "";

  const lines = [
    "\n\nIMPORTANT - Context Coverage:",
    "Not all models received identical context. When models disagree on specifics, prefer responses from models that received FULL context:",
  ];
  for (const r of panelResponses) {
    if (r.contextMode === "full") {
      lines.push(`  - ${r.model}: FULL context (more reliable for specific details)`);
    } else {
      lines.push(`  - ${r.model}: COMPACTED context (may miss details from older messages)`);
    }
  }
  return lines.join("\n");
}

async function singleJudge(
  config: FusionConfig,
  panelResponses: PanelResponse[]
): Promise<{ text: string; usage: FusionUsage }> {
  const judgeModel = createProviderModel(config.judge);
  const baseSystemPrompt = config.judgeSystemPrompt ?? DEFAULT_JUDGE_SYSTEM_PROMPT;
  const coverageNote = buildContextCoverageNote(panelResponses);
  const systemPrompt = baseSystemPrompt + coverageNote;

  const responsesBlock = panelResponses
    .map((r, i) => `--- Response ${i + 1} (${r.model}) ---\n${r.text}`)
    .join("\n\n");

  const result = await generateText({
    model: judgeModel,
    system: systemPrompt,
    prompt: `Here are ${panelResponses.length} responses to synthesize:\n\n${responsesBlock}`,
    maxTokens: 16384,
  });

  const panelTokens = panelResponses.map((r) => ({
    model: r.model,
    ...r.usage,
  }));

  const judgeTokens = {
    promptTokens: result.usage.inputTokens ?? 0,
    completionTokens: result.usage.outputTokens ?? 0,
  };

  return {
    text: result.text,
    usage: {
      panelTokens,
      judgeTokens,
      totalPromptTokens:
        panelTokens.reduce((s, t) => s + t.promptTokens, 0) + judgeTokens.promptTokens,
      totalCompletionTokens:
        panelTokens.reduce((s, t) => s + t.completionTokens, 0) + judgeTokens.completionTokens,
    },
  };
}

async function majorityVote(
  config: FusionConfig,
  panelResponses: PanelResponse[]
): Promise<{ text: string; usage: FusionUsage }> {
  const judgeModel = createProviderModel(config.judge);
  const coverageNote = buildContextCoverageNote(panelResponses);

  const responsesBlock = panelResponses
    .map((r, i) => `--- Response ${i + 1} (${r.model}) ---\n${r.text}`)
    .join("\n\n");

  const result = await generateText({
    model: judgeModel,
    system: `You are a voting judge. You receive multiple responses to the same prompt.
Pick the BEST response. Output ONLY the number of the best response (e.g. "1", "2", "3").
Consider: correctness, completeness, clarity, and relevance.${coverageNote}`,
    prompt: `Which response is best?\n\n${responsesBlock}`,
    maxTokens: 64,
  });

  const voteText = result.text.trim();
  const voteIndex = parseInt(voteText, 10) - 1;
  const selected =
    voteIndex >= 0 && voteIndex < panelResponses.length
      ? panelResponses[voteIndex]!
      : panelResponses[0]!;

  const panelTokens = panelResponses.map((r) => ({
    model: r.model,
    ...r.usage,
  }));

  const judgeTokens = {
    promptTokens: result.usage.inputTokens ?? 0,
    completionTokens: result.usage.outputTokens ?? 0,
  };

  return {
    text: selected.text,
    usage: {
      panelTokens,
      judgeTokens,
      totalPromptTokens:
        panelTokens.reduce((s, t) => s + t.promptTokens, 0) + judgeTokens.promptTokens,
      totalCompletionTokens:
        panelTokens.reduce((s, t) => s + t.completionTokens, 0) + judgeTokens.completionTokens,
    },
  };
}

async function bestOfN(
  config: FusionConfig,
  panelResponses: PanelResponse[]
): Promise<{ text: string; usage: FusionUsage }> {
  const judgeModel = createProviderModel(config.judge);
  const coverageNote = buildContextCoverageNote(panelResponses);

  const responsesBlock = panelResponses
    .map((r, i) => `--- Response ${i + 1} (${r.model}) ---\n${r.text}`)
    .join("\n\n");

  const result = await generateText({
    model: judgeModel,
    system: `You are a scoring judge. You receive multiple responses to the same prompt.
Score each response from 1-10 on: correctness, completeness, clarity.
Output ONLY a JSON array of scores, e.g. [8, 7, 9]. One score per response, in order.${coverageNote}`,
    prompt: `Score these responses:\n\n${responsesBlock}`,
    maxTokens: 128,
  });

  let scores: number[];
  try {
    scores = JSON.parse(result.text.trim());
  } catch {
    scores = panelResponses.map(() => 5);
  }

  const weightedScores = scores.map((score, i) => {
    const panel = config.panel[i];
    const weight = (typeof panel !== "string" && panel?.weight) ? panel.weight : 1;
    const contextBoost = panelResponses[i]?.contextMode === "full" ? 1.1 : 1.0;
    return score * weight * contextBoost;
  });

  const bestIndex = weightedScores.indexOf(Math.max(...weightedScores));
  const selected = panelResponses[bestIndex] ?? panelResponses[0]!;

  const panelTokens = panelResponses.map((r) => ({
    model: r.model,
    ...r.usage,
  }));

  const judgeTokens = {
    promptTokens: result.usage.inputTokens ?? 0,
    completionTokens: result.usage.outputTokens ?? 0,
  };

  return {
    text: selected.text,
    usage: {
      panelTokens,
      judgeTokens,
      totalPromptTokens:
        panelTokens.reduce((s, t) => s + t.promptTokens, 0) + judgeTokens.promptTokens,
      totalCompletionTokens:
        panelTokens.reduce((s, t) => s + t.completionTokens, 0) + judgeTokens.completionTokens,
    },
  };
}

function convertPromptToMessages(
  prompt: LanguageModelV3CallOptions["prompt"]
): MultimodalMessage[] {
  if (!prompt || !Array.isArray(prompt) || prompt.length === 0) {
    return [{ role: "user", content: "hello" }];
  }

  const messages: MultimodalMessage[] = [];

  for (const msg of prompt) {
    if (msg.role === "system") {
      const text = typeof msg.content === "string" ? msg.content : "";
      if (text) messages.push({ role: "system", content: text });
    } else if (msg.role === "user") {
      if (typeof msg.content === "string") {
        messages.push({ role: "user", content: msg.content });
      } else if (Array.isArray(msg.content)) {
        const parts: ContentPart[] = [];
        for (const part of msg.content) {
          if ((part as any).type === "text") {
            parts.push({ type: "text", text: (part as any).text });
          } else if ((part as any).type === "image") {
            parts.push({
              type: "image",
              image: (part as any).image ?? (part as any).url ?? (part as any).data,
              mimeType: (part as any).mimeType,
            });
          }
        }
        if (parts.length > 0) {
          messages.push({ role: "user", content: parts });
        }
      }
    } else if (msg.role === "assistant") {
      if (typeof msg.content === "string") {
        messages.push({ role: "assistant", content: msg.content });
      } else if (Array.isArray(msg.content)) {
        const textParts = msg.content
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text);
        if (textParts.length > 0) {
          messages.push({ role: "assistant", content: textParts.join("\n") });
        }
      }
    }
  }

  if (messages.length === 0 || messages.every((m) => m.role === "system")) {
    messages.push({ role: "user", content: "hello" });
  }

  return messages;
}
