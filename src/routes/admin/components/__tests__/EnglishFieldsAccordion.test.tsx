import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import EnglishFieldsAccordion from "@/routes/admin/components/EnglishFieldsAccordion"

describe("EnglishFieldsAccordion", () => {
  const fields = [
    { name: "titleEn", label: "영문 제목", value: "", multiline: false },
    { name: "contentEn", label: "영문 본문", value: "", multiline: true },
  ]

  it("비어 있을 때 자동 번역 안내를 보여준다", () => {
    const markup = renderToStaticMarkup(
      <EnglishFieldsAccordion fields={fields} isManual={false} onChange={() => {}} />,
    )

    expect(markup).toContain("자동 번역")
  })

  it("수동 입력 상태일 때 직접 입력했음을 표시한다", () => {
    const markup = renderToStaticMarkup(
      <EnglishFieldsAccordion fields={fields} isManual onChange={() => {}} />,
    )

    expect(markup).toContain("직접 입력")
  })

  it("전달받은 필드를 모두 렌더링한다", () => {
    const markup = renderToStaticMarkup(
      <EnglishFieldsAccordion fields={fields} isManual={false} onChange={() => {}} />,
    )

    expect(markup).toContain("영문 제목")
    expect(markup).toContain("영문 본문")
  })

  it("여러 줄 필드는 textarea로 렌더링한다", () => {
    const markup = renderToStaticMarkup(
      <EnglishFieldsAccordion fields={fields} isManual={false} onChange={() => {}} />,
    )

    expect(markup).toContain("<textarea")
  })
})
