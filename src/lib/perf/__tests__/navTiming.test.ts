import { describe, expect, it } from "vitest";
import { createNavTimingTracker } from "@/lib/perf/navTiming";

describe("navTiming", () => {
  it("start/complete 이후 탭별 p50/p75/p95 요약을 반환하고 로그를 남긴다", () => {
    const logs: string[] = [];
    let now = 1_000;
    const tracker = createNavTimingTracker({
      enabled: true,
      now: () => now,
      log: (message) => {
        logs.push(message);
      },
    });

    tracker.markStart("/notice");
    now = 1_180;
    const summary = tracker.markRenderComplete("/notice");

    expect(summary).not.toBeNull();
    expect(summary?.route).toBe("/notice");
    expect(summary?.samples).toBe(1);
    expect(summary?.lastMs).toBe(180);
    expect(summary?.p50Ms).toBe(180);
    expect(summary?.p75Ms).toBe(180);
    expect(summary?.p95Ms).toBe(180);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toContain("[nav-timing] route=/notice");
  });

  it("경로를 정규화해서 query/hash/trailing-slash와 무관하게 같은 탭으로 집계한다", () => {
    const logs: string[] = [];
    let now = 500;
    const tracker = createNavTimingTracker({
      enabled: true,
      now: () => now,
      log: (message) => {
        logs.push(message);
      },
    });

    for (const duration of [100, 200, 400, 800]) {
      tracker.markStart("/map?day=1#top");
      now += duration;
      tracker.markRenderComplete("/map/");
    }

    const finalLog = logs.at(-1) ?? "";
    expect(finalLog).toContain("route=/map");
    expect(finalLog).toContain("samples=4");
    expect(finalLog).toContain("p50=200ms");
    expect(finalLog).toContain("p75=400ms");
    expect(finalLog).toContain("p95=800ms");
  });

  it("start 없이 complete만 호출하면 무시한다", () => {
    const logs: string[] = [];
    const tracker = createNavTimingTracker({
      enabled: true,
      now: () => 100,
      log: (message) => {
        logs.push(message);
      },
    });

    const summary = tracker.markRenderComplete("/mypage");

    expect(summary).toBeNull();
    expect(logs).toHaveLength(0);
  });
});
