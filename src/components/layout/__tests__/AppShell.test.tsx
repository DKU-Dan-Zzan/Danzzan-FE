// 역할: AppShell 루트의 색상 스킴 data 속성 부여 동작을 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "@/components/layout/AppShell";

describe("AppShell", () => {
  it("웹앱 색상 스킴을 지정하면 루트에 data-color-scheme를 설정한다", () => {
    const markup = renderToStaticMarkup(
      <AppShell colorScheme="webapp">
        <div>content</div>
      </AppShell>,
    );

    expect(markup).toContain('data-color-scheme="webapp"');
  });

  it("색상 스킴을 지정하지 않으면 data-color-scheme를 설정하지 않는다", () => {
    const markup = renderToStaticMarkup(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(markup).not.toContain("data-color-scheme=");
  });
});
