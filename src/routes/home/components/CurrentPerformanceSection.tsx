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
  const status = loading
    ? "loading"
    : error
      ? "error"
      : currentPerformance
        ? "active"
        : "empty";

  const helperText =
    status === "loading"
      ? "현재 진행 중인 공연을 확인하고 있어요."
      : status === "error"
        ? "공연 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요."
        : status === "empty"
          ? "현재 진행 중인 공연이 없습니다."
          : null;

  return (
    <section className="px-5">
      <div className="mx-auto w-full max-w-[314px]">
        <p className="home-caption-text home-current-performance-caption">
          현재 진행 중인 공연을 지금 확인하세요
        </p>

        <button
          type="button"
          onClick={() => navigate(`/timetable?date=${today}`)}
          style={{ aspectRatio: CARD_ASPECT_RATIO }}
          className="home-current-performance-card w-full rounded-[22px] border border-gray-100 bg-white px-5 py-4 transition active:scale-[0.99]"
        >
          {status === "active" && currentPerformance ? (
            <div className="flex h-full items-center gap-4">
              <div className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                <img
                  src={currentPerformance.artistImageUrl || "/images/default-artist.png"}
                  alt={currentPerformance.artistName}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[18px] font-bold leading-tight text-gray-900">
                  {currentPerformance.artistName}
                </p>

                <p className="mt-1 text-[14px] font-medium text-gray-500">
                  {currentPerformance.startTime} - {currentPerformance.endTime}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center gap-4">
              <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-500">
                NOW
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[16px] font-semibold leading-tight text-gray-800">{helperText}</p>
                <p className="mt-1 text-[13px] font-medium text-gray-500">타임테이블에서 다음 공연을 확인해 보세요.</p>
              </div>
            </div>
          )}
        </button>
      </div>
    </section>
  );
}
