import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { createOpenAI } = require("@ai-sdk/openai");
const { generateText } = require("ai");

const LITELLM_BASE = "https://llmgateway.tmapadmin.com/v1";
const LITELLM_KEY = "sk-sry8X7rtfeNtwrm0Nr4Low";

const codingPrompts = [
  {
    id: "bug-fix",
    prompt: `Fix the bug in this code:

\`\`\`javascript
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  }
}

// Bug: the returned function loses 'this' context when used as a method
class SearchBox {
  query = '';
  search = debounce(function() {
    console.log('Searching:', this.query);
  }, 300);
}

const box = new SearchBox();
box.query = 'hello';
box.search(); // logs "Searching: undefined"
\`\`\`

Explain the root cause and provide the corrected code.`,
  },
  {
    id: "implement-lru",
    prompt: `Implement an LRU Cache in TypeScript with O(1) get and put operations. Requirements:
- constructor takes capacity
- get(key): return value or -1
- put(key, value): insert/update, evict LRU if at capacity

Provide the complete class implementation.`,
  },
  {
    id: "refactor",
    prompt: `Refactor this code to be more maintainable and type-safe:

\`\`\`typescript
async function processOrder(order: any) {
  let result: any = {};
  if (order.type == 'physical') {
    result.shipping = await fetch('/api/shipping', {
      method: 'POST',
      body: JSON.stringify({address: order.address, weight: order.items.reduce((s: any, i: any) => s + i.weight, 0)})
    }).then((r: any) => r.json());
    result.tax = order.items.reduce((s: any, i: any) => s + i.price * 0.1, 0);
  } else if (order.type == 'digital') {
    result.downloadLinks = order.items.map((i: any) => i.downloadUrl);
    result.tax = 0;
  } else if (order.type == 'subscription') {
    result.nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    result.tax = order.items.reduce((s: any, i: any) => s + i.price * 0.05, 0);
  }
  result.total = order.items.reduce((s: any, i: any) => s + i.price, 0) + (result.tax || 0) + (result.shipping?.cost || 0);
  return result;
}
\`\`\`

Provide the refactored version with proper types, error handling, and SOLID principles.`,
  },
  {
    id: "system-design",
    prompt: `Design a rate limiter middleware for an Express.js API with these requirements:
- Token bucket algorithm
- Per-user rate limiting (by API key)
- Configurable: requests per second, burst capacity
- Redis-backed for distributed deployments
- Return proper 429 responses with Retry-After header

Provide the complete implementation.`,
  },
  {
    id: "algorithm",
    prompt: `Implement a function that solves the "Word Ladder" problem:
Given beginWord, endWord, and a wordList, find the length of the shortest transformation sequence from beginWord to endWord where:
- Only one letter can be changed at a time
- Each transformed word must exist in the wordList

Use BFS. Return 0 if no transformation is possible. Implement in TypeScript with proper types.`,
  },
];

async function callModel(modelId, prompt) {
  const openai = createOpenAI({ apiKey: LITELLM_KEY, baseURL: LITELLM_BASE });
  const model = openai(modelId);
  const start = Date.now();
  try {
    const result = await generateText({
      model,
      system: "You are a senior software engineer. Provide clean, production-ready code with brief explanations.",
      prompt,
    });
    return {
      text: result.text,
      elapsed: Date.now() - start,
      tokens: { input: result.usage.inputTokens ?? 0, output: result.usage.outputTokens ?? 0 },
      error: null,
    };
  } catch (e) {
    return { text: "", elapsed: Date.now() - start, tokens: { input: 0, output: 0 }, error: e.message };
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
        { role: "system", content: "You are a senior software engineer. Provide clean, production-ready code with brief explanations." },
        { role: "user", content: [{ type: "text", text: prompt }] },
      ],
      mode: { type: "regular" },
    });
    const text = result.content?.[0]?.text ?? "";
    return { text, elapsed: Date.now() - start, tokens: { input: 0, output: 0 }, error: null };
  } catch (e) {
    return { text: "", elapsed: Date.now() - start, tokens: { input: 0, output: 0 }, error: e.message };
  }
}

async function run() {
  console.log("=== Coding Benchmark: Fusion vs Opus 4.6 ===\n");

  const results = { fusion: [], opus: [] };
  const fs = require("fs");

  for (let i = 0; i < codingPrompts.length; i++) {
    const p = codingPrompts[i];
    console.log(`[${i + 1}/${codingPrompts.length}] ${p.id}`);

    const fusionRes = await callFusion(p.prompt);
    results.fusion.push({ id: p.id, ...fusionRes });
    console.log(`  FUSION : ${fusionRes.elapsed}ms | ${fusionRes.error ?? fusionRes.text.slice(0, 60).replace(/\n/g, " ")}...`);

    const opusRes = await callModel("opus-4.6", p.prompt);
    results.opus.push({ id: p.id, ...opusRes });
    console.log(`  OPUS   : ${opusRes.elapsed}ms | ${opusRes.error ?? opusRes.text.slice(0, 60).replace(/\n/g, " ")}...`);

    console.log("");
  }

  console.log("\n=== TIMING SUMMARY ===\n");
  console.log("Task".padEnd(18) + "Fusion".padEnd(12) + "Opus 4.6".padEnd(12) + "Winner");
  console.log("-".repeat(52));

  let fusionWins = 0;
  for (let i = 0; i < codingPrompts.length; i++) {
    const id = codingPrompts[i].id;
    const ft = results.fusion[i].elapsed;
    const ot = results.opus[i].elapsed;
    const winner = ft < ot ? "Fusion" : "Opus";
    if (ft < ot) fusionWins++;
    console.log(`${id.padEnd(18)}${(ft + "ms").padEnd(12)}${(ot + "ms").padEnd(12)}${winner}`);
  }

  const fusionAvg = Math.round(results.fusion.reduce((s, r) => s + r.elapsed, 0) / results.fusion.length);
  const opusAvg = Math.round(results.opus.reduce((s, r) => s + r.elapsed, 0) / results.opus.length);
  console.log("-".repeat(52));
  console.log(`${"AVERAGE".padEnd(18)}${(fusionAvg + "ms").padEnd(12)}${(opusAvg + "ms").padEnd(12)}`);
  console.log(`\nSpeed wins: Fusion ${fusionWins}/${codingPrompts.length}, Opus ${codingPrompts.length - fusionWins}/${codingPrompts.length}`);

  fs.writeFileSync(
    "/Users/t1000040/work/opencode-llm-fusion/bench-coding-results.json",
    JSON.stringify(results, null, 2)
  );
  console.log("\nFull results saved to bench-coding-results.json");
  console.log("\n=== RESPONSES (for manual quality comparison) ===\n");

  for (let i = 0; i < codingPrompts.length; i++) {
    const id = codingPrompts[i].id;
    console.log(`\n${"=".repeat(60)}`);
    console.log(`TASK: ${id}`);
    console.log(`${"=".repeat(60)}`);
    console.log(`\n--- FUSION (${results.fusion[i].elapsed}ms) ---\n`);
    console.log(results.fusion[i].text.slice(0, 1500));
    console.log(`\n--- OPUS 4.6 (${results.opus[i].elapsed}ms) ---\n`);
    console.log(results.opus[i].text.slice(0, 1500));
  }
}

run().catch(console.error);
