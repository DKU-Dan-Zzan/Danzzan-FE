# GitHub Copilot Instructions

## Language Rule
- **항상 한국어로 답변합니다.**
- 입력 언어와 관계없이 답변은 한국어를 사용합니다.

## Code Review Rule
- 코드 리뷰나 변경 제안 시 **항상 `suggestion` 블록을 포함**합니다.
- 설명만 제공하지 말고, **실제 코드 변경안을 `suggestion` 블록으로 제시**합니다.
- `suggestion` 블록 안에는 **코드만** 작성합니다.
- 설명은 `suggestion` 블록 **밖에** 작성합니다.

---

## 프로젝트 개요

**Danzzan-FE**는 단국대학교 축제("단짠") 운영을 위한 프론트엔드 애플리케이션입니다.
일반 사용자 앱(`app`)과 티켓팅 운영 앱(`ticketing`)이 한 저장소에서 공존합니다.

- **언어 / 버전**: TypeScript 5.9, React 18.3
- **프레임워크**: Vite 7, React Router 6
- **스타일링**: Tailwind CSS 4 + CSS 변수 토큰(`src/index.css`)
- **상태 관리**: `useSyncExternalStore` 기반 커스텀 auth store
- **서버 상태**: TanStack Query(`useAppQuery`, `appQueryKeys`)
- **HTTP**: axios + 공통 인증 재시도 래퍼(`withAuthRetry`)
- **테스트**: Vitest
- **기타**: PWA(vite-plugin-pwa), Mapbox GL

---

## 빌드 · 테스트 · 실행

```bash
# 의존성 설치
npm ci

# 개발 서버
npm run dev

# 정적 검증
npm run lint
npm run lint:structure:report
npm run typecheck
npm run typecheck:test
npm run test

# 프로덕션 빌드 + 번들 예산
npm run build
npm run check:bundle-budget
```

---

## 디렉토리 레이아웃

```text
src/
├── api/
│   ├── app/                    # 일반 앱 API
│   ├── common/                 # 공통 인증/에러/HTTP 유틸
│   └── ticketing/              # 티켓팅 API(+ app API adapter)
├── components/
│   ├── app/
│   ├── common/
│   └── ticketing/
├── hooks/
│   ├── app/
│   │   └── admin/              # useAdminNotices, useAdminAds 등
│   └── ticketing/
├── routes/
│   ├── admin/
│   ├── boothmap/
│   ├── home/
│   ├── mypage/
│   ├── notice/
│   └── ticketing/
├── store/
│   ├── common/authStore.ts     # 인증 상태 단일 소스(canonical)
│   └── ticketing/authStore.ts  # 호환용 re-export bridge
├── lib/
├── types/
└── utils/
```

구조 규칙의 canonical 문서는 `docs/architecture/frontend-structure-conventions.md`입니다.

---

## 라우팅 · 인증 규칙

### 앱 라우팅
- 루트 라우팅은 `src/App.tsx`에서 관리합니다.
- 티켓팅 앱은 `/ticket/*`로 분리되어 `src/routes/ticketing/TicketingApp.tsx`에서 별도 라우팅합니다.

### 인증/인가
- 인증 상태 단일 소스는 `authStore`이며 canonical 경로는 `src/store/common/authStore.ts`입니다.
- `src/store/ticketing/authStore.ts`는 레거시 소비처를 위한 bridge(re-export)입니다.
- 권한 판정은 `isRoleAuthenticated`를 사용하고, **토큰 role 클레임을 우선**합니다.
- 리다이렉트는 반드시 `buildReturnTo`, `buildLoginRedirectPath`, `resolveScopedRedirect`를 사용해 오픈 리다이렉트 위험을 방지합니다.

### 티켓팅 관리자 보호 라우트
- `/ticket/admin/wristband`는 live 모드에서 관리자 토큰이 없으면 `TokenRequired`로 이동합니다.
- mock 모드에서는 관리자 보호 라우트를 우회할 수 있습니다.

---

## 구조 경계 규칙

- 구조 게이트는 `scripts/verify-structure.mjs`에서 관리합니다.
- `ticketing`의 비-API 레이어(`routes/hooks/components/.../ticketing/*`)는 `@/api/app/*`를 직접 import하지 않습니다.
- app API가 필요하면 `src/api/ticketing/*` adapter를 통해 우회합니다.
- `components/hooks/lib/types`의 import 방향 규칙은 `docs/architecture/frontend-structure-conventions.md`를 따릅니다.

---

## 스타일 · 접근성 규칙

- 스타일은 Tailwind-first를 원칙으로 하고, 전역 토큰은 `src/index.css`에서 관리합니다.
- 신규 전역 selector 또는 raw hex 도입은 구조 문서의 정책을 따릅니다.
- 상호작용 UI는 `button`/`a` 등 시맨틱 요소를 우선 사용하고, icon-only 버튼은 `aria-label`을 필수로 둡니다.
- ESLint `jsx-a11y` 규칙 위반은 PR 머지 전에 모두 해소합니다.

---

## 문서 규칙

아키텍처/온보딩 문서의 canonical 위치는 `docs/architecture/*`입니다.

- 구조/경계 변경: `frontend-structure-conventions.md` 동시 수정
- 서버 상태 정책 변경: `server-state-standard.md` 동시 수정
- 장기 의사결정 추가/변경: `docs/architecture/adr/*`에 ADR 추가
- 신규 인원 온보딩 플로우 변경: `docs/architecture/onboarding-frontend.md` 동시 수정

문서 인덱스와 리뷰 체크리스트는 `docs/architecture/README.md`를 사용합니다.

---

## PR 전 체크리스트

1. `npm run lint`
2. `npm run lint:structure:report`
3. `npm run typecheck`
4. `npm run typecheck:test`
5. `npm run test`
6. `npm run build`
7. `npm run check:bundle-budget`
8. 인증/라우팅 변경 시 핵심 사용자 흐름(로그인, 리다이렉트, 관리자 진입) 수동 점검
