// 역할: 헤더에서 한국어와 영어를 전환하는 세그먼트 토글을 렌더링한다.

import { useLanguage, useT } from "@/i18n"

/**
 * 두 언어를 모두 보여주고 현재 언어를 강조한다.
 *
 * 이전에는 원형 버튼에 "누르면 될 언어" 하나만 띄웠는데, 그러면 "EN"이 지금
 * 영어라는 뜻인지 누르면 영어가 된다는 뜻인지 알 수 없다. 둘 다 보여주고
 * 활성 쪽에 알약을 깔면 그 모호함이 사라진다.
 */
const LanguageToggle = () => {
  const { language, toggle } = useLanguage()
  const t = useT()

  const isKorean = language === "ko"

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("lang.toggle.aria")}
      className="absolute right-[7.5rem] top-1/2 flex h-[var(--app-header-ticket-btn-size)] w-[5.25rem] -translate-y-1/2 items-center rounded-full bg-[linear-gradient(145deg,var(--app-header-ticket-btn-bg-start)_0%,var(--app-header-ticket-btn-bg-end)_100%)] p-[3px] shadow-[var(--app-header-ticket-btn-shadow)] backdrop-blur-[var(--ec-glass-blur)] transition-[transform,box-shadow,filter] duration-[180ms] hover:shadow-[var(--app-header-ticket-btn-shadow-hover)] hover:brightness-[1.01] active:scale-[0.96]"
    >
      {/* 활성 언어 뒤로 미끄러지는 알약 */}
      <span
        aria-hidden="true"
        className={`absolute left-[3px] h-[calc(var(--app-header-ticket-btn-size)-8px)] top-1/2 -translate-y-1/2 w-[calc(50%-3px)] rounded-full bg-[var(--brand-main)] shadow-[0_2px_8px_-2px_rgba(10,85,156,0.55)] transition-transform duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          isKorean ? "translate-x-0" : "translate-x-full"
        }`}
      />

      <span
        className={`relative z-10 flex-1 text-center text-[11.5px] font-bold leading-none tracking-[0.04em] transition-colors duration-150 ${
          isKorean ? "text-white" : "text-[var(--text-muted)]"
        }`}
      >
        KO
      </span>
      <span
        className={`relative z-10 flex-1 text-center text-[11.5px] font-bold leading-none tracking-[0.04em] transition-colors duration-150 ${
          isKorean ? "text-[var(--text-muted)]" : "text-white"
        }`}
      >
        EN
      </span>
    </button>
  )
}

export default LanguageToggle
