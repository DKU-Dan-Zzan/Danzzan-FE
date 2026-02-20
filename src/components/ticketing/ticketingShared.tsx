import { RefreshCw } from "lucide-react";
import { Button } from "@/components/common/ui/button";
import { cn } from "@/components/common/ui/utils";

export const TICKETING_WIDE_PANEL_CLASS = "mx-auto w-full max-w-3xl space-y-5 pb-7";
export const TICKETING_NARROW_PANEL_CLASS = "mx-auto w-full max-w-xl pb-7";
export const TICKETING_MIDDLE_PANEL_CLASS = "mx-auto w-full max-w-md space-y-5 pb-4";

export const TICKETING_CLASSES = {
  card: {
    heroInfo:
      "rounded-[26px] border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-base)_100%)] shadow-[0_14px_26px_-22px_rgba(15,23,42,0.16)]",
    summaryInfo:
      "rounded-[20px] border-[var(--border-base)] bg-[var(--surface-base)] shadow-[0_12px_22px_-20px_rgba(15,23,42,0.14)]",
    event:
      "relative overflow-hidden rounded-[28px] border-[var(--border-base)] bg-[linear-gradient(155deg,var(--surface-base)_0%,var(--surface-tint-base)_100%)] shadow-[0_18px_30px_-24px_rgba(15,23,42,0.18)]",
    paper:
      "relative overflow-hidden rounded-[28px] border-[#e2ddcf] bg-[#fdfbf4] shadow-[0_6px_18px_rgba(15,23,42,0.06)]",
    success:
      "relative w-full overflow-hidden rounded-[28px] border-[var(--border-base)] bg-[var(--surface-base)] shadow-[0_18px_30px_-24px_rgba(15,23,42,0.18)]",
    soldout:
      "rounded-[28px] border-[#f7cbcb] bg-[#fff7f7] shadow-[0_18px_30px_-24px_rgba(220,38,38,0.45)]",
    infoBanner: "rounded-[28px] border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-base)_100%)]",
    caution: "rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50",
    policy: "rounded-2xl border border-[var(--border-base)] bg-[var(--surface-base)]",
    agreement: "space-y-3 rounded-2xl border border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-base)_100%)]",
    emptyState: "rounded-[28px] border-[var(--border-subtle)] bg-[var(--surface-subtle)]",
  },
  button: {
    refreshSm:
      "h-10 w-10 shrink-0 rounded-xl border-[var(--border-base)] bg-[var(--surface-subtle)] p-0 text-[var(--text-muted)] hover:bg-[var(--surface-tint-subtle)]",
    refreshLg:
      "h-12 w-12 shrink-0 rounded-[18px] border-[var(--border-base)] bg-[var(--surface-subtle)] p-0 text-[var(--text-muted)] hover:bg-[var(--surface-tint-subtle)]",
    primaryWide:
      "h-14 w-full max-w-[18rem] rounded-[20px] bg-[var(--accent)] text-[0.92rem] font-bold text-white shadow-[0_12px_20px_-14px_rgba(15,23,42,0.24)] hover:brightness-95",
    primaryFull:
      "h-14 w-full rounded-[20px] bg-[var(--accent)] text-[0.92rem] font-bold text-white shadow-[0_12px_20px_-14px_rgba(15,23,42,0.24)] hover:brightness-95",
    disabledFull:
      "h-14 w-full rounded-[20px] border-[#d0d4de] bg-[#d9dde5] text-[0.92rem] font-bold text-[#687284] hover:bg-[#d9dde5]",
    disabledCompactFull:
      "h-14 w-full rounded-[20px] border-[#d0d4de] bg-[#d9dde5] text-[0.69rem] font-bold text-[#687284] hover:bg-[#d9dde5]",
    disabledSoldoutFull:
      "h-14 w-full rounded-[20px] border-[#bcc3cf] bg-[#bec4d0] text-[0.92rem] font-bold text-[#525b6b] hover:bg-[#bec4d0]",
    submitEnabled:
      "h-12 w-full rounded-xl bg-[var(--accent)] text-[0.92rem] font-bold text-white hover:brightness-95 disabled:opacity-100",
    submitDisabled:
      "h-12 w-full rounded-xl bg-[#c7ced9] text-[0.92rem] font-bold text-white hover:bg-[#c7ced9] disabled:opacity-100",
  },
  badge: {
    stepIndex:
      "inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-strong)_100%)] text-[0.72rem] font-bold text-[var(--accent)]",
    iconCircle:
      "inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-strong)_100%)] text-[var(--accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
    event:
      "rounded-full px-3.5 py-1.5 text-[0.72rem] font-bold tracking-[-0.01em]",
    paperStatus:
      "shrink-0 rounded-full border px-2.5 py-1 text-[0.72rem] leading-none font-medium tracking-tight",
  },
  divider: {
    paper: "border-t-[1.5px] border-dashed border-[var(--border-base)]",
  },
  text: {
    blueStrong: "text-[var(--accent)]",
    blueDeep: "text-[var(--text)]",
    grayStrong: "text-[var(--text)]",
    grayMuted: "text-[var(--text-muted)]",
    grayLabel: "text-[var(--text-muted)]",
    dark: "text-[var(--text)]",
  },
  typography: {
    heroTitle: "text-[1.55rem] leading-[1.2] font-extrabold tracking-tight",
    heroDescription: "text-[0.98rem] leading-[1.35]",
    cardTitle: "text-[1.22rem] leading-[1.16] font-black tracking-tight",
    cardSubtitle: "text-[1rem] leading-[1.2] font-bold",
    sectionTitle: "text-[0.9rem] leading-[1.2] font-bold",
    sectionBody: "text-[0.92rem] leading-[1.42]",
    sectionBodySm: "text-[0.84rem] leading-[1.5]",
    helper: "text-[0.74rem] leading-[1.35]",
    stepTitle: "text-[0.88rem] leading-[1.25] font-semibold",
    infoBannerTitle: "text-[0.95rem] leading-[1.4] font-semibold",
    infoBannerBody: "text-[0.78rem] leading-[1.45]",
    paperTitle: "text-[1.02rem] leading-[1.25] font-bold tracking-tight",
    queueLabel: "text-[0.72rem] font-medium leading-none",
    queueValue: "font-mono text-[1.5rem] leading-none font-extrabold tracking-[0.08em]",
    ticketMeta: "text-[0.8rem] leading-[1.35]",
    ticketFooter: "text-[0.64rem] font-semibold tracking-[0.03em]",
    watermark: "text-[0.52rem] font-medium tracking-[0.14em]",
    stateTitle: "text-[1.68rem] leading-[1.12] font-extrabold tracking-[-0.02em]",
    stateBody: "text-[0.92rem] leading-[1.45]",
    overline: "text-[0.8rem] font-semibold tracking-[0.03em]",
  },
} as const;

interface TicketingRefreshButtonProps {
  onClick: () => void;
  loading: boolean;
  size?: "sm" | "lg";
  className?: string;
  iconClassName?: string;
  ariaLabel?: string;
  title?: string;
}

export function TicketingRefreshButton({
  onClick,
  loading,
  size = "sm",
  className,
  iconClassName,
  ariaLabel = "새로고침",
  title = "새로고침",
}: TicketingRefreshButtonProps) {
  const resolvedClassName =
    className ?? (size === "lg" ? TICKETING_CLASSES.button.refreshLg : TICKETING_CLASSES.button.refreshSm);
  const resolvedIconClassName = iconClassName ?? (size === "lg" ? "h-[1.12rem] w-[1.12rem]" : "h-[1.05rem] w-[1.05rem]");

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={loading}
      aria-label={ariaLabel}
      title={title}
      className={resolvedClassName}
    >
      <RefreshCw className={cn(resolvedIconClassName, loading && "animate-spin")} />
    </Button>
  );
}

interface TicketingStepTitleProps {
  step: number;
  title: string;
}

export function TicketingStepTitle({ step, title }: TicketingStepTitleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={TICKETING_CLASSES.badge.stepIndex}>
        {step}
      </span>
      <p className={`${TICKETING_CLASSES.typography.stepTitle} text-[var(--text)]`}>{title}</p>
    </div>
  );
}
