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

  "closed.ticketing.title": "No ticketing this time",
  "closed.ticketing.description":
    "There is no ticket to book or collect. See Notices for entry details.",
  "closed.ticketing.action": "Go home",

  "closed.auth.title": "No sign-in needed",
  "closed.auth.description":
    "Everything at the fall festival works without an account.",

  "closed.auth.action": "Go home",

  "closed.mypage.title": "Just come and enjoy!",
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

  "timetable.pageTitle": "Timetable",
  "timetable.scheduleDisclaimer": "* Schedule may change based on on-site conditions",
  "timetable.loadingPerformances": "Loading performance info...",
  "timetable.emptyState": "No performances scheduled.",
  "timetable.loadingContentImages": "Loading content images...",
  "timetable.emptyContentImages": "No content images available.",
  "timetable.timeRangeA11y": "from {{start}} to {{end}}",
  "timetable.nowPlayingAria": "Now playing, {{range}}",
  "timetable.performanceTimeAria": "Performance time {{range}}",
  "timetable.nowBadgeAria": "Now playing",

  "boothmap.loading": "Loading the booth map...",
  "boothmap.loadError": "Couldn't load booth map info.",

  "boothmap.type.pub": "Pub",
  "boothmap.type.foodTruck": "Food Truck",
  "boothmap.type.experience": "Booth",
  "boothmap.type.event": "Event",
  "boothmap.type.facility": "Facility",
  "boothmap.companyBoothChip": "Company booth",
  "boothmap.studentBoothChip": "Student booth",

  "boothmap.emptyBoothList": "No booths to show yet.",
  "boothmap.boothDetailAria": "View {{name}} details",
  "boothmap.boothSelectAria": "Select {{name}}",

  "boothmap.selectCollegeToViewPubs": "Select a college to see its pubs.",
  "boothmap.emptyPubsForCollege": "No pub info for this college yet.",
  "boothmap.operatingHoursLabel": "Operating Hours",

  "boothmap.allColleges": "All",

  "boothmap.backToList": "Back to list",

  "boothmap.imageDetailTitle": "Image detail view",
  "boothmap.detailImageAlt": "Detail image",
  "boothmap.noSelection": "Nothing is selected.",
  "boothmap.detailLoadError": "Couldn't load the details.",
  "boothmap.boothImageDetailAria": "View booth image details",
  "boothmap.boothImageAlt": "{{name}} image",
  "boothmap.noDetailContent": "No details have been added yet.",
  "boothmap.collegeFallback": "College",
  "boothmap.pubImageDetailAria": "View pub image {{index}} details",
  "boothmap.pubImageAlt": "{{name}} image {{index}}",
  "boothmap.noDisplayableDetail": "There are no details to show.",

  "boothmap.collegePubMarkerName": "{{college}} Pubs",
  "boothmap.zoneLabel.booth": "Booth Zone",
  "boothmap.zoneLabel.pub": "Pub Zone",
  "boothmap.zoneLabel.foodTruck": "Food Truck Zone",
  "boothmap.kakaoMapLoadError": "Couldn't load Kakao Map.",
  "boothmap.mapLoading": "Loading map...",

  "common.headerMyTicketAria": "View my ticket",
  "common.headerMyTicketSignInAria": "Sign in to view my ticket",
  "common.headerMyInfoAria": "My Info",
  "common.footerOrganizer": "Organized by the 58th LOU:D Student Council, Dankook University Jukjeon Campus",
  "common.footerSocialLinksLabel": "LOU:D Student Council Instagram · YouTube",
  "common.footerPrivacyPolicy": "Privacy Policy",
  "common.footerTermsOfService": "Terms of Service",
  "common.adBannerAlt": "Ad banner",
  "common.adBannerSlideAria": "Ad banner slides",
}
