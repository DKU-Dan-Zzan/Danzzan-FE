import { Compass } from "lucide-react";
import { cn } from "@/components/common/ui/utils";
import { BOOTHMAP_MARKER_THEME } from "@/utils/app/boothmap/boothmapTheme";
import type { PrimaryFilter } from "@/types/app/boothmap/boothmap.types";
import { useT, type TranslationKey } from "@/i18n";

const chips: Array<{ labelKey: TranslationKey | null; value: PrimaryFilter; iconPath?: string }> = [
  { labelKey: null, value: "ALL" },
  { labelKey: "boothmap.type.pub", value: "PUB", iconPath: BOOTHMAP_MARKER_THEME.PUB.iconPath },
  { labelKey: "boothmap.type.foodTruck", value: "FOOD_TRUCK", iconPath: BOOTHMAP_MARKER_THEME.FOOD_TRUCK.iconPath },
  { labelKey: "boothmap.type.experience", value: "EXPERIENCE", iconPath: BOOTHMAP_MARKER_THEME.EXPERIENCE.iconPath },
  { labelKey: "boothmap.type.event", value: "EVENT", iconPath: BOOTHMAP_MARKER_THEME.EVENT.iconPath },
  { labelKey: "boothmap.type.facility", value: "FACILITY", iconPath: BOOTHMAP_MARKER_THEME.FACILITY.iconPath },
];

const CHIP_BASE_CLASS =
  "shrink-0 rounded-full border px-3 py-2 text-sm font-bold tracking-[-0.01em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--boothmap-surface)]";
const CHIP_ACTIVE_CLASS =
  "border-[var(--boothmap-chip-selected-border)] bg-[var(--boothmap-chip-selected-bg)] text-[var(--boothmap-chip-selected-text)] shadow-[var(--boothmap-chip-selected-shadow)]";
const CHIP_INACTIVE_CLASS =
  "border-[var(--boothmap-chip-border)] bg-[color:color-mix(in_srgb,var(--boothmap-chip-bg)_68%,transparent)] text-[var(--boothmap-chip-text)] hover:border-[var(--boothmap-chip-hover-border)] hover:bg-[color:color-mix(in_srgb,var(--boothmap-chip-hover-bg)_76%,transparent)] hover:text-[var(--boothmap-chip-hover-text)]";

export default function PrimaryFilterChips({
  value,
  onChange,
}: {
  value: PrimaryFilter;
  onChange: (v: PrimaryFilter) => void;
}) {
  const t = useT();

  return (
    <div className="-mx-1 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-1.5">
        {chips.map((chip) => {
          const active = value === chip.value;

          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onChange(chip.value)}
              className={cn(
                CHIP_BASE_CLASS,
                active ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS,
              )}
            >
              <span className="flex items-center gap-1.5">
                {chip.iconPath ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 bg-current",
                    )}
                    style={{
                      maskImage: `url(${chip.iconPath})`,
                      WebkitMaskImage: `url(${chip.iconPath})`,
                      maskRepeat: "no-repeat",
                      WebkitMaskRepeat: "no-repeat",
                      maskPosition: "center",
                      WebkitMaskPosition: "center",
                      maskSize: "contain",
                      WebkitMaskSize: "contain",
                    }}
                  />
                ) : (
                  <Compass className="h-3.5 w-3.5" />
                )}
                {chip.labelKey ? t(chip.labelKey) : chip.value}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
