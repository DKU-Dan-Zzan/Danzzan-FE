import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/components/ticketing/common/ui/utils";

type AuthTab = "login" | "signup";

interface AuthSegmentedControlProps {
  activeTab: AuthTab;
}

const getTabIndex = (tab: AuthTab): number => (tab === "login" ? 0 : 1);

export function AuthSegmentedControl({ activeTab }: AuthSegmentedControlProps) {
  const location = useLocation();
  const activeIndex = getTabIndex(activeTab);
  const [indicatorIndex, setIndicatorIndex] = useState(activeIndex);

  useEffect(() => {
    const from = (location.state as { authTabFrom?: AuthTab } | null)?.authTabFrom;

    if (!from || from === activeTab) {
      setIndicatorIndex(activeIndex);
      return;
    }

    setIndicatorIndex(getTabIndex(from));
    const rafId = window.requestAnimationFrame(() => {
      setIndicatorIndex(activeIndex);
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [activeIndex, activeTab, location.state]);

  return (
    <div className="relative grid grid-cols-2 rounded-2xl border border-[var(--border-base)] bg-[linear-gradient(145deg,var(--surface-tint-base)_0%,var(--surface-base)_100%)] p-1">
      <div
        className="absolute left-1 top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-xl border border-[var(--border-strong)] bg-[var(--surface-subtle)] shadow-[0_12px_20px_-16px_var(--shadow-color)] transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${indicatorIndex * 100}%)` }}
      />

      <Link
        to="/ticket/login"
        state={{ authTabFrom: activeTab }}
        className={cn(
          "relative z-10 flex min-h-11 items-center justify-center rounded-xl px-3 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40",
          activeTab === "login" ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text)]",
        )}
      >
        로그인
      </Link>
      <Link
        to="/ticket/signup"
        state={{ authTabFrom: activeTab }}
        className={cn(
          "relative z-10 flex min-h-11 items-center justify-center rounded-xl px-3 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40",
          activeTab === "signup" ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text)]",
        )}
      >
        회원가입
      </Link>
    </div>
  );
}
