// 역할: 관리자 화면에서 재사용하는 Tailwind 스타일 문자열(포커스 링/액션 버튼)을 중앙 관리합니다.
export const ADMIN_FOCUS_VISIBLE_RING_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]";

export const ADMIN_PRIMARY_ACTION_BUTTON_CLASS =
  "rounded-2xl bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--text-on-accent)] shadow-sm hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]";

export const ADMIN_SECONDARY_ACTION_BUTTON_CLASS =
  "rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-2 text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]";
