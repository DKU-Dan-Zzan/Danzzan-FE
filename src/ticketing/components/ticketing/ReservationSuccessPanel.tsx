import { ArrowRight, CheckCircle2, ShieldCheck, Ticket } from "lucide-react";
import { Button } from "@/ticketing/components/common/ui/button";
import { Card } from "@/ticketing/components/common/ui/card";
import { TICKETING_CLASSES, TICKETING_NARROW_PANEL_CLASS } from "@/ticketing/components/ticketing/ticketingShared";

interface ReservationSuccessPanelProps {
  onGoMyTickets: () => void;
}

export function ReservationSuccessPanel({
  onGoMyTickets,
}: ReservationSuccessPanelProps) {
  return (
    <div className={`${TICKETING_NARROW_PANEL_CLASS} flex min-h-[calc(100dvh-10rem)] items-center`}>
      <Card className={`${TICKETING_CLASSES.card.success} px-5 py-6`}>
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-strong)_100%)] px-3 py-1 text-[length:var(--ticketing-text-badge)] font-semibold tracking-[0.01em] text-[var(--accent)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            ?덉빟 ?꾨즺
          </span>
        </div>

        <div className="relative mt-4 flex items-center gap-4 rounded-[20px] border border-[var(--border-base)] bg-[var(--surface-base)] px-4 py-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[var(--accent)] text-white shadow-[0_12px_20px_-14px_var(--shadow-color)]">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className={`${TICKETING_CLASSES.typography.stateTitle} text-[var(--text)]`}>
              ?곗폆???깃났
            </h2>
            <p className={`mt-1 ${TICKETING_CLASSES.typography.stateBody} text-[var(--text-muted)]`}>
              ?덈ℓ媛 ?꾨즺?섏뿀?듬땲?? ?꾨옒?먯꽌 ?ㅼ쓬 ?④퀎瑜?吏꾪뻾?섏꽭??
            </p>
          </div>
        </div>

        <div className="relative mt-5 rounded-[20px] border border-[var(--border-base)] bg-[var(--surface-base)] px-4 py-4">
          <p className={`${TICKETING_CLASSES.typography.overline} text-[var(--accent)]`}>NEXT STEP</p>
          <ul className={`mt-2 space-y-2.5 ${TICKETING_CLASSES.typography.sectionBody} text-[var(--text-muted)]`}>
            <li className="flex items-start gap-2.5">
              <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
              <span>???곗폆?먯꽌 諛쒓툒 ?곹깭? ?곸꽭 ?뺣낫瑜??뺤씤?섏꽭??</span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
              <span>怨듭뿰 ?뱀씪 ?좊텇利?誘몄?李????낆옣???쒗븳?????덉뒿?덈떎.</span>
            </li>
          </ul>
        </div>

        <div className="relative mt-6 flex justify-center">
          <Button
            onClick={onGoMyTickets}
            className={TICKETING_CLASSES.button.primaryWide}
          >
            ???곗폆 ?뺤씤?섍린
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
