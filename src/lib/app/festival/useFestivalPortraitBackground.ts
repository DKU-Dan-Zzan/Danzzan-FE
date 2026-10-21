import { DEFAULT_FESTIVAL_POSTER } from "./brandingImageSource";
import { usePosterBackground } from "./usePosterBackground";

/** Account screens use the official poster independently of ticketing backgrounds. */
export function useFestivalPortraitBackground() {
  const image = usePosterBackground(undefined, DEFAULT_FESTIVAL_POSTER);
  return { ...image, useUploaded: !!image.src && image.src !== DEFAULT_FESTIVAL_POSTER };
}
