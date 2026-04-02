// 역할: 관리자 공지/광고 에디터의 payload 생성, 이미지 업로드, 유효성 검증 로직을 제공합니다.
import type {
  CreateAdvertisementRequest,
  CreateNoticeRequest,
  NoticeResponse,
  UpdateEmergencyRequest,
} from "@/api/app/admin/adminApi";
import type {
  AdFormState,
  NoticeAuthor,
  NoticeFormState,
} from "@/routes/admin/admin-view-model";

export const MAX_NOTICE_IMAGE_COUNT = 10;
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

export const createEmptyNoticeForm = (): NoticeFormState => {
  return {
    title: "",
    content: "",
    author: "개발팀",
    isPinned: false,
    thumbnailImageUrl: "",
    images: [],
  };
};

export const createNoticeEditForm = (notice: NoticeResponse): NoticeFormState => {
  return {
    id: notice.id,
    title: notice.title,
    content: notice.content,
    author: (notice.author as NoticeAuthor) || "개발팀",
    isPinned: Boolean(notice.isPinned ?? notice.isEmergency),
    thumbnailImageUrl: notice.thumbnailImageUrl ?? "",
    images: notice.imageUrls ?? [],
  };
};

export const buildNoticePayload = (form: NoticeFormState): CreateNoticeRequest => {
  return {
    title: form.title.trim(),
    content: form.content.trim(),
    author: form.author,
    isPinned: form.isPinned,
    thumbnailImageUrl: form.thumbnailImageUrl.trim() || null,
    images: form.images,
  };
};

export const buildAdPayload = (form: AdFormState): CreateAdvertisementRequest => {
  return {
    title: form.title.trim() || "광고 배너",
    imageUrl: form.imageUrl.trim(),
    objectPosition: form.objectPosition || "50% 50%",
    placement: form.placement,
  };
};

export const buildEmergencyPayload = (
  message: string,
  isActive: boolean,
): UpdateEmergencyRequest => {
  return {
    message: message.trim(),
    isActive,
  };
};

export const validateNoticePayload = (payload: CreateNoticeRequest): string | null => {
  if (!payload.title || !payload.content) {
    return "제목과 내용을 모두 입력해 주세요.";
  }
  return null;
};

export const validateAdPayload = (payload: CreateAdvertisementRequest): string | null => {
  if (!payload.title) {
    return "광고 제목을 입력해 주세요.";
  }
  if (!payload.imageUrl) {
    return "이미지를 업로드해 주세요.";
  }
  return null;
};

export const validateImageFile = (
  file: File,
  oversizeMessage = `이미지 파일은 최대 ${MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024)}MB까지 업로드할 수 있습니다.`,
): string | null => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "이미지는 JPG, JPEG, PNG, WEBP 형식만 업로드할 수 있습니다.";
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return oversizeMessage;
  }
  return null;
};

export const createUploadFailureMessage = async (
  prefix: string,
  response: Pick<Response, "status" | "statusText" | "text">,
): Promise<string> => {
  const errorText = await response.text().catch(() => "");
  return [
    `${prefix}: ${response.status} ${response.statusText}`,
    errorText ? `응답: ${errorText}` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

type PresignedUploadPayload = {
  presignedUrl: string;
  method: "PUT";
};

export const uploadToPresignedUrl = async (
  presigned: PresignedUploadPayload,
  file: File,
): Promise<Response> => {
  return fetch(presigned.presignedUrl, {
    method: presigned.method,
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });
};
