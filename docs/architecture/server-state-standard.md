# Server State Standard (DANZ-228)

## 1. 목적
`Home / Notice / Timetable`을 기준으로 서버 상태 처리 규칙을 표준화한다.
핵심 범위는 `loading / error / retry / cancel / cache`이며, 라우트별 수동 패턴 분산을 제거한다.

## 2. 기본 원칙
- 서버 상태는 TanStack Query를 기본으로 사용한다.
- `queryFn`은 반드시 `AbortSignal`을 받아 취소 가능한 요청이어야 한다.
- API 에러는 `normalizeAppError`로 `AppError` 형태로 정규화한다.
- 재시도/신선도 정책은 query 옵션으로 선언하며 라우트에서 하드코딩하지 않는다.

## 3. Query Key 규칙
- Key 생성은 `src/lib/query/queryKeys.ts`를 사용한다.
- 라우트에서 배열 literal key를 직접 작성하지 않는다.
- 파라미터 객체는 key의 마지막 요소에 둔다.

현재 표준 key:
- `homeImages`, `homeLineup`, `homeEmergencyNotice`, `homeBottomAd`
- `noticeList({ keyword, category, page, size })`, `noticeDetail(id)`
- `timetablePerformances(date)`, `timetableContentImages()`

## 4. 기본 정책
- `QueryClient` 기본값:
  - `staleTime`: 60초
  - `gcTime`: 10분
  - `retry`: retriable 오류에서 최대 1회 재시도
  - `refetchOnWindowFocus`: `false`
- 라우트 단위 override:
  - Home 이미지/라인업: 5분
  - Home 긴급공지: 30초
  - Notice 목록: 30초 + `keepPreviousData`
  - Notice 상세: 5분
  - Timetable 공연: 60초
  - Timetable 콘텐츠 이미지: 10분

## 5. 금지 패턴
- 라우트/컴포넌트에서 `useEffect + 직접 API 호출`로 서버 상태 관리
- `alive/mounted` 플래그만으로 취소를 대체하는 방식
- 문자열 에러 상태를 라우트마다 임의 포맷으로 관리
- 실패 UI에서 재시도 경로 없이 텍스트만 노출

## 6. 허용 패턴
- `useAppQuery` + `appQueryKeys` 조합
- API 함수의 `options?: { signal?: AbortSignal }` 시그니처
- 에러 UI의 명시적 `refetch` 버튼
- 검색 입력의 debounce 후 query key 반영

## 7. 마이그레이션 체크리스트
1. API 함수가 `signal` 옵션을 지원하는가
2. query key가 `queryKeys.ts`에 등록되어 있는가
3. 로딩/에러/빈 상태 UI가 분리되어 있는가
4. 에러 상태에서 재시도 버튼이 있는가
5. 기존 수동 캐시/중복 요청 패턴이 제거되었는가

## 8. 검증 게이트
반드시 아래 순서로 검증한다.
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build`
