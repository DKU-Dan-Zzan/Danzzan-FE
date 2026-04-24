// 역할: 예매 진행 패널의 필수 동의 노출과 제출 가능 조건을 검증합니다.
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TicketingReservationPanel } from "@/components/ticketing/panels/TicketingReservationPanel";

const renderPanel = ({
  agreementChecked = false,
  thirdPartyPrivacyConsentChecked = false,
}: {
  agreementChecked?: boolean;
  thirdPartyPrivacyConsentChecked?: boolean;
}) =>
  renderToStaticMarkup(
    <TicketingReservationPanel
      eventTitle="메인 이벤트"
      eventDate="2026년 05월 13일"
      agreementChecked={agreementChecked}
      thirdPartyPrivacyConsentChecked={thirdPartyPrivacyConsentChecked}
      submitting={false}
      errorMessage={null}
      onAgreementCheckedChange={vi.fn()}
      onThirdPartyPrivacyConsentCheckedChange={vi.fn()}
      onSubmit={vi.fn()}
    />,
  );

describe("TicketingReservationPanel", () => {
  it("필수 동의 항목과 개인정보 제3자 제공 상세 진입 버튼을 노출한다", () => {
    const markup = renderPanel({});

    expect(markup).toContain("[필수] 위 사항들을 숙지했습니다.");
    expect(markup).toContain("[필수] 개인정보의 제3자 제공에 대한 동의");
    expect(markup).toContain('aria-label="개인정보 제3자 제공 동의 상세 열기"');
    expect(markup).not.toContain("제공받는 자: 네이버 주식회사");
  });

  it("기존 동의와 개인정보 제3자 제공 동의가 모두 체크되어야 예매 버튼을 활성화한다", () => {
    const missingThirdPartyConsentMarkup = renderPanel({
      agreementChecked: true,
      thirdPartyPrivacyConsentChecked: false,
    });
    const readyMarkup = renderPanel({
      agreementChecked: true,
      thirdPartyPrivacyConsentChecked: true,
    });

    expect(missingThirdPartyConsentMarkup).toMatch(/<button[^>]*disabled=""[^>]*>예매 완료<\/button>/);
    expect(readyMarkup).not.toMatch(/<button[^>]*disabled=""[^>]*>예매 완료<\/button>/);
  });
});
