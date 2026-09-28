// 역할: 티켓팅 화면이 축제 설정의 티켓팅 사용 여부를 따르는지 검증한다.
import { afterEach, describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { StaticRouter } from "react-router-dom/server"
import { Route, Routes } from "react-router-dom"

import TicketingGate from "@/routes/common/TicketingGate"
import { setTicketingEnabled } from "@/lib/app/festival/festivalCalendar"

function renderGate() {
  return renderToStaticMarkup(
    <StaticRouter location="/ticket/ticketing">
      <Routes>
        <Route path="/ticket" element={<TicketingGate />}>
          <Route path="ticketing" element={<p>티켓팅 화면</p>} />
        </Route>
      </Routes>
    </StaticRouter>,
  )
}

describe("TicketingGate", () => {
  afterEach(() => {
    setTicketingEnabled(false)
  })

  it("설정에서 티켓팅을 켜면 티켓팅 화면을 보여준다", () => {
    setTicketingEnabled(true)

    expect(renderGate()).toContain("티켓팅 화면")
  })

  it("설정에서 티켓팅을 끄면 안내 화면으로 바꾼다", () => {
    setTicketingEnabled(false)

    const markup = renderGate()

    expect(markup).not.toContain("티켓팅 화면")
  })

  it("서버 응답 전에는 닫힌 것으로 본다", () => {
    // 잠깐 열렸다가 닫히면 티켓팅이 열린 줄 알고 들어온 사람이 혼란스럽다.
    expect(renderGate()).not.toContain("티켓팅 화면")
  })
})
