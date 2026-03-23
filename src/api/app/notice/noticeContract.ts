// 역할: notice contract 응답 스키마를 검증하고 도메인 형태로 정규화한다.

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};

export type NoticeDto = {
  id: number;
  title: string;
  content: string;
  author: string;
  category: string | null;
  isPinned: boolean;
  thumbnailImageUrl?: string | null;
  imageUrls?: string[] | null;
  createdAt: string;
  updatedAt: string;
};

type RecordLike = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordLike => {
  return Boolean(value) && typeof value === "object";
};

const unwrapEnvelope = (payload: unknown): unknown => {
  if (!isRecord(payload)) {
    return payload;
  }
  if (!Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload;
  }
  return payload.data;
};

const readString = (record: RecordLike, key: string): string | undefined => {
  const value = record[key];
  if (typeof value !== "string") {
    return undefined;
  }
  return value;
};

const readStringOrNull = (record: RecordLike, key: string): string | null | undefined => {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  return value;
};

const readBoolean = (record: RecordLike, key: string): boolean | undefined => {
  const value = record[key];
  if (typeof value !== "boolean") {
    return undefined;
  }
  return value;
};

const readNumber = (record: RecordLike, key: string): number | undefined => {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
};

const readStringArrayOrNull = (record: RecordLike, key: string): string[] | null | undefined => {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (!Array.isArray(value)) {
    return undefined;
  }
  if (value.some((item) => typeof item !== "string")) {
    return undefined;
  }
  return value;
};

export class NoticeContractError extends Error {
  readonly endpoint: string;

  constructor(endpoint: string, message: string) {
    super(`[notice-contract:${endpoint}] ${message}`);
    this.name = "NoticeContractError";
    this.endpoint = endpoint;
  }
}

const parseNoticeDto = (payload: unknown, endpoint: string, indexLabel: string): NoticeDto => {
  if (!isRecord(payload)) {
    throw new NoticeContractError(endpoint, `${indexLabel}가 객체 형태가 아닙니다.`);
  }

  const id = readNumber(payload, "id");
  const title = readString(payload, "title");
  const content = readString(payload, "content");
  const author = readString(payload, "author");
  const category = readStringOrNull(payload, "category");
  const isPinned = readBoolean(payload, "isPinned");
  const thumbnailImageUrl = readStringOrNull(payload, "thumbnailImageUrl");
  const imageUrls = readStringArrayOrNull(payload, "imageUrls");
  const createdAt = readString(payload, "createdAt");
  const updatedAt = readString(payload, "updatedAt");

  if (
    id === undefined ||
    title === undefined ||
    content === undefined ||
    author === undefined ||
    category === undefined ||
    isPinned === undefined ||
    createdAt === undefined ||
    updatedAt === undefined
  ) {
    throw new NoticeContractError(endpoint, `${indexLabel} 필수 필드가 누락되었습니다.`);
  }

  if (thumbnailImageUrl === undefined && payload.thumbnailImageUrl !== undefined) {
    throw new NoticeContractError(endpoint, `${indexLabel} thumbnailImageUrl 필드 형식이 올바르지 않습니다.`);
  }

  if (imageUrls === undefined && payload.imageUrls !== undefined) {
    throw new NoticeContractError(endpoint, `${indexLabel} imageUrls 필드 형식이 올바르지 않습니다.`);
  }

  return {
    id,
    title,
    content,
    author,
    category,
    isPinned,
    thumbnailImageUrl,
    imageUrls,
    createdAt,
    updatedAt,
  };
};

export const parseNoticeListContract = (
  payload: unknown,
  endpoint: string,
): PageResponse<NoticeDto> => {
  const unwrapped = unwrapEnvelope(payload);
  if (!isRecord(unwrapped)) {
    throw new NoticeContractError(endpoint, "공지 목록 응답이 객체 형태가 아닙니다.");
  }

  if (!Array.isArray(unwrapped.content)) {
    throw new NoticeContractError(endpoint, "공지 목록 content 필드가 배열 형태가 아닙니다.");
  }

  const content = unwrapped.content.map((item, index) => parseNoticeDto(item, endpoint, `content[${index}]`));

  const totalElements = readNumber(unwrapped, "totalElements");
  const totalPages = readNumber(unwrapped, "totalPages");
  const size = readNumber(unwrapped, "size");
  const number = readNumber(unwrapped, "number");
  const first = readBoolean(unwrapped, "first");
  const last = readBoolean(unwrapped, "last");
  const numberOfElements = readNumber(unwrapped, "numberOfElements");
  const empty = readBoolean(unwrapped, "empty");

  if (
    totalElements === undefined ||
    totalPages === undefined ||
    size === undefined ||
    number === undefined ||
    first === undefined ||
    last === undefined ||
    numberOfElements === undefined ||
    empty === undefined
  ) {
    throw new NoticeContractError(endpoint, "공지 목록 페이지네이션 필드가 누락되었습니다.");
  }

  return {
    content,
    totalElements,
    totalPages,
    size,
    number,
    first,
    last,
    numberOfElements,
    empty,
  };
};

export const parseNoticeDetailContract = (payload: unknown, endpoint: string): NoticeDto => {
  const unwrapped = unwrapEnvelope(payload);
  return parseNoticeDto(unwrapped, endpoint, "notice");
};
