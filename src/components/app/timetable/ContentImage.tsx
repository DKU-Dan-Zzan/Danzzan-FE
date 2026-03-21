import type { ContentImageDto } from "@/api/app/timetable/timetableApi"
import { XMarkIcon } from "@heroicons/react/24/outline"

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
        <div
          className="fixed inset-0 z-[100] bg-[var(--timetable-overlay-bg)]"
          onClick={onCloseImage}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--timetable-close-bg)] shadow-md"
            onClick={onCloseImage}
          >
            <XMarkIcon className="h-5 w-5 text-[var(--text)]" />
          </button>

          <div
            className="h-full overflow-y-auto px-4 py-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex min-h-full max-w-[430px] items-start justify-center">
              <img
                src={selectedImage.detailImageUrl}
                alt={selectedImage.name}
                className="w-full rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
