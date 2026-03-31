// 역할: 종이 티켓 스타일 카드의 시각 표현과 상태별 배지/정보 표시를 담당합니다.
import { Card } from "@/components/common/ui/card";
import { cn } from "@/components/common/ui/utils";
import { APP_CARD_VARIANTS } from "@/components/common/ui/appCardVariants";
import { resolveTicketDayLabel } from "@/lib/ticketing/festivalDay";
import type { Ticket } from "@/types/ticketing/model/ticket.model";

interface PaperTicketCardProps {
  ticket: Ticket;
}

const statusDisplayMap: Record<
  Ticket["status"],
  { label: string; badgeClassName: string }
> = {
  issued: {
    label: "팔찌 미수령 상태",
    badgeClassName:
      "border-[var(--status-pending-border)] bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  },
  used: {
    label: "팔찌 수령 완료",
    badgeClassName:
      "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
  },
  cancelled: {
    label: "예매 취소",
    badgeClassName:
      "border-[var(--border-base)] bg-[linear-gradient(180deg,var(--surface-base)_0%,var(--ticket-paper-top)_100%)] text-[var(--text-muted)]",
  },
  unknown: {
    label: "상태 확인 필요",
    badgeClassName:
      "border-[var(--border-strong)] bg-[linear-gradient(180deg,var(--surface-tint-strong)_0%,var(--ticket-paper-top)_100%)] text-[var(--accent)]",
  },
};

const stripTimeFromEventDate = (value: string): string => {
  return value.replace(/\s+\d{1,2}:\d{2}.*$/, "").trim();
};

const toCompactEventDate = (value: string): string => {
  const normalized = stripTimeFromEventDate(value);
  const monthDayKorean = normalized.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (monthDayKorean) {
    return `${Number(monthDayKorean[1])}/${Number(monthDayKorean[2])}`;
  }

  const isoLike = normalized.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (isoLike) {
    return `${Number(isoLike[2])}/${Number(isoLike[3])}`;
  }

  return normalized;
};

const getGuideLines = (
  ticket: Ticket,
): {
  dayLabel: string;
  dateLabel: string;
  queueLabel: string;
  wristbandValue: string;
} => {
  const dateLabel = ticket.eventDate ? toCompactEventDate(ticket.eventDate) : "미정";
  const dayLabel = resolveTicketDayLabel({
    eventDate: ticket.eventDate,
    eventName: ticket.eventName,
  });
  const queueLabel = ticket.queueNumber != null
    ? String(ticket.queueNumber)
    : ticket.id.slice(-4).toUpperCase();

  return {
    dayLabel,
    dateLabel,
    queueLabel,
    wristbandValue: "10:00~",
  };
};

const PAPER_SURFACE_STYLE = {
  backgroundImage:
    "linear-gradient(90deg, var(--card-grad-white-start) 0%, var(--card-grad-white-mid) 42%, var(--card-grad-white-end) 100%)",
} as const;

export function PaperTicketCard({ ticket }: PaperTicketCardProps) {
  const status = statusDisplayMap[ticket.status];
  const { dayLabel, dateLabel, queueLabel, wristbandValue } =
    getGuideLines(ticket);

  return (
    <Card className={`relative overflow-hidden ${APP_CARD_VARIANTS.gradWhite} !rounded-[24px] px-0 py-0`}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={PAPER_SURFACE_STYLE}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-4 bottom-4 left-[70%] z-10 border-l border-dashed border-[var(--ticket-perf)] opacity-90"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[70%] top-0 z-20 h-[2px] w-6 -translate-x-1/2 bg-[var(--bg-base)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[70%] bottom-0 z-20 h-[2px] w-6 -translate-x-1/2 bg-[var(--bg-base)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[70%] top-0 z-20 h-[10px] w-5 -translate-x-1/2 rounded-b-full border-x border-b border-[var(--card-grad-white-border)] bg-[var(--bg-base)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[70%] bottom-0 z-20 h-[10px] w-5 -translate-x-1/2 rounded-t-full border-x border-t border-[var(--card-grad-white-border)] bg-[var(--bg-base)]"
      />

      <div className="relative z-20 px-6 py-4">
        <div className="grid grid-cols-[minmax(0,21fr)_minmax(0,9fr)] items-start">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <p className="truncate text-[length:var(--ticketing-text-overline)] font-bold tracking-[0.1em] text-[var(--text-muted)]">
                DANKOOK ZONE TICKET
              </p>
            </div>
            <p className="mt-2 text-[2.35rem] leading-none font-semibold tracking-[-0.02em] text-[var(--accent)]">
              {dayLabel}
            </p>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full border px-2 py-0.5 text-[0.68rem] leading-none font-semibold tracking-[0.01em]",
                status.badgeClassName,
              )}
            >
              {status.label}
            </span>
          </div>

          <div className="space-y-3 pl-4">
            <div>
              <p className="text-[length:var(--ticketing-text-paper-label)] font-semibold leading-none tracking-[0.03em] text-[var(--text-muted)]">
                공연 일자
              </p>
              <p className="mt-1 text-[length:var(--ticketing-text-paper-value)] leading-none font-bold text-[var(--text)] [font-variant-numeric:tabular-nums]">
                {dateLabel}
              </p>
            </div>
            <div>
              <p className="text-[length:var(--ticketing-text-paper-label)] font-semibold leading-none tracking-[0.03em] text-[var(--text-muted)]">
                팔찌 배부 시각
              </p>
              <p className="mt-1 text-[length:var(--ticketing-text-paper-time)] leading-none font-bold text-[var(--text)]">
                {wristbandValue}
              </p>
            </div>
            <div>
              <p className="text-[length:var(--ticketing-text-paper-label)] font-semibold leading-none tracking-[0.03em] text-[var(--text-muted)]">
                예매 순번
              </p>
              <p className="mt-1 font-mono text-[length:var(--ticketing-text-paper-queue)] leading-none font-extrabold tracking-[0.02em] text-[var(--accent)] [font-variant-numeric:tabular-nums]">
                NO.{queueLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
