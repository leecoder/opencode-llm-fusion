import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { createOpenAI } = require("@ai-sdk/openai");
const { generateText } = require("ai");

const LITELLM_BASE = "https://llmgateway.tmapadmin.com/v1";
const LITELLM_KEY = "sk-sry8X7rtfeNtwrm0Nr4Low";

const benchPrompts = [
  {
    category: "reasoning",
    prompt: "A farmer has 17 sheep. All but 9 run away. How many sheep does the farmer have left? Explain step by step.",
    evalHint: "9",
  },
  {
    category: "reasoning",
    prompt: "If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets? Think carefully.",
    evalHint: "5 minutes",
  },
  {
    category: "coding",
    prompt: "Write a Python function that finds the longest palindromic substring in a given string. Use dynamic programming. Return only the function code.",
    evalHint: "def longest_palindrome",
  },
  {
    category: "coding",
    prompt: "Write a TypeScript function that deep-merges two objects recursively. Handle arrays by concatenation. Return only the function code.",
    evalHint: "function deepMerge",
  },
  {
    category: "analysis",
    prompt: "Compare and contrast microservices vs monolithic architecture. Give exactly 3 pros and 3 cons for each. Be concise.",
    evalHint: "microservices",
  },
  {
    category: "analysis",
    prompt: "What are the security implications of using JWT tokens stored in localStorage vs httpOnly cookies? Give a concrete recommendation.",
    evalHint: "httpOnly",
  },
  {
    category: "creativity",
    prompt: "Generate a creative 4-line poem about a programmer debugging code at 3am. Make it witty.",
    evalHint: null,
  },
  {
    category: "math",
    prompt: "Solve: Find all real values of x such that log₂(x+3) + log₂(x-1) = 3. Show your work.",
    evalHint: "x = 3",
  },
];

async function callModel(modelId, prompt, baseURL, apiKey) {
  const openai = createOpenAI({ apiKey, baseURL });
  const model = openai(modelId);
  const start = Date.now();
  try {
    const result = await generateText({
      model,
      system: "You are a helpful, accurate assistant. Be concise.",
      prompt,
    });
    const elapsed = Date.now() - start;
    return {
      text: result.text,
      tokens: { input: result.usage.inputTokens ?? 0, output: result.usage.outputTokens ?? 0 },
      elapsed,
      error: null,
    };
  } catch (e) {
    return { text: "", tokens: { input: 0, output: 0 }, elapsed: Date.now() - start, error: e.message };
  }
}

async function callFusion(prompt) {
  const { createFusion } = await import("/Users/t1000040/work/opencode-llm-fusion/dist/index.js");
  const fusion = createFusion();
  const model = fusion("panel-3");

  const start = Date.now();
  try {
    const result = await model.doGenerate({
      prompt: [
        { role: "system", content: "You are a helpful, accurate assistant. Be concise." },
        { role: "user", content: [{ type: "text", text: prompt }] },
      ],
      mode: { type: "regular" },
    });
    const elapsed = Date.now() - start;
    const text = result.content?.[0]?.text ?? "";
    const inputTokens = result.usage?.inputTokens?.total ?? 0;
    const outputTokens = result.usage?.outputTokens?.total ?? 0;
    return { text, tokens: { input: inputTokens, output: outputTokens }, elapsed, error: null };
  } catch (e) {
    return { text: "", tokens: { input: 0, output: 0 }, elapsed: Date.now() - start, error: e.message };
  }
}

const models = [
  { id: "deepseek-3.2", label: "DeepSeek 3.2" },
  { id: "glm-5", label: "GLM 5" },
  { id: "kimi-2.5", label: "Kimi 2.5" },
  { id: "sonnet-4.6", label: "Claude Sonnet 4.6" },
];

async function runBenchmark() {
  console.log("=== opencode-llm-fusion Benchmark ===");
  console.log(`Panel: deepseek-3.2 + glm-5 + kimi-2.5 → judge: glm-4.7-flash`);
  console.log(`Comparison: individual panel models + Claude Sonnet 4.6`);
  console.log(`Prompts: ${benchPrompts.length} across ${[...new Set(benchPrompts.map((p) => p.category))].join(", ")}`);
  console.log("---");
  console.log("");

  const results = {};

  for (const m of models) {
    results[m.id] = [];
  }
  results["fusion"] = [];

  for (let i = 0; i < benchPrompts.length; i++) {
    const bp = benchPrompts[i];
    console.log(`\n[${i + 1}/${benchPrompts.length}] ${bp.category}: "${bp.prompt.slice(0, 60)}..."`);

    const fusionResult = await callFusion(bp.prompt);
    results["fusion"].push({ ...bp, result: fusionResult });
    console.log(`  fusion     : ${fusionResult.elapsed}ms | ${fusionResult.text.slice(0, 80).replace(/\n/g, " ")}...`);

    for (const m of models) {
      const r = await callModel(m.id, bp.prompt, LITELLM_BASE, LITELLM_KEY);
      results[m.id].push({ ...bp, result: r });
      console.log(`  ${m.label.padEnd(12)}: ${r.elapsed}ms | ${(r.error || r.text.slice(0, 80)).replace(/\n/g, " ")}...`);
    }
  }

  console.log("\n\n=== SUMMARY ===\n");
  console.log("Model".padEnd(16) + "Avg Time".padEnd(12) + "Total Tokens".padEnd(14));
  console.log("-".repeat(42));

  for (const key of ["fusion", ...models.map((m) => m.id)]) {
    const label = key === "fusion" ? "FUSION" : models.find((m) => m.id === key)?.label ?? key;
    const entries = results[key];
    const avgTime = Math.round(entries.reduce((s, e) => s + e.result.elapsed, 0) / entries.length);
    const totalTokens = entries.reduce((s, e) => s + e.result.tokens.input + e.result.tokens.output, 0);
    console.log(`${label.padEnd(16)}${(avgTime + "ms").padEnd(12)}${totalTokens}`);
  }

  console.log("\n\n=== DETAILED RESULTS (JSON) ===\n");
  const summary = Object.fromEntries(
    Object.entries(results).map(([key, entries]) => [
      key,
      entries.map((e) => ({
        category: e.category,
        prompt: e.prompt.slice(0, 60),
        elapsed: e.result.elapsed,
        tokens: e.result.tokens,
        answer: e.result.text.slice(0, 200),
        error: e.result.error,
      })),
    ])
  );
  const fs = require("fs");
  fs.writeFileSync("/Users/t1000040/work/opencode-llm-fusion/benchmark-results.json", JSON.stringify(summary, null, 2));
  console.log("Results saved to benchmark-results.json");
}

runBenchmark().catch(console.error);
