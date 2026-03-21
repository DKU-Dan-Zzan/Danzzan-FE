import { http } from "@/lib/http"
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

type RequestOptions = {
  signal?: AbortSignal
}

export async function getPerformances(date: string, options?: RequestOptions) {
  const res = await http.get<TimetableResponseDto>(
    "/timetable/performances",
    {
      params: { date },
      signal: options?.signal,
    }
  )
  return res.data
}

export async function getContentImages(options?: RequestOptions) {
  const res = await http.get<ContentImageDto[]>("timetable/content-images", {
    signal: options?.signal,
  })
  return res.data
}
