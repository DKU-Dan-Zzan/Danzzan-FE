import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ReservationSoldOutPanel } from "@/components/ticketing/ReservationSoldOutPanel";
import { ReservationSuccessPanel } from "@/components/ticketing/ReservationSuccessPanel";
import { TicketingEventListPanel } from "@/components/ticketing/TicketingEventListPanel";
import { TicketingHomePanel } from "@/components/ticketing/TicketingHomePanel";
import { TicketingReservationPanel } from "@/components/ticketing/TicketingReservationPanel";
import { REQUIRED_ACKNOWLEDGEMENT_CODE } from "@/components/ticketing/ticketingConstants";
import { useTicketing } from "@/hooks/useTicketing";
import type { TicketingEvent } from "@/types/model/ticket.model";

type TicketingStep = "home" | "list" | "in-progress" | "soldout" | "success";

export default function Ticketing() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loading,
    reservationLoading,
    error,
    clearError,
    getTicketingEvents,
    reserveTicket,
  } = useTicketing();

  const [step, setStep] = useState<TicketingStep>("home");
  const [events, setEvents] = useState<TicketingEvent[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [selectedEvent, setSelectedEvent] = useState<TicketingEvent | null>(null);
  const [agreementInput, setAgreementInput] = useState("");
  const [reservationError, setReservationError] = useState<string | null>(null);

  const loadEvents = useCallback(async (): Promise<TicketingEvent[]> => {
    const fetched = await getTicketingEvents();
    setEvents(fetched);
    return fetched;
  }, [getTicketingEvents]);

  useEffect(() => {
    if (step !== "list") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [step]);

  const resetReservationState = useCallback(() => {
    setSelectedEvent(null);
    setAgreementInput("");
    setReservationError(null);
  }, []);

  useEffect(() => {
    const state = location.state as { resetToHome?: number } | null;
    if (!state?.resetToHome) {
      return;
    }

    clearError();
    resetReservationState();
    setStep("home");
  }, [location.state, clearError, resetReservationState]);

  const moveToList = useCallback(async () => {
    clearError();
    setStep("list");
    await loadEvents();
  }, [clearError, loadEvents]);

  const handleOpenList = () => {
    void moveToList();
  };

  const handleRefreshList = () => {
    void loadEvents();
  };

  const handleStartReservation = (event: TicketingEvent) => {
    clearError();
    setSelectedEvent(event);
    setAgreementInput("");
    setReservationError(null);
    setStep("in-progress");
  };

  const handleAgreementInputChange = (value: string) => {
    setAgreementInput(value);
    if (reservationError) {
      setReservationError(null);
    }
  };

  const handleSubmitReservation = async () => {
    if (!selectedEvent) {
      return;
    }

    if (!agreementInput.trim()) {
      setReservationError("확인 코드를 입력해주세요.");
      return;
    }

    if (agreementInput.trim() !== REQUIRED_ACKNOWLEDGEMENT_CODE) {
      setReservationError(`"${REQUIRED_ACKNOWLEDGEMENT_CODE}" 코드를 정확히 입력해주세요.`);
      return;
    }

    setReservationError(null);
    clearError();

    const reservation = await reserveTicket(selectedEvent.id, REQUIRED_ACKNOWLEDGEMENT_CODE);
    if (!reservation) {
      const refreshedEvents = await loadEvents();
      const latestEvent = refreshedEvents.find((event) => event.id === selectedEvent.id);
      const isSoldOutNow =
        latestEvent?.status === "soldout" ||
        (typeof latestEvent?.remainingCount === "number" && latestEvent.remainingCount <= 0) ||
        selectedEvent.status === "soldout" ||
        (typeof selectedEvent.remainingCount === "number" && selectedEvent.remainingCount <= 0);

      if (isSoldOutNow) {
        setReservationError(null);
        setStep("soldout");
        return;
      }

      setReservationError("예매에 실패했습니다. 다시 시도해주세요.");
      return;
    }

    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== selectedEvent.id) {
          return event;
        }

        if (event.remainingCount === null) {
          return event;
        }

        return {
          ...event,
          remainingCount: Math.max(event.remainingCount - 1, 0),
        };
      }),
    );
    setStep("success");
  };

  if (step === "home") {
    return (
      <TicketingHomePanel
        onOpenTicketingList={handleOpenList}
        onOpenMyTickets={() => navigate("/myticket")}
      />
    );
  }

  if (step === "list") {
    return (
      <TicketingEventListPanel
        events={events}
        loading={loading}
        errorMessage={error?.message ?? null}
        now={now}
        onRefresh={handleRefreshList}
        onSelectEvent={handleStartReservation}
      />
    );
  }

  if (step === "in-progress") {
    return (
      <TicketingReservationPanel
        eventTitle={selectedEvent?.title ?? ""}
        agreementInput={agreementInput}
        submitting={reservationLoading}
        errorMessage={reservationError}
        onAgreementInputChange={handleAgreementInputChange}
        onSubmit={handleSubmitReservation}
      />
    );
  }

  if (step === "soldout") {
    return (
      <ReservationSoldOutPanel
        onBackToList={() => {
          resetReservationState();
          void moveToList();
        }}
      />
    );
  }

  return (
    <ReservationSuccessPanel
      onGoMyTickets={() => navigate("/myticket")}
    />
  );
}
