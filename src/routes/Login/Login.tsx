import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirect = searchParams.get("redirect");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ studentId, password }, "student");
      navigate(redirect || "/ticketing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="space-y-2">
          <p className="text-sm text-blue-600 font-semibold">DANZZAN Ticketing</p>
          <h1 className="text-2xl font-semibold text-gray-900">학생 로그인</h1>
          <p className="text-sm text-gray-500">
            학번과 비밀번호로 티켓 시스템에 로그인하세요.
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="studentId">학번</Label>
            <Input
              id="studentId"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="학번을 입력하세요"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={submitting}
          >
            {submitting ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
