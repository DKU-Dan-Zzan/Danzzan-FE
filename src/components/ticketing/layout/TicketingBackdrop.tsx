import { useState } from "react"
import { cn } from "@/components/common/ui/utils"

export const DEFAULT_TICKETING_BACKGROUND = "/posters/ticketing-legend-background.jpg"

/** 사용자 화면과 관리자 미리보기가 같은 기본 배경/오류 대체 이미지를 사용한다. */
export function TicketingBackdrop({ url, className }: { url?: string | null; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const source = url && url !== failedUrl ? url : DEFAULT_TICKETING_BACKGROUND
  return <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden bg-[var(--legend-ink)]", className)}>
    <img src={source} alt="" className="h-full w-full object-cover object-center" onError={() => { if (url) setFailedUrl(url) }} />
  </div>
}
