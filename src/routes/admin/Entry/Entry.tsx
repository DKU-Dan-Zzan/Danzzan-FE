import { useNavigate } from "react-router-dom";
import { Card } from "@/components/common/ui/card";
import { Button } from "@/components/common/ui/button";

const systems = [
  {
    id: "wristband",
    title: "팔찌 배부 운영",
    description: "티켓 확인 및 팔찌 지급 현황을 관리합니다.",
  },
  {
    id: "board",
    title: "공지/분실물 게시판",
    description: "공지사항과 분실물 게시글을 관리합니다.",
  },
];

export default function AdminEntry() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <Card className="w-full max-w-3xl p-10">
        <div className="space-y-2">
          <p className="text-sm text-blue-600 font-semibold">DANZZAN Operations</p>
          <h1 className="text-2xl font-semibold text-gray-900">관리 시스템 선택</h1>
          <p className="text-sm text-gray-500">접속할 운영 시스템을 선택하세요.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {systems.map((system) => (
            <Card key={system.id} className="p-6 border border-gray-200 shadow-sm">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">{system.title}</h2>
                <p className="text-sm text-gray-500">{system.description}</p>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate(`/admin/login?target=${system.id}`)}
                >
                  로그인으로 이동
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
