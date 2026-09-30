// 역할: 티켓팅 OFF 안내 이미지의 선택·미리보기·기본 이미지 복원을 제공한다.
import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { ADMIN_SECONDARY_ACTION_BUTTON_CLASS } from "@/routes/admin/adminStyleClasses"

type Props = { url?: string | null; file: File | null; disabled: boolean; onFile: (file: File | null) => void; onReset: () => void }
export default function TicketingBackgroundField({ url, file, disabled, onFile, onReset }: Props) {
  const previewRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const objectUrl = file ? URL.createObjectURL(file) : null
    if (previewRef.current) previewRef.current.src = objectUrl ?? url ?? "/legend-poster.jpg"
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [file, url])
  return <div className="mt-5 border-t border-[var(--border-base)] pt-5">
    <h3 className="text-sm font-bold text-[var(--text)]">티켓팅 OFF 안내 배경</h3>
    <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">티켓팅을 사용하지 않을 때 보이는 배경입니다. JPG·PNG, 최대 10MB. 저장 후 적용되며 로그인·회원가입·내정보는 계속 이용할 수 있습니다.</p>
    <div className="mt-3 flex flex-wrap items-start gap-4">
      <img ref={previewRef} src={url ?? "/legend-poster.jpg"} alt="티켓팅 OFF 배경 미리보기" className="h-44 w-28 rounded-xl border border-[var(--border-base)] object-cover" />
      <div className="min-w-0 flex-1 space-y-3">
        <label className="block text-xs font-semibold text-[var(--text-muted)]">배경 사진 선택
          <input type="file" accept="image/jpeg,image/png" disabled={disabled} className="mt-2 block w-full text-sm" onChange={(event) => {
            const selected = event.target.files?.[0]
            event.target.value = ""
            if (!selected) return
            if (!["image/jpeg", "image/png"].includes(selected.type) || selected.size > 10 * 1024 * 1024 || selected.size === 0) {
              toast.error("10MB 이하의 JPG·PNG 이미지를 선택해 주세요."); return
            }
            onFile(selected)
          }} />
        </label>
        <button type="button" disabled={disabled || (!file && !url)} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS} onClick={onReset}>기본 이미지 사용</button>
        <p className="text-xs text-[var(--text-muted)]">{file ? file.name : url ? "등록된 배경 이미지" : "기본 축제 이미지"}</p>
      </div>
    </div>
  </div>
}
