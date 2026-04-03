// 역할: home 화면에서 사용하는 Lineup Section UI 블록을 렌더링합니다.
import LineupCarousel, { type LineupBanner } from "./LineupCarousel"

type Props = {
  banners: LineupBanner[]
  caption?: string
}

const DEFAULT_CAPTION = "올해 축제를 빛낼 아티스트들을 지금 확인하세요"

export type { LineupBanner }

export default function LineupSection({
  banners,
  caption = DEFAULT_CAPTION,
}: Props) {
  if (banners.length === 0) return null

  return (
    <>
      <p className="mx-auto mt-[var(--home-lineup-caption-margin-top)] w-full max-w-[var(--home-content-max-width)] text-center text-[length:var(--type-title-md-size)] leading-[1.45] font-semibold tracking-[var(--type-title-md-tracking)] text-[var(--home-lineup-caption-color)]">
        {caption}
      </p>
      <div className="mt-[var(--home-section-lineup-margin-top)]">
        <LineupCarousel banners={banners} />
      </div>
    </>
  )
}
