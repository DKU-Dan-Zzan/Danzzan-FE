// 역할: 표시 언어에 따라 UI 문자열을 반환하는 훅과 함수를 제공한다.

import { useCallback, useSyncExternalStore } from "react"
import { ko } from "@/i18n/locales/ko"
import { en } from "@/i18n/locales/en"
import { languageStore, type Language } from "@/store/common/languageStore"

export type TranslationKey = keyof typeof ko

const DICTIONARIES: Record<Language, Partial<Record<TranslationKey, string>>> = {
  ko,
  en,
}

const interpolate = (
  template: string,
  vars?: Record<string, string | number>,
): string => {
  if (!vars) {
    return template
  }
  return Object.entries(vars).reduce(
    (acc, [name, value]) => acc.replaceAll(`{{${name}}}`, String(value)),
    template,
  )
}

/**
 * 언어에 해당하는 문자열을 반환한다.
 * 해당 언어에 키가 없으면 한국어로 폴백한다. 번역 누락이 빈 화면이 되어서는 안 된다.
 */
export const translate = (
  language: Language,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string => {
  const template = DICTIONARIES[language]?.[key] ?? ko[key] ?? key
  return interpolate(template, vars)
}

export const useLanguage = () => {
  const language = useSyncExternalStore(
    languageStore.subscribe,
    languageStore.getSnapshot,
    languageStore.getSnapshot,
  )

  return {
    language,
    setLanguage: languageStore.setLanguage,
    toggle: languageStore.toggle,
  }
}

export const useT = () => {
  const { language } = useLanguage()

  return useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(language, key, vars),
    [language],
  )
}
