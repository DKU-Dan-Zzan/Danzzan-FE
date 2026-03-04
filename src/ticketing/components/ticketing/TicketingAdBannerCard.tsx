import { Megaphone } from "lucide-react";
import { Card } from "@/ticketing/components/common/ui/card";
import { TICKETING_CLASSES } from "@/ticketing/components/ticketing/ticketingShared";
import type { PlacementAd } from "@/types/ticketing/model/ad.model";

const AD_PLACEHOLDER_IMAGE = "/ads/waiting-room-sample-banner.svg";

// 광고 슬롯 크기를 변경하려면 아래 상수만 수정하세요.
const AD_SLOT_MAX_WIDTH_CLASS = "max-w-[18rem]";
const AD_SLOT_ASPECT_RATIO_CLASS = "aspect-[16/4.7]";

const buildVersionedImageUrl = (imageUrl: string, updatedAt: string): string => {
  if (!imageUrl) {
    return AD_PLACEHOLDER_IMAGE;
  }
  if (!updatedAt) {
    return imageUrl;
  }

  const version = encodeURIComponent(updatedAt);
  return imageUrl.includes("?") ? `${imageUrl}&v=${version}` : `${imageUrl}?v=${version}`;
};

interface TicketingAdBannerCardProps {
  ad: PlacementAd | null;
}

export function TicketingAdBannerCard({ ad }: TicketingAdBannerCardProps) {
  const adImageUrl = ad ? buildVersionedImageUrl(ad.imageUrl, ad.updatedAt) : AD_PLACEHOLDER_IMAGE;
  const adAlt = ad?.altText?.trim() || "단짠 대기열 광고";
  const adLink = ad?.linkUrl?.trim() || null;

  return (
    <Card className={`${TICKETING_CLASSES.card.summaryInfo} gap-1.5 px-3 py-2.5`}>
      <div className="flex items-center justify-between">
        <p className={`flex items-center gap-1.5 ${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>
          <Megaphone className="h-3.5 w-3.5" />
          광고
        </p>
        <span className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-tint-subtle)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--accent)]">
          AD
        </span>
      </div>

      <div className={`mx-auto w-full ${AD_SLOT_MAX_WIDTH_CLASS} overflow-hidden rounded-[14px] border border-[var(--border-base)]`}>
        {adLink ? (
          <a
            href={adLink}
            target="_blank"
            rel="noreferrer"
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <div className={`${AD_SLOT_ASPECT_RATIO_CLASS} w-full bg-[var(--surface-subtle)]`}>
              <img src={adImageUrl} alt={adAlt} className="h-full w-full object-cover" loading="lazy" />
            </div>
          </a>
        ) : (
          <div className={`${AD_SLOT_ASPECT_RATIO_CLASS} w-full bg-[var(--surface-subtle)]`}>
            <img src={adImageUrl} alt={adAlt} className="h-full w-full object-cover" loading="lazy" />
          </div>
        )}
      </div>
    </Card>
  );
}
