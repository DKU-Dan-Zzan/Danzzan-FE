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

    expect(markup).toContain("현장 대기 순서대로")
    expect(markup).toContain("홈으로")
  })

  it("영어일 때 영문 문구를 렌더링한다", () => {
    languageStore.setLanguage("en")

    const markup = renderNotice()

    expect(markup).toContain("the on-site queue order")
    expect(markup).toContain("Go home")
  })

  it("강조 구간을 별표가 아니라 강조 요소로 렌더링한다", () => {
    const markup = renderNotice()

    expect(markup).toContain("<strong")
    expect(markup).not.toContain("*")
  })

  it("성격이 다른 덧붙임 문구를 함께 렌더링한다", () => {
    const markup = renderNotice()

    expect(markup).toContain("앱 내 공지사항")
  })

  it("제목은 화면에 그리지 않고 스크린리더에만 남긴다", () => {
    const markup = renderNotice()

    // 지우면 화면 이름이 사라지므로 마크업에는 남아 있어야 한다.
    expect(markup).toContain("사전 티켓팅 없이 진행됩니다")
    expect(markup).toContain('class="sr-only"')
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
