// 역할: 헤더에서 한국어와 영어를 전환하는 버튼을 렌더링한다.

import { useLanguage, useT } from "@/i18n"
import { APP_HEADER_ROUND_BUTTON_BASE_CLASS } from "@/components/layout/AppHeaderRoundButtonClass"

const LanguageToggle = () => {
  const { language, toggle } = useLanguage()
  const t = useT()

  // 현재 언어가 아니라 "누르면 되는 언어"를 보여준다.
  const nextLabel = language === "ko" ? "EN" : "KO"

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("lang.toggle.aria")}
      className={`${APP_HEADER_ROUND_BUTTON_BASE_CLASS} right-[7.5rem] text-[13px] font-bold tracking-[0.04em]`}
    >
      {nextLabel}
    </button>
  )
}

export default LanguageToggle
