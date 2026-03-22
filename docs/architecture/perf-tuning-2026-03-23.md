# DANZ-228 성능 튜닝 마감 리포트 (2026-03-23)

## 1) 이번 라운드 변경 범위

- P1-1: `BoothMap` 3D 청크 warmup 추가
  - `requestIdleCallback` 우선, 미지원 환경은 `setTimeout` 폴백
  - `mapbox-gl` CSS/3D 컴포넌트 청크를 유휴 시간에 미리 로드
- P1-2: `Home` 로딩 정책 분리
  - 핵심 데이터(`포스터/긴급공지`) pending과 부가 데이터(`라인업/광고`) pending 분리
  - 하단 `"로딩 중..."` 텍스트 제거, 지연 스피너로 대체
- 통합 튜닝: 앱 초기 warmup 트리거 개선
  - 하단 탭 lazy preload + tab data prefetch 실행 시점을 `requestIdleCallback` 기반으로 조정

## 2) 측정 방식

- 로컬 개발 서버(`http://127.0.0.1:4173`) 기준
- 하단 탭 전환 40회(5개 탭 x 8루프) 자동 반복
- 수집 값:
  - `nav-timing` 콘솔 로그 기반 `last/p50/p75/p95`
  - 라우트 전환 스피너 노출률(`aria-label=\"페이지 전환 중\"`)
- 3D 첫 전환 fallback은 `/map` 진입 후 `3D` 버튼 클릭 시
  - `"3D 지도를 불러오는 중..."` 가시 시간(ms)으로 측정

## 3) 수치 결과

### 탭 전환 (오늘 이전 라운드 대비)

- 이전: `p50 29ms / p75 30ms / p95 32ms / max 32ms / spinner 0%`
- 이번: `p50 29ms / p75 30ms / p95 31ms / max 33ms / spinner 0%`

해석:
- p75는 유지, p95는 1ms 개선
- 체감 저하 없이 지표 안정성 유지
- 스피너 노출률은 계속 0% (목표 10% 이하 충족)

### 3D 첫 전환 fallback 가시 시간 (5회)

- 샘플: `0ms, 0ms, 41ms, 0ms, 34ms`
- `p50 0ms / p75 34ms / p95 41ms / max 41ms`

해석:
- 첫 전환에서 fallback이 대부분 노출되지 않거나 매우 짧게 노출됨
- warmup 적용으로 첫 2D→3D 전환의 대기 체감이 낮아진 상태

## 4) 남은 리스크 / 다음 관찰 포인트

- 현재 수치는 로컬/헤드리스 기준이므로, 실기기(아이폰) + ngrok 환경에서 1회 추가 측정 권장
- 네트워크 지연이 커질 때는 `map`/`notice` 데이터 prefetch hit-rate 변동 확인 필요
