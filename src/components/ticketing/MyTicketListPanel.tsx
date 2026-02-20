import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { TicketCheck } from "lucide-react";
import { PaperTicketCard } from "@/components/ticketing/PaperTicketCard";
import {
  TICKETING_CLASSES,
  TICKETING_WIDE_PANEL_CLASS,
  TicketingRefreshButton,
} from "@/components/ticketing/ticketingShared";
import type { Ticket } from "@/types/model/ticket.model";

interface StudentSummary {
  studentId: string;
  name: string;
}

interface MyTicketListPanelProps {
  tickets: Ticket[];
  student: StudentSummary;
  loading: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
  onGoTicketing: () => void;
}

export function MyTicketListPanel({
  tickets,
  student,
  loading,
  errorMessage,
  onRefresh,
  onGoTicketing,
}: MyTicketListPanelProps) {
  return (
    <div className={TICKETING_WIDE_PANEL_CLASS}>
      <Card className={`${TICKETING_CLASSES.card.heroInfo} px-4 py-4`}>
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 ${TICKETING_CLASSES.badge.iconCircle}`}>
            <TicketCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className={`${TICKETING_CLASSES.typography.infoBannerTitle} text-[var(--text)]`}>
              단국존 선예매 티켓
            </h2>
            <p className={`mt-1 ${TICKETING_CLASSES.typography.infoBannerBody} text-[var(--text-muted)]`}>
              예매 내역과 현재 팔찌 수령 상태를 확인하세요.
            </p>
          </div>
          <TicketingRefreshButton
            onClick={onRefresh}
            loading={loading}
            size="lg"
          />
        </div>
      </Card>

      <Card className={`${TICKETING_CLASSES.card.summaryInfo} px-4 py-3`}>
        <div className="flex items-start">
          <div className="min-w-0">
            <p className={`${TICKETING_CLASSES.typography.sectionTitle} text-[var(--text-muted)]`}>티켓 소지자 정보</p>
            <div className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 ${TICKETING_CLASSES.typography.sectionBodySm} leading-none`}>
              <p className="font-semibold text-[var(--text-muted)]">
                학번
                <span className="ml-1 font-extrabold tracking-tight text-[var(--accent)]">
                  {student.studentId}
                </span>
              </p>
              <p className="font-semibold text-[var(--text-muted)]">
                이름
                <span className="ml-1 font-extrabold tracking-tight text-[var(--text)]">{student.name}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {tickets.map((ticket) => (
        <PaperTicketCard key={ticket.id} ticket={ticket} />
      ))}

      {errorMessage && (
        <Card className="border-red-200 bg-red-50 p-4">
          <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-red-700`}>{errorMessage}</p>
        </Card>
      )}

      {loading && tickets.length === 0 && (
        <Card className={`${TICKETING_CLASSES.card.emptyState} p-6`}>
          <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>티켓을 불러오는 중입니다...</p>
        </Card>
      )}

      {!loading && tickets.length === 0 && (
        <Card className={`${TICKETING_CLASSES.card.emptyState} p-8 text-center`}>
          <p className={`${TICKETING_CLASSES.typography.cardSubtitle} text-[var(--text)]`}>
            아직 예매한 티켓이 없습니다.
          </p>
          <p className={`mt-1 ${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>
            티켓팅 페이지에서 진행 중인 공연을 확인하세요.
          </p>
          <Button
            className={`mt-4 ${TICKETING_CLASSES.button.primaryFull}`}
            onClick={onGoTicketing}
          >
            티켓팅 하러가기
          </Button>
        </Card>
      )}
    </div>
  );
}
