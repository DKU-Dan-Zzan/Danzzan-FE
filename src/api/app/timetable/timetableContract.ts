import type { Performance } from "@/types/app/timetable/timetable.types"

export type TimetableResponseDto = {
  date: string
  performances: Performance[]
}

export type ContentImageDto = {
  id: number
  name: string
  previewImageUrl: string
  detailImageUrl: string
}

type RecordLike = Record<string, unknown>

const isRecord = (value: unknown): value is RecordLike => {
  return Boolean(value) && typeof value === "object"
}

const unwrapEnvelope = (payload: unknown): unknown => {
  if (!isRecord(payload)) {
    return payload
  }
  if (!Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload
  }
  return payload.data
}

const readString = (record: RecordLike, key: string): string | undefined => {
  const value = record[key]
  if (typeof value !== "string") {
    return undefined
  }
  return value
}

const readStringOrNull = (record: RecordLike, key: string): string | null | undefined => {
  const value = record[key]
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  if (typeof value !== "string") {
    return undefined
  }
  return value
}

const readNumber = (record: RecordLike, key: string): number | undefined => {
  const value = record[key]
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined
  }
  return value
}

export class TimetableContractError extends Error {
  readonly endpoint: string

  constructor(endpoint: string, message: string) {
    super(`[timetable-contract:${endpoint}] ${message}`)
    this.name = "TimetableContractError"
    this.endpoint = endpoint
  }
}

const parsePerformance = (payload: unknown, endpoint: string, index: number): Performance => {
  if (!isRecord(payload)) {
    throw new TimetableContractError(endpoint, `performances[${index}]가 객체 형태가 아닙니다.`)
  }

  const performanceId = readNumber(payload, "performanceId")
  const startTime = readString(payload, "startTime")
  const endTime = readString(payload, "endTime")
  const artistId = readNumber(payload, "artistId")
  const artistName = readString(payload, "artistName")
  const artistImageUrl = readStringOrNull(payload, "artistImageUrl")
  const artistDescription = readStringOrNull(payload, "artistDescription")
  const stage = readStringOrNull(payload, "stage")

  if (
    performanceId === undefined ||
    startTime === undefined ||
    endTime === undefined ||
    artistId === undefined ||
    artistName === undefined ||
    artistImageUrl === undefined ||
    artistDescription === undefined ||
    stage === undefined
  ) {
    throw new TimetableContractError(endpoint, `performances[${index}] 필수 필드가 누락되었습니다.`)
  }

  return {
    performanceId,
    startTime,
    endTime,
    artistId,
    artistName,
    artistImageUrl,
    artistDescription,
    stage,
  }
}

export const parsePerformancesContract = (
  payload: unknown,
  endpoint: string,
): TimetableResponseDto => {
  const unwrapped = unwrapEnvelope(payload)
  if (!isRecord(unwrapped)) {
    throw new TimetableContractError(endpoint, "타임테이블 응답이 객체 형태가 아닙니다.")
  }

  const date = readString(unwrapped, "date")
  if (date === undefined) {
    throw new TimetableContractError(endpoint, "date 필드가 누락되었습니다.")
  }

  const performancesRaw = unwrapped.performances
  if (!Array.isArray(performancesRaw)) {
    throw new TimetableContractError(endpoint, "performances 필드가 배열 형태가 아닙니다.")
  }

  return {
    date,
    performances: performancesRaw.map((item, index) => parsePerformance(item, endpoint, index)),
  }
}

const parseContentImage = (
  payload: unknown,
  endpoint: string,
  index: number,
): ContentImageDto => {
  if (!isRecord(payload)) {
    throw new TimetableContractError(endpoint, `contentImages[${index}]가 객체 형태가 아닙니다.`)
  }

  const id = readNumber(payload, "id")
  const name = readString(payload, "name")
  const previewImageUrl = readString(payload, "previewImageUrl")
  const detailImageUrl = readString(payload, "detailImageUrl")

  if (id === undefined || name === undefined || previewImageUrl === undefined || detailImageUrl === undefined) {
    throw new TimetableContractError(endpoint, `contentImages[${index}] 필수 필드가 누락되었습니다.`)
  }

  return {
    id,
    name,
    previewImageUrl,
    detailImageUrl,
  }
}

export const parseContentImagesContract = (payload: unknown, endpoint: string): ContentImageDto[] => {
  const unwrapped = unwrapEnvelope(payload)
  if (!Array.isArray(unwrapped)) {
    throw new TimetableContractError(endpoint, "콘텐츠 이미지 응답이 배열 형태가 아닙니다.")
  }

  return unwrapped.map((item, index) => parseContentImage(item, endpoint, index))
}
