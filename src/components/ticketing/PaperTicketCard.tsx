import { Card } from "@/components/common/ui/card";
import { cn } from "@/components/common/ui/utils";
import { TICKETING_CLASSES } from "@/components/ticketing/ticketingShared";
import type { Ticket } from "@/types/model/ticket.model";

interface PaperTicketCardProps {
  ticket: Ticket;
}

const statusDisplayMap: Record<
  Ticket["status"],
  { label: string; badgeClassName: string; stripColor: string }
> = {
  issued: {
    label: "팔찌 미수령 상태",
    badgeClassName: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]",
    stripColor: "var(--status-warning)",
  },
  used: {
    label: "팔찌 수령 완료",
    badgeClassName: "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
    stripColor: "var(--status-success)",
  },
  cancelled: {
    label: "예매 취소",
    badgeClassName: "border-[var(--border-base)] bg-[linear-gradient(145deg,var(--surface-tint-base)_0%,var(--surface-base)_100%)] text-[var(--text-muted)]",
    stripColor: "var(--text-muted)",
  },
  unknown: {
    label: "상태 확인 필요",
    badgeClassName: "border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-base)_100%)] text-[var(--accent)]",
    stripColor: "var(--accent)",
  },
};

const stripTimeFromEventDate = (value: string): string => {
  return value.replace(/\s+\d{1,2}:\d{2}.*$/, "").trim();
};

const getDayNumberFromEventName = (value: string): string | null => {
  const matched = value.match(/(\d+)\s*일차/);
  if (!matched) {
    return null;
  }

  return matched[1];
};

const getGuideLines = (
  ticket: Ticket,
): {
  ticketTitle: string;
  wristbandLabel: string;
  wristbandValue: string;
  entryLabel: string;
  entryValue: string;
} => {
  const baseDate = ticket.eventDate ? stripTimeFromEventDate(ticket.eventDate) : "일정 공지 예정";
  const dayNumber = ticket.eventName ? getDayNumberFromEventName(ticket.eventName) : null;
  const ticketTitle = dayNumber ? `DAY ${dayNumber} · ${baseDate}` : baseDate;
  const venueLabel = ticket.venue || "단국존";
  return {
    ticketTitle,
    wristbandLabel: "팔찌 배부 시각",
    wristbandValue: "추후 공지",
    entryLabel: `${venueLabel} 입장 시각`,
    entryValue: "추후 공지",
  };
};

const NOTCH_CLASS_NAME =
  "pointer-events-none absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border border-[var(--border-strong)] bg-[linear-gradient(135deg,var(--surface-subtle)_0%,var(--surface-tint-strong)_48%,var(--surface-subtle)_100%)] shadow-[inset_0_1.5px_2px_var(--surface-subtle),inset_0_-2px_3px_var(--border-base),0_1px_2px_var(--border-base)]";

const PAPER_NOISE_TEXTURE_STYLE = {
  backgroundImage: [
    "radial-gradient(circle at 22% 24%, var(--text) 0.6px, transparent 0.8px)",
    "radial-gradient(circle at 74% 36%, var(--text) 0.5px, transparent 0.72px)",
    "radial-gradient(circle at 48% 72%, var(--text) 0.52px, transparent 0.74px)",
  ].join(","),
  backgroundSize: "19px 19px, 23px 23px, 27px 27px",
} as const;

export function PaperTicketCard({ ticket }: PaperTicketCardProps) {
  const status = statusDisplayMap[ticket.status];
  const queue = ticket.queueNumber ?? ticket.id;
  const { ticketTitle, wristbandLabel, wristbandValue, entryLabel, entryValue } =
    getGuideLines(ticket);
  const queueLabel = String(queue);

  return (
    <Card className={`${TICKETING_CLASSES.card.paper} px-5 py-6`}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.02]"
        style={PAPER_NOISE_TEXTURE_STYLE}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-5 bottom-5 left-0 z-10 w-[3px] rounded-r-full"
        style={{ backgroundColor: status.stripColor }}
      />

      <div className="relative z-10 pl-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className={`${TICKETING_CLASSES.typography.paperTitle} text-[var(--text)]`}>
            {ticketTitle}
          </h3>
          <span
            className={cn(
              TICKETING_CLASSES.badge.paperStatus,
              status.badgeClassName,
            )}
          >
            {status.label}
          </span>
        </div>

        <div className="relative mt-5 mb-6">
          <span className={`${NOTCH_CLASS_NAME} -left-9`} />
          <span className={`${NOTCH_CLASS_NAME} -right-9`} />
          <span className={`block ${TICKETING_CLASSES.divider.paper}`} />
        </div>

        <div>
          <p className={`text-center ${TICKETING_CLASSES.typography.queueLabel} text-[var(--text-muted)]`}>예매 순번</p>
          <p className={`mt-1 text-center ${TICKETING_CLASSES.typography.queueValue} text-[var(--accent)]`}>
            NO. {queueLabel}
          </p>
        </div>

        <div className={`my-6 ${TICKETING_CLASSES.divider.paper}`} />

        <div className="space-y-2.5 pt-5">
          <p className={`flex flex-wrap items-center gap-1.5 ${TICKETING_CLASSES.typography.ticketMeta} text-[var(--text-muted)]`}>
            <span className="font-medium text-[var(--accent)]">[{wristbandLabel}]</span>
            <span className="font-normal text-[var(--text-muted)]">{wristbandValue}</span>
          </p>
          <p className={`flex flex-wrap items-center gap-1.5 ${TICKETING_CLASSES.typography.ticketMeta} text-[var(--text-muted)]`}>
            <span className="font-medium text-[var(--accent)]">[{entryLabel}]</span>
            <span className="font-normal text-[var(--text-muted)]">{entryValue}</span>
          </p>
        </div>

        <div className={`my-5 ${TICKETING_CLASSES.divider.paper}`} />

        <div className="rounded-lg bg-[var(--surface-subtle)] px-3 py-2">
          <p className={`text-center ${TICKETING_CLASSES.typography.ticketFooter} text-[var(--text-muted)]`}>
            입장 시 제시하세요
          </p>
          <p className={`mt-1 text-center ${TICKETING_CLASSES.typography.watermark} text-[var(--text-muted)] opacity-70`}>
            DANKOOK FESTA 2026 · LOU:D · DANKOOK FESTA 2026 · LOU:D
          </p>
        </div>
      </div>
    </Card>
  );
}
