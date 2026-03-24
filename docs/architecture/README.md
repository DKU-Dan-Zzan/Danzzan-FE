# Frontend Architecture Docs Index

## 목적
이 디렉터리는 프론트엔드 구조 규칙, 서버 상태 표준, ADR, 온보딩 가이드를 한 곳에서 관리한다.
새 규칙/결정은 반드시 해당 문서를 함께 갱신해 코드와 문서의 드리프트를 막는다.

## 문서 읽기 순서(신규 인원 권장)
1. `docs/architecture/frontend-structure-conventions.md`
2. `docs/architecture/server-state-standard.md`
3. `docs/architecture/adr/README.md`
4. `docs/architecture/onboarding-frontend.md`

## 문서-코드 동기화 규칙
- import 경계/레이어 정책이 바뀌면 `frontend-structure-conventions.md`와 `scripts/verify-structure.mjs`를 함께 수정한다.
- 서버 상태 정책(query key, retry, staleTime)이 바뀌면 `server-state-standard.md`를 같은 PR에서 수정한다.
- 팀 공통 의사결정(장기 유지 대상)이 생기면 `docs/architecture/adr/`에 ADR을 추가한다.
- 온보딩 절차(검증 커맨드, 핵심 시나리오)가 바뀌면 `onboarding-frontend.md`를 수정한다.

## 문서 리뷰 체크리스트
PR 리뷰 시 아래 항목을 함께 확인한다.

1. 코드 변경과 관련된 architecture 문서가 같은 PR에 포함되었는가
2. 구조 게이트 규칙 설명과 `scripts/verify-structure.mjs` 구현이 일치하는가
3. 품질 게이트 명령어(`lint`, `typecheck`, `test`, `build`, `check:bundle-budget`)가 최신 상태인가
4. 인증/라우팅 규칙의 canonical 경로가 실제 코드 경로와 일치하는가
5. ADR의 상태(Status), 결정일(Date), 영향(Consequences)이 누락 없이 기록되었는가

## 소유/유지보수
- 기본 오너: FE 챕터
- 변경 단위: 규칙/결정별 small PR
- 문서 포맷: Markdown, 한국어 우선
