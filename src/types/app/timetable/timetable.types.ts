// 역할: 타임테이블 API와 화면 모델 간 공용 타입 계약을 정의한다.

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
