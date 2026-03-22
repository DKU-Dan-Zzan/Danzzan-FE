import { describe, expect, it } from "vitest";
import {
  ADMIN_FOCUS_VISIBLE_RING_CLASS,
  ADMIN_PRIMARY_ACTION_BUTTON_CLASS,
  ADMIN_SECONDARY_ACTION_BUTTON_CLASS,
} from "@/routes/admin/adminStyleClasses";

describe("adminStyleClasses", () => {
  it("공통 포커스 링 클래스는 focus-visible 접근성 토큰을 제공한다", () => {
    expect(ADMIN_FOCUS_VISIBLE_RING_CLASS).toContain("focus-visible:outline-none");
    expect(ADMIN_FOCUS_VISIBLE_RING_CLASS).toContain("focus-visible:ring-2");
    expect(ADMIN_FOCUS_VISIBLE_RING_CLASS).toContain("focus-visible:ring-[var(--ring)]");
  });

  it("기본 액션 버튼 클래스는 공통 포커스 링 정책을 포함한다", () => {
    expect(ADMIN_PRIMARY_ACTION_BUTTON_CLASS).toContain("focus-visible:ring-[var(--ring)]");
    expect(ADMIN_SECONDARY_ACTION_BUTTON_CLASS).toContain("focus-visible:ring-[var(--ring)]");
  });
});
