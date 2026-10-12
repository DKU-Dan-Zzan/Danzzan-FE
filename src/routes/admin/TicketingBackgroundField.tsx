// 역할: 발급 티켓 카드와 OFF 안내 화면의 배경을 각각 변경하고 미리 보여준다.
import { useEffect, useRef, useState } from "react"
import { recommendPosterBackground, recommendationFile } from "@/api/app/festival/posterBackgroundApi"
import { FestivalBrandingContext } from "@/lib/app/festival/festivalBrandingContext"
import { useSavedPosterBranding } from "@/lib/app/festival/useSavedPosterBranding"
import { ImagePlus } from "lucide-react"
import { toast } from "sonner"
import { ADMIN_PRIMARY_ACTION_BUTTON_CLASS, ADMIN_SECONDARY_ACTION_BUTTON_CLASS } from "@/routes/admin/adminStyleClasses"
import { PaperTicketCard } from "@/components/ticketing/panels/PaperTicketCard"
import ServiceClosedNotice from "@/routes/common/ServiceClosedNotice"

type Props = {
  mode?: "ticket" | "closed"
  festivalName?: string
  url?: string | null
  file: File | null
  previewUrl?: string
  disabled: boolean
  onFile: (file: File) => void
  onReset: () => void
}

export default function TicketingBackgroundField({ mode = "closed", festivalName = "축제", url, file, previewUrl, disabled, onFile, onReset }: Props) {
  const branding = useSavedPosterBranding()
  const fileInput = useRef<HTMLInputElement>(null)
  const isTicket = mode === "ticket"
  const [recommending, setRecommending] = useState(false)
  const [reason, setReason] = useState("")
  const pending = useRef<AbortController | null>(null)
  const latest = useRef({ disabled, onFile })
  latest.current = { disabled, onFile }
  useEffect(() => () => { pending.current?.abort(); pending.current = null }, [mode])
  useEffect(() => { setReason(""); setRecommending(false) }, [mode])
  const recommend = async () => {
    if (disabled || pending.current) return
    const controller = new AbortController()
    pending.current = controller
    setRecommending(true)
    setReason("")
    const timeout = window.setTimeout(() => controller.abort(), 60_000)
    try {
      const result = await recommendPosterBackground(mode, controller.signal)
      if (pending.current !== controller || latest.current.disabled) return
      latest.current.onFile(recommendationFile(result))
      setReason(result.reason)
      toast.success("AI 추천 배경을 미리보기에 적용했습니다. 저장하면 사용자 화면에 반영됩니다.")
    } catch (error) {
      if (pending.current !== controller) return
      toast.error(controller.signal.aborted ? "AI 추천 시간이 초과되었습니다. 다시 시도해 주세요." : error instanceof Error ? error.message : "AI 배경 추천에 실패했습니다.")
    } finally {
      window.clearTimeout(timeout)
      if (pending.current === controller) { pending.current = null; setRecommending(false) }
    }
  }

  return <FestivalBrandingContext.Provider value={branding}><div className="mt-5 border-t border-[var(--border-base)] pt-5">
    <h3 className="text-sm font-bold text-[var(--text)]">{isTicket ? "발급 티켓 배경" : "티켓팅 OFF 안내 배경"}</h3>
    <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{isTicket ? "예매 완료 후 내 티켓에 표시되는 카드 배경입니다. 티켓팅 페이지 전체 배경은 변경되지 않습니다." : "입장 안내와 내 정보가 함께 사용하는 배경입니다. 안내 문구와 버튼은 유지됩니다."} 사진을 선택한 뒤 상단의 저장을 누르면 사용자 화면에 적용됩니다.</p>
    <div className="my-4 flex flex-wrap gap-2">
      <button type="button" disabled={disabled || recommending} className={ADMIN_PRIMARY_ACTION_BUTTON_CLASS} onClick={() => fileInput.current?.click()}>
        <ImagePlus aria-hidden="true" className="mr-1.5 inline-block h-4 w-4" />배경 사진 변경
      </button>
      <button type="button" disabled={disabled || recommending || (!file && !url)} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS} onClick={() => { setReason(""); onReset() }}>{isTicket ? "기본 티켓 배경 사용" : "기본 안내 화면 사용"}</button>
      <button type="button" disabled={disabled || recommending} aria-busy={recommending} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS} onClick={() => void recommend()}>
        {recommending ? "AI가 포스터 분석 중…" : "포스터로 AI 배경 추천"}
      </button>
      <input ref={fileInput} type="file" aria-label={isTicket ? "발급 티켓 배경 사진 선택" : "입장 안내 배경 사진 선택"} accept="image/jpeg,image/png" disabled={disabled || recommending} className="hidden" onChange={(event) => {
        const selected = event.target.files?.[0]
        event.target.value = ""
        if (!selected) return
        if (!["image/jpeg", "image/png"].includes(selected.type) || selected.size > 10 * 1024 * 1024 || selected.size === 0) {
          toast.error("10MB 이하의 JPG·PNG 이미지를 선택해 주세요."); return
        }
        setReason("")
        onFile(selected)
      }} />
    </div>
    <p className="mb-2 text-xs text-[var(--text-muted)]">저장된 공식 포스터를 AI가 분석해 초점을 추천하고, 그 위치를 기준으로 배경을 자릅니다. 새 그림을 생성하지 않습니다.</p>
    {reason && <p role="status" className="mb-2 text-xs text-[var(--text-muted)]">AI 추천: {reason}</p>}
    <p className="mb-3 text-xs text-[var(--text-muted)]">{file ? `${file.name} · 저장 전 미리보기` : url ? "저장된 배경 사진" : "공식 포스터를 기본 배경으로 사용하며, 없거나 불러오지 못하면 기본 이미지로 표시합니다."} (JPG·PNG, 최대 10MB)</p>
    <div aria-label={isTicket ? "발급 티켓 미리보기" : "티켓팅 OFF 안내 화면 미리보기"} className={isTicket ? "pointer-events-none max-w-md rounded-xl bg-[var(--surface-subtle)] p-4" : "pointer-events-none h-96 w-48 shrink-0 overflow-hidden rounded-xl border border-[var(--border-base)] bg-[var(--legend-ink)] sm:h-[480px] sm:w-60"}>
      {isTicket ? <>
        <PaperTicketCard backgroundImageUrl={previewUrl ?? url ?? null} ticket={{
          id: "preview", status: "issued", eventName: `${festivalName || "축제"} DAY 2`,
          eventDate: "2026-05-13", issuedAt: "", seat: "", qrCodeUrl: "", queueNumber: 2094,
        }} />
        <p className="mt-3 text-center text-xs text-[var(--text-muted)]">발급 티켓 예시 · 공연 일자와 예매 순번은 실제 발급 정보로 표시됩니다.</p>
      </> : <div className="w-[360px] origin-top-left scale-[0.533333] sm:scale-[0.666667]">
        <ServiceClosedNotice preview backgroundImageUrl={previewUrl ?? url} titleKey="closed.ticketing.title" descriptionKey="closed.ticketing.description" actionKey="closed.ticketing.action" actionTo="/" />
      </div>}
    </div>
  </div></FestivalBrandingContext.Provider>
}
