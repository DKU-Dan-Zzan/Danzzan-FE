// @vitest-environment jsdom
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
