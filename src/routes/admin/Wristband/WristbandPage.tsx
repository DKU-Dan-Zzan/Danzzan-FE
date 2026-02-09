import { useState } from "react";
import { WristbandDashboard } from "@/components/admin/WristbandDashboard";
import { WristbandOperationScreen } from "@/components/admin/WristbandOperationScreen";

export default function WristbandPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (selectedDate) {
    return (
      <WristbandOperationScreen
        date={selectedDate}
        onBack={() => setSelectedDate(null)}
      />
    );
  }

  return <WristbandDashboard onSelectDate={setSelectedDate} />;
}
