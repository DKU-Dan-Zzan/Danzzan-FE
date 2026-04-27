// 역할: 진행 가능한 티켓 이벤트 목록과 상태별 CTA 버튼을 표시합니다.
import { useMemo } from "react";
import { CalendarClock, Clock3 } from "lucide-react";
import { Badge } from "@/components/common/ui/badge";
import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { cn } from "@/components/common/ui/utils";
import { APP_CARD_VARIANTS } from "@/components/common/ui/appCardVariants";
import {
  TICKETING_CLASSES,
  TICKETING_WIDE_PANEL_CLASS,
  TicketingRefreshButton,
} from "@/components/ticketing/panels/TicketingShared";
import type { TicketingEvent } from "@/types/ticketing/model/ticket.model";

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
    label: "오픈 예정",
    badgeClassName: "border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-muted)]",
  },
  open: {
    label: "실시간 예매 중",
    badgeClassName:
      "border-[var(--status-success-border)] bg-[var(--status-success)] text-white shadow-[0_8px_14px_-10px_var(--shadow-color)]",
  },
  soldout: {
    label: "예매 마감",
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

const normalizeKoreanMonthDay = (value: string): string => {
  return value
    .replace(/(^|[^0-9])0([1-9])(?=\s*월)/g, "$1$2")
    .replace(/월(\s*)0([1-9])(?=\s*일)/g, "월$1$2");
};

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

  if (event.status === "open") {
    return "open";
  }

  if (openAtMs !== null && now >= openAtMs) {
    return "open";
  }

  return "upcoming";
};

const formatEventDateTime = (event: TicketingEvent, openAtMs: number | null): string => {
  const eventDateTime = [event.eventDate, event.eventTime].filter(Boolean).join(" ").replace(/예매\s*오픈/g, "").trim();
  if (eventDateTime) {
    return normalizeKoreanMonthDay(eventDateTime);
  }

  if (openAtMs === null) {
    return "오픈 일정 추후 공지";
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
  return `${month}월 ${day}일 (${weekday}) ${time}`;
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
        <h2 className="sr-only">티켓팅</h2>
        <Card className={`relative overflow-hidden ${APP_CARD_VARIANTS.gradTint} rounded-[28px] p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 ${TICKETING_CLASSES.badge.iconCircle}`}>
                <CalendarClock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className={`${TICKETING_CLASSES.typography.infoBannerTitle} text-[var(--text)]`}>
                  요일별 예매 오픈시간을 확인하여 티켓팅에 참여하세요.
                </p>
                <p className={`mt-1 ${TICKETING_CLASSES.typography.infoBannerBody} text-[var(--text-muted)]`}>
                  오픈 시각에 맞춰 예매 버튼이 활성화됩니다.
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
          <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>티켓 정보를 불러오는 중입니다...</p>
        </Card>
      )}

      {!loading && events.length === 0 && (
        <Card className={`${TICKETING_CLASSES.card.emptyState} p-6`}>
          <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>진행 중인 티켓팅 일정이 없습니다.</p>
        </Card>
      )}

      {eventViewModels.map(({ event, openAtMs, status, currentStatusMeta, countdown }) => {
        return (
          <Card
            key={event.id}
            className={`relative overflow-hidden ${APP_CARD_VARIANTS.outline} rounded-[28px] px-5 py-4`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className={`truncate ${TICKETING_CLASSES.typography.cardTitle} text-[var(--text)] !text-[0.95rem]`}>
                  {normalizeKoreanMonthDay(event.title || "공연 티켓팅")}
                </h3>
                <p className={`mt-1 ${TICKETING_CLASSES.typography.cardSubtitle} text-[var(--accent)]`}>
                  {formatEventDateTime(event, openAtMs)}
                </p>
              </div>
              <Badge
                variant="outline"
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
                  오픈까지 남은 시간 {formatCountdown(countdown)}
                </Button>
              )}

              {status === "upcoming" && openAtMs === null && (
                <Button
                  className={`${TICKETING_CLASSES.button.disabledCompactFull} h-12`}
                  variant="outline"
                  disabled
                >
                  오픈 예정
                </Button>
              )}

              {status === "open" && (
                <Button
                  className={`${TICKETING_CLASSES.button.primaryFull} h-12`}
                  onClick={() => onSelectEvent(event)}
                >
                  단국존 선착순 예매
                </Button>
              )}

              {status === "soldout" && (
                <Button
                  className={`${TICKETING_CLASSES.button.disabledSoldoutFull} h-12`}
                  variant="outline"
                  disabled
                >
                  정원 초과로 신청 마감
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
