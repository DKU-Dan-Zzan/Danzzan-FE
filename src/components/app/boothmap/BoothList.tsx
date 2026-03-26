import type { Booth } from "@/types/app/boothmap/boothmap.types";
import { formatDescription } from "@/utils/app/boothmap/formatDescription";
import { formatOperatingTime } from "@/utils/app/boothmap/formatOperatingTime";

const typeLabel: Record<string, string> = {
  FOOD_TRUCK: "FOOD_TRUCK",
  EXPERIENCE: "EXPERIENCE",
  EVENT: "EVENT",
  FACILITY: "FACILITY",
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
            <div className="truncate text-base font-extrabold text-[var(--boothmap-text)]">
              {booth.name}
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

            <div className="mt-3 text-xs font-bold text-[var(--boothmap-text-muted)]">
              {typeLabel[booth.type]}
            </div>
          </button>
        );
      })}
    </div>
  );
}
