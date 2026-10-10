import type { CSSProperties } from "react";
import { useFestivalBrandingImageSource, type FestivalBrandingImageKind } from "@/lib/app/festival/brandingImageSource";

type FestivalBrandingImageProps = {
  kind: FestivalBrandingImageKind;
  className: string;
  style?: CSSProperties;
  decorative?: boolean;
};

export function FestivalBrandingImage({ kind, className, style, decorative = false }: FestivalBrandingImageProps) {
  const image = useFestivalBrandingImageSource(kind);
  return <img src={image.src} alt={decorative ? "" : image.useUploaded ? "축제 로고" : "LEGEND"}
    aria-hidden={decorative || undefined} className={className} style={style} draggable={false}
    onError={image.onError} />;
}
