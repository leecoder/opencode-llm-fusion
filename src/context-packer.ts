/**
 * Priority-based deterministic context packer.
 *
 * Priority order (highest to lowest):
 * 1. System/developer instructions + latest user message (HARD KEEP)
 * 2. Recent conversation tail + diffs/stack traces/errors (HIGH)
 * 3. Messages with code blocks and file references (MEDIUM)
 * 4. Older conversation history (LOW - trimmed first)
 */

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PackResult {
  messages: Message[];
  originalTokens: number;
  packedTokens: number;
  droppedCount: number;
}

// ~4 chars per token for English/code mix
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateMessagesTokens(messages: Message[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
}

const HIGH_PRIORITY_PATTERNS = [
  /^diff --git/m,
  /^@@\s/m,
  /^\+\+\+\s/m,
  /^---\s/m,
  /Error:/i,
  /error\[/i,
  /at\s+\S+\s+\(.+:\d+:\d+\)/,      // stack trace frame
  /TypeError|ReferenceError|SyntaxError/,
  /FAIL|FAILED/,
  /panic:|fatal:/i,
  /^\s*\d+\s*\|/m,                    // diagnostic line-numbered output
];

const MEDIUM_PRIORITY_PATTERNS = [
  /```[\s\S]*?```/,
  /\.(ts|js|py|go|rs|java|tsx|jsx|css|html)\b/,
  /import\s/,
  /function\s/,
  /class\s/,
  /interface\s/,
];

type Priority = "hard" | "high" | "medium" | "low";

interface ScoredMessage {
  message: Message;
  index: number;
  priority: Priority;
  tokens: number;
}

function scorePriority(msg: Message, index: number, totalMessages: number): Priority {
  if (msg.role === "system") return "hard";
  if (msg.role === "user" && index === totalMessages - 1) return "hard";
  if (msg.role === "user" && index === totalMessages - 2) return "hard";
  if (index >= totalMessages - 6) return "high";

  for (const pattern of HIGH_PRIORITY_PATTERNS) {
    if (pattern.test(msg.content)) return "high";
  }

  for (const pattern of MEDIUM_PRIORITY_PATTERNS) {
    if (pattern.test(msg.content)) return "medium";
  }

  return "low";
}

export function packContext(messages: Message[], maxTokens: number): PackResult {
  const originalTokens = estimateMessagesTokens(messages);

  if (originalTokens <= maxTokens) {
    return { messages, originalTokens, packedTokens: originalTokens, droppedCount: 0 };
  }

  const scored: ScoredMessage[] = messages.map((message, index) => ({
    message,
    index,
    priority: scorePriority(message, index, messages.length),
    tokens: estimateTokens(message.content) + 4,
  }));

  const hard = scored.filter((s) => s.priority === "hard");
  const high = scored.filter((s) => s.priority === "high");
  const medium = scored.filter((s) => s.priority === "medium");
  const low = scored.filter((s) => s.priority === "low");

  let budget = maxTokens;
  const kept: ScoredMessage[] = [];

  for (const s of hard) {
    kept.push(s);
    budget -= s.tokens;
  }

  if (budget < 0) {
    const sortedHard = [...kept].sort((a, b) => b.tokens - a.tokens);
    for (const s of sortedHard) {
      if (s.message.role === "system" && budget < 0) {
        const targetTokens = s.tokens + budget - 100;
        if (targetTokens > 200) {
          const targetChars = targetTokens * 4;
          s.message = { ...s.message, content: s.message.content.slice(0, targetChars) + "\n[... truncated ...]" };
          s.tokens = estimateTokens(s.message.content) + 4;
          budget = maxTokens - kept.reduce((sum, k) => sum + k.tokens, 0);
        }
      }
    }
  }

  for (const s of high) {
    if (budget >= s.tokens) {
      kept.push(s);
      budget -= s.tokens;
    } else if (budget > 200) {
      const targetChars = (budget - 100) * 4;
      if (targetChars > 200) {
        const truncated: ScoredMessage = {
          ...s,
          message: { ...s.message, content: s.message.content.slice(0, targetChars) + "\n[... truncated ...]" },
          tokens: budget - 50,
        };
        kept.push(truncated);
        budget -= truncated.tokens;
      }
      break;
    } else {
      break;
    }
  }

  for (const s of medium) {
    if (budget >= s.tokens) {
      kept.push(s);
      budget -= s.tokens;
    } else if (budget > 200) {
      const targetChars = (budget - 100) * 4;
      if (targetChars > 200) {
        const truncated: ScoredMessage = {
          ...s,
          message: { ...s.message, content: s.message.content.slice(0, targetChars) + "\n[... truncated ...]" },
          tokens: budget - 50,
        };
        kept.push(truncated);
        budget -= truncated.tokens;
      }
      break;
    } else {
      break;
    }
  }

  for (const s of low) {
    if (budget >= s.tokens) {
      kept.push(s);
      budget -= s.tokens;
    } else {
      break;
    }
  }

  kept.sort((a, b) => a.index - b.index);

  const packedMessages = kept.map((s) => s.message);

  const droppedCount = messages.length - packedMessages.length;
  if (droppedCount > 0) {
    const lastSystemIdx = packedMessages.findLastIndex((m) => m.role === "system");
    const insertIdx = lastSystemIdx + 1;
    packedMessages.splice(insertIdx, 0, {
      role: "user",
      content: `[Note: ${droppedCount} earlier messages were omitted to fit context window. The most recent and relevant messages are preserved below.]`,
    });
  }

  return {
    messages: packedMessages,
    originalTokens,
    packedTokens: estimateMessagesTokens(packedMessages),
    droppedCount,
  };
}

export function estimatePromptTokens(messages: Message[]): number {
  return estimateMessagesTokens(messages);
}
