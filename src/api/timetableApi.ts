import { http } from "../lib/http"
import type { Performance } from "../routes/timetable/timetable.types"

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

export async function getPerformances(date: string) {
  const res = await http.get<TimetableResponseDto>(
    "/timetable/performances",
    {
      params: { date }
    }
  )
  return res.data
}

export async function getContentImages() {
  const res = await http.get<ContentImageDto[]>("timetable/content-images")
  return res.data
}