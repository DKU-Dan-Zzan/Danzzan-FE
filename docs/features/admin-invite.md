# 운영진 관리 화면

상위 메뉴 **운영진 관리**는 마우스 올리기와 키보드 포커스로 제공 기능을 미리 볼 수 있다. 대메뉴를 클릭하면 `/admin/invite`로 이동하고, 이미 같은 화면에 있어도 최상단으로 스크롤한다. **새 매니저 초대**(`/admin/invite#invite-manager`)와 **매니저 목록**(`/admin/invite#manager-list`)은 같은 ADMIN 전용 화면의 각 영역으로 이동한다. 기존 `/admin/managers`는 통합 화면의 목록 영역으로 리다이렉트한다. 학번으로 먼저 가입된 회원을 정확히 조회한 뒤 `OPERATIONS`(티켓팅 외 운영 관리), `TICKETING`(티켓팅 관리) 중 하나 이상을 선택해 매니저로 지정한다. 둘은 독립적으로 부여·수정할 수 있고, 모두 회수하면 일반 회원(USER)이 된다. 관리자 목록에는 활성 최고 관리자(ADMIN)와 매니저(MANAGER)를 함께 표시한다.

- 관리자 목록은 이름·학번 / 소속 / 역할 / 세부 권한 / 권한 관리의 표로 표시한다. 좁은 화면에서는 표 영역만 가로 스크롤하며, 키보드로도 스크롤 영역과 행별 관리 버튼에 접근할 수 있다.
- 회원 조회 결과는 넓은 화면에서 왼쪽에 회원 정보, 오른쪽에 운영 관리·티켓팅 관리 선택 카드를 배치한다. 지정·수정 버튼은 하단 오른쪽에 두며, 좁은 화면에서는 세로 배치로 전환한다.
- 관리자 목록 필터는 전체 / 티켓 매니저 / 운영 매니저 / 티켓&운영 매니저 / 최고 관리자를 제공한다. 권한별 필터는 해당 권한을 가진 MANAGER와 전체 권한을 가진 ADMIN을 함께 조회한다. 두 권한을 가진 MANAGER와 ADMIN은 두 목록 모두에 포함한다. 티켓&운영 매니저는 두 권한을 가진 MANAGER와 ADMIN을 조회하며, 최고 관리자 필터는 ADMIN만 조회한다. 서버에서 필터링 후 페이지와 총인원을 계산한다. 필터 변경 시 첫 페이지로 이동하며 새로고침·권한 변경 후에도 선택을 유지한다.
- 각 매니저 행의 **더보기** 메뉴에서 세부 권한 수정·매니저 권한 회수·최고 관리자 지정을 선택한다. 다른 최고 관리자 행에서는 **최고 관리자 권한 회수**를 선택할 수 있으며, 확인 후에는 두 운영 권한을 가진 매니저가 된다. 본인 최고 관리자 계정은 목록에서 변경할 수 없다. 모든 변경은 대상 이름·학번을 표시한 확인창을 거치며, 취소 시 메뉴를 연 버튼으로 포커스가 돌아간다.
- API: `/api/admin/staff/candidates`, `/api/admin/staff`, `/api/admin/staff/{id}/role`, `/api/admin/staff/{id}/promote-admin`, `/api/admin/staff/{id}/demote-admin`.
- 새 adapter만 ApiResponse의 data를 검증·해제한다. 기존 raw 성공 응답은 유지한다.
- 직접 base `http://localhost:8080`에서는 `/api/admin/staff`, Vite base `/api`에서는 브라우저 `/api/api/admin/staff`가 BE `/api/admin/staff`로 전달된다.
- 서버 managementEnabled가 false이거나 목록 상태 확인에 실패하면 변경 버튼을 비활성화한다.
- 권한 변경 성공은 대상 이름과 결과를 담은 토스트로 알린다. 고정 메뉴 높이에 맞춰 메뉴 아래 12px, 화면 오른쪽 16px에 표시하며 기본 5초 후 사라진다. 닫기 버튼으로 즉시 닫을 수 있다. 실패·결과 불확실 안내와 재조회 버튼은 화면에 유지한다.
- 응답을 잃어 변경 결과가 불확실하면 재조회 전까지 변경을 막는다. 네트워크/5xx/409 자동 변경 재시도는 하지 않는다.
- 계정별·세션 세대별 query key와 취소/제거로 다른 계정의 검색 결과가 남지 않게 한다. 늦은 성공/실패도 새 세션의 상태나 알림을 바꾸지 않는다.
- auth 저장 스키마 v2는 기존 role보다 JWT의 정규화된 역할과 `permissions` claim을 사용한다. ADMIN은 두 범위를 모두 가지며, MANAGER의 누락·잘못된 claim은 어떤 관리자 범위도 부여하지 않는다.
- 일반 refresh 요청에는 만료된 access token도 Authorization에 함께 보낸다. 서버는 refresh token과 동일 사용자임을 검증한다.

검증: `npm run lint`, `npm run typecheck`, `npm run typecheck:test`, `npm run check:deps-cycles`, `npm run test:coverage`, `npm run build`.

API·UI·authStore·authCore·티켓 관리자 진입 테스트는 실제 서버를 대신하지 않는 contract/회귀 테스트다. 새 BE와 DB 마이그레이션을 먼저 배포하고 서버의 STAFF_MANAGEMENT_ENABLED 설정을 준비 완료 후 활성화한다.
