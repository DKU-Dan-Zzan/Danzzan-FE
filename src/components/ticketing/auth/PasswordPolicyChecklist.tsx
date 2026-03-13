import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/components/ticketing/common/ui/utils";
import type { PasswordPolicyState } from "@/lib/ticketing/passwordPolicy";

type PasswordPolicyChecklistProps = {
  state: Pick<PasswordPolicyState, "hasMinLength" | "hasSpecialChar" | "isConfirmMatched">;
  className?: string;
};

const CHECKLIST_ITEMS = [
  { key: "hasMinLength", label: "8자 이상" },
  { key: "hasSpecialChar", label: "특수문자 최소 1개 포함" },
  { key: "isConfirmMatched", label: "비밀번호 확인 일치" },
] as const satisfies ReadonlyArray<{
  key: keyof Pick<PasswordPolicyState, "hasMinLength" | "hasSpecialChar" | "isConfirmMatched">;
  label: string;
}>;

export function PasswordPolicyChecklist({ state, className }: PasswordPolicyChecklistProps) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-3",
        className,
      )}
    >
      <p className="text-sm font-semibold text-[var(--text)]">비밀번호 조건</p>
      {CHECKLIST_ITEMS.map(({ key, label }) => {
        const checked = state[key];

        return (
          <p
            key={key}
            className={cn(
              "inline-flex items-center gap-1.5 text-sm",
              checked ? "text-[var(--status-success-text)]" : "text-[var(--text-muted)]",
            )}
          >
            {checked ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            {label}
          </p>
        );
      })}
    </div>
  );
}
