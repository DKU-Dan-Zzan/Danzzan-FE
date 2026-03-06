import { http } from "../lib/http"

export type HomeImageDto = {
  id: number
  imageUrl: string
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

export async function getHomeImages() {
  const res = await http.get<HomeImageDto[]>("/home/images")
  return res.data
}

export async function getEmergencyNotice() {
  const res = await http.get<EmergencyNoticeDto | null>("/home/emergencyNotice")
  return res.data
}

export async function getLineupImages() {
  const res = await http.get<LineupImageDto[]>("/home/lineup-images")
  return res.data
}
