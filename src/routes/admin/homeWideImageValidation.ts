const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

export const HOME_WIDE_IMAGE_ERRORS = {
  type: "JPG 또는 PNG 이미지만 업로드할 수 있습니다.",
  size: "이미지 크기는 최대 5MB까지 업로드할 수 있습니다.",
  resolution: "이미지 해상도가 너무 높습니다. 크기를 줄여 다시 업로드해 주세요. (최대 4,000만 픽셀)",
  unreadable: "이미지를 읽을 수 없습니다. 다른 이미지 파일을 선택해 주세요.",
} as const;

/** Validate upload metadata before calling the server; its limits remain authoritative. */
export async function validateHomeWideImage(file: File): Promise<string | null> {
  if (!ALLOWED_TYPES.has(file.type)) return HOME_WIDE_IMAGE_ERRORS.type;
  if (file.size > MAX_IMAGE_BYTES) return HOME_WIDE_IMAGE_ERRORS.size;
  if (file.size === 0) return HOME_WIDE_IMAGE_ERRORS.unreadable;

  return new Promise((resolve) => {
    let objectUrl: string;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      resolve(HOME_WIDE_IMAGE_ERRORS.unreadable);
      return;
    }

    const image = new Image();
    const finish = (error: string | null) => {
      image.onload = null;
      image.onerror = null;
      URL.revokeObjectURL(objectUrl);
      resolve(error);
    };
    image.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = image;
      if (!width || !height) finish(HOME_WIDE_IMAGE_ERRORS.unreadable);
      else if (width * height > MAX_IMAGE_PIXELS) finish(HOME_WIDE_IMAGE_ERRORS.resolution);
      else finish(null);
    };
    image.onerror = () => finish(HOME_WIDE_IMAGE_ERRORS.unreadable);
    try {
      image.src = objectUrl;
    } catch {
      finish(HOME_WIDE_IMAGE_ERRORS.unreadable);
    }
  });
}
