// 역할: 가을 축제에 제공하지 않는 서비스의 안내 화면을 공통으로 렌더링한다.

import { type CSSProperties, type ReactNode } from "react"
import { usePosterBackground } from "@/lib/app/festival/usePosterBackground"
import { DEFAULT_FESTIVAL_POSTER } from "@/lib/app/festival/brandingImageSource"
import { Link } from "react-router-dom"
import { cn } from "@/components/common/ui/utils"
import { useT, type TranslationKey } from "@/i18n"
import { NoAccountIcon, StageIcon } from "@/routes/common/ServiceClosedIcons"
import { useFestivalBrandingImageSource } from "@/lib/app/festival/brandingImageSource"

type ServiceClosedNoticeProps = {
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  actionKey: TranslationKey
  actionTo: string
  /** 기본 아이콘 대신 다른 그림을 쓰고 싶을 때만 넘긴다. */
  icon?: ReactNode
  backgroundImageUrl?: string | null
  /** 관리자 미리보기에서는 화면 높이와 안전 영역 대신 고정 캔버스를 사용한다. */
  preview?: boolean
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
      style={{ background: `linear-gradient(to right, transparent, var(--poster-closed-accent))` }}
    />
    <span className="block h-[5px] w-[5px] rotate-45" style={{ backgroundColor: "var(--poster-closed-accent)" }} />
    <span
      className="block h-px flex-1 max-w-[3.5rem]"
      style={{ background: `linear-gradient(to left, transparent, var(--poster-closed-accent))` }}
    />
  </div>
)

const renderWithHighlight = (text: string) =>
  text.split("*").map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-bold" style={{ color: "var(--poster-closed-accent)" }}>
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

// Keep the neutral veil fixed; only the foreground inherits the current/preview theme.
const LEGEND_INK = "var(--legend-ink)"

const ServiceClosedNotice = ({
  titleKey,
  descriptionKey,
  actionKey,
  actionTo,
  icon,
  backgroundImageUrl,
  preview = false,
}: ServiceClosedNoticeProps) => {
  const t = useT()
  const logoImage = useFestivalBrandingImageSource("logo")
  const background = usePosterBackground(backgroundImageUrl, DEFAULT_FESTIVAL_POSTER)
  const noticeIcon = icon ?? ICON_BY_TITLE[titleKey]
  const noteKey = NOTE_BY_TITLE[titleKey]

  return (
    <section
      aria-labelledby="service-closed-title"
      className={cn(
        "relative flex flex-col justify-center overflow-hidden px-6",
        preview
          ? "min-h-[720px] py-10"
          : "min-h-dvh pb-[calc(var(--app-bottom-nav-runtime-offset)+2rem)] pt-[calc(env(safe-area-inset-top)+3rem)]",
      )}
      style={{
        "--poster-closed-copy": "color-mix(in srgb, var(--theme-brand-primary, white) 15%, white 85%)",
        "--poster-closed-accent": "color-mix(in srgb, var(--theme-brand-accent, white) 25%, white 75%)",
        "--poster-closed-button-bg": "color-mix(in srgb, var(--theme-brand-accent, white) 15%, white 85%)",
        "--poster-closed-ink": "color-mix(in srgb, var(--theme-brand-strong, black) 20%, black 80%)",
        backgroundColor: LEGEND_INK,
        color: "var(--poster-closed-copy)",
      } as CSSProperties}
    >
      {background.src && <img aria-hidden="true" src={background.src} alt="" onError={background.onError}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover" />}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(9,12,20,0.76), rgba(9,12,20,0.90))" }} />

      <div className="relative z-10 mx-auto flex w-full max-w-[330px] flex-col items-center text-center">
        <img
          src={logoImage.src}
          onError={logoImage.onError}
          alt={logoImage.useUploaded ? "축제 로고" : "LEGEND"}
          className="w-[13.5rem] max-w-[74%] select-none object-contain [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_both]"
          style={{
            filter: logoImage.useUploaded
              ? "drop-shadow(0 0 26px var(--poster-closed-ink))"
              : `brightness(0) saturate(100%) invert(92%) sepia(28%) saturate(560%) hue-rotate(328deg) brightness(103%) contrast(96%) drop-shadow(0 0 26px var(--poster-closed-ink))`,
          }}
          draggable={false}
        />

        <p
          className="mt-4 text-[0.66rem] font-semibold uppercase tracking-[0.34em] [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_90ms_both]"
          style={{ color: "var(--poster-closed-copy)" }}
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
              color: "var(--poster-closed-accent)",
              filter: "drop-shadow(0 0 18px var(--poster-closed-ink))",
            }}
          >
            {noticeIcon}
          </div>
        ) : null}

        <p
          className="mt-6 max-w-[19.5rem] whitespace-pre-line text-balance text-[0.92rem] leading-[1.72] [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_380ms_both]"
          style={{ color: "var(--poster-closed-copy)" }}
        >
          {renderWithHighlight(t(descriptionKey))}
        </p>

        {noteKey ? (
          <>
            <OrnamentDivider className="mt-6 [animation:ec-fade-in_520ms_ease-out_440ms_both]" />
            <p
              className="mt-5 max-w-[19.5rem] whitespace-pre-line text-balance text-[0.92rem] leading-[1.72] [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_480ms_both]"
              style={{ color: "var(--poster-closed-copy)" }}
            >
              {renderWithHighlight(t(noteKey))}
            </p>
          </>
        ) : null}

        <Link
          to={actionTo}
          tabIndex={preview ? -1 : undefined}
          className="mt-9 inline-flex h-12 w-full max-w-[15rem] items-center justify-center rounded-full text-[0.92rem] font-semibold tracking-[0.01em] transition-[transform,filter] duration-150 ease-out hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transition-none [animation:ec-fade-up_520ms_cubic-bezier(0.22,1,0.36,1)_400ms_both]"
          style={{
            background: "var(--poster-closed-button-bg)",
            color: "var(--poster-closed-ink)",
            boxShadow: "0 16px 38px -18px var(--poster-closed-ink)",
            ["--tw-ring-color" as string]: "var(--poster-closed-accent)",
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
