import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Copy, Plus, Save, Trash2, Check, MonitorSmartphone } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { cn } from "@/components/common/ui/utils";
import { getErrorStatus } from "@/api/common/fetchAuth";
import { adminThemeApi, type ThemeProvenance, type ThemeRecommendationCandidate, type ThemeUpsertRequest } from "@/api/app/admin/adminThemeApi";
import type { ActiveThemeResponse, ThemeData } from "@/api/app/festival/activeThemeApi";
import { AdminShell } from "@/components/layout/AdminShell";
import { ADMIN_FOCUS_VISIBLE_RING_CLASS } from "@/routes/admin/adminStyleClasses";
import { cloneThemeData, createPreviewStyle, getThemeColor, isHexColor, readBundledThemeData, THEME_FIELDS, type ThemeDraft, validateThemeDraft } from "@/routes/admin/themeEditor";
import { applyThemeData } from "@/lib/app/festival/activeTheme";
import { FestivalBrandingPanel, type PosterAnalysisSnapshot } from "@/routes/admin/FestivalBrandingPanel";
import type { FestivalBranding } from "@/api/app/festival/festivalBrandingApi";
import { ThemeScreenPreview } from "@/routes/admin/ThemeScreenPreview";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/common/ui/dialog";
import { ADMIN_THEME_DESTRUCTIVE_ACTION_CLASS, ADMIN_THEME_PRIMARY_ACTION_CLASS, ADMIN_THEME_SECONDARY_ACTION_CLASS } from "@/routes/admin/adminStyleClasses";
import { createAdminThemeActionStyle, readActiveThemeStrong } from "@/routes/admin/adminThemeActionColors";
import { DESIGN_SYSTEM_BLACK } from "@/lib/app/festival/themeFallbackColors";

import { authStore } from "@/store/common/authStore";
import { hasAdminPermission } from "@/api/common/authCore";
import { recommendationFile } from "@/api/app/festival/posterBackgroundApi";
import { uploadTicketingBackground } from "@/api/app/festival/festivalSettingsApi";
import { getTicketingEnabled, subscribeFestivalSettings, setTicketingBackgroundImageUrl, setTicketCardBackgroundImageUrl } from "@/lib/app/festival/festivalCalendar";
import { createPosterBundleCache, posterBundleImage, type PosterBundle } from "@/routes/admin/posterBundle";

const panel = "rounded-2xl border border-[var(--admin-panel-border)] bg-[var(--admin-panel-bg)] p-5 sm:p-6";
const input = `h-10 w-full rounded-xl border border-[var(--border-base)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] ${ADMIN_FOCUS_VISIBLE_RING_CLASS}`;
const keyColors = (data: ThemeData) => [data.brand.primary, data.brand.secondary, data.brand.accent, data.category.pub, data.category.foodTruck];

function Swatches({ colors }: { colors: string[] }) {
  return <span className="flex shrink-0 items-center -space-x-1.5" aria-hidden="true">
    {colors.map((color, index) => <span key={index} className="h-6 w-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />)}
  </span>;
}

const provenanceOf = (theme: ActiveThemeResponse): ThemeProvenance => ({
  sourcePosterUrl: theme.sourcePosterUrl ?? null,
  selectedBaseColor: theme.selectedBaseColor ?? null,
  sourceColors: theme.sourceColors ? [...theme.sourceColors] : null,
});

function recommendationMessage(cause: unknown): string {
  if (cause instanceof Error && cause.message === "AI_THEME_RESPONSE_INVALID") {
    return "AI 추천 응답 형식이 현재 화면과 맞지 않습니다. 서버 응답을 확인해 주세요.";
  }
  const payload = (cause && typeof cause === "object" && "payload" in cause)
    ? (cause as { payload?: { code?: string } }).payload : undefined;
  switch (payload?.code) {
    case "POSTER_NOT_FOUND": return "공식 포스터가 없습니다. 먼저 포스터를 업로드해 주세요.";
    case "POSTER_UNSUPPORTED": return "저장된 포스터 형식을 읽을 수 없습니다. JPG 또는 PNG 포스터를 다시 업로드해 주세요.";
    case "FESTIVAL_SETTING_NOT_FOUND": return "축제 설정을 찾을 수 없습니다.";
    case "OPENAI_KEY_MISSING": return "서버에 OpenAI API 키가 설정되지 않았습니다.";
    case "OPENAI_TIMEOUT": return "AI 추천 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.";
    case "OPENAI_RATE_LIMIT": return "AI 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
    case "OPENAI_MALFORMED_OUTPUT": return "AI가 올바른 테마 데이터를 반환하지 않았습니다. 다시 시도해 주세요.";
    case "AI_THEME_VALIDATION_FAILED": return "추천 시안 생성에 실패했습니다. AI 응답에 따라 일시적으로 색상 기준을 충족하지 못할 수 있습니다. 다시 시도하면 새로운 시안이 생성될 수 있습니다.";
    case "AI_THEME_CANDIDATE_COUNT": return "AI가 추천 시안 3개를 완성하지 못했습니다. 다시 시도해 주세요.";
    case "AI_THEME_DUPLICATE_CANDIDATE": return "AI 추천 시안 구성이 올바르지 않습니다. 다시 시도해 주세요.";
    case "AI_THEME_DIVERSITY_FAILED": return "AI 추천 시안 간 색상 차이가 부족합니다. 다시 시도해 주세요.";
    case "OPENAI_MODEL_ERROR": return "AI 모델 요청에 실패했습니다. 서버 설정을 확인하거나 다시 시도해 주세요.";
    default: return "AI 테마 추천에 실패했습니다. 포스터와 서버 연결을 확인해 주세요.";
  }
}

function ThemeSourceDetails({ source }: { source: ThemeProvenance | null }) {
  if (!source?.sourcePosterUrl && !source?.selectedBaseColor && !source?.sourceColors?.length) {
    return <p aria-label="테마 생성 출처" className="mt-4 text-xs text-[var(--text-muted)]">생성 출처 정보가 없는 수동 테마입니다.</p>;
  }
  return <details aria-label="테마 생성 출처" className="group mt-5 rounded-xl border border-[var(--border-base)] bg-[var(--surface-subtle)] p-4 text-xs">
    <summary className="cursor-pointer font-semibold marker:text-[var(--ds-neutral-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-theme-action-focus)]">생성 출처 <span className="ml-2 font-normal text-[var(--text-muted)]">{source.selectedBaseColor ? `기준색 ${source.selectedBaseColor} · ` : ""}포스터 기반 AI 추천</span><span className="ml-2 text-[var(--admin-theme-action-outline)] group-open:hidden">상세 보기</span><span className="ml-2 hidden text-[var(--admin-theme-action-outline)] group-open:inline">접기</span></summary>
    <div className="mt-3 flex flex-wrap gap-4">
      <div><p className="mb-1 text-[var(--text-muted)]">기반 포스터</p>{source?.sourcePosterUrl ? <img src={source.sourcePosterUrl} alt="테마 기반 포스터" className="h-20 w-16 rounded object-contain" /> : <p>기반 포스터 정보 없음</p>}</div>
      {source?.selectedBaseColor && <div><p className="mb-1 text-[var(--text-muted)]">기준 색상</p><span className="inline-flex items-center gap-1.5 font-mono"><span className="h-4 w-4 rounded-full border border-[var(--border-base)]" style={{ backgroundColor: source.selectedBaseColor }} />{source.selectedBaseColor}</span></div>}
      {!!source?.sourceColors?.length && <div><p className="mb-1 text-[var(--text-muted)]">추출 색상</p><div className="flex flex-wrap gap-2">{source.sourceColors.map((color) => <span key={color} className="inline-flex items-center gap-1 font-mono"><span className="h-4 w-4 rounded-full border border-[var(--border-base)]" style={{ backgroundColor: color }} />{color}</span>)}</div></div>}
    </div>
  </details>;
}

function ThemePreview({ data }: { data: ThemeData }) {
  const badge = (label: string, color: string) => <span key={label} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, white)` }}>{label}</span>;
  return <section aria-label="편집 중인 테마 미리보기" className={panel} style={createPreviewStyle(data)} data-testid="theme-preview">
    <div className="mb-4"><h2 className="text-base font-semibold">색상 조합 미리보기</h2><p className="text-xs text-[var(--text-muted)]">이 영역만 편집 중인 색상을 사용합니다. 실제 서비스에는 적용되지 않습니다.</p></div>
    <div className="space-y-4 rounded-2xl border p-3 sm:p-4" style={{ borderColor: "color-mix(in srgb, var(--preview-brand-primary) 24%, white)", backgroundColor: "color-mix(in srgb, var(--preview-brand-primary) 3%, white)" }}>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--preview-brand-primary)" }}>주요 버튼</button>
        <span className="rounded-lg px-3 py-1.5 text-sm" style={{ backgroundColor: "var(--preview-brand-secondary)", color: "var(--ds-neutral-ink)" }}>보조 강조</span>
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "var(--preview-brand-accent)" }} aria-label="Accent 색상" />
        <span className="rounded-xl px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: "var(--preview-brand-strong)" }}>강조 버튼</span>
        <span className="text-sm font-semibold" style={{ color: "var(--preview-brand-strong)" }}>강조 텍스트</span>
      </div>
      <div className="flex flex-wrap gap-2">{badge("성공", "var(--preview-status-success)")}{badge("주의", "var(--preview-status-warning)")}{badge("오류", "var(--preview-status-danger)")}{badge("대기", "var(--preview-status-pending)")}</div>
      <div className="border-t border-[var(--border-base)] pt-3"><p className="mb-2 text-xs font-medium text-[var(--text-muted)]">지도 카테고리</p><div className="flex flex-wrap gap-x-4 gap-y-2">
        {THEME_FIELDS[2].colors.map(([key, label]) => <span key={key} className="inline-flex items-center gap-1.5 text-xs"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: `var(--preview-category-${key})` }} />{label}</span>)}
      </div></div>
    </div>
  </section>;
}

function RecommendationComparison({ candidates, selectedId, onChoose, busy }: {
  candidates: ThemeRecommendationCandidate[];
  selectedId: ThemeRecommendationCandidate["id"] | null;
  onChoose: (candidate: ThemeRecommendationCandidate) => void;
  busy: boolean;
}) {
  const directions = {
    balanced: { title: "원본형", description: "포스터의 색감과 분위기를 가장 충실하게 반영한 시안입니다." },
    vibrant: { title: "라이트형", description: "같은 색조를 유지하면서 더 밝고 경쾌하게 조정한 시안입니다." },
    deep: { title: "딥톤형", description: "같은 색조를 유지하면서 더 진하고 선명한 대비를 살린 시안입니다." },
  };
  const order = ["balanced", "vibrant", "deep"] as const;
  return <section className={panel} aria-label="AI 추천 시안">
    <div className="mb-4"><h2 className="text-base font-semibold">AI 추천 시안</h2>
      <p className="text-xs text-[var(--text-muted)]">추천 시안을 비교한 뒤 하나를 선택하세요. 선택 전에는 편집 중인 테마가 바뀌지 않습니다.</p>
      {candidates.length < 3 && <p className="mt-1 text-xs text-[var(--text-muted)]">일부 추천 시안이 색상 기준을 충족하지 못해 유효한 시안만 표시합니다.</p>}
    </div>
    <div className={cn("grid gap-4", candidates.length === 2 ? "lg:grid-cols-2" : candidates.length === 3 && "lg:grid-cols-3")}>{[...candidates].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)).map((candidate) => <article key={candidate.id}
      aria-label={`${directions[candidate.id].title} 시안`} data-selected={selectedId === candidate.id} className={cn("flex flex-col rounded-xl border bg-[var(--surface)] p-4", selectedId === candidate.id ? "border-[var(--admin-theme-action-outline)] ring-2 ring-[var(--admin-theme-action-focus)] ring-offset-2" : "border-[var(--border-base)]")}
      style={createPreviewStyle(candidate.themeData)}>
      <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{directions[candidate.id].title}</h3>
        {selectedId === candidate.id && <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--admin-theme-action-outline)]"><Check className="h-3.5 w-3.5" aria-hidden="true" />편집 시안 선택됨</span>}</div>
      <p className="mt-1 min-h-10 text-xs text-[var(--text-muted)]">{directions[candidate.id].description}</p>
      <div className="mt-3 rounded-xl border p-3" style={{ borderColor: "color-mix(in srgb, var(--preview-brand-primary) 24%, white)", backgroundColor: "color-mix(in srgb, var(--preview-brand-primary) 3%, white)" }}>
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: "var(--preview-brand-primary)" }}>주요 버튼</span>
          <span className="rounded-lg px-2 py-1 text-xs font-semibold text-white" style={{ backgroundColor: "var(--preview-brand-strong)" }}>강조 버튼</span>
          <span className="text-xs font-semibold" style={{ color: "var(--preview-brand-strong)" }}>강조 문구</span></div>
        <div className="mt-3 flex items-center gap-1.5" aria-label="브랜드 4색">{(["primary", "secondary", "accent", "strong"] as const).map((key) =>
          <span key={key} title={`${key}: ${candidate.themeData.brand[key]}`} className="h-5 w-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: `var(--preview-brand-${key})` }} />)}</div>
        <details className="mt-3 text-xs text-[var(--text-muted)]"><summary className="cursor-pointer">상태·지도 색상 보기</summary><div className="mt-3 flex items-center gap-1.5" aria-label="상태 4색">{(["success", "warning", "danger", "pending"] as const).map((key) =>
          <span key={key} title={`${key}: ${candidate.themeData.status[key]}`} className="h-3 w-3 rounded-full" style={{ backgroundColor: `var(--preview-status-${key})` }} />)}</div>
        <div className="mt-2 flex items-center gap-1.5" aria-label="지도 카테고리 6색">{THEME_FIELDS[2].colors.map(([key, label]) =>
          <span key={key} title={`${label}: ${getThemeColor(candidate.themeData, "category", key)}`} className="h-3 w-3 rounded-full" style={{ backgroundColor: `var(--preview-category-${key})` }} />)}</div></details>
      </div>
      <button type="button" className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "mt-4 w-full text-sm")} onClick={() => onChoose(candidate)} disabled={busy}>이 시안 선택</button>
    </article>)}</div>
  </section>;
}

export default function AdminTheme() {
  const location = useLocation();
  const ticketingEnabled = useSyncExternalStore(subscribeFestivalSettings, getTicketingEnabled, getTicketingEnabled);
  const session = useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, authStore.getSnapshot);
  const canBundle = hasAdminPermission(session.role, session.permissions, "TICKETING") && hasAdminPermission(session.role, session.permissions, "OPERATIONS");
  const [bundle, setBundle] = useState<{ poster: string; data: PosterBundle } | null>(null);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [backgroundPending, setBackgroundPending] = useState(false);
  const bundleCache = useRef(createPosterBundleCache());
  const uploadedBackgrounds = useRef(new Map<string, string>());
  const autoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const recommendationRequest = useRef<AbortController | null>(null);
  const recommendationVersion = useRef(0);
  useEffect(() => () => { clearTimeout(autoTimer.current); recommendationRequest.current?.abort(); ++recommendationVersion.current; bundleCache.current.dispose(); }, []);
  const [themes, setThemes] = useState<ActiveThemeResponse[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ThemeDraft | null>(null);
  const [savedDraft, setSavedDraft] = useState<ThemeDraft | null>(null);
  const [analysisSnapshot, setAnalysisSnapshot] = useState<PosterAnalysisSnapshot | null>(null);
  const [branding, setBranding] = useState<FestivalBranding | null>(null);
  const [newDraftProvenance, setNewDraftProvenance] = useState<ThemeProvenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [recommendationCandidates, setRecommendationCandidates] = useState<ThemeRecommendationCandidate[]>([]);
  const [recommendationSnapshot, setRecommendationSnapshot] = useState<PosterAnalysisSnapshot | null>(null);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<ThemeRecommendationCandidate["id"] | null>(null);
  const analysisRef = useRef<PosterAnalysisSnapshot | null>(null);
  const previewTriggerRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | null>(null);
  const selectionSequence = useRef(0);
  const activeTheme = themes.find((theme) => theme.active) ?? null;
  const [fallbackStrong] = useState(readActiveThemeStrong);
  const adminActionStyle = useMemo(() => createAdminThemeActionStyle(activeTheme?.themeData.brand.strong ?? fallbackStrong),
    [activeTheme?.themeData.brand.strong, fallbackStrong]);
  const selectedTheme = themes.find((theme) => theme.id === selectedId) ?? null;
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(savedDraft), [draft, savedDraft]);
  const recommendationCompleted = recommendationCandidates.length > 0 && !!recommendationSnapshot && !!analysisSnapshot
    && !recommendationError && JSON.stringify(recommendationSnapshot) === JSON.stringify(analysisSnapshot);

  useEffect(() => {
    const id = location.hash.slice(1);
    if (!["theme-ai", "theme-management", "theme-assets", "theme-colors", "theme-apply"].includes(id)) return;
    const target = document.getElementById(id);
    if (target instanceof HTMLDetailsElement) target.open = true;
    const frame = window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView?.({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.key]);

  function analysisChanged(snapshot: PosterAnalysisSnapshot | null) {
    if (JSON.stringify(analysisRef.current) === JSON.stringify(snapshot)) return;
    clearTimeout(autoTimer.current);
    recommendationRequest.current?.abort();
    ++recommendationVersion.current;
    analysisRef.current = snapshot;
    setAnalysisSnapshot(snapshot);
    setRecommendationError(null);
    setRecommendationCandidates([]);
    setRecommendationSnapshot(null);
    setSelectedRecommendationId(null);
    setRecommending(false);
    setBackgroundPending(false);
    if (bundle?.poster !== snapshot?.sourcePosterUrl) setBundle(null);
    setBundleError(null);
    if (snapshot?.sourceColors?.length && snapshot.selectedBaseColor && isHexColor(snapshot.selectedBaseColor)) {
      autoTimer.current = setTimeout(() => void recommend(snapshot), 600);
    }
  }

  function loadBackgrounds(snapshot: PosterAnalysisSnapshot, version: number) {
    setBundleError(null);
    setBackgroundPending(true);
      void bundleCache.current.get(snapshot.sourcePosterUrl).then(data => {
        if (version === recommendationVersion.current) setBundle({ poster: snapshot.sourcePosterUrl, data });
      }).catch(error => {
        if (version === recommendationVersion.current) setBundleError(error instanceof Error ? error.message : "배경 추천에 실패했습니다.");
      }).finally(() => { if (version === recommendationVersion.current) setBackgroundPending(false); });
  }

  async function recommend(snapshot: PosterAnalysisSnapshot) {
    clearTimeout(autoTimer.current);
    if (busy || !snapshot.sourceColors?.length || !snapshot.selectedBaseColor) return;
    recommendationRequest.current?.abort();
    const controller = new AbortController();
    recommendationRequest.current = controller;
    const version = ++recommendationVersion.current;
    const current = () => version === recommendationVersion.current && !controller.signal.aborted;
    const timeout = setTimeout(() => controller.abort(), 60_000);
    setRecommending(true);
    setRecommendationError(null);
    setBundleError(null);
    setRecommendationCandidates([]);
    setSelectedRecommendationId(null);
    setRecommendationSnapshot(null);
    if (canBundle) {
      loadBackgrounds(snapshot, version);
    }
    try {
      const response = await adminThemeApi.recommend({ sourceColors: snapshot.sourceColors, selectedBaseColor: snapshot.selectedBaseColor }, controller.signal);
      if (!current()) return;
      setRecommendationCandidates(response.candidates);
      setRecommendationSnapshot(snapshot);
      toast.success("색상 시안이 준비됐습니다. 하나를 선택하고 배경과 함께 확인하세요.");
    } catch (cause) {
      if (version === recommendationVersion.current) setRecommendationError(controller.signal.aborted ? "추천 시간이 초과되었습니다. 다시 시도해 주세요." : recommendationMessage(cause));
    } finally {
      clearTimeout(timeout);
      if (version === recommendationVersion.current) setRecommending(false);
    }
  }

  const bundleReady = canBundle && !!selectedRecommendationId && !!draft && !!bundle
    && bundle.poster === analysisSnapshot?.sourcePosterUrl && recommendationCompleted && !backgroundPending && !bundleError;

  async function applyBundle() {
    if (!bundleReady || !draft || !bundle || !recommendationSnapshot || busy) return;
    const validation = validateThemeDraft(draft);
    if (validation) { toast.error(validation); return; }
    clearTimeout(autoTimer.current);
    setBusy(true);
    try {
      const upload = async (target: "ticket" | "closed") => {
        const key = JSON.stringify([bundle.poster, target, bundle.data[target].imageBase64]);
        const previous = uploadedBackgrounds.current.get(key);
        if (previous) return previous;
        const { url } = await uploadTicketingBackground(recommendationFile(bundle.data[target]));
        uploadedBackgrounds.current.set(key, url);
        return url;
      };
      const [ticketCardBackgroundImageUrl, ticketingBackgroundImageUrl] = await Promise.all([upload("ticket"), upload("closed")]);
      const active = await adminThemeApi.applyBundle({ name: draft.name.trim(), themeData: cloneThemeData(draft.themeData),
        sourcePosterUrl: bundle.poster, sourceColors: recommendationSnapshot.sourceColors,
        selectedBaseColor: recommendationSnapshot.selectedBaseColor, ticketCardBackgroundImageUrl, ticketingBackgroundImageUrl });
      setThemes(themes => [active, ...themes.filter(theme => theme.id !== active.id).map(theme => ({ ...theme, active: false }))]);
      selectLoadedTheme(active);
      applyThemeData(active.themeData);
      setTicketCardBackgroundImageUrl(ticketCardBackgroundImageUrl);
      setTicketingBackgroundImageUrl(ticketingBackgroundImageUrl);
      toast.success("테마 색상과 두 배경을 모두 적용했습니다. 팔찌 배부 화면에도 공통 색상이 반영됩니다.");
    } catch (cause) {
      toast.error(cause instanceof Error ? `전체 적용에 실패했습니다. ${cause.message}` : "전체 적용에 실패했습니다. 다시 시도해 주세요.");
    } finally { setBusy(false); }
  }

  function chooseRecommendation(candidate: ThemeRecommendationCandidate) {
    if (!mayDiscard()) return;
    ++selectionSequence.current;
    setSelectedRecommendationId(candidate.id);
    setSelectedId(null);
    setDraft({ name: `${candidate.name} AI 추천 테마`, themeData: cloneThemeData(candidate.themeData) });
    setSavedDraft(null);
    setNewDraftProvenance(recommendationSnapshot ? {
      sourcePosterUrl: recommendationSnapshot.sourcePosterUrl,
      sourceColors: [...(recommendationSnapshot.sourceColors ?? [])],
      selectedBaseColor: recommendationSnapshot.selectedBaseColor,
    } : null);
  }

  const selectLoadedTheme = useCallback((theme: ActiveThemeResponse, preserveRecommendation = false) => {
    const next = { name: theme.name, themeData: cloneThemeData(theme.themeData) };
    setSelectedId(theme.id);
    setDraft(next);
    setSavedDraft(next);
    setNewDraftProvenance(null);
    if (!preserveRecommendation) setSelectedRecommendationId(null);
  }, []);

  const loadThemes = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminThemeApi.list(signal);
      if (signal?.aborted) return;
      setThemes(list);
      const first = list.find((theme) => theme.active) ?? list[0];
      if (first) selectLoadedTheme(first);
      else { setSelectedId(null); setDraft(null); setSavedDraft(null); }
    } catch {
      if (!signal?.aborted) setError("저장된 테마를 불러오지 못했습니다. 다시 시도해 주세요.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [selectLoadedTheme]);

  useEffect(() => {
    const controller = new AbortController();
    void loadThemes(controller.signal);
    return () => controller.abort();
  }, [loadThemes]);

  const mayDiscard = () => !dirty || window.confirm("저장하지 않은 변경사항을 버리시겠습니까?");

  async function selectTheme(id: number) {
    if (id === selectedId || !mayDiscard()) return;
    const sequence = ++selectionSequence.current;
    setBusy(true);
    try {
      const theme = await adminThemeApi.get(id);
      if (sequence === selectionSequence.current) selectLoadedTheme(theme);
    } catch { toast.error("테마 상세 정보를 불러오지 못했습니다."); }
    finally { if (sequence === selectionSequence.current) setBusy(false); }
  }

  function createDraft(source?: ActiveThemeResponse) {
    if (!mayDiscard()) return;
    ++selectionSequence.current;
    setSelectedId(null);
    setSelectedRecommendationId(null);
    const base = source ?? activeTheme;
    setNewDraftProvenance(source ? provenanceOf(source) : null);
    setDraft({ name: source ? `${source.name} 복제` : "", themeData: cloneThemeData(base?.themeData ?? readBundledThemeData()) });
    setSavedDraft(null);
  }

  function changeColor(group: keyof ThemeData, key: string, value: string) {
    setDraft((current) => current && ({ ...current, themeData: { ...current.themeData, [group]: { ...current.themeData[group], [key]: value } } }));
  }

  async function save() {
    if (!draft || busy) return;
    const validationError = validateThemeDraft(draft);
    if (validationError) { toast.error(validationError); return; }
    setBusy(true);
    try {
      const payload: ThemeUpsertRequest = { name: draft.name.trim(), themeData: cloneThemeData(draft.themeData) };
      // Recheck before PUT: another admin may have activated this row since the list loaded.
      // PUT on an active row would change the live theme without an activation request.
      const latest = selectedId === null ? null : await adminThemeApi.get(selectedId);
      const create = selectedId === null || selectedTheme?.active || latest?.active;
      if (create) Object.assign(payload, selectedId === null
        ? (newDraftProvenance ?? analysisSnapshot ?? { sourcePosterUrl: null, selectedBaseColor: null, sourceColors: null })
        : provenanceOf(latest ?? selectedTheme!));
      const saved = create ? await adminThemeApi.create(payload) : await adminThemeApi.update(selectedId, payload);
      setThemes((current) => create ? [saved, ...current] : current.map((item) => item.id === saved.id ? saved : item));
      // Saving the current recommendation keeps its staged crops available for full apply.
      // Do not restore the selection: an analysis change during this request may have invalidated it.
      selectLoadedTheme(saved, selectedRecommendationId !== null);
      toast.success(selectedTheme?.active ? "활성 테마의 수정본을 새 비활성 테마로 저장했습니다." : "테마를 저장했습니다. 실제 적용은 별도로 진행해 주세요.");
    } catch { toast.error("테마 저장에 실패했습니다. 입력값과 연결 상태를 확인해 주세요."); }
    finally { setBusy(false); }
  }

  async function activate() {
    if (!selectedId || !selectedTheme || busy) return;
    if (dirty) { toast.error("변경사항을 먼저 저장한 뒤 적용해 주세요."); return; }
    setBusy(true);
    try {
      const active = await adminThemeApi.activate(selectedId);
      setThemes((current) => current.map((item) => item.id === active.id ? active : { ...item, active: false }));
      selectLoadedTheme(active);
      applyThemeData(active.themeData);
      toast.success("테마를 적용했습니다. 새로 접속하는 사용자 화면에 반영됩니다.");
    } catch { toast.error("테마 적용에 실패했습니다."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!selectedId || !selectedTheme || busy) return;
    if (selectedTheme.active) { toast.error("현재 활성 테마는 삭제할 수 없습니다."); return; }
    if (!window.confirm(`‘${selectedTheme.name}’ 테마를 삭제하시겠습니까?`)) return;
    setBusy(true);
    try {
      await adminThemeApi.delete(selectedId);
      const remaining = themes.filter((item) => item.id !== selectedId);
      setThemes(remaining);
      const next = remaining.find((item) => item.active) ?? remaining[0];
      if (next) selectLoadedTheme(next);
      else { setSelectedId(null); setDraft(null); setSavedDraft(null); }
      toast.success("테마를 삭제했습니다.");
    } catch (cause) {
      toast.error(getErrorStatus(cause) === 409 ? "현재 활성 테마는 삭제할 수 없습니다. 다른 테마를 적용한 뒤 다시 시도해 주세요." : "테마 삭제에 실패했습니다.");
    } finally { setBusy(false); }
  }

  return <>
    <Toaster position="top-right" closeButton richColors />
    <div style={adminActionStyle} data-testid="admin-theme-action-scope">
    <Dialog>
    <AdminShell title="축제 테마" mainClassName="mx-auto w-full max-w-[1120px] space-y-6 px-4 py-6 sm:px-8">
      <section className="flex flex-col gap-4 border-b border-[var(--border-base)] pb-6 sm:flex-row sm:items-center sm:justify-between" aria-label="화면 확인과 테마 작업 안내">
        <div><h2 className="text-xl font-semibold tracking-tight">포스터로 축제 화면을 완성하세요</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">포스터와 로고를 넣고, 마음에 드는 색을 골라 주세요.</p><p className="mt-2 text-xs text-[var(--text-muted)]">현재 적용: <span className="font-medium text-[var(--text)]">{activeTheme?.name ?? "기본 테마"}</span></p></div>

      </section>
      <nav aria-label="테마 작업 순서" className="grid grid-cols-3 border-b border-[var(--border-base)] text-xs sm:text-sm">
        {[['theme-assets', '1', '포스터·로고'], ['theme-colors', '2', '색상·시안 선택'], ['theme-apply', '3', '확인·적용']].map(([id, step, label]) => <a key={id} href={`#${id}`} className="flex items-center gap-2 px-1 py-4 font-medium text-[var(--text-muted)] hover:text-[var(--admin-theme-action-outline)] sm:px-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-xs">{step}</span>{label}</a>)}
      </nav>
      <div id="theme-ai" className="space-y-6 scroll-mt-40 sm:scroll-mt-28" aria-label="AI 테마 추천 영역">
        <FestivalBrandingPanel onAnalysisChange={analysisChanged} onBrandingChange={setBranding} onRecommend={(snapshot) => void recommend(snapshot)}
          recommending={recommending} autoRecommend locked={busy} recommendationCompleted={recommendationCompleted} recommendationError={recommendationError} adminActionStyle={adminActionStyle} />
        {recommendationCandidates.length > 0 && <RecommendationComparison candidates={recommendationCandidates}
          selectedId={selectedRecommendationId} onChoose={chooseRecommendation} busy={busy || recommending} />}
        <section id="theme-apply" className={cn(panel, "scroll-mt-40 sm:scroll-mt-28")} aria-label="통합 추천과 적용">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">3. 확인하고 전체 적용</h2><span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs text-[var(--text-muted)]">티켓팅 {ticketingEnabled ? "ON" : "OFF"}</span></div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">시안을 선택하면 내 정보와 티켓 화면의 색상·배경을 함께 확인할 수 있어요.</p>
          {!canBundle ? <p className="mt-3 text-sm">전체 추천·적용에는 축제 운영과 티켓팅 권한이 모두 필요합니다. 현재 권한으로 색상 테마는 추천받을 수 있습니다.</p> : <>
            {backgroundPending && <p role="status" className="mt-3 text-sm">포스터에서 두 배경을 준비하고 있습니다…</p>}
            {bundleError && <div role="alert" className="mt-3 text-sm"><p>{bundleError}</p><button className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "mt-2")} onClick={() => { if (analysisSnapshot) loadBackgrounds(analysisSnapshot, recommendationVersion.current); }} disabled={busy || backgroundPending}>배경만 다시 추천</button></div>}
            {!selectedRecommendationId && <p className="mt-4 rounded-xl bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-muted)]">위에서 대표색을 고른 뒤, 추천 시안을 선택해 주세요.</p>}
            {bundleReady && <div className="mt-5 flex flex-wrap gap-3">
              <DialogTrigger asChild><button ref={previewTriggerRef} type="button" disabled={busy || recommending} className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "inline-flex items-center gap-2")}><MonitorSmartphone className="h-4 w-4" />추천 화면 확인</button></DialogTrigger>
              <button type="button" onClick={() => void applyBundle()} disabled={busy || recommending} className={ADMIN_THEME_PRIMARY_ACTION_CLASS} aria-busy={busy}>전체 적용</button>
            </div>}
            <p className="mt-2 text-xs text-[var(--text-muted)]">전체 적용하면 현재 색상과 배경이 추천 결과로 바뀝니다. 내 정보는 항상, 발급 티켓·입장 안내는 ON/OFF에 맞춰 표시됩니다. 팔찌 배부 색상도 함께 반영됩니다.</p>
          </>}
        </section>
      </div>
      <details id="theme-management" className="space-y-6 scroll-mt-40 sm:scroll-mt-28" aria-label="테마 관리 영역">
      <summary className="cursor-pointer border-t border-[var(--border-base)] py-5 text-sm font-semibold">고급 설정 <span className="ml-2 font-normal text-[var(--text-muted)]">저장된 테마 · 색상 직접 수정</span></summary>
      {!bundleReady && <DialogTrigger asChild><button ref={previewTriggerRef} type="button" disabled={busy} className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "inline-flex items-center gap-2 text-sm")}><MonitorSmartphone className="h-4 w-4" />편집 중인 화면 확인</button></DialogTrigger>}
      <p className="text-xs text-[var(--text-muted)]">저장된 테마는 색상만 관리합니다. 배경까지 바꾸려면 위의 추천 과정을 진행하세요.</p>
      {loading ? <p role="status" className="text-sm text-[var(--text-muted)]">테마를 불러오는 중입니다…</p> : error ?
        <div role="alert" className={panel}><p className="mb-3 text-sm">{error}</p><button type="button" className={ADMIN_THEME_SECONDARY_ACTION_CLASS} onClick={() => void loadThemes()}>다시 시도</button></div> : <>
        <section className={panel} aria-label="현재 활성 테마"><div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-medium text-[var(--text-muted)]">현재 활성 테마</p><div className="mt-1 flex items-center gap-2"><h2 className="text-lg font-semibold">{activeTheme?.name ?? "적용된 테마 없음"}</h2>{activeTheme && <span className="rounded-full border border-[var(--admin-theme-action-outline)] bg-white px-2 py-0.5 text-xs font-semibold text-[var(--admin-theme-action-outline)]">활성</span>}</div>
            {!activeTheme && <p className="mt-1 text-xs text-[var(--text-muted)]">서비스는 번들 기본 색상을 사용합니다.</p>}</div>
          {activeTheme && <Swatches colors={keyColors(activeTheme.themeData)} />}
        </div></section>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.5fr)]">
        <div className="min-w-0 space-y-6">
          <section className={panel} aria-label="저장된 테마 목록"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">저장된 테마</h2><button type="button" aria-label="새 테마 생성" className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "inline-flex items-center gap-1.5 text-sm")} onClick={() => createDraft()} disabled={busy || recommending}><Plus className="h-4 w-4" />새 테마</button></div>
            {themes.length === 0 ? <p className="text-sm text-[var(--text-muted)]">저장된 테마가 없습니다. 새 테마를 만들어 주세요.</p> : <div className="grid gap-2">{themes.map((theme) => <button type="button" key={theme.id} onClick={() => void selectTheme(theme.id)} disabled={busy || recommending} aria-pressed={selectedId === theme.id} className={cn("w-full rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-theme-action-focus)] disabled:cursor-not-allowed disabled:opacity-50", selectedId === theme.id ? "border-[var(--admin-theme-action-outline)] bg-[var(--admin-theme-action-hover)] ring-1 ring-[var(--admin-theme-action-focus)]" : "border-[var(--border-base)] bg-white hover:border-[var(--admin-theme-action-outline)] hover:bg-[var(--admin-theme-action-hover)]")}>
              <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{theme.name}</span>{theme.active && <span className="shrink-0 rounded-full border border-[var(--admin-theme-action-outline)] bg-white px-2 py-0.5 text-xs font-semibold text-[var(--admin-theme-action-outline)]">활성</span>}</span>{theme.updatedAt && !Number.isNaN(Date.parse(theme.updatedAt)) && <span className="mt-1 block text-xs text-[var(--text-muted)]">수정 {new Date(theme.updatedAt).toLocaleDateString("ko-KR")}</span>}<span className="mt-2 block"><Swatches colors={keyColors(theme.themeData)} /></span>
            </button>)}</div>}
          </section>
          {draft ? <ThemePreview data={draft.themeData} /> : <div className={panel}><p className="text-sm text-[var(--text-muted)]">테마를 선택하면 이곳에 미리보기가 표시됩니다.</p></div>}
        </div>
        <div className="min-w-0 space-y-6">{draft ? <>
            <section className={panel} aria-label="테마 편집"><div className="mb-5"><h2 className="font-semibold">{selectedId === null ? "새 테마" : "테마 편집"}</h2><p className="text-xs text-[var(--text-muted)]">저장과 실제 적용은 별개입니다.{selectedTheme?.active && " 활성 테마를 수정해 저장하면 비활성 복제본이 생성됩니다."}</p></div>
              <label className="block text-sm font-medium">테마 이름<input disabled={busy} aria-label="테마 이름" className={cn("mt-1", input)} maxLength={100} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
              <ThemeSourceDetails source={selectedTheme ? provenanceOf(selectedTheme) : newDraftProvenance ?? analysisSnapshot} />
              <div className="mt-5 flex flex-wrap items-center gap-2 border-y border-[var(--border-base)] py-4" aria-label="테마 편집 작업">
                {!dirty && !busy ? <span aria-label="저장 상태" className="inline-flex items-center rounded-full border border-[var(--border-base)] bg-[var(--ds-neutral-hover)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)]">변경사항 없음</span>
                  : <button type="button" className={cn(ADMIN_THEME_PRIMARY_ACTION_CLASS, "inline-flex items-center gap-1.5 text-sm")} onClick={() => void save()} disabled={busy || recommending || !dirty} aria-busy={busy}>{busy ? "처리 중…" : <><Save className="h-4 w-4" />저장</>}</button>}
                {selectedTheme && (selectedTheme.active
                  ? <span aria-label="테마 적용 상태" className="inline-flex items-center gap-1 rounded-full border border-[var(--admin-theme-action-outline)] bg-[var(--admin-theme-action-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-theme-action-outline)]"><Check className="h-3.5 w-3.5" aria-hidden="true" />적용 중</span>
                  : <button type="button" className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "inline-flex items-center gap-1.5 text-sm")} onClick={() => void activate()} disabled={busy || recommending || dirty}><Check className="h-4 w-4" />저장된 테마 적용</button>)}
                {selectedTheme && <button type="button" className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "inline-flex items-center gap-1.5 text-sm")} onClick={() => createDraft(selectedTheme)} disabled={busy || recommending}><Copy className="h-4 w-4" />복제</button>}
                {selectedTheme && <button type="button" className={cn(ADMIN_THEME_DESTRUCTIVE_ACTION_CLASS, "inline-flex items-center gap-1.5 text-sm")} onClick={() => void remove()} disabled={busy || recommending || selectedTheme.active} title={selectedTheme.active ? "활성 테마는 삭제할 수 없습니다" : undefined}><Trash2 className="h-4 w-4" />삭제</button>}
                {dirty && selectedTheme && !selectedTheme.active && <p className="w-full text-xs text-[var(--text-muted)]">변경사항을 저장한 뒤 적용할 수 있습니다.</p>}
              </div>
              <div className="mt-6 space-y-6">{THEME_FIELDS.map((group) => <details key={group.key} open={group.key === "brand"} className="rounded-xl border border-[var(--border-base)] p-4"><summary className="cursor-pointer text-sm font-semibold">{group.title}<span className="ml-2 text-xs font-normal text-[var(--text-muted)]">{group.colors.length}가지 색상</span></summary><div className="mt-4 grid gap-3 sm:grid-cols-2">{group.colors.map(([key, label]) => {
                const value = getThemeColor(draft.themeData, group.key, key);
                const valid = isHexColor(value);
                return <label key={key} className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--border-base)] p-3 text-sm">
                  <input disabled={busy} type="color" aria-label={`${label} 색상 선택`} value={valid ? value : DESIGN_SYSTEM_BLACK} onChange={(event) => changeColor(group.key, key, event.target.value)} className="h-9 w-10 shrink-0 cursor-pointer rounded border-0 bg-transparent" />
                  <span className="min-w-0 flex-1"><span className="mb-1 block font-medium">{label}</span><input disabled={busy} type="text" aria-label={`${label} HEX`} value={value} onChange={(event) => changeColor(group.key, key, event.target.value)} maxLength={7} spellCheck={false} aria-invalid={!valid} className={cn("w-full rounded-lg border px-2 py-1 font-mono text-xs", valid ? "border-[var(--border-base)]" : "border-[var(--semantic-status-danger)]")} /></span>
                  <span className="h-7 w-7 shrink-0 rounded-full border border-[var(--border-base)]" style={{ backgroundColor: valid ? value : "transparent" }} aria-hidden="true" />
                </label>;
              })}</div></details>)}</div>
            </section>
          </> : <div className={panel}><p className="text-sm text-[var(--text-muted)]">목록에서 테마를 선택하거나 새 테마를 만들어 주세요.</p></div>}</div>
        </div>
      </>}
      </details>
    </AdminShell>
              <DialogContent showCloseButton={false} style={adminActionStyle} onCloseAutoFocus={(event) => { event.preventDefault(); previewTriggerRef.current?.focus(); }} className="flex h-[min(94dvh,960px)] max-h-[94dvh] w-[calc(100%-1rem)] max-w-[min(760px,calc(100%-1rem))] flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-[760px]">
                <DialogHeader className="shrink-0 border-b border-[var(--border-base)] px-5 py-4 text-left sm:px-6"><div className="flex items-start justify-between gap-4"><div><DialogTitle>사용자 화면 미리보기</DialogTitle><DialogDescription className="mt-2 text-xs text-[var(--text-muted)]">선택한 색상과 배경을 미리 확인하세요. 전체 적용 전에는 사용자 화면이 바뀌지 않습니다.</DialogDescription></div><DialogClose asChild><button type="button" className={cn(ADMIN_THEME_SECONDARY_ACTION_CLASS, "shrink-0 whitespace-nowrap")}>닫기</button></DialogClose></div></DialogHeader>
                <div className="min-h-0 overflow-y-auto px-3 py-4 sm:px-6"><ThemeScreenPreview data={draft?.themeData ?? activeTheme?.themeData ?? readBundledThemeData()} branding={branding} backgrounds={selectedRecommendationId && bundle && bundle.poster === analysisSnapshot?.sourcePosterUrl ? { ticket: posterBundleImage(bundle.data.ticket), closed: posterBundleImage(bundle.data.closed) } : undefined} embedded /></div>
              </DialogContent>
    </Dialog>
    </div>
  </>;
}
