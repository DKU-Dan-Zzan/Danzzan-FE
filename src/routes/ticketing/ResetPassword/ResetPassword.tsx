import { useState, type FormEvent } from "react";
import { House, MailCheck } from "lucide-react";
import { Button } from "@/components/ticketing/common/ui/button";
import { Input } from "@/components/ticketing/common/ui/input";
import { Label } from "@/components/ticketing/common/ui/label";

export default function ResetPassword() {
  const [studentId, setStudentId] = useState("");
  const festivalHomeUrl = (import.meta.env.VITE_FESTIVAL_HOME_URL as string | undefined)?.trim() ?? "";
  const hasFestivalHomeUrl = Boolean(festivalHomeUrl);
  const inputClassName =
    "h-11 rounded-2xl border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 placeholder:text-[var(--text-muted)] transition-all duration-200 focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20";

  const handleRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto w-full max-w-[420px] px-5 py-6">
        <button
          type="button"
          onClick={() => {
            if (hasFestivalHomeUrl) {
              window.location.href = festivalHomeUrl;
            }
          }}
          disabled={!hasFestivalHomeUrl}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <House className="h-4 w-4" strokeWidth={2.3} />
          축제 홈으로
        </button>

        <div className="mt-9">
          <p className="text-[length:var(--ticketing-text-helper)] font-semibold text-[var(--text-muted)]">
            재학생 전용 서비스
          </p>
          <h1 className="mt-1 leading-[1.12] font-black tracking-tight text-[var(--text)]">
            비밀번호 재설정
          </h1>
        </div>

        <main className="mt-6">
          <form className="space-y-5" onSubmit={handleRequest}>
            <div className="space-y-2">
              <Label htmlFor="studentId" className="text-sm font-semibold text-[var(--text)]">
                학번
              </Label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                placeholder="학번 8자리를 입력해 주세요"
                className={inputClassName}
                required
              />
            </div>

            <p className="text-sm leading-6 text-[var(--text-muted)]">
              학번 입력 후 인증번호 확인, 새 비밀번호 설정 단계를 진행합니다.
            </p>

            <Button
              type="submit"
              className="h-11 w-full rounded-2xl bg-[var(--accent)] text-white shadow-[0_10px_18px_-12px_var(--shadow-color)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95 disabled:translate-y-0 disabled:opacity-55"
              disabled
            >
              <MailCheck className="h-4 w-4" strokeWidth={2.3} />
              인증번호 요청
            </Button>
          </form>
        </main>
      </div>
    </div>
  );
}
