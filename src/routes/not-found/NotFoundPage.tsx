// 역할: 앱 전체에서 공통으로 사용하는 축제 톤의 404 화면을 제공합니다.
import { Home, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/common/ui/button";

const FESTIVAL_STOPS = ["MAIN", "BOOTH", "STAGE"];

export default function NotFoundPage() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="flex min-h-full flex-col justify-center overflow-hidden bg-[var(--bg-page-soft)] px-5 py-[calc(env(safe-area-inset-top)+5rem)] text-[var(--text)]"
    >
      <div className="mx-auto flex w-full max-w-[360px] flex-col gap-8">
        <div
          aria-hidden
          className="relative mx-auto aspect-[16/11] w-full max-w-[340px]"
        >
          <div className="absolute left-5 right-9 top-6 h-[68%] rotate-[-3deg] overflow-hidden rounded-[8px] border border-[color:color-mix(in_srgb,var(--border-base)_78%,white)] bg-[linear-gradient(145deg,#ffffff_0%,#eef6ff_58%,#fff7e6_100%)] shadow-[0_18px_36px_-28px_rgba(15,23,42,0.48)]">
            <div className="absolute left-0 top-0 h-full w-14 bg-[repeating-linear-gradient(0deg,rgba(37,99,235,0.08)_0_8px,rgba(16,185,129,0.08)_8px_16px,rgba(246,202,59,0.1)_16px_24px)]" />
            <div className="absolute left-[4.75rem] right-5 top-5 flex items-center justify-between gap-3 text-[0.68rem] font-bold tracking-[0] text-[var(--text-body-deep)]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} aria-hidden />
                LOST GATE
              </span>
              <span className="rounded-[6px] border border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.08)] px-2 py-1 text-[0.68rem] text-[#b42318]">
                404
              </span>
            </div>
            <div className="absolute bottom-5 left-[4.75rem] right-5 grid grid-cols-3 gap-1.5">
              {FESTIVAL_STOPS.map((stop) => (
                <span
                  key={stop}
                  className="rounded-[6px] border border-[rgba(37,99,235,0.18)] bg-white/72 px-2 py-1 text-center text-[0.62rem] font-bold tracking-[0] text-[var(--text-bold-emphasis)]"
                >
                  {stop}
                </span>
              ))}
            </div>
          </div>

          <div className="absolute bottom-7 left-7 right-3 h-[72px] rotate-[2deg] rounded-[8px] border border-[color:color-mix(in_srgb,var(--border-base)_70%,white)] bg-white/95 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.52)]">
            <div className="flex h-full items-center gap-3 px-4">
              <img src="/DAN-ZZAN.png" alt="" className="h-9 w-24 object-contain" draggable={false} />
              <div className="min-w-0">
                <p className="text-[0.68rem] font-bold tracking-[0] text-[var(--text-muted)]">
                  FESTIVAL PASS
                </p>
                <p className="truncate text-[0.95rem] font-extrabold tracking-[0] text-[var(--text)]">
                  NO ROUTE
                </p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-1 left-1/2 h-8 w-[84%] -translate-x-1/2 rounded-[8px] border border-[rgba(16,185,129,0.28)] bg-[linear-gradient(90deg,rgba(16,185,129,0.14),rgba(246,202,59,0.18),rgba(37,99,235,0.12))]" />
        </div>

        <div className="space-y-4 text-center">
          <p className="text-[0.75rem] font-extrabold tracking-[0] text-[var(--text-emphasis-vivid)]">
            DANFESTA / 404
          </p>
          <div className="space-y-3">
            <h1
              id="not-found-title"
              className="text-[2rem] font-extrabold leading-[1.18] tracking-[0] text-[var(--text)]"
            >
              축제길을 잠깐 놓쳤어요
            </h1>
            <p className="mx-auto max-w-[19rem] text-[0.93rem] leading-6 tracking-[0] text-[var(--text-muted)]">
              주소가 바뀌었거나 사라진 페이지예요. 홈에서 축제 정보를 다시 찾아볼 수 있어요.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[240px]">
          <Button
            asChild
            className="h-11 w-full rounded-[8px] text-[0.9rem] tracking-[0] shadow-[0_14px_24px_-18px_rgba(37,99,235,0.58)]"
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
