# ThinkWrite API Spec

## 1. 원칙

- 모든 입력은 서버에서 검증한다.
- 응답 형식은 provider 세부 구현과 무관하게 통일한다.
- 에러 코드는 프론트엔드가 처리 가능한 형태로 (HTTP 상태 코드와 함께) 표준화한다.
- 초기 MVP 기본 provider는 OpenAI, 기본 모델은 `gpt-5-nano`다.
- provider/API Key는 API 요청 본문이 아니라 서버 환경변수에서 관리한다.
- `requestId`는 route 진입 시 생성하고, 성공/실패 응답 모두에 포함한다.

---

## 2. POST /api/completion

### 목적
단일 완성형(Non-streaming) AI 자동완성 결과를 반환한다.

### 요청 예시

```json
{
  "prefix": "I went to the",
  "suffix": " yesterday and it was fun.",
  "languageSettings": {
    "nativeLanguage": "Korean",
    "targetLanguage": "English"
  }
}
```

### 요청 규칙

- `prefix`: 문자열, 1차 실험값은 마지막 1200자까지
- `suffix`: 문자열, 1차 실험값은 처음 300자까지
- `languageSettings.nativeLanguage`: 필수 문자열
- `languageSettings.targetLanguage`: 필수 문자열
- provider는 서버에서 OpenAI로 고정해 사용한다.

### 응답 예시 (200 OK)

```json
{
  "output": "park",
  "requestId": "req_123"
}
```

---

## 3. 서버 runtime 설정

### 필수 환경변수

- `OPENAI_API_KEY`

### 선택 환경변수

- `OPENAI_MODEL`
  - 미설정 시 기본값 `gpt-5-nano`

### 동작 원칙

- API Key는 서버 `.env.local`에서만 읽는다.
- 클라이언트는 API Key 원문을 알 수 없다.
- 환경변수 누락 시 completion API는 전역 설정 오류를 반환한다.

---

## 4. 공통 에러 형식

모든 API는 에러 발생 시 적절한 HTTP 상태 코드와 함께 다음 형식의 JSON을 반환한다.

```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "prefix and suffix must be strings.",
    "status": 400,
    "requestId": "req_123"
  }
}
```

**주요 상태 코드 및 에러 코드 예시:**
- `400 Bad Request`: `INVALID_PARAMETERS` (입력값 누락 및 형식 오류)
- `401 Unauthorized`: `PROVIDER_AUTH_FAILED` (환경변수 key가 유효하지 않음)
- `429 Too Many Requests`: `RATE_LIMIT_EXCEEDED` (Provider 요청 한도 초과)
- `500 Internal Server Error`: `PROVIDER_NOT_CONFIGURED`, `INTERNAL_SERVER_ERROR`
- `502 Bad Gateway`: `PROVIDER_API_ERROR` (Provider 서버 응답 지연/오류)
- `501 Not Implemented`: `NOT_IMPLEMENTED` (route skeleton은 연결됐지만 provider 구현 전 단계)
