type AdBannerProps = {
  imageUrl?: string
  alt?: string
}

export default function AdBanner({
  imageUrl = "/ads/waiting-room-sample-banner.svg",
  alt = "광고 배너",
}: AdBannerProps) {
  return (
    <div className="mt-0.1">
      <div className="overflow-hidden border border-gray-200 bg-white">
        <img
          src={imageUrl}
          alt={alt}
          className="block h-[50px] w-full object-cover"
        />
      </div>
    </div>
  )
}