// 역할: 예매 처리 중 상태와 오류/재시도 UI를 제공하는 중간 단계 패널입니다.
import { LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { TICKETING_CLASSES, TICKETING_NARROW_PANEL_CLASS } from "@/components/ticketing/panels/TicketingShared";

interface ReservationProcessingPanelProps {
  processing: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}

export function ReservationProcessingPanel({
  processing,
  errorMessage,
  onRetry,
}: ReservationProcessingPanelProps) {
  return (
    <div className={`${TICKETING_NARROW_PANEL_CLASS} flex min-h-[calc(100svh-var(--app-bottom-nav-runtime-offset)-env(safe-area-inset-top)-68px-var(--app-header-first-card-gap))] items-center`}>
      <Card className={`${TICKETING_CLASSES.card.summaryInfo} gap-5 border-[var(--border-strong)] px-6 py-7`}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--surface-tint-strong)] text-[var(--accent)]">
          <LoaderCircle className={`h-9 w-9 ${processing ? "animate-spin" : ""}`} />
        </div>

        <div>
          <h2 className="text-center text-[clamp(1.55rem,5.2vw,1.8rem)] leading-[1.2] font-extrabold tracking-[-0.02em] text-[var(--text)]">
            예매가 거의 완료됐어요
          </h2>
          <p className="mt-3 text-center text-[1.06rem] leading-[1.55] font-medium text-[var(--text-muted)] break-keep">
            <span className="block">현재 예매 정보를 안전하게 반영하고 있습니다</span>
            <span className="block">잠시만 기다려 주세요.</span>
          </p>
          <div className="mt-3 rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3.5 py-2.5">
            <p className="text-center text-[0.98rem] leading-[1.55] font-bold text-[var(--status-danger-text)] break-keep">
              <span className="block">새로고침이나 뒤로가기를 누르면</span>
              <span className="block">예매가 완료되지 않을 수 있습니다.</span>
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-4 py-3">
            <p className="text-center text-[0.96rem] leading-[1.5] font-semibold text-[var(--status-danger-text)]">
              {errorMessage}
            </p>
          </div>
        )}

        {!processing && (
          <Button onClick={onRetry} className={TICKETING_CLASSES.button.primaryFull}>
            다시 시도
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </Card>
    </div>
  );
}
