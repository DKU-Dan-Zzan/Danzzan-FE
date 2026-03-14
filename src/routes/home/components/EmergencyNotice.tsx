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
          border border-[var(--border-base)]
          bg-[var(--surface-subtle)]
          shadow-[0_10px_22px_-16px_var(--shadow-color)]
        "
      >
        <div className="flex h-[38px] items-center gap-2.5 px-3">
          <div
            className="
              flex items-center justify-center
              w-6 h-6 rounded-full
              border border-[var(--border-base)]
              bg-[var(--surface-tint-subtle)]
              text-[var(--accent)]
              flex-shrink-0
            "
          >
            <Megaphone size={14} strokeWidth={2.2} />
          </div>

          <p className="min-w-0 truncate text-[13px] leading-none text-[var(--text)]">
            {notice.content}
          </p>
        </div>
      </div>
    </section>
  )
}

export default EmergencyNotice
