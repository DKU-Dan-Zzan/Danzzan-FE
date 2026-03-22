import { AlertCircle, Map, MapPin, School, Tent, Trash2 } from "lucide-react";
import type { AdminMapBooth, AdminMapCollege } from "@/api/app/admin/adminMapApi";
import { cn } from "@/components/common/ui/utils";
import type { EditorMode, SelectedItem } from "@/routes/admin/adminMapTypes";

type AdminMapSidebarProps = {
  globalError: string | null;
  festivalDates: readonly string[];
  selectedDate: string;
  editorMode: EditorMode;
  statusMessage: string;
  unplacedBooths: AdminMapBooth[];
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

export const AdminMapSidebar = ({
  globalError,
  festivalDates,
  selectedDate,
  editorMode,
  statusMessage,
  unplacedBooths,
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
  return (
    <aside className="space-y-4">
      {globalError && (
        <div className="flex items-start gap-2 rounded-2xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-3 text-sm text-[var(--status-danger-text)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.3} />
          <p>{globalError}</p>
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-[var(--text)]">현재 운영 일차</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          여기서 선택한 날짜는 관리자 지도 편집 기준입니다.
        </p>

        <div className="mt-3 flex gap-2">
          {festivalDates.map((date) => {
            const isSelected = selectedDate === date;

            return (
              <button
                key={date}
                type="button"
                onClick={() => onChangeDate(date)}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-semibold transition-colors",
                  isSelected
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--border-base)]",
                )}
              >
                {date}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-[var(--accent)]" strokeWidth={2.3} />
          <h2 className="text-sm font-bold text-[var(--text)]">편집 도구</h2>
        </div>

        <p className="mt-1 text-xs text-[var(--text-muted)]">
          부스 편집 모드에서는 부스만, 단과대 편집 모드에서는 단과대만 이동할 수 있습니다.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onActivateBoothMode}
            className={cn(
              "flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors",
              editorMode === "booth"
                ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                : "border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--border-base)]",
            )}
          >
            <Tent className="h-4 w-4" strokeWidth={2.3} />
            부스 편집 모드
          </button>

          <button
            type="button"
            onClick={onActivateCollegeMode}
            className={cn(
              "flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors",
              editorMode === "college"
                ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                : "border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--border-base)]",
            )}
          >
            <School className="h-4 w-4" strokeWidth={2.3} />
            단과대 편집 모드
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            className="flex items-center gap-2 rounded-2xl border border-[var(--border-base)] bg-white px-3 py-3 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-subtle)]"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.3} />
            선택 해제
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-[var(--surface-subtle)] px-3 py-3 text-xs leading-5 text-[var(--text-muted)]">
          {statusMessage || "왼쪽 목록에서 항목을 선택하면 편집 안내가 여기에 표시됩니다."}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-[var(--text)]">배치 안 된 부스</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          먼저 선택한 뒤 지도에서 위치를 지정해 주세요.
        </p>

        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {unplacedBooths.length === 0 && (
            <div className="rounded-2xl bg-[var(--surface-subtle)] px-3 py-4 text-center text-sm text-[var(--text-muted)]">
              배치되지 않은 부스가 없습니다.
            </div>
          )}

          {unplacedBooths.map((booth) => {
            const isSelected =
              selectedItem?.kind === "booth" && selectedItem.id === booth.id;

            return (
              <button
                key={booth.id}
                type="button"
                onClick={() => onSelectBooth(booth.id)}
                aria-label={`${booth.name} 선택`}
                className={cn(
                  "w-full rounded-2xl border px-3 py-3 text-left transition-colors",
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/20"
                    : "border-[var(--border-base)] bg-[var(--surface-subtle)] hover:bg-[var(--border-base)]",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[var(--text)]">
                    {booth.name}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                    {booth.type}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-[var(--text)]">단과대 목록</h2>

        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {colleges.map((college) => {
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
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[var(--text)]">
                    {college.name}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                    {college.locationX != null && college.locationY != null ? "배치됨" : "미배치"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-[var(--text)]">선택된 항목 정보</h2>

        <div className="mt-3 rounded-2xl border border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-6">
          {!selectedBooth && !selectedCollege && (
            <div className="text-center">
              <MapPin className="mx-auto h-5 w-5 text-[var(--text-muted)]" strokeWidth={2.3} />
              <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">
                아직 선택된 항목이 없습니다
              </p>
            </div>
          )}

          {selectedBooth && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-[var(--text)]">{selectedBooth.name}</p>
              <p className="text-xs text-[var(--text-muted)]">유형: {selectedBooth.type}</p>
              <p className="text-xs text-[var(--text-muted)]">
                경도(X): {selectedBooth.locationX ?? "-"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                위도(Y): {selectedBooth.locationY ?? "-"}
              </p>

              <button
                type="button"
                onClick={onClearBoothLocation}
                className="mt-2 inline-flex items-center gap-1 rounded-xl border border-[var(--boothmap-danger-border)] bg-[var(--boothmap-danger-bg)] px-3 py-2 text-xs font-semibold text-[var(--boothmap-danger-text)] hover:brightness-95"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                부스 좌표 제거
              </button>
            </div>
          )}

          {selectedCollege && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-[var(--text)]">{selectedCollege.name}</p>
              <p className="text-xs text-[var(--text-muted)]">
                경도(X): {selectedCollege.locationX ?? "-"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                위도(Y): {selectedCollege.locationY ?? "-"}
              </p>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
};
