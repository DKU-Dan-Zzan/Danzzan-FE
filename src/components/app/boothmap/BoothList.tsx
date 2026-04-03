import { ChevronRight, Clock3 } from "lucide-react";
import { cn } from "@/components/common/ui/utils";
import type { Booth } from "@/types/app/boothmap/boothmap.types";
import { formatDescription } from "@/utils/app/boothmap/formatDescription";
import { formatOperatingTime } from "@/utils/app/boothmap/formatOperatingTime";

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
      <div className="rounded-[26px] border border-[var(--boothmap-border)] bg-[color:color-mix(in_srgb,var(--boothmap-surface)_90%,white)] px-5 py-8 text-center shadow-[var(--boothmap-card-shadow)]">
        <div className="text-sm font-semibold text-[var(--boothmap-text-muted)]">
          표시할 부스가 아직 없어요.
        </div>
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
            className="w-full rounded-[26px] border border-[var(--boothmap-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--boothmap-surface)_96%,white)_0%,color-mix(in_srgb,var(--boothmap-surface-soft)_86%,white)_100%)] p-4 text-left shadow-[var(--boothmap-card-shadow)] transition hover:-translate-y-0.5 hover:shadow-[var(--boothmap-card-shadow-strong)]"
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => onSelectBooth(booth.id)}
                className="min-w-0 flex-1 pl-1 text-left"
              >
                <div className="truncate text-[17px] font-extrabold tracking-[-0.02em] text-[var(--boothmap-text)]">
                  {booth.name}
                </div>
              </button>

              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                <div
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none tracking-[-0.01em]",
                    typeBadgeClassName[booth.type],
                  )}
                >
                  {typeLabel[booth.type]}
                </div>
              </div>
            </div>

            {(operatingTimeText || hasDetail) && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--boothmap-surface-soft)_90%,white)] px-2 py-1 text-sm font-semibold text-[var(--boothmap-text-subtle)]">
                  <Clock3 className="h-3.5 w-3.5" />
                  {operatingTimeText || "운영시간 정보 없음"}
                </div>

                {hasDetail && (
                  <button
                    type="button"
                    onClick={() => onOpenBoothDetail(booth.id)}
                    aria-label={`${booth.name} 상세보기`}
                    className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--boothmap-panel-border)_72%,white)] bg-[color:color-mix(in_srgb,var(--boothmap-surface)_90%,white)] text-[var(--boothmap-text-subtle)] transition hover:bg-[var(--boothmap-surface-soft)]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {description && (
              <div className="mt-3 line-clamp-2 whitespace-pre-line text-sm font-medium leading-6 text-[var(--boothmap-text-subtle)]">
                {description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
