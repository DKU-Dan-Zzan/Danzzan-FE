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
      <p className="home-content-block home-caption-text home-lineup-caption">
        {caption}
      </p>
      <div className="home-section-lineup">
        <LineupCarousel banners={banners} />
      </div>
    </>
  )
}
