# Frontend Structure Conventions (PR-G0)

## 1) 목적/범위
이 문서는 `DANZ-228` 기준으로 프론트엔드 협업 규칙을 고정한다.
범위는 아래 파일/디렉터리에 대한 구조/명명/레이어/스타일 규칙이다.

- 적용 범위: `src/**`, `src/index.css`, `src/routes/ticketing/index.css`
- 적용 단계: G0(규칙 고정), G1~G5(실제 리팩토링)

## 2) 정책 결정값(고정)
- URL 세그먼트: G0에서는 현행 유지(`myticket` 포함), G1에서 통일 정책 적용.
- 파일명 예외: `src/components/common/ui/*` 소문자 파일명은 allowlist로 예외 허용.
- Map SDK 스타일: Tailwind 우선 원칙 유지, SDK 제약 인라인/런타임 스타일은 최소 허용 후 문서화.
- CSS 스코프: `src/index.css`(앱 전역) + `src/routes/ticketing/index.css`(티켓팅 전역) 분리 유지, G3 이후 통합 재검토.

## 3) 명명 규칙
### 3.1 디렉터리명
- `src/**` 디렉터리명은 kebab-case를 기본으로 한다.
- 예외: `__tests__`.

### 3.2 컴포넌트 파일명
- `src/components/**`의 컴포넌트 파일명은 PascalCase를 기본으로 한다.
- 예외: `src/components/common/ui/*` (외부 템플릿/업스트림 호환 목적).

### 3.3 URL 세그먼트
- G0: 기존 URL 동작은 변경하지 않는다.
- G1: kebab-case 통일 정책을 적용한다.

### 3.4 G1 적용 상태 (2026-03-21)
- canonical: `/ticket/my-ticket`
- legacy redirect 유지:
  - `/ticket/myticket` -> `/ticket/my-ticket`
  - `/myticket` -> `/ticket/my-ticket`

### 3.5 G2 적용 상태 (2026-03-21)
- 일반앱 canonical 레이어를 `app` 네임스페이스로 1차 정렬:
  - `src/api/app/**`
  - `src/hooks/app/**`
  - `src/types/app/**`
  - `src/utils/app/**`
  - `src/components/app/**`
- 기존 경로는 bridge(`@deprecated`)를 유지한다.
- bridge 제거는 G4에서 일괄 수행한다.

### 3.6 G3 적용 상태 (2026-03-21)
- boothmap 전역 클래스 의존 제거:
  - `.boothmap-chip` -> 컴포넌트 내부 Tailwind 조건부 클래스로 치환
  - `.boothmap-mode-toggle-button` -> 컴포넌트 내부 Tailwind 조건부 클래스로 치환
- `.boothmap-name-popup*` selector는 사용처 부재를 확인하고 `src/index.css`에서 제거.
- `src/routes/notice/Notice.tsx`의 raw hex class를 semantic Tailwind 클래스(`text-blue-600`, `border-gray-200` 등)로 1차 치환.

### 3.7 G4 적용 상태 (2026-03-21)
- G2에서 도입했던 일반앱 bridge 소비처 import를 canonical 경로로 0화.
- bridge 파일 35개 제거 완료.
- dead path 제거:
  - `src/routes/home/components`
  - `src/routes/boothmap/components`
  - `src/routes/boothmap/constants`
  - `src/routes/boothmap/types`
  - `src/routes/timetable/components`

## 4) 폴더 배치 규칙
일반 앱과 ticketing은 레이어 경계를 유지한 채 공존한다.

- 일반 앱 레이어: `src/{api,components,hooks,lib,routes,store,types,utils}`
- ticketing 레이어: `src/{api,components,hooks,lib,routes,store,types,utils}/ticketing/**`
- route 전용 UI는 `src/routes/*/components`에 둘 수 있으나, G2에서 공통 레이어 정렬을 목표로 한다.

G2에서 적용한 canonical 경로(일반앱):
- API: `src/api/app/{auth,admin,boothmap,home,notice,timetable}/**`
- Hooks: `src/hooks/app/{admin,boothmap}/**`
- Types: `src/types/app/{boothmap,timetable}/**`
- Utils: `src/utils/app/boothmap/**`, `src/utils/app/timetable.ts`
- Components: `src/components/app/{home,boothmap,timetable}/**`

G2 bridge 경로는 G4에서 모두 제거 완료.

## 5) 레이어 경계(import) 규칙
아래 규칙은 금지 규칙이며, 위반 시 게이트를 실패 처리한다.

- `LAYER_COMPONENTS_NO_ROUTES_IMPORT`
  - `src/components/**` -> `@/routes/*` 또는 routes 상대경로 import 금지
- `LAYER_HOOKS_NO_ROUTES_IMPORT`
  - `src/hooks/**` -> `@/routes/*` 또는 routes 상대경로 import 금지
- `LAYER_TYPES_NO_RUNTIME_IMPORT`
  - `src/types/**` -> `@/api|@/hooks|@/routes|@/components` import 금지

추가 금지 규칙:
- `LEGACY_IMPORT_FORBIDDEN`
  - `@/components/ticketing/common/ui/`
  - `@/components/ticketing/ticketing/`
  - `@/components/ticketing/common/figma/`

## 6) Tailwind-first 스타일 규칙
### 6.1 원칙
- 스타일은 Tailwind-first로 작성한다.
- `index.css`는 전역 필수 항목만 허용한다.

허용 전역 범주:
- reset/base
- token(css variable)
- safe-area
- 3rd-party override

### 6.2 금지
- 신규 전역 클래스 추가 금지(allowlist 예외만 허용)
- 신규 raw hex 추가 금지(토큰 경유만 허용)

### 6.3 현재 기준선(참고)
- `src/index.css` 전역 클래스 2종:
  - `font-cute`
  - `scrollbar-hide`
- 제거 완료:
  - `boothmap-chip`
  - `boothmap-mode-toggle-button`
  - `boothmap-name-popup*`
- 잔여 raw hex 누적은 G3 이후에도 단계적으로 축소한다(특히 `index.css`, `src/routes/ticketing/index.css`).

## 7) 예외(allowlist) 정책
allowlist 파일: `config/structure-allowlist.json`

각 항목 필수 필드:
- `ruleId`
- `target`
- `reason`
- `owner`
- `expiresAt` (`YYYY-MM-DD`)

원칙:
- 최소 허용만 등록한다.
- 만료일이 지난 예외는 자동 유효하지 않다.
- 예외 없이 해결 가능한 항목은 G1~G4에서 제거한다.

## 8) 변경 도입 전략 (changed-only -> strict)
- G0: changed-only 게이트를 PR에 적용한다.
  - 변경 파일에 대해서만 구조/레이어/스타일 신규 위반을 차단한다.
- G1~G3: 위반 밀도가 높은 영역부터 순차 치환/정리한다.
- G4~G5: bridge 제거 완료 상태에서 allowlist 축소 후 strict 모드 전환 준비.
- strict 전체 강제는 기존 위반 정리 후 활성화한다.

## 9) G1~G5 연계 계획
- G1: URL/파일명 명명 통일 정책 적용
- G2: 일반앱 레이어 경계 정렬 (ticketing 경계 기준 준수)
- G3: 핵심 스타일 Tailwind 전환 (`boothmap-chip`, `boothmap-mode-toggle-button` 우선)
- G4: legacy/bridge/dead path 제거, 전역 CSS 최소화
- G5: lint/typecheck/test/build + 핵심 화면 회귀 검증
