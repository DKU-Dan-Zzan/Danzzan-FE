import { ExternalLink, Ticket } from "lucide-react"

export type TicketingCtaData = {
  title: string
  subtitle: string
  href?: string
  badgeText?: string
}

type Props = { data: TicketingCtaData }

export default function TicketingCtaCard({ data }: Props) {
  const { title, subtitle, href, badgeText = "축제 티켓팅" } = data

  return (
    <section className="px-4">
      <a
        href={href ?? "#"}
        onClick={(e) => {
          if (!href) e.preventDefault()
        }}
        className="
          block rounded-[22px]
          shadow-[0_18px_50px_rgba(0,0,0,0.10)]
          active:scale-[0.99] transition
        "
        aria-label="티켓팅 페이지로 이동"
      >
        <div
          className="
            relative overflow-hidden
            rounded-[22px]
            bg-[#0a559c]
            px-5 py-4
            text-white
            flex items-center justify-between gap-4
            ring-1 ring-black/5
          "
        >
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/18 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-black/10 blur-2xl" />

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-white/90">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/14 px-2 py-1 border border-white/18">
                <Ticket size={14} />
                {badgeText}
              </span>
            </div>

            <div className="mt-2 text-[20px] font-extrabold tracking-tight">
              {title}
            </div>
            <div className="mt-1 text-[14px] text-white/80">
              {subtitle}
            </div>
          </div>

          <div
            className="
              shrink-0 h-11 w-11 rounded-2xl
              bg-white/12 border border-white/18
              flex items-center justify-center
            "
            aria-hidden="true"
          >
            <ExternalLink size={20} />
          </div>
        </div>
      </a>
    </section>
  )
}
