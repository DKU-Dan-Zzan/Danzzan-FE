import { http } from "../lib/http"
import type { Performance } from "../routes/timetable/timetable.types"

export type TimetableResponseDto = {
  date: string
  performances: Performance[]
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