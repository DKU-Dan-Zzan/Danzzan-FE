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
}
