import { useMemo } from "react";
import { CalendarClock, Clock3 } from "lucide-react";
import { Badge } from "@/ticketing/components/common/ui/badge";
import { Button } from "@/ticketing/components/common/ui/button";
import { Card } from "@/ticketing/components/common/ui/card";
import { cn } from "@/ticketing/components/common/ui/utils";
import {
  TICKETING_CLASSES,
  TICKETING_WIDE_PANEL_CLASS,
  TicketingRefreshButton,
} from "@/ticketing/components/ticketing/ticketingShared";
import type { TicketingEvent } from "@/ticketing/types/model/ticket.model";

interface TicketingEventListPanelProps {
  events: TicketingEvent[];
  loading: boolean;
  errorMessage: string | null;
  now: number;
  onRefresh: () => void;
  onSelectEvent: (event: TicketingEvent) => void;
}

type EventViewStatus = "upcoming" | "open" | "soldout";

const statusMeta: Record<
  EventViewStatus,
  {
    label: string;
    badgeClassName: string;
  }
> = {
  upcoming: {
    label: "?ㅽ뵂 ?덉젙",
    badgeClassName: "border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-muted)]",
  },
  open: {
    label: "?ㅼ떆媛??덈ℓ 以?",
    badgeClassName:
      "border-[var(--status-success-border)] bg-[var(--status-success)] text-white shadow-[0_8px_14px_-10px_var(--shadow-color)]",
  },
  soldout: {
    label: "?덈ℓ 留덇컧",
    badgeClassName: "border-[var(--status-neutral-border)] bg-[var(--status-neutral)] text-white",
  },
};

const parseTimestamp = (value: string): number | null => {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
};

const normalizeKoreanMonthDay = (value: string): string => value;

const formatCountdown = (seconds: number): string => {
  const clamped = Math.max(0, seconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const sec = clamped % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(sec).padStart(2, "0"),
  ].join(":");
};

const resolveViewStatus = (
  event: TicketingEvent,
  openAtMs: number | null,
  now: number,
): EventViewStatus => {
  if (event.status === "soldout" || event.remainingCount === 0) {
    return "soldout";
  }

  if (openAtMs !== null && now < openAtMs) {
    return "upcoming";
  }

  if (event.status === "upcoming" && openAtMs === null) {
    return "upcoming";
  }

  return "open";
};

const formatEventDateTime = (event: TicketingEvent, openAtMs: number | null): string => {
  const eventDateTime = [event.eventDate, event.eventTime].filter(Boolean).join(" ");
  if (eventDateTime) {
    return normalizeKoreanMonthDay(eventDateTime);
  }

  if (openAtMs === null) {
    return "?ㅽ뵂 ?쇱젙 異뷀썑 怨듭?";
  }

  const date = new Date(openAtMs);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.toLocaleDateString("ko-KR", { weekday: "short" });
  const time = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${month}??${day}??(${weekday}) ${time}`;
};

export function TicketingEventListPanel({
  events,
  loading,
  errorMessage,
  now,
  onRefresh,
  onSelectEvent,
}: TicketingEventListPanelProps) {
  const eventViewModels = useMemo(
    () =>
      events.map((event) => {
        const openAtMs = parseTimestamp(event.ticketOpenAt);
        const status = resolveViewStatus(event, openAtMs, now);
        const currentStatusMeta = statusMeta[status];
        const countdown =
          status === "upcoming" && openAtMs !== null
            ? Math.max(0, Math.floor((openAtMs - now) / 1000))
            : 0;

        return {
          event,
          status,
          currentStatusMeta,
          openAtMs,
          countdown,
        };
      }),
    [events, now],
  );

  return (
    <div className={TICKETING_WIDE_PANEL_CLASS}>
      <div>
        <h2 className="sr-only">?곗폆??</h2>
        <Card className={`${TICKETING_CLASSES.card.infoBanner} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 ${TICKETING_CLASSES.badge.iconCircle}`}>
                <CalendarClock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className={`${TICKETING_CLASSES.typography.infoBannerTitle} text-[var(--text)]`}>
                  怨듭뿰蹂??덈ℓ ?ㅽ뵂 ?쒓컖???뺤씤?섏뿬 ?④뎅議??곗폆?낆뿉 李몄뿬?섏꽭??
                </p>
                <p className={`mt-1 ${TICKETING_CLASSES.typography.infoBannerBody} text-[var(--text-muted)]`}>
                  ?ㅽ뵂 10遺??꾨???移댁슫?몃떎?댁씠 ?쒖옉?섎ŉ, 0珥??댄썑 ?덈ℓ 踰꾪듉???쒖꽦?붾맗?덈떎.
                </p>
              </div>
            </div>
            <TicketingRefreshButton
              onClick={onRefresh}
              loading={loading}
            />
          </div>
        </Card>
      </div>

      {errorMessage && (
        <Card className="border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-4">
          <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--status-danger-text)]`}>{errorMessage}</p>
        </Card>
      )}

      {loading && events.length === 0 && (
        <Card className={`${TICKETING_CLASSES.card.emptyState} p-6`}>
          <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>?곗폆 ?뺣낫瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎...</p>
        </Card>
      )}

      {!loading && events.length === 0 && (
        <Card className={`${TICKETING_CLASSES.card.emptyState} p-6`}>
          <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>吏꾪뻾 以묒씤 ?곗폆???쇱젙???놁뒿?덈떎.</p>
        </Card>
      )}

      {eventViewModels.map(({ event, openAtMs, status, currentStatusMeta, countdown }) => {
        return (
          <Card
            key={event.id}
            className={`${TICKETING_CLASSES.card.event} px-5 py-4`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className={`truncate ${TICKETING_CLASSES.typography.cardTitle} text-[var(--text)]`}>
                  {normalizeKoreanMonthDay(event.title || "怨듭뿰 ?곗폆")}
                </h3>
                <p className={`mt-1 ${TICKETING_CLASSES.typography.cardSubtitle} text-[var(--accent)]`}>
                  {formatEventDateTime(event, openAtMs)}
                </p>
              </div>
              <Badge
                className={cn(
                  TICKETING_CLASSES.badge.event,
                  currentStatusMeta.badgeClassName,
                )}
              >
                {currentStatusMeta.label}
              </Badge>
            </div>

            <div className="mt-3">
              {status === "upcoming" && openAtMs !== null && (
                <Button
                  className={`${TICKETING_CLASSES.button.disabledFull} h-12`}
                  variant="outline"
                  disabled
                >
                  <Clock3 className="h-[0.8rem] w-[0.8rem]" />
                  ?ㅽ뵂源뚯? ?⑥? ?쒓컙 {formatCountdown(countdown)}
                </Button>
              )}

              {status === "upcoming" && openAtMs === null && (
                <Button
                  className={`${TICKETING_CLASSES.button.disabledCompactFull} h-12`}
                  variant="outline"
                  disabled
                >
                  ?ㅽ뵂 ?덉젙
                </Button>
              )}

              {status === "open" && (
                <Button
                  className={`${TICKETING_CLASSES.button.primaryFull} h-12`}
                  onClick={() => onSelectEvent(event)}
                >
                  ?④뎅議??좎갑???덈ℓ
                </Button>
              )}

              {status === "soldout" && (
                <Button
                  className={`${TICKETING_CLASSES.button.disabledSoldoutFull} h-12`}
                  variant="outline"
                  disabled
                >
                  ?뺤썝 珥덇낵濡??좎껌 留덇컧
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
