import { imageReferenceKey, sameImageReference } from "@/lib/app/azure/azureReadUrl";
import { recommendPosterBackground, type PosterBackgroundRecommendation } from "@/api/app/festival/posterBackgroundApi";
export type PosterBundle = { ticket: PosterBackgroundRecommendation; closed: PosterBackgroundRecommendation };

/** Page-scoped cache: color changes reuse the same generated backgrounds; failures can be retried. */
export function createPosterBundleCache(fetch = recommendPosterBackground) {
  const backgrounds = new Map<string, Promise<PosterBackgroundRecommendation>>();
  const bundles = new Map<string, Promise<PosterBundle>>();
  const controllers = new Set<AbortController>();
  const background = (poster: string, target: "ticket" | "closed") => {
    const key = JSON.stringify([imageReferenceKey(poster), target]);
    const cached = backgrounds.get(key);
    if (cached) return cached;
    const controller = new AbortController();
    controllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 180_000);
    const pending = fetch(target, controller.signal, poster).then(result => {
      if (!sameImageReference(result.sourcePosterUrl, poster)) throw new Error("포스터가 변경되었습니다. 대표색을 다시 추출해 주세요.");
      return result;
    }).catch(error => { backgrounds.delete(key); throw error; })
      .finally(() => { clearTimeout(timeout); controllers.delete(controller); });
    backgrounds.set(key, pending);
    return pending;
  };
  return {
    get(poster: string): Promise<PosterBundle> {
      const key = imageReferenceKey(poster)!;
      const cached = bundles.get(key);
      if (cached) return cached;
      const pending = Promise.all([background(poster, "ticket"), background(poster, "closed")])
        .then(([ticket, closed]) => ({ ticket, closed }))
        .catch(error => { bundles.delete(key); throw error; });
      bundles.set(key, pending);
      return pending;
    },
    dispose() { controllers.forEach(controller => controller.abort()); controllers.clear(); backgrounds.clear(); bundles.clear(); },
  };
}
export const posterBundleImage = (result: PosterBackgroundRecommendation) => `data:${result.mimeType};base64,${result.imageBase64}`;
