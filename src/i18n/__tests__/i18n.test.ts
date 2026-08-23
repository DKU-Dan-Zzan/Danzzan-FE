import { describe, expect, it } from "vitest"
import { translate, type TranslationKey } from "@/i18n"
import { ko } from "@/i18n/locales/ko"
import { en } from "@/i18n/locales/en"

const PLACEHOLDER_PATTERN = /{{(\w+)}}/g

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

  it("보간 변수를 모두 채워 넘기면 사전에 남은 자리표시자가 없다", () => {
    // 일부 키(home.posterAlt 등)는 의도적으로 {{index}}, {{time}} 같은 자리표시자를 갖는다.
    // 그 변수를 모두 채워서 translate()를 호출했을 때 {{}}가 남지 않는지 확인한다.
    Object.entries(en).forEach(([key, value]) => {
      const names = Array.from(value.matchAll(PLACEHOLDER_PATTERN), (m) => m[1])
      if (names.length === 0) return

      const vars = Object.fromEntries(names.map((name) => [name, "x"]))
      const result = translate("en", key as TranslationKey, vars)
      expect(result, `en.${key}에 치환되지 않은 {{}}가 있다`).not.toContain("{{")
    })
  })

  it("보간 변수를 치환한다", () => {
    expect(translate("ko", "nav.home", { unused: 1 })).toBe("HOME")
  })
})
