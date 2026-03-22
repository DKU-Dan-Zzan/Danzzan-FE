import type { BoothType } from "@/types/app/boothmap/boothmap.types";

type RecordLike = Record<string, unknown>;

const BOOTH_TYPE_VALUES: BoothType[] = [
  "EXPERIENCE",
  "FOOD_TRUCK",
  "EVENT",
  "FACILITY",
];
const boothTypeSet = new Set<BoothType>(BOOTH_TYPE_VALUES);

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

const readRawString = (record: RecordLike, key: string): string | undefined => {
  const value = record[key];
  if (typeof value !== "string") {
    return undefined;
  }
  return value;
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
  locationX: number;
  locationY: number;
};

export type ContractBoothMapResponse = {
  colleges: ContractCollegeDto[];
  booths: ContractBoothDto[];
};

export type ContractBoothSummaryResponse = {
  boothId: number;
  name: string;
  description: string;
  imageUrl: string | null;
};

export type ContractPubSummaryResponse = {
  pubId: number;
  name: string;
  intro: string;
  department: string;
  collegeId: number;
  collegeName: string;
  mainImageUrl: string | null;
};

export type ContractPubDetailResponse = {
  pubId: number;
  name: string;
  intro: string;
  description: string;
  department: string;
  collegeName: string;
  instagram: string;
  imageUrls: string[];
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
    const locationX = readNumber(item, "locationX");
    const locationY = readNumber(item, "locationY");
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
      locationX,
      locationY,
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
  const description = readRawString(unwrapped, "description");
  const imageUrl = readNullableString(unwrapped, "imageUrl");
  if (
    boothId === undefined ||
    !name ||
    description === undefined ||
    imageUrl === undefined
  ) {
    throw new BoothmapContractError(endpoint, "부스 상세 응답 필수 필드가 누락되었습니다.");
  }

  return {
    boothId,
    name,
    description,
    imageUrl,
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
    const intro = readRawString(item, "intro");
    const department = readRawString(item, "department");
    const collegeId = readNumber(item, "collegeId");
    const collegeName = readString(item, "collegeName");
    const mainImageUrl = readNullableString(item, "mainImageUrl");
    if (
      pubId === undefined ||
      !name ||
      intro === undefined ||
      department === undefined ||
      collegeId === undefined ||
      !collegeName ||
      mainImageUrl === undefined
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
  const intro = readRawString(unwrapped, "intro");
  const description = readRawString(unwrapped, "description");
  const department = readRawString(unwrapped, "department");
  const collegeName = readRawString(unwrapped, "collegeName");
  const instagram = readRawString(unwrapped, "instagram");
  const imageUrls = readStringArray(unwrapped, "imageUrls");
  if (
    pubId === undefined ||
    !name ||
    intro === undefined ||
    description === undefined ||
    department === undefined ||
    collegeName === undefined ||
    instagram === undefined ||
    !imageUrls
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
  };
};
