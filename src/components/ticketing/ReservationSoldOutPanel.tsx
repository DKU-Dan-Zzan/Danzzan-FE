import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { TICKETING_CLASSES, TICKETING_NARROW_PANEL_CLASS } from "@/components/ticketing/ticketingShared";

interface ReservationSoldOutPanelProps {
  onBackToList: () => void;
}

export function ReservationSoldOutPanel({ onBackToList }: ReservationSoldOutPanelProps) {
  return (
    <div className={TICKETING_NARROW_PANEL_CLASS}>
      <Card className={`${TICKETING_CLASSES.card.soldout} px-5 py-6`}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--status-danger-bg)] text-[var(--status-danger)]">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h2 className={`mt-4 text-center ${TICKETING_CLASSES.typography.stateTitle} text-[var(--status-danger-text)]`}>
          예매 마감
        </h2>
        <p className={`mt-2 text-center ${TICKETING_CLASSES.typography.stateBody} text-[var(--status-danger-text)]`}>
          입력 중 정원이 마감되어 이번 신청은 완료되지 않았습니다.
          <br />
          최신 상태를 확인한 뒤 다른 일정으로 신청해 주세요.
        </p>

        <div className={`mt-5 rounded-[20px] border border-[var(--status-danger-border)] bg-white/70 px-4 py-3 ${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--status-danger-text)]`}>
          같은 화면에서 오래 머문 뒤 제출하는 경우 좌석 상태가 바뀔 수 있습니다.
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={onBackToList}
            className={TICKETING_CLASSES.button.primaryWide}
          >
            티켓 목록 다시 보기
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
