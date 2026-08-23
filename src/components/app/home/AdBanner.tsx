// 역할: home 화면에서 광고 배너 캐러셀을 렌더링합니다.
import { AdCarousel } from "@/components/common/AdCarousel"
import type { ClientAdDto } from "@/api/app/ad/adApi"
import { useT } from "@/i18n"

const AD_PLACEHOLDER_IMAGE = "/ads/waiting-room-sample-banner.svg"

type AdBannerProps = {
  ads: ClientAdDto[]
  marginTopClassName?: string
}

export default function AdBanner({ ads, marginTopClassName = "mt-9" }: AdBannerProps) {
  const t = useT()
  const slides = ads.length
    ? ads.map((ad) => ({
        imageUrl: ad.imageUrl,
        linkUrl: ad.linkUrl,
        alt: ad.title,
        updatedAt: ad.updatedAt,
      }))
    : [{ imageUrl: AD_PLACEHOLDER_IMAGE, alt: t("home.adBannerAlt") }]

  return (
    <div className={marginTopClassName}>
      <div className="relative aspect-[9/2] overflow-hidden rounded-none bg-[var(--home-ad-banner-bg)] shadow-[var(--home-elevated-card-shadow)]">
        <AdCarousel
          slides={slides}
          containerClassName="h-full w-full"
          imageClassName="block h-full w-full object-cover"
        />
      </div>
    </div>
  )
}
