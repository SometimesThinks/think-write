# ThinkWrite API Spec

## 1. 원칙

- 모든 입력은 서버에서 검증한다.
- 응답 형식은 provider와 무관하게 통일한다.
- 에러 코드는 프론트엔드가 처리 가능한 형태로 (HTTP 상태 코드와 함께) 표준화한다.
- 초기 MVP 기본 provider는 OpenAI, 기본 모델은 `gpt-5-nano`다.

---

## 2. POST /api/completion

### 목적
단일 완성형(Non-streaming) AI 생성 결과를 반환한다.

### 요청 예시

```json
{
  "mode": "autocomplete", // MVP Enum: "autocomplete"
  "prefix": "I went to the",
  "suffix": "yesterday and it was fun.", // 커서 뒤 텍스트 (옵션, autocomplete 시 유용)
  "paragraphContext": "Yesterday I visited Tokyo.",
  "languageSettings": {
    "native": "Korean",
    "target": "English"
  },
  "provider": "openai"
}
```

### 응답 예시 (200 OK)

```json
{
  "output": "park",
  "provider": "openai",
  "model": "gpt-5-nano",
  "requestId": "req_123"
}
```

---

## 3. POST /api/completion/stream

### 목적
고스트 자동 완성 및 실시간 피드백을 위한 스트리밍(SSE) 응답을 제공한다.

### 요청 예시
`/api/completion`과 동일한 JSON 구조를 사용한다.

### SSE 이벤트 예시

```text
event: token
data: {"text":"meeting"}

event: token
data: {"text":" yesterday"}

event: done
data: {"requestId":"req_123"}
```

### SSE 에러 이벤트 예시
스트리밍 도중 Provider 토큰 한도 초과나 네트워크 에러 등 발생 시:

```text
event: error
data: {"code": "PROVIDER_RATE_LIMIT", "message": "Rate limit exceeded"}
```

### UI 처리 원칙

- 정상 상태에서는 토큰 스트림이 ghost text로 editor 내부에 반영되어야 한다.
- `PROVIDER_AUTH_FAILED` 같은 전역 설정 문제는 toast 등 전역 알림으로 처리한다.
- 개별 ghost 요청 실패/무효화는 editor 근처 inline notice 또는 무표시로 처리한다.

---

## 4. API Keys (Provider 설정)

### 목적
사용자 Provider 설정 및 API Key 저장, 조회, 삭제를 관리한다.

### 4.1. POST /api/keys

**목적:** API 키 등록 및 갱신

**요청 예시:**
```json
{
  "provider": "openai",
  "apiKey": "sk-..."
}
```

**고려 사항:**
- 서버 측 암호화 암복호화 적용
- 잘못된 키 검증 기능, 검증 실패 시 에러 타입 반환
- API Key 원문은 저장 이후 조회 API에서 절대 반환하지 않음

### 4.2. GET /api/keys

**목적:** 등록된 Provider 목록과 상태 확인 (보안을 위해 API 키 문자열 원본은 절대 반환하지 않음)

**응답 예시 (200 OK):**
```json
{
  "providers": [
    {
      "name": "openai",
      "isRegistered": true,
      "updatedAt": "2026-03-14T12:00:00Z"
    }
  ]
}
```

### 4.3. DELETE /api/keys

**목적:** 특정 Provider의 등록된 API 키 삭제

**요청 파라미터 또는 쿼리:**
```json
{
  "provider": "openai"
}
```

### 4.4. MVP 기본값

- provider 기본값: `openai`
- model 기본값: `gpt-5-nano`

---

## 5. 공통 에러 형식

모든 API는 에러 발생 시 적절한 HTTP 상태 코드(예: 400, 401, 500)와 함께 다음 형식의 JSON을 반환한다.

```json
{
  "error": {
    "code": "PROVIDER_AUTH_FAILED",
    "message": "Invalid API key.",
    "status": 401
  }
}
```

**주요 상태 코드 및 에러 코드 예시:**
- `400 Bad Request`: `INVALID_PARAMETERS` (입력값 누락 및 형식 오류)
- `401 Unauthorized`: `PROVIDER_AUTH_FAILED` (API 키 미등록 및 유효하지 않은 키)
- `429 Too Many Requests`: `RATE_LIMIT_EXCEEDED` (Provider 요청 한도 초과)
- `500 Internal Server Error`: `INTERNAL_SERVER_ERROR` (서버 내부 처리 오류)
- `502 Bad Gateway`: `PROVIDER_API_ERROR` (Provider 서버 응답 지연/오류)
