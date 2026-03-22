import { Megaphone } from "lucide-react";
import { Card } from "@/components/common/ui/card";
import { cn } from "@/components/common/ui/utils";
import { TICKETING_CLASSES } from "@/components/ticketing/panels/TicketingShared";
import type { PlacementAd } from "@/types/ticketing/model/ad.model";

const AD_PLACEHOLDER_IMAGE = "/ads/waiting-room-sample-banner.svg";

// 광고 슬롯 크기를 변경하려면 아래 상수만 수정하세요.
const AD_SLOT_MAX_WIDTH_CLASS = "max-w-[var(--ticketing-ad-slot-max-width)]";
const AD_SLOT_ASPECT_RATIO_CLASS = "aspect-[16/4.7]";
const AD_LINK_FOCUS_VISIBLE_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]";

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
    <Card className={cn(TICKETING_CLASSES.card.summaryInfo, "gap-1.5 px-3 py-2.5")}>
      <div className="flex items-center justify-between">
        <p className={cn("flex items-center gap-1.5 text-[var(--text-muted)]", TICKETING_CLASSES.typography.sectionBodySm)}>
          <Megaphone className="h-3.5 w-3.5" />
          광고
        </p>
        <span className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-tint-subtle)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--accent)]">
          AD
        </span>
      </div>

      <div className={cn("mx-auto w-full overflow-hidden rounded-[14px] border border-[var(--border-base)]", AD_SLOT_MAX_WIDTH_CLASS)}>
        {adLink ? (
          <a
            href={adLink}
            target="_blank"
            rel="noreferrer"
            className={cn("block", AD_LINK_FOCUS_VISIBLE_CLASS)}
          >
            <div className={cn("w-full bg-[var(--surface-subtle)]", AD_SLOT_ASPECT_RATIO_CLASS)}>
              <img src={adImageUrl} alt={adAlt} className="h-full w-full object-cover" loading="lazy" />
            </div>
          </a>
        ) : (
          <div className={cn("w-full bg-[var(--surface-subtle)]", AD_SLOT_ASPECT_RATIO_CLASS)}>
            <img src={adImageUrl} alt={adAlt} className="h-full w-full object-cover" loading="lazy" />
          </div>
        )}
      </div>
    </Card>
  );
}
