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

### 3) 외부 모바일(같은 Wi-Fi) 접속

1. 백엔드(`:8080`)와 프론트엔드(`:5173`)를 모두 실행합니다.
2. 맥의 로컬 IP를 확인합니다. (예: `192.168.0.21`)
3. 아이폰에서 `http://<로컬IP>:5173`으로 접속합니다.

참고:
- `VITE_API_BASE_URL`이 `http://localhost:8080`이어도, 외부 호스트에서 접속하면 프론트엔드는 자동으로 `/api` 경로를 사용해 Vite 프록시로 백엔드에 연결합니다.
- macOS 방화벽이 켜져 있으면 `node`/`java` 인바운드 허용이 필요할 수 있습니다.

### 4) ngrok으로 배포 유사 환경 테스트

1. 백엔드(`:8080`)와 프론트엔드(`:5173`)를 실행합니다.
2. 프론트엔드 포트만 ngrok으로 오픈합니다.

```bash
ngrok http 5173
```

3. 발급된 HTTPS URL로 접속합니다.

참고:
- 앱은 외부 호스트에서 자동으로 `/api`를 사용하므로, 단일 ngrok 터널(5173)만으로도 API 호출이 Vite 프록시를 통해 백엔드로 전달됩니다.
- ngrok 경고 페이지가 뜨면 `Visit Site`를 눌러 실제 앱으로 진입합니다.

## 주요 스크립트

```bash
npm run lint
npm run lint:structure:report
npm run typecheck
npm run typecheck:test
npm run test
npm run build
npm run lint:structure:changed
npm run check:bundle-budget
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

- `docs/architecture/README.md`
- `docs/architecture/frontend-structure-conventions.md`
- `docs/architecture/server-state-standard.md`
- `docs/architecture/onboarding-frontend.md`
- `docs/architecture/adr/README.md`

## 아키텍처 규칙 (요약)

- `non-ticketing` 코드에서 `@/.../ticketing/*`를 직접 import하지 않습니다.
- `ticketing`의 비-API 레이어(`routes/hooks/components/.../ticketing/*`)는 `@/api/app/*`를 직접 import하지 않습니다.
- API 레이어는 hooks 레이어를 import하지 않습니다.
- `types` 레이어는 runtime 레이어(api/hooks/routes/components)를 import하지 않습니다.
- 스타일은 Tailwind-first를 우선하고, 전역 스타일은 `src/index.css` 기준으로 관리합니다.

## 품질 게이트

- 로컬 권장 순서:
  1. `npm run lint`
  2. `npm run lint:structure:report`
  3. `npm run typecheck`
  4. `npm run typecheck:test`
  5. `npm run test`
  6. `npm run build`
  7. `npm run check:bundle-budget`
- CI:
  - `frontend-structure-check.yml`: changed-only 구조 게이트
  - `frontend-quality-check.yml`: lint/typecheck/test/build/bundle budget

## 리팩토링/기여 가이드

- 큰 변경은 작은 단위로 나누어 커밋합니다.
- 경계 변경 시 `scripts/verify-structure.mjs`와 문서를 같이 수정합니다.
- UI 변경 시 접근성(키보드 탐색, aria 속성, 대화상자 시맨틱)을 함께 점검합니다.
