// 역할: boothmap contract 응답 스키마를 검증하고 도메인 형태로 정규화한다.

import type { BoothSubType, BoothType } from "@/types/app/boothmap/boothmap.types";

type RecordLike = Record<string, unknown>;

const BOOTH_TYPE_VALUES: BoothType[] = [
  "EXPERIENCE",
  "FOOD_TRUCK",
  "EVENT",
  "FACILITY",
];
const boothTypeSet = new Set<BoothType>(BOOTH_TYPE_VALUES);
const BOOTH_SUB_TYPE_VALUES: BoothSubType[] = [
  "TOILET",
  "RESTROOM",
  "SMOKING_AREA",
];
const boothSubTypeSet = new Set<BoothSubType>(BOOTH_SUB_TYPE_VALUES);

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

const readNumber = (record: RecordLike, key: string): number | undefined => {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
};

const readString = (record: RecordLike, key: string): string | undefined => {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  return value.trim();
};

const readNullableString = (record: RecordLike, key: string): string | null | undefined => {
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

const readStringArray = (record: RecordLike, key: string): string[] | undefined => {
  const value = record[key];
  if (!Array.isArray(value)) {
    return undefined;
  }
  if (value.some((item) => typeof item !== "string")) {
    return undefined;
  }
  return value;
};

const parseBoothType = (raw: unknown, endpoint: string, label: string): BoothType => {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new BoothmapContractError(endpoint, `${label} type 값이 비어 있습니다.`);
  }
  const normalized = raw.trim().toUpperCase() as BoothType;
  if (!boothTypeSet.has(normalized)) {
    throw new BoothmapContractError(endpoint, `${label} type 값이 유효하지 않습니다. (${raw})`);
  }
  return normalized;
};

const parseBoothSubType = (
  raw: unknown,
  endpoint: string,
  label: string,
): BoothSubType | null => {
  if (raw === undefined || raw === null) {
    return null;
  }

  if (typeof raw !== "string" || !raw.trim()) {
    throw new BoothmapContractError(endpoint, `${label} subType 값이 올바르지 않습니다.`);
  }

  const normalized = raw.trim().toUpperCase() as BoothSubType;
  if (!boothSubTypeSet.has(normalized)) {
    return null;
  }

  return normalized;
};

export class BoothmapContractError extends Error {
  readonly endpoint: string;

  constructor(endpoint: string, message: string) {
    super(`[boothmap-contract:${endpoint}] ${message}`);
    this.name = "BoothmapContractError";
    this.endpoint = endpoint;
  }
}

export type ContractCollegeDto = {
  collegeId: number;
  name: string;
  locationX: number;
  locationY: number;
};

export type ContractBoothDto = {
  boothId: number;
  name: string;
  type: BoothType;
  subType: BoothSubType | null;
  description: string | null;
  locationX: number;
  locationY: number;
  startTime: string | null;
  endTime: string | null;
};

export type ContractBoothMapResponse = {
  colleges: ContractCollegeDto[];
  booths: ContractBoothDto[];
};

export type ContractBoothSummaryResponse = {
  boothId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  startTime: string | null;
  endTime: string | null;
};

export type ContractPubSummaryResponse = {
  pubId: number;
  name: string;
  intro: string | null;
  department: string | null;
  collegeId: number;
  collegeName: string;
  mainImageUrl: string | null;
  thumbnailUrl: string | null;
  startTime: string | null;
  endTime: string | null;
};

export type ContractPubDetailResponse = {
  pubId: number;
  name: string;
  intro: string | null;
  description: string | null;
  department: string | null;
  collegeName: string | null;
  instagram: string | null;
  imageUrls: string[];
  startTime: string | null;
  endTime: string | null;
};

export const parseBoothMapContract = (payload: unknown, endpoint: string): ContractBoothMapResponse => {
  const unwrapped = unwrapEnvelope(payload);
  if (!isRecord(unwrapped)) {
    throw new BoothmapContractError(endpoint, "부스맵 응답이 객체 형태가 아닙니다.");
  }

  if (!Array.isArray(unwrapped.colleges) || !Array.isArray(unwrapped.booths)) {
    throw new BoothmapContractError(endpoint, "부스맵 colleges/booths 필드가 배열 형태가 아닙니다.");
  }

  const colleges = unwrapped.colleges.map((item, index) => {
    if (!isRecord(item)) {
      throw new BoothmapContractError(endpoint, `colleges[${index}]가 객체가 아닙니다.`);
    }

    const collegeId = readNumber(item, "collegeId");
    const name = readString(item, "name");
    const locationX = readNumber(item, "locationX");
    const locationY = readNumber(item, "locationY");
    if (
      collegeId === undefined ||
      !name ||
      locationX === undefined ||
      locationY === undefined
    ) {
      throw new BoothmapContractError(endpoint, `colleges[${index}] 필수 필드가 누락되었습니다.`);
    }

    return {
      collegeId,
      name,
      locationX,
      locationY,
    };
  });

  const booths = unwrapped.booths.map((item, index) => {
    if (!isRecord(item)) {
      throw new BoothmapContractError(endpoint, `booths[${index}]가 객체가 아닙니다.`);
    }

    const boothId = readNumber(item, "boothId");
    const name = readString(item, "name");
    const type = parseBoothType(item.type, endpoint, `booths[${index}]`);
    const subType = parseBoothSubType(item.subType, endpoint, `booths[${index}]`);
    const description = readNullableString(item, "description");
    const locationX = readNumber(item, "locationX");
    const locationY = readNumber(item, "locationY");
    const startTime = readNullableString(item, "startTime");
    const endTime = readNullableString(item, "endTime");
    if (
      boothId === undefined ||
      !name ||
      locationX === undefined ||
      locationY === undefined
    ) {
      throw new BoothmapContractError(endpoint, `booths[${index}] 필수 필드가 누락되었습니다.`);
    }

    return {
      boothId,
      name,
      type,
      subType,
      description: description ?? null,
      locationX,
      locationY,
      startTime: startTime ?? null,
      endTime: endTime ?? null,
    };
  });

  return {
    colleges,
    booths,
  };
};

export const parseBoothSummaryContract = (
  payload: unknown,
  endpoint: string,
): ContractBoothSummaryResponse => {
  const unwrapped = unwrapEnvelope(payload);
  if (!isRecord(unwrapped)) {
    throw new BoothmapContractError(endpoint, "부스 상세 응답이 객체 형태가 아닙니다.");
  }

  const boothId = readNumber(unwrapped, "boothId");
  const name = readString(unwrapped, "name");
  const description = readNullableString(unwrapped, "description");
  const imageUrl = readNullableString(unwrapped, "imageUrl");
  const thumbnailUrl = readNullableString(unwrapped, "thumbnailUrl");
  const startTime = readNullableString(unwrapped, "startTime");
  const endTime = readNullableString(unwrapped, "endTime");
  if (
    boothId === undefined ||
    !name ||
    description === undefined ||
    imageUrl === undefined ||
    startTime === undefined ||
    endTime === undefined
  ) {
    throw new BoothmapContractError(endpoint, "부스 상세 응답 필수 필드가 누락되었습니다.");
  }

  return {
    boothId,
    name,
    description,
    imageUrl,
    thumbnailUrl: thumbnailUrl ?? null,
    startTime,
    endTime,
  };
};

export const parsePubsContract = (payload: unknown, endpoint: string): ContractPubSummaryResponse[] => {
  const unwrapped = unwrapEnvelope(payload);
  if (!Array.isArray(unwrapped)) {
    throw new BoothmapContractError(endpoint, "주점 목록 응답이 배열 형태가 아닙니다.");
  }

  return unwrapped.map((item, index) => {
    if (!isRecord(item)) {
      throw new BoothmapContractError(endpoint, `pubs[${index}]가 객체가 아닙니다.`);
    }

    const pubId = readNumber(item, "pubId");
    const name = readString(item, "name");
    const intro = readNullableString(item, "intro");
    const department = readNullableString(item, "department");
    const collegeId = readNumber(item, "collegeId");
    const collegeName = readString(item, "collegeName");
    const mainImageUrl = readNullableString(item, "mainImageUrl");
    const thumbnailUrl = readNullableString(item, "thumbnailUrl");
    const startTime = readNullableString(item, "startTime");
    const endTime = readNullableString(item, "endTime");
    if (
      pubId === undefined ||
      !name ||
      intro === undefined ||
      department === undefined ||
      collegeId === undefined ||
      !collegeName ||
      mainImageUrl === undefined ||
      startTime === undefined ||
      endTime === undefined
    ) {
      throw new BoothmapContractError(endpoint, `pubs[${index}] 필수 필드가 누락되었습니다.`);
    }

    return {
      pubId,
      name,
      intro,
      department,
      collegeId,
      collegeName,
      mainImageUrl,
      thumbnailUrl: thumbnailUrl ?? null,
      startTime,
      endTime,
    };
  });
};

export const parsePubDetailContract = (payload: unknown, endpoint: string): ContractPubDetailResponse => {
  const unwrapped = unwrapEnvelope(payload);
  if (!isRecord(unwrapped)) {
    throw new BoothmapContractError(endpoint, "주점 상세 응답이 객체 형태가 아닙니다.");
  }

  const pubId = readNumber(unwrapped, "pubId");
  const name = readString(unwrapped, "name");
  const intro = readNullableString(unwrapped, "intro");
  const description = readNullableString(unwrapped, "description");
  const department = readNullableString(unwrapped, "department");
  const collegeName = readNullableString(unwrapped, "collegeName");
  const instagram = readNullableString(unwrapped, "instagram");
  const imageUrls = readStringArray(unwrapped, "imageUrls");
  const startTime = readNullableString(unwrapped, "startTime");
  const endTime = readNullableString(unwrapped, "endTime");
  if (
    pubId === undefined ||
    !name ||
    intro === undefined ||
    description === undefined ||
    department === undefined ||
    collegeName === undefined ||
    instagram === undefined ||
    !imageUrls ||
    startTime === undefined ||
    endTime === undefined
  ) {
    throw new BoothmapContractError(endpoint, "주점 상세 응답 필수 필드가 누락되었습니다.");
  }

  return {
    pubId,
    name,
    intro,
    description,
    department,
    collegeName,
    instagram,
    imageUrls,
    startTime,
    endTime,
  };
};
