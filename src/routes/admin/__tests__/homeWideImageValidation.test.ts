// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { HOME_WIDE_IMAGE_ERRORS, validateHomeWideImage } from "@/routes/admin/homeWideImageValidation";

const createObjectURL = vi.fn(() => "blob:home-wide-test");
const revokeObjectURL = vi.fn();

function mockImage(width: number, height: number, fails = false) {
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = createObjectURL;
    static revokeObjectURL = revokeObjectURL;
  });
  vi.stubGlobal("Image", class {
    naturalWidth = width;
    naturalHeight = height;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) {
      queueMicrotask(() => { if (fails) this.onerror?.(); else this.onload?.(); });
    }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("validateHomeWideImage", () => {
  it("accepts a readable JPEG at the 5MiB boundary and revokes its object URL", async () => {
    mockImage(1920, 1080);
    const file = new File([new Uint8Array(5 * 1024 * 1024)], "wide.jpg", { type: "image/jpeg" });
    await expect(validateHomeWideImage(file)).resolves.toBeNull();
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:home-wide-test");
  });

  it("rejects unsupported MIME types and oversized files before decoding", async () => {
    mockImage(1920, 1080);
    await expect(validateHomeWideImage(new File(["svg"], "image.svg", { type: "image/svg+xml" })))
      .resolves.toBe(HOME_WIDE_IMAGE_ERRORS.type);
    await expect(validateHomeWideImage(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "wide.jpg", { type: "image/jpeg" })))
      .resolves.toBe(HOME_WIDE_IMAGE_ERRORS.size);
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("rejects more than 40 million pixels but permits exactly 40 million", async () => {
    mockImage(8000, 5001);
    await expect(validateHomeWideImage(new File(["image"], "wide.png", { type: "image/png" })))
      .resolves.toBe(HOME_WIDE_IMAGE_ERRORS.resolution);
    expect(revokeObjectURL).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
    mockImage(8000, 5000);
    await expect(validateHomeWideImage(new File(["image"], "wide.png", { type: "image/png" })))
      .resolves.toBeNull();
  });

  it("reports decoding errors and zero-byte files without uploading", async () => {
    mockImage(0, 0, true);
    await expect(validateHomeWideImage(new File(["broken"], "wide.jpg", { type: "image/jpeg" })))
      .resolves.toBe(HOME_WIDE_IMAGE_ERRORS.unreadable);
    await expect(validateHomeWideImage(new File([], "empty.jpg", { type: "image/jpeg" })))
      .resolves.toBe(HOME_WIDE_IMAGE_ERRORS.unreadable);
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledOnce();
  });
});
