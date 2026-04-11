// 역할: 발급된 티켓 목록과 빈 상태/오류 상태를 보여주는 내 티켓 패널을 렌더링합니다.
import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { TicketCheck } from "lucide-react";
import { PaperTicketCard } from "@/components/ticketing/panels/PaperTicketCard";
import { TicketingAdBannerCard } from "@/components/ticketing/panels/TicketingAdBannerCard";
import {
  TICKETING_CLASSES,
  TicketingRefreshButton,
} from "@/components/ticketing/panels/TicketingShared";
import type { AdSlide } from "@/components/common/AdCarousel";
import type { Ticket } from "@/types/ticketing/model/ticket.model";

interface StudentSummary {
  studentId: string;
  name: string;
}

interface MyTicketListPanelProps {
  tickets: Ticket[];
  student: StudentSummary;
  loading: boolean;
  errorMessage: string | null;
  ads: AdSlide[];
  onRefresh: () => void;
  onGoTicketing: () => void;
}

export function MyTicketListPanel({
  tickets,
  student,
  loading,
  errorMessage,
  ads,
  onRefresh,
  onGoTicketing,
}: MyTicketListPanelProps) {
  const panelClassName =
    "mx-auto flex w-full max-w-3xl flex-col gap-3";

  return (
    <div className={panelClassName}>
      <div
        className="overflow-hidden rounded-[16px] px-4 py-3"
        style={{
          background: "var(--poster-card-white)",
          border: "1px solid rgba(28,43,106,0.08)",
          boxShadow: "0 2px 12px rgba(28,43,106,0.07)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(28,43,106,0.08)", color: "var(--poster-navy)" }}>
            <TicketCheck className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold" style={{ color: "rgba(28,43,106,0.5)" }}>
              예매 내역과 팔찌 상태
            </p>
            <h2 className="mt-0.5 text-[17px] font-extrabold tracking-tight" style={{ color: "var(--poster-navy)" }}>
              단국존 선예매 티켓
            </h2>
          </div>
          <TicketingRefreshButton
            onClick={onRefresh}
            loading={loading}
            size="sm"
            className="h-9 w-9 rounded-lg p-0 hover:bg-[rgba(28,43,106,0.05)]"
            iconClassName="h-3.5 w-3.5"
          />
        </div>
      </div>

      {/* TICKET HOLDER 카드 */}
      <div
        className="overflow-hidden rounded-[16px] px-4 py-3"
        style={{
          background: "var(--poster-card-white)",
          border: "1px solid rgba(28,43,106,0.08)",
          boxShadow: "0 2px 12px rgba(28,43,106,0.07)",
        }}
      >
        <div className="flex items-center justify-between gap-2 pb-2" style={{ borderBottom: "1px solid rgba(28,43,106,0.08)" }}>
          <p className="text-[0.6rem] font-bold tracking-[0.15em]" style={{ color: "rgba(28,43,106,0.4)" }}>TICKET HOLDER</p>
          <p className="text-[11px] font-medium" style={{ color: "rgba(28,43,106,0.4)" }}>티켓 소지자 정보</p>
        </div>
        <dl className="mt-2 grid grid-cols-[2.5rem_1fr] gap-x-2 gap-y-1.5 text-[13px]">
          <dt className="font-medium" style={{ color: "rgba(28,43,106,0.45)" }}>학번</dt>
          <dd className="font-extrabold tracking-tight" style={{ color: "var(--poster-navy)" }}>{student.studentId}</dd>
          <dt className="font-medium" style={{ color: "rgba(28,43,106,0.45)" }}>이름</dt>
          <dd className="font-extrabold tracking-tight" style={{ color: "var(--poster-navy)" }}>{student.name}</dd>
        </dl>
      </div>

      {tickets.map((ticket) => (
        <PaperTicketCard key={ticket.id} ticket={ticket} />
      ))}

      {errorMessage && (
        <Card className="border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-4">
          <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--status-danger-text)]`}>{errorMessage}</p>
        </Card>
      )}

      {loading && tickets.length === 0 && (
        <Card className={`${TICKETING_CLASSES.card.emptyState} p-6`}>
          <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>티켓을 불러오는 중입니다...</p>
        </Card>
      )}

      {!loading && tickets.length === 0 && (
        <Card className={`${TICKETING_CLASSES.card.emptyState} p-8 text-center`}>
          <p className={`${TICKETING_CLASSES.typography.cardSubtitle} text-[var(--text)]`}>
            아직 예매한 티켓이 없습니다.
          </p>
          <p className={`mt-1 ${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>
            티켓팅 페이지에서 진행 중인 공연을 확인하세요.
          </p>
          <Button
            className={`mt-4 ${TICKETING_CLASSES.button.primaryFull}`}
            onClick={onGoTicketing}
          >
            티켓팅 하러가기
          </Button>
        </Card>
      )}

      {/* 고정 배너 높이(70px) 만큼 하단 여백 확보 */}
      <div className="h-[70px] shrink-0" />

      {/* 네비바 바로 위 고정 광고 배너 — 기기 무관 */}
      <div className="fixed inset-x-0 bottom-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[var(--app-mobile-shell-max-width)]">
        <TicketingAdBannerCard ads={ads} variant="imageOnly" />
      </div>
    </div>
  );
}
