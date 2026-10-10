import { useState, type CSSProperties } from "react";
import { useFestivalBranding } from "@/lib/app/festival/FestivalBrandingProvider";
import { resolveBrandingImageUrl } from "@/lib/app/festival/brandingImageUrl";

export const DEFAULT_FESTIVAL_LOGO = "/legend-logo.png";
export const DEFAULT_FESTIVAL_POSTER = "/posters/legend-poster-vertical.jpeg";

type FestivalBrandingImageKind = "logo" | "poster";

type FestivalBrandingImageProps = {
  kind: FestivalBrandingImageKind;
  className: string;
  style?: CSSProperties;
  decorative?: boolean;
};

export function useFestivalBrandingImageSource(kind: FestivalBrandingImageKind) {
  const branding = useFestivalBranding();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const uploadedUrl = (kind === "logo" ? branding?.logoImageUrl : branding?.posterImageUrl)?.trim() || null;
  const useUploaded = !!uploadedUrl && uploadedUrl !== failedUrl;
  const src = useUploaded ? resolveBrandingImageUrl(uploadedUrl) : kind === "logo" ? DEFAULT_FESTIVAL_LOGO : DEFAULT_FESTIVAL_POSTER;

  return { src, useUploaded, onError: () => { if (useUploaded) setFailedUrl(uploadedUrl); } };
}

export function FestivalBrandingImage({ kind, className, style, decorative = false }: FestivalBrandingImageProps) {
  const image = useFestivalBrandingImageSource(kind);
  return <img src={image.src} alt={decorative ? "" : image.useUploaded ? "축제 로고" : "LEGEND"}
    aria-hidden={decorative || undefined} className={className} style={style} draggable={false}
    onError={image.onError} />;
}
