// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AdminLogin from "@/routes/ticketing/admin/login/AdminLogin";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
vi.mock("@/hooks/ticketing/useAuth", () => ({ useAuth: () => ({ login: vi.fn(), role: "manager", isAuthenticated: true, session: { permissions: ["TICKETING"] } }) }));
describe("manager ticket admin entry", () => {
  it.each(["/ticket/admin", "/ticket/admin/login", "/ticket/admin?redirect=https://evil.example", "/ticket/admin?redirect=/ticket/admin/login", "/ticket/admin?redirect=/ticket/admin/%zz"])("redirects %s to wristband", async (entry) => {
    const container = document.createElement("div"); const root = createRoot(container);
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><Routes><Route path="/ticket/admin" element={<AdminLogin />} /><Route path="/ticket/admin/login" element={<AdminLogin />} /><Route path="/ticket/admin/wristband" element={<p>팔찌 업무</p>} /></Routes></MemoryRouter>); });
    expect(container.textContent).toBe("팔찌 업무");
    await act(async () => root.unmount());
  });
});
