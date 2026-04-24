// 역할: 약관 동의/입력 검증/예매 요청 전송을 처리하는 예매 진행 패널입니다.
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { Checkbox } from "@/components/common/ui/checkbox";
import { cn } from "@/components/common/ui/utils";
import { APP_CARD_VARIANTS } from "@/components/common/ui/appCardVariants";
import {
  TICKETING_CLASSES,
  TICKETING_NARROW_PANEL_CLASS,
  TicketingStepTitle,
} from "@/components/ticketing/panels/TicketingShared";

interface TicketingReservationPanelProps {
  eventTitle: string;
  eventDate?: string;
  agreementChecked: boolean;
  thirdPartyPrivacyConsentChecked: boolean;
  submitting: boolean;
  errorMessage: string | null;
  onAgreementCheckedChange: (checked: boolean) => void;
  onThirdPartyPrivacyConsentCheckedChange: (checked: boolean) => void;
  onSubmit: () => void;
}

const DEFAULT_CAUTION_ITEMS = [
  "단국대학교 죽전캠퍼스 재학생(졸업생, 휴학생 제외)만 신청할 수 있습니다.",
  "이름, 학번, 연락처가 가입 정보와 다르면 입장이 제한될 수 있습니다.",
  "비인가 프로그램(매크로 등) 사용 시 이벤트 참여에서 제외됩니다.",
  "신청 후 티켓 양도 및 취소는 불가합니다.",
];

const FESTIVAL_TICKET_COMMON_CAUTION_ITEMS = [
  "단국대학교 죽전캠퍼스 재학생(졸업생, 휴학생 불가)만 신청할 수 있습니다.",
  "이름, 학번, 학과, 전화번호 등 홈페이지 가입 시 입력한 정보가 정확하지 않을 경우 이벤트 참여에 제한이 있을 수 있습니다.",
  "캡쳐 및 양도를 통한 티켓 사용 시 팔찌 배부가 제한됩니다.",
  "비인가 프로그램(매크로 등)을 사용하여 비정상적인 경로로 티켓팅을 시도한 경우, 사전 고지 없이 이벤트 참여에서 제외됩니다.",
  "5월 13일, 5월 14일 양일 각각 단국존 신청이 가능하며, 1인당 예매 가능한 티켓 수는 각 일자별로 1인 1매입니다.",
  "티켓 배부 일정 및 세부 운영 방식은 별도 공지를 통해 안내됩니다.",
  "공연 당일 현장 운영 지침에 따라 입장 절차가 진행되며, 안전상의 사유로 입장이 지연되거나 제한될 수 있습니다.",
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

const AGREEMENT_LABEL_TEXT_CLASS = "text-[var(--text)]";
const AGREEMENT_LABEL_TEXT_STYLE = { fontSize: "14px", fontWeight: 700, lineHeight: "1.45" } as const;
const AGREEMENT_CARD_CLASS = `${APP_CARD_VARIANTS.outline} flex min-h-[56px] items-center gap-2.5 rounded-xl px-3 py-3`;

const THIRD_PARTY_PRIVACY_CONSENT_TITLE = "[필수] 개인정보의 제3자 제공에 대한 동의";
const THIRD_PARTY_PRIVACY_CONSENT_DETAIL_TITLE = "개인정보의 제3자 제공에 대한 동의";

const THIRD_PARTY_PRIVACY_CONSENT_BODY =
  "총학생회는 개인정보를 개인정보 수집·이용 목적에서 명시한 범위 내에서 사용하며, 이용자의 사전 동의 없이 목적 범위를 초과하여 이용하거나 원칙적으로 이용자의 개인정보를 제공하지 않습니다. 다만, 아래와 같이 양질의 서비스 제공을 위해 이용자의 개인정보를 공유할 필요가 있는 경우에는 필요한 범위 내에서 개인정보를 제3자에게 제공하고 있습니다.";

const THIRD_PARTY_PRIVACY_TABLE_ROWS = [
  {
    recipient: "네이버 주식회사",
    purpose: "축제 행사장(단국존) 입장 관리 및 팔찌 배부 시 본인인증(Face ID) 서비스 연계",
    items: "학번, 네이버 아이디",
    retention: "축제 종료 후 2026년 12월 31일까지",
  },
];

const THIRD_PARTY_PRIVACY_NAVER_NOTICE =
  "※ 네이버 주식회사가 제공하는 본인인증(Face ID) 서비스 이용 과정에서 얼굴 생체정보 등의 추가 정보는 네이버 주식회사가 정보주체로부터 직접 수집·처리하며, 이에 관한 사항은 네이버 주식회사의 개인정보처리방침 및 이용약관이 적용됩니다.";

const THIRD_PARTY_PRIVACY_REFUSAL_NOTICE =
  "동의를 거부할 권리가 있으며, 거부 시 축제 행사장 입장 및 팔찌 배부가 불가하여 본 서비스 중 축제 입출입 관련 기능 이용이 제한됩니다.";

function ThirdPartyPrivacyConsentDetail({ onAgree }: { onAgree: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const closeDetail = () => setIsOpen(false);
  const agreeAndClose = () => {
    onAgree();
    closeDetail();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="개인정보 제3자 제공 동의 상세 열기"
        className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[16px] font-normal text-[color:color-mix(in_srgb,var(--text-muted)_48%,transparent)] transition-colors hover:bg-[var(--surface_container)] hover:text-[var(--text-muted)]"
      >
        &gt;
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
          role="button"
          tabIndex={-1}
          aria-label="개인정보 제3자 제공 동의 상세 닫기"
          onClick={closeDetail}
          onKeyDown={(event) => event.key === "Escape" && closeDetail()}
        >
          <div
            className="flex h-[70vh] w-full max-w-[var(--ticketing-mobile-shell-max-width)] flex-col rounded-t-[28px] bg-[var(--surface_container_lowest)] pt-3 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_40px_rgba(0,0,0,0.18)]"
            role="presentation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[color:color-mix(in_srgb,var(--border-base)_60%,transparent)] px-5 py-3">
              <p className="pr-4 text-[15px] font-bold leading-tight text-[var(--text)]">
                {THIRD_PARTY_PRIVACY_CONSENT_DETAIL_TITLE}
              </p>
              <button
                type="button"
                onClick={closeDetail}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface_container)] text-[var(--text-muted)]"
                aria-label="개인정보 제3자 제공 동의 상세 닫기"
              >
                <X className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className={`space-y-4 ${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>
                <p>{THIRD_PARTY_PRIVACY_CONSENT_BODY}</p>

                <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
                  <table className="w-full table-fixed border-collapse text-left text-[0.72rem] leading-[1.42] sm:text-[0.76rem]">
                    <colgroup>
                      <col className="w-[18%]" />
                      <col className="w-[36%]" />
                      <col className="w-[20%]" />
                      <col className="w-[26%]" />
                    </colgroup>
                    <thead className="bg-[var(--surface-subtle)] text-[var(--text)]">
                      <tr>
                        <th scope="col" className="border-r border-[var(--border-subtle)] px-1 py-2.5 font-bold break-words">
                          제공받는 자
                        </th>
                        <th scope="col" className="border-r border-[var(--border-subtle)] px-1 py-2.5 font-bold break-words">
                          제공 목적
                        </th>
                        <th scope="col" className="border-r border-[var(--border-subtle)] px-1 py-2.5 font-bold break-words">
                          제공 항목
                        </th>
                        <th scope="col" className="px-1 py-2.5 font-bold break-words">
                          보유 및 이용 기간
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {THIRD_PARTY_PRIVACY_TABLE_ROWS.map((row) => (
                        <tr key={row.recipient} className="bg-[var(--surface-base)]">
                          <td className="border-t border-r border-[var(--border-subtle)] px-1 py-2.5 align-top break-words text-[var(--text-muted)]">
                            {row.recipient}
                          </td>
                          <td className="border-t border-r border-[var(--border-subtle)] px-1 py-2.5 align-top break-words text-[var(--text-muted)]">
                            {row.purpose}
                          </td>
                          <td className="border-t border-r border-[var(--border-subtle)] px-1 py-2.5 align-top break-words text-[var(--text-muted)]">
                            {row.items}
                          </td>
                          <td className="border-t border-[var(--border-subtle)] px-1 py-2.5 align-top break-words text-[var(--text-muted)]">
                            {row.retention}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p>{THIRD_PARTY_PRIVACY_NAVER_NOTICE}</p>
                <p className="font-semibold text-[var(--status-danger-text)]">
                  {THIRD_PARTY_PRIVACY_REFUSAL_NOTICE}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={agreeAndClose}
              className="mx-5 my-4 h-11 rounded-2xl bg-[linear-gradient(145deg,var(--ticketing-action-bg-start)_0%,var(--ticketing-action-bg-end)_100%)] text-[15px] font-semibold text-white"
            >
              동의
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function TicketingReservationPanel({
  eventTitle,
  eventDate = "",
  agreementChecked,
  thirdPartyPrivacyConsentChecked,
  submitting,
  errorMessage,
  onAgreementCheckedChange,
  onThirdPartyPrivacyConsentCheckedChange,
  onSubmit,
}: TicketingReservationPanelProps) {
  const ticketDateSource = `${eventDate} ${eventTitle}`;
  const isMay13Ticket = /5\s*월\s*13\s*일/.test(ticketDateSource);
  const isMay14Ticket = /5\s*월\s*14\s*일/.test(ticketDateSource);
  const isFestivalTicket = isMay13Ticket || isMay14Ticket;
  const isSubmitEnabled = !submitting && agreementChecked && thirdPartyPrivacyConsentChecked;
  const festivalConfirmationLine = isMay13Ticket
    ? "본 예매는 2026년 05월 13일 단국존 선예매 티켓팅임을 확인했습니다."
    : isMay14Ticket
      ? "본 예매는 2026년 05월 14일 단국존 선예매 티켓팅임을 확인했습니다."
      : null;
  const cautionItems = isFestivalTicket
    ? [
        ...FESTIVAL_TICKET_COMMON_CAUTION_ITEMS,
        ...(festivalConfirmationLine ? [festivalConfirmationLine] : []),
      ]
    : DEFAULT_CAUTION_ITEMS;

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
                {isFestivalTicket ? (
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
              주의사항과 부정거래 관련 방침을 확인한 뒤 체크해주세요.
            </p>
            <label className={cn(AGREEMENT_CARD_CLASS, "cursor-pointer")}>
              <Checkbox
                checked={agreementChecked}
                disabled={submitting}
                onCheckedChange={(checked) => onAgreementCheckedChange(Boolean(checked))}
                className="h-5 w-5 rounded-[6px] border-[var(--border-strong)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)]"
              />
              <span className={AGREEMENT_LABEL_TEXT_CLASS} style={AGREEMENT_LABEL_TEXT_STYLE}>
                [필수] 위 사항들을 숙지했습니다.
              </span>
            </label>
          </section>

          <section className="mt-5 space-y-3 border-t border-[var(--border-subtle)] pt-4">
            <TicketingStepTitle step={4} title="개인정보 제3자 제공 동의" />
            <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>
              축제 행사장 입장 관리 및 팔찌 배부를 위해 아래 필수 동의를 확인해주세요.
            </p>
            <div className={cn(AGREEMENT_CARD_CLASS, "relative pr-12")}>
              <Checkbox
                id="thirdPartyPrivacyConsent"
                checked={thirdPartyPrivacyConsentChecked}
                disabled={submitting}
                onCheckedChange={(checked) => onThirdPartyPrivacyConsentCheckedChange(Boolean(checked))}
                className="h-5 w-5 rounded-[6px] border-[var(--border-strong)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)]"
              />
              <label
                htmlFor="thirdPartyPrivacyConsent"
                className="min-w-0 flex-1 cursor-pointer"
              >
                <span className={AGREEMENT_LABEL_TEXT_CLASS} style={AGREEMENT_LABEL_TEXT_STYLE}>
                  {THIRD_PARTY_PRIVACY_CONSENT_TITLE}
                </span>
              </label>
              <ThirdPartyPrivacyConsentDetail
                onAgree={() => onThirdPartyPrivacyConsentCheckedChange(true)}
              />
            </div>

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
