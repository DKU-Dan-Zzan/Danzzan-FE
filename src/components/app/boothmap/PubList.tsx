import type { Pub } from "@/types/app/boothmap/boothmap.types";
import { ChevronRight } from "lucide-react";

const getOperatingTimeText = (startTime?: string | null, endTime?: string | null) => {
  if (!startTime || !endTime) {
    return null;
  }

  return `${startTime} ~ ${endTime}`;
};

export default function PubList({
  pubs,
  selectedCollegeId,
  onSelectPub,
}: {
  pubs: Pub[];
  selectedCollegeId: number | null;
  onSelectPub: (id: number) => void;
}) {
  if (!selectedCollegeId) {
    return (
      <div className="py-6 text-center text-sm font-semibold text-[var(--boothmap-text-muted)]">
        단과대를 선택하면 주점을 볼 수 있어요
      </div>
    );
  }

  if (pubs.length === 0) {
    return (
      <div className="py-6 text-center text-sm font-semibold text-[var(--boothmap-text-muted)]">
        해당 단과대 주점이 아직 없어요
      </div>
    );
  }

  const commonOperatingTime = getOperatingTimeText(pubs[0]?.startTime, pubs[0]?.endTime);

  return (
    <div className="space-y-3">
      {commonOperatingTime && (
        <div className="rounded-2xl border border-[var(--boothmap-border)] bg-[var(--boothmap-surface-soft)] px-4 py-3 text-sm font-bold text-[var(--boothmap-text-subtle)]">
          운영시간 {commonOperatingTime}
        </div>
      )}

      {pubs.map((pub) => (
        <button
          key={pub.id}
          type="button"
          onClick={() => onSelectPub(pub.id)}
          className="w-full rounded-2xl border border-[var(--boothmap-border)] bg-[var(--boothmap-surface)] p-3 text-left shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-extrabold text-[var(--boothmap-text)]">
                {pub.name}
              </div>

              {pub.department && (
                <div className="mt-1 truncate text-sm font-semibold text-[var(--boothmap-text-subtle)]">
                  {pub.department}
                </div>
              )}

              {pub.intro && (
                <div className="mt-1 line-clamp-2 text-sm font-medium text-[var(--boothmap-text-subtle)]">
                  {pub.intro}
                </div>
              )}

              {pub.instagram && (
                <div className="mt-2 text-xs font-bold text-[var(--boothmap-accent)]">
                  {pub.instagram}
                </div>
              )}
            </div>

            {pub.mainImageUrl && (
              <img
                src={pub.mainImageUrl}
                loading="lazy"
                alt={pub.name}
                className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
              />
            )}

            <ChevronRight className="h-5 w-5 text-[var(--boothmap-text-muted)]" />
          </div>
        </button>
      ))}
    </div>
  );
}
