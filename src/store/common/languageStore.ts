// 역할: 앱 전역 표시 언어 상태를 보관하고 갱신하는 모듈 레벨 스토어를 정의한다.

export type Language = "ko" | "en"

const STORAGE_KEY = "danzzan.lang"
const SUPPORTED: readonly Language[] = ["ko", "en"]

const listeners = new Set<() => void>()

const isLanguage = (value: unknown): value is Language =>
  typeof value === "string" && SUPPORTED.includes(value as Language)

/**
 * 초기 언어를 정한다.
 * 저장된 선택이 최우선이고, 없으면 브라우저 언어로 판별한다.
 * 한국어가 아니면 영어로 시작한다. 외국인이 토글을 찾지 못해도 영어를 보게 하기 위함이다.
 */
export const detectInitialLanguage = (
  navigatorLanguages: readonly string[],
  stored: string | null,
): Language => {
  if (isLanguage(stored)) {
    return stored
  }
  const prefersKorean = navigatorLanguages.some((tag) =>
    tag.toLowerCase().startsWith("ko"),
  )
  return prefersKorean ? "ko" : "en"
}

const readStored = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const writeStored = (value: Language) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // 사파리 프라이빗 모드 등에서 실패할 수 있다. 언어 전환 자체는 계속 동작해야 한다.
  }
}

const readNavigatorLanguages = (): readonly string[] => {
  if (typeof navigator === "undefined") {
    return []
  }
  if (navigator.languages && navigator.languages.length > 0) {
    return navigator.languages
  }
  return navigator.language ? [navigator.language] : []
}

let current: Language = detectInitialLanguage(
  readNavigatorLanguages(),
  readStored(),
)

const notify = () => {
  listeners.forEach((listener) => listener())
}

export const languageStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  getSnapshot(): Language {
    return current
  },

  setLanguage(next: Language) {
    if (current === next) {
      return
    }
    current = next
    writeStored(next)
    notify()
  },

  toggle() {
    languageStore.setLanguage(current === "ko" ? "en" : "ko")
  },
}

/**
 * React 밖(axios 인터셉터 등)에서 현재 언어를 읽는다.
 */
export const getCurrentLanguage = (): Language => current
