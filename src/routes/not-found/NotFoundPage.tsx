// 역할: 앱 전체에서 공통으로 사용하는 404 화면을 제공합니다.
import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/common/ui/button";

export default function NotFoundPage() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="relative flex min-h-full justify-start bg-[var(--bg-page-soft)] px-6 pb-[calc(var(--app-bottom-nav-runtime-offset)+1.25rem)] pt-[calc(env(safe-area-inset-top)+clamp(15rem,38vh,20rem))] text-[var(--text)]"
    >
      <img
        src="/DAN-ZZAN.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[36%] w-[22rem] max-w-[92%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.06] saturate-150 select-none"
        draggable={false}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[320px] flex-col items-center text-center">
        <div aria-hidden className="mb-5 text-[3.6rem] font-black leading-none tracking-[0] text-[#0a559c]">
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
