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

  const isNew = notice.updatedAt === "방금 전"

  return (
    <section className="px-4 mt-3 mb-1">
      <div
        className="
          rounded-[20px]
          bg-[#FCFCFD]
          border border-[#E8EDF3]
          shadow-[0_4px_12px_rgba(15,23,42,0.06)]
        "
      >
        <div className="px-4 py-3 flex items-start gap-3">
          <div
            className="
              flex items-center justify-center
              w-9 h-9 rounded-full
              bg-primary/10 text-primary
              flex-shrink-0
            "
          >
            <Megaphone size={18} strokeWidth={2.2} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-[14px] text-gray-900">
                  {notice.title}
                </span>

                {isNew && (
                  <span
                    className="
                      px-2 py-[2px]
                      text-[10px] font-semibold
                      rounded-full
                      bg-primary/90 text-white
                      flex-shrink-0
                    "
                  >
                    NEW
                  </span>
                )}
              </div>

              {notice.updatedAt && (
                <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
                  {notice.updatedAt}
                </span>
              )}
            </div>

            <p className="mt-1.5 text-[13px] leading-[1.5] text-gray-700 break-words">
              {notice.content}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EmergencyNotice