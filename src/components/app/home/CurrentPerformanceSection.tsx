// 역할: home 화면에서 사용하는 Current Performance Section UI 블록을 렌더링합니다.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPerformances } from "@/api/app/timetable/timetableApi";
import type { Performance } from "@/types/app/timetable/timetable.types";
import {
  formatDateToYYYYMMDD,
  getCurrentPerformance,
} from "@/utils/app/timetable";
import { useLanguage, useT } from "@/i18n";
import { appQueryKeys, useAppQuery } from "@/lib/query";
import { cn } from "@/components/common/ui/utils";

const CARD_WIDTH = 314.4;
const CARD_HEIGHT = 94;
const CARD_ASPECT_RATIO = `${CARD_WIDTH} / ${CARD_HEIGHT}`;

export default function CurrentPerformanceSection() {
  const t = useT();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [now, setNow] = useState(new Date());
  const [today, setToday] = useState(formatDateToYYYYMMDD(new Date()));

  const performancesQuery = useAppQuery({
    queryKey: appQueryKeys.timetablePerformances(language, today),
    queryFn: ({ signal }) => getPerformances(today, { signal }),
    staleTime: 60_000,
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const newNow = new Date();
      setNow(newNow);

      const newToday = formatDateToYYYYMMDD(newNow);
      setToday((prev) => (prev !== newToday ? newToday : prev));
    }, 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const currentPerformance = useMemo(() => {
    const performances: Performance[] = performancesQuery.data?.performances ?? [];
    return getCurrentPerformance(performances, now);
  }, [performancesQuery.data, now]);

  const status = performancesQuery.isPending
    ? "loading"
    : performancesQuery.isError
      ? "error"
      : currentPerformance
        ? "active"
        : "empty";

  const helperText =
    status === "loading"
      ? t("home.performanceLoading")
      : status === "error"
        ? performancesQuery.error?.message ?? t("home.performanceError")
      : status === "empty"
          ? t("home.performanceEmpty")
          : null;

  const handleRetry = () => {
    void performancesQuery.refetch();
  };

  return (
    <section className="px-5">
      <div className="mx-auto w-full max-w-[314px]">
        <p className="mb-[var(--home-current-performance-caption-gap)] text-center text-[length:var(--home-lineup-caption-font-size)] leading-[1.4] font-bold text-[var(--home-lineup-caption-color)]">
          {t("home.performanceCaption")}
        </p>

        <button
          type="button"
          onClick={() => navigate(`/timetable?date=${today}`)}
          style={{ aspectRatio: CARD_ASPECT_RATIO }}
          className={cn(
            "w-full rounded-[var(--radius-xl)] border border-[var(--card-outline-border)] bg-[var(--card-outline-bg)] px-5 py-4 shadow-[var(--card-outline-shadow)] transition active:scale-[0.99]",
          )}
        >
          {status === "active" && currentPerformance ? (
            <div className="flex h-full items-center gap-4">
              <div className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-full bg-[var(--surface_container_lowest)]">
                <img
                  src={currentPerformance.artistImageUrl || "/images/default-artist.png"}
                  alt={currentPerformance.artistName}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[18px] font-bold leading-tight text-[var(--text-body-deep)]">
                  {currentPerformance.artistName}
                </p>

                <p className="mt-1 text-[14px] font-semibold text-[var(--text-body-deep)]">
                  {currentPerformance.startTime} - {currentPerformance.endTime}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center gap-4">
              <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-[var(--surface_container_lowest)] text-xs font-semibold text-[var(--text-body-deep)]">
                NOW
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[16px] font-semibold leading-tight text-[var(--text-body-deep)]">{helperText}</p>
                <p className="mt-1 text-[13px] font-semibold text-[var(--text-body-deep)]">{t("home.performanceHelperCta")}</p>
              </div>
            </div>
          )}
        </button>
        {status === "error" && (
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex rounded-[var(--radius-md)] bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary_container)_100%)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-on-accent)] shadow-[var(--ec-ambient-shadow)]"
            >
              {t("common.retry")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
