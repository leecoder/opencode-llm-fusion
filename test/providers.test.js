import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Import from dist - resolveModelConfig is exported from providers via index
// We test via the built bundle
const { default: distModule } = await import("../dist/index.js");

// resolveModelConfig isn't directly exported, test via createProviderModel behavior indirectly
// Instead, test routePanels which depends on model resolution
import { routePanels } from "../dist/index.js";

describe("providers - model resolution via routing", () => {
  it("resolves string format provider/model", () => {
    const config = {
      panel: ["litellm/deepseek-3.2", "litellm/kimi-2.5"],
      judge: "litellm/glm-4.7-flash",
      strategy: "single_judge",
      routing: { mode: "always", complexityThreshold: 0.7 },
      timeout: 90000,
      contextLimits: { default: 128000, skipThreshold: 256000 },
    };
    const msgs = [{ role: "user", content: "hi" }];
    const result = routePanels(config, msgs);
    assert.equal(result.length, 2);
    assert.equal(result[0].mode, "full");
  });

  it("resolves object format with model containing provider prefix", () => {
    const config = {
      panel: [
        { model: "litellm/deepseek-3.2", maxContext: 128000 },
        { model: "litellm/kimi-2.5", weight: 1.5, maxContext: 1048576 },
      ],
      judge: "litellm/glm-4.7-flash",
      strategy: "single_judge",
      routing: { mode: "always", complexityThreshold: 0.7 },
      timeout: 90000,
      contextLimits: { default: 128000, skipThreshold: 256000 },
    };
    const msgs = [{ role: "user", content: "hi" }];
    const result = routePanels(config, msgs);
    assert.equal(result.length, 2);
    assert.ok(result.every((a) => a.mode === "full"));
  });

  it("resolves object format with explicit provider field", () => {
    const config = {
      panel: [
        { provider: "litellm", model: "deepseek-3.2", maxContext: 128000 },
        { provider: "litellm", model: "kimi-2.5", maxContext: 1048576 },
      ],
      judge: "litellm/glm-4.7-flash",
      strategy: "single_judge",
      routing: { mode: "always", complexityThreshold: 0.7 },
      timeout: 90000,
      contextLimits: { default: 128000, skipThreshold: 256000 },
    };
    const msgs = [{ role: "user", content: "hi" }];
    const result = routePanels(config, msgs);
    assert.equal(result.length, 2);
  });
});
