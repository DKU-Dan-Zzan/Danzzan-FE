import { AzureImage } from "@/components/common/AzureImage";
import { resolveBrandingImageUrl } from "@/lib/app/festival/brandingImageUrl";
import { cn } from "@/components/common/ui/utils";

/** Same complete-image treatment for the live home and the admin preview. */
export function HomePosterImage({ src, alt, safeArea = false }: { src: string; alt: string; safeArea?: boolean }) {
  return <div className="relative h-full w-full overflow-hidden bg-[var(--surface_container_lowest)]">
    <AzureImage src={resolveBrandingImageUrl(src)} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-75" draggable={false} />
    <div className={cn("absolute inset-x-0", safeArea
      ? "top-[calc(68px+env(safe-area-inset-top))] bottom-[calc(var(--app-bottom-nav-height,56px)+env(safe-area-inset-bottom)+var(--home-hero-nav-overlap,0px))]"
      : "inset-y-0")}>
      <AzureImage src={resolveBrandingImageUrl(src)} alt={alt} className="h-full w-full object-contain" draggable={false} />
    </div>
  </div>;
}
