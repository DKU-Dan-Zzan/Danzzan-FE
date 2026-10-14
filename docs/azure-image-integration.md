# Azure 이미지 연동: FE 인수인계

기준일: 2026-10-13. Azure 전환 코드·테스트·문서는 사용자 요청에 따라 **DANZ-373 작업 브랜치에서 커밋**한다. 원격 푸시는 별도이므로 동료에게 자동 전달되지는 않는다. 푸시 후 해당 작업 브랜치를 체크아웃해야 하며, main clone만으로는 이 기능을 받지 못한다. 정확한 커밋은 `git log -1 --oneline`으로 확인한다.

전체 포털 설정·권한·인증·검증·VM 예비 배포 문서는 BE 저장소의 `docs/azure-demo-handoff.md`에 있다. BE와 FE를 같은 상위 폴더에 둔 로컬 배치에서는 [전체 인수인계 문서](../../Danzzan-BE/docs/azure-demo-handoff.md)로 열 수 있다. 이 상대 링크는 두 저장소를 나란히 둔 로컬 환경용이며 GitHub에서는 BE 저장소에서 해당 문서를 찾아야 한다.

## 1. 현재 방식

1. 관리자 화면은 기존 multipart API로 **BE에 업로드**한다. Blob 직접 PUT 업로드는 사용하지 않는다.
2. BE가 Azure SDK로 비공개 Blob에 저장하고 DB에는 `azure:images/<key>`만 보관한다.
3. 조회 응답의 이미지 URL은 기본 300초 읽기 SAS다. 브라우저가 이 URL로 Blob을 직접 조회한다.
4. 만료에 가까워지거나 이미지 로드가 실패하면 `POST /images/read-url`로 갱신한다.

FE에는 저장소 키·연결 문자열·Azure 로그인 토큰이 필요하지 않다. 발급된 SAS URL도 임시 접근권이므로 로그·Git·공용 문서에 남기지 않는다.

## 2. 로컬 연결

BE를 먼저 Azure CLI 인증으로 실행한다. 전체 문서의 권한 및 BE 설정 단계를 완료한 뒤, BE가 실제 `127.0.0.1:8081`에 떠 있다면:

```sh
npm ci
VITE_API_BASE_URL=http://127.0.0.1:8081 \
VITE_TICKETING_API_BASE_URL=http://127.0.0.1:8081 \
  npm run dev -- --host 127.0.0.1 --port 5174
```

Node는 현재 Dockerfile에서 22 계열을 사용한다. BE CORS 허용 출처와 실제 FE 포트를 확인한다. 다른 컴퓨터에서 접속할 때는 위 loopback 주소를 그대로 사용하지 않는다. VM용 FE 컨테이너는 빌드 시 API base `/api`를 사용하며 Nginx가 `/api/`를 제거하고 `app:8080`으로 전달한다. API 경로는 FE의 실제 호출 규칙을 따른다.

## 3. 변경 코드

- [AzureImage.tsx](../src/components/common/AzureImage.tsx): 이미지 표시와 갱신 통합
- [useAzureImageUrl.ts](../src/hooks/app/useAzureImageUrl.ts): 만료 시각·화면 복귀·로드 실패 처리
- [azureReadUrl.ts](../src/lib/app/azure/azureReadUrl.ts): 읽기 SAS 식별 및 갱신 요청, 동시 요청 합치기
- 공지·홈·주점·타임테이블·광고·브랜딩 등 이미지 표시 화면에 적용

현재 갱신 대상은 HTTPS `*.blob.core.windows.net` + `sig`가 있는 URL이다. SAS 만료 90초 전 갱신을 준비하고 최소 간격은 30초다. 공개 이미지 갱신과 관리자 임시 이미지 갱신의 권한 판단은 BE가 담당한다.

## 4. 동료 저장소로 바꿀 때

- 일반 Azure Blob endpoint를 사용하는 한 FE에 저장소 계정 이름을 하드코딩할 필요는 없다. BE endpoint·인증·RBAC를 변경한다.
- 테넌트가 다르면 현재 VM 관리 ID 인증 설계로 기존 저장소를 그대로 사용하지 않는다. 전체 문서의 계정 분기를 따른다.
- BE endpoint 변경은 파일 이관이 아니다. 기존 DB의 `azure:images/...` 참조에 대응하는 파일이 새 저장소에 없으면 404다.
- 현재 방식은 BE multipart + 일반 이미지 GET이므로 Blob CORS 규칙은 비워 두었다. fetch/canvas/직접 PUT 방식으로 바꾸는 경우에는 별도 검토가 필요하다.
- 관리자 파일 제한은 BE의 기존 제한을 따른다. 공통 Azure 업로더 상한을 근거로 화면의 제한을 늘리지 않는다.

## 5. 검증과 남은 범위

2026-10-13 커밋 전 122개 파일·555개 FE 테스트와 typecheck/lint/build를 다시 실행해 모두 성공했다. 빌드에는 Browserslist 데이터가 오래됐다는 경고가 있으나 실패는 없었다.

10-13 실제 브라우저에서 테스트 공지 상세의 Azure 이미지 로드와 새로고침 없는 SAS 갱신을 확인했다. 관리자 업로드·등록·수정·삭제는 실제 HTTP API로 검증했으며, 관리자 로그인·파일 선택 UI 자체를 포함한 모든 화면의 수동 검증은 아직 하지 않았다. 테스트 공지·이미지는 정리하고 기존 게시물은 유지했다.

동료 환경에서는 새 테스트 공지·새 이미지로 같은 흐름을 확인하고 본인이 만든 대상만 정리한다. **BE의 Azure SDK smoke 테스트는 현재 `danzzandemo2026/images`가 하드코딩되어 있으므로 새 저장소 검증에 그대로 사용하면 안 된다.**

## 6. Azure VM 배포 (2026-10-14)

같은 날 main 병합 커밋 `3bb6bf5d`를 Azure에 추가 반영했다. 병합 후 129개 파일·647개 테스트와 lint/typecheck/build가 통과한 동일 소스를 VM에서 다시 Docker 빌드했다. BE와 FE만 교체했고 데이터 컨테이너는 유지했다. HTTPS 공지 목록의 실제 브라우저 렌더링을 확인했다. 외부 서비스 비밀값은 BE의 비공개 환경 파일에만 주입했으며 FE에 추가하지 않았다. 이 배포에서 이미지 업로드·삭제·SAS 갱신을 다시 실행하지는 않았다. 정확한 배포 파일 목록과 복구 기록은 BE의 `docs/azure-vm-deployment.md`를 참고한다.

현재 시연 주소는 https://danzzan.koreacentral.cloudapp.azure.com 이다. FE는 [Dockerfile.azure](../Dockerfile.azure)로 빌드하고 [nginx.azure.conf](../nginx.azure.conf)로 HTTPS와 SPA 경로를 제공한다. BE 저장소의 `docker-compose.azure.yml`이 FE/Nginx·BE·MySQL·Redis·Kafka를 함께 실행한다. 전체 초기 설정과 운영 절차는 BE의 `docs/azure-vm-deployment.md`를 따른다.

- 빌드 기본값: `VITE_API_BASE_URL=/api`, `VITE_TICKETING_API_BASE_URL=/api`, `VITE_API_MODE=live`.
- `.env*`는 Docker 빌드에서 제외한다(`.env.example` 제외). 카카오 JavaScript 공개 키는 `VITE_KAKAO_MAP_JS_KEY` build arg로 명시적으로 전달한다. Azure 자격 증명이나 서버 비밀키는 FE에 넣지 않는다.
- Nginx는 `/api/` 한 단계만 제거한다. BE 관리자 경로에 이미 `/api`가 포함되는 경우 외부 요청의 `/api/api/admin/...`은 기존 FE 경로 계약에 따른 것이다.
- HTTP는 HTTPS로 이동하며 ACME HTTP-01 경로만 인증서 갱신용 webroot로 제공한다. 인증서는 VM의 `/etc/letsencrypt`를 읽기 전용으로 마운트한다. 인증서 최초 발급 전에는 HTTPS Nginx가 시작되지 않는다.
- 업로드 본문 상한은 Nginx 11m이며 실제 파일 허용 범위는 BE의 MIME·파일 크기 검증을 따른다. 운영 actuator 경로는 공개 프록시에서 차단한다.
- 새 VM으로 옮길 때 `server_name`, 인증서 경로, BE CORS와 인증서 발급 도메인을 함께 변경한다.

VM에서 홈페이지·공지와 테스트 Azure 이미지의 실제 브라우저 표시, 관리자/일반 사용자 HTTP 로그인, 권한 차단, SAS 만료·재발급을 확인했다. 테스트 공지·이미지는 정리했다. 이번 VM 검증이 전체 화면·부하 테스트까지 통과했다는 뜻은 아니다.

카카오 SDK는 변경 전 Azure 주소를 Referer로 요청했을 때 HTTP 401을 반환했다. 동료가 관리하는 같은 앱의 JavaScript SDK 도메인에 `https://danzzan.koreacentral.cloudapp.azure.com`을 등록하고 `/map`을 다시 확인해야 한다. 도메인 미등록이 유력하지만 키 비활성 여부까지 확인한 것은 아니다. [카카오 지도 공식 안내](https://apis.map.kakao.com/web/guide/)

## 7. 기본 색상 테마 복원 (2026-10-14 Azure 반영)

테마 관리 목록은 저장된 테마 앞에 `Tangerine Cream`를 항상 표시한다. 초기 Theme Core 14색을 미리 보고 `Tangerine Cream 적용`을 누르면 초기 색상으로 복원된다. 기본 항목은 수정·삭제되지 않으며 `복제`로 별도 테마를 만들 수 있다. 포스터·로고·홈 이미지·티켓 배경은 유지된다.

FE의 기본 항목 ID `0`은 화면 내부에서만 사용한다. 적용 요청은 BE의 `PUT /admin/festival/{festivalSettingId}/themes/default/activate`이며 기존 테마 CRUD에 ID `0`을 보내지 않는다. BE는 기존 운영 권한 검사와 축제 설정 잠금을 사용하고 `active_theme_id`만 `NULL`로 바꾼 뒤 204를 반환한다. 테마 레코드 생성이나 DB 스키마 변경은 없다. 공개 활성 테마 조회의 204는 기본 색상 사용을 뜻하며 FE가 이전 inline 색상 덮어쓰기를 제거한다.

이 기능은 새 BE API가 필요하므로 배포 시 BE를 먼저 반영한 뒤 FE를 반영한다. 기존 BE만 실행 중일 때는 기본 테마 적용이 실패하며 FE는 기존 활성 색상을 유지한다. 자동으로 현재 테마를 복원하거나 기존 테마를 삭제하지 않는다.

## 8. 5월 운영 색상 프리셋 (2026-10-14 Azure 반영)

`Tangerine Cream`(주황·크림) 다음에 `Coastal Sunset`(남색·청회색·살구색)가 항상 표시된다. 표시 이름은 색상 분위기를 나타내며, 아래 5월 표기는 색상 출처를 뜻한다. 색상 출처는 [FE PR #103](https://github.com/DKU-Dan-Zzan/Danzzan-FE/pull/103)의 마지막 커밋 `cf71c7acc4951bfd216d88ce297416cd26702666`이다. PR 병합 시각은 2026-05-11이며 병합 커밋은 `aaf5a0444536cdc571a2ee205baadc39eacd51b6`이다.

**후속 Azure 배포(2026-10-14, `20261014-theme-policy`):** 새 [테마 제작 색상 규칙](theme-color-policy.md)은 아래 역사적 브랜드 색상을 유지하되, 상태색·지도색에는 공통 기본값을 쓰고 주점은 Primary와 연결한다. 아래 표와 배포 기록은 해당 변경 이전의 출처·검증 기록이다.

당시 `AppLayout`이 사용한 `electric-curator` 일반 화면의 색상을 현재 Theme Core 14개 항목으로 옮겼다. 원본 `src/index.css`의 대응 관계는 다음과 같다.

| 현재 항목 | 색상 | 당시 출처 |
| --- | --- | --- |
| brand.primary | `#073161` | electric-curator의 app-nav-home-highlight: rgb(7 49 97), 하단 HOME 버튼 배경 |
| brand.accent / strong | `#8fa9be` | electric-curator의 accent, text-emphasis-vivid → 당시 일반 primary |
| brand.secondary | `#f5b070` | electric-curator의 secondary |
| status.success | `#2e7d32` | root의 status-success |
| status.warning | `#c98548` | electric-curator의 status-warning |
| status.danger | `#b3261e` | root의 status-danger |
| status.pending | `#e3776a` | root의 status-pending |
| category.pub | `#2853a9` | root의 boothmap-marker-pub → text-emphasis-vivid |
| category.foodTruck | `#ef4444` | root의 boothmap-marker-foodtruck |
| category.experience | `#10b981` | root의 boothmap-marker-experience |
| category.event | `#f6ca3b` | root의 boothmap-marker-event |
| category.facility | `#3b82f6` | root의 boothmap-marker-facility |
| category.restArea | `#8b5cf6` | 당시 항목이 없어 현재 기본 테마 값 유지 |

당시 색상 스킴은 문서 루트가 아닌 AppShell의 div에 붙었다. 지도 색상 도우미는 `document.documentElement`에서 값을 읽었으므로 지도 마커에는 root 값을 사용한다. 티켓 화면의 별도 `webapp` 팔레트, 당시 배경·레이아웃·이미지 전체를 복원하는 기능은 아니다.

가상 ID `-1`은 FE 내부에서만 사용한다. 단순 조회·선택 시 DB에 쓰지 않는다. `Coastal Sunset 적용`을 누르면 최신 목록에서 이름·14색·출처 정보가 프리셋과 일치하는 저장본을 재사용하며, 없을 때만 기존 테마 생성 API로 저장한다. 활성화 요청에는 실제 양수 ID를 보낸다. 저장 후 활성화가 실패해도 저장본은 남겨 재시도에 재사용하고, 화면의 적용 색상은 성공 후에만 바꾼다.

동일 저장본은 기본 선택지로 묶어 표시한다. 색상·이름이 바뀌었거나 포스터 출처가 있는 테마는 별도로 유지한다. 기본 선택지는 직접 수정·삭제할 수 없으며 `복제`로 편집한다. 포스터·로고·홈 이미지·티켓 배경과 다른 테마 레코드는 변경하지 않는다. 이름·색상·출처가 완전히 같은 수동 테마도 프리셋으로 인식되며, 여러 관리자의 동시 최초 적용에 대한 중복 생성 방지는 제공하지 않는다.

5월 프리셋 자체에는 BE API나 DB 스키마 변경이 필요 없다. 함께 추가한 초기 기본 테마 복원은 앞 절의 새 BE API가 필요하다.

2026-10-14 로컬 검증: FE 전체 130개 파일·660개 테스트, `npm run build`(애플리케이션 타입 검사 포함), `npm run typecheck:test`, `npm run lint` 통과. 프리셋 선택 시 쓰기 없음, 실제 ID로 저장·활성화, 재조회 후 재사용, 생성·활성화 실패 시 기존 색상 유지, 초기 테마 복원과 이미지 유지, 복제 편집을 테스트했다. Azure DB 쓰기나 실제 브라우저에서의 배포 후 색상 확인은 실행하지 않았다. 빌드에는 기존 Browserslist 데이터 갱신 안내가 남아 있다.

### HOME 버튼 기준 메인색 보정 (2026-10-14, Azure 반영)

최초 프리셋은 일반 `--primary: rgb(143 169 190)`를 메인색으로 옮겨 청회색이 표시됐다. PR #103의 `BottomNav.tsx`에서 실제 HOME 버튼 배경은 `--app-nav-home-highlight`를 사용했고, `electric-curator` 스킴은 이를 `rgb(7 49 97)`로 별도 지정했다. 사용자가 의도한 HOME 버튼 색을 반영하기 위해 `brand.primary`만 `#073161`로 보정했다. 현재 CSS의 연결은 `--theme-brand-primary` → `--semantic-primary` → `--app-nav-home-highlight`이다. 나머지 13색은 유지한다.

기존 청회색 프리셋 저장본은 새 프리셋과 색이 다르므로 일반 저장 테마로 남는다. 현재 활성 테마나 DB 레코드를 자동으로 덮어쓰지 않는다. 배포 후 기본 선택지의 `Coastal Sunset`을 선택하고 적용해야 보정된 색으로 변경된다. 아래 첫 Azure 반영 기록은 보정 전 배포의 기록이다. 이번 보정의 배포 결과는 이어지는 추가 배포 기록을 따른다.

보정 검증: 관련 4개 파일의 테스트 75개, 애플리케이션 타입 검사, 변경된 TypeScript 파일 ESLint, `git diff --check` 통과. 선택·저장·적용 시 새 메인색 전달과 이전 청회색 저장본 보존을 확인했다. 이후 실제 Azure 화면 검증은 아래 추가 배포 기록에 남겼다.

### Azure 반영 확인 (2026-10-14, 메인색 보정 전)

`20261014-theme-presets` 배포로 기본 테마 복원 BE API와 FE의 `Tangerine Cream`, `Coastal Sunset` 선택지를 반영했다. 마지막 이름 변경 후 관련 테스트 64개를 다시 통과했으며 VM의 FE 빌드(타입 검사 포함)도 성공했다. 실제 로그인된 관리자 브라우저에서 두 선택지와 각각 `#ff642d`·`#8fa9be` 미리보기를 확인했다. 기존 활성 `Balanced AI 추천 테마`는 그대로 유지했다. 운영 데이터 변경을 피하기 위해 실제 적용·복제·삭제 버튼은 누르지 않았다. 이 동작들은 로컬 테스트로 검증했으며 이번 운영 검증은 조회·미리보기까지다.

HTTPS 홈·공지·테마 관리·health는 200, Nginx 설정 검사는 성공했다. 게시물·이미지 참조·축제 설정·테마를 포함한 20개 테이블의 데이터 해시는 배포 전후와 브라우저 확인 후 모두 일치했다. Blob 쓰기는 실행하지 않았다. 복구 이미지와 소스·해시 목록은 BE 배포 문서의 같은 배포 기록을 참고한다.

## 9. AI 테마 추천 진단 반영 (2026-10-14)

초기 VM 점검에서 같은 VM의 OpenAI 모델 조회는 엔드포인트·인증·모델 도달 여부만 확인한 것이다. 관리자 화면의 포스터 전송, 테마 생성, 티켓·마감 배경 생성까지 성공했다는 검증은 아니었다.

이후 BE에 요청 식별자·처리 시간·HTTP 상태·오류 종류만 남기는 진단 로그를 반영했다. API 키, 인증 헤더, SAS URL, 포스터 본문·Base64 값은 로그에 남기지 않는다. 실제 로그인된 관리자 화면에서 테마 추천과 두 배경 추천을 실행해 200 응답을 확인했다. 재배포 후 정상화된 상태이므로 이전 시간 초과의 단일 원인은 확정하지 않았다. 상세 진단 기록과 재현 절차는 [BE AI 추천 진단 문서](../../Danzzan-BE/docs/azure-ai-recommendation-diagnostics.md)를 따른다.


## 10. Coastal Sunset 메인색·포스터 자산 추가 배포 (2026-10-14)

`20261014-coastal-sunset`으로 FE만 배포했다. 로컬 기준 커밋 `c300d4bf`의 포스터 자산/경로 변경과 배포 당시 미커밋이었던 메인색 보정을 포함한다. VM과 로컬 소스 해시를 비교해 차이가 있는 15개 파일만 전송했다. 실제 전송 파일별 SHA-256은 VM 복구 디렉터리의 `source-manifest.json`에 기록했다. 이전 정적 이미지 경로 파일은 삭제하지 않아 기존 참조를 보존했다.

- 관련 7개 파일의 테스트 87개 통과. VM Docker 빌드의 TypeScript 검사·Vite 빌드 성공 후 frontend 컨테이너만 교체했다.
- 관리자 브라우저를 새로고침하고 기본 `Coastal Sunset` 선택지에서 Primary HEX `#073161`을 확인했다. 기존 활성 청회색 저장본은 일반 저장 테마로 남아 있다. 선택·미리보기만 했으며 적용·저장·삭제·AI 요청은 실행하지 않았다.
- 새/이름 변경된 JPEG 4개는 HTTPS 200이며 응답 바이트 해시가 로컬 파일과 모두 일치했다. DB에 저장된 홈 이미지나 Blob 파일을 교체한 것은 아니다.
- HTTPS 홈·공지·테마 관리·health, Nginx 설정 검사 성공. BE·MySQL·Redis·Kafka 컨테이너 ID는 유지했고, 콘텐츠·일정·축제 설정·테마를 포함한 20개 테이블의 정규화 덤프 해시는 배포 전후 일치했다.
- 앞서 DB에 반영한 11/27·28 일정도 재확인했다. 공연 7·9건, 부스 58·57건, 주점 5·5건이며 기존 9/9·10 조회는 0건이다. 축제 전체 기간 11/26~28은 유지한다.

복구 자료는 VM `/opt/danzzan/deployment-backups/20261014-coastal-sunset/`에 보관한다. 이전 FE 이미지 태그는 `danzzan-fe:rollback-20261014-coastal-sunset`이다. 앱·DB를 되돌리지 않고 FE 이미지와 필요시 소스만 복구한다. 비밀 환경 파일과 DB 덤프는 Git에 포함하지 않는다.
