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
일반 사용자 페이지(홈/공지/타임테이블/부스맵/마이페이지), 관리자 페이지, 티켓팅 및 팔찌 배부 운영 화면을 제공합니다.

- **언어 / 버전**: TypeScript 5.9, React 18.3
- **프레임워크**: Vite 7, React Router 6
- **스타일링**: Tailwind CSS 4 + CSS 변수 토큰
- **상태 관리**: `useSyncExternalStore` 기반 커스텀 auth store
- **HTTP**: axios + 공통 인증 재시도 래퍼(`withAuthRetry`)
- **테스트**: Vitest
- **기타**: PWA(vite-plugin-pwa), Mapbox GL

---

## 빌드 · 테스트 · 실행

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev

# 타입 검사
npm run typecheck

# 테스트
npm run test

# 린트
npm run lint

# 프로덕션 빌드
npm run build
```

---

## 디렉토리 레이아웃

```text
src/
├── api/
│   ├── common/                 # 공통 인증/에러/HTTP 유틸
│   └── ticketing/
│       ├── generated/          # OpenAPI 생성 코드 (직접 수정 금지)
│       ├── authApi.ts
│       ├── adminAuthApi.ts
│       └── wristbandApi.ts
├── components/
│   ├── layout/                 # 일반/관리자 공통 레이아웃
│   └── ticketing/              # 티켓팅 전용 UI 컴포넌트
├── hooks/
│   ├── useAdminAuth.ts
│   └── ticketing/useAuth.ts
├── routes/
│   ├── admin/                  # 공지/광고 관리자
│   ├── ticketing/              # 티켓팅 + 팔찌 배부
│   └── common/                 # authGuard 등 공통 라우팅 유틸
├── store/ticketing/authStore.ts
├── lib/                        # env/mapper/유틸
└── utils/ticketing/env.ts
```

---

## 라우팅 · 인증 규칙

### 앱 라우팅
- 루트 라우팅은 `src/App.tsx`에서 관리합니다.
- 티켓팅 앱은 `/ticket/*`로 분리되어 `src/routes/ticketing/TicketingApp.tsx`에서 별도 라우팅합니다.

### 인증/인가
- 인증 상태 단일 소스는 `authStore`입니다 (`src/store/ticketing/authStore.ts`).
- 권한 판정은 `isRoleAuthenticated`를 사용하고, **토큰의 role 클레임을 우선**합니다.
- 관리자 로그인은 티켓팅 기준(`POST /user/login`, body: `studentId`)을 사용합니다.
- 리다이렉트는 반드시 `buildReturnTo`, `buildLoginRedirectPath`, `resolveScopedRedirect`를 사용해 오픈 리다이렉트 위험을 방지합니다.

### 티켓팅 관리자 보호 라우트
- `/ticket/admin/wristband`는 live 모드에서 관리자 토큰이 없으면 `TokenRequired`로 이동합니다.
- mock 모드에서는 관리자 보호 라우트를 우회할 수 있습니다.

---

## 환경 변수 · 프록시

- `VITE_API_BASE_URL` (우선)
- `VITE_API_URL` (레거시 fallback)
- `VITE_TICKETING_API_BASE_URL`
- `VITE_BACKEND_TARGET` (`serverdb` | `compose`)
- `VITE_API_MODE` (`live` | `mock`)
- `VITE_DEV_ACCESS_TOKEN` (개발 편의용)

개발 서버 프록시는 `vite.config.ts`에서 `/api -> 백엔드`로 연결되며, 경로의 `/api` 접두사는 rewrite로 제거됩니다.

---

## 코드 컨벤션

### TypeScript
- `strict` 모드를 유지합니다.
- 경로 별칭 `@/* -> src/*`를 사용합니다.
- `any` 도입은 지양하고, 기존 DTO/Model 타입을 우선 재사용합니다.

### API 계층
- 화면 컴포넌트에서 axios를 직접 호출하지 말고 `src/api/**` 레이어를 사용합니다.
- 인증 재시도/401 처리 로직은 `api/common` 계층에서 일관되게 처리합니다.
- `src/api/ticketing/generated/**`는 생성 코드이므로 직접 수정하지 않습니다.

### 스타일/디자인
- 하드코딩 색상보다 CSS 변수 토큰(`--text`, `--accent`, `--border-base` 등)을 우선 사용합니다.
- 티켓팅 화면은 `src/routes/ticketing/index.css`의 토큰 체계를 따릅니다.
- 기존 디자인 시스템이 있는 화면에서는 톤/간격/타이포를 유지합니다.

---

## 테스트/검증 체크리스트

변경 제출 전 최소 아래를 수행합니다.

1. `npm run typecheck`
2. 변경 범위 테스트 실행 (`npm run test -- <file>` 또는 `npm run test`)
3. 인증/라우팅 변경 시 리다이렉트 및 role 판정 동작 확인

---

## 주의 사항

1. `authStore.clear()`는 관리자/학생 세션 모두를 제거하므로 사용 위치를 신중히 선택합니다.
2. 권한 관련 버그가 의심되면 `session.role`만 보지 말고 JWT role 클레임 파싱 경로를 함께 확인합니다.
3. `/admin`과 `/ticket/admin`은 화면은 다르지만 인증 스토어를 공유하므로 세션 복구/로그아웃 영향 범위를 함께 고려합니다.
4. PWA 서비스워커가 활성화되어 있어 정적 리소스 변경 시 캐시 영향(강력 새로고침)을 염두에 둡니다.
