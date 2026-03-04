import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CircleAlert, GraduationCap, House } from "lucide-react";
import { Button } from "@/ticketing/components/common/ui/button";
import { Input } from "@/ticketing/components/common/ui/input";
import { Label } from "@/ticketing/components/common/ui/label";
import { useAuth } from "@/ticketing/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const festivalHomeUrl = (import.meta.env.VITE_FESTIVAL_HOME_URL as string | undefined)?.trim() ?? "";
  const hasFestivalHomeUrl = Boolean(festivalHomeUrl);
  const canSubmit = studentId.trim().length > 0 && password.trim().length > 0;
  const inputClassName =
    "h-11 rounded-2xl border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 placeholder:text-[var(--text-muted)] transition-all duration-200 focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20";

  const redirect = searchParams.get("redirect");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ studentId, password }, "student");
      navigate(redirect || "/ticket/ticketing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "濡쒓렇?몄뿉 ?ㅽ뙣?덉뒿?덈떎.");
    } finally {
      setSubmitting(false);
    }
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
          異뺤젣 ?덉쑝濡?        </button>

        <div className="mt-9">
          <p className="text-[length:var(--ticketing-text-helper)] font-semibold text-[var(--text-muted)]">
            ?ы븰???꾩슜 ?쒕퉬??          </p>
          <h1 className="mt-1 leading-[1.12] font-black tracking-tight text-[var(--text)]">
            ?곗폆???ы꽭 濡쒓렇??          </h1>
        </div>

        <main className="mt-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-semibold text-[var(--text)]">
                  ?숇쾲
                </Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  placeholder="?숇쾲 8?먮━瑜??낅젰??二쇱꽭??"
                  className={inputClassName}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-[var(--text)]">
                  鍮꾨?踰덊샇
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="?쒕퉬?ㅼ슜 鍮꾨?踰덊샇瑜??낅젰??二쇱꽭??"
                  className={inputClassName}
                  required
                />
              </div>

              <p className="flex items-start gap-1.5 text-[11px] font-medium leading-5 text-[var(--text-muted)]">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.3} />
                媛?낇븳 ?곗폆??怨꾩젙 鍮꾨?踰덊샇瑜??낅젰??二쇱꽭??
              </p>
            </section>

            {error && (
              <p className="rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-2xl bg-[var(--accent)] text-white shadow-[0_10px_18px_-12px_var(--shadow-color)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95 disabled:translate-y-0 disabled:opacity-55"
              disabled={submitting || !canSubmit}
            >
              <GraduationCap className="h-4 w-4" strokeWidth={2.3} />
              {submitting ? "濡쒓렇??以?.." : "?곗폆??怨꾩젙?쇰줈 濡쒓렇??"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">?곗폆???쒕퉬?ㅻ? 泥섏쓬 ?댁슜?섏떆?섏슂?</p>
            <Link
              to="/ticket/signup"
              state={{ authTabFrom: "login" }}
              className="mt-2 inline-block text-sm font-semibold text-[var(--accent)]"
            >
              ?뚯썝媛?낇븯??媛湲?            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
