import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { readQueueEventIdFromSearch } from "@/hooks/ticketing/queue/flow-utils";
import type {
  SetNullableStringState,
  SetStringState,
  SetTicketingStepState,
} from "@/routes/ticketing/ticketing/flow/types";

type UseQueueUrlSyncParams = {
  activeEventId: string | null;
  setActiveEventId: SetNullableStringState;
  setActiveEventTitle: SetStringState;
  setListNotice: SetNullableStringState;
  setStep: SetTicketingStepState;
  resetQueueFlowState: () => void;
  clearError: () => void;
};

export const useQueueUrlSync = ({
  activeEventId,
  setActiveEventId,
  setActiveEventTitle,
  setListNotice,
  setStep,
  resetQueueFlowState,
  clearError,
}: UseQueueUrlSyncParams) => {
  const location = useLocation();
  const navigate = useNavigate();

  const queueEventFromSearch = useMemo(
    () => readQueueEventIdFromSearch(location.search),
    [location.search],
  );

  const applyQueueEventToUrl = useCallback((eventId: string | null) => {
    const params = new URLSearchParams(location.search);
    if (eventId) {
      params.set("eventId", eventId);
    } else {
      params.delete("eventId");
    }

    const nextSearch = params.toString();
    const currentSearch = location.search.startsWith("?")
      ? location.search.slice(1)
      : location.search;
    if (nextSearch === currentSearch) {
      return;
    }

    navigate(
      {
        pathname: "/ticket/ticketing",
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [location.search, navigate]);

  useEffect(() => {
    if (activeEventId === queueEventFromSearch) {
      return;
    }
    setActiveEventId(queueEventFromSearch);
  }, [activeEventId, queueEventFromSearch, setActiveEventId]);

  useEffect(() => {
    const state = location.state as { resetToHome?: number } | null;
    if (!state?.resetToHome) {
      return;
    }

    resetQueueFlowState();
    setActiveEventId(null);
    setActiveEventTitle("");
    setListNotice(null);
    setStep("home");
    clearError();
    applyQueueEventToUrl(null);
  }, [
    applyQueueEventToUrl,
    clearError,
    location.state,
    resetQueueFlowState,
    setActiveEventId,
    setActiveEventTitle,
    setListNotice,
    setStep,
  ]);

  return {
    applyQueueEventToUrl,
    queueEventFromSearch,
  };
};
