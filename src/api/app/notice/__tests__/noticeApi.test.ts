import { afterEach, describe, expect, it } from "vitest";
import { adGateway } from "@/api/common/adGateway";
import { http } from "@/lib/http";
import { getNoticeDetail, getNotices, getPlacementAd } from "@/api/app/notice/noticeApi";

describe("noticeApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getNotices는 AbortSignal을 전달한다", async () => {
    const signal = new AbortController().signal;
    const spy = vi.spyOn(http, "get").mockResolvedValue({
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
        numberOfElements: 0,
        empty: true,
      },
    } as never);

    await getNotices({ page: 0, size: 10 }, { signal });

    expect(spy).toHaveBeenLastCalledWith("/notices?page=0&size=10", { signal });
  });

  it("getNoticeDetail은 AbortSignal을 전달한다", async () => {
    const signal = new AbortController().signal;
    const spy = vi.spyOn(http, "get").mockResolvedValue({ data: {} } as never);

    await getNoticeDetail(10, { signal });

    expect(spy).toHaveBeenLastCalledWith("/notices/10", { signal });
  });

  it("getPlacementAd는 adGateway에 signal을 전달한다", async () => {
    const signal = new AbortController().signal;
    const spy = vi.spyOn(adGateway, "getPlacementAd").mockResolvedValue(null);

    await getPlacementAd("HOME_BOTTOM", { signal });

    expect(spy).toHaveBeenLastCalledWith("HOME_BOTTOM", {
      prefer: "web",
      signal,
    });
  });
});
