import { useCallback, useRef, useState } from "react";
import type { Booth, College, Pub, SelectedDetailItem } from "@/types/app/boothmap/boothmap.types";
import {
  useBoothDetailQuery,
  usePubDetailQuery,
} from "@/hooks/app/boothmap/useBoothDetailQuery";
import { Dialog, DialogContent, DialogTitle } from "@/components/common/ui/dialog";
import { formatOperatingTime } from "@/utils/app/boothmap/formatOperatingTime";

export default function DetailSheet({
  selectedItem,
  booths,
  pubs,
  colleges,
  onClose,
}: {
  selectedItem: SelectedDetailItem;
  booths: Booth[];
  pubs: Pub[];
  colleges: College[];
  onClose: () => void;
}) {
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const selectedBoothId = selectedItem?.kind === "booth" ? selectedItem.id : null;
  const selectedPubId = selectedItem?.kind === "pub" ? selectedItem.id : null;

  const boothDetailQuery = useBoothDetailQuery(selectedBoothId);
  const pubDetailQuery = usePubDetailQuery(selectedPubId);

  const boothDetail = selectedItem?.kind === "booth" ? (boothDetailQuery.data ?? null) : null;
  const pubDetail = selectedItem?.kind === "pub" ? (pubDetailQuery.data ?? null) : null;
  const isLoading = selectedItem?.kind === "booth"
    ? boothDetailQuery.isPending
    : selectedItem?.kind === "pub"
      ? pubDetailQuery.isPending
      : false;
  const isError = selectedItem?.kind === "booth"
    ? Boolean(boothDetailQuery.error)
    : selectedItem?.kind === "pub"
      ? Boolean(pubDetailQuery.error)
      : false;

  const openViewer = useCallback((image: string) => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      lastFocusedElementRef.current = document.activeElement;
    } else {
      lastFocusedElementRef.current = null;
    }
    setViewerImage(image);
  }, []);

  const handleViewerOpenChange = useCallback((open: boolean) => {
    if (open) {
      return;
    }

    setViewerImage(null);
    const previous = lastFocusedElementRef.current;
    if (previous) {
      previous.focus();
    }
    lastFocusedElementRef.current = null;
  }, []);

  const imageViewerDialog = (
    <Dialog open={Boolean(viewerImage)} onOpenChange={handleViewerOpenChange}>
      <DialogContent className="max-h-[92vh] w-fit max-w-[92vw] border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">이미지 상세 보기</DialogTitle>
        {viewerImage && (
          <img
            src={viewerImage}
            alt="상세 이미지"
            className="max-h-[90vh] max-w-[90vw] rounded-xl"
          />
        )}
      </DialogContent>
    </Dialog>
  );

  if (!selectedItem) {
    return (
      <div className="py-6 text-center text-sm font-semibold text-[var(--boothmap-text-muted)]">
        선택된 항목이 없어요
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-[var(--boothmap-border)] bg-[var(--boothmap-surface)] p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-6 w-32 animate-pulse rounded bg-[var(--boothmap-surface-softer)]" />
              <div className="h-4 w-20 animate-pulse rounded bg-[var(--boothmap-surface-soft)]" />
            </div>

            <button
              onClick={onClose}
              className="text-xl font-bold text-[var(--boothmap-text-muted)] hover:text-[var(--boothmap-text-subtle)]"
            >
              ×
            </button>
          </div>

          <div className="mt-4 h-44 w-full animate-pulse rounded-xl bg-[var(--boothmap-surface-softer)]" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-[var(--boothmap-surface-soft)]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--boothmap-surface-soft)]" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--boothmap-surface-soft)]" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-[var(--boothmap-danger-border)] bg-[var(--boothmap-surface)] p-6 text-center shadow-sm">
        <div className="text-sm font-semibold text-[var(--boothmap-danger-text)]">
          상세 정보를 불러오지 못했어요
        </div>
        <button
          onClick={onClose}
          className="mt-4 rounded-xl bg-[var(--boothmap-surface-soft)] px-4 py-2 text-sm font-bold text-[var(--boothmap-text-subtle)]"
        >
          닫기
        </button>
      </div>
    );
  }

  if (selectedItem.kind === "booth" && boothDetail) {
    const booth = booths.find((item) => item.id === selectedItem.id);
    const boothImageUrl = boothDetail.imageUrl ?? null;
    const operatingTimeText = formatOperatingTime(boothDetail.startTime, boothDetail.endTime);

    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-[var(--boothmap-border)] bg-[var(--boothmap-surface)] p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-extrabold text-[var(--boothmap-text)]">
                {boothDetail.name}
              </div>

              {booth?.type && (
                <div className="text-sm font-bold text-[var(--boothmap-text-subtle)]">
                  {booth.type}
                </div>
              )}

              {operatingTimeText && (
                <div className="mt-1 text-sm font-semibold text-[var(--boothmap-text-subtle)]">
                  {operatingTimeText}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-xl font-bold text-[var(--boothmap-text-muted)] hover:text-[var(--boothmap-text-subtle)]"
            >
              ×
            </button>
          </div>

          {boothImageUrl && (
            <div className="mt-3 rounded-xl bg-[var(--boothmap-surface-soft)] p-2">
              <button
                type="button"
                onClick={() => openViewer(boothImageUrl)}
                aria-label="부스 이미지 상세 보기"
                className="mx-auto block max-h-[320px] w-auto max-w-full cursor-pointer rounded-xl"
              >
                <img
                  src={boothImageUrl}
                  alt={`${boothDetail.name} 이미지`}
                  loading="lazy"
                  className="mx-auto max-h-[320px] w-auto max-w-full rounded-xl object-contain"
                />
              </button>
            </div>
          )}

          <div className="mt-4 text-sm font-medium leading-6 text-[var(--boothmap-text-subtle)]">
            {boothDetail.description || "등록된 상세 정보가 없어요"}
          </div>
        </div>

        {imageViewerDialog}
      </div>
    );
  }

  if (selectedItem.kind === "pub" && pubDetail) {
    const summaryPub = pubs.find((item) => item.id === selectedItem.id);
    const fallbackCollege =
      colleges.find((college) => college.id === summaryPub?.college_id)?.name ?? "단과대";
    const displayCollege = pubDetail.collegeName || fallbackCollege;
    const imageUrls = pubDetail.imageUrls ?? [];
    const operatingTimeText = formatOperatingTime(pubDetail.startTime, pubDetail.endTime);

    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-[var(--boothmap-border)] bg-[var(--boothmap-surface)] p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-extrabold text-[var(--boothmap-text)]">
                {pubDetail.name}
              </div>

              <div className="text-sm font-bold text-[var(--boothmap-text-subtle)]">
                {displayCollege}
                {pubDetail.department ? ` ${pubDetail.department}` : ""}
              </div>

              {operatingTimeText && (
                <div className="mt-1 text-sm font-semibold text-[var(--boothmap-text-subtle)]">
                  {operatingTimeText}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-xl font-bold text-[var(--boothmap-text-muted)] hover:text-[var(--boothmap-text-subtle)]"
            >
              ×
            </button>
          </div>

          {imageUrls.length > 0 && (
            <div className="mt-3">
              <div
                className="flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-hide"
                onScroll={(event) => {
                  const element = event.currentTarget;
                  const itemWidth = element.clientWidth * 0.85 + 12;
                  const index = Math.round(element.scrollLeft / itemWidth);
                  setCurrentIndex(index);
                }}
              >
                {imageUrls.map((imageUrl, index) => (
                  <div key={index} className="w-[85%] flex-shrink-0 snap-start">
                    <button
                      type="button"
                      onClick={() => openViewer(imageUrl)}
                      aria-label={`주점 이미지 ${index + 1} 상세 보기`}
                      className="block w-full cursor-pointer rounded-xl"
                    >
                      <img
                        src={imageUrl}
                        alt={`${pubDetail.name} 이미지 ${index + 1}`}
                        loading="lazy"
                        className="w-full rounded-xl object-contain"
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex justify-center gap-1">
                {imageUrls.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-1.5 rounded-full ${
                      currentIndex === index
                        ? "bg-[var(--boothmap-accent)]"
                        : "bg-[var(--boothmap-surface-softer)]"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {pubDetail.intro && (
            <div className="mt-4 rounded-xl bg-[var(--boothmap-accent-soft)] px-3 py-2 text-sm font-bold text-[var(--boothmap-accent-text)]">
              {pubDetail.intro}
            </div>
          )}

          {(pubDetail.description || summaryPub?.intro) && (
            <div className="mt-4 text-sm font-medium leading-6 text-[var(--boothmap-text-subtle)]">
              {pubDetail.description || summaryPub?.intro}
            </div>
          )}

          {pubDetail.instagram && (
            <a
              href={
                pubDetail.instagram.startsWith("http")
                  ? pubDetail.instagram
                  : `https://instagram.com/${pubDetail.instagram.replace("@", "")}`
              }
              target="_blank"
              rel="noreferrer"
              className="mt-4 block text-sm font-extrabold text-[var(--boothmap-accent)] underline underline-offset-2"
            >
              {pubDetail.instagram}
            </a>
          )}
        </div>

        {imageViewerDialog}
      </div>
    );
  }

  return (
    <div className="py-6 text-center text-sm font-semibold text-[var(--boothmap-text-muted)]">
      표시할 상세 정보가 없어요
    </div>
  );
}
