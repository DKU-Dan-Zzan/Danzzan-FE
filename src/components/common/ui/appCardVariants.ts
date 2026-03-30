// 역할: 앱 전역 카드 4종 스타일 프리셋(토큰 기반)을 제공합니다.
export const APP_CARD_BASE_CLASS =
  "rounded-[var(--card-radius)] border border-solid [border-width:var(--card-border-width)]";

export const APP_CARD_VARIANTS = {
  outline:
    `${APP_CARD_BASE_CLASS} border-[color:var(--card-outline-border)] bg-[var(--card-outline-bg)] shadow-[var(--card-outline-shadow)]`,
  softTint:
    `${APP_CARD_BASE_CLASS} border-[color:var(--card-soft-tint-border)] bg-[var(--card-soft-tint-bg)] shadow-[var(--card-soft-tint-shadow)]`,
  gradWhite:
    `${APP_CARD_BASE_CLASS} border-[color:var(--card-grad-white-border)] bg-[var(--card-surface-base)] [background-image:var(--card-grad-white-bg)] shadow-[var(--card-grad-white-shadow)]`,
  gradTint:
    `${APP_CARD_BASE_CLASS} !border-[color:var(--card-grad-tint-border)] bg-[var(--card-surface-base)] [background-image:var(--card-grad-tint-bg)] shadow-[var(--card-grad-tint-shadow)]`,
} as const;

export type AppCardVariant = keyof typeof APP_CARD_VARIANTS;
