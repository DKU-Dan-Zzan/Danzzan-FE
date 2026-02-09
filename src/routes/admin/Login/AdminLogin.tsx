import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Megaphone, Ticket } from "lucide-react";
import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import { cn } from "@/components/common/ui/utils";
import { useAdminSystem } from "@/hooks/useAdminSystem";
import { useAuth } from "@/hooks/useAuth";

const systems = [
  {
    id: "wristband",
    label: "팔찌 배부 운영 시스템",
    icon: Ticket,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
  },
  {
    id: "board",
    label: "공지사항 · 분실물 게시판 관리",
    icon: Megaphone,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
];

type SystemId = (typeof systems)[number]["id"];

export default function AdminLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const storedSystem = useAdminSystem();
  const target = searchParams.get("target") ?? "";
  const redirect = searchParams.get("redirect");

  const initialSystem = (systems.find((system) => system.id === target)?.id ??
    storedSystem ??
    "wristband") as SystemId;

  const [selectedSystem, setSelectedSystem] = useState<SystemId>(initialSystem);
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const matched = systems.find((system) => system.id === target);
    if (matched) {
      setSelectedSystem(matched.id);
    }
  }, [target]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ studentId, password }, "admin", selectedSystem);
      if (redirect && redirect.startsWith("/admin")) {
        navigate(redirect);
        return;
      }
      navigate(selectedSystem === "board" ? "/admin/board" : "/admin/wristband");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] flex flex-col items-center justify-center px-4 py-10">
      <div className="text-center space-y-2">
        <p className="text-3xl font-bold tracking-tight text-gray-900">DAN-SPOT</p>
        <p className="text-sm text-gray-500">Festival Operations Admin System</p>
      </div>

      <Card className="mt-8 w-full max-w-2xl p-10 shadow-xl border border-gray-200">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-gray-900">관리자 시스템 로그인</h1>
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-sm font-semibold text-gray-700">접속 시스템</p>
          <div className="space-y-3" role="radiogroup" aria-label="접속 시스템 선택">
            {systems.map((system) => {
              const isSelected = selectedSystem === system.id;
              const Icon = system.icon;

              return (
                <button
                  key={system.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedSystem(system.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left transition",
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]"
                      : "border-gray-200 bg-white hover:border-gray-300",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full border",
                        isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white",
                      )}
                    />
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        system.iconBg,
                      )}
                    >
                      <Icon className={cn("h-5 w-5", system.iconColor)} />
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{system.label}</span>
                  </div>
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border",
                      isSelected ? "border-blue-600 bg-blue-600" : "border-gray-200 bg-white",
                    )}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="studentId">관리자 학번</Label>
            <Input
              id="studentId"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="학번을 입력하세요"
              className="bg-gray-50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">관리자 비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="bg-gray-50"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={submitting}
          >
            {submitting ? "로그인 중..." : "관리자 로그인"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-xs text-gray-400">
        본 시스템은 총학생회 및 운영진 전용 내부 관리 도구입니다.
      </p>
    </div>
  );
}
