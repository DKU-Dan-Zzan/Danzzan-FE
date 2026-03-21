# DANZZAN Frontend

단국대 축제 서비스(DANZZAN) 프론트엔드 프로젝트입니다.  
React + TypeScript + Vite 기반이며, 일반 앱(`app`)과 티켓팅(`ticketing`) 도메인이 공존합니다.

## 기술 스택

- React 18
- TypeScript 5
- Vite 7
- Tailwind CSS 4
- Vitest

## 시작하기

### 1) 의존성 설치

```bash
npm ci
```

### 2) 로컬 실행

```bash
npm run dev
```

기본 포트: `5173`

## 주요 스크립트

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run lint:structure:changed
npm run lint:structure:report
```

## 구조 개요

```text
src/
  api/
    app/            # 일반 앱 API
    common/         # 공통 API 유틸/경계
    ticketing/      # 티켓팅 API(브리지 포함)
  components/
    app/
    common/
    ticketing/
  hooks/
    app/
    ticketing/
  routes/
    admin/
    boothmap/
    home/
    mypage/
    notice/
    ticketing/
```

상세 구조/규칙 문서는 아래를 참고하세요.

- `docs/architecture/frontend-structure-conventions.md`
- `docs/architecture/server-state-standard.md`

## 아키텍처 규칙 (요약)

- `non-ticketing` 코드에서 `@/.../ticketing/*`를 직접 import하지 않습니다.
- API 레이어는 hooks 레이어를 import하지 않습니다.
- `types` 레이어는 runtime 레이어(api/hooks/routes/components)를 import하지 않습니다.
- 스타일은 Tailwind-first를 우선하고, 전역 스타일은 `src/index.css` 기준으로 관리합니다.

## 품질 게이트

- 로컬 권장 순서:
  1. `npm run lint`
  2. `npm run typecheck`
  3. `npm run test`
  4. `npm run build`
- CI:
  - `frontend-structure-check.yml`: changed-only 구조 게이트
  - `frontend-quality-check.yml`: lint/typecheck/test/build

## 리팩토링/기여 가이드

- 큰 변경은 작은 단위로 나누어 커밋합니다.
- 경계 변경 시 `scripts/verify-structure.mjs`와 문서를 같이 수정합니다.
- UI 변경 시 접근성(키보드 탐색, aria 속성, 대화상자 시맨틱)을 함께 점검합니다.
