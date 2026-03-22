// 역할: 티켓팅 도메인 화면 구성을 위한 UI 컴포넌트를 제공합니다.
import { Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/common/ui/card";
import { TicketingAdBannerCard } from "@/components/ticketing/panels/TicketingAdBannerCard";
import {
  TICKETING_CLASSES,
  TICKETING_NARROW_PANEL_CLASS,
} from "@/components/ticketing/panels/TicketingShared";
import { isRemainingFresh } from "@/hooks/ticketing/queue/flow-utils";
import type { PlacementAd } from "@/types/ticketing/model/ad.model";

interface WaitingRoomPanelProps {
  eventTitle: string;
  queuePosition: number | null;
  queuePositionUpdatedAt: number | null;
  polling: boolean;
  offline: boolean;
  errorMessage: string | null;
  ad: PlacementAd | null;
}

const formatQueuePosition = (queuePosition: number | null): string => {
  if (queuePosition === null || queuePosition < 1) {
    return "--";
  }
  return queuePosition.toLocaleString("ko-KR");
};

export function WaitingRoomPanel({
  eventTitle,
  queuePosition,
  queuePositionUpdatedAt,
  polling,
  offline,
  errorMessage,
  ad,
}: WaitingRoomPanelProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const hasFreshPosition = isRemainingFresh(queuePositionUpdatedAt, now);
  return (
    <div className={`${TICKETING_NARROW_PANEL_CLASS} space-y-4`}>
      <section className="px-1">
        <h2 className="text-[1.72rem] leading-[1.2] font-black tracking-[-0.02em] text-[var(--text)]">
          접속 인원이 많아
          <br />
          대기 중입니다.
        </h2>
        <p className="mt-1 text-[1.55rem] leading-[1.18] font-black tracking-[-0.02em] text-[var(--accent)]">
          조금만 기다려주세요.
        </p>
        <p className="mt-3 text-[length:var(--ticketing-text-card-subtitle)] font-bold text-[var(--text-muted)]">
          {eventTitle || "단국존 선예매"}
        </p>
      </section>

      <Card className="rounded-[26px] border-[var(--border-base)] bg-[var(--surface-base)] px-5 py-5 shadow-[0_16px_28px_-22px_var(--shadow-color)]">
        <div className="text-center">
          <p className="text-[length:var(--ticketing-text-card-title)] font-black text-[var(--text)]">
            나의 대기순서
          </p>
          <p className="mt-1 font-mono text-[3.2rem] leading-none font-black tracking-[0.02em] text-[var(--text)] [font-variant-numeric:tabular-nums]">
            {formatQueuePosition(queuePosition)}
          </p>
        </div>

        <div className="mt-4">
          <div className="relative">
            <div className="relative h-5 overflow-hidden rounded-full bg-[var(--surface-tint-subtle)]">
              <div
                className={`h-full w-[38%] rounded-full bg-[var(--accent)] ${offline || !polling || !hasFreshPosition ? "opacity-40" : "animate-pulse opacity-70"}`}
              />
            </div>
            <Ticket
              className="pointer-events-none absolute top-1/2 right-3 h-4.5 w-4.5 -translate-y-1/2 text-[var(--text-muted)] opacity-50"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3 py-2.5 text-center">
          <p className="text-[length:var(--ticketing-text-section-body-sm)] font-semibold text-[var(--status-warning-text)]">
            ※ 새로고침이나 재접속 시 대기 시간이 더 길어질 수 있습니다.
          </p>
        </div>
      </Card>

      {errorMessage && (
        <Card className="gap-2 border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-4 py-3">
          <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--status-danger-text)]`}>
            {errorMessage}
          </p>
        </Card>
      )}

      <TicketingAdBannerCard ad={ad} />
    </div>
  );
}
