import { useSyncExternalStore } from "react";
import { DEFAULT_FESTIVAL_POSTER } from "./brandingImageSource";
import { getTicketingBackgroundImageUrl, subscribeFestivalSettings } from "./festivalCalendar";
import { usePosterBackground } from "./usePosterBackground";

/** Shared portrait artwork for the account screen and ticketing-OFF notice. */
export function useFestivalPortraitBackground(override?: string) {
  const saved = useSyncExternalStore(subscribeFestivalSettings, getTicketingBackgroundImageUrl, getTicketingBackgroundImageUrl);
  const image = usePosterBackground(override ?? saved, DEFAULT_FESTIVAL_POSTER);
  return { ...image, useUploaded: !!image.src && image.src !== DEFAULT_FESTIVAL_POSTER };
}
