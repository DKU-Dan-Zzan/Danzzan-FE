// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it } from "vitest"
import App from "@/App"
import { languageStore } from "@/store/common/languageStore"

// App은 평소 main.tsx의 QueryClientProvider 안에서 렌더링된다.
// /timetable 등 즉시 로드되는 라우트가 useAppQuery를 호출하므로 테스트에서도 동일하게 감싼다.
const renderAt = (path: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

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
