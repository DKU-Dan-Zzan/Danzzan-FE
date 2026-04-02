import type { Booth } from "@/types/app/boothmap/boothmap.types";
import { formatDescription } from "@/utils/app/boothmap/formatDescription";
import { formatOperatingTime } from "@/utils/app/boothmap/formatOperatingTime";
import { ChevronRight } from "lucide-react";

const typeLabel: Record<string, string> = {
  FOOD_TRUCK: "푸드트럭",
  EXPERIENCE: "부스",
  EVENT: "이벤트",
  FACILITY: "편의시설",
};

const typeBadgeClassName: Record<string, string> = {
  FOOD_TRUCK:
    "border-[color:color-mix(in_srgb,var(--boothmap-marker-food-truck)_18%,white)] bg-[color:color-mix(in_srgb,var(--boothmap-marker-food-truck)_10%,white)] text-[var(--boothmap-marker-food-truck)]",
  EXPERIENCE:
    "border-[color:color-mix(in_srgb,var(--boothmap-marker-experience)_18%,white)] bg-[color:color-mix(in_srgb,var(--boothmap-marker-experience)_10%,white)] text-[var(--boothmap-marker-experience)]",
  EVENT:
    "border-[color:color-mix(in_srgb,var(--boothmap-marker-event)_24%,white)] bg-[color:color-mix(in_srgb,var(--boothmap-marker-event)_14%,white)] text-[color:color-mix(in_srgb,var(--boothmap-marker-event)_70%,black)]",
  FACILITY:
    "border-[color:color-mix(in_srgb,var(--boothmap-marker-facility)_18%,white)] bg-[color:color-mix(in_srgb,var(--boothmap-marker-facility)_10%,white)] text-[var(--boothmap-marker-facility)]",
};

export default function BoothList({
  booths,
  boothDetailAvailability,
  onSelectBooth,
  onOpenBoothDetail,
}: {
  booths: Booth[];
  boothDetailAvailability: Record<number, boolean>;
  onSelectBooth: (id: number) => void;
  onOpenBoothDetail: (id: number) => void;
}) {
  if (booths.length === 0) {
    return (
      <div className="py-6 text-center text-sm font-semibold text-[var(--boothmap-text-muted)]">
        표시할 부스가 없어요
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {booths.map((booth) => {
        const operatingTimeText = formatOperatingTime(booth.startTime, booth.endTime);
        const description = formatDescription(booth.description);
        const hasDetail = booth.type === "FOOD_TRUCK" && Boolean(boothDetailAvailability[booth.id]);

        return (
          <div
            key={booth.id}
            className="w-full rounded-2xl border border-[var(--boothmap-border)] bg-[var(--boothmap-surface)] p-4 text-left shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => onSelectBooth(booth.id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="truncate text-base font-extrabold text-[var(--boothmap-text)]">
                  {booth.name}
                </div>
              </button>

              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                <div
                  className={[
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none tracking-[-0.01em]",
                    typeBadgeClassName[booth.type],
                  ].join(" ")}
                >
                  {typeLabel[booth.type]}
                </div>
              </div>
            </div>

            {(operatingTimeText || hasDetail) && (
              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="min-h-6 text-sm font-semibold text-[var(--boothmap-text-subtle)]">
                  {operatingTimeText}
                </div>

                {hasDetail && (
                  <button
                    type="button"
                    onClick={() => onOpenBoothDetail(booth.id)}
                    aria-label={`${booth.name} 상세보기`}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[var(--boothmap-text-muted)] transition hover:bg-[var(--boothmap-surface-soft)] hover:text-[var(--boothmap-text-subtle)]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {description && (
              <div className="mt-1 line-clamp-2 whitespace-pre-line text-sm font-medium text-[var(--boothmap-text-subtle)]">
                {description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
