import { LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { TICKETING_CLASSES, TICKETING_NARROW_PANEL_CLASS } from "@/components/ticketing/panels/ticketingShared";

interface ReservationProcessingPanelProps {
  processing: boolean;
  message: string;
  errorMessage: string | null;
  onRetry: () => void;
  onBackToList: () => void;
}

export function ReservationProcessingPanel({
  processing,
  message,
  errorMessage,
  onRetry,
  onBackToList,
}: ReservationProcessingPanelProps) {
  return (
    <div className={TICKETING_NARROW_PANEL_CLASS}>
      <Card className={`${TICKETING_CLASSES.card.summaryInfo} gap-4 px-5 py-6`}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--surface-tint-strong)] text-[var(--accent)]">
          <LoaderCircle className={`h-8 w-8 ${processing ? "animate-spin" : ""}`} />
        </div>

        <div>
          <h2 className={`text-center ${TICKETING_CLASSES.typography.stateTitle} text-[var(--text)]`}>
            예매 요청 처리 중
          </h2>
          <p className={`mt-2 text-center ${TICKETING_CLASSES.typography.stateBody} text-[var(--text-muted)]`}>
            {message}
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-4 py-3">
            <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--status-danger-text)]`}>
              {errorMessage}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {!processing && (
            <Button onClick={onRetry} className={TICKETING_CLASSES.button.primaryFull}>
              다시 시도
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onBackToList}
            className="h-12 rounded-[20px] border-[var(--border-base)] bg-[var(--surface-base)] text-[length:var(--ticketing-text-button)] font-semibold text-[var(--text)] hover:bg-[var(--surface-subtle)]"
          >
            티켓 목록으로 이동
          </Button>
        </div>
      </Card>
    </div>
  );
}
