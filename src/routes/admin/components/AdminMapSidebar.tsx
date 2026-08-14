import { useMemo, useState } from "react";
import {
  AlertCircle,
  Map,
  MapPin,
  School,
  Search,
  Tent,
  Trash2,
} from "lucide-react";
import type { AdminMapBooth, AdminMapCollege } from "@/api/app/admin/adminMapApi";
import { cn } from "@/components/common/ui/utils";
import type { EditorMode, SelectedItem } from "@/routes/admin/adminMapTypes";
import { formatFestivalDateLabel } from "@/utils/app/boothmap/festivalDates";

type AdminMapSidebarProps = {
  globalError: string | null;
  festivalDates: readonly string[];
  selectedDate: string;
  editorMode: EditorMode;
  statusMessage: string;
  booths: AdminMapBooth[];
  colleges: AdminMapCollege[];
  selectedItem: SelectedItem;
  selectedBooth: AdminMapBooth | null;
  selectedCollege: AdminMapCollege | null;
  onChangeDate: (date: string) => void;
  onActivateBoothMode: () => void;
  onActivateCollegeMode: () => void;
  onClearSelection: () => void;
  onSelectBooth: (boothId: number) => void;
  onSelectCollege: (collegeId: number) => void;
  onClearBoothLocation: () => void;
};

type BoothFilter = "all" | "unplaced";

function getBoothDisplayName(name: string) {
  return name.replace("(기업)", "").trim();
}

function isPlaced(locationX: number | null, locationY: number | null) {
  return locationX != null && locationY != null;
}

function getPlacementLabel(locationX: number | null, locationY: number | null) {
  return isPlaced(locationX, locationY) ? "배치완료" : "미배치";
}

function getModeLabel(editorMode: EditorMode) {
  if (editorMode === "booth") return "부스 편집 모드";
  if (editorMode === "college") return "학과 편집 모드";
  return "보기 모드";
}

function renderCoordinateValue(value: number | null) {
  return value == null ? "-" : value.toFixed(6);
}

export const AdminMapSidebar = ({
  globalError,
  festivalDates,
  selectedDate,
  editorMode,
  statusMessage,
  booths,
  colleges,
  selectedItem,
  selectedBooth,
  selectedCollege,
  onChangeDate,
  onActivateBoothMode,
  onActivateCollegeMode,
  onClearSelection,
  onSelectBooth,
  onSelectCollege,
  onClearBoothLocation,
}: AdminMapSidebarProps) => {
  const [boothSearch, setBoothSearch] = useState("");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [boothFilter, setBoothFilter] = useState<BoothFilter>("all");

  const unplacedBoothCount = useMemo(
    () => booths.filter((booth) => !isPlaced(booth.locationX, booth.locationY)).length,
    [booths],
  );

  const filteredBooths = useMemo(() => {
    const normalizedSearch = boothSearch.trim().toLowerCase();

    return booths.filter((booth) => {
      const matchesSearch = getBoothDisplayName(booth.name)
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesFilter =
        boothFilter === "all" || !isPlaced(booth.locationX, booth.locationY);

      return matchesSearch && matchesFilter;
    });
  }, [boothFilter, boothSearch, booths]);

  const filteredColleges = useMemo(() => {
    const normalizedSearch = collegeSearch.trim().toLowerCase();

    return colleges.filter((college) =>
      college.name.toLowerCase().includes(normalizedSearch),
    );
  }, [collegeSearch, colleges]);

  return (
    <aside className="space-y-4">
      {globalError && (
        <div className="flex items-start gap-2 rounded-2xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-3 text-sm text-[var(--status-danger-text)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.3} />
          <p>{globalError}</p>
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--text)]">운영 날짜</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              선택한 날짜 기준으로 지도 편집 대상을 확인합니다.
            </p>
          </div>
          <span className="rounded-full border border-[var(--border-base)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
            {formatFestivalDateLabel(selectedDate)}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {festivalDates.map((date) => {
            const isSelected = selectedDate === date;

            return (
              <button
                key={date}
                type="button"
                onClick={() => onChangeDate(date)}
                aria-pressed={isSelected}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-semibold transition-colors",
                  isSelected
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--border-base)]",
                )}
              >
                {formatFestivalDateLabel(date)}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-[var(--accent)]" strokeWidth={2.3} />
          <h2 className="text-sm font-bold text-[var(--text)]">편집 대상</h2>
        </div>

        <p className="mt-1 text-xs text-[var(--text-muted)]">
          현재 모드에 맞는 마커만 선택하고 드래그할 수 있습니다.
        </p>

        <div className="mt-4 rounded-2xl bg-[var(--surface-subtle)] p-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={onActivateBoothMode}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                editorMode === "booth"
                  ? "bg-white text-[var(--accent)] shadow-sm"
                  : "text-[var(--text-muted)] hover:bg-white/70",
              )}
            >
              <Tent className="h-4 w-4" strokeWidth={2.3} />
              부스
            </button>
            <button
              type="button"
              onClick={onActivateCollegeMode}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                editorMode === "college"
                  ? "bg-white text-[var(--accent)] shadow-sm"
                  : "text-[var(--text-muted)] hover:bg-white/70",
              )}
            >
              <School className="h-4 w-4" strokeWidth={2.3} />
              학과
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[var(--text)]">{getModeLabel(editorMode)}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                {statusMessage || "왼쪽 목록에서 항목을 선택하면 편집 안내가 여기에 표시됩니다."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearSelection}
              className="shrink-0 rounded-xl border border-[var(--border-base)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-subtle)]"
            >
              선택 해제
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-[var(--text)]">선택된 항목</h2>

        <div className="mt-3 rounded-2xl border border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-4">
          {!selectedBooth && !selectedCollege && (
            <div className="text-center">
              <MapPin className="mx-auto h-5 w-5 text-[var(--text-muted)]" strokeWidth={2.3} />
              <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">
                아직 선택된 항목이 없습니다
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                편집 모드를 선택한 뒤 목록 또는 지도에서 대상을 골라 주세요.
              </p>
            </div>
          )}

          {selectedBooth && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">
                    {getBoothDisplayName(selectedBooth.name)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    유형: {selectedBooth.type}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--border-base)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
                  위치: {getPlacementLabel(selectedBooth.locationX, selectedBooth.locationY)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
                <div className="rounded-xl bg-white px-3 py-2">
                  경도(X): {renderCoordinateValue(selectedBooth.locationX)}
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  위도(Y): {renderCoordinateValue(selectedBooth.locationY)}
                </div>
              </div>

              <button
                type="button"
                onClick={onClearBoothLocation}
                className="inline-flex items-center gap-1 rounded-xl border border-[var(--boothmap-danger-border)] bg-[var(--boothmap-danger-bg)] px-3 py-2 text-xs font-semibold text-[var(--boothmap-danger-text)] transition hover:brightness-95"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                부스 좌표 제거
              </button>
            </div>
          )}

          {selectedCollege && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">{selectedCollege.name}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">학과 위치를 편집 중입니다.</p>
                </div>
                <span className="rounded-full border border-[var(--border-base)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
                  위치: {getPlacementLabel(selectedCollege.locationX, selectedCollege.locationY)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
                <div className="rounded-xl bg-white px-3 py-2">
                  경도(X): {renderCoordinateValue(selectedCollege.locationX)}
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  위도(Y): {renderCoordinateValue(selectedCollege.locationY)}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {editorMode === "booth" && (
        <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">부스 목록</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                부스를 선택한 뒤 지도에서 클릭하거나 마커를 드래그해 위치를 수정합니다.
              </p>
            </div>
            <span className="rounded-full border border-[var(--border-base)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
              총 {filteredBooths.length}개
            </span>
          </div>

          <label className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 py-2">
            <Search className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={2.3} />
            <input
              value={boothSearch}
              onChange={(event) => setBoothSearch(event.target.value)}
              placeholder="부스명 검색"
              className="w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
            />
          </label>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setBoothFilter("all")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                boothFilter === "all"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border-base)] bg-white text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]",
              )}
            >
              전체 {booths.length}
            </button>
            <button
              type="button"
              onClick={() => setBoothFilter("unplaced")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                boothFilter === "unplaced"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border-base)] bg-white text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]",
              )}
            >
              미배치 {unplacedBoothCount}
            </button>
          </div>

          <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1 lg:max-h-[calc(100vh-32rem)]">
            {filteredBooths.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                조건에 맞는 부스가 없습니다.
              </div>
            )}

            {filteredBooths.map((booth) => {
              const isSelected =
                selectedItem?.kind === "booth" && selectedItem.id === booth.id;

              return (
                <button
                  key={booth.id}
                  type="button"
                  onClick={() => onSelectBooth(booth.id)}
                  aria-label={`${getBoothDisplayName(booth.name)} 선택`}
                  className={cn(
                    "w-full rounded-2xl border px-3 py-3 text-left transition-colors",
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/20"
                      : "border-[var(--border-base)] bg-[var(--surface-subtle)] hover:bg-[var(--border-base)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text)]">
                        {getBoothDisplayName(booth.name)}
                      </p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        {booth.type}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                      {getPlacementLabel(booth.locationX, booth.locationY)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {editorMode === "college" && (
        <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">학과 목록</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                학과를 선택한 뒤 지도에서 클릭하거나 마커를 드래그해 위치를 수정합니다.
              </p>
            </div>
            <span className="rounded-full border border-[var(--border-base)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
              총 {filteredColleges.length}개
            </span>
          </div>

          <label className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 py-2">
            <Search className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={2.3} />
            <input
              value={collegeSearch}
              onChange={(event) => setCollegeSearch(event.target.value)}
              placeholder="학과명 검색"
              className="w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
            />
          </label>

          <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1 lg:max-h-[calc(100vh-31rem)]">
            {filteredColleges.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                조건에 맞는 학과가 없습니다.
              </div>
            )}

            {filteredColleges.map((college) => {
              const isSelected =
                selectedItem?.kind === "college" && selectedItem.id === college.id;

              return (
                <button
                  key={college.id}
                  type="button"
                  onClick={() => onSelectCollege(college.id)}
                  aria-label={`${college.name} 선택`}
                  className={cn(
                    "w-full rounded-2xl border px-3 py-3 text-left transition-colors",
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/20"
                      : "border-[var(--border-base)] bg-[var(--surface-subtle)] hover:bg-[var(--border-base)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-[var(--text)]">{college.name}</span>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                      {getPlacementLabel(college.locationX, college.locationY)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {editorMode === "idle" && (
        <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[var(--text)]">편집 안내</h2>
          <div className="mt-3 rounded-2xl border border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-5 text-sm leading-6 text-[var(--text-muted)]">
            1. 운영 날짜를 선택합니다.
            <br />
            2. 부스 또는 학과 편집 모드를 고릅니다.
            <br />
            3. 목록이나 지도에서 대상을 선택합니다.
            <br />
            4. 지도를 클릭하거나 마커를 드래그하면 위치가 자동 저장됩니다.
          </div>
        </section>
      )}
    </aside>
  );
};
