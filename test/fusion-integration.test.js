import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

// We can't easily mock the AI SDK's generateText at module level with node:test,
// so we test the integration points we can control:
// - convertPromptToMessages (via exported routePanels behavior)
// - routing + packing pipeline
// - judge context coverage note construction

import { routePanels, hasImages, packContext, estimatePromptTokens } from "../dist/index.js";

describe("fusion-model integration", () => {
  describe("multimodal message handling", () => {
    it("routes multimodal messages correctly through the pipeline", () => {
      const config = {
        panel: [
          { model: "litellm/deepseek-3.2", maxContext: 128000 },
          { model: "litellm/kimi-2.5", maxContext: 1048576 },
        ],
        judge: "litellm/glm-4.7-flash",
        strategy: "single_judge",
        routing: { mode: "always", complexityThreshold: 0.7 },
        timeout: 90000,
        contextLimits: { default: 128000, skipThreshold: 256000 },
      };

      const msgs = [
        { role: "system", content: "You analyze images." },
        { role: "user", content: [
          { type: "text", text: "What is in this screenshot?" },
          { type: "image", image: "base64encodeddata", mimeType: "image/png" },
        ]},
      ];

      const assignments = routePanels(config, msgs);
      assert.equal(assignments.length, 2);

      // deepseek: text-only, images stripped
      const ds = assignments.find((a) => a.panelModel.model === "litellm/deepseek-3.2");
      assert.equal(ds.mode, "full");
      assert.equal(hasImages(ds.messages), false);

      // kimi: supports images
      const kimi = assignments.find((a) => a.panelModel.model === "litellm/kimi-2.5");
      assert.equal(kimi.mode, "full");
      assert.equal(hasImages(kimi.messages), true);
    });
  });

  describe("context compaction + routing pipeline", () => {
    it("compacts large input for short-context panels while preserving full for long-context", () => {
      const config = {
        panel: [
          { model: "litellm/deepseek-3.2", maxContext: 128000 },
          { model: "litellm/kimi-2.5", maxContext: 1048576 },
        ],
        judge: "litellm/glm-4.7-flash",
        strategy: "single_judge",
        routing: { mode: "always", complexityThreshold: 0.7 },
        timeout: 90000,
        contextLimits: { default: 128000, skipThreshold: 256000 },
      };

      // ~150K tokens - many messages so compaction has something to drop
      const msgs = [
        { role: "system", content: "sys" },
        ...Array.from({ length: 40 }, (_, i) => ({
          role: i % 2 === 0 ? "user" : "assistant",
          content: "msg " + i + " " + "x".repeat(14000),
        })),
        { role: "user", content: "latest question" },
      ];

      const assignments = routePanels(config, msgs);
      const ds = assignments.find((a) => a.panelModel.model === "litellm/deepseek-3.2");
      const kimi = assignments.find((a) => a.panelModel.model === "litellm/kimi-2.5");

      assert.equal(ds.mode, "compact");
      assert.equal(kimi.mode, "full");

      // Compact should have fewer messages
      assert.ok(ds.messages.length < kimi.messages.length);
      assert.ok(estimatePromptTokens(ds.messages) <= 128000);
    });

    it("skips short-context panels for very large input", () => {
      const config = {
        panel: [
          { model: "litellm/deepseek-3.2", maxContext: 128000 },
          { model: "litellm/glm-5", maxContext: 128000 },
          { model: "litellm/kimi-2.5", maxContext: 1048576 },
        ],
        judge: "litellm/glm-4.7-flash",
        strategy: "single_judge",
        routing: { mode: "always", complexityThreshold: 0.7 },
        timeout: 90000,
        contextLimits: { default: 128000, skipThreshold: 256000 },
      };

      // ~400K tokens - above skipThreshold
      const msgs = [
        { role: "system", content: "sys" },
        { role: "user", content: "y".repeat(1600000) },
      ];

      const assignments = routePanels(config, msgs);
      const active = assignments.filter((a) => a.mode !== "skip");
      const skipped = assignments.filter((a) => a.mode === "skip");

      assert.equal(active.length, 1);
      assert.equal(skipped.length, 2);
      assert.ok(active[0].panelModel.model.includes("kimi"));
    });
  });

  describe("priority packer preserves critical content", () => {
    it("preserves error messages and latest user message under tight budget", () => {
      const msgs = [
        { role: "system", content: "You are a coder." },
        { role: "user", content: "old stuff " + "a".repeat(2000) },
        { role: "assistant", content: "old response " + "b".repeat(2000) },
        { role: "user", content: "TypeError: foo is not a function\nat bar (src/x.ts:10:5)" },
        { role: "assistant", content: "Let me check..." },
        { role: "user", content: "more old " + "c".repeat(2000) },
        { role: "assistant", content: "more old " + "d".repeat(2000) },
        { role: "user", content: "please fix the TypeError" },
      ];

      const result = packContext(msgs, 500);
      const contents = result.messages.map((m) => m.content).join(" ");

      assert.ok(contents.includes("TypeError"), "should preserve error");
      assert.ok(contents.includes("please fix"), "should preserve latest user msg");
      assert.ok(contents.includes("You are a coder"), "should preserve system");
    });
  });
});
