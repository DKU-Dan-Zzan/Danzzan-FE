import { useState } from "react"
import { useFestivalBranding } from "@/lib/app/festival/festivalBrandingContext"
import { resolveBrandingImageUrl } from "@/lib/app/festival/brandingImageUrl"

/** Custom → official poster → bundled art → solid surface; each failed source is tried only once. */
export function usePosterBackground(custom: string | null | undefined, fallback: string) {
  const branding = useFestivalBranding()
  const sources = [...new Set([custom?.trim(), branding?.posterImageUrl?.trim(), fallback]
    .filter((value): value is string => !!value).map(value => resolveBrandingImageUrl(value)))]
  const key = JSON.stringify(sources)
  const [failure, setFailure] = useState<{ key: string; urls: string[] }>({ key, urls: [] })
  const failed = failure.key === key ? failure.urls : []
  const src = sources.find(value => !failed.includes(value))
  return {
    src,
    onError: () => {
      if (src) setFailure(previous => ({ key, urls: [...(previous.key === key ? previous.urls : []), src] }))
    },
  }
}
