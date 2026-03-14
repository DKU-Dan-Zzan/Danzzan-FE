import { Megaphone } from "lucide-react"

export interface EmergencyNoticeData {
  id: number
  title:string
  content: string
  updatedAt?: string
}

interface Props {
  notice: EmergencyNoticeData | null
}

const EmergencyNotice = ({ notice }: Props) => {
  if (!notice) return null

  return (
    <section className="mx-auto mt-[21px] w-full max-w-[314.4px]">
      <div
        className="
          rounded-[16px]
          bg-[#FCFCFD]
          border border-[#E8EDF3]
          shadow-[0_3px_10px_rgba(15,23,42,0.06)]
        "
      >
        <div className="flex h-[35px] items-center gap-2.5 px-3">
          <div
            className="
              flex items-center justify-center
              w-6 h-6 rounded-full
              bg-primary/10 text-primary
              flex-shrink-0
            "
          >
            <Megaphone size={14} strokeWidth={2.2} />
          </div>

          <p className="min-w-0 truncate text-[13px] leading-none text-gray-700">
            {notice.content}
          </p>
        </div>
      </div>
    </section>
  )
}

export default EmergencyNotice
