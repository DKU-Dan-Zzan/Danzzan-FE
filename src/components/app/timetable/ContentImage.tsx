// 역할: timetable 화면에서 사용하는 Content Image UI 블록을 렌더링합니다.
import type { ContentImageDto } from "@/api/app/timetable/timetableApi"
import { Dialog, DialogContent, DialogTitle } from "@/components/common/ui/dialog"

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
  if (isLoading) {
    return (
      <div className="py-12 text-center text-[var(--timetable-empty-text)]">
        콘텐츠 이미지를 불러오는 중입니다...
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
            다시 시도
          </button>
        )}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="py-12 text-center text-[var(--timetable-empty-text)]">
        등록된 콘텐츠 이미지가 없습니다.
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
            className="block w-full overflow-hidden rounded-2xl border border-[var(--timetable-card-border)] bg-[var(--timetable-card-bg)]"
            onClick={() => onSelectImage(image)}
          >
            <img
              src={image.previewImageUrl}
              alt={image.name}
              className="h-44 w-full object-cover"
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
          <DialogContent className="max-h-[92vh] w-fit max-w-[92vw] border-0 bg-transparent p-0 shadow-none">
            <DialogTitle className="sr-only">{selectedImage.name}</DialogTitle>
            <div className="max-h-[90vh] overflow-y-auto px-4 py-3">
              <div className="mx-auto flex min-h-full max-w-[430px] items-start justify-center">
                <img
                  src={selectedImage.detailImageUrl}
                  alt={selectedImage.name}
                  className="w-full rounded-xl object-contain"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
