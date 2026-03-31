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
    "border-[var(--boothmap-marker-food-truck)] bg-[var(--boothmap-marker-food-truck)] text-[var(--boothmap-overlay-badge-text)]",
  EXPERIENCE:
    "border-[var(--boothmap-marker-experience)] bg-[var(--boothmap-marker-experience)] text-[var(--boothmap-overlay-badge-text)]",
  EVENT:
    "border-[var(--boothmap-marker-event)] bg-[var(--boothmap-marker-event)] text-[var(--boothmap-text)]",
  FACILITY:
    "border-[var(--boothmap-marker-facility)] bg-[var(--boothmap-marker-facility)] text-[var(--boothmap-overlay-badge-text)]",
};

export default function BoothList({
  booths,
  onSelectBooth,
}: {
  booths: Booth[];
  onSelectBooth: (id: number) => void;
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

        return (
          <button
            key={booth.id}
            type="button"
            onClick={() => onSelectBooth(booth.id)}
            className="w-full rounded-2xl border border-[var(--boothmap-border)] bg-[var(--boothmap-surface)] p-4 text-left shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 truncate text-base font-extrabold text-[var(--boothmap-text)]">
                {booth.name}
              </div>

              <div
                className={[
                  "inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none shadow-[0_1px_2px_var(--boothmap-overlay-shadow)]",
                  typeBadgeClassName[booth.type],
                ].join(" ")}
              >
                {typeLabel[booth.type]}
              </div>
            </div>

            {operatingTimeText && (
              <div className="mt-1 text-sm font-semibold text-[var(--boothmap-text-subtle)]">
                {operatingTimeText}
              </div>
            )}

            {description && (
              <div className="mt-1 line-clamp-2 whitespace-pre-line text-sm font-medium text-[var(--boothmap-text-subtle)]">
                {description}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
