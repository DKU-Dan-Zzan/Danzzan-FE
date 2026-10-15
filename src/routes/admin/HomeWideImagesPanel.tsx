import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUp, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/components/common/ui/utils";
import { AzureImage } from "@/components/common/AzureImage";
import { adminHomeImageApi, type AdminHomeImage } from "@/api/app/admin/adminHomeImageApi";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/common/ui/dialog";
import { ADMIN_THEME_PRIMARY_ACTION_CLASS, ADMIN_THEME_SECONDARY_ACTION_CLASS } from "@/routes/admin/adminStyleClasses";
import { validateHomeWideImage } from "@/routes/admin/homeWideImageValidation";
import { createAdminThemeActionStyle, readActiveThemeStrong } from "@/routes/admin/adminThemeActionColors";
import { appQueryKeys, queryClient } from "@/lib/query";

export function HomeWideImagesPanel({ actionStyle }: { actionStyle?: CSSProperties }) {
  const resolvedActionStyle = actionStyle ?? createAdminThemeActionStyle(readActiveThemeStrong());
  const [images, setImages] = useState<AdminHomeImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<AdminHomeImage | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(() => new Set());
  const fileInput = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const previewTrigger = useRef<HTMLButtonElement>(null);
  const uploadInProgress = useRef(false);

  async function load(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const result = await adminHomeImageApi.list(undefined, signal);
      if (!signal?.aborted) setImages(result);
    } catch {
      if (!signal?.aborted) setError("홈 화면 이미지를 불러오지 못했습니다.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, []);

  async function upload(file: File) {
    if (busy || uploadInProgress.current) return;
    uploadInProgress.current = true;
    setBusy(true);
    try {
      const message = await validateHomeWideImage(file);
      if (message) { toast.error(message); return; }
      const added = await adminHomeImageApi.upload(file);
      setImages((current) => [...current, added]);
      void queryClient.invalidateQueries({ queryKey: appQueryKeys.homeImages() });
      toast.success("홈 화면 이미지가 추가되었습니다.");
    } catch {
      toast.error("이미지를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally { uploadInProgress.current = false; setBusy(false); }
  }

  function showPreview(image: AdminHomeImage, button: HTMLButtonElement) {
    previewTrigger.current = button;
    setPreviewImage(image);
  }

  function thumbnail(image: AdminHomeImage, index: number, className: string, alt: string) {
    return <button key={image.id} type="button" aria-label={`${index + 1}번 이미지 확대 보기`}
      className={cn("overflow-hidden rounded-lg border border-[var(--border-base)] bg-[var(--surface-subtle)]", className)}
      onClick={(event) => showPreview(image, event.currentTarget)}>
      {failedImageIds.has(image.id)
        ? <span className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-[var(--text-muted)]">이미지를 불러올 수 없습니다.</span>
        : <AzureImage src={image.imageUrl} alt={alt} className="h-full w-full object-contain" onError={() => setFailedImageIds((current) => new Set(current).add(image.id))} />}
    </button>;
  }

  async function remove(image: AdminHomeImage, index: number) {
    if (busy || !window.confirm(`${index + 1}번 이미지를 삭제하시겠습니까?`)) return;
    setBusy(true);
    try {
      await adminHomeImageApi.delete(image.id);
      setImages((current) => current.filter((item) => item.id !== image.id));
      void queryClient.invalidateQueries({ queryKey: appQueryKeys.homeImages() });
      toast.success("홈 화면 이미지가 삭제되었습니다.");
    } catch {
      toast.error("이미지 삭제에 실패했습니다. 목록을 다시 확인해 주세요.");
      void load();
    } finally { setBusy(false); }
  }

  async function move(index: number, delta: number) {
    if (busy || index + delta < 0 || index + delta >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[index + delta]] = [reordered[index + delta], reordered[index]];
    setBusy(true);
    try {
      setImages(await adminHomeImageApi.reorder(reordered.map((image) => image.id)));
      void queryClient.invalidateQueries({ queryKey: appQueryKeys.homeImages() });
      toast.success("표시 순서가 저장되었습니다.");
    } catch {
      toast.error("순서를 저장하지 못했습니다. 기존 순서를 유지합니다.");
    } finally { setBusy(false); }
  }

  return <div style={resolvedActionStyle} className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface)] p-5 sm:p-6" aria-label="홈 배너 이미지">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="font-semibold">홈 배너 이미지</h3><p className="mt-1 text-xs text-[var(--text-muted)]">홈 첫 화면에서 좌우로 넘겨 보는 큰 이미지입니다. 행사 안내나 홍보 이미지를 등록하세요. 공식 포스터의 색상 분석에는 사용하지 않습니다.</p></div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><button ref={trigger} type="button" className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "text-sm")}>홈 배너 관리</button></DialogTrigger>
        <DialogContent showCloseButton={false} style={resolvedActionStyle} onCloseAutoFocus={(event) => { event.preventDefault(); trigger.current?.focus(); }} className="flex max-h-[90dvh] w-[calc(100%-1rem)] max-w-[min(720px,calc(100%-1rem))] flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-[720px]">
          <DialogHeader className="shrink-0 border-b border-[var(--border-base)] px-5 py-4 text-left">
            <div className="flex items-start justify-between gap-3"><div><DialogTitle>홈 배너 이미지 관리</DialogTitle><DialogDescription className="mt-1 text-xs">추가·삭제·순서 변경은 바로 저장됩니다. 축제 설정의 저장 버튼과 별개입니다.</DialogDescription></div><DialogClose asChild><button type="button" className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "shrink-0 whitespace-nowrap")} disabled={busy}>닫기</button></DialogClose></div>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto p-5">
            <input ref={fileInput} type="file" accept="image/jpeg,image/png" aria-label="홈 배너 이미지 파일 선택" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file); }} />
            <button type="button" className={cn(ADMIN_THEME_PRIMARY_ACTION_CLASS, "inline-flex items-center gap-2 text-sm")} disabled={busy || loading || !!error} onClick={() => fileInput.current?.click()}>{busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}이미지 추가</button>
            <p className="mt-2 text-xs text-[var(--text-muted)]">JPG, PNG · 최대 5MB</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">권장 가로 크기 1920px 내외 · 최대 4,000만 픽셀 (가로 × 세로)</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">새 이미지는 목록 맨 뒤에 추가됩니다. 홈에서는 화면 크기에 맞춰 일부가 잘릴 수 있습니다.</p>
            {images.length === 0 && !loading && !error && <p className="mt-5 rounded-xl bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-muted)]">등록된 홈 배너 이미지가 없습니다.</p>}
            <ol className="mt-4 space-y-3">
              {images.map((image, index) => <li key={image.id} className="flex flex-col gap-3 rounded-xl border border-[var(--border-base)] p-3 sm:flex-row sm:items-center">
                {thumbnail(image, index, "aspect-[9/16] w-32 shrink-0", `${index + 1}번 홈 배너 이미지`)}
                <span className="text-sm font-medium">{index + 1}번</span>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  <button type="button" aria-label={`${index + 1}번 이미지 위로 이동`} className={ADMIN_THEME_SECONDARY_ACTION_CLASS} disabled={busy || index === 0} onClick={() => void move(index, -1)}><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" aria-label={`${index + 1}번 이미지 아래로 이동`} className={ADMIN_THEME_SECONDARY_ACTION_CLASS} disabled={busy || index === images.length - 1} onClick={() => void move(index, 1)}><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" aria-label={`${index + 1}번 이미지 삭제`} className="inline-flex items-center justify-center rounded-lg border border-[var(--semantic-status-danger)] px-3 py-2 text-[var(--semantic-status-danger)] hover:bg-[var(--status-danger-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--semantic-status-danger)] disabled:opacity-50" disabled={busy} onClick={() => void remove(image, index)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>)}
            </ol>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    {loading ? <p role="status" className="mt-4 text-sm text-[var(--text-muted)]">이미지를 불러오는 중입니다…</p> : error ? <div role="alert" className="mt-4 text-sm"><p>{error}</p><button type="button" className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "mt-2")} onClick={() => void load()}>다시 시도</button></div> : <>
      {images.length === 0 ? <p className="mt-4 text-sm text-[var(--text-muted)]">등록된 홈 배너 이미지가 없습니다.</p> : <div className="mt-4 flex gap-2">{images.slice(0, 3).map((image, index) => thumbnail(image, index, "aspect-[9/16] w-[calc((100%-1rem)/3)] max-w-24 shrink-0", `${index + 1}번 홈 배너 이미지 미리보기`))}</div>}
      <p className="mt-2 text-xs text-[var(--text-muted)]">총 {images.length}개 등록됨</p>
    </>}
    <Dialog open={previewImage !== null} onOpenChange={(isOpen) => { if (!isOpen) setPreviewImage(null); }}>
      <DialogContent style={resolvedActionStyle} showCloseButton={false} onCloseAutoFocus={(event) => { event.preventDefault(); previewTrigger.current?.focus(); }} className="w-[calc(100%-1rem)] max-w-[min(960px,calc(100%-1rem))] bg-white p-4 sm:max-w-[960px]">
        <DialogHeader className="flex-row items-center justify-between gap-3 text-left"><div><DialogTitle>홈 화면 이미지 원본 미리보기</DialogTitle><DialogDescription className="mt-1 text-xs">이미지를 잘라내지 않고 전체를 보여줍니다.</DialogDescription></div><DialogClose asChild><button type="button" className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "shrink-0 whitespace-nowrap")}>닫기</button></DialogClose></DialogHeader>
        <div className="flex min-h-32 max-h-[75dvh] items-center justify-center overflow-hidden rounded-lg bg-[var(--surface-subtle)]">
          {previewImage && (failedImageIds.has(previewImage.id)
            ? <p className="p-6 text-sm text-[var(--text-muted)]">이미지를 불러올 수 없습니다.</p>
            : <AzureImage src={previewImage.imageUrl} alt="홈 화면 이미지 원본 미리보기" className="max-h-[75dvh] max-w-full object-contain" onError={() => setFailedImageIds((current) => new Set(current).add(previewImage.id))} />)}
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}
