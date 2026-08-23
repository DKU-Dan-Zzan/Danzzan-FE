// 역할: timetable 화면에서 사용하는 Content Image UI 블록을 렌더링합니다.
import { X } from "lucide-react"
import type { ContentImageDto } from "@/api/app/timetable/timetableApi"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/common/ui/dialog"
import { useT } from "@/i18n"

type ContentImageSectionProps = {
  images: ContentImageDto[]
  isLoading: boolean
  error: string | null
  onRetry?: () => void
  selectedImage: ContentImageDto | null
  onSelectImage: (image: ContentImageDto) => void
  onCloseImage: () => void
}

export default function ContentImageSection({
  images,
  isLoading,
  error,
  onRetry,
  selectedImage,
  onSelectImage,
  onCloseImage,
}: ContentImageSectionProps) {
  const t = useT()

  if (isLoading) {
    return (
      <div className="py-12 text-center text-[var(--timetable-empty-text)]">
        {t("timetable.loadingContentImages")}
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center text-[var(--timetable-empty-text)]">
        <p>{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--text)]"
          >
            {t("common.retry")}
          </button>
        )}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="py-12 text-center text-[var(--timetable-empty-text)]">
        {t("timetable.emptyContentImages")}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {images.map((image) => (
          <button
            key={image.id}
            type="button"
            className="block w-full overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,249,255,0.86))] shadow-[0_30px_56px_-38px_rgba(23,34,68,0.46),inset_0_1px_0_rgba(255,255,255,0.92)] ring-1 ring-[rgba(255,255,255,0.76)]"
            onClick={() => onSelectImage(image)}
          >
            <img
              src={image.previewImageUrl}
              alt={image.name}
              className="h-100 w-full object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src = image.detailImageUrl
              }}
            />
          </button>
        ))}
      </div>

      {selectedImage && (
        <Dialog
          open={Boolean(selectedImage)}
          onOpenChange={(open) => {
            if (!open) {
              onCloseImage()
            }
          }}
        >
          <DialogContent
            showCloseButton={false}
            className="h-[100dvh] max-h-[100dvh] w-screen max-w-none border-0 bg-transparent p-0 shadow-none sm:h-auto sm:max-h-[92vh] sm:w-fit sm:max-w-[92vw]"
          >
            <DialogTitle className="sr-only">{selectedImage.name}</DialogTitle>
            <div className="h-full overflow-y-auto overscroll-contain px-3 py-[max(env(safe-area-inset-top),0.75rem)] sm:max-h-[90vh] sm:px-4 sm:py-3">
              <div className="mx-auto flex min-h-full w-full max-w-none items-center justify-center sm:max-w-[430px]">
                <img
                  src={selectedImage.detailImageUrl}
                  alt={selectedImage.name}
                  className="h-auto w-full rounded-xl object-contain"
                />
              </div>
            </div>
            <DialogClose
              aria-label={t("common.close")}
              className="absolute right-4 top-[max(env(safe-area-inset-top),1rem)] inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/70 sm:top-4"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">{t("common.close")}</span>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
