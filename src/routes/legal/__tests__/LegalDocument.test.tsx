import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import LegalDocument from "@/routes/legal/LegalDocument";

function renderLegalDocument(pathname: string, documentType: "privacy" | "terms") {
  return renderToStaticMarkup(
    <StaticRouter location={pathname}>
      <LegalDocument documentType={documentType} />
    </StaticRouter>,
  );
}

describe("LegalDocument", () => {
  it("개인정보처리방침 화면에 문서 본문을 정적으로 렌더링하고 닫기 버튼을 노출한다", () => {
    const markup = renderLegalDocument("/legal/privacy", "privacy");

    expect(markup).toContain(">개인정보처리방침<");
    expect(markup).toContain("시행일자: 2026년 5월 1일");
    expect(markup).toContain("제1조 개인정보의 수집 및 이용목적");
    expect(markup).toContain('aria-label="닫기"');
    expect(markup).not.toContain(">내용보기<");
    expect(markup).not.toContain(">HOME<");
    expect(markup).not.toContain(">공지사항<");
    expect(markup).toContain("<table");
    expect(markup).toContain("제공받는 자");
    expect(markup).toContain("네이버 주식회사");
  });

  it("이용약관 화면은 정적 안내 문구를 렌더링한다", () => {
    const markup = renderLegalDocument("/legal/terms", "terms");

    expect(markup).toContain(">이용약관<");
    expect(markup).not.toContain("서비스 이용약관");
    expect(markup).toContain("시행일자: 2026년 5월 1일");
    expect(markup).toContain("제1조 (목적)");
  });
});
