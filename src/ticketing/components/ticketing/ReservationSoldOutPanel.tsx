import { RotateCcw, TicketX } from "lucide-react";
import { Button } from "@/ticketing/components/common/ui/button";
import { Card } from "@/ticketing/components/common/ui/card";
import { TICKETING_CLASSES, TICKETING_NARROW_PANEL_CLASS } from "@/ticketing/components/ticketing/ticketingShared";

interface ReservationSoldOutPanelProps {
  onBackToList: () => void;
}

export function ReservationSoldOutPanel({ onBackToList }: ReservationSoldOutPanelProps) {
  return (
    <div className={`${TICKETING_NARROW_PANEL_CLASS} flex min-h-[calc(100dvh-10rem)] items-center`}>
      <Card className={`${TICKETING_CLASSES.card.success} border-[var(--status-pending-border)] px-5 py-6`}>
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--status-pending-border)] bg-[linear-gradient(145deg,var(--status-pending-bg)_0%,var(--surface-base)_100%)] px-3 py-1 text-[length:var(--ticketing-text-badge)] font-semibold tracking-[0.01em] text-[var(--status-pending-text)]">
            <TicketX className="h-3.5 w-3.5" />
            SOLD OUT
          </span>
        </div>

        <div className="relative mt-4 flex items-center gap-4 rounded-[20px] border border-[var(--status-pending-border)] bg-[var(--surface-base)] px-4 py-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-[var(--status-pending-border)] bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]">
            <TicketX className="h-7 w-7" />
          </div>
          <div>
            <h2 className={`${TICKETING_CLASSES.typography.stateTitle} text-[var(--text)]`}>
              ?곗폆 留ㅼ쭊
            </h2>
            <p className={`mt-1 ${TICKETING_CLASSES.typography.stateBody} text-[var(--text-muted)]`}>
              ?ㅻⅨ ?곗폆???쇱젙? ?곗폆??紐⑸줉?먯꽌 ?뺤씤?섏떎 ???덉뼱??
            </p>
          </div>
        </div>

        <div className="relative mt-6 flex justify-center">
          <Button
            onClick={onBackToList}
            className={TICKETING_CLASSES.button.primaryWide}
          >
            ?곗폆??紐⑸줉?쇰줈 ?뚯븘媛湲?            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
