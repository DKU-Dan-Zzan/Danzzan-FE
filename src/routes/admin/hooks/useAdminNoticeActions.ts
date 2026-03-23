// 역할: 관리자 공지 생성·수정·보관·핀순서 액션과 업로드 흐름을 캡슐화합니다.
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  createAdminNotice,
  deleteAdminNotice,
  getNoticeImagePresign,
  restoreAdminNotice,
  type NoticeResponse,
  type NoticeStatusFilter,
  updateAdminNotice,
  updateNoticeDisplayOrder,
} from "@/api/app/admin/adminApi";
import {
  MAX_NOTICE_IMAGE_COUNT,
  buildNoticePayload,
  createEmptyNoticeForm,
  createNoticeEditForm,
  createUploadFailureMessage,
  uploadToPresignedUrl,
  validateImageFile,
  validateNoticePayload,
} from "@/routes/admin/adminEditorLogic";
import type { AdminConfirmDialogState } from "@/routes/admin/adminConfirmDialog";
import type { NoticeFormState } from "@/routes/admin/admin-view-model";

type UseAdminNoticeActionsParams = {
  notices: NoticeResponse[];
  noticeStatus: NoticeStatusFilter;
  noticePage: number;
  reloadNotices: (page?: number, keyword?: string, status?: NoticeStatusFilter) => Promise<void>;
  setGlobalError: (message: string | null) => void;
  openConfirmDialog: (dialogState: AdminConfirmDialogState) => void;
};

export const useAdminNoticeActions = ({
  notices,
  noticeStatus,
  noticePage,
  reloadNotices,
  setGlobalError,
  openConfirmDialog,
}: UseAdminNoticeActionsParams) => {
  const [editingNotice, setEditingNotice] = useState<NoticeFormState | null>(null);
  const [pinReorderMode, setPinReorderMode] = useState(false);
  const [pinReorderList, setPinReorderList] = useState<NoticeResponse[]>([]);
  const [pinSaving, setPinSaving] = useState(false);
  const [noticeImageUploading, setNoticeImageUploading] = useState(false);

  const noticePinned = useMemo(
    () =>
      noticeStatus === "DELETED"
        ? []
        : notices.filter((notice) => (notice.isPinned ?? notice.isEmergency) === true),
    [notices, noticeStatus],
  );

  const noticeOthers = useMemo(
    () =>
      noticeStatus === "DELETED"
        ? notices
        : notices.filter((notice) => !(notice.isPinned ?? notice.isEmergency)),
    [notices, noticeStatus],
  );

  const effectivePinned = pinReorderMode ? pinReorderList : noticePinned;

  const openNewNotice = () => {
    setEditingNotice(createEmptyNoticeForm());
  };

  const openEditNotice = (notice: NoticeResponse) => {
    setEditingNotice(createNoticeEditForm(notice));
  };

  const handleSubmitNotice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingNotice) {
      return;
    }

    const payload = buildNoticePayload(editingNotice);
    const validationMessage = validateNoticePayload(payload);

    if (validationMessage) {
      setGlobalError(validationMessage);
      return;
    }

    try {
      setGlobalError(null);
      if (editingNotice.id) {
        await updateAdminNotice(editingNotice.id, payload);
      } else {
        await createAdminNotice(payload);
      }
      setEditingNotice(null);
      await reloadNotices(noticePage);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "공지를 저장하지 못했습니다.");
    }
  };

  const handleUploadNoticeImages = async (files: FileList) => {
    if (!editingNotice) {
      return;
    }

    const currentCount = editingNotice.images.length;
    const incomingFiles = Array.from(files);
    const remainingSlots = MAX_NOTICE_IMAGE_COUNT - currentCount;

    if (remainingSlots <= 0) {
      toast.warning(`이미지는 최대 ${MAX_NOTICE_IMAGE_COUNT}개까지 업로드할 수 있습니다.`);
      return;
    }

    const limitedFiles = incomingFiles.slice(0, remainingSlots);

    try {
      setNoticeImageUploading(true);

      for (const file of limitedFiles) {
        const validationMessage = validateImageFile(
          file,
          `"${file.name}" 파일이 5MB를 초과하여 업로드할 수 없습니다.`,
        );
        if (validationMessage) {
          toast.warning(validationMessage);
          continue;
        }

        const presign = await getNoticeImagePresign({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        });

        if (import.meta.env.DEV) {
          console.log("[notice presign]", presign);
        }

        if (!presign.presignedUrl) {
          console.error("[notice presign] presignedUrl is undefined", presign);
          throw new Error("presignedUrl이 비어 있습니다. presign API 응답을 확인해 주세요.");
        }

        const putRes = await uploadToPresignedUrl(presign, file);

        if (!putRes.ok) {
          throw new Error(await createUploadFailureMessage("S3 업로드 실패", putRes));
        }

        const url = presign.imageUrl ?? presign.fileUrl;
        setEditingNotice((previous) =>
          previous
            ? {
                ...previous,
                images: [...previous.images, url],
              }
            : previous,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setNoticeImageUploading(false);
    }
  };

  const handleArchiveNotice = async (id: number) => {
    openConfirmDialog({
      title: "공지 보관함 이동",
      description: "이 공지는 학생용 앱 공지에서 숨김 처리되고, 보관함에서 다시 복원할 수 있습니다.",
      confirmLabel: "보관함 이동",
      onConfirm: async () => {
        try {
          setGlobalError(null);
          await deleteAdminNotice(id);
          await reloadNotices(noticePage);
          toast.success("공지를 보관함으로 이동했습니다.");
        } catch (error) {
          const message = error instanceof Error ? error.message : "공지를 보관함으로 이동하지 못했습니다.";
          setGlobalError(message);
          toast.error(message);
        }
      },
    });
  };

  const handleRestoreNotice = async (id: number) => {
    openConfirmDialog({
      title: "공지 복원",
      description: "이 공지를 보관함에서 꺼내 학생용 앱 공지에 다시 노출할까요?",
      confirmLabel: "복원",
      onConfirm: async () => {
        try {
          setGlobalError(null);
          await restoreAdminNotice(id);
          await reloadNotices(noticePage);
          toast.success("공지를 앱 공지로 복원했습니다.");
        } catch (error) {
          const message = error instanceof Error ? error.message : "공지를 복원하지 못했습니다.";
          setGlobalError(message);
          toast.error(message);
        }
      },
    });
  };

  const startPinReorder = () => {
    if (noticePinned.length === 0) {
      toast.info("핀 공지가 없습니다.");
      return;
    }
    setPinReorderList(noticePinned);
    setPinReorderMode(true);
  };

  const cancelPinReorder = () => {
    setPinReorderMode(false);
    setPinReorderList([]);
  };

  const movePinnedItem = (index: number, direction: "up" | "down") => {
    setPinReorderList((previous) => {
      const next = [...previous];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) {
        return previous;
      }
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleSavePinOrder = async () => {
    if (pinReorderList.length === 0) {
      setPinReorderMode(false);
      return;
    }

    try {
      setPinSaving(true);
      await updateNoticeDisplayOrder({
        orders: pinReorderList.map((notice, index) => ({
          id: notice.id,
          displayOrder: index + 1,
        })),
      });
      setPinReorderMode(false);
      setPinReorderList([]);
      await reloadNotices(noticePage);
      toast.success("핀 공지 순서를 저장했습니다.");
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : "핀 공지 순서를 저장하지 못했습니다.",
      );
    } finally {
      setPinSaving(false);
    }
  };

  return {
    editingNotice,
    setEditingNotice,
    noticePinned,
    noticeOthers,
    effectivePinned,
    pinReorderMode,
    pinSaving,
    noticeImageUploading,
    openNewNotice,
    openEditNotice,
    handleSubmitNotice,
    handleUploadNoticeImages,
    handleArchiveNotice,
    handleRestoreNotice,
    startPinReorder,
    cancelPinReorder,
    movePinnedItem,
    handleSavePinOrder,
  };
};
