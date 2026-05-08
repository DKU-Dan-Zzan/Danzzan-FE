// 역할: 팔찌 운영 대시보드와 작업 화면을 조합한 관리자 페이지 컨테이너입니다.
import { useState } from "react";
import { WristbandDashboard } from "@/components/ticketing/admin/WristbandDashboard";
import { WristbandOperationScreen } from "@/components/ticketing/admin/WristbandOperationScreen";
import type { WristbandSession } from "@/types/ticketing/model/wristband.model";

const WRISTBAND_DATE_DISPLAY_MAP: Record<string, string> = {
  "2026-05-07": "2026-05-13",
  "2026-05-08": "2026-05-14",
};

const mapWristbandDateForDisplay = (date: string): string => {
  return WRISTBAND_DATE_DISPLAY_MAP[date] ?? date;
};

const mapWristbandSessionDateForDisplay = (session: WristbandSession): WristbandSession => {
  const mappedDate = mapWristbandDateForDisplay(session.date);
  if (mappedDate === session.date) {
    return session;
  }

  return {
    ...session,
    date: mappedDate,
  };
};

export default function WristbandPage() {
  const [selectedSession, setSelectedSession] = useState<WristbandSession | null>(null);

  if (selectedSession) {
    return (
      <WristbandOperationScreen
        eventId={selectedSession.id}
        date={selectedSession.date}
        dayLabel={selectedSession.dayLabel}
        onBack={() => setSelectedSession(null)}
      />
    );
  }

  return (
    <WristbandDashboard
      mapSessionDateForDisplay={mapWristbandDateForDisplay}
      onSelectSession={(session) => setSelectedSession(mapWristbandSessionDateForDisplay(session))}
    />
  );
}
