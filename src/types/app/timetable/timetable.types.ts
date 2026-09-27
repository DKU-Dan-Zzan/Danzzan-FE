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

// 운영 일수는 축제 설정에서 정하므로 며칠이든 될 수 있다(키는 DAY-1, DAY-2 ... 형태).
export type FestivalDay = {
  key: string
  label: string
  date: string
}
