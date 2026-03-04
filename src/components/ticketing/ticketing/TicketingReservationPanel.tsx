import { Button } from "@/components/ticketing/common/ui/button";
import { Card } from "@/components/ticketing/common/ui/card";
import { Checkbox } from "@/components/ticketing/common/ui/checkbox";
import { cn } from "@/components/ticketing/common/ui/utils";
import {
  TICKETING_CLASSES,
  TICKETING_NARROW_PANEL_CLASS,
  TicketingStepTitle,
} from "@/components/ticketing/ticketing/ticketingShared";

interface TicketingReservationPanelProps {
  eventTitle: string;
  agreementChecked: boolean;
  submitting: boolean;
  errorMessage: string | null;
  onAgreementCheckedChange: (checked: boolean) => void;
  onSubmit: () => void;
}

const DEFAULT_CAUTION_ITEMS = [
  "단국대학교 죽전캠퍼스 재학생(졸업생, 휴학생 제외)만 신청할 수 있습니다.",
  "이름, 학번, 연락처가 가입 정보와 다르면 입장이 제한될 수 있습니다.",
  "비인가 프로그램(매크로 등) 사용 시 이벤트 참여에서 제외됩니다.",
  "신청 후 티켓 양도 및 취소는 불가합니다.",
];

const MAY_13_CAUTION_ITEMS = [
  "단국대학교 죽전캠퍼스 재학생(졸업생, 휴학생 불가)만 신청할 수 있습니다.",
  "이름, 학번, 학과, 전화번호 등 홈페이지 가입 시 입력한 정보가 정확하지 않을 경우 이벤트 참여에 제한이 있을 수 있습니다.",
  "비인가 경로(캡처 이미지, 타인 양도 등)를 통한 티켓 사용은 불가합니다.",
  "비인가 프로그램(매크로 등)을 사용하여 비정상적인 경로로 티켓팅을 시도한 경우, 사전 고지 없이 이벤트 참여에서 제외됩니다.",
  "신분증 미지참 또는 정보 불일치 시 입장이 제한될 수 있습니다.",
  "5월 13일, 5월 14일 양일 각각 단국존 신청이 가능하며, 1인당 예매 가능한 티켓 수는 각 일자별로 1인 1매입니다.",
  "티켓 예매 일정 및 세부 운영 방식은 별도 공지를 통해 안내됩니다.",
  "공연 당일 현장 운영 지침에 따라 입장 절차가 진행되며, 안전상의 사유로 입장이 지연되거나 제한될 수 있습니다.",
  "본 예매는 2026년 05월 13일 단국존 선예매 티켓팅임을 확인했습니다.",
];

const MAY_13_POLICY_INTRO =
  "본 공연의 주최·주관은 단국대학교 제58대 LOU:D 총학생회이며, <2026 DANFESTA> 티켓은 공식 예매 경로를 통해서만 유효합니다.";

const MAY_13_POLICY_RISK_INTRO =
  "최근 온라인 커뮤니티, SNS, 중고 거래 플랫폼 등을 통한 티켓 매매 시도가 확인되고 있습니다. 비공식 경로를 통한 거래는 다음과 같은 문제가 발생할 수 있습니다.";

const MAY_13_POLICY_RISK_ITEMS = [
  "위·변조 티켓 사용으로 인한 입장 거부",
  "동일 QR코드 중복 사용으로 인한 무효 처리",
  "개인정보 유출 및 금전적 피해 발생",
];

const MAY_13_POLICY_ACTION_ITEMS = [
  "티켓 양도·재판매·대리 구매 행위는 엄격히 금지됩니다.",
  "부정 거래가 확인될 경우 해당 티켓은 사전 통보 없이 취소될 수 있으며, 향후 총학생회 주관 행사 참여가 제한될 수 있습니다.",
  "부정 거래로 인한 피해 발생 시 LOU:D 총학생회는 책임지지 않습니다.",
];

const MAY_13_POLICY_OUTRO =
  "공정하고 안전한 축제 운영을 위해 학우 여러분의 협조를 요청드립니다.";

const DEFAULT_POLICY_ITEMS = [
  "본 공연 티켓의 양도·재판매·대리 구매 및 금전 거래는 엄격히 금지됩니다.",
  "공식 절차 외 부정한 방법으로 확인된 티켓은 예고 없이 취소될 수 있습니다.",
];

export function TicketingReservationPanel({
  eventTitle,
  agreementChecked,
  submitting,
  errorMessage,
  onAgreementCheckedChange,
  onSubmit,
}: TicketingReservationPanelProps) {
  const isMay13Ticket = eventTitle.includes("5월 13일");
  const isSubmitEnabled = !submitting && agreementChecked;
  const cautionItems = isMay13Ticket ? MAY_13_CAUTION_ITEMS : DEFAULT_CAUTION_ITEMS;

  return (
    <div className={`${TICKETING_NARROW_PANEL_CLASS} space-y-4`}>
      <div>
        <div>
          <h2 className={`${TICKETING_CLASSES.typography.heroTitle} text-[var(--text)]`}>예매 진행 중</h2>
          <p className={`mt-0.5 ${TICKETING_CLASSES.typography.sectionBody} text-[var(--text-muted)]`}>
            주의사항과 방침을 확인한 뒤 동의 체크 후 예매를 완료하세요.
          </p>
        </div>
      </div>

      <Card className="border-[var(--border-base)] bg-[var(--surface-base)] p-6 shadow-[0_10px_20px_-16px_var(--shadow-color)]">
        <div>
          <section className="space-y-2">
            <TicketingStepTitle step={1} title="주의사항" />
            <div className="rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-4 py-3">
              <ul className={`space-y-1.5 ${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--status-warning-text)]`}>
                {cautionItems.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-5 space-y-2 border-t border-[var(--border-subtle)] pt-4">
            <TicketingStepTitle step={2} title="부정거래 관련 방침 안내" />
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3">
              <div
                className={cn(
                  `max-h-44 space-y-2 overflow-y-scroll pr-2 ${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`,
                  "[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:var(--accent)_var(--surface-tint-subtle)]",
                  "[&::-webkit-scrollbar]:w-2",
                  "[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[var(--surface-tint-subtle)]",
                  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--accent)]",
                )}
              >
                {isMay13Ticket ? (
                  <>
                    <p>{MAY_13_POLICY_INTRO}</p>
                    <p>{MAY_13_POLICY_RISK_INTRO}</p>
                    <ul className="space-y-1.5">
                      {MAY_13_POLICY_RISK_ITEMS.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                    <p>이에 따라,</p>
                    <ul className="space-y-1.5">
                      {MAY_13_POLICY_ACTION_ITEMS.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                    <p>{MAY_13_POLICY_OUTRO}</p>
                  </>
                ) : (
                  <ul className="space-y-1.5">
                    {DEFAULT_POLICY_ITEMS.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                )}
              </div>
              <p className={`mt-2 ${TICKETING_CLASSES.typography.helper} text-[var(--text-muted)]`}>스크롤하여 전체 방침을 확인하세요.</p>
            </div>
          </section>

          <section className="mt-5 space-y-3 border-t border-[var(--border-subtle)] pt-4">
            <TicketingStepTitle step={3} title="동의 확인" />
            <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>
              아래 항목을 체크하면 예매를 진행할 수 있습니다.
            </p>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 py-3">
              <Checkbox
                checked={agreementChecked}
                disabled={submitting}
                onCheckedChange={(checked) => onAgreementCheckedChange(Boolean(checked))}
                className="h-5 w-5 rounded-[6px] border-[var(--border-strong)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)]"
              />
              <span className={`${TICKETING_CLASSES.typography.sectionBodySm} font-semibold text-[var(--text)]`}>
                위 사항들을 숙지했습니다.
              </span>
            </label>

            {errorMessage && <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--status-danger-text)]`}>{errorMessage}</p>}

            <Button
              className={cn(
                isSubmitEnabled
                  ? TICKETING_CLASSES.button.submitEnabled
                  : TICKETING_CLASSES.button.submitDisabled,
              )}
              onClick={onSubmit}
              disabled={!isSubmitEnabled}
            >
              {submitting ? "예매 처리 중..." : "예매 완료"}
            </Button>
          </section>
        </div>
      </Card>
    </div>
  );
}
