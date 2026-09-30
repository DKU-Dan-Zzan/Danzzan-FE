// 역할: 기존 OFF 안내 화면의 배경 사진을 교체하고 적용 모습을 미리 보여준다.
import { useRef } from "react"
import { ImagePlus } from "lucide-react"
import { toast } from "sonner"
import { ADMIN_PRIMARY_ACTION_BUTTON_CLASS, ADMIN_SECONDARY_ACTION_BUTTON_CLASS } from "@/routes/admin/adminStyleClasses"
import ServiceClosedNotice from "@/routes/common/ServiceClosedNotice"

type Props = {
  url?: string | null
  file: File | null
  previewUrl?: string
  disabled: boolean
  onFile: (file: File) => void
  onReset: () => void
}

export default function TicketingBackgroundField({ url, file, previewUrl, disabled, onFile, onReset }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)

  return <div className="mt-5 border-t border-[var(--border-base)] pt-5">
    <h3 className="text-sm font-bold text-[var(--text)]">티켓팅 OFF 안내 배경</h3>
    <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">기존 안내 문구와 버튼은 유지하고 배경 사진을 바꿀 수 있습니다. 사진을 선택한 뒤 상단의 저장을 누르면 사용자 화면에 적용됩니다.</p>
    <div className="my-4 flex flex-wrap gap-2">
      <button type="button" disabled={disabled} className={ADMIN_PRIMARY_ACTION_BUTTON_CLASS} onClick={() => fileInput.current?.click()}>
        <ImagePlus aria-hidden="true" className="mr-1.5 inline-block h-4 w-4" />배경 사진 변경
      </button>
      <button type="button" disabled={disabled || (!file && !url)} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS} onClick={onReset}>기본 안내 화면 사용</button>
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
    <p className="mb-3 text-xs text-[var(--text-muted)]">{file ? `${file.name} · 저장 전 미리보기` : url ? "저장된 배경 사진" : "기존 티켓팅 OFF 안내 화면을 사용합니다."} (JPG·PNG, 최대 10MB)</p>
    <div aria-label="티켓팅 OFF 안내 화면 미리보기" className="pointer-events-none h-96 w-48 shrink-0 overflow-hidden rounded-xl border border-[var(--border-base)] bg-[var(--legend-ink)] sm:h-[480px] sm:w-60">
      <div className="w-[360px] origin-top-left scale-[0.533333] sm:scale-[0.666667]">
        <ServiceClosedNotice preview backgroundImageUrl={previewUrl ?? url} titleKey="closed.ticketing.title" descriptionKey="closed.ticketing.description" actionKey="closed.ticketing.action" actionTo="/" />
      </div>
    </div>
  </div>
}
