import { z } from "zod";

export const SynthesisStrategySchema = z.enum([
  "single_judge",
  "majority_vote",
  "best_of_n",
]);

export type SynthesisStrategy = z.infer<typeof SynthesisStrategySchema>;

export const PanelModelSchema = z.union([
  z.string().describe("OpenCode provider/model reference, e.g. 'litellm/deepseek-3.2'"),
  z.object({
    model: z.string().describe("OpenCode provider/model reference or raw model ID"),
    weight: z.number().default(1),
    maxContext: z.number().optional().describe("Max context tokens this model supports. Used for selective routing."),
    supportsImages: z.boolean().optional().describe("Whether this model supports image input."),
    provider: z.string().optional(),
    apiKey: z.string().optional(),
    baseURL: z.string().optional(),
  }),
]);

export type PanelModel = z.infer<typeof PanelModelSchema>;

export const JudgeModelSchema = z.union([
  z.string().describe("OpenCode provider/model reference, e.g. 'litellm/glm-4.7-flash'"),
  z.object({
    provider: z.string(),
    model: z.string(),
    apiKey: z.string().optional(),
    baseURL: z.string().optional(),
  }),
]);

export type JudgeModel = z.infer<typeof JudgeModelSchema>;

export const RoutingPolicySchema = z.object({
  mode: z.enum(["always", "manual", "auto"]).default("always"),
  complexityThreshold: z.number().min(0).max(1).default(0.7),
});

export type RoutingPolicy = z.infer<typeof RoutingPolicySchema>;

export const ContextLimitsSchema = z.object({
  default: z.number().default(128000).describe("Default context limit for panels without explicit maxContext"),
  skipThreshold: z.number().default(256000).describe("Input token count above which short-context panels are skipped entirely"),
});

export type ContextLimits = z.infer<typeof ContextLimitsSchema>;

export const FusionConfigSchema = z.object({
  panel: z.array(PanelModelSchema).min(2),
  judge: JudgeModelSchema,
  strategy: SynthesisStrategySchema.default("single_judge"),
  routing: RoutingPolicySchema.default({}),
  timeout: z.number().default(120000),
  judgeSystemPrompt: z.string().optional(),
  contextLimits: ContextLimitsSchema.default({}),
});

export type FusionConfig = z.infer<typeof FusionConfigSchema>;

export const DEFAULT_JUDGE_SYSTEM_PROMPT = `You are a synthesis judge. You receive multiple responses to the same prompt from different AI models.

Your task:
1. Identify points of agreement across responses.
2. Identify contradictions or disagreements.
3. Identify unique insights that only one model provided.
4. Synthesize the best possible answer by combining strengths and resolving conflicts.

Rules:
- Prefer factual accuracy over fluency.
- When models disagree on facts, note the disagreement and provide the most likely correct answer with reasoning.
- Preserve code exactly when models agree on implementation. When they differ, pick the most correct/idiomatic version and explain why.
- Do NOT mention that you are synthesizing multiple responses. Respond as if you are the sole author.
- Match the format and style appropriate for the original question.`;
