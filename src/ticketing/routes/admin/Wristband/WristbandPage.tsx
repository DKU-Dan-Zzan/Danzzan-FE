import { useState } from "react";
import { WristbandDashboard } from "@/ticketing/components/admin/WristbandDashboard";
import { WristbandOperationScreen } from "@/ticketing/components/admin/WristbandOperationScreen";
import type { WristbandSession } from "@/ticketing/types/model/wristband.model";

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
