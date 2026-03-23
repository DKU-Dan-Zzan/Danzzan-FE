// 역할: 지연 노출 조건을 지원하는 공용 로딩 스피너 컴포넌트를 제공합니다.
import { useEffect, useState } from "react";
import { cn } from "@/components/common/ui/utils";

type DelayedSpinnerProps = {
  delayMs?: number;
  label?: string;
  containerClassName?: string;
  spinnerClassName?: string;
};

const DEFAULT_CONTAINER_CLASS = "flex min-h-dvh items-center justify-center";
const DEFAULT_SPINNER_CLASS =
  "h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]";

export default function DelayedSpinner({
  delayMs = 300,
  label = "페이지 전환 중",
  containerClassName,
  spinnerClassName,
}: DelayedSpinnerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisible(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delayMs]);

  if (!visible) {
    return null;
  }

  return (
    <div className={cn(DEFAULT_CONTAINER_CLASS, containerClassName)}>
      <div
        role="status"
        aria-label={label}
        className={cn(DEFAULT_SPINNER_CLASS, spinnerClassName)}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
