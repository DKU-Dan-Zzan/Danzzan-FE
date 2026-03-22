import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "@/lib/env";

describe("resolveApiBaseUrl", () => {
  it("rewrites localhost explicit URL to proxy path for external access", () => {
    const baseUrl = resolveApiBaseUrl({
      primary: "http://localhost:8080",
      runtimeHost: "demo-tunnel.ngrok-free.app",
    });

    expect(baseUrl).toBe("/api");
  });

  it("rewrites 127.0.0.1 explicit URL to proxy path for LAN runtime host", () => {
    const baseUrl = resolveApiBaseUrl({
      primary: "http://127.0.0.1:8080",
      runtimeHost: "192.168.0.21",
    });

    expect(baseUrl).toBe("/api");
  });

  it("keeps localhost explicit URL when runtime host is localhost", () => {
    const baseUrl = resolveApiBaseUrl({
      primary: "http://localhost:8080",
      runtimeHost: "localhost",
    });

    expect(baseUrl).toBe("http://localhost:8080");
  });

  it("keeps non-local explicit URL unchanged", () => {
    const baseUrl = resolveApiBaseUrl({
      primary: "https://api.example.com",
      runtimeHost: "demo-tunnel.ngrok-free.app",
    });

    expect(baseUrl).toBe("https://api.example.com");
  });

  it("builds runtime-host-based URL when explicit URL is not set", () => {
    const baseUrl = resolveApiBaseUrl({
      backendTarget: "compose",
      runtimeHost: "demo-tunnel.ngrok-free.app",
    });

    expect(baseUrl).toBe("http://demo-tunnel.ngrok-free.app:8081");
  });
});
