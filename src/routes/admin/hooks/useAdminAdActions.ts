import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  createAdminAd,
  getAdminAdImageUpload,
  setAdminAdsActiveByPlacement,
  type AdvertisementPlacement,
} from "@/api/app/admin/adminApi";
import {
  buildAdPayload,
  createUploadFailureMessage,
  uploadToPresignedUrl,
  validateAdPayload,
  validateImageFile,
} from "@/routes/admin/adminEditorLogic";
import type { AdminConfirmDialogState } from "@/routes/admin/adminConfirmDialog";
import type { AdFormState } from "@/routes/admin/admin-view-model";

type AdminPlacementAd = {
  title: string;
  imageUrl: string;
} | null;

type UseAdminAdActionsParams = {
  homeBottomAd: AdminPlacementAd;
  myTicketAd: AdminPlacementAd;
  reloadAds: () => Promise<void>;
  setGlobalError: (message: string | null) => void;
  openConfirmDialog: (dialogState: AdminConfirmDialogState) => void;
};

export const useAdminAdActions = ({
  homeBottomAd,
  myTicketAd,
  reloadAds,
  setGlobalError,
  openConfirmDialog,
}: UseAdminAdActionsParams) => {
  const [editingAd, setEditingAd] = useState<AdFormState | null>(null);
  const [adImageUploading, setAdImageUploading] = useState(false);

  const openAdEditor = (placement: AdvertisementPlacement) => {
    const currentAd = placement === "HOME_BOTTOM" ? homeBottomAd : myTicketAd;
    setEditingAd({
      title: currentAd?.title ?? "",
      imageUrl: currentAd?.imageUrl ?? "",
      placement,
    });
  };

  const handleDeleteAd = async (placement: AdvertisementPlacement) => {
    const ad = placement === "HOME_BOTTOM" ? homeBottomAd : myTicketAd;
    if (!ad) {
      return;
    }

    openConfirmDialog({
      title: "광고 삭제",
      description: "이 광고를 삭제하시겠습니까?",
      confirmLabel: "삭제",
      onConfirm: async () => {
        try {
          setGlobalError(null);
          await setAdminAdsActiveByPlacement(placement, false);
          await reloadAds();
          toast.success("광고를 삭제했습니다.");
        } catch (error) {
          const message = error instanceof Error ? error.message : "광고 삭제에 실패했습니다.";
          setGlobalError(message);
          toast.error(message);
        }
      },
    });
  };

  const handleSubmitAd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAd) {
      return;
    }

    const payload = buildAdPayload(editingAd);
    const validationMessage = validateAdPayload(payload);

    if (validationMessage) {
      setGlobalError(validationMessage);
      return;
    }

    try {
      setGlobalError(null);
      await createAdminAd(payload);
      setEditingAd(null);
      await reloadAds();
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "광고를 저장하지 못했습니다.");
    }
  };

  const handleUploadAdImage = async (file: File) => {
    if (!editingAd) {
      return;
    }

    const validationMessage = validateImageFile(
      file,
      "이미지 크기는 최대 5MB까지 업로드할 수 있습니다.",
    );

    if (validationMessage) {
      toast.warning(validationMessage);
      return;
    }

    try {
      setAdImageUploading(true);
      setGlobalError(null);

      const uploadMeta = await getAdminAdImageUpload({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      const putRes = await uploadToPresignedUrl(uploadMeta, file);

      if (!putRes.ok) {
        throw new Error(await createUploadFailureMessage("광고 이미지 업로드 실패", putRes));
      }

      setEditingAd((previous) =>
        previous
          ? {
              ...previous,
              imageUrl: uploadMeta.imageUrl,
            }
          : previous,
      );
      toast.success("이미지 업로드가 완료되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setAdImageUploading(false);
    }
  };

  return {
    editingAd,
    setEditingAd,
    adImageUploading,
    openAdEditor,
    handleDeleteAd,
    handleSubmitAd,
    handleUploadAdImage,
  };
};
