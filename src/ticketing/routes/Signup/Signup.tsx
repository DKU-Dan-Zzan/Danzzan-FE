import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CircleAlert,
  House,
  KeyRound,
} from "lucide-react";
import { Button } from "@/ticketing/components/common/ui/button";
import { Checkbox } from "@/ticketing/components/common/ui/checkbox";
import { Input } from "@/ticketing/components/common/ui/input";
import { Label } from "@/ticketing/components/common/ui/label";
import { signupApi } from "@/ticketing/api/signupApi";
import { HttpError } from "@/ticketing/api/httpClient";

export default function Signup() {
  const navigate = useNavigate();
  const [dkuStudentId, setDkuStudentId] = useState("");
  const [dkuPassword, setDkuPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const festivalHomeUrl = (import.meta.env.VITE_FESTIVAL_HOME_URL as string | undefined)?.trim() ?? "";
  const hasFestivalHomeUrl = Boolean(festivalHomeUrl);
  const canSubmit = !submitting;
  const inputClassName =
    "h-11 rounded-2xl border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 placeholder:text-[var(--text-muted)] transition-all duration-200 focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!dkuStudentId.trim() || !dkuPassword.trim()) {
      setError("?숇쾲怨??ы꽭 鍮꾨?踰덊샇瑜??낅젰??二쇱꽭??");
      return;
    }

    if (!password || !passwordConfirm) {
      setError("?쒕퉬??鍮꾨?踰덊샇瑜??낅젰??二쇱꽭??");
      return;
    }

    if (password.length < 4) {
      setError("鍮꾨?踰덊샇??4???댁긽?댁뼱???⑸땲??");
      return;
    }

    if (password !== passwordConfirm) {
      setError("?쒕퉬??鍮꾨?踰덊샇媛 ?쇱튂?섏? ?딆뒿?덈떎.");
      return;
    }

    if (!privacyConsent) {
      setError("媛쒖씤?뺣낫 ?댁슜 ?숈쓽(?꾩닔)??泥댄겕?댁＜?몄슂.");
      return;
    }

    setSubmitting(true);

    try {
      setLoadingMessage("?④뎅? ?ы꽭 ?몄쬆 以?..");
      const { signupToken } = await signupApi.verifyStudent(
        dkuStudentId,
        dkuPassword,
      );

      setLoadingMessage("怨꾩젙 ?앹꽦 以?..");
      await signupApi.completeSignup(signupToken, password);

      navigate("/ticket/login");
    } catch (err) {
      if (err instanceof HttpError) {
        const payload = err.payload as { error?: string } | undefined;
        const message = payload?.error;

        if (err.status === 401) {
          setError(message || "?ы꽭 ?꾩씠???먮뒗 鍮꾨?踰덊샇媛 ?щ컮瑜댁? ?딆뒿?덈떎.");
        } else if (err.status === 409) {
          setError(message || "?대? 媛?낅맂 ?숇쾲?낅땲??");
        } else if (err.status === 403) {
          setError(message || "?ы븰?앸쭔 ?뚯썝媛?낆씠 媛?ν빀?덈떎.");
        } else {
          setError(message || "?뚯썝媛?낆뿉 ?ㅽ뙣?덉뒿?덈떎.");
        }
      } else {
        setError("?뚯썝媛?낆뿉 ?ㅽ뙣?덉뒿?덈떎.");
      }
    } finally {
      setSubmitting(false);
      setLoadingMessage("");
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
            ?곗폆???ы꽭 ?뚯썝媛??          </h1>
        </div>

        <main className="mt-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dkuStudentId" className="text-sm font-semibold text-[var(--text)]">
                  ?숇쾲
                </Label>
                <Input
                  id="dkuStudentId"
                  value={dkuStudentId}
                  onChange={(event) => setDkuStudentId(event.target.value)}
                  placeholder="?숇쾲 8?먮━瑜??낅젰??二쇱꽭??"
                  className={inputClassName}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dkuPassword" className="text-sm font-semibold text-[var(--text)]">
                  ?ы꽭 鍮꾨?踰덊샇
                </Label>
                <Input
                  id="dkuPassword"
                  type="password"
                  value={dkuPassword}
                  onChange={(event) => setDkuPassword(event.target.value)}
                  placeholder="?ы꽭 鍮꾨?踰덊샇瑜??낅젰??二쇱꽭??"
                  className={inputClassName}
                  required
                  disabled={submitting}
                />
              </div>

              <p className="flex items-start gap-1.5 text-[11px] font-medium leading-5 text-[var(--text-muted)]">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.3} />
                ?ы븰???몄쬆???꾪빐 1?뚯꽦?쇰줈留??ъ슜?섎ŉ ??λ릺吏 ?딆뒿?덈떎.
              </p>
            </section>

            <div className="h-px bg-[var(--border-subtle)]" />

            <section className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-[var(--text)]">
                  ?쒕퉬?ㅼ슜 鍮꾨?踰덊샇
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="?덈줈??鍮꾨?踰덊샇瑜??낅젰??二쇱꽭??"
                  className={inputClassName}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="text-sm font-semibold text-[var(--text)]">
                  ?쒕퉬?ㅼ슜 鍮꾨?踰덊샇 ?뺤씤
                </Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="?덈줈??鍮꾨?踰덊샇瑜??ㅼ떆 ?낅젰??二쇱꽭??"
                  className={inputClassName}
                  required
                  disabled={submitting}
                />
              </div>
            </section>

            {error && (
              <p className="rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
                {error}
              </p>
            )}

            <section className="rounded-2xl border border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-base)_100%)] px-4 py-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="privacyConsent"
                  checked={privacyConsent}
                  onCheckedChange={(checked) => setPrivacyConsent(checked === true)}
                  disabled={submitting}
                  className="mt-0.5 size-6 rounded-full border-[var(--border-base)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)]"
                />
                <div>
                  <Label
                    htmlFor="privacyConsent"
                    className="cursor-pointer text-base font-semibold text-[var(--text)]"
                  >
                    媛쒖씤?뺣낫 ?댁슜 ?숈쓽 (?꾩닔)
                  </Label>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                    ?곗폆???쒕퉬???댁슜???꾪빐 ?숇쾲, ?곕씫泥? ?ы븰?뺣낫, ?뚯냽 ??? ?숆낵 ?뺣낫???섏쭛 諛??댁슜???숈쓽?⑸땲??
                  </p>
                </div>
              </div>
            </section>

            <Button
              type="submit"
              className="h-11 w-full rounded-2xl bg-[var(--accent)] text-white shadow-[0_10px_18px_-12px_var(--shadow-color)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95 disabled:translate-y-0 disabled:opacity-55"
              disabled={submitting}
            >
              <KeyRound className="h-4 w-4" strokeWidth={2.3} />
              {submitting ? loadingMessage || "泥섎━ 以?.." : "?ы븰???몄쬆 諛??곗폆???쒖옉"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">?대? 怨꾩젙???덉쑝?좉???</p>
            <Link
              to="/ticket/login"
              state={{ authTabFrom: "signup" }}
              className="mt-2 inline-block text-sm font-semibold text-[var(--accent)]"
            >
              濡쒓렇?명븯??媛湲?            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
