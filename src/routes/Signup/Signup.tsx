import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import { signupApi } from "@/api/signupApi";
import { HttpError } from "@/api/httpClient";

export default function Signup() {
  const navigate = useNavigate();
  const [dkuStudentId, setDkuStudentId] = useState("");
  const [dkuPassword, setDkuPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 4) {
      setError("비밀번호는 4자 이상이어야 합니다.");
      return;
    }

    setSubmitting(true);

    try {
      setLoadingMessage("단국대 포털 인증 중...");
      const { signupToken } = await signupApi.verifyStudent(
        dkuStudentId,
        dkuPassword,
      );

      setLoadingMessage("계정 생성 중...");
      await signupApi.completeSignup(signupToken, password);

      navigate("/login");
    } catch (err) {
      if (err instanceof HttpError) {
        const payload = err.payload as { error?: string } | undefined;
        const message = payload?.error;

        if (err.status === 401) {
          setError(message || "포털 아이디 또는 비밀번호가 올바르지 않습니다.");
        } else if (err.status === 409) {
          setError(message || "이미 가입된 학번입니다.");
        } else if (err.status === 403) {
          setError(message || "재학생만 회원가입이 가능합니다.");
        } else {
          setError(message || "회원가입에 실패했습니다.");
        }
      } else {
        setError("회원가입에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="space-y-2">
          <p className="text-sm text-blue-600 font-semibold">
            DAN-ZZAN Ticketing
          </p>
          <h1 className="text-2xl font-semibold text-gray-900">회원가입</h1>
          <p className="text-sm text-gray-500">
            단국대 포털 계정으로 인증 후 회원가입을 진행합니다.
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="dkuStudentId">단국대 포털 학번</Label>
            <Input
              id="dkuStudentId"
              value={dkuStudentId}
              onChange={(event) => setDkuStudentId(event.target.value)}
              placeholder="학번을 입력하세요"
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dkuPassword">포털 비밀번호</Label>
            <Input
              id="dkuPassword"
              type="password"
              value={dkuPassword}
              onChange={(event) => setDkuPassword(event.target.value)}
              placeholder="포털 비밀번호를 입력하세요"
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">웹 비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="사용할 비밀번호를 입력하세요 (4자 이상)"
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <Input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              required
              disabled={submitting}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={submitting}
          >
            {submitting ? loadingMessage || "처리 중..." : "회원가입"}
          </Button>

          <p className="text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
