import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { routePanels, hasImages } from "../dist/index.js";

function makeConfig(overrides = {}) {
  return {
    panel: [
      { model: "litellm/deepseek-3.2", maxContext: 128000 },
      { model: "litellm/glm-5", maxContext: 128000 },
      { model: "litellm/kimi-2.5", weight: 1.5, maxContext: 1048576 },
    ],
    judge: "litellm/glm-4.7-flash",
    strategy: "single_judge",
    routing: { mode: "always", complexityThreshold: 0.7 },
    timeout: 90000,
    contextLimits: { default: 128000, skipThreshold: 256000 },
    ...overrides,
  };
}

describe("routePanels - context size routing", () => {
  it("all panels get full context when input is small", () => {
    const config = makeConfig();
    const msgs = [{ role: "user", content: "hello" }];
    const result = routePanels(config, msgs);
    assert.equal(result.length, 3);
    assert.ok(result.every((a) => a.mode === "full"));
  });

  it("short-context panels get compact, long-context gets full for medium input", () => {
    const config = makeConfig();
    const msgs = [{ role: "user", content: "x".repeat(600000) }]; // ~150K tokens
    const result = routePanels(config, msgs);

    const deepseek = result.find((a) => a.panelModel.model === "litellm/deepseek-3.2");
    const glm = result.find((a) => a.panelModel.model === "litellm/glm-5");
    const kimi = result.find((a) => a.panelModel.model === "litellm/kimi-2.5");

    assert.equal(deepseek.mode, "compact");
    assert.equal(glm.mode, "compact");
    assert.equal(kimi.mode, "full");
  });

  it("short-context panels are skipped for huge input", () => {
    const config = makeConfig();
    const msgs = [{ role: "user", content: "y".repeat(1200000) }]; // ~300K tokens
    const result = routePanels(config, msgs);

    const deepseek = result.find((a) => a.panelModel.model === "litellm/deepseek-3.2");
    const glm = result.find((a) => a.panelModel.model === "litellm/glm-5");
    const kimi = result.find((a) => a.panelModel.model === "litellm/kimi-2.5");

    assert.equal(deepseek.mode, "skip");
    assert.equal(glm.mode, "skip");
    assert.equal(kimi.mode, "full");
  });

  it("at least one panel is never skipped (fallback to compact)", () => {
    const config = makeConfig({
      panel: [
        { model: "litellm/deepseek-3.2", maxContext: 100 },
        { model: "litellm/glm-5", maxContext: 100 },
      ],
      contextLimits: { default: 100, skipThreshold: 200 },
    });
    const msgs = [{ role: "user", content: "z".repeat(2000) }]; // way over
    const result = routePanels(config, msgs);
    const active = result.filter((a) => a.mode !== "skip");
    assert.ok(active.length >= 1, "at least one panel should be active");
  });

  it("uses KNOWN_CONTEXT_LIMITS when maxContext not specified", () => {
    const config = makeConfig({
      panel: ["litellm/deepseek-3.2", "litellm/kimi-2.5"],
    });
    const msgs = [{ role: "user", content: "x".repeat(600000) }]; // ~150K
    const result = routePanels(config, msgs);

    const deepseek = result.find((a) => {
      const id = typeof a.panelModel === "string" ? a.panelModel : a.panelModel.model;
      return id.includes("deepseek");
    });
    const kimi = result.find((a) => {
      const id = typeof a.panelModel === "string" ? a.panelModel : a.panelModel.model;
      return id.includes("kimi");
    });

    assert.equal(deepseek.mode, "compact");
    assert.equal(kimi.mode, "full");
  });
});

describe("routePanels - image routing", () => {
  it("hasImages detects image content parts", () => {
    const withImage = [
      { role: "user", content: [{ type: "text", text: "hi" }, { type: "image", image: "data" }] },
    ];
    const withoutImage = [
      { role: "user", content: "hello" },
    ];
    assert.equal(hasImages(withImage), true);
    assert.equal(hasImages(withoutImage), false);
  });

  it("strips images from text-only panels", () => {
    const config = makeConfig();
    const msgs = [
      { role: "user", content: [
        { type: "text", text: "What is this?" },
        { type: "image", image: "base64data", mimeType: "image/png" },
      ]},
    ];
    const result = routePanels(config, msgs);

    const deepseek = result.find((a) => a.panelModel.model === "litellm/deepseek-3.2");
    const kimi = result.find((a) => a.panelModel.model === "litellm/kimi-2.5");

    // deepseek is text-only — should not have images
    assert.equal(hasImages(deepseek.messages), false);
    // kimi supports images — should have images
    assert.equal(hasImages(kimi.messages), true);
  });

  it("all panels get images when text-only input", () => {
    const config = makeConfig();
    const msgs = [{ role: "user", content: "no images here" }];
    const result = routePanels(config, msgs);
    assert.ok(result.every((a) => a.mode === "full"));
  });

  it("respects supportsImages override in config", () => {
    const config = makeConfig({
      panel: [
        { model: "litellm/deepseek-3.2", supportsImages: true, maxContext: 128000 },
        { model: "litellm/kimi-2.5", maxContext: 1048576 },
      ],
    });
    const msgs = [
      { role: "user", content: [
        { type: "text", text: "look" },
        { type: "image", image: "data" },
      ]},
    ];
    const result = routePanels(config, msgs);

    const deepseek = result.find((a) => a.panelModel.model === "litellm/deepseek-3.2");
    assert.equal(hasImages(deepseek.messages), true);
  });
});
