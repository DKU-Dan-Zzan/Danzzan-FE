export type Performance = {
  performanceId: number
  startTime: string
  endTime: string
  artistId: number
  artistName: string
  artistImageUrl: string | null
  artistDescription: string | null
  stage: string | null
}

export type FestivalDay = {
  key: "DAY-1" | "DAY-2" | "DAY-3"
  label: "1일차" | "2일차" | "3일차"
  date: string
}
