// 역할: home 화면에서 사용하는 Ad Banner UI 블록을 렌더링합니다.
type AdBannerProps = {
  imageUrl?: string
  alt?: string
}

export default function AdBanner({
  imageUrl = "/ads/waiting-room-sample-banner.svg",
  alt = "광고 배너",
}: AdBannerProps) {
  return (
    <div className="mt-9">
      <div className="overflow-hidden border border-[var(--home-ad-banner-border)] bg-[var(--home-ad-banner-bg)]">
        <img
          src={imageUrl}
          alt={alt}
          className="block h-[70px] w-full object-cover"
        />
      </div>
    </div>
  )
}
