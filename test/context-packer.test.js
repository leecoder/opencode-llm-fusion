import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { packContext, estimatePromptTokens } from "../dist/index.js";

describe("estimatePromptTokens", () => {
  it("estimates based on ~4 chars per token", () => {
    const msgs = [{ role: "user", content: "a".repeat(400) }];
    const tokens = estimatePromptTokens(msgs);
    assert.ok(tokens >= 100 && tokens <= 110);
  });

  it("accounts for message overhead", () => {
    const msgs = [
      { role: "system", content: "hi" },
      { role: "user", content: "hello" },
    ];
    const tokens = estimatePromptTokens(msgs);
    assert.ok(tokens > 0);
  });
});

describe("packContext", () => {
  it("returns original messages when within budget", () => {
    const msgs = [
      { role: "system", content: "sys" },
      { role: "user", content: "hello" },
    ];
    const result = packContext(msgs, 10000);
    assert.equal(result.droppedCount, 0);
    assert.deepEqual(result.messages, msgs);
  });

  it("always preserves system messages", () => {
    const msgs = [
      { role: "system", content: "important system prompt " + "x".repeat(200) },
      { role: "user", content: "old message " + "y".repeat(500) },
      { role: "assistant", content: "old answer " + "y".repeat(500) },
      { role: "user", content: "old message 2 " + "y".repeat(500) },
      { role: "assistant", content: "old answer 2 " + "y".repeat(500) },
      { role: "user", content: "latest question" },
    ];
    const result = packContext(msgs, 200);
    const roles = result.messages.map((m) => m.role);
    assert.ok(roles.includes("system"));
  });

  it("always preserves latest user message", () => {
    const msgs = [
      { role: "system", content: "sys" },
      { role: "user", content: "old " + "x".repeat(1000) },
      { role: "assistant", content: "old ans " + "x".repeat(1000) },
      { role: "user", content: "latest question here" },
    ];
    const result = packContext(msgs, 100);
    const lastUserMsg = result.messages.filter((m) => m.role === "user" && !m.content.startsWith("[Note:"));
    assert.ok(lastUserMsg.some((m) => m.content.includes("latest question")));
  });

  it("preserves messages with diffs as high priority", () => {
    const msgs = [
      { role: "system", content: "sys" },
      { role: "user", content: "old unrelated " + "z".repeat(800) },
      { role: "assistant", content: "old response " + "z".repeat(800) },
      { role: "user", content: "diff --git a/foo.ts b/foo.ts\n@@ -1,3 +1,4 @@\n+new line" },
      { role: "assistant", content: "noted the diff" },
      { role: "user", content: "old chat " + "z".repeat(800) },
      { role: "assistant", content: "old response " + "z".repeat(800) },
      { role: "user", content: "fix it" },
    ];
    const result = packContext(msgs, 500);
    const hasDiff = result.messages.some((m) => m.content.includes("diff --git"));
    assert.ok(hasDiff, "diff message should be preserved as high priority");
  });

  it("preserves messages with stack traces as high priority", () => {
    const msgs = [
      { role: "system", content: "sys" },
      { role: "user", content: "old " + "z".repeat(400) },
      { role: "assistant", content: "old " + "z".repeat(400) },
      { role: "user", content: "TypeError: Cannot read property\nat handler (src/api.ts:42:10)" },
      { role: "user", content: "old " + "z".repeat(400) },
      { role: "assistant", content: "old " + "z".repeat(400) },
      { role: "user", content: "help" },
    ];
    const result = packContext(msgs, 600);
    const hasTrace = result.messages.some((m) => m.content.includes("TypeError"));
    assert.ok(hasTrace, "stack trace message should be preserved");
  });

  it("inserts drop notice when messages are omitted", () => {
    const msgs = [
      { role: "system", content: "sys" },
      ...Array.from({ length: 20 }, (_, i) => ({ role: i % 2 === 0 ? "user" : "assistant", content: "msg " + i + " " + "x".repeat(200) })),
      { role: "user", content: "latest" },
    ];
    const result = packContext(msgs, 300);
    assert.ok(result.droppedCount > 0);
    const notice = result.messages.find((m) => m.content.includes("[Note:"));
    assert.ok(notice, "should have a drop notice");
  });

  it("truncates large system message when hard keeps exceed budget", () => {
    const msgs = [
      { role: "system", content: "s".repeat(5000) },
      { role: "user", content: "question" },
    ];
    const result = packContext(msgs, 500);
    const sys = result.messages.find((m) => m.role === "system");
    assert.ok(sys);
    assert.ok(sys.content.includes("[... truncated ...]"));
    assert.ok(sys.content.length < 5000);
  });
});
