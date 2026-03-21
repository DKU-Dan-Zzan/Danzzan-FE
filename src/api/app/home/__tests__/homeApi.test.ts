import { afterEach, describe, expect, it } from "vitest";
import { http } from "@/lib/http";
import { getEmergencyNotice, getHomeImages, getLineupImages } from "@/api/app/home/homeApi";

describe("homeApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getHomeImages는 AbortSignal을 전달한다", async () => {
    const signal = new AbortController().signal;
    const spy = vi.spyOn(http, "get").mockResolvedValue({ data: [] } as never);

    await getHomeImages({ signal });

    expect(spy).toHaveBeenLastCalledWith("/home/images", { signal });
  });

  it("getLineupImages는 AbortSignal을 전달한다", async () => {
    const signal = new AbortController().signal;
    const spy = vi.spyOn(http, "get").mockResolvedValue({ data: [] } as never);

    await getLineupImages({ signal });

    expect(spy).toHaveBeenLastCalledWith("/home/lineup-images", { signal });
  });

  it("getEmergencyNotice는 AbortSignal을 전달한다", async () => {
    const signal = new AbortController().signal;
    const spy = vi.spyOn(http, "get").mockResolvedValue({ data: null } as never);

    await getEmergencyNotice({ signal });

    expect(spy).toHaveBeenLastCalledWith("/home/emergencyNotice", { signal });
  });
});
