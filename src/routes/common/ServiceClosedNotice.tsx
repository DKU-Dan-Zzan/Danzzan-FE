// 역할: 가을 축제에 제공하지 않는 서비스의 안내 화면을 공통으로 렌더링한다.

import { Link } from "react-router-dom"
import { useT, type TranslationKey } from "@/i18n"

type ServiceClosedNoticeProps = {
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  actionKey: TranslationKey
  actionTo: string
}

/**
 * 봄 축제의 남색 팔레트가 아니라 가을 축제 "LEGEND" 아이덴티티를 따른다.
 * 이 화면들은 "서비스가 사라진 자리"라서, 앱의 나머지와 다르게 보이는 편이
 * 오히려 "이번 축제는 다르다"를 전달한다. 색은 메인 포스터에서 뽑았다.
 */
const LEGEND_INK = "#0b0607"
const LEGEND_EMBER = "#e8551f"
const LEGEND_CREAM = "#f5e3a3"

const ServiceClosedNotice = ({
  titleKey,
  descriptionKey,
  actionKey,
  actionTo,
}: ServiceClosedNoticeProps) => {
  const t = useT()

  return (
    <section
      aria-labelledby="service-closed-title"
      className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-6 pb-[calc(var(--app-bottom-nav-runtime-offset)+2rem)] pt-[calc(env(safe-area-inset-top)+3rem)]"
      style={{ backgroundColor: LEGEND_INK }}
    >
      {/* 포스터를 배경 질감으로 깐다. 그림이 아니라 공기처럼 읽혀야 하므로
          짙게 눌러 흐리고, 가장자리를 검정으로 녹인다. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none bg-cover bg-[position:50%_34%] opacity-[0.38] blur-[6px] saturate-[1.15]"
        style={{
          backgroundImage: "url(/legend-poster.jpg)",
          maskImage:
            "radial-gradient(100% 58% at 50% 27%, #000 0%, rgba(0,0,0,0.5) 55%, transparent 84%)",
          WebkitMaskImage:
            "radial-gradient(100% 58% at 50% 27%, #000 0%, rgba(0,0,0,0.5) 55%, transparent 84%)",
        }}
      />

      {/* 불씨 잔광 — 로고 뒤에서 번지게 해서 워드마크가 떠 보이도록 한다. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[26%] h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 select-none"
        style={{
          background:
            "radial-gradient(circle, rgba(232,85,31,0.30) 0%, rgba(160,28,20,0.16) 38%, transparent 68%)",
        }}
      />

      {/* 아래쪽을 잉크로 덮어 본문 대비를 확보한다. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] select-none"
        style={{
          background: `linear-gradient(to top, ${LEGEND_INK} 24%, rgba(11,6,7,0.86) 58%, transparent 100%)`,
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[330px] flex-col items-center text-center">
        <img
          src="/legend-logo.png"
          alt="LEGEND"
          className="w-[13.5rem] max-w-[74%] select-none object-contain [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_both]"
          style={{
            filter: `brightness(0) saturate(100%) invert(92%) sepia(28%) saturate(560%) hue-rotate(328deg) brightness(103%) contrast(96%) drop-shadow(0 0 26px rgba(232,85,31,0.42))`,
          }}
          draggable={false}
        />

        <p
          className="mt-4 text-[0.66rem] font-semibold uppercase tracking-[0.34em] [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_90ms_both]"
          style={{ color: "rgba(245,227,163,0.62)" }}
        >
          2026 Fall Festival
        </p>

        <div
          aria-hidden="true"
          className="mt-6 h-px w-16 [animation:ec-fade-in_520ms_ease-out_180ms_both]"
          style={{
            background: `linear-gradient(to right, transparent, ${LEGEND_EMBER}, transparent)`,
          }}
        />

        <h1
          id="service-closed-title"
          className="mt-6 text-[1.5rem] font-bold leading-[1.42] tracking-[-0.01em] [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_240ms_both]"
          style={{ color: LEGEND_CREAM }}
        >
          {t(titleKey)}
        </h1>

        <p
          className="mt-3.5 max-w-[19.5rem] text-[0.92rem] leading-[1.72] [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_320ms_both]"
          style={{ color: "rgba(238,224,208,0.72)" }}
        >
          {t(descriptionKey)}
        </p>

        <Link
          to={actionTo}
          className="mt-9 inline-flex h-12 w-full max-w-[15rem] items-center justify-center rounded-full text-[0.92rem] font-semibold tracking-[0.01em] text-white transition-[transform,filter] duration-150 ease-out hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transition-none [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_400ms_both]"
          style={{
            background: `linear-gradient(135deg, ${LEGEND_EMBER} 0%, #b3241a 100%)`,
            boxShadow: "0 16px 38px -18px rgba(232,85,31,0.9)",
            ["--tw-ring-color" as string]: "rgba(232,85,31,0.55)",
            ["--tw-ring-offset-color" as string]: LEGEND_INK,
          }}
        >
          {t(actionKey)}
        </Link>
      </div>
    </section>
  )
}

export default ServiceClosedNotice
