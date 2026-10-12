import { useEffect, useState } from "react"
import { festivalBrandingApi, type FestivalBranding } from "@/api/app/festival/festivalBrandingApi"
import { useFestivalBranding } from "@/lib/app/festival/festivalBrandingContext"

/** Admin routes intentionally disable the public provider; previews still need the saved poster. */
export function useSavedPosterBranding() {
  const inherited = useFestivalBranding()
  const [saved, setSaved] = useState<FestivalBranding | null>(null)
  useEffect(() => {
    if (inherited) return
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10_000)
    void festivalBrandingApi.get(undefined, controller.signal).then(value => {
      if (!controller.signal.aborted) setSaved(value)
    }).catch(() => { /* The preview retains its bundled fallback if branding is unavailable. */ })
      .finally(() => window.clearTimeout(timeout))
    return () => { window.clearTimeout(timeout); controller.abort() }
  }, [inherited])
  return inherited ?? saved
}
