import { describe, it } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createFusionLanguageModel } from "../dist/index.js";

describe("fusion timeout cancellation", () => {
  it("aborts in-flight panel stream requests on timeout", async () => {
    let started = 0;
    let aborted = 0;
    let closed = 0;

    const server = http.createServer((req, res) => {
      if (req.method === "POST" && req.url === "/v1/responses") {
        started += 1;
        req.on("aborted", () => {
          aborted += 1;
        });
        res.on("close", () => {
          closed += 1;
        });
        res.writeHead(200, { "content-type": "text/event-stream" });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      const model = createFusionLanguageModel({
        panel: [{ provider: "test", model: "slow-model", baseURL: `http://127.0.0.1:${port}/v1`, apiKey: "test" }],
        judge: "test/judge-model",
        strategy: "single_judge",
        timeout: 75,
        routing: { mode: "auto", complexityThreshold: 0.7 },
        contextLimits: { default: 128000, skipThreshold: 256000 },
      });

      await assert.rejects(
        model.doGenerate({ prompt: [{ role: "user", content: "hello" }] }),
        /Fusion panel timeout after 75ms/
      );

      await new Promise((resolve) => setTimeout(resolve, 150));
      assert.equal(started, 1);
      assert.equal(aborted, 1);
      assert.equal(closed, 1);
    } finally {
      server.close();
    }
  });
});
