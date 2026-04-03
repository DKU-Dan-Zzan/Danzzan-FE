// 역할: home 화면에서 광고 배너 캐러셀을 렌더링합니다.
import { AdCarousel } from "@/components/common/AdCarousel"
import type { ClientAdDto } from "@/api/app/ad/adApi"

const AD_PLACEHOLDER_IMAGE = "/ads/waiting-room-sample-banner.svg"

type AdBannerProps = {
  ads: ClientAdDto[]
}

export default function AdBanner({ ads }: AdBannerProps) {
  const slides = ads.length
    ? ads.map((ad) => ({
        imageUrl: ad.imageUrl,
        alt: ad.title,
        updatedAt: ad.updatedAt,
        objectPosition: ad.objectPosition,
      }))
    : [{ imageUrl: AD_PLACEHOLDER_IMAGE, alt: "광고 배너" }]

  return (
    <div className="mt-9">
      <div className="overflow-hidden rounded-none bg-[var(--home-ad-banner-bg)] shadow-[var(--home-elevated-card-shadow)]">
        <AdCarousel
          slides={slides}
          imageClassName="block h-[70px] w-full object-cover"
        />
      </div>
    </div>
  )
}
