import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, Info, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/components/common/ui/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/common/ui/tooltip";
import { festivalBrandingApi, type BrandingImageKind, type FestivalBranding, type PosterColorCandidate } from "@/api/app/festival/festivalBrandingApi";
import { ADMIN_FOCUS_VISIBLE_RING_CLASS, ADMIN_THEME_PRIMARY_ACTION_CLASS, ADMIN_THEME_SECONDARY_ACTION_CLASS } from "@/routes/admin/adminStyleClasses";
import { isHexColor } from "@/routes/admin/themeEditor";
import { validateBrandingImage } from "@/routes/admin/festivalBrandingValidation";


const panel = "rounded-2xl border border-[var(--admin-panel-border)] bg-[var(--admin-panel-bg)] p-5 sm:p-6";
const actionClass = () => `${ADMIN_THEME_PRIMARY_ACTION_CLASS} inline-flex items-center justify-center gap-2 text-sm`;

export type PosterAnalysisSnapshot = {
  sourcePosterUrl: string;
  sourceColors: string[] | null;
  selectedBaseColor: string | null;
};

function ImageField({ kind, title, description, url, busy, uploading, onUpload }: {
  kind: BrandingImageKind;
  title: string;
  description: string;
  url: string | null;
  busy: boolean;
  uploading: boolean;
  onUpload: (kind: BrandingImageKind, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <div className="rounded-xl border border-[var(--border-base)] p-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p></div>
      <button type="button" className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "text-sm")} disabled={busy} onClick={() => inputRef.current?.click()}>
        {uploading ? "업로드 중…" : url ? "이미지 변경" : "이미지 업로드"}
      </button>
    </div>
    <input ref={inputRef} type="file" disabled={busy} accept="image/jpeg,image/png" aria-label={`${title} 파일 선택`} className="sr-only" onChange={(event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) onUpload(kind, file);
    }} />
    <div className="mt-4 flex min-h-32 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-subtle)] p-3 sm:min-h-28">
      {url ? <img src={url} alt={`현재 ${title}`} className="max-h-52 max-w-full object-contain sm:max-h-48" /> : <p className="text-sm text-[var(--text-muted)]">등록된 {title}가 없습니다.</p>}
    </div>
  </div>;
}

export function FestivalBrandingPanel({ onAnalysisChange, onBrandingChange, onRecommend, recommending = false, autoRecommend = false, locked = false, recommendationCompleted = false, recommendationError = null }: {
  onAnalysisChange?: (snapshot: PosterAnalysisSnapshot | null) => void;
  onBrandingChange?: (branding: FestivalBranding) => void;
  onRecommend?: (snapshot: PosterAnalysisSnapshot) => void;
  recommending?: boolean;
  autoRecommend?: boolean;
  locked?: boolean;
  recommendationCompleted?: boolean;
  recommendationError?: string | null;
  adminActionStyle?: CSSProperties;
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
  const [recommendHelpOpen, setRecommendHelpOpen] = useState(false);
  const analysisVersion = useRef(0);
  const onBrandingChangeRef = useRef(onBrandingChange);
  const onAnalysisChangeRef = useRef(onAnalysisChange);
  onBrandingChangeRef.current = onBrandingChange;
  onAnalysisChangeRef.current = onAnalysisChange;

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const current = await festivalBrandingApi.get(undefined, signal);
      if (!signal?.aborted) {
        setBranding(current);
        onBrandingChangeRef.current?.(current);
        onAnalysisChangeRef.current?.(current.posterImageUrl ? { sourcePosterUrl: current.posterImageUrl, sourceColors: null, selectedBaseColor: null } : null);
      }
    } catch {
      if (!signal?.aborted) setError("축제 브랜딩 이미지를 불러오지 못했습니다.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function upload(kind: BrandingImageKind, file: File) {
    const validationError = validateBrandingImage(file);
    if (validationError) { toast.error(validationError); return; }
    if (busyKind || locked || recommending) return;
    setBusyKind(kind);
    try {
      const updated = await festivalBrandingApi.upload(kind, file);
      setBranding(updated);
      onBrandingChange?.(updated);
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
    if (!branding?.posterImageUrl || analyzing || locked || recommending || busyKind) return;
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

  const canExtract = !!branding?.posterImageUrl && !analyzing && busyKind === null && !recommending && !locked;
  const hasExtractedColors = !analyzing && busyKind !== "poster" && candidates.length > 0 && candidates.every(({ hex }) => isHexColor(hex));
  const hasValidBaseColor = !!selectedBaseColor && isHexColor(selectedBaseColor) && (!manualHex || isHexColor(manualHex));
  const canRecommend = !!onRecommend && !!branding?.posterImageUrl && hasExtractedColors && hasValidBaseColor
    && !analyzing && busyKind === null && !recommending && !locked;
  const progressSteps = [
    { label: "① 대표색 추출 (필수)", state: analyzing ? "extracting" : hasExtractedColors ? "completed" : "current", status: analyzing ? "추출 중" : hasExtractedColors ? "완료" : "진행 필요" },
    { label: "② 마음에 드는 색 선택", state: !hasExtractedColors ? "waiting" : hasValidBaseColor ? "completed" : "current", status: !hasExtractedColors ? "대기" : hasValidBaseColor ? "완료" : "진행 필요" },
    { label: "③ AI 테마 추천", state: recommending ? "generating" : recommendationCompleted && hasExtractedColors && hasValidBaseColor ? "completed" : hasExtractedColors && hasValidBaseColor ? "ready" : "waiting", status: recommending ? "생성 중" : recommendationCompleted && hasExtractedColors && hasValidBaseColor ? "완료" : hasExtractedColors && hasValidBaseColor ? "추천 가능" : "대기" },
  ] as const;

  return <section className={panel} aria-label="축제 브랜딩">

    <div className="grid items-start gap-8 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.4fr)]">
    <div id="theme-assets" className="scroll-mt-40 sm:scroll-mt-28"><h2 className="mb-4 text-lg font-semibold">1. 포스터와 로고</h2>
    {loading ? <p role="status" className="text-sm text-[var(--text-muted)]">이미지를 불러오는 중입니다…</p> : error ? <div role="alert" className="text-sm"><p>{error}</p><button type="button" className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "mt-3")} onClick={() => void load()}>다시 시도</button></div> : <div className="space-y-3">
      <ImageField kind="poster" title="공식 포스터" description="색상과 배경 추천에 사용할 포스터입니다." url={branding?.posterImageUrl ?? null} busy={busyKind !== null || recommending || locked} uploading={busyKind === "poster"} onUpload={(kind, file) => void upload(kind, file)} />

      <ImageField kind="logo" title="축제 로고" description="화면에 표시할 로고입니다. 색상 분석에는 사용하지 않아요." url={branding?.logoImageUrl ?? null} busy={busyKind !== null || recommending || locked} uploading={busyKind === "logo"} onUpload={(kind, file) => void upload(kind, file)} />
    </div>}
    <p className="mt-3 text-xs text-[var(--text-muted)]">이미지 변경은 바로 저장됩니다. 홈 배너 이미지는 <a href="/admin#home-images" className="font-semibold underline underline-offset-4">축제 설정</a>에서 관리하세요.</p>
    </div>
    {!loading && !error && <div id="theme-colors" className="min-w-0 scroll-mt-40 sm:scroll-mt-28 lg:border-l lg:border-[var(--border-base)] lg:pl-8" aria-label="포스터 색상 분석"><h2 className="text-lg font-semibold">2. 대표색을 골라 주세요</h2><p className="mb-5 mt-2 text-sm leading-6 text-[var(--text-muted)]">포스터에서 색을 뽑고 하나를 선택하면, 어울리는 테마와 배경을 자동으로 추천해요.</p>
      <details aria-label="AI 테마 생성 과정" className="mb-4 text-xs text-[var(--text-muted)]"><summary className="cursor-pointer">추천 진행 상태</summary>
        <ol aria-label="AI 추천 작업 단계" className="mt-2 flex flex-col gap-1.5 text-xs sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          {progressSteps.map(({ label, state, status }, index) => <li key={label} data-state={state} aria-current={state === "current" || state === "extracting" || state === "ready" || state === "generating" ? "step" : undefined}
            className={cn("inline-flex items-center gap-1.5", state === "completed" ? "text-[var(--semantic-status-success)]" : state === "waiting" ? "text-[var(--text-muted)]" : "font-semibold text-[var(--admin-theme-action-outline)]")}>
            {index > 0 && <span aria-hidden="true" className="mr-1 hidden text-[var(--text-muted)] sm:inline">→</span>}
            {state === "completed" && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>{label}</span><span className="font-normal opacity-80">{status}</span>
          </li>)}
        </ol>
        <p className="mt-2 text-xs text-[var(--text-muted)]">공식 포스터만 분석합니다. 로고와 홈 배너는 분석하지 않습니다. 추출된 색 중 원하는 색을 하나 고르세요.{autoRecommend && " 색상을 선택하면 자동으로 추천을 시작합니다."}</p>
      </details>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--text-muted)]">포스터만 분석합니다. 로고·홈 배너는 제외돼요.</p>
        <button type="button" className={actionClass()} disabled={!canExtract} aria-busy={analyzing} onClick={() => void extractColors()}>{analyzing && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}{analyzing ? "분석 중…" : "대표색 추출"}</button>
      </div>
      {!branding?.posterImageUrl ? <p className="mt-3 text-sm text-[var(--text-muted)]">먼저 공식 포스터를 업로드해 주세요.</p> : <>
        {analysisError && <p role="alert" className="mt-3 text-sm text-[var(--semantic-status-danger)]">{analysisError}</p>}
        {candidates.length > 0 && <div className="mt-4"><p className="mb-2 flex items-center gap-2 text-sm font-medium">대표색 후보 <span className="inline-flex items-center gap-1 text-xs text-[var(--semantic-status-success)]"><Check className="h-3.5 w-3.5" aria-hidden="true" />추출 완료</span></p><div className="grid grid-cols-3 gap-3">
          {candidates.map(({ hex }) => <button key={hex} type="button" aria-label={`기준 색상 ${hex} 선택`} aria-pressed={selectedBaseColor?.toUpperCase() === hex.toUpperCase()} disabled={locked} onClick={() => selectColor(hex)} className={cn("relative flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs", ADMIN_FOCUS_VISIBLE_RING_CLASS, selectedBaseColor?.toUpperCase() === hex.toUpperCase() ? "border-[var(--admin-theme-action-outline)] ring-2 ring-[var(--admin-theme-action-focus)] ring-offset-2" : "border-[var(--border-base)]")}>
            <span className="h-10 w-full rounded-lg border border-[var(--border-base)]" style={{ backgroundColor: hex }} aria-hidden="true" /><span className="font-mono text-[10px]">{hex}</span>{selectedBaseColor?.toUpperCase() === hex.toUpperCase() && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>)}
        </div></div>}
        <details className="mt-4 text-xs"><summary className="cursor-pointer text-[var(--text-muted)]">색상 코드를 직접 입력하려면</summary><div className="mt-2"><label className="text-sm font-medium">원하는 색 직접 입력 (선택)
          <input aria-label="기준 색상 HEX" disabled={locked} value={manualHex} maxLength={7} onChange={(event) => {
            const value = event.target.value;
            if (isHexColor(value)) selectColor(value);
            else { setManualHex(value); setSelectedBaseColor(null); if (branding?.posterImageUrl) onAnalysisChange?.({ sourcePosterUrl: branding.posterImageUrl, sourceColors: candidates.length ? candidates.map(color => color.hex) : null, selectedBaseColor: null }); }
          }} placeholder="#RRGGBB" aria-invalid={manualHex.length > 0 && !isHexColor(manualHex)} className={cn("mt-1 block h-10 w-36 rounded-xl border border-[var(--border-base)] bg-[var(--surface)] px-3 font-mono text-sm", ADMIN_FOCUS_VISIBLE_RING_CLASS)} />
        </label></div></details>
        {manualHex && !isHexColor(manualHex) && <p className="mt-1 text-xs text-[var(--semantic-status-danger)]">#RRGGBB 형식으로 입력해 주세요.</p>}
        <p className="mt-4 text-sm" aria-label="선택한 기준 색상">{selectedBaseColor ? <span className="inline-flex items-center gap-2 font-medium"><Check className="h-4 w-4 text-[var(--admin-theme-action-outline)]" aria-hidden="true" />선택된 기준색 <span className="font-mono">{selectedBaseColor}</span><span className="h-4 w-4 rounded-full border border-[var(--border-base)]" style={{ backgroundColor: selectedBaseColor }} aria-hidden="true" /></span> : "기준 색상: 선택되지 않음"}</p>
        <div className="mt-4 border-t border-[var(--border-base)] pt-4">
          <div className="flex items-center gap-2">
          <button type="button" className={actionClass()} aria-busy={recommending}
            disabled={!canRecommend}
            onClick={() => {
              if (canRecommend && branding?.posterImageUrl && selectedBaseColor) {
                onRecommend?.({ sourcePosterUrl: branding.posterImageUrl,
                  sourceColors: candidates.map((color) => color.hex), selectedBaseColor });
              }
            }}>{recommending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}{recommending ? "AI 추천 생성 중…" : autoRecommend ? "다시 추천받기" : "AI 테마 추천"}</button>
          <Tooltip open={recommendHelpOpen} onOpenChange={setRecommendHelpOpen}>
            <TooltipTrigger asChild onClick={(event) => { event.preventDefault(); setRecommendHelpOpen(true); }}>
              <button type="button" aria-label="AI 테마 추천 안내" aria-expanded={recommendHelpOpen} className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]", ADMIN_FOCUS_VISIBLE_RING_CLASS)}>
                <Info className="h-4 w-4" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8} className="max-w-[min(20rem,calc(100vw-2rem))] whitespace-normal text-left leading-5">
              선택한 기준색과 포스터 대표색을 바탕으로 AI가 테마 팔레트를 생성합니다.<br />
              색상 기준을 통과한 1~3개의 추천 시안이 제공되며,<br />
              하나를 선택해 미리보기와 편집을 진행할 수 있습니다.
            </TooltipContent>
          </Tooltip>
          </div>
          {!recommending && !analyzing && busyKind !== "poster" && branding?.posterImageUrl && !hasExtractedColors && <p className="mt-2 text-xs text-[var(--text-muted)]">AI 추천을 사용하려면 먼저 포스터 대표색을 추출해주세요.</p>}
          {!recommending && hasExtractedColors && !hasValidBaseColor && <p className="mt-2 text-xs text-[var(--text-muted)]">추출된 대표색을 선택하거나 유효한 HEX를 입력해주세요.</p>}
          <p className="mt-2 text-xs text-[var(--text-muted)]">추천을 확인한 뒤 전체 적용을 눌러야 사용자 화면이 바뀝니다.</p>
          {recommendationError && <p role="alert" className="mt-2 text-sm text-[var(--semantic-status-danger)]">{recommendationError}</p>}
        </div>
      </>}
    </div>}
    </div>
  </section>;
}
