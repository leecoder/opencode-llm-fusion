import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FusionConfigSchema } from "../dist/index.js";

describe("FusionConfigSchema", () => {
  it("accepts minimal valid config with string panels", () => {
    const config = {
      panel: ["litellm/deepseek-3.2", "litellm/glm-5"],
      judge: "litellm/glm-4.7-flash",
    };
    const result = FusionConfigSchema.parse(config);
    assert.equal(result.panel.length, 2);
    assert.equal(result.strategy, "single_judge");
    assert.equal(result.routing.mode, "always");
    assert.equal(result.contextLimits.default, 128000);
    assert.equal(result.contextLimits.skipThreshold, 256000);
  });

  it("accepts object-style panels with maxContext and supportsImages", () => {
    const config = {
      panel: [
        { model: "litellm/kimi-2.5", weight: 1.5, maxContext: 1048576, supportsImages: true },
        { model: "litellm/deepseek-3.2", maxContext: 128000, supportsImages: false },
      ],
      judge: { provider: "litellm", model: "glm-4.7-flash" },
      strategy: "majority_vote",
    };
    const result = FusionConfigSchema.parse(config);
    assert.equal(result.panel[0].weight, 1.5);
    assert.equal(result.panel[0].maxContext, 1048576);
    assert.equal(result.panel[0].supportsImages, true);
    assert.equal(result.strategy, "majority_vote");
  });

  it("rejects config with less than 2 panels", () => {
    const config = {
      panel: ["litellm/deepseek-3.2"],
      judge: "litellm/glm-4.7-flash",
    };
    assert.throws(() => FusionConfigSchema.parse(config));
  });

  it("rejects invalid strategy", () => {
    const config = {
      panel: ["litellm/a", "litellm/b"],
      judge: "litellm/c",
      strategy: "invalid_strategy",
    };
    assert.throws(() => FusionConfigSchema.parse(config));
  });

  it("applies defaults for optional fields", () => {
    const config = {
      panel: ["litellm/a", "litellm/b"],
      judge: "litellm/c",
    };
    const result = FusionConfigSchema.parse(config);
    assert.equal(result.timeout, 120000);
    assert.equal(result.routing.complexityThreshold, 0.7);
    assert.equal(result.contextLimits.default, 128000);
    assert.equal(result.contextLimits.skipThreshold, 256000);
  });

  it("accepts custom contextLimits", () => {
    const config = {
      panel: ["litellm/a", "litellm/b"],
      judge: "litellm/c",
      contextLimits: { default: 200000, skipThreshold: 500000 },
    };
    const result = FusionConfigSchema.parse(config);
    assert.equal(result.contextLimits.default, 200000);
    assert.equal(result.contextLimits.skipThreshold, 500000);
  });

  it("accepts mixed panel types (string + object)", () => {
    const config = {
      panel: [
        "litellm/deepseek-3.2",
        { model: "litellm/kimi-2.5", weight: 2.0 },
      ],
      judge: "litellm/glm-4.7-flash",
    };
    const result = FusionConfigSchema.parse(config);
    assert.equal(typeof result.panel[0], "string");
    assert.equal(result.panel[1].model, "litellm/kimi-2.5");
    assert.equal(result.panel[1].weight, 2.0);
  });
});
