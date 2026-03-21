import { http } from "@/lib/http"

export type HomeImageDto = {
  id: number
  imageUrl: string
  version?: string | null
}

export type EmergencyNoticeDto = {
  id: number
  content: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export type LineupImageDto = {
  id: number
  imageUrl: string
}

type RequestOptions = {
  signal?: AbortSignal
}

export async function getHomeImages(options?: RequestOptions) {
  const res = await http.get<HomeImageDto[]>("/home/images", {
    signal: options?.signal,
  })
  return res.data
}

export async function getEmergencyNotice(options?: RequestOptions) {
  const res = await http.get<EmergencyNoticeDto | null>("/home/emergencyNotice", {
    signal: options?.signal,
  })
  return res.data
}

export async function getLineupImages(options?: RequestOptions) {
  const res = await http.get<LineupImageDto[]>("/home/lineup-images", {
    signal: options?.signal,
  })
  return res.data
}
