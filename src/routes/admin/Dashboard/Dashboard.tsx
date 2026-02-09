import { Card } from "@/components/common/ui/card";

export default function AdminDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-6">
        <p className="text-sm text-gray-500">오늘 팔찌 배부</p>
        <p className="text-2xl font-semibold text-gray-900">0건</p>
      </Card>
      <Card className="p-6">
        <p className="text-sm text-gray-500">공지/분실물 처리</p>
        <p className="text-2xl font-semibold text-gray-900">0건</p>
      </Card>
    </div>
  );
}
