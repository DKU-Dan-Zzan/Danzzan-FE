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
    badgeClassName:
      "border-[var(--status-pending-border)] bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
    stripColor: "var(--status-pending)",
  },
  used: {
    label: "팔찌 수령 완료",
    badgeClassName:
      "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
    stripColor: "var(--status-success)",
  },
  cancelled: {
    label: "예매 취소",
    badgeClassName:
      "border-[var(--border-base)] bg-[linear-gradient(180deg,var(--surface-base)_0%,var(--ticket-paper-top)_100%)] text-[var(--text-muted)]",
    stripColor: "var(--text-muted)",
  },
  unknown: {
    label: "상태 확인 필요",
    badgeClassName:
      "border-[var(--border-strong)] bg-[linear-gradient(180deg,var(--surface-tint-strong)_0%,var(--ticket-paper-top)_100%)] text-[var(--accent)]",
    stripColor: "var(--accent)",
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
  dayLabel: string;
  dateLabel: string;
  venueLabel: string;
  queueLabel: string;
  wristbandValue: string;
  entryLabel: string;
  entryValue: string;
} => {
  const dateLabel = ticket.eventDate ? toCompactEventDate(ticket.eventDate) : "미정";
  const dayNumber = ticket.eventName ? getDayNumberFromEventName(ticket.eventName) : null;
  const venueLabel = ticket.venue || "단국존";
  const dayLabel = dayNumber ? `DAY ${dayNumber}` : "DAY 미정";
  const queueLabel = ticket.queueNumber != null
    ? String(ticket.queueNumber)
    : ticket.id.slice(-4).toUpperCase();

  return {
    dayLabel,
    dateLabel,
    venueLabel,
    queueLabel,
    wristbandValue: "추후 공지",
    entryLabel: `${venueLabel} 입장 시각`,
    entryValue: "추후 공지",
  };
};

const PAPER_SURFACE_STYLE = {
  backgroundImage:
    "linear-gradient(180deg,var(--ticket-paper-top)_0%,var(--ticket-paper-base)_100%)",
} as const;

const PAPER_NOISE_TEXTURE_STYLE = {
  backgroundImage: [
    "radial-gradient(circle at 22% 24%, var(--ticket-fiber) 0.58px, transparent 0.84px)",
    "radial-gradient(circle at 74% 36%, var(--ticket-fiber-soft) 0.52px, transparent 0.76px)",
    "radial-gradient(circle at 48% 72%, var(--ticket-fiber) 0.56px, transparent 0.8px)",
    "repeating-linear-gradient(-8deg, transparent 0px, transparent 9px, var(--ticket-fiber-soft) 9px, var(--ticket-fiber-soft) 10px)",
  ].join(","),
  backgroundSize: "23px 23px, 29px 29px, 31px 31px, 100% 100%",
} as const;

const SIDE_CUTOUT_CLASS_NAME =
  "pointer-events-none absolute top-1/2 size-9 -translate-y-1/2 rounded-full border border-[var(--ticket-paper-border)] bg-[var(--bg-base)] shadow-[0_1px_3px_var(--shadow-color)]";

export function PaperTicketCard({ ticket }: PaperTicketCardProps) {
  const status = statusDisplayMap[ticket.status];
  const { dayLabel, dateLabel, venueLabel, queueLabel, wristbandValue, entryLabel, entryValue } =
    getGuideLines(ticket);

  return (
    <Card className={`${TICKETING_CLASSES.card.paper} px-0 py-0`}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={PAPER_SURFACE_STYLE}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.07]"
        style={PAPER_NOISE_TEXTURE_STYLE}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-0 z-0 h-8 bg-[linear-gradient(180deg,var(--ticket-paper-top)_0%,transparent_100%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-6 bottom-6 left-0 z-10 w-[5px] rounded-r-full opacity-80"
        style={{ backgroundColor: status.stripColor }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-6 bottom-6 right-0 z-10 w-[5px] rounded-l-full opacity-80"
        style={{ backgroundColor: status.stripColor }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-3 bottom-3 z-0 border-l border-dashed border-[var(--ticket-perf)] opacity-90"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-3 bottom-3 z-0 border-l border-dashed border-[var(--ticket-perf)] opacity-90"
      />
      <span
        aria-hidden="true"
        className={`${SIDE_CUTOUT_CLASS_NAME} -left-[16px] z-10`}
      />
      <span
        aria-hidden="true"
        className={`${SIDE_CUTOUT_CLASS_NAME} -right-[16px] z-10`}
      />

      <div className="relative z-10 px-6 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[length:var(--ticketing-text-overline)] font-bold tracking-[0.1em] text-[var(--text-muted)]">
              DANKOOK ZONE TICKET
            </p>
          </div>
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-0.5 text-[length:var(--ticketing-text-paper-status)] leading-none font-semibold tracking-[0.01em]",
              status.badgeClassName,
            )}
          >
            {status.label}
          </span>
        </div>

        <div className="mt-2.5 border-t border-dashed border-[var(--ticket-perf)] opacity-90" />

        <div className="mt-2.5 grid grid-cols-[0.9fr_auto_1.35fr_auto_0.85fr] items-start gap-x-3">
          <div>
            <p className="text-[length:var(--ticketing-text-paper-label)] font-semibold leading-none tracking-[0.03em] text-[var(--text-muted)]">
              일차
            </p>
            <p className="mt-1 text-[length:var(--ticketing-text-paper-value)] leading-none font-bold text-[var(--text)]">
              {dayLabel}
            </p>
          </div>

          <span
            aria-hidden="true"
            className="mt-0.5 block h-[2.55rem] border-l border-dashed border-[var(--ticket-perf)] opacity-90"
          />

          <div>
            <p className="text-[length:var(--ticketing-text-paper-label)] font-semibold leading-none tracking-[0.03em] text-[var(--text-muted)]">
              공연 일자
            </p>
            <p className="mt-1 text-[length:var(--ticketing-text-paper-value)] leading-none font-bold text-[var(--text)] [font-variant-numeric:tabular-nums]">
              {dateLabel}
            </p>
          </div>

          <span
            aria-hidden="true"
            className="mt-0.5 block h-[2.55rem] border-l border-dashed border-[var(--ticket-perf)] opacity-90"
          />

          <div>
            <p className="text-[length:var(--ticketing-text-paper-label)] font-semibold leading-none tracking-[0.03em] text-[var(--text-muted)]">
              예매 순번
            </p>
            <p className="mt-1 font-mono text-[length:var(--ticketing-text-paper-queue)] leading-none font-extrabold tracking-[0.02em] text-[var(--accent)] [font-variant-numeric:tabular-nums]">
              NO.{queueLabel}
            </p>
          </div>
        </div>

        <div className="mt-2.5 border-t border-dashed border-[var(--ticket-perf)] opacity-90" />

        <div className="mt-2.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-x-4">
          <div>
            <p className="text-[length:var(--ticketing-text-paper-label)] font-semibold leading-none tracking-[0.03em] text-[var(--text-muted)]">
              팔찌 배부 시각
            </p>
            <p className="mt-1 text-[length:var(--ticketing-text-paper-time)] leading-none font-bold text-[var(--text)]">
              {wristbandValue}
            </p>
          </div>

          <span
            aria-hidden="true"
            className="mt-0.5 block h-[2.25rem] border-l border-dashed border-[var(--ticket-perf)] opacity-90"
          />

          <div>
            <p className="text-[length:var(--ticketing-text-paper-label)] font-semibold leading-none tracking-[0.03em] text-[var(--text-muted)]">
              {entryLabel}
            </p>
            <p className="mt-1 text-[length:var(--ticketing-text-paper-time)] leading-none font-bold text-[var(--text)]">
              {entryValue}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
