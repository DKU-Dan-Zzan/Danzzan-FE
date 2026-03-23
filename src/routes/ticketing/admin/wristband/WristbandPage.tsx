// 역할: 팔찌 운영 대시보드와 작업 화면을 조합한 관리자 페이지 컨테이너입니다.
import { useState } from "react";
import { WristbandDashboard } from "@/components/ticketing/admin/WristbandDashboard";
import { WristbandOperationScreen } from "@/components/ticketing/admin/WristbandOperationScreen";
import type { WristbandSession } from "@/types/ticketing/model/wristband.model";

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

  return <WristbandDashboard onSelectSession={setSelectedSession} />;
}
