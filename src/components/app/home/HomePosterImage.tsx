import { AzureImage } from "@/components/common/AzureImage";
import { resolveBrandingImageUrl } from "@/lib/app/festival/brandingImageUrl";

/** Match the May home hero: fill its bounds, with centered cropping as needed. */
export function HomePosterImage({ src, alt }: { src: string; alt: string }) {
  return <AzureImage src={resolveBrandingImageUrl(src)} alt={alt} className="h-full w-full object-cover" draggable={false} />;
}
