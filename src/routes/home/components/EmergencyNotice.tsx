import { AlertCircle } from "lucide-react"

export interface EmergencyNoticeData {
  id: number
  title: string
  content: string
  isActive: boolean
}

interface Props {
  notice: EmergencyNoticeData | null
}

const EmergencyNotice = ({ notice }: Props) => {
  if (!notice || !notice.isActive) return null

  return (
    <section className="px-4 mt-4">
      <div
        className="
          relative
          flex items-start gap-3
          rounded-[20px]
          px-4 py-4
          bg-blue-50
          border border-blue-100
        "
      >
        {/* 왼쪽 포인트 바 */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-[20px]" />

        <div className="ml-2 mt-0.5 text-primary">
          <AlertCircle size={20} strokeWidth={2.2} />
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-[14px] text-primary">
            {notice.title}
          </span>
          <span className="mt-1 text-[13px] leading-relaxed text-gray-700">
            {notice.content}
          </span>
        </div>
      </div>
    </section>
  )
}

export default EmergencyNotice
