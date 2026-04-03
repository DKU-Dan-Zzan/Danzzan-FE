// 역할: home 화면 컴포넌트의 Current Performance Section.test 동작을 검증하는 테스트입니다.
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import CurrentPerformanceSection from "@/components/app/home/CurrentPerformanceSection";

const refetchMock = vi.fn();

vi.mock("@/lib/query", () => ({
  appQueryKeys: {
    timetablePerformances: (date: string) => ["timetable", "performances", { date }],
  },
  useAppQuery: () => ({
    data: undefined,
    isPending: false,
    isError: true,
    error: new Error("공연 정보를 불러오지 못했어요."),
    refetch: refetchMock,
  }),
}));

describe("CurrentPerformanceSection", () => {
  it("에러 상태에서 card-outline(밝은 배경 + 강조 보더) 카드와 재시도 CTA를 버튼으로 노출한다", () => {
    const markup = renderToStaticMarkup(
      <StaticRouter location="/">
        <CurrentPerformanceSection />
      </StaticRouter>,
    );

    expect(markup).toContain("text-[var(--home-lineup-caption-color)]");
    expect(markup).toContain("bg-[var(--card-outline-bg)]");
    expect(markup).toContain("border-[var(--card-outline-border)]");
    expect(markup).toContain("shadow-[var(--card-outline-shadow)]");
    expect(markup).toContain("bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary_container)_100%)]");
    expect(markup).toContain(">다시 시도<");
    expect(markup).toContain("button");
  });
});
