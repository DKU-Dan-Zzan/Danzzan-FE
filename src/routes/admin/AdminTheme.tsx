import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Plus, Save, Trash2, Check } from "lucide-react";
import { Toaster, toast } from "sonner";
import { getErrorStatus } from "@/api/common/fetchAuth";
import { adminThemeApi, type ThemeProvenance, type ThemeUpsertRequest } from "@/api/app/admin/adminThemeApi";
import type { ActiveThemeResponse, ThemeData } from "@/api/app/festival/activeThemeApi";
import { AdminShell } from "@/components/layout/AdminShell";
import { ADMIN_FOCUS_VISIBLE_RING_CLASS, ADMIN_PRIMARY_ACTION_BUTTON_CLASS, ADMIN_SECONDARY_ACTION_BUTTON_CLASS } from "@/routes/admin/adminStyleClasses";
import { cloneThemeData, createPreviewStyle, getThemeColor, isHexColor, readBundledThemeData, THEME_FIELDS, type ThemeDraft, validateThemeDraft } from "@/routes/admin/themeEditor";
import { applyThemeData } from "@/lib/app/festival/activeTheme";
import { FestivalBrandingPanel, type PosterAnalysisSnapshot } from "@/routes/admin/FestivalBrandingPanel";

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
    case "AI_THEME_VALIDATION_FAILED": return "AI 추천 색상이 테마 기준을 충족하지 못했습니다. 다시 시도해 주세요.";
    case "OPENAI_MODEL_ERROR": return "AI 모델 요청에 실패했습니다. 서버 설정을 확인하거나 다시 시도해 주세요.";
    default: return "AI 테마 추천에 실패했습니다. 포스터와 서버 연결을 확인해 주세요.";
  }
}

function ThemeSourceDetails({ source }: { source: ThemeProvenance | null }) {
  return <section aria-label="테마 생성 출처" className="mt-5 rounded-xl border border-[var(--border-base)] bg-[var(--surface-subtle)] p-4 text-xs">
    <h3 className="font-semibold">생성 출처</h3>
    <div className="mt-3 flex flex-wrap gap-4">
      <div><p className="mb-1 text-[var(--text-muted)]">기반 포스터</p>{source?.sourcePosterUrl ? <img src={source.sourcePosterUrl} alt="테마 기반 포스터" className="h-20 w-16 rounded object-contain" /> : <p>기반 포스터 정보 없음</p>}</div>
      {source?.selectedBaseColor && <div><p className="mb-1 text-[var(--text-muted)]">기준 색상</p><span className="inline-flex items-center gap-1.5 font-mono"><span className="h-4 w-4 rounded-full border border-[var(--border-base)]" style={{ backgroundColor: source.selectedBaseColor }} />{source.selectedBaseColor}</span></div>}
      {!!source?.sourceColors?.length && <div><p className="mb-1 text-[var(--text-muted)]">추출 색상</p><div className="flex flex-wrap gap-2">{source.sourceColors.map((color) => <span key={color} className="inline-flex items-center gap-1 font-mono"><span className="h-4 w-4 rounded-full border border-[var(--border-base)]" style={{ backgroundColor: color }} />{color}</span>)}</div></div>}
    </div>
  </section>;
}

function ThemePreview({ data }: { data: ThemeData }) {
  const badge = (label: string, color: string) => <span key={label} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, white)` }}>{label}</span>;
  return <section aria-label="편집 중인 테마 미리보기" className={panel} style={createPreviewStyle(data)} data-testid="theme-preview">
    <div className="mb-4"><h2 className="text-base font-semibold">미리보기</h2><p className="text-xs text-[var(--text-muted)]">이 영역만 편집 중인 색상을 사용합니다. 실제 서비스에는 적용되지 않습니다.</p></div>
    <div className="space-y-4 rounded-2xl border p-5" style={{ borderColor: "color-mix(in srgb, var(--preview-brand-primary) 24%, white)", backgroundColor: "color-mix(in srgb, var(--preview-brand-primary) 3%, white)" }}>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--preview-brand-primary)" }}>주요 버튼</button>
        <span className="rounded-lg px-3 py-1.5 text-sm" style={{ backgroundColor: "var(--preview-brand-secondary)", color: "var(--ds-neutral-ink)" }}>보조 강조</span>
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "var(--preview-brand-accent)" }} aria-label="Accent 색상" />
        <span className="rounded-xl px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: "var(--preview-brand-strong)" }}>강한 CTA</span>
        <span className="text-sm font-semibold" style={{ color: "var(--preview-brand-strong)" }}>강조 텍스트</span>
      </div>
      <div className="flex flex-wrap gap-2">{badge("성공", "var(--preview-status-success)")}{badge("주의", "var(--preview-status-warning)")}{badge("오류", "var(--preview-status-danger)")}{badge("대기", "var(--preview-status-pending)")}</div>
      <div className="border-t border-[var(--border-base)] pt-3"><p className="mb-2 text-xs font-medium text-[var(--text-muted)]">지도 카테고리</p><div className="flex flex-wrap gap-x-4 gap-y-2">
        {THEME_FIELDS[2].colors.map(([key, label]) => <span key={key} className="inline-flex items-center gap-1.5 text-xs"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: `var(--preview-category-${key})` }} />{label}</span>)}
      </div></div>
    </div>
  </section>;
}

export default function AdminTheme() {
  const [themes, setThemes] = useState<ActiveThemeResponse[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ThemeDraft | null>(null);
  const [savedDraft, setSavedDraft] = useState<ThemeDraft | null>(null);
  const [analysisSnapshot, setAnalysisSnapshot] = useState<PosterAnalysisSnapshot | null>(null);
  const [newDraftProvenance, setNewDraftProvenance] = useState<ThemeProvenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const recommendingRef = useRef(false);
  const analysisRef = useRef<PosterAnalysisSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectionSequence = useRef(0);
  const activeTheme = themes.find((theme) => theme.active) ?? null;
  const selectedTheme = themes.find((theme) => theme.id === selectedId) ?? null;
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(savedDraft), [draft, savedDraft]);

  function analysisChanged(snapshot: PosterAnalysisSnapshot | null) {
    analysisRef.current = snapshot;
    setAnalysisSnapshot(snapshot);
    setRecommendationError(null);
  }

  async function recommend(snapshot: PosterAnalysisSnapshot) {
    if (recommendingRef.current || busy || !snapshot.sourceColors?.length || !snapshot.selectedBaseColor) return;
    if (!mayDiscard()) return;
    recommendingRef.current = true;
    setRecommending(true);
    setBusy(true);
    setRecommendationError(null);
    try {
      const themeData = await adminThemeApi.recommend({
        sourceColors: snapshot.sourceColors, selectedBaseColor: snapshot.selectedBaseColor,
      });
      if (JSON.stringify(analysisRef.current) !== JSON.stringify(snapshot)) {
        setRecommendationError("포스터 분석 정보가 변경되었습니다. 다시 추천해 주세요.");
        return;
      }
      ++selectionSequence.current;
      setSelectedId(null);
      setDraft({ name: "AI 추천 테마", themeData: cloneThemeData(themeData) });
      setSavedDraft(null);
      // Capture provenance in the unsaved draft; it is sent only by the existing Save action.
      setNewDraftProvenance({ sourcePosterUrl: snapshot.sourcePosterUrl,
        sourceColors: [...snapshot.sourceColors], selectedBaseColor: snapshot.selectedBaseColor });
      toast.success("AI 추천을 미저장 테마에 반영했습니다. 색상을 확인하고 직접 저장해 주세요.");
    } catch (cause) {
      setRecommendationError(recommendationMessage(cause));
    } finally {
      recommendingRef.current = false;
      setRecommending(false);
      setBusy(false);
    }
  }

  const selectLoadedTheme = useCallback((theme: ActiveThemeResponse) => {
    const next = { name: theme.name, themeData: cloneThemeData(theme.themeData) };
    setSelectedId(theme.id);
    setDraft(next);
    setSavedDraft(next);
    setNewDraftProvenance(null);
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
      selectLoadedTheme(saved);
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
    <AdminShell title="축제 테마" eyebrow="FESTIVAL THEME" mainClassName="mx-auto w-full max-w-[1360px] space-y-6 px-6 py-6">
      <FestivalBrandingPanel onAnalysisChange={analysisChanged} onRecommend={(snapshot) => void recommend(snapshot)}
        recommending={recommending} recommendationError={recommendationError} />
      {loading ? <p role="status" className="text-sm text-[var(--text-muted)]">테마를 불러오는 중입니다…</p> : error ?
        <div role="alert" className={panel}><p className="mb-3 text-sm">{error}</p><button type="button" className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS} onClick={() => void loadThemes()}>다시 시도</button></div> : <>
        <section className={panel} aria-label="현재 활성 테마"><div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-medium text-[var(--text-muted)]">현재 활성 테마</p><div className="mt-1 flex items-center gap-2"><h2 className="text-lg font-semibold">{activeTheme?.name ?? "적용된 테마 없음"}</h2>{activeTheme && <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">활성</span>}</div>
            {!activeTheme && <p className="mt-1 text-xs text-[var(--text-muted)]">서비스는 번들 기본 색상을 사용합니다.</p>}</div>
          {activeTheme && <Swatches colors={keyColors(activeTheme.themeData)} />}
        </div></section>
        <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <section className={panel} aria-label="저장된 테마 목록"><div className="mb-4 flex items-center justify-between gap-2"><h2 className="font-semibold">저장된 테마</h2><button type="button" aria-label="새 테마 생성" className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS} onClick={() => createDraft()} disabled={busy}><Plus className="h-4 w-4" /></button></div>
            {themes.length === 0 ? <p className="text-sm text-[var(--text-muted)]">저장된 테마가 없습니다. 새 테마를 만들어 주세요.</p> : <div className="space-y-2">{themes.map((theme) => <button type="button" key={theme.id} onClick={() => void selectTheme(theme.id)} disabled={busy} aria-pressed={selectedId === theme.id} className={`w-full rounded-xl border p-3 text-left ${ADMIN_FOCUS_VISIBLE_RING_CLASS} ${selectedId === theme.id ? "border-[var(--accent)] bg-[var(--surface-subtle)]" : "border-[var(--border-base)] hover:bg-[var(--surface-subtle)]"}`}>
              <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{theme.name}</span>{theme.active && <span className="shrink-0 text-xs font-semibold text-[var(--accent)]">활성</span>}</span><span className="mt-2 block"><Swatches colors={keyColors(theme.themeData)} /></span>
            </button>)}</div>}
          </section>
          <div className="space-y-6">{draft ? <>
            <section className={panel} aria-label="테마 편집"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{selectedId === null ? "새 테마" : "테마 편집"}</h2><p className="text-xs text-[var(--text-muted)]">저장과 실제 적용은 별개입니다.{selectedTheme?.active && " 활성 테마를 수정해 저장하면 비활성 복제본이 생성됩니다."}</p></div>
              {selectedTheme && <button type="button" className={`${ADMIN_SECONDARY_ACTION_BUTTON_CLASS} inline-flex items-center gap-1.5 text-sm`} onClick={() => createDraft(selectedTheme)} disabled={busy}><Copy className="h-4 w-4" />복제</button>}
            </div>
              <label className="block text-sm font-medium">테마 이름<input aria-label="테마 이름" className={`mt-1 ${input}`} maxLength={100} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
              <ThemeSourceDetails source={selectedTheme ? provenanceOf(selectedTheme) : newDraftProvenance ?? analysisSnapshot} />
              <div className="mt-6 space-y-6">{THEME_FIELDS.map((group) => <fieldset key={group.key} className="border-t border-[var(--border-base)] pt-5"><legend className="px-1 text-sm font-semibold">{group.title}</legend><div className="grid gap-3 sm:grid-cols-2">{group.colors.map(([key, label]) => {
                const value = getThemeColor(draft.themeData, group.key, key);
                const valid = isHexColor(value);
                return <label key={key} className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--border-base)] p-3 text-sm">
                  <input type="color" aria-label={`${label} 색상 선택`} value={valid ? value : "#000000"} onChange={(event) => changeColor(group.key, key, event.target.value)} className="h-9 w-10 shrink-0 cursor-pointer rounded border-0 bg-transparent" />
                  <span className="min-w-0 flex-1"><span className="mb-1 block font-medium">{label}</span><input type="text" aria-label={`${label} HEX`} value={value} onChange={(event) => changeColor(group.key, key, event.target.value)} maxLength={7} spellCheck={false} aria-invalid={!valid} className={`w-full rounded-lg border px-2 py-1 font-mono text-xs ${valid ? "border-[var(--border-base)]" : "border-[var(--semantic-status-danger)]"}`} /></span>
                  <span className="h-7 w-7 shrink-0 rounded-full border border-[var(--border-base)]" style={{ backgroundColor: valid ? value : "transparent" }} aria-hidden="true" />
                </label>;
              })}</div></fieldset>)}</div>
              <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--border-base)] pt-5">
                <button type="button" className={`${ADMIN_PRIMARY_ACTION_BUTTON_CLASS} inline-flex items-center gap-1.5 text-sm`} onClick={() => void save()} disabled={busy || !dirty}><Save className="h-4 w-4" />저장</button>
                {selectedTheme && <button type="button" className={`${ADMIN_SECONDARY_ACTION_BUTTON_CLASS} inline-flex items-center gap-1.5 text-sm`} onClick={() => void activate()} disabled={busy || dirty || selectedTheme.active}><Check className="h-4 w-4" />저장된 테마 적용</button>}
                {selectedTheme && <button type="button" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-[var(--semantic-status-danger)] disabled:opacity-40" onClick={() => void remove()} disabled={busy || selectedTheme.active}><Trash2 className="h-4 w-4" />삭제</button>}
              </div>
            </section><ThemePreview data={draft.themeData} />
          </> : <div className={panel}><p className="text-sm text-[var(--text-muted)]">목록에서 테마를 선택하거나 새 테마를 만들어 주세요.</p></div>}</div>
        </div>
      </>}
    </AdminShell>
  </>;
}
