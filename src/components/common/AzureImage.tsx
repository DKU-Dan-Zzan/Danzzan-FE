import type { ImgHTMLAttributes, SyntheticEvent } from "react";
import { useAzureImageUrl } from "@/hooks/app/useAzureImageUrl";

type AzureImageProps = ImgHTMLAttributes<HTMLImageElement>;

/** Keeps regular/local/S3 image URLs untouched and bounds Azure renewal after a failed blob load. */
export function AzureImage({ src, onError, ...props }: AzureImageProps) {
  return <AzureImageRenderer src={src} onError={onError} {...props} />;
}

function AzureImageRenderer({ src, onError, onLoad, ...props }: AzureImageProps) {
  const image = useAzureImageUrl(
    typeof src === "string" ? src : "",
    (event) => onError?.(event as SyntheticEvent<HTMLImageElement>),
  );
  return <img {...props} src={image.src} onError={image.onError} onLoad={(event) => {
    image.onLoad();
    onLoad?.(event);
  }} />;
}
