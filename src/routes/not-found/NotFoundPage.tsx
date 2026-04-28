// 역할: 앱 전체에서 공통으로 사용하는 404 화면을 제공합니다.
import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/common/ui/button";

export default function NotFoundPage() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="flex min-h-full items-center justify-center bg-[var(--bg-page-soft)] px-6 py-[calc(env(safe-area-inset-top)+4.5rem)] text-[var(--text)]"
    >
      <div className="mx-auto flex w-full max-w-[320px] flex-col items-center text-center">
        <div
          aria-hidden
          className="mb-6 inline-flex h-10 items-center justify-center rounded-[8px] border border-[color:color-mix(in_srgb,var(--border-base)_62%,transparent)] bg-white/70 px-4 text-[0.8rem] font-extrabold tracking-[0] text-[var(--text-muted)] shadow-[0_10px_24px_-22px_rgba(15,23,42,0.42)]"
        >
          404
        </div>

        <h1
          id="not-found-title"
          className="text-[1.8rem] font-extrabold leading-[1.22] tracking-[0] text-[var(--text)]"
        >
          페이지를 찾을 수 없어요
        </h1>
        <p className="mt-3 max-w-[18rem] text-[0.94rem] leading-6 tracking-[0] text-[var(--text-muted)]">
          주소가 바뀌었거나 접근할 수 없는 페이지예요.
        </p>

        <div className="mt-8 w-full max-w-[220px]">
          <Button
            asChild
            className="h-11 w-full rounded-[8px] border border-[rgba(255,113,91,0.22)] bg-[linear-gradient(135deg,#ff715b_0%,#ffb45f_100%)] text-[0.9rem] tracking-[0] text-white shadow-[0_18px_32px_-20px_rgba(255,113,91,0.66)] hover:brightness-[1.03] focus-visible:ring-[rgba(255,113,91,0.45)] active:translate-y-px"
          >
            <Link to="/">
              <Home size={17} aria-hidden />
              홈으로
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
