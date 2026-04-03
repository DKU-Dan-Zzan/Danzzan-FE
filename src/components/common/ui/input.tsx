// 역할: 공용 UI 레이어의 input 컴포넌트를 제공합니다.
import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-10 w-full min-w-0 rounded-[var(--radius-md)] border border-[color:color-mix(in_srgb,var(--outline_variant)_90%,transparent)] px-3 py-2 text-base bg-[var(--input-background)] transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)] focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_16%,transparent)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
