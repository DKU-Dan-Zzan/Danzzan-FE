import { Ticket } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/ticketing/components/common/ui/card";
import { Progress } from "@/ticketing/components/common/ui/progress";
import { TicketingAdBannerCard } from "@/ticketing/components/ticketing/TicketingAdBannerCard";
import {
  TICKETING_CLASSES,
  TICKETING_NARROW_PANEL_CLASS,
} from "@/ticketing/components/ticketing/ticketingShared";
import { isRemainingFresh } from "@/ticketing/routes/Ticketing/queueFlowUtils";
import type { PlacementAd } from "@/ticketing/types/model/ad.model";

interface WaitingRoomPanelProps {
  eventTitle: string;
  remaining: number | null;
  remainingUpdatedAt: number | null;
  polling: boolean;
  offline: boolean;
  errorMessage: string | null;
  ad: PlacementAd | null;
}

const estimateWaitSeconds = (remaining: number | null): number | null => {
  if (remaining === null || remaining < 0) {
    return null;
  }
  if (remaining <= 0) {
    return 0;
  }
  return Math.max(1, Math.round(remaining / 7));
};

const formatEta = (seconds: number | null): string => {
  if (seconds === null) {
    return "?뺤씤 以?;"
  }
  if (seconds < 60) {
    return `??${seconds}珥?;`
  }
  const minutes = Math.floor(seconds / 60);
  const leftSec = seconds % 60;
  if (leftSec === 0) {
    return `??${minutes}遺?;`
  }
  return `??${minutes}遺?${leftSec}珥?;`
};

const formatRemaining = (remaining: number | null): string => {
  if (remaining === null || remaining < 0) {
    return "--";
  }
  return remaining.toLocaleString("ko-KR");
};

const formatQueueOrder = (remaining: number | null): string => {
  if (remaining === null || remaining < 0) {
    return "--";
  }
  return (remaining + 1).toLocaleString("ko-KR");
};

const estimateProgress = (remaining: number | null): number => {
  if (remaining === null) {
    return 25;
  }
  if (remaining <= 0) {
    return 95;
  }
  const max = 300;
  const normalized = Math.min(remaining, max);
  return Math.max(8, Math.round((1 - normalized / max) * 95));
};

export function WaitingRoomPanel({
  eventTitle,
  remaining,
  remainingUpdatedAt,
  polling,
  offline,
  errorMessage,
  ad,
}: WaitingRoomPanelProps) {
  const [displayRemaining, setDisplayRemaining] = useState<number | null>(remaining);
  const displayRemainingRef = useRef<number | null>(remaining);
  const [now, setNow] = useState(() => Date.now());
  const [displayProgress, setDisplayProgress] = useState(() => estimateProgress(remaining));
  const displayProgressRef = useRef<number>(estimateProgress(remaining));

  useEffect(() => {
    if (remaining === null) {
      displayRemainingRef.current = null;
      setDisplayRemaining(null);
      return;
    }

    const from = displayRemainingRef.current ?? remaining;
    if (from === remaining) {
      displayRemainingRef.current = remaining;
      setDisplayRemaining(remaining);
      return;
    }

    const duration = 420;
    const startedAt = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (remaining - from) * eased);
      displayRemainingRef.current = next;
      setDisplayRemaining(next);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      displayRemainingRef.current = remaining;
      setDisplayRemaining(remaining);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [remaining]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const hasFreshRemaining = isRemainingFresh(remainingUpdatedAt, now);
  const canEstimateProgress = hasFreshRemaining && displayRemaining !== null && displayRemaining >= 0;
  const baseProgressValue = estimateProgress(displayRemaining);
  const progressValue = canEstimateProgress ? displayProgress : baseProgressValue;
  const etaLabel = offline
    ? "?곌껐 ?뺤씤 以?"
    : canEstimateProgress
      ? formatEta(estimateWaitSeconds(displayRemaining))
      : "?뺤씤 以?;"

  useEffect(() => {
    if (!canEstimateProgress) {
      return;
    }

    // 吏꾪뻾諛붾뒗 ?ъ슜???좊ː瑜??꾪빐 ?덈? ?ㅻ줈 媛吏 ?딄쾶 ?⑥“ 利앷?濡??좎??⑸땲??
    const nextProgress = Math.max(displayProgressRef.current, baseProgressValue);
    if (nextProgress === displayProgressRef.current) {
      return;
    }

    displayProgressRef.current = nextProgress;
    setDisplayProgress(nextProgress);
  }, [baseProgressValue, canEstimateProgress]);

  useEffect(() => {
    if (remaining === null) {
      const resetProgress = estimateProgress(null);
      displayProgressRef.current = resetProgress;
      setDisplayProgress(resetProgress);
    }
  }, [remaining]);

  return (
    <div className={`${TICKETING_NARROW_PANEL_CLASS} space-y-4`}>
      <section className="px-1">
        <h2 className="text-[1.72rem] leading-[1.2] font-black tracking-[-0.02em] text-[var(--text)]">
          ?묒냽 ?몄썝??留롮븘
          <br />
          ?湲?以묒엯?덈떎.
        </h2>
        <p className="mt-1 text-[1.55rem] leading-[1.18] font-black tracking-[-0.02em] text-[var(--accent)]">
          議곌툑留?湲곕떎?ㅼ＜?몄슂.
        </p>
        <p className="mt-3 text-[length:var(--ticketing-text-card-subtitle)] font-bold text-[var(--text-muted)]">
          {eventTitle || "?④뎅議??좎삁留?"}
        </p>
      </section>

      <Card className="rounded-[26px] border-[var(--border-base)] bg-[var(--surface-base)] px-5 py-5 shadow-[0_16px_28px_-22px_var(--shadow-color)]">
        <div className="text-center">
          <p className="text-[length:var(--ticketing-text-card-title)] font-black text-[var(--text)]">
            ?섏쓽 ?湲곗닚??          </p>
          <p className="mt-1 font-mono text-[3.2rem] leading-none font-black tracking-[0.02em] text-[var(--text)] [font-variant-numeric:tabular-nums]">
            {formatQueueOrder(displayRemaining)}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-right text-[length:var(--ticketing-text-card-subtitle)] font-bold text-[var(--accent)]">
            ?덉긽 ?湲??쒓컙: {etaLabel}
          </p>
          <div className="relative mt-2">
            {canEstimateProgress ? (
              <Progress
                value={progressValue}
                className="h-5 rounded-full bg-[var(--surface-tint-subtle)] [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-[var(--accent)]"
              />
            ) : (
              <div className="relative h-5 overflow-hidden rounded-full bg-[var(--surface-tint-subtle)]">
                <div
                  className={`h-full w-[38%] rounded-full bg-[var(--accent)] ${offline || !polling ? "opacity-40" : "animate-pulse opacity-70"}`}
                />
              </div>
            )}
            <Ticket
              className="pointer-events-none absolute top-1/2 right-3 h-4.5 w-4.5 -translate-y-1/2 text-[var(--text-muted)] opacity-50"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[length:var(--ticketing-text-helper)] font-semibold text-[var(--text-muted)]">
              ?꾩옱 ?湲곗씤??            </p>
            <p className="font-mono text-[1.2rem] leading-none font-extrabold tracking-[0.01em] text-[var(--text)] [font-variant-numeric:tabular-nums]">
              {formatRemaining(displayRemaining)}紐?            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3 py-2.5 text-center">
          <p className="text-[length:var(--ticketing-text-section-body-sm)] font-semibold text-[var(--status-warning-text)]">
            ???덈줈怨좎묠?대굹 ?ъ젒?????湲??쒓컙????湲몄뼱吏????덉뒿?덈떎.
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
