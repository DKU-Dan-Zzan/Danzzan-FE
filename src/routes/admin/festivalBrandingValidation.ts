const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

export function validateBrandingImage(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return "JPG 또는 PNG 이미지만 업로드할 수 있습니다.";
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) return "이미지는 5MB 이하의 비어 있지 않은 파일이어야 합니다.";
  return null;
}
