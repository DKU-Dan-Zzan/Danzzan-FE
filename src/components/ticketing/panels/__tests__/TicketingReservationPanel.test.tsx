// 역할: 예매 진행 패널의 필수 동의 UI와 제출 가능 조건을 검증합니다.
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TicketingReservationPanel } from "@/components/ticketing/panels/TicketingReservationPanel";

const PANEL_SOURCE = readFileSync(
  new URL("../TicketingReservationPanel.tsx", import.meta.url),
  "utf8",
);

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
  it("개인정보 제3자 제공 동의를 4단계 필수 항목과 아이콘 상세 진입으로 노출한다", () => {
    const markup = renderPanel({});

    expect(markup).toContain("개인정보 제3자 제공 동의");
    expect(markup).toContain("[필수] 개인정보의 제3자 제공에 대한 동의");
    expect(markup).not.toContain("제공받는 자: 네이버 주식회사");
    expect(markup).toContain('aria-label="개인정보 제3자 제공 동의 상세 열기"');
    expect(markup).not.toContain(">상세보기<");
  });

  it("필수 동의 라벨은 같은 텍스트 스타일을 공유한다", () => {
    const markup = renderPanel({});
    const sharedLabelClass = "text-[length:calc(var(--ticketing-text-section-body-sm)+2pt)] font-semibold text-[var(--text)]";

    expect(markup).toContain("[필수] 위 사항들을 숙지했습니다.");
    expect(markup).toContain("[필수] 개인정보의 제3자 제공에 대한 동의");
    expect(PANEL_SOURCE).toContain(`const AGREEMENT_LABEL_TEXT_CLASS = "${sharedLabelClass}";`);
    expect(PANEL_SOURCE).toContain("className={AGREEMENT_LABEL_TEXT_CLASS}");
    expect(PANEL_SOURCE).toContain("className={cn(\"cursor-pointer\", AGREEMENT_LABEL_TEXT_CLASS)}");
  });

  it("개인정보 제3자 제공 상세 바텀시트는 하단 네비게이션 위에서 열린다", () => {
    expect(PANEL_SOURCE).toContain("bottom-[var(--app-bottom-nav-runtime-offset)]");
    expect(PANEL_SOURCE).toContain("max-h-[calc(100dvh-var(--app-bottom-nav-runtime-offset)-1rem)]");
    expect(PANEL_SOURCE).toContain("overlayClassName=\"z-40");
    expect(PANEL_SOURCE).toContain("z-[45]");
  });

  it("개인정보 제3자 제공 상세 바텀시트는 레퍼런스 스타일의 흐림 오버레이와 큰 라운드를 사용한다", () => {
    expect(PANEL_SOURCE).toContain("overlayClassName=\"z-40 bg-[rgba(15,23,42,0.36)] backdrop-blur-[7px]\"");
    expect(PANEL_SOURCE).toContain("handleClassName=\"mt-3 h-1.5 w-12 bg-[#e9eef6]\"");
    expect(PANEL_SOURCE).toContain("rounded-t-[2.25rem]");
    expect(PANEL_SOURCE).toContain("border-transparent bg-[#fbfcff]");
    expect(PANEL_SOURCE).toContain("text-[1.05rem] leading-[1.25] font-extrabold text-[var(--text-body-deep)]");
    expect(PANEL_SOURCE).toContain("bg-[#f3f6fb] text-[#68748e]");
  });

  it("개인정보 제3자 제공 상세 바텀시트 제목에서는 필수 접두사를 제외한다", () => {
    expect(PANEL_SOURCE).toContain('const THIRD_PARTY_PRIVACY_CONSENT_DETAIL_TITLE = "개인정보의 제3자 제공에 대한 동의";');
    expect(PANEL_SOURCE).toContain("{THIRD_PARTY_PRIVACY_CONSENT_DETAIL_TITLE}");
  });

  it("개인정보 제3자 제공 상세 표는 가로 스크롤 없이 바텀시트 폭에 맞춘다", () => {
    expect(PANEL_SOURCE).not.toContain("overflow-x-auto");
    expect(PANEL_SOURCE).not.toContain("min-w-[42rem]");
    expect(PANEL_SOURCE).toContain("w-full table-fixed");
  });

  it("개인정보 제3자 제공 상세 표 글씨는 모바일에서도 읽기 쉬운 크기를 사용한다", () => {
    expect(PANEL_SOURCE).not.toContain("text-[0.625rem]");
    expect(PANEL_SOURCE).toContain("text-[0.72rem] leading-[1.42] sm:text-[0.76rem]");
    expect(PANEL_SOURCE).toContain("px-1 py-2.5");
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
