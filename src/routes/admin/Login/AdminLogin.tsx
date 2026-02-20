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
    id: "wristband" as const,
    label: "팔찌 배부 운영 시스템",
    icon: Ticket,
    iconBg: "bg-primary-soft",
    iconColor: "text-primary",
  },
  {
    id: "board" as const,
    label: "공지사항 · 분실물 게시판 관리",
    icon: Megaphone,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
];

type SystemId = "wristband" | "board";

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="text-center space-y-2">
        <p className="text-3xl font-bold tracking-tight text-foreground">DAN-ZZAN</p>
        <p className="text-sm text-muted-foreground">Festival Operations Admin System</p>
      </div>

      <Card className="mt-8 w-full max-w-2xl p-10 shadow-sm border-border">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">관리자 시스템 로그인</h1>
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-sm font-semibold text-foreground">접속 시스템</p>
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
                      ? "border-primary bg-primary-soft shadow-[0_0_0_2px_rgba(30,79,143,0.18)]"
                      : "border-border bg-card hover:border-muted-foreground/40",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full border",
                        isSelected ? "border-primary bg-primary" : "border-border bg-card",
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
                    <span className="text-sm font-semibold text-foreground">{system.label}</span>
                  </div>
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border",
                      isSelected ? "border-primary bg-primary" : "border-border bg-card",
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
              className="bg-card"
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
              className="bg-card"
              required
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "로그인 중..." : "관리자 로그인"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        본 시스템은 총학생회 및 운영진 전용 내부 관리 도구입니다.
      </p>
    </div>
  );
}
