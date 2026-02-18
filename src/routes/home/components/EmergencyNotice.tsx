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
          flex items-start gap-3
          rounded-[22px]
          px-4 py-4
          bg-white-500/8
          text-gray-700
          border border-gray-200/60
          shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        "
      >
        <div className="mt-0.5">
          <AlertCircle size={20} strokeWidth={2.2} />
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-[13px]">
            {notice.title}
          </span>
          <span className="mt-1 text-[13px] leading-relaxed text-gray-700/90">
            {notice.content}
          </span>
        </div>
      </div>
    </section>
  )
}

export default EmergencyNotice
