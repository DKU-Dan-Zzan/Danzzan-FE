// @vitest-environment jsdom
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
