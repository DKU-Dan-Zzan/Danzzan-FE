import { Megaphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/common/ui/card";
import { Progress } from "@/components/common/ui/progress";
import {
  TICKETING_CLASSES,
  TICKETING_NARROW_PANEL_CLASS,
} from "@/components/ticketing/ticketingShared";
import { isRemainingFresh } from "@/routes/Ticketing/queueFlowUtils";
import type { PlacementAd } from "@/types/model/ad.model";

interface WaitingRoomPanelProps {
  eventTitle: string;
  remaining: number | null;
  remainingUpdatedAt: number | null;
  polling: boolean;
  offline: boolean;
  errorMessage: string | null;
  ad: PlacementAd | null;
}

const WAITING_AD_PLACEHOLDER = "/ads/waiting-room-sample-banner.svg";

const buildVersionedImageUrl = (imageUrl: string, updatedAt: string): string => {
  if (!imageUrl) {
    return WAITING_AD_PLACEHOLDER;
  }
  if (!updatedAt) {
    return imageUrl;
  }

  const version = encodeURIComponent(updatedAt);
  return imageUrl.includes("?") ? `${imageUrl}&v=${version}` : `${imageUrl}?v=${version}`;
};

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
    return "확인 중";
  }
  if (seconds < 60) {
    return `약 ${seconds}초`;
  }
  const minutes = Math.floor(seconds / 60);
  const leftSec = seconds % 60;
  if (leftSec === 0) {
    return `약 ${minutes}분`;
  }
  return `약 ${minutes}분 ${leftSec}초`;
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
    ? "연결 확인 중"
    : canEstimateProgress
      ? formatEta(estimateWaitSeconds(displayRemaining))
      : "확인 중";
  const adImageUrl = ad ? buildVersionedImageUrl(ad.imageUrl, ad.updatedAt) : WAITING_AD_PLACEHOLDER;
  const adAlt = ad?.altText?.trim() || "단짠 대기열 광고";
  const adLink = ad?.linkUrl?.trim() || null;

  useEffect(() => {
    if (!canEstimateProgress) {
      return;
    }

    // 진행바는 사용자 신뢰를 위해 절대 뒤로 가지 않게 단조 증가로 유지합니다.
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
            {formatQueueOrder(displayRemaining)}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-right text-[length:var(--ticketing-text-card-subtitle)] font-bold text-[var(--accent)]">
            예상 대기 시간: {etaLabel}
          </p>
          {canEstimateProgress ? (
            <Progress
              value={progressValue}
              className="mt-2 h-4 rounded-full bg-[var(--surface-tint-subtle)] [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-[var(--accent)]"
            />
          ) : (
            <div className="relative mt-2 h-4 overflow-hidden rounded-full bg-[var(--surface-tint-subtle)]">
              <div
                className={`h-full w-[38%] rounded-full bg-[var(--accent)] ${offline || !polling ? "opacity-40" : "animate-pulse opacity-70"}`}
              />
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[length:var(--ticketing-text-helper)] font-semibold text-[var(--text-muted)]">
              현재 대기인원
            </p>
            <p className="font-mono text-[1.2rem] leading-none font-extrabold tracking-[0.01em] text-[var(--text)] [font-variant-numeric:tabular-nums]">
              {formatRemaining(displayRemaining)}명
            </p>
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

      <Card className={`${TICKETING_CLASSES.card.summaryInfo} gap-2 px-3 py-3`}>
        <div className="flex items-center justify-between">
          <p className={`flex items-center gap-1.5 ${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>
            <Megaphone className="h-3.5 w-3.5" />
            광고
          </p>
          <span className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-tint-subtle)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--accent)]">
            AD
          </span>
        </div>

        <div className="mx-auto w-full max-w-[18rem] overflow-hidden rounded-[14px] border border-[var(--border-base)]">
          {adLink ? (
            <a
              href={adLink}
              target="_blank"
              rel="noreferrer"
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <div className="aspect-[16/5] w-full bg-[var(--surface-subtle)]">
                <img src={adImageUrl} alt={adAlt} className="h-full w-full object-cover" loading="lazy" />
              </div>
            </a>
          ) : (
            <div className="aspect-[16/5] w-full bg-[var(--surface-subtle)]">
              <img src={adImageUrl} alt={adAlt} className="h-full w-full object-cover" loading="lazy" />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
