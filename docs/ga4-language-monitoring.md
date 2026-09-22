# GA4 영어 사용 모니터링

앱의 표시 언어(`ko` / `en`)와 언어 전환을 프론트엔드에서 GA4로 전송합니다.
백엔드 API·DB 변경이나 추가 환경변수는 필요하지 않습니다.
기존 빌드 설정인 `VITE_ENABLE_GA=true`와 올바른 `VITE_GA_MEASUREMENT_ID`가 필요합니다.

## 수집 내용

| 구분 | 전송 시점 | 값 |
| --- | --- | --- |
| 사용자 속성 `app_language` | GA 초기화 및 언어 변경 | 현재 표시 언어 |
| `page_view`의 `app_language` | 최초 접속 및 경로/검색 문자열 변경 | 페이지뷰 시점의 표시 언어 |
| `language_change` | 앱의 언어 상태가 실제 변경될 때 | `from_language`, `to_language`, `app_language` |

`language_change`의 `app_language`는 변경 후 언어입니다.
표시 언어는 `languageStore`에서 읽습니다. GA 기본 `Language`는 브라우저 언어이므로 앱의 영어 선택 여부와 다를 수 있습니다.

- 저장된 영어 선택으로 재방문하거나 브라우저 언어에 따라 영어로 처음 열리면 `page_view(app_language=en)`을 보냅니다. 언어 변경 이벤트는 보내지 않습니다.
- KO → EN 전환은 `language_change(from_language=ko, to_language=en, app_language=en)`입니다.
- EN → KO 전환도 기록합니다. 같은 언어를 다시 설정하면 이벤트를 보내지 않습니다.
- 언어만 변경하면 추가 페이지뷰를 보내지 않습니다. 이후 페이지 이동에는 변경된 언어를 포함합니다.
- GA가 비활성화되어 있으면 언어 관련 데이터도 전송하지 않습니다.

## GA4 관리 화면 등록

대상 GA4 속성에서 **관리 → 데이터 표시 → 맞춤 정의 → 맞춤 측정기준 만들기**로 이동합니다.
속성에 대한 편집자 이상의 권한이 필요합니다. 같은 정의가 있으면 재사용합니다.

| 표시 이름 예시 | 범위 | 이벤트 매개변수 또는 사용자 속성 |
| --- | --- | --- |
| App language (event) | 이벤트 | `app_language` |
| From language | 이벤트 | `from_language` |
| To language | 이벤트 | `to_language` |
| App language (user) | 사용자 | `app_language` |

이벤트 범위와 사용자 범위의 `app_language`는 표시 이름을 다르게 지정합니다.
기간 내 영어 사용 이력은 이벤트 범위로 분석하고, 사용자 속성은 언어 속성별 분석을 보조하는 용도로 사용합니다.

## 보고서에서 확인할 지표

**영어를 한 번이라도 사용한 사용자 수**

탐색의 자유 형식 보고서에서 다음 조건을 모두 적용합니다.

- 이벤트 이름: 정규식 `^(page_view|language_change)$`와 일치
- App language (event): `en`과 정확히 일치
- 측정항목: **총 사용자 수**

처음부터 영어인 방문과 페이지 이동 없이 영어로 전환한 방문을 모두 포함합니다.
`page_view`만 필터링하면 같은 화면에서 영어로 바꾼 뒤 떠난 사용자가 빠집니다.

**직접 영어로 전환한 사용자 수 / 전환 횟수**

- 이벤트 이름: `language_change`와 정확히 일치
- To language: `en`과 정확히 일치
- 측정항목: **총 사용자 수**, **이벤트 수**

한 사람이 여러 번 전환해도 사용자 수와 전환 횟수를 구분해서 볼 수 있습니다.
저장된 영어 선택으로 재방문하거나 자동으로 영어가 선택된 방문은 새 전환으로 세지 않습니다.

**영어로 본 페이지 수**

- 이벤트 이름: `page_view`와 정확히 일치
- App language (event): `en`과 정확히 일치
- 측정항목: **이벤트 수**; 필요하면 페이지 경로별로 분류

사용자 수는 GA의 사용자 식별 기준에 따른 값입니다. 같은 사람이 기간 내 두 언어를 모두 쓰면 양쪽 사용자 집계에 포함될 수 있으므로 KO/EN 사용자 수를 합산해 전체 사용자 수로 사용하지 않습니다.
이전 기간의 앱 언어를 소급해서 채우지는 않으며, 보고서에는 수집·등록 이후 데이터가 나타납니다.

## 배포 후 검증

1. 새 빌드를 배포한 사이트에서 처음 접속할 때 `page_view`에 현재 언어가 포함되는지 확인합니다.
2. KO → EN → KO로 전환하며 각 전환에 `language_change`가 한 번씩 발생하는지 확인합니다.
3. 전환만으로 `page_view`가 늘지 않고, 다른 페이지로 이동하면 현재 언어의 `page_view`가 한 번 발생하는지 확인합니다.
4. 영어를 선택한 상태로 새로고침하면 `page_view(app_language=en)`만 발생하고 새 `language_change`는 발생하지 않아야 합니다.

브라우저 Network의 GA `g/collect`에서 이벤트 이름과 `ep.app_language`, `ep.from_language`, `ep.to_language`를 확인합니다. GA가 요청을 묶어 보낼 수 있으므로 URL과 요청 본문을 함께 확인합니다.
DebugView로 확인할 때는 Tag Assistant 등으로 디버그 모드를 활성화해야 합니다. 운영 코드에는 디버그 모드를 상시 설정하지 않습니다.
맞춤 측정기준을 사용하는 일반 보고서·탐색 반영에는 최대 48시간이 걸릴 수 있습니다.

## 공식 참고 문서

- [GA4 이벤트 매개변수 및 맞춤 측정기준 등록](https://developers.google.com/analytics/devguides/collection/ga4/event-parameters)
- [GA4 language 및 user_properties 설정](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [사용자 범위 맞춤 측정기준 생성](https://support.google.com/analytics/answer/14239618)
