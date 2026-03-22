# Frontend Onboarding Playbook

## 0. 목표
신규 합류자가 1~2일 내에 다음을 수행할 수 있도록 한다.
- 로컬 환경 실행/검증
- app/ticketing 경계 이해
- 인증/라우팅/서버상태 핵심 흐름 점검
- 안전한 변경(PR + 품질게이트 통과)

## 1. Day 0 (로컬 준비)
1. Node 버전 확인(`node -v`)
2. 의존성 설치(`npm ci`)
3. 개발 서버 실행(`npm run dev`)
4. 기본 정적 검증 실행
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`

## 2. Day 1 (구조 파악)
### 2.1 먼저 읽을 문서
1. `docs/architecture/frontend-structure-conventions.md`
2. `docs/architecture/server-state-standard.md`
3. `docs/architecture/adr/README.md`

### 2.2 코드 진입점
- 라우팅: `src/App.tsx`, `src/routes/ticketing/TicketingApp.tsx`
- 인증 저장소(canonical): `src/store/common/authStore.ts`
- 서버 상태 key: `src/lib/query/queryKeys.ts`
- 구조 게이트: `scripts/verify-structure.mjs`

## 3. 핵심 개발 규칙
1. `ticketing`의 비-API 레이어에서 `@/api/app/*`를 직접 import하지 않는다.
2. 공통 인증 상태는 `src/store/common/authStore.ts`를 기준으로 본다.
3. 서버 상태는 `useEffect + 직접 API 호출`보다 TanStack Query 표준을 우선한다.
4. UI 상호작용 요소는 시맨틱 태그(`button`, `a`)와 `aria-label`을 기본으로 점검한다.

## 4. 변경 제출 전 검증
아래 순서를 기본 게이트로 사용한다.

1. `npm run lint`
2. `npm run lint:structure:report`
3. `npm run typecheck`
4. `npm run typecheck:test`
5. `npm run test:coverage`
6. `npm run build`
7. `npm run check:bundle-budget`

## 5. 수동 시나리오 점검(최소)
1. 로그인/로그아웃 후 리다이렉트 경로 정상 여부
2. 관리자 페이지(`/admin`, `/ticket/admin/*`) 접근 제어
3. 티켓팅 큐 진입/새로고침/복귀 동작
4. 공지/홈 화면 로딩-에러-재시도 UI 동작
5. 키보드 탭 이동과 스크린리더 라벨(아이콘 버튼 중심)

## 6. 문서 갱신 트리거
- 구조 규칙 변경: `frontend-structure-conventions.md`와 동시 수정
- 서버 상태 정책 변경: `server-state-standard.md`와 동시 수정
- 장기 결정 확정: `docs/architecture/adr/`에 ADR 추가
- 온보딩 단계 변경: 본 문서 업데이트
