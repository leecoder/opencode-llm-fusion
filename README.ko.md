# opencode-llm-fusion

Multi-LLM Fusion provider for OpenCode. 여러 모델을 병렬로 호출하고 judge 모델이 합성해서 단일 모델보다 높은 품질의 응답을 반환한다.

## 원리

```
User Prompt
    │
    ├──→ Panel Model A (DeepSeek 3.2)  ──┐
    ├──→ Panel Model B (GLM 5)         ──┼──→ Judge Model (GLM 4.7 Flash) ──→ Final Answer
    └──→ Panel Model C (Kimi 2.5)      ──┘
```

- **Panel**: 동일 프롬프트를 N개 모델에 병렬 전송
- **Judge**: N개 응답의 합의점/모순/빈틈을 분석해서 최종 답 합성
- **Strategy**: `single_judge` (합성), `majority_vote` (최고 선택), `best_of_n` (점수 기반 선택)

OpenRouter Fusion, Sakana Fugu와 동일한 컨셉을 OpenCode provider로 구현.

## 벤치마크 결과

### 코딩 태스크 (5개) — Fusion vs Opus 4.6

| Task | Fusion (3-panel) | Opus 4.6 | 비교 |
|------|---------|----------|------|
| Bug Fix (debounce this) | 15.8s | 22.9s | Fusion 빠름, 둘 다 정답 |
| LRU Cache 구현 | 39.5s | 10.3s | Opus 빠름, Fusion이 더 완결적 (generic + sentinel nodes) |
| Refactor (SOLID) | 59.4s | 19.7s | Opus 빠름, Fusion이 더 상세 (discriminated union + DI) |
| Rate Limiter (Redis) | 82.2s | 47.4s | Opus 빠름, 둘 다 Lua script 기반 |
| Word Ladder (BFS) | 39.8s | 12.5s | Opus 빠름, 동일 알고리즘 |

**평균 latency**: Fusion 47.4s vs Opus 22.6s

### 품질 평가

| 항목 | Fusion (저가 3종 합성) | Opus 4.6 |
|------|----------------------|----------|
| 정확도 | 5/5 정답 | 5/5 정답 |
| 코드 완결성 | 더 상세 (타입, 에러 핸들링, 주석 포함) | 실용적, 간결 |
| 아키텍처 | SOLID 원칙 엄격 적용 | 적절한 수준 |
| 설명 | 근본 원인 분석 포함 | 핵심만 간결히 |

### 비용 비교 (추정)

| 모델 구성 | 비용/요청 (1K input + 1K output 기준) | 품질 |
|-----------|--------------------------------------|------|
| **Fusion (deepseek-3.2 + glm-5 + kimi-2.5 + judge)** | ~$0.004 (4회 저가 호출) | ★★★★☆ |
| **Claude Sonnet 4.6** | ~$0.009 | ★★★★☆ |
| **Claude Opus 4.6** | ~$0.045 | ★★★★★ |
| **GPT-5.5** | ~$0.030 | ★★★★½ |

> Fusion은 Opus 비용의 ~1/10로 Sonnet급 이상의 품질을 달성.
> 다만 latency가 2~4x 느리므로 실시간 대화보다 중요 결정/설계에 적합.

### 핵심 인사이트

1. **저가 모델 합성이 고가 단일 모델에 근접**: OpenRouter Fusion 벤치(DRACO)와 일치하는 결과
2. **완결성은 Fusion이 우세**: 여러 모델의 관점이 합쳐지면서 더 포괄적인 답변
3. **속도는 단일 모델이 우세**: Fusion = max(panel latency) + judge latency
4. **비용 효율**: 저가 모델 4회 < 고가 모델 1회

## 설치

```bash
# GitHub에서 직접 설치 (빌드 불필요)
npm install github:leecoder/opencode-llm-fusion
```

또는 `opencode.json`에서 직접 참조 — OpenCode가 GitHub 레퍼런스를 자동으로 resolve한다:

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

## 설정

### 1. opencode.json에 독립 provider로 등록

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

### 2. fusion 설정 파일 생성

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

### 3. 사용

```bash
opencode run --model fusion/panel-3 "your prompt here"
```

## 설정 옵션

### Strategy

| 전략 | 설명 | 용도 |
|------|------|------|
| `single_judge` | Judge가 모든 응답을 합성해서 새 답변 생성 | 기본. 가장 높은 품질 |
| `majority_vote` | Judge가 최고 응답 1개를 선택 | 빠른 선택. 새 합성 없음 |
| `best_of_n` | Judge가 각 응답에 점수 매기고 최고 선택 | weight 적용 가능 |

### Routing Policy

| 모드 | 설명 |
|------|------|
| `always` | 모든 요청에 fusion 적용 |
| `manual` | 명시적 model 선택 시에만 |
| `auto` | 복잡도 기반 자동 판단 (threshold 조절 가능) |

### Panel 구성 팁

- **다양성 확보**: 서로 다른 학습 데이터/아키텍처의 모델을 섞어야 효과적
- **Self-consistency**: 같은 모델 3회 돌려도 +6.7%p 향상 (추론 경로 다양성)
- **Bottleneck 관리**: 가장 느린 panel 모델이 전체 latency 결정

## OmO 연동

oh-my-openagent의 category routing과 조합하면 "중요 결정에만 fusion":

```jsonc
// .opencode/oh-my-openagent.jsonc
{
  "categories": {
    "ultrabrain": { "model": "fusion/panel-3" },
    "quick": { "model": "litellm/kimi-2.5" }
  }
}
```

자세한 내용은 [docs/omo-integration.md](docs/omo-integration.md) 참고.

## 아키텍처

```
opencode-llm-fusion/
├── src/
│   ├── index.ts          ← AI SDK provider factory (createFusion)
│   ├── config.ts         ← Zod 스키마 (panel, judge, strategy, routing)
│   ├── fusion-model.ts   ← LanguageModelV3 구현 (doGenerate + doStream)
│   ├── providers.ts      ← AI SDK provider별 모델 팩토리
│   └── routing.ts        ← Complexity 기반 자동 라우팅
├── examples/             ← 설정 예시들
├── docs/                 ← OmO 연동 가이드
└── bench-coding.mjs      ← 코딩 벤치마크 스크립트
```

OpenCode의 provider 시스템에서 `npm` 필드로 이 패키지를 지정하면, OpenCode가 `createFusion()`을 호출하고 반환된 `languageModel(modelId)` 함수로 `LanguageModelV3` 인스턴스를 가져온다.

## 라이선스

MIT
