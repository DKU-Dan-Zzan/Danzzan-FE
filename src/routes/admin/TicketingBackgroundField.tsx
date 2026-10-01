// 역할: ON 예매 화면과 OFF 안내 화면의 배경을 각각 변경하고 미리 보여준다.
import { useRef } from "react"
import { ImagePlus } from "lucide-react"
import { toast } from "sonner"
import { ADMIN_PRIMARY_ACTION_BUTTON_CLASS, ADMIN_SECONDARY_ACTION_BUTTON_CLASS } from "@/routes/admin/adminStyleClasses"
import { TicketingBackdrop } from "@/components/ticketing/layout/TicketingBackdrop"
import ServiceClosedNotice from "@/routes/common/ServiceClosedNotice"

type Props = {
  mode?: "open" | "closed"
  festivalName?: string
  url?: string | null
  file: File | null
  previewUrl?: string
  disabled: boolean
  onFile: (file: File) => void
  onReset: () => void
}

export default function TicketingBackgroundField({ mode = "closed", festivalName = "축제", url, file, previewUrl, disabled, onFile, onReset }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const isOpen = mode === "open"

  return <div className="mt-5 border-t border-[var(--border-base)] pt-5">
    <h3 className="text-sm font-bold text-[var(--text)]">{isOpen ? "티켓팅 ON 배경" : "티켓팅 OFF 안내 배경"}</h3>
    <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{isOpen ? "티켓팅 홈과 예매 화면 뒤에 표시되는 배경입니다. OFF 안내 배경과 별도로 저장됩니다." : "기존 안내 문구와 버튼은 유지하고 배경 사진을 바꿀 수 있습니다."} 사진을 선택한 뒤 상단의 저장을 누르면 사용자 화면에 적용됩니다.</p>
    <div className="my-4 flex flex-wrap gap-2">
      <button type="button" disabled={disabled} className={ADMIN_PRIMARY_ACTION_BUTTON_CLASS} onClick={() => fileInput.current?.click()}>
        <ImagePlus aria-hidden="true" className="mr-1.5 inline-block h-4 w-4" />배경 사진 변경
      </button>
      <button type="button" disabled={disabled || (!file && !url)} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS} onClick={onReset}>{isOpen ? "기본 티켓 배경 사용" : "기본 안내 화면 사용"}</button>
      <input ref={fileInput} type="file" aria-label="배경 사진 선택" accept="image/jpeg,image/png" disabled={disabled} className="hidden" onChange={(event) => {
        const selected = event.target.files?.[0]
        event.target.value = ""
        if (!selected) return
        if (!["image/jpeg", "image/png"].includes(selected.type) || selected.size > 10 * 1024 * 1024 || selected.size === 0) {
          toast.error("10MB 이하의 JPG·PNG 이미지를 선택해 주세요."); return
        }
        onFile(selected)
      }} />
    </div>
    <p className="mb-3 text-xs text-[var(--text-muted)]">{file ? `${file.name} · 저장 전 미리보기` : url ? "저장된 배경 사진" : isOpen ? "포스터 분위기의 기본 티켓 배경을 사용합니다." : "기존 티켓팅 OFF 안내 화면을 사용합니다."} (JPG·PNG, 최대 10MB)</p>
    <div aria-label={isOpen ? "티켓팅 ON 배경 미리보기" : "티켓팅 OFF 안내 화면 미리보기"} className="pointer-events-none h-96 w-48 shrink-0 overflow-hidden rounded-xl border border-[var(--border-base)] bg-[var(--legend-ink)] sm:h-[480px] sm:w-60">
      {isOpen ? <div className="relative h-full px-3 py-8">
        <TicketingBackdrop url={previewUrl ?? url} />
        <div className="relative rounded-2xl bg-white p-3 shadow-lg">
          <p className="text-[10px] font-bold text-stone-800">{festivalName || "축제"} DAY 2</p>
          <p className="mt-1 text-[9px] text-stone-500">티켓팅 시작 날짜 · 시간</p>
          <div className="mt-5 rounded-lg bg-stone-100 py-2 text-center text-[9px] text-stone-500">오픈 예정</div>
        </div>
        <p className="relative mt-4 text-center text-[10px] text-white/80">배경 적용 예시</p>
      </div> : <div className="w-[360px] origin-top-left scale-[0.533333] sm:scale-[0.666667]">
        <ServiceClosedNotice preview backgroundImageUrl={previewUrl ?? url} titleKey="closed.ticketing.title" descriptionKey="closed.ticketing.description" actionKey="closed.ticketing.action" actionTo="/" />
      </div>}
    </div>
  </div>
}
