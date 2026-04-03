import { memo } from "react";
import { ChevronRight, Clock3 } from "lucide-react";
import type { Pub } from "@/types/app/boothmap/boothmap.types";
import { formatOperatingTime } from "@/utils/app/boothmap/formatOperatingTime";

function PubList({
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
      <div className="rounded-[26px] border border-[var(--boothmap-border)] bg-[color:color-mix(in_srgb,var(--boothmap-surface)_90%,white)] px-5 py-8 text-center shadow-[var(--boothmap-card-shadow)]">
        <div className="text-sm font-semibold text-[var(--boothmap-text-muted)]">
          단과대를 선택하면 주점을 볼 수 있어요.
        </div>
      </div>
    );
  }

  if (pubs.length === 0) {
    return (
      <div className="rounded-[26px] border border-[var(--boothmap-border)] bg-[color:color-mix(in_srgb,var(--boothmap-surface)_90%,white)] px-5 py-8 text-center shadow-[var(--boothmap-card-shadow)]">
        <div className="text-sm font-semibold text-[var(--boothmap-text-muted)]">
          해당 단과대 주점 정보가 아직 없어요.
        </div>
      </div>
    );
  }

  const commonOperatingTime = formatOperatingTime(pubs[0]?.startTime, pubs[0]?.endTime);

  return (
    <div className="space-y-3">
      {commonOperatingTime && (
        <div className="rounded-[24px] border border-[var(--boothmap-border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--boothmap-surface)_96%,white)_0%,color-mix(in_srgb,var(--boothmap-surface-soft)_92%,white)_100%)] px-4 py-3 shadow-[var(--boothmap-card-shadow)]">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--boothmap-text-muted)]">
              운영시간
            </div>
            <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--boothmap-text-subtle)]">
              <Clock3 className="h-3.5 w-3.5" />
              {commonOperatingTime}
            </div>
          </div>
        </div>
      )}

      {pubs.map((pub) => (
        <button
          key={pub.id}
          type="button"
          onClick={() => onSelectPub(pub.id)}
          className="w-full rounded-[26px] border border-[var(--boothmap-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--boothmap-surface)_96%,white)_0%,color-mix(in_srgb,var(--boothmap-surface-soft)_86%,white)_100%)] p-4 text-left shadow-[var(--boothmap-card-shadow)] transition hover:-translate-y-0.5 hover:shadow-[var(--boothmap-card-shadow-strong)]"
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[17px] font-extrabold tracking-[-0.02em] text-[var(--boothmap-text)]">
                {pub.name}
              </div>

              {pub.department && (
                <div className="mt-1 truncate text-sm font-semibold text-[var(--boothmap-text-subtle)]">
                  {pub.department}
                </div>
              )}

              {pub.intro && (
                <div className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-[var(--boothmap-text-subtle)]">
                  {pub.intro}
                </div>
              )}

              {pub.instagram && (
                <div className="mt-2 text-xs font-bold text-[var(--boothmap-accent)]">
                  {pub.instagram}
                </div>
              )}
            </div>

            {(pub.thumbnailUrl || pub.mainImageUrl) && (
              <img
                src={pub.thumbnailUrl || pub.mainImageUrl}
                data-fallback-src={pub.mainImageUrl}
                loading="lazy"
                decoding="async"
                alt={pub.name}
                width={64}
                height={64}
                onError={(event) => {
                  const fallbackSrc = event.currentTarget.dataset.fallbackSrc;
                  if (!fallbackSrc || event.currentTarget.src === fallbackSrc) {
                    return;
                  }
                  event.currentTarget.src = fallbackSrc;
                }}
                className="h-16 w-16 flex-shrink-0 rounded-[18px] object-cover shadow-[var(--boothmap-card-shadow)]"
              />
            )}

            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--boothmap-surface-soft)_90%,white)] text-[var(--boothmap-text-muted)]">
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default memo(PubList);
