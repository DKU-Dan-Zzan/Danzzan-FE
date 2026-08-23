// 역할: 한국어 UI 문자열 사전을 정의한다. 이 파일의 키 집합이 기준이다.

export const ko = {
  "nav.boothmap": "부스맵",
  "nav.timetable": "타임테이블",
  "nav.home": "HOME",
  "nav.notice": "공지사항",
  "nav.ticketing": "티켓팅",

  "lang.toggle.aria": "언어 변경",
  "lang.ko": "한국어",
  "lang.en": "English",

  "common.home": "홈으로",
  "common.loading": "페이지 전환 중",
  "common.retry": "다시 시도",

  "notFound.title": "페이지를 찾을 수 없어요",
  "notFound.description": "주소가 바뀌었거나 접근할 수 없는 페이지예요.",

  "closed.ticketing.title": "티켓 없이 들어오세요",
  "closed.ticketing.description":
    "가을 축제는 티켓팅 없이 자유롭게 입장하실 수 있어요. 공연 시간은 타임테이블에서 확인해 주세요.",
  "closed.ticketing.action": "타임테이블 보기",

  "closed.auth.title": "로그인이 필요 없어요",
  "closed.auth.description":
    "가을 축제는 로그인 없이 모든 기능을 이용하실 수 있어요.",
  "closed.auth.action": "홈으로",

  "closed.mypage.title": "가을 축제에는 제공되지 않아요",
  "closed.mypage.description":
    "내 정보는 티켓팅과 함께 사용하던 기능이라 이번 축제에는 열지 않아요.",
  "closed.mypage.action": "홈으로",

  "home.dummyPosterAlt": "2026 단국축제 포스터",
  "home.posterAlt": "포스터 {{index}}",
  "home.lineupImageAlt": "라인업 이미지 {{index}}",
  "home.emergencyNoticeTitle": "긴급공지 및 내용",
  "home.scrollCue": "스크롤하여 올해의 아티스트를 확인해보세요",
  "home.scrollToArtistsAria": "아티스트 섹션으로 이동",
  "home.syncingLabel": "홈 콘텐츠 동기화 중",
  "home.emergencyCollapseAria": "긴급 공지 접기",
  "home.emergencyExpandAria": "긴급 공지 전문 펼치기",
  "home.emergencyUpdatedPrefix": "업데이트 {{time}}",
  "home.performanceLoading": "현재 진행 중인 공연을 확인하고 있어요.",
  "home.performanceError": "공연 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.",
  "home.performanceEmpty": "진행중인 공연이 없습니다",
  "home.performanceCaption": "현재 진행 중인 공연을 지금 확인하세요",
  "home.performanceHelperCta": "타임테이블에서 다음 공연을 확인해보세요",
  "home.adBannerAlt": "광고 배너",
  "home.posterPlaceholderTitle": "2026 단국축제",
  "home.posterPlaceholderSubtitle": "축제 포스터 영역",
  "home.posterFallbackAlt": "축제 포스터",
  "home.posterDotAria": "포스터 {{index}}로 이동",
  "home.lineupCaption": "올해 축제를 빛낼 아티스트들을 지금 확인하세요",
  "home.lineupFallbackAlt": "라인업 이미지",
  "home.lineupDotAria": "라인업 {{index}}로 이동",
} as const
