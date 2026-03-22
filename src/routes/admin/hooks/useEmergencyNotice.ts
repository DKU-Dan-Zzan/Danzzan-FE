import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getEmergencyAdminNotice,
  updateEmergencyAdminNotice,
} from "@/api/app/admin/adminApi";
import { appQueryKeys, useAppQuery } from "@/lib/query";
import { buildEmergencyPayload } from "@/routes/admin/adminEditorLogic";

type UseEmergencyNoticeParams = {
  setGlobalError: (message: string | null) => void;
};

export const useEmergencyNotice = ({ setGlobalError }: UseEmergencyNoticeParams) => {
  const [emergencyMessage, setEmergencyMessage] = useState("");
  const [emergencyActive, setEmergencyActive] = useState(true);
  const [emergencySaving, setEmergencySaving] = useState(false);

  const emergencyQuery = useAppQuery({
    queryKey: appQueryKeys.adminEmergencyNotice(),
    queryFn: ({ signal }) => getEmergencyAdminNotice({ signal }),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!emergencyQuery.data) {
      return;
    }
    setEmergencyMessage(emergencyQuery.data.message ?? "");
    setEmergencyActive(Boolean(emergencyQuery.data.isActive));
  }, [emergencyQuery.data]);

  useEffect(() => {
    if (!emergencyQuery.error) {
      return;
    }
    setGlobalError(emergencyQuery.error.message || "긴급 공지를 불러오지 못했습니다.");
  }, [emergencyQuery.error, setGlobalError]);

  const handleSaveEmergency = useCallback(async () => {
    try {
      setGlobalError(null);
      setEmergencySaving(true);
      await updateEmergencyAdminNotice(buildEmergencyPayload(emergencyMessage, emergencyActive));
      await emergencyQuery.refetch();
      toast.success("긴급 공지를 저장했습니다.");
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "긴급 공지를 저장하지 못했습니다.");
    } finally {
      setEmergencySaving(false);
    }
  }, [emergencyActive, emergencyMessage, emergencyQuery, setGlobalError]);

  return {
    emergencyMessage,
    setEmergencyMessage,
    emergencyActive,
    setEmergencyActive,
    emergencyLoading: emergencyQuery.isPending || emergencyQuery.isFetching || emergencySaving,
    handleSaveEmergency,
  };
};
