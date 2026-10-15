import { getErrorStatus } from "@/api/common/fetchAuth";
import { imageReferenceKey, sameImageReference } from "@/lib/app/azure/azureReadUrl";
import { AzureImage } from "@/components/common/AzureImage";
import { useEffect, useMemo, useRef, useState } from "react";
import { adminHomeImageApi, type AdminHomeImage, type HomeImagePreview } from "@/api/app/admin/adminHomeImageApi";
import { ADMIN_THEME_PRIMARY_ACTION_CLASS, ADMIN_THEME_SECONDARY_ACTION_CLASS } from "@/routes/admin/adminStyleClasses";
import { resolveBrandingImageUrl } from "@/lib/app/festival/brandingImageUrl";

export type HomeBannerDraftSelection = {
  previewUrl: string | null;
  file: File | null;
  expectedFirstImageId: number | null;
  expectedFirstImageUrl: string | null;
  sourcePosterUrl: string | null;
  ready: boolean;
};
type Props = { posterUrl: string | null; disabled?: boolean; onChange: (value: HomeBannerDraftSelection) => void; onSave: (value: HomeBannerDraftSelection) => Promise<AdminHomeImage> };
type Draft = { file: File; url: string; poster: string | null; recipe: string | null };
const MAX_BYTES = 5 * 1024 * 1024;
const INVALID_IMAGE = "5MB 이하의 올바른 JPG·PNG 이미지를 선택해 주세요.";

function validSignature(bytes: Uint8Array, type: string) {
  return type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : type === "image/png" && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
}

function previewFile(result: HomeImagePreview, poster: string) {
  if (!sameImageReference(result.sourcePosterUrl, poster)) throw new Error("공식 포스터가 변경되었습니다. 다시 만들어 주세요.");
  if (!["image/jpeg", "image/png"].includes(result.mimeType) || !result.imageBase64 || result.imageBase64.length > Math.ceil(MAX_BYTES / 3) * 4
    || !Number.isInteger(result.width) || !Number.isInteger(result.height) || result.width <= 0 || result.height <= 0 || result.width * result.height > 40_000_000) throw new Error(INVALID_IMAGE);
  let bytes: Uint8Array<ArrayBuffer>;
  try { bytes = Uint8Array.from(atob(result.imageBase64), character => character.charCodeAt(0)); }
  catch { throw new Error(INVALID_IMAGE); }
  if (bytes.length > MAX_BYTES || !validSignature(bytes, result.mimeType)) throw new Error(INVALID_IMAGE);
  return new File([bytes], `home-poster.${result.mimeType === "image/png" ? "png" : "jpg"}`, { type: result.mimeType });
}

/** Decode custom files before accepting a draft; every exit releases the temporary URL. */
function validateCustom(file: File, signal: AbortSignal): Promise<void> {
  if (!["image/jpeg", "image/png"].includes(file.type) || !file.size || file.size > MAX_BYTES) return Promise.reject(new Error(INVALID_IMAGE));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let image: HTMLImageElement | null = null;
    let url: string | null = null;
    let finished = false;
    const finish = (error?: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      reader.onload = null; reader.onerror = null;
      if (reader.readyState === FileReader.LOADING) reader.abort();
      if (image) { image.onload = null; image.onerror = null; }
      if (url) URL.revokeObjectURL(url);
      if (error) reject(error); else resolve();
    };
    const abort = () => finish(new Error("이미지 확인이 취소되었습니다."));
    const timeout = setTimeout(() => finish(new Error("이미지 확인 시간이 초과되었습니다. 다시 선택해 주세요.")), 10_000);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) { abort(); return; }
    reader.onerror = () => finish(new Error(INVALID_IMAGE));
    reader.onload = () => {
      if (!validSignature(new Uint8Array(reader.result as ArrayBuffer), file.type)) { finish(new Error(INVALID_IMAGE)); return; }
      try {
        url = URL.createObjectURL(file);
        image = new Image();
        image.onload = () => {
          const pixels = image!.naturalWidth * image!.naturalHeight;
          finish(pixels <= 0 || pixels > 40_000_000 ? new Error("이미지는 최대 4,000만 픽셀까지 사용할 수 있습니다.") : undefined);
        };
        image.onerror = () => finish(new Error(INVALID_IMAGE));
        image.src = url;
      } catch { finish(new Error(INVALID_IMAGE)); }
    };
    try { reader.readAsArrayBuffer(file.slice(0, 12)); } catch { finish(new Error(INVALID_IMAGE)); }
  });
}

export function HomeBannerDraftPanel({ posterUrl, disabled = false, onChange, onSave }: Props) {
  const [first, setFirst] = useState<AdminHomeImage | null>(null);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [reload, setReload] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingPoster, setEditingPoster] = useState(false);
  const [layout, setLayout] = useState<"contain" | "cover">("contain");
  const [focusX, setFocusX] = useState(.5), [focusY, setFocusY] = useState(.5);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [conflict, setConflict] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const operation = useRef<{ controller: AbortController; kind: "poster" | "custom" } | null>(null);
  const latest = useRef({ posterUrl, disabled }); latest.current = { posterUrl, disabled };
  const notify = useRef(onChange); notify.current = onChange;
  const recipe = JSON.stringify([layout, layout === "cover" ? focusX : null, layout === "cover" ? focusY : null]);
  const posterIdentity = imageReferenceKey(posterUrl);
  const validDraft = draft?.poster && !sameImageReference(draft.poster, posterUrl) ? null : draft;
  const selection = useMemo<HomeBannerDraftSelection>(() => ({
    previewUrl: validDraft?.url ?? first?.imageUrl ?? null,
    file: validDraft?.file ?? null,
    expectedFirstImageId: first?.id ?? null,
    expectedFirstImageUrl: first?.imageUrl ?? null,
    sourcePosterUrl: validDraft?.poster ?? null,
    ready: listState === "ready" && !pending && !saving && !conflict && (!validDraft?.poster || !editingPoster || validDraft.recipe === recipe),
  }), [validDraft, first, listState, pending, saving, conflict, editingPoster, recipe]);
  useEffect(() => { notify.current(selection); }, [selection]);
  useEffect(() => () => { if (draft) URL.revokeObjectURL(draft.url); }, [draft]);
  useEffect(() => () => { operation.current?.controller.abort(); operation.current = null; }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let active = true;
    void adminHomeImageApi.list(undefined, controller.signal).then(images => {
      if (!active || controller.signal.aborted) return;
      setFirst([...images].sort((a, b) => a.displayOrder - b.displayOrder)[0] ?? null);
      setListState("ready");
      setConflict(false); setError(null);
    }).catch(() => { if (active) setListState("error"); }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [reload]);

  useEffect(() => {
    if (operation.current?.kind === "poster") {
      operation.current.controller.abort(); operation.current = null; setPending(false);
    }
    setDraft(current => current?.poster && imageReferenceKey(current.poster) !== posterIdentity ? null : current);
    setEditingPoster(false); setLayout("contain"); setFocusX(.5); setFocusY(.5); setError(null);
  }, [posterIdentity]);

  function cancel() { operation.current?.controller.abort(); operation.current = null; setPending(false); }
  function keep() { setSaved(false); cancel(); setDraft(null); setEditingPoster(false); setError(null); }
  function openEditor() {
    if (disabled || savingRef.current || listState !== "ready" || !posterUrl) return;
    cancel(); setDraft(null); setEditingPoster(true); setSaved(false); setError(null);
  }
  function changeRecipe(change: () => void) { cancel(); change(); setError(null); }
  async function generate() {
    if (disabled || listState !== "ready" || !posterUrl) return;
    cancel();
    const controller = new AbortController(); operation.current = { controller, kind: "poster" };
    const source = posterUrl;
    setEditingPoster(true); setPending(true); setError(null); setSaved(false);
    const timeout = setTimeout(() => controller.abort(), 60_000);
    try {
      const result = await adminHomeImageApi.preview({ sourcePosterUrl: source, layout, ...(layout === "cover" ? { focusX, focusY } : {}) }, undefined, controller.signal);
      if (operation.current?.controller !== controller || controller.signal.aborted || !sameImageReference(latest.current.posterUrl, source) || latest.current.disabled) return;
      const file = previewFile(result, source);
      setDraft({ file, url: URL.createObjectURL(file), poster: source, recipe });
    } catch (cause) {
      if (operation.current?.controller === controller) setError(controller.signal.aborted ? "미리보기 시간이 초과되었습니다. 다시 만들어 주세요." : cause instanceof Error ? cause.message : "미리보기를 만들지 못했습니다.");
    } finally {
      clearTimeout(timeout);
      if (operation.current?.controller === controller) { operation.current = null; setPending(false); }
    }
  }
  async function chooseFile(file: File) {
    if (disabled || listState !== "ready") return;
    cancel();
    const controller = new AbortController(); operation.current = { controller, kind: "custom" };
    setPending(true); setError(null); setSaved(false);
    try {
      await validateCustom(file, controller.signal);
      if (operation.current?.controller !== controller || controller.signal.aborted || latest.current.disabled) return;
      setDraft({ file, url: URL.createObjectURL(file), poster: null, recipe: null }); setEditingPoster(false);
    } catch (cause) {
      if (operation.current?.controller === controller) setError(cause instanceof Error ? cause.message : INVALID_IMAGE);
    } finally { if (operation.current?.controller === controller) { operation.current = null; setPending(false); } }
  }
  async function save() {
    if (disabled || savingRef.current || !selection.ready || !selection.file) return;
    savingRef.current = true; setSaving(true); setError(null); setSaved(false);
    try {
      const result = await onSave(selection);
      setFirst(result); setDraft(null); setEditingPoster(false); setSaved(true);
    } catch (cause) {
      const stale = getErrorStatus(cause) === 409;
      setConflict(stale);
      setError(stale ? "다른 관리자가 이미지나 포스터를 변경했습니다. 최신 홈 이미지를 확인한 뒤 다시 저장해 주세요." : "홈 이미지를 저장하지 못했습니다. 선택한 이미지는 유지됩니다. 다시 시도해 주세요.");
    } finally { savingRef.current = false; setSaving(false); }
  }
  const locked = disabled || saving || listState !== "ready";
  const hasChanges = !!draft || editingPoster || pending;
  return <section aria-label="홈 대표 이미지 초안" className="rounded-xl border border-[var(--border-base)] p-4">
    <h3 className="text-sm font-semibold">홈화면 메인 이미지</h3>
    <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">홈 첫 화면에 표시할 이미지를 선택하거나 공식 포스터로 편집하세요. 저장하면 첫 번째 이미지만 교체하며 나머지 이미지와 순서는 유지합니다.</p>
    {listState === "loading" && <p role="status" className="mt-3 text-xs">현재 이미지를 확인하고 있습니다…</p>}
    {listState === "error" && <div role="alert" className="mt-3 text-xs"><p>현재 이미지를 불러오지 못했습니다. 다시 불러온 뒤 홈 이미지를 저장할 수 있습니다.</p><button type="button" disabled={disabled} className={ADMIN_THEME_SECONDARY_ACTION_CLASS} onClick={() => { setListState("loading"); setReload(value => value + 1); }}>다시 불러오기</button></div>}
    <div className="mt-4 flex flex-wrap gap-2" aria-label="홈화면 이미지 준비 방법">
      <button type="button" disabled={locked} onClick={() => input.current?.click()} className={ADMIN_THEME_SECONDARY_ACTION_CLASS}>홈화면 이미지 파일 선택</button>
      <button type="button" disabled={locked || !posterUrl || pending} onClick={openEditor} className={ADMIN_THEME_SECONDARY_ACTION_CLASS}>공식 포스터로 편집</button>
      <input ref={input} type="file" aria-label="홈 대표 이미지 파일 선택" disabled={locked} accept="image/jpeg,image/png" className="sr-only" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void chooseFile(file); }} />
    </div>
    {editingPoster && <fieldset disabled={locked} className="mt-4 space-y-3 rounded-lg bg-[var(--surface-subtle)] p-3 text-xs">
      <legend className="px-1 font-medium">홈화면 메인 이미지 편집</legend>
      <label className="block">배치<select aria-label="배너 배치" value={layout} className="ml-2 rounded border border-[var(--border-base)] bg-[var(--surface)] p-1" onChange={event => changeRecipe(() => setLayout(event.target.value as "contain" | "cover"))}><option value="contain">원본 비율 유지</option><option value="cover">세로 화면에 맞춰 자르기</option></select></label>
      {layout === "contain" ? <p className="text-[var(--text-muted)]">포스터 전체를 사용합니다. 이미지에 흐린 배경이나 여백을 추가하지 않습니다.</p> : <>
        <label className="block">가로 초점<input aria-label="가로 초점" type="range" min="0" max="1" step="0.01" value={focusX} className="mt-1 w-full" onChange={event => changeRecipe(() => setFocusX(Number(event.target.value)))} /></label>
        <label className="block">세로 초점<input aria-label="세로 초점" type="range" min="0" max="1" step="0.01" value={focusY} className="mt-1 w-full" onChange={event => changeRecipe(() => setFocusY(Number(event.target.value)))} /></label>
      </>}
      <button type="button" disabled={locked || pending || !posterUrl} onClick={() => void generate()} className={ADMIN_THEME_SECONDARY_ACTION_CLASS}>편집 결과 미리보기</button>
      {!validDraft && !pending && <p>배치를 선택하고 편집 결과를 미리 확인해 주세요.</p>}
      {validDraft?.poster && validDraft.recipe !== recipe && !pending && <p>배치를 바꿨습니다. 미리보기를 다시 만들어 주세요.</p>}
    </fieldset>}
    <div className="mt-4 rounded-lg border border-[var(--border-base)] p-3">
      {selection.previewUrl ? <AzureImage src={resolveBrandingImageUrl(selection.previewUrl)} alt="홈 대표 이미지 미리보기" className="mx-auto aspect-[9/16] max-h-60 w-auto max-w-full rounded-lg object-contain" />
        : listState === "ready" && <p className="text-xs text-[var(--text-muted)]">등록된 첫 이미지가 없습니다. 파일을 선택하거나 공식 포스터로 편집하세요.</p>}
      <p className="mt-2 break-all text-xs text-[var(--text-muted)]">{validDraft ? `저장 전 · ${validDraft.poster ? "공식 포스터 편집 결과" : validDraft.file.name}` : "현재 저장된 홈화면 이미지"}</p>
    </div>
    {pending && <p role="status" className="mt-2 text-xs">이미지를 준비하고 있습니다…</p>}
    {hasChanges && <div className="mt-4" aria-label="홈화면 이미지 저장 작업">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={locked || !selection.ready || !selection.file} onClick={() => void save()} className={ADMIN_THEME_PRIMARY_ACTION_CLASS}>{saving ? "저장 중…" : "홈화면 이미지 저장"}</button>
        <button type="button" disabled={locked} onClick={keep} className={ADMIN_THEME_SECONDARY_ACTION_CLASS}>이미지 선택 취소</button>
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">취소하면 기존 홈화면 이미지를 유지합니다.</p>
    </div>}
    {saved && <p role="status" className="mt-2 text-xs">홈 이미지가 저장되었습니다.</p>}
    {conflict && <button type="button" disabled={locked} className={ADMIN_THEME_SECONDARY_ACTION_CLASS} onClick={() => { setListState("loading"); setReload(value => value + 1); }}>최신 홈 이미지 확인</button>}
    {error && <p role="alert" className="mt-2 text-xs text-[var(--semantic-status-danger)]">{error}</p>}
    <p className="mt-3 text-xs text-[var(--text-muted)]">홈 이미지는 테마 전체 적용과 별도로 저장합니다. JPG·PNG, 최대 5MB</p>
  </section>;
}
