import { http } from "@/lib/http"
import {
  parseContentImagesContract,
  parsePerformancesContract,
} from "@/api/app/timetable/timetableContract"

export type { TimetableResponseDto, ContentImageDto } from "@/api/app/timetable/timetableContract"

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
