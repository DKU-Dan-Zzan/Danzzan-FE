// @vitest-environment jsdom
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

    expect(markup).toContain("사전 티켓팅 없이 진행됩니다")
    expect(markup).toContain("홈으로")
  })

  it("영어일 때 영문 문구를 렌더링한다", () => {
    languageStore.setLanguage("en")

    const markup = renderNotice()

    expect(markup).toContain("No advance ticketing")
    expect(markup).toContain("Go home")
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
