import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { festivalBrandingApi, type BrandingImageKind, type FestivalBranding, type PosterColorCandidate } from "@/api/app/festival/festivalBrandingApi";
import { ADMIN_FOCUS_VISIBLE_RING_CLASS, ADMIN_SECONDARY_ACTION_BUTTON_CLASS } from "@/routes/admin/adminStyleClasses";
import { isHexColor } from "@/routes/admin/themeEditor";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);
const panel = "rounded-2xl border border-[var(--admin-panel-border)] bg-[var(--admin-panel-bg)] p-5 sm:p-6";

export type PosterAnalysisSnapshot = {
  sourcePosterUrl: string;
  sourceColors: string[] | null;
  selectedBaseColor: string | null;
};

export function validateBrandingImage(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return "JPG 또는 PNG 이미지만 업로드할 수 있습니다.";
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) return "이미지는 5MB 이하의 비어 있지 않은 파일이어야 합니다.";
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

export function FestivalBrandingPanel({ onAnalysisChange, onRecommend, recommending = false, recommendationError = null }: {
  onAnalysisChange?: (snapshot: PosterAnalysisSnapshot | null) => void;
  onRecommend?: (snapshot: PosterAnalysisSnapshot) => void;
  recommending?: boolean;
  recommendationError?: string | null;
} = {}) {
  const [branding, setBranding] = useState<FestivalBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKind, setBusyKind] = useState<BrandingImageKind | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<PosterColorCandidate[]>([]);
  const [selectedBaseColor, setSelectedBaseColor] = useState<string | null>(null);
  const [manualHex, setManualHex] = useState("");
  const analysisVersion = useRef(0);

  async function load(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const current = await festivalBrandingApi.get(undefined, signal);
      if (!signal?.aborted) {
        setBranding(current);
        onAnalysisChange?.(current.posterImageUrl ? { sourcePosterUrl: current.posterImageUrl, sourceColors: null, selectedBaseColor: null } : null);
      }
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
      if (kind === "poster") {
        analysisVersion.current++;
        setAnalyzing(false);
        setCandidates([]);
        setSelectedBaseColor(null);
        setManualHex("");
        setAnalysisError(null);
        onAnalysisChange?.(updated.posterImageUrl ? { sourcePosterUrl: updated.posterImageUrl, sourceColors: null, selectedBaseColor: null } : null);
      }
      toast.success(`${kind === "poster" ? "공식 포스터" : "축제 로고"}가 저장되었습니다.`);
    } catch {
      toast.error("이미지 업로드에 실패했습니다. 기존 이미지는 유지됩니다.");
    } finally { setBusyKind(null); }
  }

  async function extractColors() {
    if (!branding?.posterImageUrl || analyzing) return;
    const version = ++analysisVersion.current;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await festivalBrandingApi.extractPosterColors(branding.festivalSettingId);
      if (version !== analysisVersion.current) return;
      setCandidates(result.colors);
      setSelectedBaseColor(null);
      setManualHex("");
      onAnalysisChange?.({ sourcePosterUrl: branding.posterImageUrl, sourceColors: result.colors.map((color) => color.hex), selectedBaseColor: null });
      if (result.colors.length === 0) setAnalysisError("포스터에서 유효한 대표색을 찾지 못했습니다.");
    } catch {
      if (version !== analysisVersion.current) return;
      setCandidates([]);
      setSelectedBaseColor(null);
      setManualHex("");
      onAnalysisChange?.({ sourcePosterUrl: branding.posterImageUrl, sourceColors: null, selectedBaseColor: null });
      setAnalysisError("포스터 색상을 분석하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally { if (version === analysisVersion.current) setAnalyzing(false); }
  }

  function selectColor(hex: string) {
    setSelectedBaseColor(hex.toUpperCase());
    setManualHex(hex.toUpperCase());
    if (branding?.posterImageUrl) onAnalysisChange?.({ sourcePosterUrl: branding.posterImageUrl, sourceColors: candidates.length ? candidates.map((color) => color.hex) : null, selectedBaseColor: hex.toUpperCase() });
  }

  return <section className={panel} aria-label="축제 브랜딩">
    <div className="mb-5"><h2 className="text-lg font-semibold">축제 브랜딩</h2><p className="mt-1 text-sm text-[var(--text-muted)]">공식 원본 이미지와 로고를 관리합니다. 홈 화면용 와이드 이미지는 별도로 유지됩니다.</p></div>
    {loading ? <p role="status" className="text-sm text-[var(--text-muted)]">이미지를 불러오는 중입니다…</p> : error ? <div role="alert" className="text-sm"><p>{error}</p><button type="button" className={`${ADMIN_SECONDARY_ACTION_BUTTON_CLASS} mt-3`} onClick={() => void load()}>다시 시도</button></div> : <div className="grid gap-4 md:grid-cols-2">
      <ImageField kind="poster" title="공식 포스터" description="공식 원본 포스터입니다. 향후 AI 테마 추천에 사용됩니다." url={branding?.posterImageUrl ?? null} busy={busyKind !== null || recommending} onUpload={(kind, file) => void upload(kind, file)} />
      <ImageField kind="logo" title="축제 로고" description="사용자 화면과 축제 브랜딩에 사용됩니다." url={branding?.logoImageUrl ?? null} busy={busyKind !== null || recommending} onUpload={(kind, file) => void upload(kind, file)} />
    </div>}
    {!loading && !error && <div className="mt-5 border-t border-[var(--border-base)] pt-5" aria-label="포스터 색상 분석">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="font-semibold">포스터 색상 분석</h3><p className="mt-1 text-xs text-[var(--text-muted)]">대표색 후보에서 기준 색상을 고르거나 HEX를 직접 입력할 수 있습니다. 테마에는 적용되지 않습니다.</p></div>
        <button type="button" className={`${ADMIN_SECONDARY_ACTION_BUTTON_CLASS} text-sm`} disabled={!branding?.posterImageUrl || analyzing || busyKind !== null || recommending} onClick={() => void extractColors()}>{analyzing ? "분석 중…" : "대표색 추출"}</button>
      </div>
      {!branding?.posterImageUrl ? <p className="mt-3 text-sm text-[var(--text-muted)]">먼저 공식 포스터를 업로드해 주세요.</p> : <>
        {analysisError && <p role="alert" className="mt-3 text-sm text-[var(--semantic-status-danger)]">{analysisError}</p>}
        {candidates.length > 0 && <div className="mt-4"><p className="mb-2 text-sm font-medium">대표색 후보</p><div className="flex flex-wrap gap-2">
          {candidates.map(({ hex, population }) => <button key={hex} type="button" aria-label={`기준 색상 ${hex} 선택`} aria-pressed={selectedBaseColor === hex} onClick={() => selectColor(hex)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${ADMIN_FOCUS_VISIBLE_RING_CLASS} ${selectedBaseColor === hex ? "border-[var(--accent)]" : "border-[var(--border-base)]"}`}>
            <span className="h-5 w-5 rounded-full border border-[var(--border-base)]" style={{ backgroundColor: hex }} aria-hidden="true" />{hex} <span className="text-[var(--text-muted)]">{Math.round(population * 100)}%</span>
          </button>)}
        </div></div>}
        <div className="mt-4 flex flex-wrap items-end gap-3"><label className="text-sm font-medium">직접 기준색 입력
          <input aria-label="기준 색상 HEX" value={manualHex} maxLength={7} onChange={(event) => {
            const value = event.target.value;
            if (isHexColor(value)) selectColor(value);
            else setManualHex(value);
          }} placeholder="#RRGGBB" aria-invalid={manualHex.length > 0 && !isHexColor(manualHex)} className={`mt-1 block h-10 w-36 rounded-xl border border-[var(--border-base)] bg-[var(--surface)] px-3 font-mono text-sm ${ADMIN_FOCUS_VISIBLE_RING_CLASS}`} />
        </label><button type="button" className={`${ADMIN_SECONDARY_ACTION_BUTTON_CLASS} text-sm`} disabled={!isHexColor(manualHex)} onClick={() => selectColor(manualHex)}>기준색으로 선택</button></div>
        {manualHex && !isHexColor(manualHex) && <p className="mt-1 text-xs text-[var(--semantic-status-danger)]">#RRGGBB 형식으로 입력해 주세요.</p>}
        <p className="mt-4 text-sm" aria-label="선택한 기준 색상">기준 색상: {selectedBaseColor ? <span className="inline-flex items-center gap-2 font-mono"><span className="h-4 w-4 rounded-full border border-[var(--border-base)]" style={{ backgroundColor: selectedBaseColor }} />{selectedBaseColor}</span> : "선택되지 않음"}</p>
        <div className="mt-4 border-t border-[var(--border-base)] pt-4">
          <button type="button" className={`${ADMIN_SECONDARY_ACTION_BUTTON_CLASS} text-sm`}
            disabled={!onRecommend || !candidates.length || !selectedBaseColor || !isHexColor(manualHex) || analyzing || busyKind !== null || recommending}
            onClick={() => {
              if (branding?.posterImageUrl && candidates.length && selectedBaseColor && isHexColor(manualHex) && !recommending) {
                onRecommend?.({ sourcePosterUrl: branding.posterImageUrl,
                  sourceColors: candidates.map((color) => color.hex), selectedBaseColor });
              }
            }}>{recommending ? "AI 추천 생성 중…" : "AI 테마 추천"}</button>
          <p className="mt-2 text-xs text-[var(--text-muted)]">새 추천 시안은 현재 편집 중인 테마를 변경하지 않습니다. 시안을 선택하면 편집 값이 해당 시안으로 바뀝니다.</p>
          {recommendationError && <p role="alert" className="mt-2 text-sm text-[var(--semantic-status-danger)]">{recommendationError}</p>}
        </div>
      </>}
    </div>}
  </section>;
}
