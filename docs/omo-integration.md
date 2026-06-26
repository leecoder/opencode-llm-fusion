# OmO 연동 가이드

opencode-fusion을 oh-my-openagent(OmO)와 함께 사용할 때, category routing에서 fusion model을 활용하는 방법.

## 1. 기본 설정

`opencode.json`에 두 플러그인을 모두 등록:

```json
{
  "plugin": ["oh-my-openagent", "opencode-fusion"]
}
```

## 2. OmO agent override에서 fusion model 지정

`.opencode/oh-my-openagent.jsonc`에서 특정 카테고리의 모델을 fusion으로 지정:

```jsonc
{
  "agents": {
    "sisyphus": {
      "model": "fusion/panel-3"
    }
  }
}
```

또는 카테고리별로:

```jsonc
{
  "categories": {
    "ultrabrain": {
      "model": "fusion/panel-3-single_judge"
    }
  }
}
```

## 3. 권장 사용 패턴

### 아키텍처 결정/설계 시에만 fusion

OmO의 `ultrabrain` 카테고리에 fusion을 할당하면, 어려운 로직/설계 문제에서만 multi-model synthesis가 발동한다:

```jsonc
{
  "categories": {
    "ultrabrain": {
      "model": "fusion/panel-3-single_judge"
    },
    "quick": {
      "model": "kimi/kimi-k2.6"
    },
    "visual-engineering": {
      "model": "google/gemini-2.5-flash"
    }
  }
}
```

### Oracle 대체로 fusion 사용

Oracle agent의 모델을 fusion으로 교체하면, 어렵게 상담할 때 multi-model 합성을 받을 수 있다:

```jsonc
{
  "agents": {
    "oracle": {
      "model": "fusion/panel-3-single_judge"
    }
  }
}
```

### Self-consistency 패턴

같은 모델을 3번 돌리고 합성하면 OpenRouter Fusion에서 검증된 +6.7%p 향상을 재현 가능:

```json
{
  "panel": [
    { "provider": "anthropic", "model": "claude-opus-4-6" },
    { "provider": "anthropic", "model": "claude-opus-4-6" },
    { "provider": "anthropic", "model": "claude-opus-4-6" }
  ],
  "judge": { "provider": "anthropic", "model": "claude-opus-4-6" },
  "strategy": "single_judge"
}
```

## 4. 비용 최적화

fusion은 N+1 호출이므로 비용이 높다. OmO의 routing과 조합하면 효율적:

- `routing.mode: "auto"` + `complexityThreshold: 0.6` → 복잡한 프롬프트에서만 fusion 발동
- 일상 코딩 (quick, visual) → 단일 모델
- 설계/디버깅 (ultrabrain, oracle) → fusion

## 5. Team Mode와의 관계

OmO Team Mode는 에이전트 레벨 오케스트레이션 (각 에이전트가 서로 다른 task 수행).
Fusion은 모델 레벨 앙상블 (같은 prompt에 여러 모델이 답변 → 합성).

둘은 상호 보완적이다:
- Team Mode: "여러 전문가가 각자 맡은 일을 하고 리더가 통합"
- Fusion: "같은 질문에 여러 전문가가 각자 답하고 심판이 합성"

둘 다 켜도 충돌하지 않는다. Team member가 fusion model을 사용하면 "전문가 팀의 각 멤버가 multi-model consensus로 답변"하는 구조가 된다.
