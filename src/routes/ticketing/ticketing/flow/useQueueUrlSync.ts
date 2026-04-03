// 역할: 대기열 eventId를 URL 쿼리와 동기화하고 reset 내비게이션을 처리합니다.
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ticketApi } from "@/api/ticketing/ticketApi";
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
  setActiveEventDate: SetStringState;
  setListNotice: SetNullableStringState;
  setStep: SetTicketingStepState;
  resetQueueFlowState: () => void;
  clearError: () => void;
};

export const useQueueUrlSync = ({
  activeEventId,
  setActiveEventId,
  setActiveEventTitle,
  setActiveEventDate,
  setListNotice,
  setStep,
  resetQueueFlowState,
  clearError,
}: UseQueueUrlSyncParams) => {
  const location = useLocation();
  const navigate = useNavigate();
  const processedResetTokenRef = useRef<number | null>(null);

  const queueEventFromSearch = useMemo(
    () => readQueueEventIdFromSearch(location.search),
    [location.search],
  );

  const applyQueueEventToUrl = useCallback((eventId: string | null) => {
    const params = new URLSearchParams(location.search);
    if (eventId) {
      params.set("eventId", eventId);
      params.delete("list");
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
    // 같은 토큰은 1회만 처리 — effect 재발동 시 중복 리셋 방지
    if (processedResetTokenRef.current === state.resetToHome) {
      return;
    }
    processedResetTokenRef.current = state.resetToHome;

    // 서버 queue 상태 정리 — fire-and-forget (실패해도 UI reset은 진행)
    if (activeEventId) {
      ticketApi.leaveQueue(activeEventId).catch(() => {});
    }

    resetQueueFlowState();
    setActiveEventId(null);
    setActiveEventTitle("");
    setActiveEventDate("");
    setListNotice(null);
    setStep("home");
    clearError();
    applyQueueEventToUrl(null);
    // history state에서 resetToHome 신호 제거 — 재렌더 시 재발동 원천 차단
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  }, [
    activeEventId,
    applyQueueEventToUrl,
    clearError,
    location.pathname,
    location.search,
    location.state,
    navigate,
    resetQueueFlowState,
    setActiveEventId,
    setActiveEventDate,
    setActiveEventTitle,
    setListNotice,
    setStep,
  ]);

  return {
    applyQueueEventToUrl,
    queueEventFromSearch,
  };
};
