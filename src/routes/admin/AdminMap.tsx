// 역할: /admin/map 개발자 전용 관리자 페이지의 상단 탭 구조를 제공한다.
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/common/ui/tabs";
import { AdminShell } from "@/components/layout/AdminShell";
import AdminMapEditorPanel from "@/routes/admin/components/AdminMapEditorPanel";

type AdminTab = "MAP" | "BOOTH";

export default function AdminMap() {
  const [activeTab, setActiveTab] = useState<AdminTab>("MAP");
  const tabNavigation = (
    <AdminTabNavigation activeTab={activeTab} onChange={setActiveTab} />
  );

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdminTab)}>
      <TabsContent value="MAP" className="m-0">
        <AdminMapEditorPanel topSlot={tabNavigation} />
      </TabsContent>

      <TabsContent value="BOOTH" className="m-0">
        <AdminShell
          title="개발자 전용 관리자 페이지"
          eyebrow="DEVELOPER ADMIN"
          headerClassName="sticky top-0 z-20 border-b border-[var(--border-base)] bg-[var(--admin-header-bg)]"
          mainClassName="mx-auto w-full max-w-[1360px] px-6 py-6"
        >
          {tabNavigation}

          <section className="rounded-3xl border border-[var(--border-base)] bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--text)]">Booth</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Booth 관리 기능은 다음 단계에서 추가됩니다.
            </p>
          </section>
        </AdminShell>
      </TabsContent>
    </Tabs>
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
      </TabsList>
    </div>
  );
}
