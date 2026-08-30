// 역할: 가을 축제에 제공하지 않는 서비스의 안내 화면을 공통으로 렌더링한다.

import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/components/common/ui/utils"
import { useT, type TranslationKey } from "@/i18n"
import { NoAccountIcon, StageIcon } from "@/routes/common/ServiceClosedIcons"

type ServiceClosedNoticeProps = {
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  actionKey: TranslationKey
  actionTo: string
  /** 기본 아이콘 대신 다른 그림을 쓰고 싶을 때만 넘긴다. */
  icon?: ReactNode
}

/**
 * 본문 아래 구분선을 두고 덧붙이는 안내. 티켓팅처럼 "이렇게 입장한다"와
 * "자세한 건 어디서 본다"가 성격이 달라 한 문단에 묶으면 읽히지 않는 경우에만 쓴다.
 */
const NOTE_BY_TITLE: Partial<Record<TranslationKey, TranslationKey>> = {
  "closed.ticketing.title": "closed.ticketing.note",
  "closed.auth.title": "closed.auth.note",
  "closed.mypage.title": "closed.mypage.note",
}

/**
 * 문구 안의 *별표* 구간을 브랜드 색으로 강조한다. 사전은 평문만 담고
 * 마크업은 여기서 입혀야, 번역할 때 태그를 깨뜨릴 일이 없다.
 */
/**
 * 가운데 마름모를 둔 구분선. 포스터의 반짝임을 작게 옮겨온 장식이라
 * 로고 아래와 문단 사이에서 같은 모양을 쓴다.
 */
const OrnamentDivider = ({ className }: { className?: string }) => (
  <div
    aria-hidden="true"
    className={cn("flex w-full items-center justify-center gap-2", className)}
  >
    <span
      className="block h-px flex-1 max-w-[3.5rem]"
      style={{ background: `linear-gradient(to right, transparent, ${LEGEND_EMBER})` }}
    />
    <span className="block h-[5px] w-[5px] rotate-45" style={{ backgroundColor: LEGEND_EMBER }} />
    <span
      className="block h-px flex-1 max-w-[3.5rem]"
      style={{ background: `linear-gradient(to left, transparent, ${LEGEND_EMBER})` }}
    />
  </div>
)

const renderWithHighlight = (text: string) =>
  text.split("*").map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-bold text-[var(--brand-main)]">
        {part}
      </strong>
    ) : (
      part
    ),
  )

/**
 * 어떤 서비스의 안내인지는 titleKey 가 이미 구분하고 있다. 호출부가 16곳이라
 * 매번 아이콘을 함께 넘기게 하면 짝이 어긋난 채 방치되기 쉬워, 여기서 묶는다.
 */
const ICON_BY_TITLE: Partial<Record<TranslationKey, ReactNode>> = {
  "closed.ticketing.title": <StageIcon />,
  "closed.auth.title": <NoAccountIcon />,
  "closed.mypage.title": <NoAccountIcon />,
}

/**
 * 봄 축제의 남색 팔레트가 아니라 가을 축제 "LEGEND" 아이덴티티를 따른다.
 * 이 화면들은 "서비스가 사라진 자리"라서, 앱의 나머지와 다르게 보이는 편이
 * 오히려 "이번 축제는 다르다"를 전달한다.
 *
 * 색은 메인 포스터에서 뽑아 src/index.css 에 전역 토큰으로 등록했다.
 */
const LEGEND_INK = "var(--legend-ink)"
const LEGEND_EMBER = "var(--legend-ember)"
const LEGEND_EMBER_DEEP = "var(--legend-ember-deep)"

const ServiceClosedNotice = ({
  titleKey,
  descriptionKey,
  actionKey,
  actionTo,
  icon,
}: ServiceClosedNoticeProps) => {
  const t = useT()
  const noticeIcon = icon ?? ICON_BY_TITLE[titleKey]
  const noteKey = NOTE_BY_TITLE[titleKey]

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
            "radial-gradient(100% 58% at 50% 27%, black 0%, rgba(0,0,0,0.5) 55%, transparent 84%)",
          WebkitMaskImage:
            "radial-gradient(100% 58% at 50% 27%, black 0%, rgba(0,0,0,0.5) 55%, transparent 84%)",
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

        <OrnamentDivider className="mt-6 [animation:ec-fade-in_520ms_ease-out_180ms_both]" />

        {/*
          제목은 화면에 그리지 않는다. 로고와 본문만으로 충분히 읽히고,
          제목까지 두면 같은 말이 두 번 나온다. 다만 지우면 이 화면의
          이름이 사라져 스크린리더가 "빈 화면"으로 읽으므로 sr-only 로 남긴다.
        */}
        <h1 id="service-closed-title" className="sr-only">
          {t(titleKey)}
        </h1>

        {noticeIcon ? (
          <div
            aria-hidden="true"
            className="mt-6 select-none [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_300ms_both]"
            style={{
              color: LEGEND_EMBER,
              filter: "drop-shadow(0 0 18px rgba(232,85,31,0.35))",
            }}
          >
            {noticeIcon}
          </div>
        ) : null}

        <p
          className="mt-6 max-w-[19.5rem] whitespace-pre-line text-balance text-[0.92rem] leading-[1.72] [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_380ms_both]"
          style={{ color: "rgba(238,224,208,0.72)" }}
        >
          {renderWithHighlight(t(descriptionKey))}
        </p>

        {noteKey ? (
          <>
            <OrnamentDivider className="mt-6 [animation:ec-fade-in_520ms_ease-out_440ms_both]" />
            <p
              className="mt-5 max-w-[19.5rem] whitespace-pre-line text-balance text-[0.92rem] leading-[1.72] [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_480ms_both]"
              style={{ color: "rgba(238,224,208,0.72)" }}
            >
              {renderWithHighlight(t(noteKey))}
            </p>
          </>
        ) : null}

        <Link
          to={actionTo}
          className="mt-9 inline-flex h-12 w-full max-w-[15rem] items-center justify-center rounded-full text-[0.92rem] font-semibold tracking-[0.01em] text-white transition-[transform,filter] duration-150 ease-out hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transition-none [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_400ms_both]"
          style={{
            background: `linear-gradient(135deg, ${LEGEND_EMBER} 0%, ${LEGEND_EMBER_DEEP} 100%)`,
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
