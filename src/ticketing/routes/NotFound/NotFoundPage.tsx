import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ticketing/common/ui/button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-base)] px-6 text-center">
      <h1 className="text-3xl font-semibold text-[var(--text)]">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-[var(--text-muted)]">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      <Button onClick={() => navigate("/")}>메인으로 이동</Button>
    </div>
  );
}
