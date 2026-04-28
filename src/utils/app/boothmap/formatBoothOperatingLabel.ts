import type { BoothOperationStatus } from "@/types/app/boothmap/boothmap.types";
import { formatOperatingTime } from "@/utils/app/boothmap/formatOperatingTime";

export const formatBoothOperatingLabel = (
  startTime?: string | null,
  endTime?: string | null,
  operationStatus?: BoothOperationStatus | null,
): string => {
  if (operationStatus === "CLOSED") {
    return "미운영";
  }

  const timeRange = formatOperatingTime(startTime, endTime);
  if (timeRange) {
    return timeRange;
  }

  if (operationStatus === "OPEN") {
    return "운영시간 미정";
  }

  return "운영정보 없음";
};
