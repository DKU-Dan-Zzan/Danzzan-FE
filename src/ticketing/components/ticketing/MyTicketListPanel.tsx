import { Button } from "@/ticketing/components/common/ui/button";
import { Card } from "@/ticketing/components/common/ui/card";
import { TicketCheck } from "lucide-react";
import { PaperTicketCard } from "@/ticketing/components/ticketing/PaperTicketCard";
import { TicketingAdBannerCard } from "@/ticketing/components/ticketing/TicketingAdBannerCard";
import {
  TICKETING_CLASSES,
  TicketingRefreshButton,
} from "@/ticketing/components/ticketing/ticketingShared";
import type { PlacementAd } from "@/ticketing/types/model/ad.model";
import type { Ticket } from "@/ticketing/types/model/ticket.model";

interface StudentSummary {
  studentId: string;
  name: string;
}

interface MyTicketListPanelProps {
  tickets: Ticket[];
  student: StudentSummary;
  loading: boolean;
  errorMessage: string | null;
  ad: PlacementAd | null;
  onRefresh: () => void;
  onGoTicketing: () => void;
}

export function MyTicketListPanel({
  tickets,
  student,
  loading,
  errorMessage,
  ad,
  onRefresh,
  onGoTicketing,
}: MyTicketListPanelProps) {
  const panelClassName = "mx-auto w-full max-w-3xl space-y-2.5 pb-2";

  return (
    <div className={panelClassName}>
      <Card className={`${TICKETING_CLASSES.card.heroInfo} px-3 py-2.5`}>
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex h-6 w-6 shrink-0 ${TICKETING_CLASSES.badge.iconCircle}`}>
            <TicketCheck className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className={`${TICKETING_CLASSES.typography.cardSubtitle} text-[var(--text)]`}>
              단국존 선예매 티켓
            </h2>
            <p className={`mt-1 ${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>
              예매 내역과 팔찌 상태
            </p>
          </div>
          <TicketingRefreshButton
            onClick={onRefresh}
            loading={loading}
            size="sm"
            className="h-9 w-9 rounded-lg border-[var(--border-base)] bg-[var(--surface-subtle)] p-0 text-[var(--text-muted)] hover:bg-[var(--surface-tint-subtle)]"
            iconClassName="h-3.5 w-3.5"
          />
        </div>
      </Card>

      <Card className="rounded-[18px] border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-base)_100%)] px-2.5 py-2 shadow-[0_10px_18px_-16px_var(--shadow-color)]">
        <div className="relative rounded-xl border border-[var(--border-base)] px-2.5 py-2">
          <div className="relative z-10 flex items-center justify-between gap-2">
            <p className="text-[length:var(--ticketing-text-holder-overline)] font-bold tracking-[0.1em] text-[var(--text-muted)]">
              TICKET HOLDER
            </p>
            <p className={`${TICKETING_CLASSES.typography.sectionBodySm} font-semibold text-[var(--text-muted)]`}>티켓 소지자 정보</p>
          </div>

          <div className="relative z-10 mt-1.5 border-t border-[var(--border-subtle)]" />

          <dl className={`relative z-10 mt-1.5 grid grid-cols-[2.1rem_1fr] items-start gap-x-2 gap-y-1.5 ${TICKETING_CLASSES.typography.sectionBodySm}`}>
            <dt className="font-semibold text-[var(--text-muted)]">학번</dt>
            <dd className="font-extrabold tracking-tight text-[var(--accent)] [overflow-wrap:anywhere]">
              {student.studentId}
            </dd>
            <dt className="font-semibold text-[var(--text-muted)]">이름</dt>
            <dd className="font-extrabold tracking-tight text-[var(--text)] [overflow-wrap:anywhere]">
              {student.name}
            </dd>
          </dl>
        </div>
      </Card>

      {tickets.map((ticket) => (
        <PaperTicketCard key={ticket.id} ticket={ticket} />
      ))}

      {errorMessage && (
        <Card className="border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-4">
          <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--status-danger-text)]`}>{errorMessage}</p>
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

      <TicketingAdBannerCard ad={ad} />
    </div>
  );
}
