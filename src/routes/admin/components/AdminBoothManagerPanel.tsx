import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, ImagePlus, Plus, RefreshCcw, Save, Search, Star, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  createAdminBooth,
  createAdminPub,
  createAdminPubOperation,
  deleteAdminPubImage,
  deleteAdminPubOperation,
  getAdminBoothManagement,
  getAdminPubImages,
  hideAdminPub,
  type AdminBoothManagementBooth,
  type AdminBoothManagementResponse,
  type AdminPubImage,
  type AdminPubOperation,
  registerAdminPubImages,
  updateAdminBooth,
  updateAdminPubMainImage,
  updateAdminPub,
  updateAdminPubOperation,
  uploadPubImageDirect,
} from "@/api/app/admin/adminBoothApi";
import { AdminShell } from "@/components/layout/AdminShell";
import { cn } from "@/components/common/ui/utils";
import {
  validateImageFile,
} from "@/routes/admin/adminEditorLogic";
import { formatDescription } from "@/utils/app/boothmap/formatDescription";
import {
  DEFAULT_FESTIVAL_DATE,
  FESTIVAL_DATES,
  formatFestivalDateLabel,
} from "@/utils/app/boothmap/festivalDates";
const FILTER_OPTIONS = [
  { value: "ALL", label: "전체" },
  { value: "EXPERIENCE", label: "체험 부스" },
  { value: "FOOD_TRUCK", label: "푸드트럭" },
  { value: "EVENT", label: "이벤트 부스" },
  { value: "FACILITY", label: "편의시설" },
  { value: "PUB", label: "주점" },
] as const;

type AdminBoothFilter = (typeof FILTER_OPTIONS)[number]["value"];
type SelectedManagementItem =
  | { kind: "booth"; id: number }
  | { kind: "pub"; id: number }
  | null;

type BoothFormState = {
  name: string;
  description: string;
  operationStatus: "OPEN" | "CLOSED" | "UNKNOWN";
  startTime: string;
  endTime: string;
};

type BoothCreateFormState = {
  type: AdminBoothManagementBooth["type"];
  name: string;
  description: string;
  operationStatus: "OPEN" | "CLOSED" | "UNKNOWN";
  startTime: string;
  endTime: string;
  operationDates: string[];
};

type PubFormState = {
  collegeId: string;
  department: string;
  name: string;
  intro: string;
  description: string;
  instagram: string;
  displayOperationIds: number[];
};

type PubOperationDraft = {
  id: number | null;
  operationDate: string;
  startTime: string;
  endTime: string;
};

type PendingPubImage = {
  id: string;
  file: File;
  previewUrl: string;
};

function normalizeMultilineField(value?: string | null) {
  return formatDescription(value).replace(/\r\n/g, "\n");
}

function resolveNewBoothType(filter: AdminBoothFilter): AdminBoothManagementBooth["type"] {
  if (filter === "EXPERIENCE" || filter === "FOOD_TRUCK" || filter === "EVENT" || filter === "FACILITY") {
    return filter;
  }

  return "EXPERIENCE";
}

type ManagementListItem =
  | {
      kind: "booth";
      id: number;
      type: AdminBoothManagementBooth["type"];
      name: string;
      summary: string;
      collegeName: string;
      department: string;
      locationX: number | null;
      locationY: number | null;
      operationInfoExists: boolean;
      displayOperationIds?: number[];
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
      displayOperationIds: number[];
    };

export default function AdminBoothManagerPanel({
  topSlot,
}: {
  topSlot?: ReactNode;
}) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(DEFAULT_FESTIVAL_DATE);
  const [filter, setFilter] = useState<AdminBoothFilter>("ALL");
  const [pubCollegeFilter, setPubCollegeFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [managementData, setManagementData] = useState<AdminBoothManagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedManagementItem>(null);
  const [boothForm, setBoothForm] = useState<BoothFormState | null>(null);
  const [pubForm, setPubForm] = useState<PubFormState | null>(null);
  const [boothCreateForm, setBoothCreateForm] = useState<BoothCreateFormState | null>(null);
  const [creatingBooth, setCreatingBooth] = useState(false);
  const [creatingPub, setCreatingPub] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [pubImages, setPubImages] = useState<AdminPubImage[]>([]);
  const [pubImagesLoading, setPubImagesLoading] = useState(false);
  const [pubImageSubmitting, setPubImageSubmitting] = useState(false);
  const [pendingPubImages, setPendingPubImages] = useState<PendingPubImage[]>([]);
  const [selectedPendingMainId, setSelectedPendingMainId] = useState<string | null>(null);
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
      name: selectedBooth.name,
      description: normalizeMultilineField(selectedBooth.description),
      operationStatus: selectedBooth.operationStatus,
      startTime: selectedBooth.startTime ?? "",
      endTime: selectedBooth.endTime ?? "",
    });
  }, [selectedBooth]);

  useEffect(() => {
    if (!selectedPub) {
      if (!creatingPub) {
        setPubForm(null);
      }
      setPubImages([]);
      return;
    }

    setPubForm({
      collegeId: String(selectedPub.collegeId),
      department: selectedPub.department,
      name: selectedPub.name,
      intro: normalizeMultilineField(selectedPub.intro),
      description: normalizeMultilineField(selectedPub.description),
      instagram: selectedPub.instagram ?? "",
      displayOperationIds: selectedPub.displayOperationIds,
    });
  }, [creatingPub, selectedPub]);

  const clearPendingPubImages = () => {
    setPendingPubImages((previous) => {
      previous.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return [];
    });
    setSelectedPendingMainId(null);
  };

  const loadPubImages = async (pubId: number) => {
    try {
      setPubImagesLoading(true);
      const response = await getAdminPubImages(pubId);
      setPubImages(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "주점 이미지 목록을 불러오지 못했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setPubImagesLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPub) {
      return;
    }

    clearPendingPubImages();
    void loadPubImages(selectedPub.id);
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
      locationX: booth.locationX,
      locationY: booth.locationY,
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
      displayOperationIds: pub.displayOperationIds,
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

  const pubCollegeOptions = useMemo(() => {
    if (!managementData) {
      return [];
    }

    return Array.from(
      new Set(
        managementData.pubs
          .map((pub) => pub.collegeName.trim())
          .filter((collegeName) => collegeName.length > 0),
      ),
    ).sort((left, right) => left.localeCompare(right, "ko"));
  }, [managementData]);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const filtered = listItems.filter((item) => {
      if (filter !== "ALL" && item.type !== filter) {
        return false;
      }

      if (filter === "PUB" && pubCollegeFilter !== "ALL") {
        if (item.type !== "PUB" || item.collegeName !== pubCollegeFilter) {
          return false;
        }
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

    // 주점 카테고리에서는 (단과대 필터 유무와 무관하게) 가나다 순으로 정렬
    if (filter === "PUB") {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    }

    return filtered;
  }, [filter, listItems, pubCollegeFilter, searchTerm]);

  const selectedPubOperation = useMemo(() => {
    if (!managementData) {
      return null;
    }

    return managementData.pubOperations.find((operation) => operation.operationDate === selectedDate) ?? null;
  }, [managementData, selectedDate]);

  const hasMainPubImage = useMemo(() => pubImages.some((image) => image.isMain), [pubImages]);

  const startCreatingPub = () => {
    setCreatingBooth(false);
    setBoothCreateForm(null);
    setCreatingPub(true);
    setSelectedItem(null);
    clearPendingPubImages();
    setPubImages([]);
    setPubForm({
      collegeId: managementData?.colleges[0] ? String(managementData.colleges[0].id) : "",
      department: "",
      name: "",
      intro: "",
      description: "",
      instagram: "",
      displayOperationIds: managementData?.pubOperations.map((operation) => operation.id) ?? [],
    });
  };

  const startCreatingBooth = () => {
    setCreatingPub(false);
    setPubForm(null);
    setCreatingBooth(true);
    setSelectedItem(null);
    clearPendingPubImages();
    setPubImages([]);
    setBoothCreateForm({
      type: resolveNewBoothType(filter),
      name: "",
      description: "",
      operationStatus: "UNKNOWN",
      startTime: "",
      endTime: "",
      operationDates: [selectedDate],
    });
  };

  const handleSelectItem = (item: ManagementListItem) => {
    setCreatingBooth(false);
    setBoothCreateForm(null);
    setCreatingPub(false);
    setSelectedItem({ kind: item.kind, id: item.id });
  };

  const handleSaveSelectedItem = async () => {
    try {
      setSavingItem(true);
      setGlobalError(null);

      if (creatingBooth && boothCreateForm) {
        const trimmedName = boothCreateForm.name.trim();
        const operationDates = FESTIVAL_DATES.filter((date) => boothCreateForm.operationDates.includes(date));

        if (!trimmedName) {
          throw new Error("부스 이름을 입력해 주세요.");
        }
        if (operationDates.length === 0) {
          throw new Error("운영 날짜를 최소 1개 이상 선택해 주세요.");
        }

        const createdBoothId = await createAdminBooth({
          type: boothCreateForm.type,
          name: trimmedName,
          description:
            boothCreateForm.type === "FOOD_TRUCK"
              ? normalizeMultilineField(boothCreateForm.description) || null
              : null,
          operationStatus: boothCreateForm.operationStatus,
          startTime: boothCreateForm.startTime || null,
          endTime: boothCreateForm.endTime || null,
          operationDates,
        });
        toast.success("새 부스를 추가했습니다.");
        await loadManagementData(selectedDate);
        setCreatingBooth(false);
        setBoothCreateForm(null);
        setSelectedItem({ kind: "booth", id: createdBoothId });
      } else if (selectedBooth && boothForm) {
        await updateAdminBooth(selectedBooth.id, {
          operationDate: selectedDate,
          operationStatus: boothForm.operationStatus,
          name: boothForm.name || null,
          description:
            selectedBooth.type === "FOOD_TRUCK"
              ? normalizeMultilineField(boothForm.description)
              : null,
          startTime: boothForm.startTime || null,
          endTime: boothForm.endTime || null,
        });
        toast.success(`${selectedBooth.name} 저장이 완료되었습니다.`);
      } else if (creatingPub && pubForm) {
        const trimmedName = pubForm.name.trim();
        const trimmedDepartment = pubForm.department.trim();
        const collegeIdNumber = Number(pubForm.collegeId);
        if (!trimmedName) {
          throw new Error("주점 이름을 입력해 주세요.");
        }
        if (!trimmedDepartment) {
          throw new Error("학과를 입력해 주세요.");
        }
        if (!pubForm.collegeId || Number.isNaN(collegeIdNumber)) {
          throw new Error("단과대를 선택해 주세요.");
        }

        const dedupedDisplayIds = Array.from(new Set(pubForm.displayOperationIds));
        const createdPubId = await createAdminPub({
          collegeId: collegeIdNumber,
          department: trimmedDepartment,
          name: trimmedName,
          intro: normalizeMultilineField(pubForm.intro) || null,
          description: normalizeMultilineField(pubForm.description) || null,
          instagram: pubForm.instagram || null,
          displayOperationIds: dedupedDisplayIds,
        });
        toast.success("새 주점을 추가했습니다.");
        await loadManagementData(selectedDate);
        setCreatingPub(false);
        setSelectedItem({ kind: "pub", id: createdPubId });
      } else if (selectedPub && pubForm) {
        const dedupedDisplayIds = Array.from(new Set(pubForm.displayOperationIds));
        await updateAdminPub(selectedPub.id, {
          name: pubForm.name || null,
          intro: normalizeMultilineField(pubForm.intro) || null,
          description: normalizeMultilineField(pubForm.description) || null,
          instagram: pubForm.instagram || null,
          displayOperationIds: dedupedDisplayIds,
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

  const handleHidePub = async () => {
    if (!selectedPub) {
      return;
    }

    if (!window.confirm(`${selectedPub.name} 주점을 사용자 화면에서 숨길까요?`)) {
      return;
    }

    try {
      setSavingItem(true);
      setGlobalError(null);
      await hideAdminPub(selectedPub.id);
      toast.success("주점을 숨김 처리했습니다.");
      await loadManagementData(selectedDate);
    } catch (error) {
      const message = error instanceof Error ? error.message : "주점 숨김 처리에 실패했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setSavingItem(false);
    }
  };

  const handlePendingPubImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const validImages: PendingPubImage[] = [];

    for (const file of files) {
      const validationMessage = validateImageFile(file);
      if (validationMessage) {
        toast.warning(validationMessage);
        continue;
      }

      validImages.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (validImages.length === 0) {
      event.target.value = "";
      return;
    }

    setPendingPubImages((previous) => [...previous, ...validImages]);
    setSelectedPendingMainId((previous) => previous ?? validImages[0].id);
    event.target.value = "";
  };

  const handleRemovePendingPubImage = (pendingImageId: string) => {
    setPendingPubImages((previous) => {
      const target = previous.find((image) => image.id === pendingImageId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      const next = previous.filter((image) => image.id !== pendingImageId);
      setSelectedPendingMainId((current) => {
        if (current !== pendingImageId) {
          return current;
        }
        return next[0]?.id ?? null;
      });
      return next;
    });
  };

  const handleRegisterPubImages = async () => {
    if (!selectedPub || pendingPubImages.length === 0) {
      return;
    }

    try {
      setPubImageSubmitting(true);
      setGlobalError(null);

      const uploadedImages: Array<{ id: string; imageUrl: string }> = [];

      for (const pendingImage of pendingPubImages) {
        const result = await uploadPubImageDirect(selectedPub.id, pendingImage.file);

        uploadedImages.push({
          id: pendingImage.id,
          imageUrl: result.imageUrl,
        });
      }

      const selectedMainImageUrl =
        uploadedImages.find((image) => image.id === selectedPendingMainId)?.imageUrl ?? null;

      await registerAdminPubImages(selectedPub.id, {
        imageUrls: uploadedImages.map((image) => image.imageUrl),
        mainImageUrl: selectedMainImageUrl,
      });

      toast.success("주점 이미지를 등록했습니다.");
      clearPendingPubImages();
      await loadPubImages(selectedPub.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "주점 이미지 등록에 실패했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setPubImageSubmitting(false);
    }
  };

  const handleSetMainPubImage = async (imageId: number) => {
    if (!selectedPub) {
      return;
    }

    try {
      setPubImageSubmitting(true);
      setGlobalError(null);
      await updateAdminPubMainImage(selectedPub.id, imageId);
      toast.success("대표 이미지를 변경했습니다.");
      await loadPubImages(selectedPub.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "대표 이미지 변경에 실패했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setPubImageSubmitting(false);
    }
  };

  const handleDeletePubImage = async (imageId: number) => {
    if (!selectedPub) {
      return;
    }

    if (!window.confirm("이 주점 이미지를 삭제할까요?")) {
      return;
    }

    try {
      setPubImageSubmitting(true);
      setGlobalError(null);
      await deleteAdminPubImage(selectedPub.id, imageId);
      toast.success("주점 이미지를 삭제했습니다.");
      await loadPubImages(selectedPub.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "주점 이미지 삭제에 실패했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setPubImageSubmitting(false);
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
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFilter(option.value);
                    if (option.value !== "PUB") {
                      setPubCollegeFilter("ALL");
                    }
                  }}
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

            {filter === "PUB" && pubCollegeOptions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPubCollegeFilter("ALL")}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    pubCollegeFilter === "ALL"
                      ? "bg-[var(--text)] text-white"
                      : "border border-[var(--border-base)] bg-white text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]",
                  )}
                >
                  전체 단과대
                </button>
                {pubCollegeOptions.map((collegeName) => (
                  <button
                    key={collegeName}
                    type="button"
                    onClick={() => setPubCollegeFilter(collegeName)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      pubCollegeFilter === collegeName
                        ? "bg-[var(--text)] text-white"
                        : "border border-[var(--border-base)] bg-white text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]",
                    )}
                  >
                    {collegeName}
                  </button>
                ))}
              </div>
            )}
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

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-6 xl:w-[380px] xl:min-w-[380px] xl:max-w-[380px]">
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
                    aria-label={`${item.name} ${item.kind === "pub" ? "주점" : "부스"} 선택`}
                    onClick={() => handleSelectItem(item)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-4 text-left transition-colors",
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/15"
                        : "border-[var(--border-base)] bg-white hover:bg-[var(--surface-subtle)]",
                    )}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                            {item.type}
                          </span>
                          <span className="truncate text-sm font-bold text-[var(--text)]">
                            {item.name}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-1 pr-2 text-xs leading-5 text-[var(--text-muted)]">
                          {item.summary || "소개/설명 없음"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
                          <span>단과대: {item.collegeName}</span>
                          <span>학과: {item.department}</span>
                          {item.kind === "booth" && (
                            <span>위치: {item.locationX != null && item.locationY != null ? "배치완료" : "미배치"}</span>
                          )}
                        </div>
                      </div>

                      <span
                        className={cn(
                          "shrink-0 self-start whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold",
                          item.kind === "pub" && item.displayOperationIds?.length === 0
                            ? "bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]"
                            : item.operationInfoExists
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
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--border-base)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">선택한 항목 상세 수정</h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  저장 버튼을 눌렀을 때만 API를 호출합니다.
                </p>
              </div>

              {filter === "PUB" && (
                <button
                  type="button"
                  disabled={savingItem || !managementData}
                  onClick={startCreatingPub}
                  className="mr-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl border border-[var(--border-base)] bg-white px-4 text-sm font-semibold text-[var(--text)] disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.3} />
                  새 주점
                </button>
              )}
              {filter !== "PUB" && (
                <button
                  type="button"
                  disabled={savingItem || !managementData}
                  onClick={startCreatingBooth}
                  className="mr-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl border border-[var(--border-base)] bg-white px-4 text-sm font-semibold text-[var(--text)] disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.3} />
                  새 부스
                </button>
              )}
              <button
                type="button"
                disabled={savingItem || (!selectedBooth && !selectedPub && !creatingPub && !creatingBooth)}
                onClick={() => void handleSaveSelectedItem()}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Save className="h-4 w-4" strokeWidth={2.3} />
                {savingItem ? "저장 중..." : "저장"}
              </button>
            </div>

            {!selectedBooth && !selectedPub && !creatingPub && !creatingBooth && (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                왼쪽 목록에서 부스 또는 주점을 선택해 주세요.
              </div>
            )}

            {creatingBooth && boothCreateForm && (
              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                      새 부스
                    </span>
                    <h3 className="text-lg font-semibold text-[var(--text)]">새 부스</h3>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    부스와 선택한 날짜의 운영정보를 함께 생성하며, 위치는 생성 후 관리자 지도에서 배치합니다.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[var(--text)]">type</span>
                    <select
                      value={boothCreateForm.type}
                      onChange={(event) =>
                        setBoothCreateForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                type: event.target.value as BoothCreateFormState["type"],
                              }
                            : prev,
                        )
                      }
                      className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text)]"
                    >
                      <option value="EXPERIENCE">EXPERIENCE</option>
                      <option value="FOOD_TRUCK">FOOD_TRUCK</option>
                      <option value="EVENT">EVENT</option>
                      <option value="FACILITY">FACILITY</option>
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[var(--text)]">name</span>
                    <input
                      type="text"
                      value={boothCreateForm.name}
                      onChange={(event) =>
                        setBoothCreateForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                      }
                      className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text)]"
                    />
                  </label>
                </div>

                {boothCreateForm.type === "FOOD_TRUCK" && (
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[var(--text)]">description</span>
                    <textarea
                      rows={5}
                      value={boothCreateForm.description}
                      onChange={(event) =>
                        setBoothCreateForm((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                      }
                      className="w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text)]"
                    />
                  </label>
                )}

                <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-muted)]">
                  새 부스는 우선 미배치 상태로 생성됩니다. 위치 지정과 이동은 관리자 지도에서 이어서 진행할 수 있습니다.
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[var(--text)]">운영 상태</span>
                    <select
                      value={boothCreateForm.operationStatus}
                      onChange={(event) =>
                        setBoothCreateForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                operationStatus: event.target.value as BoothCreateFormState["operationStatus"],
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
                      value={boothCreateForm.startTime}
                      onChange={(event) =>
                        setBoothCreateForm((prev) => (prev ? { ...prev, startTime: event.target.value } : prev))
                      }
                      className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text)]"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[var(--text)]">종료 시간</span>
                    <input
                      type="time"
                      value={boothCreateForm.endTime}
                      onChange={(event) =>
                        setBoothCreateForm((prev) => (prev ? { ...prev, endTime: event.target.value } : prev))
                      }
                      className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text)]"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[var(--text)]">운영 날짜</span>
                    <span className="text-xs text-[var(--text-muted)]">최소 1개 이상 선택</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {FESTIVAL_DATES.map((date) => {
                      const checked = boothCreateForm.operationDates.includes(date);
                      return (
                        <label
                          key={date}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors",
                            checked
                              ? "border-[var(--accent)] bg-[var(--accent)]/10"
                              : "border-[var(--border-base)] bg-[var(--surface-subtle)]",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setBoothCreateForm((prev) => {
                                if (!prev) {
                                  return prev;
                                }

                                const nextDates = event.target.checked
                                  ? [...prev.operationDates, date]
                                  : prev.operationDates.filter((value) => value !== date);

                                return {
                                  ...prev,
                                  operationDates: FESTIVAL_DATES.filter((festivalDate) =>
                                    Array.from(new Set(nextDates)).includes(festivalDate),
                                  ),
                                };
                              })
                            }
                            className="mt-0.5 h-4 w-4 rounded border-[var(--border-base)] text-[var(--accent)]"
                          />
                          <span className="space-y-1">
                            <span className="block font-semibold text-[var(--text)]">{formatFestivalDateLabel(date)}</span>
                            <span className="block text-xs text-[var(--text-muted)]">{date}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
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

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[var(--text)]">name</span>
                  <input
                    type="text"
                    value={boothForm.name}
                    onChange={(event) =>
                      setBoothForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                    }
                    className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text)]"
                  />
                </label>

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

            {(selectedPub || creatingPub) && pubForm && (
              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                      PUB
                    </span>
                    <h3 className="text-lg font-semibold text-[var(--text)]">{creatingPub ? "새 주점" : selectedPub?.name}</h3>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                    {creatingPub ? (
                      <span>저장 후 이미지 등록과 추가 수정을 이어서 할 수 있습니다.</span>
                    ) : (
                      <>
                        <span>단과대: {selectedPub?.collegeName}</span>
                        <span>학과: {selectedPub?.department}</span>
                      </>
                    )}
                  </div>
                </div>

                {creatingPub && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-[var(--text)]">단과대</span>
                      <select
                        value={pubForm.collegeId}
                        onChange={(event) =>
                          setPubForm((prev) => (prev ? { ...prev, collegeId: event.target.value } : prev))
                        }
                        className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text)]"
                      >
                        <option value="">단과대를 선택해 주세요</option>
                        {(managementData?.colleges ?? []).map((college) => (
                          <option key={college.id} value={college.id}>
                            {college.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-[var(--text)]">학과</span>
                      <input
                        type="text"
                        value={pubForm.department}
                        onChange={(event) =>
                          setPubForm((prev) => (prev ? { ...prev, department: event.target.value } : prev))
                        }
                        placeholder="예: 컴퓨터공학과"
                        className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text)]"
                      />
                    </label>
                  </div>
                )}

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[var(--text)]">name</span>
                  <input
                    type="text"
                    value={pubForm.name}
                    onChange={(event) =>
                      setPubForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                    }
                    className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text)]"
                  />
                </label>

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

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[var(--text)]">표시 일자</span>
                    <span className="text-xs text-[var(--text-muted)]">최소 1개 이상 선택</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {managementData?.pubOperations.map((operation, index) => {
                      const checked = pubForm.displayOperationIds.includes(operation.id);
                      return (
                        <label
                          key={operation.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors",
                            checked
                              ? "border-[var(--accent)] bg-[var(--accent)]/10"
                              : "border-[var(--border-base)] bg-[var(--surface-subtle)]",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setPubForm((prev) => {
                                if (!prev) {
                                  return prev;
                                }

                                const nextIds = event.target.checked
                                  ? [...prev.displayOperationIds, operation.id]
                                  : prev.displayOperationIds.filter((id) => id !== operation.id);

                                return {
                                  ...prev,
                                  displayOperationIds: Array.from(new Set(nextIds)).sort((a, b) => a - b),
                                };
                              })
                            }
                            className="mt-0.5 h-4 w-4 rounded border-[var(--border-base)] text-[var(--accent)]"
                          />
                          <span className="space-y-1">
                            <span className="block font-semibold text-[var(--text)]">{index + 1}일차</span>
                            <span className="block text-xs text-[var(--text-muted)]">
                              {operation.operationDate} / {operation.startTime} - {operation.endTime}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {!creatingPub && selectedPub && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={savingItem || pubForm.displayOperationIds.length === 0}
                      onClick={() => void handleHidePub()}
                      className="inline-flex h-10 items-center justify-center rounded-2xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-4 text-sm font-semibold text-[var(--status-danger-text)] disabled:opacity-60"
                    >
                      숨김 처리
                    </button>
                  </div>
                )}

                {!creatingPub && (
                <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text)]">주점 이미지 관리</h4>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        썸네일 이미지 목록만 관리하며, 대표 이미지는 한 장만 유지됩니다.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-2xl border border-[var(--border-base)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)]">
                        <ImagePlus className="h-4 w-4" strokeWidth={2.3} />
                        이미지 선택
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          multiple
                          onChange={handlePendingPubImagesChange}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        disabled={pubImageSubmitting || pendingPubImages.length === 0}
                        onClick={() => void handleRegisterPubImages()}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" strokeWidth={2.3} />
                        {pubImageSubmitting ? "등록 중..." : "이미지 등록"}
                      </button>
                    </div>
                  </div>

                  {pendingPubImages.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-[var(--text-muted)]">
                          업로드 예정 이미지
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          대표로 쓸 이미지를 한 장 선택하세요.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {pendingPubImages.map((image) => {
                          const isMainCandidate = selectedPendingMainId === image.id;
                          return (
                            <div
                              key={image.id}
                              className={cn(
                                "overflow-hidden rounded-2xl border bg-white",
                                isMainCandidate
                                  ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/15"
                                  : "border-[var(--border-base)]",
                              )}
                            >
                              <div className="relative aspect-[4/3] bg-[var(--surface-subtle)]">
                                <img
                                  src={image.previewUrl}
                                  alt={image.file.name}
                                  className="h-full w-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemovePendingPubImage(image.id)}
                                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
                                >
                                  <X className="h-4 w-4" strokeWidth={2.4} />
                                </button>
                                {isMainCandidate && (
                                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-semibold text-white">
                                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.4} />
                                    대표 예정
                                  </span>
                                )}
                              </div>

                              <div className="space-y-3 p-3">
                                <p className="truncate text-xs font-medium text-[var(--text-muted)]">
                                  {image.file.name}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setSelectedPendingMainId(image.id)}
                                  className={cn(
                                    "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold",
                                    isMainCandidate
                                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                                      : "border-[var(--border-base)] bg-white text-[var(--text)]",
                                  )}
                                >
                                  <Star className="h-3.5 w-3.5 fill-current text-[var(--status-warning)]" strokeWidth={2.3} />
                                  {isMainCandidate ? "대표 이미지 선택됨" : "대표 이미지로 선택"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-[var(--text-muted)]">등록된 이미지</p>
                      {pubImagesLoading && (
                        <p className="text-xs text-[var(--text-muted)]">이미지를 불러오는 중입니다...</p>
                      )}
                    </div>

                    {!pubImagesLoading && pubImages.length > 0 && !hasMainPubImage && (
                      <div className="mb-3 rounded-2xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-4 py-3 text-xs font-semibold text-[var(--status-warning-text)]">
                        대표 이미지가 아직 지정되지 않았습니다. 아래에서 한 장을 대표로 지정해 주세요.
                      </div>
                    )}

                    {!pubImagesLoading && pubImages.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-[var(--border-base)] bg-white px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                        등록된 주점 이미지가 없습니다.
                      </div>
                    )}

                    {pubImages.length > 0 && (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {pubImages.map((image) => (
                          <div
                            key={image.id}
                            className={cn(
                              "overflow-hidden rounded-2xl border bg-white transition-all",
                              image.isMain
                                ? "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] ring-2 ring-[var(--status-warning-border)]/70"
                                : "border-[var(--border-base)]",
                            )}
                          >
                            <div className="relative aspect-[4/3] bg-[var(--surface-subtle)]">
                              <img
                                src={image.imageUrl}
                                alt={`${selectedPub?.name ?? "주점"} 이미지 ${image.id}`}
                                className="h-full w-full object-cover"
                              />
                              {image.isMain && (
                                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-semibold text-white">
                                  <Star className="h-3.5 w-3.5 fill-current text-[var(--status-warning)]" strokeWidth={2.3} />
                                  현재 대표
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 p-3">
                              <p className="truncate text-xs text-[var(--text-muted)]">{image.imageUrl}</p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={pubImageSubmitting || image.isMain}
                                  onClick={() => void handleSetMainPubImage(image.id)}
                                  className={cn(
                                    "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold disabled:opacity-50",
                                    image.isMain
                                      ? "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]"
                                      : "border-[var(--border-base)] bg-white text-[var(--text)]",
                                  )}
                                >
                                  <Star
                                    className={cn(
                                      "h-3.5 w-3.5",
                                      image.isMain && "fill-current text-[var(--status-warning)]",
                                    )}
                                    strokeWidth={2.3}
                                  />
                                  {image.isMain ? "대표 이미지" : "대표로 지정"}
                                </button>
                                <button
                                  type="button"
                                  disabled={pubImageSubmitting}
                                  onClick={() => void handleDeletePubImage(image.id)}
                                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 text-xs font-semibold text-[var(--status-danger-text)] disabled:opacity-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                                  삭제
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                )}
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
