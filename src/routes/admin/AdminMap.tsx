// 역할: /admin/map 개발자 전용 관리자 페이지의 상단 탭 구조를 제공한다.
import { useState } from "react";
import { Toaster } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/common/ui/tabs";
import AdminBoothManagerPanel from "@/routes/admin/components/AdminBoothManagerPanel";
import AdminMapEditorPanel from "@/routes/admin/components/AdminMapEditorPanel";
import AdminTimetableManagerPanel from "@/routes/admin/components/AdminTimetableManagerPanel";

type AdminTab = "MAP" | "BOOTH" | "TIMETABLE";

export default function AdminMap() {
  const [activeTab, setActiveTab] = useState<AdminTab>("MAP");
  const tabNavigation = <AdminTabNavigation activeTab={activeTab} onChange={setActiveTab} />;

  return (
    <>
      <Toaster position="top-right" closeButton richColors />
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdminTab)}>
        <TabsContent value="MAP" className="m-0">
          <AdminMapEditorPanel topSlot={tabNavigation} />
        </TabsContent>

        <TabsContent value="BOOTH" className="m-0">
          <AdminBoothManagerPanel topSlot={tabNavigation} />
        </TabsContent>

        <TabsContent value="TIMETABLE" className="m-0">
          <AdminTimetableManagerPanel topSlot={tabNavigation} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function AdminTabNavigation({
  activeTab,
  onChange,
}: {
  activeTab: AdminTab;
  onChange: (tab: AdminTab) => void;
}) {
  return (
    <div className="mb-6">
      <TabsList className="h-auto rounded-2xl border border-[var(--border-base)] bg-white p-1 shadow-sm">
        <TabsTrigger
          value="MAP"
          onClick={() => onChange("MAP")}
          className="min-w-[112px] rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:border-[var(--border-base)] data-[state=active]:bg-[var(--surface-subtle)]"
        >
          Map
        </TabsTrigger>
        <TabsTrigger
          value="BOOTH"
          onClick={() => onChange("BOOTH")}
          className="min-w-[112px] rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:border-[var(--border-base)] data-[state=active]:bg-[var(--surface-subtle)]"
        >
          Booth
        </TabsTrigger>
        <TabsTrigger
          value="TIMETABLE"
          onClick={() => onChange("TIMETABLE")}
          className="min-w-[112px] rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:border-[var(--border-base)] data-[state=active]:bg-[var(--surface-subtle)]"
        >
          Timetable
        </TabsTrigger>
      </TabsList>
    </div>
  );
}
