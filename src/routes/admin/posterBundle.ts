import { recommendPosterBackground, type PosterBackgroundRecommendation } from "@/api/app/festival/posterBackgroundApi";
export type PosterBundle = { ticket: PosterBackgroundRecommendation; closed: PosterBackgroundRecommendation };

/** Page-scoped cache: color changes reuse the same poster crops; failures can be retried. */
export function createPosterBundleCache(fetch = recommendPosterBackground) {
  const crops = new Map<string, Promise<PosterBackgroundRecommendation>>();
  const bundles = new Map<string, Promise<PosterBundle>>();
  const controllers = new Set<AbortController>();
  const crop = (poster: string, target: "ticket" | "closed") => {
    const key = JSON.stringify([poster, target]);
    const cached = crops.get(key);
    if (cached) return cached;
    const controller = new AbortController();
    controllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 60_000);
    const pending = fetch(target, controller.signal, poster).then(result => {
      if (result.sourcePosterUrl !== poster) throw new Error("포스터가 변경되었습니다. 대표색을 다시 추출해 주세요.");
      return result;
    }).catch(error => { crops.delete(key); throw error; })
      .finally(() => { clearTimeout(timeout); controllers.delete(controller); });
    crops.set(key, pending);
    return pending;
  };
  return {
    get(poster: string): Promise<PosterBundle> {
      const cached = bundles.get(poster);
      if (cached) return cached;
      const pending = Promise.all([crop(poster, "ticket"), crop(poster, "closed")])
        .then(([ticket, closed]) => ({ ticket, closed }))
        .catch(error => { bundles.delete(poster); throw error; });
      bundles.set(poster, pending);
      return pending;
    },
    dispose() { controllers.forEach(controller => controller.abort()); controllers.clear(); crops.clear(); bundles.clear(); },
  };
}
export const posterBundleImage = (result: PosterBackgroundRecommendation) => `data:${result.mimeType};base64,${result.imageBase64}`;
