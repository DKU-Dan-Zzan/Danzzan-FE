// 역할: 관리자 화면에서 재사용하는 Tailwind 스타일 문자열(포커스 링/액션 버튼)을 중앙 관리합니다.
// 실제 정의는 lib 레이어에 있다(컴포넌트 레이어에서도 써야 하므로). 기존 import 경로는 그대로 둔다.
export { ADMIN_FOCUS_VISIBLE_RING_CLASS } from "@/lib/common/adminFocusStyles";

export const ADMIN_PRIMARY_ACTION_BUTTON_CLASS =
  "rounded-2xl bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--text-on-accent)] shadow-sm hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100";

export const ADMIN_SECONDARY_ACTION_BUTTON_CLASS =
  "rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-2 text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]";

// These variables are scoped to /admin/theme and derived from its active Theme Core color.
export const ADMIN_THEME_PRIMARY_ACTION_CLASS =
  "rounded-xl bg-[var(--admin-theme-action-bg)] px-4 py-2 font-semibold text-[var(--admin-theme-action-fg)] shadow-sm hover:shadow-md hover:ring-2 hover:ring-[var(--admin-theme-action-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-theme-action-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[var(--ds-admin-action-disabled-bg)] disabled:text-[var(--ds-admin-action-disabled-primary-text)] disabled:shadow-none disabled:hover:ring-0";

export const ADMIN_THEME_SECONDARY_ACTION_CLASS =
  "rounded-xl border border-[var(--admin-theme-action-outline)] bg-white px-4 py-2 font-semibold text-[var(--admin-theme-action-outline)] hover:bg-[var(--admin-theme-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-theme-action-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[var(--ds-admin-action-disabled-border)] disabled:bg-[var(--ds-admin-action-disabled-surface)] disabled:text-[var(--ds-admin-action-disabled-text)] disabled:hover:bg-[var(--ds-admin-action-disabled-surface)]";

export const ADMIN_THEME_DESTRUCTIVE_ACTION_CLASS =
  "rounded-xl border border-[var(--ds-admin-action-danger)] bg-white px-4 py-2 font-semibold text-[var(--ds-admin-action-danger)] hover:bg-[var(--ds-admin-action-danger-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-admin-action-danger)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[var(--ds-admin-action-disabled-border)] disabled:bg-[var(--ds-admin-action-disabled-surface)] disabled:text-[var(--ds-admin-action-disabled-text)]";
