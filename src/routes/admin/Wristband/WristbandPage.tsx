import { useState } from "react";
import { WristbandDashboard } from "@/components/admin/WristbandDashboard";
import { WristbandOperationScreen } from "@/components/admin/WristbandOperationScreen";
import type { WristbandSession } from "@/types/model/wristband.model";

export default function WristbandPage() {
  const [selectedSession, setSelectedSession] = useState<WristbandSession | null>(null);

  if (selectedSession) {
    return (
      <WristbandOperationScreen
        eventId={selectedSession.id}
        date={selectedSession.date}
        title={selectedSession.title}
        onBack={() => setSelectedSession(null)}
      />
    );
  }

  return <WristbandDashboard onSelectSession={setSelectedSession} />;
}
