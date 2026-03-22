// 역할: 티켓팅 도메인 라우트와 화면 흐름을 구성하는 모듈입니다.
import { ReservationAlreadyPanel } from "@/components/ticketing/panels/ReservationAlreadyPanel";
import { ReservationProcessingPanel } from "@/components/ticketing/panels/ReservationProcessingPanel";
import { ReservationSoldOutPanel } from "@/components/ticketing/panels/ReservationSoldOutPanel";
import { ReservationSuccessPanel } from "@/components/ticketing/panels/ReservationSuccessPanel";
import { TicketingEventListPanel } from "@/components/ticketing/panels/TicketingEventListPanel";
import { TicketingHomePanel } from "@/components/ticketing/panels/TicketingHomePanel";
import { TicketingReservationPanel } from "@/components/ticketing/panels/TicketingReservationPanel";
import { WaitingRoomPanel } from "@/components/ticketing/panels/WaitingRoomPanel";
import { useTicketingFlow } from "@/routes/ticketing/ticketing/useTicketingFlow";

export default function Ticketing() {
  const flow = useTicketingFlow();

  if (flow.step === "home") {
    return (
      <TicketingHomePanel
        onOpenTicketingList={flow.openList}
        onOpenMyTickets={flow.openMyTickets}
      />
    );
  }

  if (flow.step === "list") {
    return (
      <TicketingEventListPanel
        events={flow.events}
        loading={flow.listLoading}
        errorMessage={flow.listErrorMessage}
        now={flow.now}
        onRefresh={flow.refreshList}
        onSelectEvent={flow.selectEvent}
      />
    );
  }

  if (flow.step === "waiting") {
    return (
      <WaitingRoomPanel
        eventTitle={flow.activeEventTitle}
        queuePosition={flow.waitingQueuePosition}
        queuePositionUpdatedAt={flow.waitingQueuePositionUpdatedAt}
        polling={flow.waitingPolling}
        offline={!flow.isNetworkOnline}
        errorMessage={flow.waitingError}
        ad={flow.waitingAd}
      />
    );
  }

  if (flow.step === "in-progress") {
    return (
      <TicketingReservationPanel
        eventTitle={flow.activeEventTitle}
        agreementChecked={flow.agreementChecked}
        submitting={flow.reserveProcessing}
        errorMessage={flow.reservationError}
        onAgreementCheckedChange={flow.changeAgreement}
        onSubmit={flow.submitReservation}
      />
    );
  }

  if (flow.step === "reserving") {
    return (
      <ReservationProcessingPanel
        processing={flow.reserveProcessing}
        message={flow.reserveMessage}
        errorMessage={flow.reserveErrorMessage}
        onRetry={flow.retryReserve}
        onBackToList={flow.backToList}
      />
    );
  }

  if (flow.step === "soldout") {
    return (
      <ReservationSoldOutPanel
        description={flow.soldOutDescription}
        onBackToList={flow.backToList}
      />
    );
  }

  if (flow.step === "already") {
    return (
      <ReservationAlreadyPanel
        onGoMyTickets={flow.openMyTickets}
        onBackToList={flow.backToList}
      />
    );
  }

  return <ReservationSuccessPanel onGoMyTickets={flow.openMyTickets} />;
}
