# 웹 공유 썸네일 보관

OG(`og:image`) 썸네일 작업에 쓰인 소스와 후보들을 모아둔다.
**여기 있는 파일은 배포되지 않는다.** 실제로 서비스되는 썸네일은 `public/` 에 있고,
`index.html` 의 `og:image` / `og:image:secure_url` / `twitter:image` 가 참조한다.

`public/` 은 통째로 배포 버킷에 동기화되므로, 쓰지 않는 이미지는 이쪽에 둔다.

## 파일

| 파일 | 크기 | 설명 |
|---|---|---|
| `legend-thumbnail-horizontal-origin.jpg` | 12694×5626 / 909KB | 디자인국 가로형 원본. 재작업 시 이 파일에서 시작한다. |
| `legend-web-thumbnail-v1.jpg` | 1200×630 / 193KB | 위 원본에서 만든 OG 규격 후보. 좌우 여백을 330px씩 잘라내고 상하를 34px 확장해 1.905:1 을 맞췄다. 채택되지 않았다. |
| `legend-horizontal-webthumbnail-size.jpeg` | 1731×909 / 387KB | 외부 이미지 생성 AI로 만든 가로형. 규격(1.904:1)은 맞지만 디자인국 원본 대비 입자감이 뭉개져 **사용하지 않는다.** |

## 참고

- OG 권장 규격은 1200×630(1.91:1), 카카오 권장 최소는 800×400 이다.
- 이미지 응답에 `Cache-Control: public, immutable, max-age=2592000` 이 붙는다.
  같은 파일명에 덮어쓰면 최대 30일간 갱신되지 않으므로 **교체할 때는 새 파일명을 쓴다.**
- 배포 후 [카카오 OG 캐시 초기화](https://developers.kakao.com/tool/clear/og)를 돌려야
  이미 공유된 링크의 썸네일이 갱신된다.
- 원본이 2.256:1 이라 1.905:1 로 좌우를 그냥 자르면
  `2026 DANFESTA`(x≈390 부터)와 `FALL FESTIVAL`(x≈12281 까지) 코너 문구가 잘린다.
  좌우 각 330px 까지가 문구를 건드리지 않는 한계다.
