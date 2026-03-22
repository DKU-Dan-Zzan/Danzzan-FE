import { http } from "@/lib/http"
import {
  parseEmergencyNoticeContract,
  parseHomeImagesContract,
  parseLineupImagesContract,
} from "@/api/app/home/homeContract"

export type { HomeImageDto, EmergencyNoticeDto, LineupImageDto } from "@/api/app/home/homeContract"

type RequestOptions = {
  signal?: AbortSignal
}

export async function getHomeImages(options?: RequestOptions) {
  const endpoint = "/home/images"
  const res = await http.get<unknown>(endpoint, {
    signal: options?.signal,
  })
  return parseHomeImagesContract(res.data, endpoint)
}

export async function getEmergencyNotice(options?: RequestOptions) {
  const endpoint = "/home/emergencyNotice"
  const res = await http.get<unknown>(endpoint, {
    signal: options?.signal,
  })
  return parseEmergencyNoticeContract(res.data, endpoint)
}

export async function getLineupImages(options?: RequestOptions) {
  const endpoint = "/home/lineup-images"
  const res = await http.get<unknown>(endpoint, {
    signal: options?.signal,
  })
  return parseLineupImagesContract(res.data, endpoint)
}
