import { http } from "../lib/http"

export type CollegeDto = {
  collegeId: number
  name: string
  locationX: number
  locationY: number
}

export type BoothDto = {
  boothId: number
  name: string
  type: string
  locationX: number
  locationY: number
}

export type BoothMapResponse = {
  colleges: CollegeDto[]
  booths: BoothDto[]
}

export type BoothSummaryResponse = {
  boothId: number
  name: string
  description: string
  imageUrl: string | null
}

export type PubSummaryResponse = {
  pubId: number
  name: string
  intro: string
  department: string
  collegeId: number
  collegeName: string
  mainImageUrl: string | null
}

export type PubDetailResponse = {
  pubId: number
  name: string
  intro: string
  description: string
  department: string
  collegeName: string
  instagram: string
  imageUrls: string[]
}

export async function getBoothMap() {
  const res = await http.get<BoothMapResponse>("/map/booth-map")
  return res.data
}

export async function getBoothSummary(boothId: number) {
  const res = await http.get<BoothSummaryResponse>(`/map/booths/${boothId}`)
  return res.data
}

export async function getPubs() {
  const res = await http.get<PubSummaryResponse[]>("/map/pubs")
  return res.data
}

export async function getPubDetail(pubId: number) {
  const res = await http.get<PubDetailResponse>(`/map/pubs/${pubId}`)
  return res.data
}