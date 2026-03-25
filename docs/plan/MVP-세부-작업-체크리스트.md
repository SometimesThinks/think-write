# ThinkWrite MVP 세부 작업 체크리스트

- 작성일: 2026-03-22
- 기준 문서: `.omx/plans/mvp-work-breakdown-2026-03-21.md`
- 목적: MVP 큰 계획을 바로 실행 가능한 작업 단위로 세분화한다.
- 범위: 학습 언어 설정, Ghost Complete, `.env` 기반 provider 연동
- 초기 고정값: OpenAI + `gpt-5-nano`

## 0. 선행 기준 확정

### 0-1. completion 요청 최소 payload 확정
- [x] `autocomplete` 전용 요청 필드 최종 확정
  - 1차 MVP 요청 필드:
    - `prefix`: 커서 앞 텍스트
    - `suffix`: 커서 뒤 텍스트
    - `languageSettings`: `{ nativeLanguage, targetLanguage }`
  - 1차 실험 길이 제한:
    - `prefix`: 마지막 1200자까지
    - `suffix`: 처음 300자까지
  - 위 길이 제한은 고정 규칙이 아니라 실험 시작점으로 간주
    - UX 품질 개선이나 토큰 비용 최적화가 필요해지면 조정하면서 재실험
  - 현재 문단 전체(`currentParagraph`)는 1차 MVP에서 제외
  - 인접 문단 맥락(`previousParagraphTail`, `nextParagraphHead`)도 1차 MVP에서 제외하고, 품질 부족 시 추가 검토
- [x] 응답 필드 최종 확정
  - 1차 MVP 성공 응답 필드:
    - `output`: ghost text 후보 문자열
    - `requestId`: 요청 식별자
  - `provider`, `model`은 1차 MVP 성공 응답에서 필수 아님
- [x] 클라이언트/서버 양쪽에서 동일하게 참조할 타입 초안 정리
  - `AutocompleteRequest`
    - `prefix: string`
    - `suffix: string`
    - `languageSettings: { nativeLanguage: string; targetLanguage: string }`
  - `AutocompleteResponse`
    - `output: string`
    - `requestId: string`
- [x] 추가 원칙 정리
  - completion API는 상태를 누적하지 않는 stateless 요청으로 시작
  - 문맥은 매 요청마다 `prefix` / `suffix`로만 전달
  - provider는 서버에서 OpenAI로 고정한다
  - 응답의 성공/실패 구분은 HTTP status + 공통 에러 포맷으로 처리

**완료 기준**
- 구현 중 payload 형태를 다시 추측하지 않아도 된다.
- API 문서와 실제 구현 대상 payload가 어긋나지 않는다.

---

## 1. API / server foundation

### 1-1. API route 골격 생성
- [x] `POST /api/completion` route 추가

### 1-2. 서버 계층 구조 생성
- [x] `src/server/use-cases/`에 completion use-case 추가
- [x] `src/server/services/`에 provider 호출 서비스 추가
- [x] `src/server/providers/`에 provider adapter 추가
- [x] `src/server/lib/`에 공통 route result 유틸 추가

### 1-3. 요청 검증 / 응답 포맷
- [x] completion 입력 검증
- [x] 공통 에러 포맷 적용
- [x] request id 생성/반환 정책 정리
  - route 진입 시 `req_<uuid>` 형식으로 생성
  - 성공/실패 응답 모두에 포함

**완료 기준**
- UI가 호출할 기본 API route가 존재한다.
- provider 세부 구현이 adapter 경계 뒤에 숨겨진다.
- 잘못된 입력은 문서화된 에러 형식으로 반환된다.

---

## 2. provider runtime config

### 2-1. 서버 환경변수 로드 정책
- [ ] `OPENAI_API_KEY` 로드 구현
- [ ] `OPENAI_MODEL` 선택값 처리 또는 기본값 `gpt-5-nano` 고정
- [ ] 서버 전용 환경변수 접근 지점 정리

### 2-2. 오류 처리 연결
- [ ] 환경변수 누락 시 `PROVIDER_NOT_CONFIGURED` 반환
- [ ] 잘못된 key 인증 실패 시 `PROVIDER_AUTH_FAILED` 매핑

**완료 기준**
- API Key는 서버 환경변수에서만 읽는다.
- 클라이언트와 응답 본문에 API Key 원문이 노출되지 않는다.
- 설정 누락과 인증 실패가 전역 오류로 구분된다.

---

## 3. OpenAI adapter

### 3-1. OpenAI 기본 연동
- [ ] OpenAI 요청 payload 구성
- [ ] 기본 모델을 `gpt-5-nano`로 연결
- [ ] autocomplete 용도에 맞는 최소 prompt/context 전략 정리
- [ ] provider 응답을 공통 응답 형태로 매핑

### 3-2. 오류 처리
- [ ] 인증 실패 매핑
- [ ] rate limit / provider 오류 매핑
- [ ] 예상하지 못한 응답 포맷 방어 처리

**완료 기준**
- 유효한 입력이면 OpenAI 응답이 공통 형식으로 반환된다.
- 주요 provider 오류가 표준 에러 코드로 변환된다.

---

## 4. Editor foundation

### 4-1. Tiptap client editor 마운트
- [ ] `app/` 아래에 client editor 컴포넌트 추가
- [ ] Tiptap 기본 에디터 인스턴스 생성
- [ ] 현재 정적 editor shell 영역을 실제 editor로 교체
- [ ] editor placeholder 또는 초기 텍스트 정책 정리

### 4-2. 텍스트 중심 편집 환경 정리
- [ ] 불필요한 리치 텍스트 기능 제거 또는 미노출 처리
- [ ] 문단 입력 중심 레이아웃 구성
- [ ] editor 스타일을 현재 페이지 톤과 맞게 최소 적용

### 4-3. Ghost 연동용 editor 이벤트 표면 마련
- [ ] 현재 문단 텍스트 읽기 방식 정리
- [ ] 커서 위치 읽기 방식 정리
- [ ] `Tab` / `Esc` / 추가 입력 / 커서 이동 이벤트 감지 지점 정리
- [ ] 이후 Ghost Complete 훅이 붙을 수 있는 인터페이스 초안 마련

**완료 기준**
- 사용자가 실제 editor에 입력 가능하다.
- text-only 편집 흐름이 유지된다.
- 현재 문맥과 주요 키 이벤트를 코드에서 읽을 수 있다.

---

## 5. Language settings

### 5-1. 학습 언어 설정 UI
- [ ] 모국어 선택 입력 추가
- [ ] 목표 언어 선택 입력 추가
- [ ] 필수값 미입력 상태 UI 처리
- [ ] 현재 선택값 표시 UI 정리

### 5-2. 언어 설정 상태 관리
- [ ] language settings 로컬 상태 구조 정의
- [ ] 새로고침 후 복원 방식 연결
- [ ] editor/completion 요청 코드에서 설정값 접근 가능하게 연결

**완료 기준**
- 모국어/목표 언어를 입력하고 다시 열어도 복원된다.
- completion 요청 직전에 현재 언어 설정을 안정적으로 읽을 수 있다.

---

## 6. provider config 안내 UI

### 6-1. 고정 provider 정보 노출
- [ ] provider runtime 안내 UI 추가
- [ ] `.env.local` 기반 실행 안내 문구 추가
- [ ] in-app API Key 입력 UI를 만들지 않도록 점검

### 6-2. 전역 설정 상태 안내
- [ ] provider 미설정 상태 문구 또는 안내 위치 정리
- [ ] 설정 누락 시 토스트/배너 정책 연결

**완료 기준**
- 사용자는 provider가 runtime에서 결정된다는 점을 이해할 수 있다.
- API Key 입력/저장/삭제 UI가 앱 안에 존재하지 않는다.
- 설정 누락 시 어디를 수정해야 하는지 안내할 수 있다.

---

## 7. Ghost Complete hook / state

### 7-1. 요청 트리거
- [ ] 입력 debounce 구현
- [ ] 현재 문맥에서 `prefix` / `suffix` 추출
- [ ] 언어 설정을 요청에 포함

### 7-2. 상태 전이 구현
- [ ] `idle` → `loading` 전이
- [ ] `loading` → `visible` 전이
- [ ] `visible` → `accepted` 전이
- [ ] `visible` → `dismissed` / `invalidated` 전이

### 7-3. 경쟁 상태 방어
- [ ] 이전 요청 취소 또는 최신 요청 id 비교 구현
- [ ] 늦게 도착한 응답 무시 처리
- [ ] 커서 이동 시 기존 ghost 무효화

**완료 기준**
- 입력을 멈추면 요청이 발생한다.
- 최신 입력 기준으로만 ghost 상태가 반영된다.
- stale response가 editor 상태를 덮어쓰지 않는다.

---

## 8. Ghost rendering / interaction

### 8-1. Ghost text 렌더링
- [ ] editor 내부 ghost text 표시 방식 선택 및 구현
- [ ] 실제 입력 텍스트와 시각적으로 구분되도록 스타일 적용
- [ ] ghost가 없는 상태 정리

### 8-2. 키보드 상호작용
- [ ] `Tab` 수락 구현
- [ ] `Esc` 무시 구현
- [ ] 추가 입력 시 invalidation 구현
- [ ] 커서 이동 시 invalidation 구현

**완료 기준**
- ghost text가 editor 내부에 자연스럽게 보인다.
- `Tab`, `Esc`, 추가 입력, 커서 이동이 요구사항대로 동작한다.

---

## 9. Error UX

### 9-1. 전역 문제 처리
- [ ] provider 설정 누락용 안내 추가
- [ ] API Key 인증 실패용 toast 추가

### 9-2. editor 맥락 문제 처리
- [ ] ghost 요청 실패 inline notice 위치 결정
- [ ] 무효화는 무표시 처리할지 여부 반영
- [ ] inline notice가 과하게 반복되지 않도록 최소 정책 적용

**완료 기준**
- 인증 실패나 provider 설정 누락 같은 전역 문제만 toast/전역 안내로 뜬다.
- ghost 흐름 문제는 editor 근처에서만 처리된다.
- 정상 상태에서는 ghost text가 중심이 된다.

---

## 10. 검증

### 10-1. 정적 검증
- [ ] `npm run lint`
- [ ] `npm run typecheck`

### 10-2. 수동 시나리오 검증
- [ ] 언어 설정 저장/복원 확인
- [ ] `.env.local` 미설정 상태 오류 확인
- [ ] 유효한 OpenAI Key로 completion 요청 성공 확인
- [ ] `gpt-5-nano` 제안 품질 메모

**완료 기준**
- 정적 검증이 통과한다.
- 환경변수 설정 전/후 시나리오가 모두 확인된다.
- `gpt-5-nano` 유지 여부 판단 근거가 남는다.
