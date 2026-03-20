import type { ReactNode } from "react";
import { AppHeaderLogo } from "@/components/layout/AppHeaderLogo";

type AppTopBarProps = {
  children?: ReactNode;
  title?: string;
  showSafeAreaOverlay?: boolean;
  headerClassName?: string;
  containerClassName?: string;
};

export function AppTopBar({
  children,
  title,
  showSafeAreaOverlay = false,
  headerClassName = "sticky top-0 z-50 border-b border-[var(--app-header-border)] bg-[var(--app-header-bg)] [background-image:var(--app-header-bg-gradient)] bg-no-repeat bg-[length:100%_100%] pt-[env(safe-area-inset-top)]",
  containerClassName = "relative mx-auto h-16 max-w-[430px] px-4",
}: AppTopBarProps) {
  return (
    <>
      {showSafeAreaOverlay && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[max(env(safe-area-inset-top),2.75rem)] bg-[var(--app-header-bg)] [background-image:var(--app-header-bg-gradient)] bg-no-repeat bg-[length:100%_100%] sm:hidden"
        />
      )}
      <header className={headerClassName}>
        <div className={containerClassName}>
          <AppHeaderLogo />
          {children}
          {title && <h1 className="sr-only">{title}</h1>}
        </div>
      </header>
    </>
  );
}
