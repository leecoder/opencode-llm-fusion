import type { RoutingPolicy } from "./config.js";

interface PromptMessage {
  role: string;
  content: any;
}

export function shouldUseFusion(
  policy: RoutingPolicy,
  prompt: PromptMessage[]
): boolean {
  switch (policy.mode) {
    case "always":
      return true;
    case "manual":
      return true;
    case "auto":
      return estimateComplexity(prompt) >= policy.complexityThreshold;
  }
}

function estimateComplexity(prompt: PromptMessage[]): number {
  let score = 0;

  const fullText = extractText(prompt);
  const length = fullText.length;

  if (length > 2000) score += 0.2;
  if (length > 5000) score += 0.2;
  if (length > 10000) score += 0.1;

  const codeIndicators = [
    /```/g,
    /function\s/g,
    /class\s/g,
    /import\s/g,
    /interface\s/g,
    /async\s/g,
  ];
  const codeMatches = codeIndicators.reduce(
    (count, pattern) => count + (fullText.match(pattern)?.length ?? 0),
    0
  );
  if (codeMatches > 3) score += 0.15;
  if (codeMatches > 10) score += 0.1;

  const complexityKeywords = [
    "architect", "design", "refactor", "optimize", "security",
    "performance", "scalab", "trade-off", "compare", "evaluate",
    "implement", "migration", "integration",
  ];
  const keywordMatches = complexityKeywords.filter((kw) =>
    fullText.toLowerCase().includes(kw)
  ).length;
  if (keywordMatches >= 2) score += 0.15;
  if (keywordMatches >= 4) score += 0.1;

  const messageCount = prompt.length;
  if (messageCount > 10) score += 0.1;

  return Math.min(score, 1.0);
}

function extractText(prompt: PromptMessage[]): string {
  const parts: string[] = [];

  for (const msg of prompt) {
    if (typeof msg.content === "string") {
      parts.push(msg.content);
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "text" && typeof part.text === "string") {
          parts.push(part.text);
        }
      }
    }
  }

  return parts.join("\n");
}
