// 역할: 영어 UI 문자열 사전을 정의한다. 키 집합은 ko.ts와 항상 일치해야 한다.

import type { ko } from "@/i18n/locales/ko"

export const en: Record<keyof typeof ko, string> = {
  "nav.boothmap": "Booth Map",
  "nav.timetable": "Timetable",
  "nav.home": "HOME",
  "nav.notice": "Notices",
  "nav.ticketing": "Ticketing",

  "lang.toggle.aria": "Change language",
  "lang.ko": "한국어",
  "lang.en": "English",

  "common.home": "Go home",
  "common.loading": "Loading page",
  "common.retry": "Try again",
  "common.close": "Close",

  "notFound.title": "Page not found",
  "notFound.description": "This address may have changed or is unavailable.",

  "closed.ticketing.title": "No ticket needed",
  "closed.ticketing.description":
    "The fall festival is free to enter — no ticketing required. Check the timetable for performance times.",
  "closed.ticketing.action": "View timetable",

  "closed.auth.title": "No sign-in needed",
  "closed.auth.description":
    "Everything at the fall festival works without an account.",

  "closed.auth.action": "Go home",

  "closed.mypage.title": "Not available this festival",
  "closed.mypage.description":
    "My Info was part of the ticketing service, so it is closed for the fall festival.",
  "closed.mypage.action": "Go home",

  "home.dummyPosterAlt": "2026 Dankook University Festival poster",
  "home.posterAlt": "Poster {{index}}",
  "home.lineupImageAlt": "Lineup image {{index}}",
  "home.emergencyNoticeTitle": "Emergency notice",
  "home.scrollCue": "Scroll to see this year's artists",
  "home.scrollToArtistsAria": "Go to artist section",
  "home.syncingLabel": "Syncing home content",
  "home.emergencyCollapseAria": "Collapse emergency notice",
  "home.emergencyExpandAria": "Expand full emergency notice",
  "home.emergencyUpdatedPrefix": "Updated {{time}}",
  "home.performanceLoading": "Checking what's on now.",
  "home.performanceError": "Couldn't load performance info. Please try again shortly.",
  "home.performanceEmpty": "No performance is on right now",
  "home.performanceCaption": "Check out what's on right now",
  "home.performanceHelperCta": "Check the timetable for the next performance",
  "home.adBannerAlt": "Ad banner",
  "home.posterPlaceholderTitle": "2026 Dankook University Festival",
  "home.posterPlaceholderSubtitle": "Festival poster area",
  "home.posterFallbackAlt": "Festival poster",
  "home.posterDotAria": "Go to poster {{index}}",
  "home.lineupCaption": "Check out this year's lineup of artists",
  "home.lineupFallbackAlt": "Lineup image",
  "home.lineupDotAria": "Go to lineup {{index}}",

  "notice.pageTitle": "Notices",
  "notice.searchLabel": "Search notices",
  "notice.searchPlaceholder": "Search notice titles or content",
  "notice.loadingList": "Loading notices...",
  "notice.emptyState": "No notices yet.",
  "notice.photoBadge": "🖼 Photo",
  "notice.detailTitle": "Notice details",
  "notice.loadingDetail": "Loading notice details...",
  "notice.imageDotAria": "View notice image {{index}}",
  "notice.missingDetailTarget": "No notice was selected to view.",
}
