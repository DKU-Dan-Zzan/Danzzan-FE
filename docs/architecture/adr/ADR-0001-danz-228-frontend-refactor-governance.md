# ADR-0001: DANZ-228 Frontend 리팩토링 거버넌스 고정

- Date: 2026-03-22
- Status: Accepted
- Deciders: FE Chapter
- Related: DANZ-228

## Context
DANZ-228 리팩토링 과정에서 app/ticketing 경계, 서버 상태 처리, 스타일 토큰, 품질 게이트가 동시에 변경되었다.
코드 변경만으로는 팀 합의가 장기 유지되지 않아 신규 인원 온보딩과 후속 PR에서 규칙 드리프트가 발생할 위험이 있었다.

## Decision
다음 항목을 문서와 게이트로 고정한다.

1. 구조 경계 정책은 `docs/architecture/frontend-structure-conventions.md`를 canonical로 사용한다.
2. 서버 상태 정책은 `docs/architecture/server-state-standard.md`를 canonical로 사용한다.
3. 의사결정 기록은 `docs/architecture/adr/`에 ADR 형식으로 남긴다.
4. 온보딩 기본 경로는 `docs/architecture/onboarding-frontend.md`로 통일한다.
5. PR 검증 기준은 아래 게이트를 기준으로 통일한다.
   - `npm run lint`
   - `npm run lint:structure:report`
   - `npm run typecheck`
   - `npm run typecheck:test`
   - `npm run test:coverage`
   - `npm run build`
   - `npm run check:bundle-budget`

## Consequences
- 기대효과
  - 규칙 변경 시 문서 누락을 줄이고, 신규 인원의 구조 이해 시간을 단축한다.
  - 경계 위반/회귀를 코드리뷰 감에 의존하지 않고 게이트 기반으로 발견한다.
- 트레이드오프
  - 구조/정책 변경 PR에서 문서 수정 비용이 추가된다.
  - ADR 작성/검토 단계가 추가되어 초기 속도는 소폭 느려질 수 있다.
- 후속 작업
  - ADR 추가 시 `docs/architecture/adr/README.md` 인덱스를 반드시 동기화한다.
  - 구조 게이트 신규 규칙 도입 시 문서의 Rule ID와 스크립트 구현 일치 여부를 함께 검증한다.

## Verification
1. 문서 리뷰 체크리스트(`docs/architecture/README.md`)를 PR 템플릿 리뷰 기준으로 사용한다.
2. 구조 규칙 변경 PR에서 `scripts/verify-structure.mjs`와 구조 문서 동시 수정 여부를 확인한다.
3. CI(`frontend-quality-check.yml`, `frontend-structure-check.yml`)가 모든 게이트를 통과하는지 확인한다.
