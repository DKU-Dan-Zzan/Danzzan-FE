# FE 영어 지원 · 비활성 서비스 안내 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 한/영 토글로 앱 전체가 영어로 전환되고, 가을 축제에 쓰지 않는 티켓팅·로그인·내 정보가 안내 화면으로 대체된다.

**Architecture:** 언어 상태는 기존 `authStore`와 같은 모듈 레벨 스토어로 두고 `useSyncExternalStore`로 구독한다. 컴포넌트 밖에서도 읽을 수 있어야 axios 인터셉터가 `lang` 파라미터를 붙일 수 있기 때문이다. 정적 문자열은 `ko`/`en` 사전으로, DB 콘텐츠는 BE가 `?lang=en`으로 이미 영문을 내려준다.

**Tech Stack:** React 18, TypeScript 5.9, Vite 7, react-router-dom 6, TanStack Query 5, axios, Tailwind 4, Vitest

관련 스펙: `Danzzan-BE/docs/superpowers/specs/2026-08-23-fall-festival-i18n-design.md`

## Global Constraints

- **i18n 라이브러리를 설치하지 않는다.** `scripts/check-bundle-budget.mjs`가 메인 index 청크에 **270,000바이트** 예산을 건다. i18next 계열은 압축 전 약 150KB로 이 예산을 위협한다. 자체 구현으로 간다.
- 언어 스토어는 `src/store/common/authStore.ts`의 패턴을 따른다: 모듈 레벨 `listeners: Set<() => void>`, `subscribe`, `getSnapshot`, localStorage 영속화.
- 파일 첫 줄에 `// 역할: ...` 주석을 단다. 이 코드베이스의 기존 관례다.
- 테스트는 각 디렉터리의 `__tests__/` 안에 둔다. Vitest + `@testing-library` 없이 `renderToStaticMarkup` 문자열 검증을 쓰는 기존 테스트가 많으므로 해당 파일의 방식을 따른다.
- **`/admin/**` 라우트는 절대 건드리지 않는다.** `/ticket/admin/**`과 완전히 별개이며 가을 축제 운영에 계속 쓴다.
- BE 인증 엔드포인트를 호출하는 코드는 지우지 않는다. `/admin/login`이 사용한다.
- 커밋 메시지는 기존 규칙을 따른다: `[DANZ-XXX] feat: 설명`. 티켓 번호가 없으면 `feat: 설명`.

## BE API 규약 (이 계획의 전제)

BE 계획의 산출물이다. BE 완성을 기다리지 않고 작업할 수 있다.

| 항목 | 값 |
|---|---|
| 파라미터 | `?lang=en` (생략 또는 `ko`면 한국어) |
| 적용 엔드포인트 | `GET /notices`, `GET /booths/**`, `GET /map/**`, `GET /timetable/**` |
| 응답 필드명 | **바뀌지 않는다.** `title`, `content`, `name` 등 그대로이고 값만 영문이 된다 |
| 영문 누락 시 | 한국어 값을 그대로 반환한다. null이나 빈 문자열이 오지 않는다 |

FE는 언어별로 다른 필드를 읽는 분기를 만들지 않는다. 쿼리 파라미터만 붙인다.

---

### Task 1: 언어 스토어

**Files:**
- Create: `src/store/common/languageStore.ts`
- Test: `src/store/common/__tests__/languageStore.test.ts`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces:
  - `type Language = "ko" | "en"`
  - `languageStore.subscribe(listener: () => void): () => void`
  - `languageStore.getSnapshot(): Language`
  - `languageStore.setLanguage(next: Language): void`
  - `languageStore.toggle(): void`
  - `getCurrentLanguage(): Language` — React 밖에서 쓰는 동기 읽기. axios 인터셉터가 사용한다.
  - `detectInitialLanguage(navigatorLanguages: readonly string[], stored: string | null): Language`

- [ ] **Step 1: 실패하는 테스트를 작성한다**

`src/store/common/__tests__/languageStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest"
import {
  detectInitialLanguage,
  getCurrentLanguage,
  languageStore,
} from "@/store/common/languageStore"

describe("detectInitialLanguage", () => {
  it("저장된 값이 있으면 그것을 우선한다", () => {
    expect(detectInitialLanguage(["en-US"], "ko")).toBe("ko")
    expect(detectInitialLanguage(["ko-KR"], "en")).toBe("en")
  })

  it("저장된 값이 없고 브라우저가 한국어면 한국어로 시작한다", () => {
    expect(detectInitialLanguage(["ko-KR", "en-US"], null)).toBe("ko")
  })

  it("저장된 값이 없고 브라우저가 한국어가 아니면 영어로 시작한다", () => {
    expect(detectInitialLanguage(["en-US"], null)).toBe("en")
    expect(detectInitialLanguage(["zh-CN"], null)).toBe("en")
    expect(detectInitialLanguage([], null)).toBe("en")
  })

  it("저장된 값이 유효하지 않으면 무시하고 브라우저를 본다", () => {
    expect(detectInitialLanguage(["ko-KR"], "fr")).toBe("ko")
  })
})

describe("languageStore", () => {
  beforeEach(() => {
    window.localStorage.clear()
    languageStore.setLanguage("ko")
  })

  it("언어를 바꾸면 구독자에게 알린다", () => {
    let callCount = 0
    const unsubscribe = languageStore.subscribe(() => {
      callCount += 1
    })

    languageStore.setLanguage("en")

    expect(callCount).toBe(1)
    expect(languageStore.getSnapshot()).toBe("en")

    unsubscribe()
  })

  it("같은 언어로 다시 설정하면 알리지 않는다", () => {
    let callCount = 0
    const unsubscribe = languageStore.subscribe(() => {
      callCount += 1
    })

    languageStore.setLanguage("ko")

    expect(callCount).toBe(0)

    unsubscribe()
  })

  it("토글은 두 언어를 오간다", () => {
    languageStore.toggle()
    expect(languageStore.getSnapshot()).toBe("en")

    languageStore.toggle()
    expect(languageStore.getSnapshot()).toBe("ko")
  })

  it("localStorage에 선택을 저장한다", () => {
    languageStore.setLanguage("en")

    expect(window.localStorage.getItem("danzzan.lang")).toBe("en")
  })

  it("React 밖에서도 현재 언어를 읽을 수 있다", () => {
    languageStore.setLanguage("en")

    expect(getCurrentLanguage()).toBe("en")
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
npm run test -- src/store/common/__tests__/languageStore.test.ts
```

Expected: FAIL. `Failed to resolve import "@/store/common/languageStore"`

- [ ] **Step 3: 스토어를 구현한다**

`src/store/common/languageStore.ts`:

```ts
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
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

```bash
npm run test -- src/store/common/__tests__/languageStore.test.ts
```

Expected: PASS (9개 테스트)

- [ ] **Step 5: 커밋한다**

```bash
git add src/store/common/languageStore.ts src/store/common/__tests__/languageStore.test.ts
git commit -m "feat: 표시 언어 스토어와 브라우저 언어 자동 판별 추가"
```

---

### Task 2: 번역 사전과 useT 훅

**Files:**
- Create: `src/i18n/locales/ko.ts`
- Create: `src/i18n/locales/en.ts`
- Create: `src/i18n/index.ts`
- Test: `src/i18n/__tests__/i18n.test.ts`

**Interfaces:**
- Consumes: `languageStore.subscribe`, `languageStore.getSnapshot` (Task 1)
- Produces:
  - `type TranslationKey = keyof typeof ko`
  - `useT(): (key: TranslationKey, vars?: Record<string, string | number>) => string`
  - `useLanguage(): { language: Language; setLanguage: (next: Language) => void; toggle: () => void }`
  - `translate(language: Language, key: TranslationKey, vars?): string` — React 밖 사용

- [ ] **Step 1: 실패하는 테스트를 작성한다**

`src/i18n/__tests__/i18n.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { translate } from "@/i18n"
import { ko } from "@/i18n/locales/ko"
import { en } from "@/i18n/locales/en"

describe("사전 무결성", () => {
  it("ko와 en의 키 집합이 정확히 일치한다", () => {
    const koKeys = Object.keys(ko).sort()
    const enKeys = Object.keys(en).sort()

    expect(enKeys).toEqual(koKeys)
  })

  it("어느 쪽에도 빈 문자열이 없다", () => {
    Object.entries(ko).forEach(([key, value]) => {
      expect(value, `ko.${key}가 비어 있다`).not.toBe("")
    })
    Object.entries(en).forEach(([key, value]) => {
      expect(value, `en.${key}가 비어 있다`).not.toBe("")
    })
  })
})

describe("translate", () => {
  it("선택한 언어의 문자열을 반환한다", () => {
    expect(translate("ko", "nav.boothmap")).toBe("부스맵")
    expect(translate("en", "nav.boothmap")).toBe("Booth Map")
  })

  it("영어 사전에 없는 키는 한국어로 폴백한다", () => {
    // 사전에 존재하지 않는 키를 넘겨 폴백 경로를 확인한다.
    // 모듈 객체를 변형하지 않으므로 다른 테스트에 영향을 주지 않는다.
    const unknownKey = "__does.not.exist__" as never

    expect(translate("en", unknownKey)).toBe("__does.not.exist__")
  })

  it("사전에 남은 보간 자리표시자가 없다", () => {
    Object.entries(en).forEach(([key, value]) => {
      expect(value, `en.${key}에 치환되지 않은 {{}}가 있다`).not.toContain("{{")
    })
  })

  it("보간 변수를 치환한다", () => {
    expect(translate("ko", "nav.home", { unused: 1 })).toBe("HOME")
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
npm run test -- src/i18n/__tests__/i18n.test.ts
```

Expected: FAIL. `Failed to resolve import "@/i18n"`

- [ ] **Step 3: 한국어 사전을 작성한다**

`src/i18n/locales/ko.ts`. 이 파일이 키의 기준이 된다.

```ts
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
} as const
```

- [ ] **Step 4: 영어 사전을 작성한다**

`src/i18n/locales/en.ts`. **키 순서를 `ko.ts`와 동일하게 유지한다.** 누락 검사를 눈으로도 할 수 있게 하기 위함이다.

```ts
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
```

- [ ] **Step 5: 훅과 translate를 작성한다**

`src/i18n/index.ts`:

```ts
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
```

- [ ] **Step 6: 테스트가 통과하는지 확인한다**

```bash
npm run test -- src/i18n/__tests__/i18n.test.ts
```

Expected: PASS (4개 테스트)

- [ ] **Step 7: 타입 검사를 실행한다**

```bash
npm run typecheck
```

Expected: 오류 없음. `en`의 타입이 `Record<keyof typeof ko, string>`이므로
키가 하나라도 빠지면 여기서 잡힌다.

- [ ] **Step 8: 커밋한다**

```bash
git add src/i18n/
git commit -m "feat: 한영 사전과 useT 훅 추가"
```

---

### Task 3: axios 인터셉터로 lang 파라미터 자동 부착

**Files:**
- Modify: `src/api/common/httpClient.ts`
- Test: `src/api/common/__tests__/httpClientLang.test.ts`

**Interfaces:**
- Consumes: `getCurrentLanguage()` (Task 1)
- Produces: 모든 GET 요청에 `lang` 쿼리 파라미터가 자동으로 붙는다

**이 태스크가 FE에서 가장 값이 큰 지점이다.** API 함수를 하나도 고치지 않고
모든 조회에 언어를 전달한다.

- [ ] **Step 1: 실패하는 테스트를 작성한다**

`src/api/common/__tests__/httpClientLang.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest"
import { attachLanguageParam } from "@/api/common/httpClient"
import { languageStore } from "@/store/common/languageStore"

describe("attachLanguageParam", () => {
  beforeEach(() => {
    window.localStorage.clear()
    languageStore.setLanguage("ko")
  })

  it("영어일 때 GET 요청에 lang=en을 붙인다", () => {
    languageStore.setLanguage("en")

    const config = attachLanguageParam({ method: "get", params: {} })

    expect(config.params.lang).toBe("en")
  })

  it("한국어일 때는 lang을 붙이지 않는다", () => {
    const config = attachLanguageParam({ method: "get", params: {} })

    expect(config.params.lang).toBeUndefined()
  })

  it("기존 파라미터를 지우지 않는다", () => {
    languageStore.setLanguage("en")

    const config = attachLanguageParam({ method: "get", params: { page: 0 } })

    expect(config.params.page).toBe(0)
    expect(config.params.lang).toBe("en")
  })

  it("params가 없어도 동작한다", () => {
    languageStore.setLanguage("en")

    const config = attachLanguageParam({ method: "get" })

    expect(config.params.lang).toBe("en")
  })

  it("GET이 아닌 요청에는 붙이지 않는다", () => {
    languageStore.setLanguage("en")

    const post = attachLanguageParam({ method: "post", params: {} })
    const put = attachLanguageParam({ method: "put", params: {} })

    expect(post.params.lang).toBeUndefined()
    expect(put.params.lang).toBeUndefined()
  })

  it("호출자가 lang을 지정하면 덮어쓰지 않는다", () => {
    languageStore.setLanguage("en")

    const config = attachLanguageParam({ method: "get", params: { lang: "ko" } })

    expect(config.params.lang).toBe("ko")
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
npm run test -- src/api/common/__tests__/httpClientLang.test.ts
```

Expected: FAIL. `attachLanguageParam is not exported`

- [ ] **Step 3: 인터셉터 함수를 추가한다**

`src/api/common/httpClient.ts` 상단의 import에 추가한다:

```ts
import { getCurrentLanguage } from "@/store/common/languageStore"
```

`HttpError` 클래스 선언 다음에 추가한다:

```ts
type LanguageAwareConfig = {
  method?: string
  params?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * 영어 표시 중인 GET 요청에 lang=en을 붙인다.
 * 한국어는 BE 기본값이라 파라미터를 생략해 캐시 키를 단순하게 유지한다.
 * 호출자가 lang을 명시했다면 존중한다.
 */
export const attachLanguageParam = <T extends LanguageAwareConfig>(
  config: T,
): T & { params: Record<string, unknown> } => {
  const params = { ...(config.params ?? {}) }
  const method = (config.method ?? "get").toLowerCase()

  if (method === "get" && params.lang === undefined) {
    const language = getCurrentLanguage()
    if (language === "en") {
      params.lang = "en"
    }
  }

  return { ...config, params }
}
```

`createHttpClient` 안에서 `const instance = axios.create({...})` 바로 다음에 등록한다:

```ts
  instance.interceptors.request.use((config) => attachLanguageParam(config))
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

```bash
npm run test -- src/api/common/__tests__/httpClientLang.test.ts
```

Expected: PASS (6개 테스트)

- [ ] **Step 5: TanStack Query 캐시 키에 언어를 포함시킨다**

언어를 바꿔도 쿼리 키가 같으면 이전 언어의 캐시가 그대로 보인다.
`src/lib/query/` 아래에서 쿼리 키를 만드는 지점을 찾는다:

```bash
grep -rn "queryKey" src/lib/query src/hooks/app | head -20
```

각 `queryKey` 배열 맨 앞에 현재 언어를 넣는다. 예:

```ts
queryKey: ["notices", language, page, size]
```

`language`는 `useLanguage()`에서 가져온다.

- [ ] **Step 6: 전체 테스트를 실행한다**

```bash
npm run test
```

Expected: 모든 테스트 통과

- [ ] **Step 7: 커밋한다**

```bash
git add src/api/common/httpClient.ts \
        src/api/common/__tests__/httpClientLang.test.ts \
        src/lib/query/
git commit -m "feat: 영어 표시 시 lang 파라미터 자동 부착 및 쿼리 키 분리"
```

---

### Task 4: 언어 토글 버튼

**Files:**
- Create: `src/components/layout/LanguageToggle.tsx`
- Modify: `src/components/layout/Header.tsx`
- Test: `src/components/layout/__tests__/LanguageToggle.test.tsx`

**Interfaces:**
- Consumes: `useLanguage()`, `useT()` (Task 2)
- Produces: `<LanguageToggle />` — 헤더 우측에 놓는 KO/EN 전환 버튼

- [ ] **Step 1: 실패하는 테스트를 작성한다**

`src/components/layout/__tests__/LanguageToggle.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it } from "vitest"
import LanguageToggle from "@/components/layout/LanguageToggle"
import { languageStore } from "@/store/common/languageStore"

describe("LanguageToggle", () => {
  beforeEach(() => {
    window.localStorage.clear()
    languageStore.setLanguage("ko")
  })

  it("한국어일 때 EN으로 전환할 수 있음을 보여준다", () => {
    const markup = renderToStaticMarkup(<LanguageToggle />)

    expect(markup).toContain("EN")
  })

  it("영어일 때 KO로 전환할 수 있음을 보여준다", () => {
    languageStore.setLanguage("en")

    const markup = renderToStaticMarkup(<LanguageToggle />)

    expect(markup).toContain("KO")
  })

  it("스크린리더용 레이블을 제공한다", () => {
    const markup = renderToStaticMarkup(<LanguageToggle />)

    expect(markup).toContain("aria-label")
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
npm run test -- src/components/layout/__tests__/LanguageToggle.test.tsx
```

Expected: FAIL. `Failed to resolve import "@/components/layout/LanguageToggle"`

- [ ] **Step 3: 토글 컴포넌트를 작성한다**

`src/components/layout/LanguageToggle.tsx`:

```tsx
// 역할: 헤더에서 한국어와 영어를 전환하는 버튼을 렌더링한다.

import { useLanguage, useT } from "@/i18n"
import { APP_HEADER_ROUND_BUTTON_CLASS } from "@/components/layout/AppHeaderRoundButtonClass"

const LanguageToggle = () => {
  const { language, toggle } = useLanguage()
  const t = useT()

  // 현재 언어가 아니라 "누르면 되는 언어"를 보여준다.
  const nextLabel = language === "ko" ? "EN" : "KO"

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("lang.toggle.aria")}
      className={`${APP_HEADER_ROUND_BUTTON_CLASS} text-[13px] font-bold tracking-[0.04em]`}
    >
      {nextLabel}
    </button>
  )
}

export default LanguageToggle
```

`APP_HEADER_ROUND_BUTTON_CLASS`의 정확한 export 이름을 먼저 확인한다:

```bash
grep -n "export" src/components/layout/AppHeaderRoundButtonClass.ts
```

이름이 다르면 실제 이름으로 바꾼다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

```bash
npm run test -- src/components/layout/__tests__/LanguageToggle.test.tsx
```

Expected: PASS (3개 테스트)

- [ ] **Step 5: 헤더에 토글을 넣는다**

`src/components/layout/Header.tsx`에서 티켓 버튼(`<Ticket size={22} />`)이 있는
버튼 그룹의 **맨 왼쪽**에 `<LanguageToggle />`을 추가한다.
import를 추가한다:

```tsx
import LanguageToggle from "@/components/layout/LanguageToggle"
```

- [ ] **Step 6: 브라우저에서 눈으로 확인한다**

```bash
npm run dev
```

`http://localhost:5173/`을 열어 헤더 우측에 `EN` 버튼이 보이는지, 누르면 `KO`로 바뀌는지 확인한다.
아직 화면 문자열은 한국어 그대로다. 다음 태스크에서 바꾼다.

- [ ] **Step 7: 커밋한다**

```bash
git add src/components/layout/LanguageToggle.tsx \
        src/components/layout/Header.tsx \
        src/components/layout/__tests__/LanguageToggle.test.tsx
git commit -m "feat: 헤더에 한영 전환 토글 버튼 추가"
```

---

### Task 5: 바텀네비 문자열 치환

**Files:**
- Modify: `src/components/layout/BottomNav.tsx`
- Modify: `src/components/layout/__tests__/BottomNav.test.tsx`

**Interfaces:**
- Consumes: `useT()` (Task 2)
- Produces: 없음

바텀네비를 첫 화면으로 삼는 이유는 모든 페이지에 보이므로 전환이 즉시 눈에 띄기 때문이다.

- [ ] **Step 1: 기존 테스트를 영어 케이스까지 확장한다**

`src/components/layout/__tests__/BottomNav.test.tsx`의 기존 테스트
`5개 탭 구조(부스맵/타임테이블/HOME/공지사항/티켓팅)를 렌더링한다` 아래에 추가한다:

```tsx
  it("영어일 때 탭 라벨이 영문으로 바뀐다", () => {
    languageStore.setLanguage("en")

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    )

    expect(markup).toContain(">Booth Map<")
    expect(markup).toContain(">Timetable<")
    expect(markup).toContain(">Notices<")
    expect(markup).toContain(">Ticketing<")

    languageStore.setLanguage("ko")
  })
```

파일 상단에 import를 추가한다:

```tsx
import { languageStore } from "@/store/common/languageStore"
```

기존 테스트가 `MemoryRouter`를 어떻게 감싸는지 파일에서 확인하고 같은 방식을 쓴다.

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
npm run test -- src/components/layout/__tests__/BottomNav.test.tsx
```

Expected: FAIL. 마크업에 `>Booth Map<`가 없다.

- [ ] **Step 3: BottomNav를 사전 기반으로 바꾼다**

`src/components/layout/BottomNav.tsx`에서 `STATIC_ITEMS`의 `label`을 키로 바꾼다:

```tsx
import type { TranslationKey } from "@/i18n"
import { useT } from "@/i18n"

type BottomNavItem = {
  to: string
  icon: typeof Home
  labelKey: TranslationKey
  center?: boolean
}

const STATIC_ITEMS: BottomNavItem[] = [
  { to: "/map", icon: Map, labelKey: "nav.boothmap" },
  { to: "/timetable", icon: Clock3, labelKey: "nav.timetable" },
  { to: "/", icon: Home, labelKey: "nav.home", center: true },
  { to: "/notice", icon: Megaphone, labelKey: "nav.notice" },
]
```

`BottomNav` 컴포넌트 안에서 `const t = useT()`를 선언하고,
`items` 구성에서 티켓팅 항목도 키로 바꾼다:

```tsx
  const items: BottomNavItem[] = [
    ...STATIC_ITEMS,
    { to: ticketingTarget, icon: Ticket, labelKey: "nav.ticketing" },
  ]
```

렌더링부에서 `item.label`을 쓰던 곳을 `t(item.labelKey)`로 바꾼다.
정확한 위치는 다음으로 찾는다:

```bash
grep -n "item.label\|\.label" src/components/layout/BottomNav.tsx
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

```bash
npm run test -- src/components/layout/__tests__/BottomNav.test.tsx
```

Expected: PASS

- [ ] **Step 5: 커밋한다**

```bash
git add src/components/layout/BottomNav.tsx \
        src/components/layout/__tests__/BottomNav.test.tsx
git commit -m "feat: 바텀네비 탭 라벨 다국어 적용"
```

---

### Task 6: 비활성 서비스 안내 화면

**Files:**
- Create: `src/routes/common/ServiceClosedNotice.tsx`
- Test: `src/routes/common/__tests__/ServiceClosedNotice.test.tsx`

**Interfaces:**
- Consumes: `useT()` (Task 2)
- Produces:
  - `<ServiceClosedNotice titleKey descriptionKey actionKey actionTo />`
  - props 타입: `{ titleKey: TranslationKey; descriptionKey: TranslationKey; actionKey: TranslationKey; actionTo: string }`

`src/routes/not-found/NotFoundPage.tsx`가 시각적 참조 구현이다.
브랜드 그라디언트 CTA, 워터마크 로고, 중앙 정렬 카드를 그대로 따른다.

- [ ] **Step 1: 실패하는 테스트를 작성한다**

`src/routes/common/__tests__/ServiceClosedNotice.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it } from "vitest"
import ServiceClosedNotice from "@/routes/common/ServiceClosedNotice"
import { languageStore } from "@/store/common/languageStore"

const renderNotice = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <ServiceClosedNotice
        titleKey="closed.ticketing.title"
        descriptionKey="closed.ticketing.description"
        actionKey="closed.ticketing.action"
        actionTo="/timetable"
      />
    </MemoryRouter>,
  )

describe("ServiceClosedNotice", () => {
  beforeEach(() => {
    window.localStorage.clear()
    languageStore.setLanguage("ko")
  })

  it("전달받은 문구를 한국어로 렌더링한다", () => {
    const markup = renderNotice()

    expect(markup).toContain("티켓 없이 들어오세요")
    expect(markup).toContain("타임테이블 보기")
  })

  it("영어일 때 영문 문구를 렌더링한다", () => {
    languageStore.setLanguage("en")

    const markup = renderNotice()

    expect(markup).toContain("No ticket needed")
    expect(markup).toContain("View timetable")
  })

  it("액션 버튼이 지정한 경로를 가리킨다", () => {
    const markup = renderNotice()

    expect(markup).toContain('href="/timetable"')
  })

  it("고장이 아님을 알리는 접근성 레이블을 제공한다", () => {
    const markup = renderNotice()

    expect(markup).toContain("aria-labelledby")
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
npm run test -- src/routes/common/__tests__/ServiceClosedNotice.test.tsx
```

Expected: FAIL. `Failed to resolve import "@/routes/common/ServiceClosedNotice"`

- [ ] **Step 3: 컴포넌트를 작성한다**

`src/routes/common/ServiceClosedNotice.tsx`:

```tsx
// 역할: 가을 축제에 제공하지 않는 서비스의 안내 화면을 공통으로 렌더링한다.

import { Link } from "react-router-dom"
import { Button } from "@/components/common/ui/button"
import { useT, type TranslationKey } from "@/i18n"

type ServiceClosedNoticeProps = {
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  actionKey: TranslationKey
  actionTo: string
}

const ServiceClosedNotice = ({
  titleKey,
  descriptionKey,
  actionKey,
  actionTo,
}: ServiceClosedNoticeProps) => {
  const t = useT()

  return (
    <section
      aria-labelledby="service-closed-title"
      className="relative flex min-h-full justify-start bg-[var(--bg-page-soft)] px-6 pb-[calc(var(--app-bottom-nav-runtime-offset)+1.25rem)] pt-[calc(env(safe-area-inset-top)+clamp(15rem,38vh,20rem))] text-[var(--text)]"
    >
      <img
        src="/DAN-ZZAN.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[36%] w-[22rem] max-w-[92%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.06] saturate-150 select-none"
        draggable={false}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[320px] flex-col items-center text-center">
        <h1
          id="service-closed-title"
          className="text-[1.6rem] font-extrabold leading-[1.28] tracking-[0] text-[var(--text)]"
        >
          {t(titleKey)}
        </h1>
        <p className="mt-3 max-w-[19rem] text-[0.94rem] leading-6 tracking-[0] text-[var(--text-muted)]">
          {t(descriptionKey)}
        </p>

        <div className="mt-8 w-full max-w-[220px]">
          <Button
            asChild
            className="h-11 w-full rounded-[8px] border border-[rgba(10,85,156,0.2)] bg-[linear-gradient(135deg,var(--brand-main)_0%,var(--text-emphasis-vivid-strong)_100%)] text-[0.9rem] tracking-[0] text-white shadow-[0_18px_32px_-20px_rgba(10,85,156,0.68)] hover:brightness-[1.03] focus-visible:ring-[rgba(10,85,156,0.38)] active:translate-y-px"
          >
            <Link to={actionTo}>{t(actionKey)}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default ServiceClosedNotice
```

404 페이지와 달리 큰 숫자(`404`)를 넣지 않는다. 오류가 아니라 안내이기 때문이다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

```bash
npm run test -- src/routes/common/__tests__/ServiceClosedNotice.test.tsx
```

Expected: PASS (4개 테스트)

- [ ] **Step 5: 커밋한다**

```bash
git add src/routes/common/ServiceClosedNotice.tsx \
        src/routes/common/__tests__/ServiceClosedNotice.test.tsx
git commit -m "feat: 비활성 서비스 공통 안내 화면 컴포넌트 추가"
```

---

### Task 7: 라우트를 안내 화면으로 교체

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/routes/ticketing/TicketingApp.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/BottomNav.tsx`
- Test: `src/routes/__tests__/closedServiceRoutes.test.tsx`

**Interfaces:**
- Consumes: `<ServiceClosedNotice />` (Task 6)
- Produces: 없음

**함정:** `/admin/**`과 `/ticket/admin/**`은 이름만 비슷하고 완전히 별개다.
`/admin/**`은 부스·공지·타임테이블 관리에 가을 축제 내내 쓴다. 여기서 실수하면
축제 당일 공지를 못 올린다.

- [ ] **Step 1: 실패하는 테스트를 작성한다**

`src/routes/__tests__/closedServiceRoutes.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it } from "vitest"
import App from "@/App"
import { languageStore } from "@/store/common/languageStore"

const renderAt = (path: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

describe("가을 축제 비활성 서비스 라우트", () => {
  beforeEach(() => {
    window.localStorage.clear()
    languageStore.setLanguage("ko")
  })

  it.each([
    "/mypage",
    "/login",
    "/signup",
    "/reset-password",
    "/ticketing",
    "/myticket",
  ])("%s는 안내 화면을 보여준다", (path) => {
    expect(renderAt(path)).toContain("service-closed-title")
  })

  it("관리자 경로는 안내 화면에 걸리지 않는다", () => {
    expect(renderAt("/admin/login")).not.toContain("service-closed-title")
  })

  it("일반 사용자 화면은 그대로 동작한다", () => {
    expect(renderAt("/notice")).not.toContain("service-closed-title")
    expect(renderAt("/timetable")).not.toContain("service-closed-title")
    expect(renderAt("/map")).not.toContain("service-closed-title")
  })
})
```

`App`이 `Suspense`와 lazy 라우트를 쓰므로 일부 경로는 로딩 폴백이 먼저 나올 수 있다.
그 경우 해당 케이스는 `NotFoundPage`가 아닌지만 확인하도록 단언을 조정한다.

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
npm run test -- src/routes/__tests__/closedServiceRoutes.test.tsx
```

Expected: FAIL. 마크업에 `service-closed-title`이 없다.

- [ ] **Step 3: App.tsx의 라우트를 교체한다**

import를 추가한다:

```tsx
import ServiceClosedNotice from "./routes/common/ServiceClosedNotice"
```

기존 리다이렉트 라우트 블록을 다음으로 교체한다:

```tsx
      <Route
        path="/login"
        element={
          <ServiceClosedNotice
            titleKey="closed.auth.title"
            descriptionKey="closed.auth.description"
            actionKey="closed.auth.action"
            actionTo="/"
          />
        }
      />
      <Route
        path="/signup"
        element={
          <ServiceClosedNotice
            titleKey="closed.auth.title"
            descriptionKey="closed.auth.description"
            actionKey="closed.auth.action"
            actionTo="/"
          />
        }
      />
      <Route
        path="/reset-password"
        element={
          <ServiceClosedNotice
            titleKey="closed.auth.title"
            descriptionKey="closed.auth.description"
            actionKey="closed.auth.action"
            actionTo="/"
          />
        }
      />
      <Route
        path="/ticketing"
        element={
          <ServiceClosedNotice
            titleKey="closed.ticketing.title"
            descriptionKey="closed.ticketing.description"
            actionKey="closed.ticketing.action"
            actionTo="/timetable"
          />
        }
      />
      <Route
        path="/myticket"
        element={
          <ServiceClosedNotice
            titleKey="closed.ticketing.title"
            descriptionKey="closed.ticketing.description"
            actionKey="closed.ticketing.action"
            actionTo="/timetable"
          />
        }
      />
```

`LegacyMyTicketRedirect` 컴포넌트는 더 이상 참조되지 않으면 삭제한다.

`AppLayout` 안의 `/mypage` 라우트를 교체한다:

```tsx
        <Route
          path="/mypage"
          element={
            <ServiceClosedNotice
              titleKey="closed.mypage.title"
              descriptionKey="closed.mypage.description"
              actionKey="closed.mypage.action"
              actionTo="/"
            />
          }
        />
```

`MyPage` lazy import와 `registerRoutePreloader("/mypage", MyPage.preload)` 줄을 제거한다.
**파일은 지우지 않는다.** 내년 봄에 되살린다.

- [ ] **Step 4: TicketingApp.tsx의 사용자 라우트를 교체한다**

`<Route element={<UserLayout />}>` 블록 안의 `login`, `reset-password`, `signup`,
`ticketing`, `my-ticket`, `myticket` 라우트를 모두 안내 화면으로 바꾼다.
`RequireStudentAuth` 래퍼는 제거한다. 인증을 요구할 이유가 없어졌다.

```tsx
          <Route index element={
            <ServiceClosedNotice
              titleKey="closed.ticketing.title"
              descriptionKey="closed.ticketing.description"
              actionKey="closed.ticketing.action"
              actionTo="/timetable"
            />
          } />
```

`login`, `signup`, `reset-password`는 `closed.auth.*` 키를,
`ticketing`, `my-ticket`, `myticket`은 `closed.ticketing.*` 키를 쓴다.

`admin` 하위 라우트(`admin`, `admin/login`, `admin/*`의 `wristband`)도
`closed.ticketing.*`로 바꾼다. 이것은 팔찌 운영 화면이며 `/admin/**`과 다르다.

- [ ] **Step 5: 헤더 버튼을 안내 화면으로 연결한다**

`src/components/layout/Header.tsx`에서:

```tsx
  const handleTicketClick = () => {
    navigate("/ticketing")
  }
```

`getMyTicketNavigationTarget` import가 더 이상 쓰이지 않으면 제거한다.
`/mypage`로 가는 핸들러는 그대로 두면 된다. 해당 라우트가 이미 안내 화면이다.

- [ ] **Step 6: 바텀네비 티켓팅 탭을 고정 경로로 바꾼다**

`src/components/layout/BottomNav.tsx`에서 인증 분기를 제거한다:

```tsx
  const items: BottomNavItem[] = [
    ...STATIC_ITEMS,
    { to: "/ticketing", icon: Ticket, labelKey: "nav.ticketing" },
  ]
```

`hasAuthenticatedRole`, `getTicketingNavigationTarget`, `authStore`,
`useSyncExternalStore` import가 더 이상 쓰이지 않으면 제거한다.

기존 테스트 중 `비로그인 상태에서는 티켓팅 탭이 로그인 redirect를 가리킨다` 등
인증 분기를 검증하던 4개 테스트는 더 이상 유효하지 않으므로 삭제하고,
`티켓팅 탭은 항상 안내 화면을 가리킨다` 하나로 대체한다.

- [ ] **Step 7: 테스트가 통과하는지 확인한다**

```bash
npm run test
```

Expected: 모든 테스트 통과

- [ ] **Step 8: 타입 검사와 린트를 실행한다**

```bash
npm run typecheck && npm run lint
```

Expected: 오류 없음. 미사용 import가 남아 있으면 여기서 잡힌다.

- [ ] **Step 9: 브라우저에서 확인한다**

```bash
npm run dev
```

확인 항목:
- `/mypage`, `/login`, `/ticketing`, `/ticket/login`에서 안내 화면이 보인다
- `/admin/login`에서 **관리자 로그인 폼이 정상 표시된다** (가장 중요)
- `/notice`, `/timetable`, `/map`이 정상 동작한다
- EN 토글 시 안내 문구가 영어로 바뀐다

- [ ] **Step 10: 커밋한다**

```bash
git add src/App.tsx src/routes/ticketing/TicketingApp.tsx \
        src/components/layout/Header.tsx src/components/layout/BottomNav.tsx \
        src/routes/__tests__/closedServiceRoutes.test.tsx \
        src/components/layout/__tests__/BottomNav.test.tsx
git commit -m "feat: 티켓팅·로그인·내정보 라우트를 안내 화면으로 교체"
```

---

### Task 8: 화면별 문자열 치환

**Files:**
- Modify: `src/routes/home/`, `src/routes/notice/`, `src/routes/timetable/`, `src/routes/boothmap/`, `src/routes/not-found/NotFoundPage.tsx`, `src/components/app/`
- Modify: `src/i18n/locales/ko.ts`, `src/i18n/locales/en.ts`

**Interfaces:**
- Consumes: `useT()` (Task 2)
- Produces: 사전에 화면별 키가 추가된다

한 화면씩 끝내고 커밋한다. 한 번에 다 하면 리뷰가 불가능해진다.

- [ ] **Step 1: 화면별 한국어 문자열을 목록화한다**

```bash
grep -rn '"[^"]*[가-힣][^"]*"' src/routes/home src/routes/notice src/routes/timetable src/routes/boothmap src/routes/not-found src/components/app --include='*.tsx' | grep -v '^\s*//' | grep -v 'aria-label=""'
```

주석(`// 역할:`)은 번역 대상이 아니다. JSX 텍스트와 문자열 리터럴만 뽑는다.

- [ ] **Step 2: NotFoundPage부터 치환한다**

가장 작고 사전 키가 이미 있다.

`src/routes/not-found/NotFoundPage.tsx`:

```tsx
import { useT } from "@/i18n"
```

컴포넌트 안에서 `const t = useT()`를 선언하고 문자열을 교체한다:

```tsx
        <h1 id="not-found-title" className="...">
          {t("notFound.title")}
        </h1>
        <p className="...">
          {t("notFound.description")}
        </p>
```

`홈으로` 버튼은 `{t("common.home")}`으로 바꾼다.

- [ ] **Step 3: NotFoundPage 테스트를 추가한다**

`src/routes/not-found/__tests__/NotFoundPage.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it } from "vitest"
import NotFoundPage from "@/routes/not-found/NotFoundPage"
import { languageStore } from "@/store/common/languageStore"

describe("NotFoundPage", () => {
  beforeEach(() => {
    window.localStorage.clear()
    languageStore.setLanguage("ko")
  })

  it("한국어 문구를 보여준다", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

    expect(markup).toContain("페이지를 찾을 수 없어요")
  })

  it("영어 문구를 보여준다", () => {
    languageStore.setLanguage("en")

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

    expect(markup).toContain("Page not found")
  })
})
```

- [ ] **Step 4: 테스트를 실행하고 커밋한다**

```bash
npm run test -- src/routes/not-found
git add src/routes/not-found/
git commit -m "feat: 404 화면 다국어 적용"
```

- [ ] **Step 5: 홈 화면을 치환한다**

Step 1에서 뽑은 목록의 홈 화면 문자열마다:

1. `ko.ts`에 `"home.<의미있는이름>": "원본 한국어"` 형태로 키를 추가한다
2. `en.ts`에 같은 키의 영문을 추가한다
3. 컴포넌트에서 `{t("home.<이름>")}`으로 교체한다

키 이름은 화면 접두사 + 용도로 짓는다. `home.emergencyBadge`처럼.
`home.text1` 같은 이름은 쓰지 않는다. 나중에 어느 문자열인지 알 수 없다.

- [ ] **Step 6: 홈 화면 테스트를 추가하고 커밋한다**

```bash
npm run test && npm run typecheck
git add src/routes/home/ src/i18n/locales/
git commit -m "feat: 홈 화면 다국어 적용"
```

- [ ] **Step 7: 공지 화면을 치환한다**

Step 5와 동일한 절차. 접두사는 `notice.`.

공지 **본문과 제목은 BE가 이미 영문으로 내려주므로 건드리지 않는다.**
번역 대상은 "전체", "고정", "더보기" 같은 UI 껍데기뿐이다.

- [ ] **Step 8: 공지 화면 테스트를 추가하고 커밋한다**

```bash
npm run test && npm run typecheck
git add src/routes/notice/ src/i18n/locales/
git commit -m "feat: 공지 화면 다국어 적용"
```

- [ ] **Step 9: 타임테이블 화면을 치환한다**

접두사는 `timetable.`. 요일·날짜 표기에 주의한다.
`toLocaleDateString`을 쓰는 곳이 있으면 언어에 따라 로케일을 넘긴다:

```tsx
const locale = language === "en" ? "en-US" : "ko-KR"
date.toLocaleDateString(locale, { month: "long", day: "numeric" })
```

`language`는 `useLanguage()`에서 가져온다.

- [ ] **Step 10: 타임테이블 테스트를 추가하고 커밋한다**

```bash
npm run test && npm run typecheck
git add src/routes/timetable/ src/i18n/locales/
git commit -m "feat: 타임테이블 화면 다국어 적용"
```

- [ ] **Step 11: 부스맵 화면을 치환한다**

접두사는 `boothmap.`. 이 화면의 문자열이 가장 많다(약 47줄).
부스·주점 **이름과 설명은 BE가 영문으로 내려주므로 건드리지 않는다.**

- [ ] **Step 12: 부스맵 테스트를 추가하고 커밋한다**

```bash
npm run test && npm run typecheck
git add src/routes/boothmap/ src/components/app/boothmap/ src/i18n/locales/
git commit -m "feat: 부스맵 화면 다국어 적용"
```

- [ ] **Step 13: 남은 공용 컴포넌트를 치환한다**

```bash
grep -rn '[가-힣]' src/components/app src/components/common src/components/layout --include='*.tsx' | grep -v '^\s*//' | grep -v '역할:'
```

남은 항목을 처리한다. 접두사는 `common.`.

- [ ] **Step 14: 사전 무결성과 전체 테스트를 확인한다**

```bash
npm run test && npm run typecheck && npm run lint
```

Expected: 모두 통과. Task 2의 키 일치 테스트가 누락을 잡는다.

- [ ] **Step 15: 번들 예산을 확인한다**

```bash
npm run build && npm run check:bundle-budget
```

Expected: `PASS`. 사전이 커져도 270,000바이트를 넘지 않아야 한다.
초과하면 `vite.config.ts`의 `manualChunks`에 `/src/i18n/`을 별도 청크로 분리한다.

- [ ] **Step 16: 커밋한다**

```bash
git add src/components/ src/i18n/locales/
git commit -m "feat: 공용 컴포넌트 다국어 적용"
```

---

### Task 9: 관리자 폼 영문 입력란

**Files:**
- Create: `src/routes/admin/components/EnglishFieldsAccordion.tsx`
- Modify: `src/api/app/admin/adminApi.ts`
- Modify: `src/api/app/admin/adminContract.ts`
- Modify: `src/routes/admin/hooks/useAdminNoticeActions.ts`
- Modify: `src/routes/admin/Admin.tsx`
- Test: `src/routes/admin/components/__tests__/EnglishFieldsAccordion.test.tsx`

**Interfaces:**
- Consumes: BE 관리자 API가 `titleEn`, `contentEn`, `enIsManual`을 반환하고 요청에서도 받는다 (BE 계획 Task 9)
- Produces: `<EnglishFieldsAccordion fields={...} onChange={...} isManual={...} />`

**이 화면은 번역하지 않는다.** 관리자는 한국인 운영진이므로 한국어 UI를 유지한다.
Task 8의 문자열 치환 대상에서 `src/routes/admin/`이 빠져 있는 이유가 이것이다.

- [ ] **Step 1: 실패하는 테스트를 작성한다**

`src/routes/admin/components/__tests__/EnglishFieldsAccordion.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import EnglishFieldsAccordion from "@/routes/admin/components/EnglishFieldsAccordion"

describe("EnglishFieldsAccordion", () => {
  const fields = [
    { name: "titleEn", label: "영문 제목", value: "", multiline: false },
    { name: "contentEn", label: "영문 본문", value: "", multiline: true },
  ]

  it("비어 있을 때 자동 번역 안내를 보여준다", () => {
    const markup = renderToStaticMarkup(
      <EnglishFieldsAccordion fields={fields} isManual={false} onChange={() => {}} />,
    )

    expect(markup).toContain("자동 번역")
  })

  it("수동 입력 상태일 때 직접 입력했음을 표시한다", () => {
    const markup = renderToStaticMarkup(
      <EnglishFieldsAccordion fields={fields} isManual onChange={() => {}} />,
    )

    expect(markup).toContain("직접 입력")
  })

  it("전달받은 필드를 모두 렌더링한다", () => {
    const markup = renderToStaticMarkup(
      <EnglishFieldsAccordion fields={fields} isManual={false} onChange={() => {}} />,
    )

    expect(markup).toContain("영문 제목")
    expect(markup).toContain("영문 본문")
  })

  it("여러 줄 필드는 textarea로 렌더링한다", () => {
    const markup = renderToStaticMarkup(
      <EnglishFieldsAccordion fields={fields} isManual={false} onChange={() => {}} />,
    )

    expect(markup).toContain("<textarea")
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
npm run test -- src/routes/admin/components/__tests__/EnglishFieldsAccordion.test.tsx
```

Expected: FAIL. `Failed to resolve import "@/routes/admin/components/EnglishFieldsAccordion"`

- [ ] **Step 3: 컴포넌트를 작성한다**

`src/routes/admin/components/EnglishFieldsAccordion.tsx`:

```tsx
// 역할: 관리자 등록/수정 폼에서 영문 번역을 접이식으로 확인하고 수정하게 한다.

type EnglishField = {
  name: string
  label: string
  value: string
  multiline: boolean
}

type EnglishFieldsAccordionProps = {
  fields: EnglishField[]
  isManual: boolean
  onChange: (name: string, value: string) => void
}

const EnglishFieldsAccordion = ({
  fields,
  isManual,
  onChange,
}: EnglishFieldsAccordionProps) => {
  return (
    <details className="mt-4 rounded-lg border border-[var(--border)] px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--text)]">
        영어 번역{" "}
        <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">
          {isManual ? "· 직접 입력함" : "· 비워두면 자동 번역"}
        </span>
      </summary>

      <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
        비워두면 저장할 때 자동으로 번역됩니다. 직접 입력하면 자동 번역이 덮어쓰지
        않습니다.
      </p>

      <div className="mt-3 flex flex-col gap-3">
        {fields.map((field) => (
          <label key={field.name} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {field.label}
            </span>
            {field.multiline ? (
              <textarea
                name={field.name}
                value={field.value}
                rows={4}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
              />
            ) : (
              <input
                type="text"
                name={field.name}
                value={field.value}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
              />
            )}
          </label>
        ))}
      </div>
    </details>
  )
}

export default EnglishFieldsAccordion
```

`<details>`를 쓰는 이유는 접이식 동작을 자바스크립트 없이 얻고 번들을 늘리지 않기 위해서다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

```bash
npm run test -- src/routes/admin/components/__tests__/EnglishFieldsAccordion.test.tsx
```

Expected: PASS (4개 테스트)

- [ ] **Step 5: 관리자 API 계약에 영문 필드를 추가한다**

`src/api/app/admin/adminContract.ts`에서 공지 DTO 타입에 추가한다:

```ts
  titleEn?: string | null
  contentEn?: string | null
  enIsManual?: boolean
```

파싱 함수가 알 수 없는 필드를 거부한다면 이 세 필드를 허용 목록에 넣는다.
다음으로 확인한다:

```bash
grep -n "titleEn\|parseAdmin\|strict" src/api/app/admin/adminContract.ts | head
```

- [ ] **Step 6: 공지 등록/수정 요청에 영문을 실어 보낸다**

`src/api/app/admin/adminApi.ts`의 공지 생성·수정 함수 payload 타입에
`titleEn`과 `contentEn`을 추가한다. 빈 문자열은 보내지 말고 `undefined`로 둔다.
빈 문자열을 보내면 BE가 "수동 입력"으로 오해한다:

```ts
const normalizeEnglish = (value: string | undefined) =>
  value && value.trim() !== "" ? value.trim() : undefined
```

- [ ] **Step 7: 공지 폼에 컴포넌트를 연결한다**

`src/routes/admin/hooks/useAdminNoticeActions.ts`의 편집 상태에
`titleEn`, `contentEn`을 추가하고, `src/routes/admin/Admin.tsx`의 공지 폼
본문 입력란 아래에 `<EnglishFieldsAccordion />`을 넣는다.

```tsx
<EnglishFieldsAccordion
  isManual={Boolean(editingNotice?.enIsManual)}
  fields={[
    {
      name: "titleEn",
      label: "영문 제목",
      value: editingNotice?.titleEn ?? "",
      multiline: false,
    },
    {
      name: "contentEn",
      label: "영문 본문",
      value: editingNotice?.contentEn ?? "",
      multiline: true,
    },
  ]}
  onChange={(name, value) =>
    setEditingNotice((prev) => (prev ? { ...prev, [name]: value } : prev))
  }
/>
```

`setEditingNotice`의 정확한 시그니처를 먼저 확인한다:

```bash
grep -n "setEditingNotice" src/routes/admin/hooks/useAdminNoticeActions.ts
```

- [ ] **Step 8: 부스·주점·아티스트 폼에도 같은 컴포넌트를 붙인다**

| 화면 | 파일 | 영문 필드 |
|---|---|---|
| 부스 관리 | `src/routes/admin/components/AdminBoothManagerPanel.tsx` | `nameEn`, `descriptionEn` |
| 주점 관리 | `src/routes/admin/components/AdminBoothManagerPanel.tsx` | `nameEn`, `introEn`, `descriptionEn`, `departmentEn` |
| 타임테이블 | `src/routes/admin/components/AdminTimetableManagerPanel.tsx` | 아티스트 `nameEn`·`descriptionEn`, 공연 `stageEn` |

- [ ] **Step 9: 전체 검사를 실행한다**

```bash
npm run test && npm run typecheck && npm run lint
```

Expected: 모두 통과

- [ ] **Step 10: 커밋한다**

```bash
git add src/routes/admin/ src/api/app/admin/
git commit -m "feat: 관리자 폼에 영문 번역 확인·수정란 추가"
```

---

### Task 10: 도커로 전체 스택 기동

**Files:**
- Create: `Danzzan-FE/Dockerfile`
- Create: `Danzzan-FE/nginx.conf`
- Create: `Danzzan-FE/.dockerignore`
- Create: `capstone_23/docker-compose.local.yml`

**Interfaces:**
- Consumes: 없음
- Produces: `docker compose -f docker-compose.local.yml up` 한 번으로 FE·BE·인프라가 모두 뜬다

- [ ] **Step 1: .dockerignore를 작성한다**

`Danzzan-FE/.dockerignore`:

```
node_modules
dist
coverage
.git
.env.development.local
*.log
```

`node_modules`를 제외하지 않으면 빌드 컨텍스트 전송이 수 분 걸린다.

- [ ] **Step 2: Dockerfile을 작성한다**

`Danzzan-FE/Dockerfile`:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# 컨테이너에서는 nginx가 /api를 BE로 프록시한다.
ENV VITE_API_BASE_URL=/api
ENV VITE_TICKETING_API_BASE_URL=/api
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

- [ ] **Step 3: nginx.conf를 작성한다**

`Danzzan-FE/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA 라우팅: 없는 경로는 index.html로 넘겨 react-router가 처리하게 한다.
    location / {
        try_files $uri $uri/ /index.html;
    }

    # /api 접두사를 떼고 BE로 넘긴다. vite dev 서버의 rewrite와 동일한 규칙이다.
    location /api/ {
        proxy_pass http://app:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`proxy_pass` 끝의 슬래시가 `/api` 접두사를 제거한다. 이게 없으면 BE가 `/api/notices`를
받고 404를 낸다.

- [ ] **Step 4: 통합 compose 파일을 작성한다**

`capstone_23/docker-compose.local.yml`:

```yaml
# 가을 축제 로컬 전체 스택.
# 실행: docker compose -f docker-compose.local.yml up -d --build

services:
  fe:
    build:
      context: ./Danzzan-FE
      dockerfile: Dockerfile
    container_name: danzzan-fe
    ports:
      - "5173:80"
    depends_on:
      - app
    restart: unless-stopped

  app:
    extends:
      file: ./Danzzan-BE/docker-compose.yml
      service: app

  mysql:
    extends:
      file: ./Danzzan-BE/docker-compose.yml
      service: mysql

  redis:
    extends:
      file: ./Danzzan-BE/docker-compose.yml
      service: redis

  kafka:
    extends:
      file: ./Danzzan-BE/docker-compose.yml
      service: kafka

  kafka-init:
    extends:
      file: ./Danzzan-BE/docker-compose.yml
      service: kafka-init

volumes:
  mysql_data:
  redis_data:
  kafka_data:
```

`extends`가 동작하지 않으면(compose 버전에 따라 `depends_on`이 상속되지 않는다)
BE compose의 서비스 정의를 이 파일에 그대로 복사한다. 그 경우
`context: ./Danzzan-BE`로 빌드 경로만 맞추면 된다.

**Kafka를 빼지 않는다.** 티켓팅을 FE에서 막아도 BE의 Kafka 컨슈머는 그대로 기동하므로,
빼면 앱이 뜨지 않는다.

- [ ] **Step 5: BE의 .env가 준비되어 있는지 확인한다**

```bash
grep -c "DEEPL_API_KEY" Danzzan-BE/.env
```

Expected: `1`. 없으면 `DEEPL_API_KEY=<키>` 줄을 추가한다.

- [ ] **Step 6: 전체 스택을 기동한다**

```bash
cd /Users/ziuuu/Documents/capstone_23
/Applications/Docker.app/Contents/Resources/bin/docker compose -f docker-compose.local.yml up -d --build
```

첫 빌드는 FE `npm ci`와 BE `gradlew bootJar` 때문에 수 분 걸린다.

- [ ] **Step 7: 기동 상태를 확인한다**

```bash
/Applications/Docker.app/Contents/Resources/bin/docker compose -f docker-compose.local.yml ps
```

Expected: `danzzan-fe`, `danzzan-app`, `danzzan-mysql`, `danzzan-redis`, `danzzan-kafka`가
모두 `Up` 상태다.

- [ ] **Step 8: 전체 흐름을 검증한다**

```bash
curl -s -o /dev/null -w "FE: %{http_code}\n" http://127.0.0.1:5173/
curl -s -o /dev/null -w "프록시: %{http_code}\n" http://127.0.0.1:5173/api/health
curl -s "http://127.0.0.1:5173/api/notices?lang=en" | python3 -m json.tool | head -20
```

Expected: FE 200, 프록시 200, 공지 응답의 `title`이 영문이다.

- [ ] **Step 9: 브라우저에서 눈으로 확인한다**

`http://localhost:5173/`을 열고:

- EN 토글을 눌렀을 때 네비·화면 문구가 영어로 바뀐다
- 공지 목록의 제목이 영문으로 바뀐다 (BE 번역 결과)
- 티켓팅 탭이 안내 화면을 보여준다
- `/admin/login`에서 관리자 로그인이 정상 동작한다

- [ ] **Step 10: 커밋한다**

FE 레포에서:

```bash
cd Danzzan-FE
git add Dockerfile nginx.conf .dockerignore
git commit -m "feat: FE 도커 이미지와 nginx 프록시 설정 추가"
```

`docker-compose.local.yml`은 두 레포 어디에도 속하지 않는 루트 파일이다.
BE 레포에 넣으려면 `Danzzan-BE/docker-compose.local.yml`로 옮기고 경로를
`./` 기준에서 `../`로 조정한다.

---

## 병렬 작업 안내

Task 1~8은 BE 완성 여부와 무관하다. Task 3의 `lang` 파라미터는 BE가
아직 무시해도 한국어 응답이 오므로 화면이 깨지지 않는다.

**Task 9는 BE 계획 Task 9(관리자 API 영문 필드)가 끝난 뒤** 실행한다.
**Task 10은 BE 계획 Task 10까지 끝난 뒤** 실행한다.

## 두 계획의 대응 관계

| FE 태스크 | 의존하는 BE 태스크 |
|---|---|
| Task 1~8 | 없음 |
| Task 9 (관리자 영문란) | BE Task 9 (관리자 API 영문 필드 노출) |
| Task 10 (도커) | BE Task 1~10 전체 |
