function formatKoreanDate(dateStr: string) {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()]
  return `${y}년 ${m}월 ${day}일 (${weekday})`
}

export default function DateChip({ date }: { date: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800">
      {formatKoreanDate(date)}
    </div>
  )
}