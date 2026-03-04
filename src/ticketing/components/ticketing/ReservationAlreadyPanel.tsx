import { ArrowRight, CheckCircle2, ListChecks } from "lucide-react";
import { Button } from "@/ticketing/components/common/ui/button";
import { Card } from "@/ticketing/components/common/ui/card";
import { TICKETING_CLASSES, TICKETING_NARROW_PANEL_CLASS } from "@/ticketing/components/ticketing/ticketingShared";

interface ReservationAlreadyPanelProps {
  onGoMyTickets: () => void;
  onBackToList: () => void;
}

export function ReservationAlreadyPanel({
  onGoMyTickets,
  onBackToList,
}: ReservationAlreadyPanelProps) {
  return (
    <div className={TICKETING_NARROW_PANEL_CLASS}>
      <Card className={`${TICKETING_CLASSES.card.success} gap-4 px-5 py-6`}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--status-success-bg)] text-[var(--status-success)]">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div>
          <h2 className={`text-center ${TICKETING_CLASSES.typography.stateTitle} text-[var(--text)]`}>
            ?대? 泥섎━???덈ℓ?낅땲??          </h2>
          <p className={`mt-2 text-center ${TICKETING_CLASSES.typography.stateBody} text-[var(--text-muted)]`}>
            ?대떦 怨듭뿰 ?곗폆? ?대? ?덈ℓ媛 吏꾪뻾???곹깭?낅땲??
            <br />
            ???곗폆 ?붾㈃?먯꽌 ?곹깭瑜??뺤씤?댁＜?몄슂.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onGoMyTickets} className={TICKETING_CLASSES.button.primaryFull}>
            ???곗폆 ?뺤씤?섍린
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={onBackToList}
            className="h-12 rounded-[20px] border-[var(--border-base)] bg-[var(--surface-base)] text-[length:var(--ticketing-text-button)] font-semibold text-[var(--text)] hover:bg-[var(--surface-subtle)]"
          >
            ?곗폆 紐⑸줉?쇰줈 ?뚯븘媛湲?            <ListChecks className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
