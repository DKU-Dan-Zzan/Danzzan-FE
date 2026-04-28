// 역할: 앱 전체에서 공통으로 사용하는 404 화면을 제공합니다.
import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/common/ui/button";

export default function NotFoundPage() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="relative flex min-h-full items-center justify-center overflow-hidden bg-[var(--bg-page-soft)] px-6 py-[calc(env(safe-area-inset-top)+4.5rem)] text-[var(--text)]"
    >
      <img
        src="/DAN-ZZAN.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[30%] w-[18rem] max-w-[78%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.06] saturate-150 select-none"
        draggable={false}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[320px] flex-col items-center text-center">
        <div
          aria-hidden
          className="relative mb-7 inline-flex h-12 min-w-[104px] items-center justify-center overflow-hidden rounded-[8px] border border-[rgba(10,85,156,0.26)] bg-[linear-gradient(145deg,rgba(255,255,255,0.96)_0%,rgba(230,240,255,0.98)_100%)] px-7 text-[0.82rem] font-extrabold tracking-[0] text-[#0a559c] shadow-[0_16px_30px_-24px_rgba(10,85,156,0.52)] before:absolute before:left-[-10px] before:top-1/2 before:size-5 before:-translate-y-1/2 before:rounded-full before:border before:border-[rgba(10,85,156,0.18)] before:bg-[var(--bg-page-soft)] after:absolute after:right-[-10px] after:top-1/2 after:size-5 after:-translate-y-1/2 after:rounded-full after:border after:border-[rgba(10,85,156,0.18)] after:bg-[var(--bg-page-soft)]"
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
            className="h-11 w-full rounded-[8px] border border-[rgba(10,85,156,0.2)] bg-[linear-gradient(135deg,#0a559c_0%,#2f63f6_100%)] text-[0.9rem] tracking-[0] text-white shadow-[0_18px_32px_-20px_rgba(10,85,156,0.68)] hover:brightness-[1.03] focus-visible:ring-[rgba(10,85,156,0.38)] active:translate-y-px"
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
