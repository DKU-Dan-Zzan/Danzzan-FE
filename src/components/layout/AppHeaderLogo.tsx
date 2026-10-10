// 역할: 앱 레이아웃 레이어의 App Header Logo 구성 컴포넌트를 제공합니다.
import { useState } from "react";
import { useFestivalBrandingImageSource } from "@/components/layout/FestivalBrandingImage";
type AppHeaderLogoProps = {
  className?: string;
};

const BASE_CLASS_NAME =
  "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 object-contain object-left select-none";

export function AppHeaderLogo({ className }: AppHeaderLogoProps) {
  const logo = useFestivalBrandingImageSource("logo");
  const [loadedImage, setLoadedImage] = useState<{ src: string; aspectRatio: number } | null>(null);
  // A moderately wide upload can contain large transparent top/bottom margins.
  // Give it a bounded display box; square and very long logos keep the original size.
  const aspectRatio = loadedImage?.src === logo.src ? loadedImage.aspectRatio : 0;
  const paddedWideLogo = logo.useUploaded && aspectRatio >= 2.4 && aspectRatio <= 3;
  const sizeClassName = paddedWideLogo ? "h-11 w-[120px]" : "h-7 w-[98px]";

  return (
    <img
      src={logo.src}
      alt={logo.useUploaded ? "축제 로고" : "LEGEND"}
      className={`${BASE_CLASS_NAME} ${sizeClassName}${className ? ` ${className}` : ""}`}
      onLoad={(event) => {
        const image = event.currentTarget;
        if (image.naturalHeight > 0) setLoadedImage({ src: logo.src, aspectRatio: image.naturalWidth / image.naturalHeight });
      }}
      onError={logo.onError}
      draggable={false}
    />
  );
}
