import type { ReactNode } from "react";

type AdminShellProps = {
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  rootClassName?: string;
  headerClassName?: string;
  headerInnerClassName?: string;
  headingClassName?: string;
  eyebrowClassName?: string;
  actionsClassName?: string;
  mainClassName?: string;
};

export function AdminShell({
  title,
  children,
  actions,
  eyebrow = "ADMIN PORTAL",
  rootClassName = "min-h-dvh bg-[var(--bg-base)]",
  headerClassName = "border-b border-[var(--border-base)] bg-[var(--bg-base)]",
  headerInnerClassName = "mx-auto flex w-full max-w-[1360px] items-center justify-between px-8 py-3",
  headingClassName = "text-2xl font-semibold text-[var(--text)]",
  eyebrowClassName = "text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]",
  actionsClassName = "flex items-center gap-2",
  mainClassName = "mx-auto w-full max-w-[1360px] px-8 py-6",
}: AdminShellProps) {
  return (
    <div className={rootClassName}>
      <header className={headerClassName}>
        <div className={headerInnerClassName}>
          <div>
            {eyebrow && <p className={eyebrowClassName}>{eyebrow}</p>}
            <h1 className={headingClassName}>{title}</h1>
          </div>
          {actions && <div className={actionsClassName}>{actions}</div>}
        </div>
      </header>

      <main className={mainClassName}>{children}</main>
    </div>
  );
}
