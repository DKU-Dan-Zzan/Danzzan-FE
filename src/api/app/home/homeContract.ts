export type HomeImageDto = {
  id: number
  imageUrl: string
  version?: string | null
}

export type EmergencyNoticeDto = {
  id: number
  content: string
  updatedAt?: string | null
}

export type LineupImageDto = {
  id: number
  imageUrl: string
}

type RecordLike = Record<string, unknown>

const isRecord = (value: unknown): value is RecordLike => {
  return Boolean(value) && typeof value === "object"
}

const readString = (record: RecordLike, key: string): string | undefined => {
  const value = record[key]
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed || undefined
}

const readOptionalString = (record: RecordLike, key: string): string | null | undefined => {
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

const unwrapEnvelope = (payload: unknown): unknown => {
  if (!isRecord(payload)) {
    return payload
  }

  if (!Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload
  }

  return payload.data
}

export class HomeContractError extends Error {
  readonly endpoint: string

  constructor(endpoint: string, message: string) {
    super(`[home-contract:${endpoint}] ${message}`)
    this.name = "HomeContractError"
    this.endpoint = endpoint
  }
}

const parseHomeImage = (payload: unknown, endpoint: string, index: number): HomeImageDto => {
  if (!isRecord(payload)) {
    throw new HomeContractError(endpoint, `home 이미지[${index}]가 객체 형태가 아닙니다.`)
  }

  const id = readNumber(payload, "id")
  const imageUrl = readString(payload, "imageUrl")
  const version = readOptionalString(payload, "version")

  if (id === undefined || !imageUrl) {
    throw new HomeContractError(endpoint, `home 이미지[${index}] 필수 필드가 누락되었습니다.`)
  }
  if (version !== undefined && version !== null && typeof version !== "string") {
    throw new HomeContractError(endpoint, `home 이미지[${index}] version 필드 형식이 올바르지 않습니다.`)
  }

  return { id, imageUrl, version }
}

export const parseHomeImagesContract = (payload: unknown, endpoint: string): HomeImageDto[] => {
  const unwrapped = unwrapEnvelope(payload)
  if (!Array.isArray(unwrapped)) {
    throw new HomeContractError(endpoint, "home 이미지 응답이 배열 형태가 아닙니다.")
  }

  return unwrapped.map((item, index) => parseHomeImage(item, endpoint, index))
}

const parseLineupImage = (payload: unknown, endpoint: string, index: number): LineupImageDto => {
  if (!isRecord(payload)) {
    throw new HomeContractError(endpoint, `라인업 이미지[${index}]가 객체 형태가 아닙니다.`)
  }

  const id = readNumber(payload, "id")
  const imageUrl = readString(payload, "imageUrl")
  if (id === undefined || !imageUrl) {
    throw new HomeContractError(endpoint, `라인업 이미지[${index}] 필수 필드가 누락되었습니다.`)
  }

  return { id, imageUrl }
}

export const parseLineupImagesContract = (payload: unknown, endpoint: string): LineupImageDto[] => {
  const unwrapped = unwrapEnvelope(payload)
  if (!Array.isArray(unwrapped)) {
    throw new HomeContractError(endpoint, "라인업 이미지 응답이 배열 형태가 아닙니다.")
  }

  return unwrapped.map((item, index) => parseLineupImage(item, endpoint, index))
}

export const parseEmergencyNoticeContract = (
  payload: unknown,
  endpoint: string,
): EmergencyNoticeDto | null => {
  const unwrapped = unwrapEnvelope(payload)
  if (
    unwrapped === null ||
    unwrapped === undefined ||
    (typeof unwrapped === "string" && !unwrapped.trim())
  ) {
    return null
  }

  if (!isRecord(unwrapped)) {
    throw new HomeContractError(endpoint, "긴급 공지 응답이 객체 형태가 아닙니다.")
  }

  const id = readNumber(unwrapped, "id")
  const content = readString(unwrapped, "content")
  const updatedAtRaw = readOptionalString(unwrapped, "updatedAt")
  const updatedAt =
    typeof updatedAtRaw === "string" ? updatedAtRaw.trim() || null : (updatedAtRaw ?? null)

  if (id === undefined || !content) {
    throw new HomeContractError(endpoint, "긴급 공지 응답 필수 필드가 누락되었습니다.")
  }

  return {
    id,
    content,
    updatedAt,
  }
}
