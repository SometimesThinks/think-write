# ThinkWrite MVP 세부 작업 체크리스트

- 작성일: 2026-03-22
- 기준 문서: `.omx/plans/mvp-work-breakdown-2026-03-21.md`
- 목적: MVP 큰 계획을 바로 실행 가능한 작업 단위로 세분화한다.
- 범위: 학습 언어 설정, Ghost Complete, BYOK 기반 provider 연동
- 초기 고정값: OpenAI + `gpt-5-nano`

## 0. 선행 기준 확정

### 0-1. completion 요청 최소 payload 확정
- [ ] `autocomplete` 전용 요청 필드 최종 확정
  - 후보: `prefix`, `suffix`, `paragraphContext`, `languageSettings`, `provider`
- [ ] 응답 필드 최종 확정
  - 후보: `output`, `provider`, `model`, `requestId`
- [ ] 클라이언트/서버 양쪽에서 동일하게 참조할 타입 초안 정리

**완료 기준**
- 구현 중 payload 형태를 다시 추측하지 않아도 된다.
- API 문서와 실제 구현 대상 payload가 어긋나지 않는다.

---

## 1. Editor foundation

### 1-1. Tiptap client editor 마운트
- [ ] `app/` 아래에 client editor 컴포넌트 추가
- [ ] Tiptap 기본 에디터 인스턴스 생성
- [ ] 현재 정적 editor shell 영역을 실제 editor로 교체
- [ ] editor placeholder 또는 초기 텍스트 정책 정리

### 1-2. 텍스트 중심 편집 환경 정리
- [ ] 불필요한 리치 텍스트 기능 제거 또는 미노출 처리
- [ ] 문단 입력 중심 레이아웃 구성
- [ ] editor 스타일을 현재 페이지 톤과 맞게 최소 적용

### 1-3. Ghost 연동용 editor 이벤트 표면 마련
- [ ] 현재 문단 텍스트 읽기 방식 정리
- [ ] 커서 위치 읽기 방식 정리
- [ ] `Tab` / `Esc` / 추가 입력 / 커서 이동 이벤트 감지 지점 정리
- [ ] 이후 Ghost Complete 훅이 붙을 수 있는 인터페이스 초안 마련

**완료 기준**
- 사용자가 실제 editor에 입력 가능하다.
- text-only 편집 흐름이 유지된다.
- 현재 문맥과 주요 키 이벤트를 코드에서 읽을 수 있다.

---

## 2. Language settings

### 2-1. 학습 언어 설정 UI
- [ ] 모국어 선택 입력 추가
- [ ] 목표 언어 선택 입력 추가
- [ ] 필수값 미입력 상태 UI 처리
- [ ] 현재 선택값 표시 UI 정리

### 2-2. 언어 설정 상태 관리
- [ ] language settings 로컬 상태 구조 정의
- [ ] 새로고침 후 복원 방식 연결
- [ ] editor/completion 요청 코드에서 설정값 접근 가능하게 연결

**완료 기준**
- 모국어/목표 언어를 입력하고 다시 열어도 복원된다.
- completion 요청 직전에 현재 언어 설정을 안정적으로 읽을 수 있다.

---

## 3. BYOK settings

### 3-1. BYOK 입력 UI
- [ ] provider 선택 UI 추가
- [ ] API Key 입력 필드 추가
- [ ] 저장 버튼 / 삭제 버튼 / 등록 상태 영역 추가
- [ ] 원문 Key 재노출 금지 UI 반영

### 3-2. BYOK 상태 조회/저장 연결
- [ ] 등록 상태 조회 호출 연결
- [ ] 저장 요청 연결
- [ ] 삭제 요청 연결
- [ ] 저장 중 / 저장 실패 / 미등록 상태 UI 처리

### 3-3. 보안 정책 반영
- [ ] 브라우저 localStorage 등에 API Key 원문을 저장하지 않도록 점검
- [ ] 등록 여부만 보여주고 원문은 다시 표시하지 않도록 점검

**완료 기준**
- 사용자가 provider/API Key를 등록하고 삭제할 수 있다.
- 화면에는 등록 상태만 보이고 원문 Key는 다시 보이지 않는다.
- 클라이언트에 원문 Key 영구 저장 로직이 없다.

---

## 4. API / server foundation

### 4-1. API route 골격 생성
- [ ] `POST /api/completion` route 추가
- [ ] `POST /api/keys` route 추가
- [ ] `GET /api/keys` route 추가
- [ ] `DELETE /api/keys` route 추가

### 4-2. 서버 계층 구조 생성
- [ ] `src/server/use-cases/`에 completion use-case 추가
- [ ] `src/server/services/`에 key 관리 / provider 호출 서비스 추가
- [ ] `src/server/providers/`에 OpenAI adapter 추가
- [ ] `src/server/lib/`에 공통 유틸 또는 타입 추가

### 4-3. 요청 검증 / 응답 포맷
- [ ] completion 입력 검증
- [ ] keys 입력 검증
- [ ] 공통 에러 포맷 적용
- [ ] request id 생성/반환 정책 정리

**완료 기준**
- UI가 호출할 기본 API route가 존재한다.
- provider 세부 구현이 adapter 경계 뒤에 숨겨진다.
- 잘못된 입력은 문서화된 에러 형식으로 반환된다.

---

## 5. API Key 영구 저장

### 5-1. 저장 정책 구현
- [ ] API Key 암호화 저장 방식 결정 및 구현
- [ ] 저장소 추상화 또는 최소 저장 모듈 작성
- [ ] 등록 상태 조회 시 원문 비재노출 보장
- [ ] 삭제 시 실제 저장값 제거 보장

### 5-2. provider 호출 연동
- [ ] completion 요청 시 저장된 API Key 조회
- [ ] provider 호출 직전에만 복호/사용
- [ ] 인증 실패 시 `PROVIDER_AUTH_FAILED`로 매핑

**완료 기준**
- API Key는 서버에 암호화된 형태로 저장된다.
- GET 응답이나 UI에 원문이 노출되지 않는다.
- 삭제 후에는 provider 호출에 더 이상 사용되지 않는다.

---

## 6. OpenAI adapter

### 6-1. OpenAI 기본 연동
- [ ] OpenAI 요청 payload 구성
- [ ] 기본 모델을 `gpt-5-nano`로 연결
- [ ] autocomplete 용도에 맞는 최소 prompt/context 전략 정리
- [ ] provider 응답을 공통 응답 형태로 매핑

### 6-2. 오류 처리
- [ ] 인증 실패 매핑
- [ ] rate limit / provider 오류 매핑
- [ ] 예상하지 못한 응답 포맷 방어 처리

**완료 기준**
- 유효한 입력이면 OpenAI 응답이 공통 형식으로 반환된다.
- 주요 provider 오류가 표준 에러 코드로 변환된다.

---

## 7. Ghost Complete hook / state

### 7-1. 요청 트리거
- [ ] 입력 debounce 구현
- [ ] 현재 문맥에서 `prefix` / `suffix` / `paragraphContext` 추출
- [ ] 언어 설정 / provider 설정을 요청에 포함

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
- [ ] API Key 인증 실패용 toast 추가
- [ ] provider 미등록 상태용 전역 안내 추가

### 9-2. editor 맥락 문제 처리
- [ ] ghost 요청 실패 inline notice 위치 결정
- [ ] 무효화는 무표시 처리할지 여부 반영
- [ ] inline notice가 과하게 반복되지 않도록 최소 정책 적용

**완료 기준**
- 인증 실패 같은 전역 문제만 toast로 뜬다.
- ghost 흐름 문제는 editor 근처에서만 처리된다.
- 정상 상태에서는 ghost text가 중심이 된다.

---

## 10. 검증

### 10-1. 정적 검증
- [ ] `npm run lint`
- [ ] `npm run typecheck`

### 10-2. 수동 시나리오 검증
- [ ] 언어 설정 저장/복원 확인
- [ ] API Key 등록/조회 상태/삭제 확인
- [ ] 미등록 상태에서 completion 요청 시 오류 처리 확인
- [ ] 유효한 Key 등록 후 ghost text 표시 확인
- [ ] `Tab` 수락 / `Esc` 무시 / 추가 입력 무효화 확인
- [ ] 늦은 응답 무시 확인

### 10-3. 품질 확인
- [ ] `gpt-5-nano` 제안 품질 메모
- [ ] 필요 시 상위 모델 fallback 검토 여부 기록

**완료 기준**
- lint/typecheck 통과
- 핵심 사용자 흐름이 수동 검증에서 재현된다.
- `gpt-5-nano` 유지 여부 판단 근거가 남는다.

---
