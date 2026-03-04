import { LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/ticketing/components/common/ui/button";
import { Card } from "@/ticketing/components/common/ui/card";
import { TICKETING_CLASSES, TICKETING_NARROW_PANEL_CLASS } from "@/ticketing/components/ticketing/ticketingShared";

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
            ?덈ℓ ?붿껌 泥섎━ 以?          </h2>
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
              ?ㅼ떆 ?쒕룄
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onBackToList}
            className="h-12 rounded-[20px] border-[var(--border-base)] bg-[var(--surface-base)] text-[length:var(--ticketing-text-button)] font-semibold text-[var(--text)] hover:bg-[var(--surface-subtle)]"
          >
            ?곗폆 紐⑸줉?쇰줈 ?대룞
          </Button>
        </div>
      </Card>
    </div>
  );
}
