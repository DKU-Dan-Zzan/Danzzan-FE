import { afterEach, describe, expect, it } from "vitest";
import { http } from "@/lib/http";
import { getContentImages, getPerformances } from "@/api/app/timetable/timetableApi";

describe("timetableApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getPerformances는 날짜 파라미터와 AbortSignal을 전달한다", async () => {
    const signal = new AbortController().signal;
    const spy = vi.spyOn(http, "get").mockResolvedValue({ data: { date: "2026-05-13", performances: [] } } as never);

    await getPerformances("2026-05-13", { signal });

    expect(spy).toHaveBeenLastCalledWith("/timetable/performances", {
      params: { date: "2026-05-13" },
      signal,
    });
  });

  it("getContentImages는 AbortSignal을 전달한다", async () => {
    const signal = new AbortController().signal;
    const spy = vi.spyOn(http, "get").mockResolvedValue({ data: [] } as never);

    await getContentImages({ signal });

    expect(spy).toHaveBeenLastCalledWith("timetable/content-images", { signal });
  });
});
