import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { festivalBrandingApi, type BrandingImageKind, type FestivalBranding } from "@/api/app/festival/festivalBrandingApi";
import { ADMIN_FOCUS_VISIBLE_RING_CLASS, ADMIN_SECONDARY_ACTION_BUTTON_CLASS } from "@/routes/admin/adminStyleClasses";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);
const panel = "rounded-2xl border border-[var(--admin-panel-border)] bg-[var(--admin-panel-bg)] p-5 sm:p-6";

export function validateBrandingImage(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return "JPG 또는 PNG 이미지만 업로드할 수 있습니다.";
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) return "이미지는 10MB 이하의 비어 있지 않은 파일이어야 합니다.";
  return null;
}

function ImageField({ kind, title, description, url, busy, onUpload }: {
  kind: BrandingImageKind;
  title: string;
  description: string;
  url: string | null;
  busy: boolean;
  onUpload: (kind: BrandingImageKind, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <div className="rounded-xl border border-[var(--border-base)] p-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p></div>
      <button type="button" className={`${ADMIN_SECONDARY_ACTION_BUTTON_CLASS} ${ADMIN_FOCUS_VISIBLE_RING_CLASS} text-sm`} disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? "업로드 중…" : url ? "이미지 변경" : "이미지 업로드"}
      </button>
    </div>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png" aria-label={`${title} 파일 선택`} className="sr-only" onChange={(event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) onUpload(kind, file);
    }} />
    <div className="mt-4 flex min-h-36 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-subtle)] p-3">
      {url ? <img src={url} alt={`현재 ${title}`} className="max-h-64 max-w-full object-contain" /> : <p className="text-sm text-[var(--text-muted)]">등록된 {title}가 없습니다.</p>}
    </div>
  </div>;
}

export function FestivalBrandingPanel() {
  const [branding, setBranding] = useState<FestivalBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKind, setBusyKind] = useState<BrandingImageKind | null>(null);

  async function load(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const current = await festivalBrandingApi.get(undefined, signal);
      if (!signal?.aborted) setBranding(current);
    } catch {
      if (!signal?.aborted) setError("축제 브랜딩 이미지를 불러오지 못했습니다.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, []);

  async function upload(kind: BrandingImageKind, file: File) {
    const validationError = validateBrandingImage(file);
    if (validationError) { toast.error(validationError); return; }
    if (busyKind) return;
    setBusyKind(kind);
    try {
      const updated = await festivalBrandingApi.upload(kind, file);
      setBranding(updated);
      toast.success(`${kind === "poster" ? "공식 포스터" : "축제 로고"}가 저장되었습니다.`);
    } catch {
      toast.error("이미지 업로드에 실패했습니다. 기존 이미지는 유지됩니다.");
    } finally { setBusyKind(null); }
  }

  return <section className={panel} aria-label="축제 브랜딩">
    <div className="mb-5"><h2 className="text-lg font-semibold">축제 브랜딩</h2><p className="mt-1 text-sm text-[var(--text-muted)]">공식 원본 이미지와 로고를 관리합니다. 홈 화면용 와이드 이미지는 별도로 유지됩니다.</p></div>
    {loading ? <p role="status" className="text-sm text-[var(--text-muted)]">이미지를 불러오는 중입니다…</p> : error ? <div role="alert" className="text-sm"><p>{error}</p><button type="button" className={`${ADMIN_SECONDARY_ACTION_BUTTON_CLASS} mt-3`} onClick={() => void load()}>다시 시도</button></div> : <div className="grid gap-4 md:grid-cols-2">
      <ImageField kind="poster" title="공식 포스터" description="공식 원본 포스터입니다. 향후 AI 테마 추천에 사용됩니다." url={branding?.posterImageUrl ?? null} busy={busyKind !== null} onUpload={(kind, file) => void upload(kind, file)} />
      <ImageField kind="logo" title="축제 로고" description="사용자 화면과 축제 브랜딩에 사용됩니다." url={branding?.logoImageUrl ?? null} busy={busyKind !== null} onUpload={(kind, file) => void upload(kind, file)} />
    </div>}
  </section>;
}
