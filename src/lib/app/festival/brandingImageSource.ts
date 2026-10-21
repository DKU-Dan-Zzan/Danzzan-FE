import { useState } from "react";
import { useFestivalBranding } from "@/lib/app/festival/festivalBrandingContext";
import { resolveBrandingImageUrl } from "@/lib/app/festival/brandingImageUrl";

export const DEFAULT_FESTIVAL_LOGO = "/legend-logo.png";
export const DEFAULT_FESTIVAL_POSTER = "/posters/legend-poster-홈화면와이드규격.jpeg";

export type FestivalBrandingImageKind = "logo" | "poster";

export function useFestivalBrandingImageSource(kind: FestivalBrandingImageKind) {
  const branding = useFestivalBranding();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const uploadedUrl = (kind === "logo" ? branding?.logoImageUrl : branding?.posterImageUrl)?.trim() || null;
  const useUploaded = !!uploadedUrl && uploadedUrl !== failedUrl;
  const src = useUploaded ? resolveBrandingImageUrl(uploadedUrl) : kind === "logo" ? DEFAULT_FESTIVAL_LOGO : DEFAULT_FESTIVAL_POSTER;

  return { src, useUploaded, onError: () => { if (useUploaded) setFailedUrl(uploadedUrl); } };
}
