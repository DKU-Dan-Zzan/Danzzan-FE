// 역할: home 화면에서 사용하는 Lineup Section UI 블록을 렌더링합니다.
import LineupCarousel, { type LineupBanner } from "./LineupCarousel"
import { useT } from "@/i18n"

type Props = {
  banners: LineupBanner[]
  caption?: string
}

export type { LineupBanner }

export default function LineupSection({
  banners,
  caption,
}: Props) {
  const t = useT()
  if (banners.length === 0) return null

  const resolvedCaption = caption ?? t("home.lineupCaption")

  return (
    <>
      <p className="mx-auto mt-[var(--home-lineup-caption-margin-top)] w-full max-w-[var(--home-content-max-width)] text-center text-[length:var(--type-title-md-size)] leading-[1.45] font-semibold tracking-[var(--type-title-md-tracking)] text-[var(--home-lineup-caption-color)]">
        {resolvedCaption}
      </p>
      <div className="mt-[var(--home-section-lineup-margin-top)]">
        <LineupCarousel banners={banners} />
      </div>
    </>
  )
}
