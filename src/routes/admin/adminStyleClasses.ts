// 역할: 관리자 화면에서 재사용하는 Tailwind 스타일 문자열(포커스 링/액션 버튼)을 중앙 관리합니다.
// 실제 정의는 lib 레이어에 있다(컴포넌트 레이어에서도 써야 하므로). 기존 import 경로는 그대로 둔다.
export { ADMIN_FOCUS_VISIBLE_RING_CLASS } from "@/lib/common/adminFocusStyles";

export const ADMIN_PRIMARY_ACTION_BUTTON_CLASS =
  "rounded-2xl bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--text-on-accent)] shadow-sm hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100";

export const ADMIN_SECONDARY_ACTION_BUTTON_CLASS =
  "rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-2 text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]";
