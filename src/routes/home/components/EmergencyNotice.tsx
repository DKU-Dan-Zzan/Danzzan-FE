import { Megaphone } from "lucide-react"

export interface EmergencyNoticeData {
  id: number
  title: string
  content: string
  createdAt?: string
}

interface Props {
  notice: EmergencyNoticeData | null
}

const EmergencyNotice = ({ notice }: Props) => {
  if (!notice) return null

  const isNew = notice.createdAt === "방금 전"

  return (
    <section className="px-4 mt-6">
      <div
        className="
          relative
          rounded-2xl
          bg-white
          border border-gray-200
          shadow-[0_12px_30px_rgba(10,85,156,0.12)]
          overflow-hidden
        "
      >
        {/* 얇은 상단 액센트 바 */}
        <div className="absolute top-0 left-0 right-0 h-[5px] bg-primary" />

        <div className="px-4 py-4 flex items-start gap-3">
          {/* 아이콘 */}
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

          {/* 텍스트 영역 */}
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[14px] text-gray-900">
                  {notice.title}
                </span>

                {isNew && (
                  <span
                    className="
                      px-2 py-[2px]
                      text-[10px] font-semibold
                      rounded-full
                      bg-primary text-white
                    "
                  >
                    NEW
                  </span>
                )}
              </div>

              {notice.createdAt && (
                <span className="text-[11px] text-gray-500 whitespace-nowrap">
                  {notice.createdAt}
                </span>
              )}
            </div>

            <p className="mt-2 text-[13px] leading-relaxed text-gray-700">
              {notice.content}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EmergencyNotice