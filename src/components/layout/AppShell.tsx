// 역할: 앱 레이아웃 레이어의 App Shell 구성 컴포넌트를 제공합니다.
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  bottomNav?: ReactNode;
  rootClassName?: string;
  frameClassName?: string;
  mainClassName?: string;
};

export function AppShell({
  children,
  header,
  footer,
  bottomNav,
  rootClassName = "min-h-dvh bg-[var(--bg-page-soft)]",
  frameClassName = "mx-auto flex min-h-dvh max-w-[430px] flex-col bg-[var(--bg-page-soft)]",
  mainClassName = "flex-1 overflow-x-hidden [&>*]:min-h-full",
}: AppShellProps) {
  return (
    <div className={rootClassName}>
      <div className={frameClassName}>
        {header}
        <main className={mainClassName}>{children}</main>
        {footer}
        {bottomNav}
      </div>
    </div>
  );
}
