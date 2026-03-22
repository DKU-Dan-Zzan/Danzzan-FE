import { http } from "@/lib/http"
import type { Performance } from "@/types/app/timetable/timetable.types"
import {
  parseContentImagesContract,
  parsePerformancesContract,
} from "@/api/app/timetable/timetableContract"

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

type RequestOptions = {
  signal?: AbortSignal
}

export async function getPerformances(date: string, options?: RequestOptions) {
  const endpoint = "/timetable/performances"
  const res = await http.get<unknown>(
    endpoint,
    {
      params: { date },
      signal: options?.signal,
    }
  )
  return parsePerformancesContract(res.data, endpoint)
}

export async function getContentImages(options?: RequestOptions) {
  const endpoint = "timetable/content-images"
  const res = await http.get<unknown>(endpoint, {
    signal: options?.signal,
  })
  return parseContentImagesContract(res.data, endpoint)
}
