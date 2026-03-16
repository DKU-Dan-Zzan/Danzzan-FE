import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPerformances } from "../../../api/timetableApi";
import type { Performance } from "../../timetable/timetable.types";
import {
  formatDateToYYYYMMDD,
  getCurrentPerformance,
} from "../../../utils/timetable";

const CARD_WIDTH = 314.4;
const CARD_HEIGHT = 94;
const CARD_ASPECT_RATIO = `${CARD_WIDTH} / ${CARD_HEIGHT}`;

export default function CurrentPerformanceSection() {
  const navigate = useNavigate();

  const [performances, setPerformances] = useState<Performance[]>([]);
  const [now, setNow] = useState(new Date());
  const [today, setToday] = useState(formatDateToYYYYMMDD(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTodayPerformances = async () => {
      try {
        setLoading(true);
        setError(false);

        const data = await getPerformances(today);
        setPerformances(data.performances ?? []);
      } catch (e) {
        console.error("[CurrentPerformanceSection] 공연 목록 조회 실패:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayPerformances();
  }, [today]);

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
    return getCurrentPerformance(performances, now);
  }, [performances, now]);

  if (loading || error || !currentPerformance) {
    return null;
  }

  return (
    <section className="mt-10 px-5">
      <div className="mx-auto w-full max-w-[314px]">
        <p className="mb-3 text-sm font-semibold text-gray-500">
          현재 공연
        </p>

        <button
          type="button"
          onClick={() => navigate(`/timetable?date=${today}`)}
          style={{ aspectRatio: CARD_ASPECT_RATIO }}
          className="w-full rounded-[22px] border border-gray-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition active:scale-[0.99]"
        >
          <div className="flex h-full items-center gap-4">
            <div className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
              <img
                src={
                  currentPerformance.artistImageUrl || "/images/default-artist.png"
                }
                alt={currentPerformance.artistName}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 text-left">
              {/* LIVE 표시 */}
              {/* <div className="mb-1.5 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[var(--bg-page-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  LIVE
                </span>
              </div> */}

              <p className="truncate text-[18px] font-bold leading-tight text-gray-900">
                {currentPerformance.artistName}
              </p>

              <p className="mt-1 text-[14px] font-medium text-gray-500">
                {currentPerformance.startTime} - {currentPerformance.endTime}
              </p>
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}