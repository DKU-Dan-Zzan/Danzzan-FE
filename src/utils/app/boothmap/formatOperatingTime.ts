export const formatOperatingTime = (
  startTime?: string | null,
  endTime?: string | null,
): string | null => {
  if (!startTime || !endTime) {
    return null;
  }

  return `${startTime} ~ ${endTime}`;
};
