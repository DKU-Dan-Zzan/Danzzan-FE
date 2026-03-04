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
