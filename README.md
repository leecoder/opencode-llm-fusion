# opencode-llm-fusion

Multi-LLM Fusion provider for OpenCode. Queries multiple models in parallel, then a judge model synthesizes the best answer from all responses.

## How It Works

```
User Prompt
    │
    ├──→ Panel Model A (DeepSeek 3.2)  ──┐
    ├──→ Panel Model B (GLM 5)         ──┼──→ Judge Model (GLM 4.7 Flash) ──→ Final Answer
    └──→ Panel Model C (Kimi 2.5)      ──┘
```

- **Panel**: Send the same prompt to N models in parallel
- **Judge**: Analyze agreement, contradictions, and gaps across N responses, then synthesize a final answer
- **Strategy**: `single_judge` (synthesize new answer), `majority_vote` (pick best), `best_of_n` (score-based selection)

Same concept as OpenRouter Fusion and Sakana Fugu, implemented as an OpenCode provider.

## Benchmark Results

### Coding Tasks (5) — Fusion vs Opus 4.6

| Task | Fusion (3-panel) | Opus 4.6 | Notes |
|------|---------|----------|-------|
| Bug Fix (debounce this) | 15.8s | 22.9s | Fusion faster, both correct |
| LRU Cache | 39.5s | 10.3s | Opus faster, Fusion more complete (generic + sentinel nodes) |
| Refactor (SOLID) | 59.4s | 19.7s | Opus faster, Fusion more thorough (discriminated union + DI) |
| Rate Limiter (Redis) | 82.2s | 47.4s | Opus faster, both use Lua scripts |
| Word Ladder (BFS) | 39.8s | 12.5s | Opus faster, same algorithm |

**Average latency**: Fusion 47.4s vs Opus 22.6s

### Quality Assessment

| Metric | Fusion (3 budget models) | Opus 4.6 |
|--------|--------------------------|----------|
| Accuracy | 5/5 correct | 5/5 correct |
| Code completeness | More thorough (types, error handling) | Practical, concise |
| Architecture | Strict SOLID application | Adequate |
| Explanations | Root cause analysis included | Key points only |

### Cost Comparison (estimated)

| Configuration | Cost/request (1K in + 1K out) | Quality |
|---------------|-------------------------------|---------|
| **Fusion (deepseek-3.2 + glm-5 + kimi-2.5 + judge)** | ~$0.004 (4x budget calls) | ★★★★☆ |
| **Claude Sonnet 4.6** | ~$0.009 | ★★★★☆ |
| **Claude Opus 4.6** | ~$0.045 | ★★★★★ |
| **GPT-5.5** | ~$0.030 | ★★★★½ |

> Fusion achieves Sonnet-level quality at ~1/10 the cost of Opus.
> Tradeoff: 2-4x higher latency. Best for important decisions, not real-time chat.

### Key Insights

1. **Budget model ensemble rivals expensive single models** — consistent with OpenRouter Fusion DRACO benchmarks
2. **Completeness favors Fusion** — multiple perspectives yield more comprehensive answers
3. **Speed favors single models** — Fusion = max(panel latency) + judge latency
4. **Cost efficient** — 4x budget model calls < 1x premium model call

## Installation

```bash
# Install from GitHub (no build needed)
npm install github:leecoder/opencode-llm-fusion
```

Or reference directly in `opencode.json` without a separate install step — OpenCode resolves GitHub references automatically:

```json
{
  "provider": {
    "fusion": {
      "npm": "github:leecoder/opencode-llm-fusion",
      ...
    }
  }
}
```

## Configuration

### 1. Register as an independent provider in opencode.json

```json
{
  "provider": {
    "fusion": {
      "npm": "github:leecoder/opencode-llm-fusion",
      "models": {
        "panel-3": {
          "name": "Fusion 3-Panel",
          "id": "panel-3",
          "limit": { "context": 128000, "output": 64000 },
          "modalities": { "input": ["text"], "output": ["text"] }
        }
      }
    }
  }
}
```

### 2. Create fusion config file

`~/.config/opencode/opencode-llm-fusion.json`:

```json
{
  "panel": ["litellm/deepseek-3.2", "litellm/glm-5", "litellm/kimi-2.5"],
  "judge": "litellm/glm-4.7-flash",
  "strategy": "single_judge",
  "routing": { "mode": "always" },
  "timeout": 90000
}
```

### 3. Use it

```bash
opencode run --model fusion/panel-3 "your prompt here"
```

## Options

### Strategy

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `single_judge` | Judge synthesizes all responses into a new answer | Default. Highest quality |
| `majority_vote` | Judge picks the single best response | Fast selection, no new synthesis |
| `best_of_n` | Judge scores each response, picks highest | Supports weight configuration |

### Routing Policy

| Mode | Description |
|------|-------------|
| `always` | Apply fusion to every request |
| `manual` | Only when fusion model is explicitly selected |
| `auto` | Complexity-based automatic routing (threshold configurable) |

### Panel Tips

- **Maximize diversity**: Mix models with different training data/architectures
- **Self-consistency**: Even the same model 3x yields +6.7%p improvement (reasoning path diversity)
- **Manage bottlenecks**: The slowest panel model determines total latency

## OmO Integration

Combine with oh-my-openagent category routing for "fusion only on important decisions":

```jsonc
// .opencode/oh-my-openagent.jsonc
{
  "categories": {
    "ultrabrain": { "model": "fusion/panel-3" },
    "quick": { "model": "litellm/kimi-2.5" }
  }
}
```

See [docs/omo-integration.md](docs/omo-integration.md) for details.

## Architecture

```
opencode-llm-fusion/
├── src/
│   ├── index.ts          ← AI SDK provider factory (createFusion)
│   ├── config.ts         ← Zod schema (panel, judge, strategy, routing)
│   ├── fusion-model.ts   ← LanguageModelV3 implementation (doGenerate + doStream)
│   ├── providers.ts      ← Per-provider model factory
│   └── routing.ts        ← Complexity-based auto-routing
├── examples/             ← Config examples
├── docs/                 ← OmO integration guide
└── bench-coding.mjs      ← Coding benchmark script
```

When OpenCode's provider system resolves the `npm` field to this package, it calls `createFusion()` and uses the returned `languageModel(modelId)` function to obtain a `LanguageModelV3` instance.

## License

MIT
