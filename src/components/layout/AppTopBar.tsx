// 역할: 앱 레이아웃 레이어의 App Top Bar 구성 컴포넌트를 제공합니다.
import type { ReactNode } from "react";
import { AppHeaderLogo } from "@/components/layout/AppHeaderLogo";

type AppTopBarProps = {
  children?: ReactNode;
  title?: string;
  showSafeAreaOverlay?: boolean;
  headerClassName?: string;
  containerClassName?: string;
  showLogo?: boolean;
};

export function AppTopBar({
  children,
  title,
  showSafeAreaOverlay = false,
  headerClassName = "sticky top-0 z-50 bg-transparent [background-image:none] shadow-none pt-[env(safe-area-inset-top)]",
  containerClassName = "relative mx-auto h-[68px] max-w-[430px] px-4",
  showLogo = true,
}: AppTopBarProps) {
  return (
    <>
      {showSafeAreaOverlay && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[max(env(safe-area-inset-top),2.75rem)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_66%,transparent)_0%,color-mix(in_srgb,var(--surface)_42%,transparent)_44%,color-mix(in_srgb,var(--surface)_16%,transparent)_100%)] sm:hidden"
        />
      )}
      <header className={headerClassName}>
        <div className={containerClassName}>
          {showLogo && <AppHeaderLogo />}
          {children}
          {title && <h1 className="sr-only">{title}</h1>}
        </div>
      </header>
    </>
  );
}
