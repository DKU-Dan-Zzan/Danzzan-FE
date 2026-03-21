type RecordLike = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordLike => {
  return Boolean(value) && typeof value === "object";
};

const readString = (record: RecordLike, key: string): string | undefined => {
  const value = record[key];
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
};

export class AdminContractError extends Error {
  readonly endpoint: string;

  constructor(endpoint: string, message: string) {
    super(`[admin-contract:${endpoint}] ${message}`);
    this.name = "AdminContractError";
    this.endpoint = endpoint;
  }
}

const unwrapEnvelope = (payload: unknown, endpoint: string): RecordLike => {
  if (!isRecord(payload)) {
    throw new AdminContractError(endpoint, "응답 본문이 객체 형태가 아닙니다.");
  }

  if (payload.data === undefined || payload.data === null) {
    return payload;
  }

  if (!isRecord(payload.data)) {
    throw new AdminContractError(endpoint, "data 필드가 객체 형태가 아닙니다.");
  }

  return payload.data;
};

const parseMethod = (value: unknown): "PUT" => {
  if (typeof value === "string" && value.trim().toUpperCase() === "PUT") {
    return "PUT";
  }
  return "PUT";
};

export type NoticeImagePresignContract = {
  presignedUrl: string;
  fileUrl: string;
  imageUrl?: string;
  method: "PUT";
  expiresAt?: string;
};

export const parseNoticeImagePresignContract = (
  payload: unknown,
  endpoint: string,
): NoticeImagePresignContract => {
  const record = unwrapEnvelope(payload, endpoint);
  const presignedUrl = readString(record, "presignedUrl");
  const fileUrl = readString(record, "fileUrl");
  const imageUrl = readString(record, "imageUrl");
  const expiresAt = readString(record, "expiresAt");

  if (!presignedUrl || (!fileUrl && !imageUrl)) {
    throw new AdminContractError(endpoint, "presign 응답 형식이 올바르지 않습니다.");
  }

  return {
    presignedUrl,
    fileUrl: fileUrl ?? imageUrl!,
    imageUrl,
    method: parseMethod(record.method),
    expiresAt,
  };
};

export type AdImageUploadContract = {
  presignedUrl: string;
  imageUrl: string;
  method: "PUT";
  expiresAt?: string;
};

export const parseAdImageUploadContract = (
  payload: unknown,
  endpoint: string,
): AdImageUploadContract => {
  const record = unwrapEnvelope(payload, endpoint);
  const presignedUrl = readString(record, "presignedUrl");
  const imageUrl = readString(record, "imageUrl") ?? readString(record, "fileUrl");
  const expiresAt = readString(record, "expiresAt");

  if (!presignedUrl || !imageUrl) {
    throw new AdminContractError(endpoint, "광고 업로드 URL 응답 형식이 올바르지 않습니다.");
  }

  return {
    presignedUrl,
    imageUrl,
    method: parseMethod(record.method),
    expiresAt,
  };
};
