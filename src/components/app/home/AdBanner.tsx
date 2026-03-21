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
      <div className="overflow-hidden border border-[var(--timetable-card-border)] bg-[var(--timetable-card-bg)]">
        <img
          src={imageUrl}
          alt={alt}
          className="block h-[70px] w-full object-cover"
        />
      </div>
    </div>
  )
}
