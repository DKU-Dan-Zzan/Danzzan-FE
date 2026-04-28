import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Search, Save, Plus, Trash2, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  createAdminPubOperation,
  deleteAdminPubOperation,
  getAdminBoothManagement,
  type AdminBoothManagementBooth,
  type AdminBoothManagementPub,
  type AdminBoothManagementResponse,
  type AdminPubOperation,
  updateAdminBooth,
  updateAdminPub,
  updateAdminPubOperation,
} from "@/api/app/admin/adminBoothApi";
import { AdminShell } from "@/components/layout/AdminShell";
import { cn } from "@/components/common/ui/utils";

const FESTIVAL_DATES = ["2026-05-12", "2026-05-13", "2026-05-14"] as const;
const FILTER_OPTIONS = [
  { value: "ALL", label: "전체" },
  { value: "EXPERIENCE", label: "체험 부스" },
  { value: "FOOD_TRUCK", label: "푸드트럭" },
  { value: "EVENT", label: "이벤트" },
  { value: "FACILITY", label: "편의시설" },
  { value: "PUB", label: "주점" },
] as const;

type AdminBoothFilter = (typeof FILTER_OPTIONS)[number]["value"];
type SelectedManagementItem =
  | { kind: "booth"; id: number }
  | { kind: "pub"; id: number }
  | null;

type BoothFormState = {
  description: string;
  operationStatus: "OPEN" | "CLOSED" | "UNKNOWN";
  startTime: string;
  endTime: string;
};

type PubFormState = {
  intro: string;
  description: string;
  instagram: string;
};

type PubOperationDraft = {
  id: number | null;
  operationDate: string;
  startTime: string;
  endTime: string;
};

type ManagementListItem =
  | {
      kind: "booth";
      id: number;
      type: AdminBoothManagementBooth["type"];
      name: string;
      summary: string;
      collegeName: string;
      department: string;
      operationInfoExists: boolean;
    }
  | {
      kind: "pub";
      id: number;
      type: "PUB";
      name: string;
      summary: string;
      collegeName: string;
      department: string;
      operationInfoExists: boolean;
    };

export default function AdminBoothManagerPanel({
  topSlot,
}: {
  topSlot?: ReactNode;
}) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(FESTIVAL_DATES[0]);
  const [filter, setFilter] = useState<AdminBoothFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [managementData, setManagementData] = useState<AdminBoothManagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedManagementItem>(null);
  const [boothForm, setBoothForm] = useState<BoothFormState | null>(null);
  const [pubForm, setPubForm] = useState<PubFormState | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [pubOperationDraft, setPubOperationDraft] = useState<PubOperationDraft>({
    id: null,
    operationDate: selectedDate,
    startTime: "",
    endTime: "",
  });
  const [savingPubOperation, setSavingPubOperation] = useState(false);

  const loadManagementData = async (date: string) => {
    try {
      setLoading(true);
      setGlobalError(null);
      const response = await getAdminBoothManagement(date);
      setManagementData(response);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Booth 관리 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadManagementData(selectedDate);
  }, [selectedDate]);

  const selectedBooth = useMemo(() => {
    if (selectedItem?.kind !== "booth" || !managementData) {
      return null;
    }

    return managementData.booths.find((booth) => booth.id === selectedItem.id) ?? null;
  }, [managementData, selectedItem]);

  const selectedPub = useMemo(() => {
    if (selectedItem?.kind !== "pub" || !managementData) {
      return null;
    }

    return managementData.pubs.find((pub) => pub.id === selectedItem.id) ?? null;
  }, [managementData, selectedItem]);

  useEffect(() => {
    if (!selectedBooth) {
      setBoothForm(null);
      return;
    }

    setBoothForm({
      description: selectedBooth.description ?? "",
      operationStatus: selectedBooth.operationStatus,
      startTime: selectedBooth.startTime ?? "",
      endTime: selectedBooth.endTime ?? "",
    });
  }, [selectedBooth]);

  useEffect(() => {
    if (!selectedPub) {
      setPubForm(null);
      return;
    }

    setPubForm({
      intro: selectedPub.intro ?? "",
      description: selectedPub.description ?? "",
      instagram: selectedPub.instagram ?? "",
    });
  }, [selectedPub]);

  useEffect(() => {
    setPubOperationDraft((prev) => ({
      ...prev,
      operationDate: prev.id === null ? selectedDate : prev.operationDate,
    }));
  }, [selectedDate]);

  const listItems = useMemo<ManagementListItem[]>(() => {
    if (!managementData) {
      return [];
    }

    const booths: ManagementListItem[] = managementData.booths.map((booth) => ({
      kind: "booth",
      id: booth.id,
      type: booth.type,
      name: booth.name,
      summary: booth.description ?? "",
      collegeName: "-",
      department: "-",
      operationInfoExists: booth.operationInfoExists,
    }));

    const pubs: ManagementListItem[] = managementData.pubs.map((pub) => ({
      kind: "pub",
      id: pub.id,
      type: "PUB",
      name: pub.name,
      summary: pub.intro ?? pub.description ?? "",
      collegeName: pub.collegeName,
      department: pub.department,
      operationInfoExists: pub.operationInfoExists,
    }));

    const collator = new Intl.Collator("ko", { numeric: true, sensitivity: "base" });
    const typeOrder: Record<ManagementListItem["type"], number> = {
      EXPERIENCE: 0,
      FOOD_TRUCK: 1,
      EVENT: 2,
      FACILITY: 3,
      PUB: 4,
    };

    return [...booths, ...pubs].sort((a, b) => {
      const typeCompare = typeOrder[a.type] - typeOrder[b.type];
      if (typeCompare !== 0) {
        return typeCompare;
      }

      return collator.compare(a.name, b.name);
    });
  }, [managementData]);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return listItems.filter((item) => {
      if (filter !== "ALL" && item.type !== filter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack = [
        item.name,
        item.summary,
        item.collegeName,
        item.department,
        item.type,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [filter, listItems, searchTerm]);

  const selectedPubOperation = useMemo(() => {
    if (!managementData) {
      return null;
    }

    return managementData.pubOperations.find((operation) => operation.operationDate === selectedDate) ?? null;
  }, [managementData, selectedDate]);

  const handleSelectItem = (item: ManagementListItem) => {
    setSelectedItem({ kind: item.kind, id: item.id });
  };

  const handleSaveSelectedItem = async () => {
    try {
      setSavingItem(true);
      setGlobalError(null);

      if (selectedBooth && boothForm) {
        await updateAdminBooth(selectedBooth.id, {
          operationDate: selectedDate,
          operationStatus: boothForm.operationStatus,
          description: selectedBooth.type === "FOOD_TRUCK" ? boothForm.description : null,
          startTime: boothForm.startTime || null,
          endTime: boothForm.endTime || null,
        });
        toast.success(`${selectedBooth.name} 저장이 완료되었습니다.`);
      } else if (selectedPub && pubForm) {
        await updateAdminPub(selectedPub.id, {
          intro: pubForm.intro || null,
          description: pubForm.description || null,
          instagram: pubForm.instagram || null,
        });
        toast.success(`${selectedPub.name} 저장이 완료되었습니다.`);
      } else {
        return;
      }

      await loadManagementData(selectedDate);
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setSavingItem(false);
    }
  };

  const resetPubOperationDraft = () => {
    setPubOperationDraft({
      id: null,
      operationDate: selectedDate,
      startTime: "",
      endTime: "",
    });
  };

  const handleSavePubOperation = async () => {
    try {
      setSavingPubOperation(true);
      setGlobalError(null);

      if (pubOperationDraft.id === null) {
        await createAdminPubOperation({
          operationDate: pubOperationDraft.operationDate,
          startTime: pubOperationDraft.startTime,
          endTime: pubOperationDraft.endTime,
        });
        toast.success("주점 공통 운영정보를 추가했습니다.");
      } else {
        await updateAdminPubOperation(pubOperationDraft.id, {
          operationDate: pubOperationDraft.operationDate,
          startTime: pubOperationDraft.startTime,
          endTime: pubOperationDraft.endTime,
        });
        toast.success("주점 공통 운영정보를 수정했습니다.");
      }

      await loadManagementData(selectedDate);
      resetPubOperationDraft();
    } catch (error) {
      const message = error instanceof Error ? error.message : "주점 공통 운영정보 저장에 실패했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setSavingPubOperation(false);
    }
  };

  const handleDeletePubOperation = async (operation: AdminPubOperation) => {
    if (!window.confirm(`${operation.operationDate} 주점 공통 운영정보를 삭제할까요?`)) {
      return;
    }

    try {
      setSavingPubOperation(true);
      setGlobalError(null);
      await deleteAdminPubOperation(operation.id);
      toast.success("주점 공통 운영정보를 삭제했습니다.");
      await loadManagementData(selectedDate);
      if (pubOperationDraft.id === operation.id) {
        resetPubOperationDraft();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "주점 공통 운영정보 삭제에 실패했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setSavingPubOperation(false);
    }
  };

  return (
    <AdminShell
      title="개발자 전용 관리자 페이지"
      eyebrow="DEVELOPER ADMIN"
      headerClassName="sticky top-0 z-20 border-b border-[var(--border-base)] bg-[var(--admin-header-bg)]"
      mainClassName="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-6 py-6"
      actions={
        <>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[var(--border-base)] bg-white px-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-subtle)]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.3} />
            관리자 홈
          </button>

          <button
            type="button"
            onClick={() => void loadManagementData(selectedDate)}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[var(--border-base)] bg-white px-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-subtle)]"
          >
            <RefreshCcw className="h-4 w-4" strokeWidth={2.3} />
            새로고침
          </button>
        </>
      }
    >
      {topSlot}

      {globalError && (
        <div className="rounded-2xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger-text)]">
          {globalError}
        </div>
      )}

      <section className="rounded-3xl border border-[var(--border-base)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {FESTIVAL_DATES.map((date) => (
            <button
              key={date}
              type="button"
              onClick={() => setSelectedDate(date)}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-semibold transition-colors",
                selectedDate === date
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--border-base)]",
              )}
            >
              {date}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === option.value
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--border-base)] bg-white text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="relative block w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="이름, 소개, 단과대, 학과로 검색"
              className="h-10 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] pl-9 pr-4 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
            />
          </label>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-[var(--border-base)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]">관리 대상 목록</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                booth와 pub을 하나의 목록처럼 보되, 내부적으로는 분리해서 처리합니다.
              </p>
            </div>
            <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
              {filteredItems.length}건
            </span>
          </div>

          <div className="mt-4 max-h-[780px] space-y-3 overflow-y-auto pr-1">
            {loading && (
              <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                Booth 관리 데이터를 불러오는 중입니다...
              </div>
            )}

            {!loading && filteredItems.length === 0 && (
              <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                조건에 맞는 관리 대상이 없습니다.
              </div>
            )}

            {!loading &&
              filteredItems.map((item) => {
                const isSelected = selectedItem?.kind === item.kind && selectedItem.id === item.id;
                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-4 text-left transition-colors",
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/15"
                        : "border-[var(--border-base)] bg-white hover:bg-[var(--surface-subtle)]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                            {item.type}
                          </span>
                          <span className="truncate text-sm font-bold text-[var(--text)]">
                            {item.name}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                          {item.summary || "소개/설명 없음"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
                          <span>단과대: {item.collegeName}</span>
                          <span>학과: {item.department}</span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                          item.operationInfoExists
                            ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
                            : "bg-[var(--surface-subtle)] text-[var(--text-muted)]",
                        )}
                      >
                        {item.operationInfoExists ? "운영정보 있음" : "운영정보 없음"}
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--border-base)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">선택한 항목 상세 수정</h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  저장 버튼을 눌렀을 때만 API를 호출합니다.
                </p>
              </div>

              <button
                type="button"
                disabled={savingItem || (!selectedBooth && !selectedPub)}
                onClick={() => void handleSaveSelectedItem()}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Save className="h-4 w-4" strokeWidth={2.3} />
                {savingItem ? "저장 중..." : "저장"}
              </button>
            </div>

            {!selectedBooth && !selectedPub && (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                왼쪽 목록에서 부스 또는 주점을 선택해 주세요.
              </div>
            )}

            {selectedBooth && boothForm && (
              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                      {selectedBooth.type}
                    </span>
                    <h3 className="text-lg font-semibold text-[var(--text)]">{selectedBooth.name}</h3>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    운영정보 기준 날짜: {selectedDate}
                  </p>
                </div>

                {selectedBooth.type === "FOOD_TRUCK" && (
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[var(--text)]">description</span>
                    <textarea
                      rows={5}
                      value={boothForm.description}
                      onChange={(event) =>
                        setBoothForm((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                      }
                      className="w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text)]"
                    />
                  </label>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[var(--text)]">운영 상태</span>
                    <select
                      value={boothForm.operationStatus}
                      onChange={(event) =>
                        setBoothForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                operationStatus: event.target.value as BoothFormState["operationStatus"],
                              }
                            : prev,
                        )
                      }
                      className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text)]"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="CLOSED">CLOSED</option>
                      <option value="UNKNOWN">UNKNOWN</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[var(--text)]">시작 시간</span>
                    <input
                      type="time"
                      value={boothForm.startTime}
                      onChange={(event) =>
                        setBoothForm((prev) => (prev ? { ...prev, startTime: event.target.value } : prev))
                      }
                      className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text)]"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[var(--text)]">종료 시간</span>
                    <input
                      type="time"
                      value={boothForm.endTime}
                      onChange={(event) =>
                        setBoothForm((prev) => (prev ? { ...prev, endTime: event.target.value } : prev))
                      }
                      className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text)]"
                    />
                  </label>
                </div>
              </div>
            )}

            {selectedPub && pubForm && (
              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                      PUB
                    </span>
                    <h3 className="text-lg font-semibold text-[var(--text)]">{selectedPub.name}</h3>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                    <span>단과대: {selectedPub.collegeName}</span>
                    <span>학과: {selectedPub.department}</span>
                  </div>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[var(--text)]">intro</span>
                  <textarea
                    rows={3}
                    value={pubForm.intro}
                    onChange={(event) =>
                      setPubForm((prev) => (prev ? { ...prev, intro: event.target.value } : prev))
                    }
                    className="w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[var(--text)]">description</span>
                  <textarea
                    rows={5}
                    value={pubForm.description}
                    onChange={(event) =>
                      setPubForm((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                    }
                    className="w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[var(--text)]">instagram</span>
                  <input
                    type="text"
                    value={pubForm.instagram}
                    onChange={(event) =>
                      setPubForm((prev) => (prev ? { ...prev, instagram: event.target.value } : prev))
                    }
                    className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text)]"
                  />
                </label>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-[var(--border-base)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">주점 공통 운영정보</h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  pub_operation은 개별 주점이 아니라 전체 주점에 공통 적용되는 운영시간입니다.
                </p>
              </div>

              <button
                type="button"
                onClick={resetPubOperationDraft}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl border border-[var(--border-base)] bg-white px-4 text-sm font-semibold text-[var(--text)]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.3} />
                새 항목
              </button>
            </div>

            {selectedPubOperation && (
              <div className="mt-4 rounded-2xl bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-muted)]">
                현재 선택 날짜({selectedDate}) 운영정보: {selectedPubOperation.startTime} - {selectedPubOperation.endTime}
              </div>
            )}

            <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-3">
                {managementData?.pubOperations.map((operation) => {
                  const isEditing = pubOperationDraft.id === operation.id;
                  return (
                    <div
                      key={operation.id}
                      className={cn(
                        "rounded-2xl border px-4 py-3",
                        isEditing
                          ? "border-[var(--accent)] bg-[var(--accent)]/10"
                          : "border-[var(--border-base)] bg-white",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text)]">{operation.operationDate}</p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {operation.startTime} - {operation.endTime}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPubOperationDraft({
                                id: operation.id,
                                operationDate: operation.operationDate,
                                startTime: operation.startTime,
                                endTime: operation.endTime,
                              })
                            }
                            className="rounded-xl border border-[var(--border-base)] px-3 py-2 text-xs font-semibold text-[var(--text)]"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeletePubOperation(operation)}
                            className="inline-flex items-center gap-1 rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-xs font-semibold text-[var(--status-danger-text)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {managementData && managementData.pubOperations.length === 0 && (
                  <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                    등록된 주점 공통 운영정보가 없습니다.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] p-4">
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  {pubOperationDraft.id === null ? "새 운영정보 추가" : "운영정보 수정"}
                </h3>

                <div className="mt-4 space-y-4">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[var(--text)]">운영 날짜</span>
                    <input
                      type="date"
                      value={pubOperationDraft.operationDate}
                      onChange={(event) =>
                        setPubOperationDraft((prev) => ({ ...prev, operationDate: event.target.value }))
                      }
                      className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-white px-3 text-sm text-[var(--text)]"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[var(--text)]">시작 시간</span>
                    <input
                      type="time"
                      value={pubOperationDraft.startTime}
                      onChange={(event) =>
                        setPubOperationDraft((prev) => ({ ...prev, startTime: event.target.value }))
                      }
                      className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-white px-3 text-sm text-[var(--text)]"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[var(--text)]">종료 시간</span>
                    <input
                      type="time"
                      value={pubOperationDraft.endTime}
                      onChange={(event) =>
                        setPubOperationDraft((prev) => ({ ...prev, endTime: event.target.value }))
                      }
                      className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-white px-3 text-sm text-[var(--text)]"
                    />
                  </label>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    disabled={savingPubOperation}
                    onClick={() => void handleSavePubOperation()}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" strokeWidth={2.3} />
                    {savingPubOperation ? "저장 중..." : "저장"}
                  </button>
                  <button
                    type="button"
                    onClick={resetPubOperationDraft}
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-[var(--border-base)] bg-white px-4 text-sm font-semibold text-[var(--text)]"
                  >
                    초기화
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
