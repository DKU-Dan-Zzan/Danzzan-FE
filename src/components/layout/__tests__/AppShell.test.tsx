// 역할: AppShell의 visual variant가 기존 CSS data 속성에 연결되는지 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "@/components/layout/AppShell";

describe("AppShell", () => {
  it("웹앱 visual variant를 지정하면 루트에 data-color-scheme를 설정한다", () => {
    const markup = renderToStaticMarkup(
      <AppShell visualVariant="webapp">
        <div>content</div>
      </AppShell>,
    );

    expect(markup).toContain('data-color-scheme="webapp"');
  });

  it("electric curator visual variant를 지정하면 루트에 data-color-scheme를 설정한다", () => {
    const markup = renderToStaticMarkup(
      <AppShell visualVariant="electric-curator">
        <div>content</div>
      </AppShell>,
    );

    expect(markup).toContain('data-color-scheme="electric-curator"');
  });

  it("visual variant를 지정하지 않으면 data-color-scheme를 설정하지 않는다", () => {
    const markup = renderToStaticMarkup(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(markup).not.toContain("data-color-scheme=");
  });
});
