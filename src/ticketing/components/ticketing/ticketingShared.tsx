import { RefreshCw } from "lucide-react";
import { Button } from "@/ticketing/components/common/ui/button";
import { cn } from "@/ticketing/components/common/ui/utils";

export const TICKETING_WIDE_PANEL_CLASS = "mx-auto w-full max-w-3xl space-y-4 pb-6";
export const TICKETING_NARROW_PANEL_CLASS = "mx-auto w-full max-w-xl pb-7";
export const TICKETING_MIDDLE_PANEL_CLASS = "mx-auto w-full max-w-md space-y-5 pb-4";
const TICKETING_UNIFIED_CARD_CONTAINER_CLASS =
  "rounded-[28px] border-[var(--border-base)] bg-[linear-gradient(155deg,var(--surface-base)_0%,var(--surface-tint-base)_100%)] shadow-[0_18px_30px_-24px_var(--shadow-color)]";

export const TICKETING_CLASSES = {
  card: {
    heroInfo:
      "rounded-[26px] border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-base)_100%)] shadow-[0_14px_26px_-22px_var(--shadow-color)]",
    summaryInfo:
      "rounded-[20px] border-[var(--border-base)] bg-[var(--surface-base)] shadow-[0_12px_22px_-20px_var(--shadow-color)]",
    event:
      `relative overflow-hidden ${TICKETING_UNIFIED_CARD_CONTAINER_CLASS}`,
    paper:
      "relative overflow-hidden rounded-[24px] border-[var(--ticket-paper-border)] bg-[var(--ticket-paper-base)] shadow-[0_14px_24px_-18px_var(--shadow-color)]",
    success:
      "relative w-full overflow-hidden rounded-[28px] border-[var(--border-base)] bg-[var(--surface-base)] shadow-[0_18px_30px_-24px_var(--shadow-color)]",
    soldout:
      "rounded-[28px] border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] shadow-[0_18px_30px_-24px_var(--status-danger-border)]",
    infoBanner: `relative overflow-hidden ${TICKETING_UNIFIED_CARD_CONTAINER_CLASS}`,
    caution: "rounded-2xl border border-[var(--status-warning-border)] bg-[linear-gradient(90deg,var(--status-warning-bg)_0%,var(--surface-base)_100%)]",
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
      "h-14 w-full max-w-[18rem] rounded-[20px] bg-[var(--accent)] text-[length:var(--ticketing-text-button)] font-bold text-white shadow-[0_12px_20px_-14px_var(--shadow-color)] hover:brightness-95",
    primaryFull:
      "h-14 w-full rounded-[20px] bg-[var(--accent)] text-[length:var(--ticketing-text-button)] font-bold text-white shadow-[0_12px_20px_-14px_var(--shadow-color)] hover:brightness-95",
    disabledFull:
      "h-14 w-full rounded-[20px] border-[var(--status-neutral-border)] bg-[var(--status-neutral-bg)] text-[length:var(--ticketing-text-button)] font-bold text-[var(--status-neutral-text)] hover:bg-[var(--status-neutral-bg)]",
    disabledCompactFull:
      "h-14 w-full rounded-[20px] border-[var(--status-neutral-border)] bg-[var(--status-neutral-bg)] text-[length:var(--ticketing-text-button-compact)] font-bold text-[var(--status-neutral-text)] hover:bg-[var(--status-neutral-bg)]",
    disabledSoldoutFull:
      "h-14 w-full rounded-[20px] border-[var(--status-neutral-border)] bg-[var(--status-neutral-bg)] text-[length:var(--ticketing-text-button)] font-bold text-[var(--text-muted)] hover:bg-[var(--status-neutral-bg)]",
    submitEnabled:
      "h-12 w-full rounded-xl bg-[var(--accent)] text-[length:var(--ticketing-text-button)] font-bold text-white hover:brightness-95 disabled:opacity-100",
    submitDisabled:
      "h-12 w-full rounded-xl bg-[var(--status-neutral)] text-[length:var(--ticketing-text-button)] font-bold text-white hover:bg-[var(--status-neutral)] disabled:opacity-100",
  },
  badge: {
    stepIndex:
      "inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-strong)_100%)] text-[length:var(--ticketing-text-badge)] font-bold text-[var(--accent)]",
    iconCircle:
      "inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-strong)_100%)] text-[var(--accent)] shadow-[inset_0_1px_0_var(--surface-subtle)]",
    event:
      "rounded-full px-3.5 py-1.5 text-[length:var(--ticketing-text-badge)] font-bold tracking-[-0.01em]",
    paperStatus:
      "shrink-0 rounded-full border px-2.5 py-1 text-[length:var(--ticketing-text-button-compact)] leading-none font-semibold tracking-[0.01em]",
  },
  divider: {
    paper: "border-t-[1.5px] border-dashed border-[var(--ticket-perf)]",
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
    heroTitle: "text-[length:var(--ticketing-text-hero-title)] leading-[1.2] font-extrabold tracking-tight",
    heroDescription: "text-[length:var(--ticketing-text-hero-description)] leading-[1.35]",
    cardTitle: "text-[length:var(--ticketing-text-card-title)] leading-[1.16] font-black tracking-tight",
    cardSubtitle: "text-[length:var(--ticketing-text-card-subtitle)] leading-[1.2] font-bold",
    sectionTitle: "text-[length:var(--ticketing-text-section-title)] leading-[1.2] font-bold",
    sectionBody: "text-[length:var(--ticketing-text-section-body)] leading-[1.42]",
    sectionBodySm: "text-[length:var(--ticketing-text-section-body-sm)] leading-[1.5]",
    helper: "text-[length:var(--ticketing-text-helper)] leading-[1.35]",
    stepTitle: "text-[length:var(--ticketing-text-step-title)] leading-[1.25] font-semibold",
    infoBannerTitle: "text-[length:var(--ticketing-text-info-banner-title)] leading-[1.4] font-semibold",
    infoBannerBody: "text-[length:var(--ticketing-text-info-banner-body)] leading-[1.45]",
    paperTitle: "text-[length:var(--ticketing-text-paper-title)] leading-[1.22] font-bold tracking-tight",
    queueLabel: "text-[length:var(--ticketing-text-queue-label)] font-medium leading-none",
    queueValue: "font-mono text-[length:var(--ticketing-text-queue-value)] leading-none font-extrabold tracking-[0.08em]",
    ticketMeta: "text-[length:var(--ticketing-text-ticket-meta)] leading-[1.33]",
    ticketFooter: "text-[length:var(--ticketing-text-ticket-footer)] font-semibold tracking-[0.04em]",
    watermark: "text-[length:var(--ticketing-text-watermark)] font-medium tracking-[0.14em]",
    stateTitle: "text-[length:var(--ticketing-text-state-title)] leading-[1.12] font-extrabold tracking-[-0.02em]",
    stateBody: "text-[length:var(--ticketing-text-state-body)] leading-[1.45]",
    overline: "text-[length:var(--ticketing-text-overline)] font-semibold tracking-[0.03em]",
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
  ariaLabel = "?덈줈怨좎묠",
  title = "?덈줈怨좎묠",
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
