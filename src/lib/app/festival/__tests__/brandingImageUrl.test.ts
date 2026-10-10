import { describe, expect, it } from "vitest";
import { resolveBrandingImageUrl } from "@/lib/app/festival/brandingImageUrl";

describe("resolveBrandingImageUrl", () => {
  const api = "http://192.168.0.5:8080";

  it("keeps S3/CDN URLs unchanged", () => {
    expect(resolveBrandingImageUrl("https://bucket.s3.amazonaws.com/festival/logo.png", api, "192.168.0.5"))
      .toBe("https://bucket.s3.amazonaws.com/festival/logo.png");
  });

  it("uses the reachable API host for loopback local uploads on a phone", () => {
    expect(resolveBrandingImageUrl("http://localhost:8080/uploads/festival/1/poster/a.jpg", api, "192.168.0.5"))
      .toBe("http://192.168.0.5:8080/uploads/festival/1/poster/a.jpg");
    expect(resolveBrandingImageUrl("/uploads/festival/1/logo/a.png", api, "192.168.0.5"))
      .toBe("http://192.168.0.5:8080/uploads/festival/1/logo/a.png");
  });

  it("keeps local desktop and explicitly configured public URLs", () => {
    const local = "http://localhost:8080/uploads/festival/1/logo/a.png";
    expect(resolveBrandingImageUrl(local, api, "localhost")).toBe(local);
    const publicUrl = "https://images.example.com/uploads/festival/1/logo/a.png";
    expect(resolveBrandingImageUrl(publicUrl, api, "192.168.0.5")).toBe(publicUrl);
  });
});
