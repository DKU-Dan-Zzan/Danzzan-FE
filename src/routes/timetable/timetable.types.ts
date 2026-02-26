export type Performance = {
  performanceId: number
  startTime: string // "HH:mm"
  endTime: string   // "HH:mm"
  artistId: number
  artistName: string
  artistImage: string | null
  artistDescription: string | null
  stage: string | null
}

export type FestivalDate = {
  key: "DAY-1" | "DAY-2" | "DAY-3"
  date: string // "YYYY-MM-DD"
}