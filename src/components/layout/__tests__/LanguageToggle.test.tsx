// @vitest-environment jsdom
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
