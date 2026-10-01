// 역할: 종이 티켓 스타일 카드의 시각 표현과 상태별 배지/정보 표시를 담당합니다.
import { useId, useState, useSyncExternalStore } from "react";
import { getTicketCardBackgroundImageUrl, subscribeFestivalSettings } from "@/lib/app/festival/festivalCalendar";
import { cn } from "@/components/common/ui/utils";
import { resolveTicketDayLabel } from "@/lib/ticketing/festivalDay";
import type { Ticket } from "@/types/ticketing/model/ticket.model";

interface PaperTicketCardProps {
  ticket: Ticket;
  backgroundImageUrl?: string | null;
}

const statusDisplayMap: Record<Ticket["status"], { label: string; bg: string; text: string }> = {
  issued:    { label: "팔찌 미수령",   bg: "var(--ticket-badge-issued-bg)",    text: "var(--ticket-badge-issued-text)" },
  used:      { label: "팔찌 수령 완료", bg: "var(--ticket-badge-used-bg)",      text: "var(--ticket-badge-used-text)" },
  cancelled: { label: "예매 취소",     bg: "var(--ticket-badge-cancelled-bg)", text: "var(--ticket-badge-cancelled-text)" },
  unknown:   { label: "상태 확인 필요", bg: "var(--ticket-badge-unknown-bg)",   text: "var(--ticket-badge-unknown-text)" },
};

const stripTimeFromEventDate = (value: string): string =>
  value.replace(/\s+\d{1,2}:\d{2}.*$/, "").trim();

const toCompactEventDate = (value: string): string => {
  const normalized = stripTimeFromEventDate(value);
  const monthDayKorean = normalized.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (monthDayKorean) return `${Number(monthDayKorean[1])}/${Number(monthDayKorean[2])}`;
  const isoLike = normalized.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (isoLike) return `${Number(isoLike[2])}/${Number(isoLike[3])}`;
  return normalized;
};

export const DEFAULT_TICKET_CARD_BACKGROUND = "/posters/ticket-card-legend.jpg";

const getGuideLines = (ticket: Ticket) => {
  const compactDate = ticket.eventDate ? toCompactEventDate(ticket.eventDate) : "미정";
  return {
    dayLabel: resolveTicketDayLabel({ eventDate: ticket.eventDate, eventName: ticket.eventName }),
    dateLabel: compactDate,
    queueLabel: ticket.queueNumber != null ? String(ticket.queueNumber) : ticket.id.slice(-4).toUpperCase(),
    wristbandValue: "10:00~",
  };
};

export function PaperTicketCard({ ticket, backgroundImageUrl }: PaperTicketCardProps) {
  const savedBackground = useSyncExternalStore(subscribeFestivalSettings, getTicketCardBackgroundImageUrl, getTicketCardBackgroundImageUrl);
  const configuredBackground = backgroundImageUrl === undefined ? savedBackground : backgroundImageUrl;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const background = configuredBackground && configuredBackground !== failedUrl ? configuredBackground : DEFAULT_TICKET_CARD_BACKGROUND;
  const cardId = useId().replace(/:/g, "");
  const clipId = `ticket-clip-${cardId}`;
  const overlayId = `ticket-overlay-${cardId}`;
  const { label, bg, text } = statusDisplayMap[ticket.status];
  const { dayLabel, dateLabel, queueLabel, wristbandValue } = getGuideLines(ticket);

  // 티켓 외형 SVG 경로 (viewBox 400×180)
  // 노치 반지름 14, 노치 x위치 280(70%), 모서리 반지름 16
  const ticketPath = `
    M 16,0 L 266,0 A 14,14 0 0,0 294,0 L 384,0 Q 400,0 400,16
    L 400,164 Q 400,180 384,180 L 294,180 A 14,14 0 0,0 266,180
    L 16,180 Q 0,180 0,164 L 0,16 Q 0,0 16,0 Z
  `;

  return (
    <div
      className="relative w-full"
      style={{ filter: "drop-shadow(0 8px 28px rgba(28,43,106,0.32))" }}
    >
      {/* SVG 티켓 외형 */}
      <svg
        viewBox="0 0 400 180"
        className="w-full"
        style={{ display: "block" }}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          {/* 업로드 이미지의 밝기와 무관하게 티켓 정보의 대비를 유지한다. */}
          <linearGradient id={overlayId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="rgba(0,0,0,0.60)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.72)" />
          </linearGradient>
          <clipPath id={clipId}>
            <path d={ticketPath} />
          </clipPath>
        </defs>

        {/* 발급 티켓 카드 안에만 배경을 적용한다. */}
        <image
          href={background}
          onError={() => { if (configuredBackground) setFailedUrl(configuredBackground); }}
          x="0" y="0"
          width="400" height="180"
          preserveAspectRatio={background === DEFAULT_TICKET_CARD_BACKGROUND ? "xMidYMax slice" : "xMidYMid slice"}
          clipPath={`url(#${clipId})`}
        />

        {/* 글자 가독성을 위한 어두운 오버레이 */}
        <path d={ticketPath} fill={`url(#${overlayId})`} />

        {/* 퍼포레이션 점선 */}
        <line
          x1="280" y1="18" x2="280" y2="162"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5"
          strokeDasharray="5,5"
        />

        {/* 테두리 */}
        <path d={ticketPath} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      </svg>

      {/* 콘텐츠 오버레이 */}
      <div className="absolute inset-0 flex items-stretch">
        {/* 왼쪽 70% */}
        <div className="flex w-[70%] flex-col justify-center px-6 py-5">
          <p className="text-[0.58rem] font-bold tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.8)" }}>
            DANKOOK ZONE TICKET
          </p>
          <p className="mt-1.5 text-[2.1rem] font-bold leading-none tracking-[-0.02em]" style={{ color: "white" }}>
            {dayLabel}
          </p>
          <span
            className="mt-2.5 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[0.62rem] font-semibold"
            style={{ background: bg, color: text }}
          >
            {label}
          </span>
        </div>

        {/* 오른쪽 30% */}
        <div className="flex w-[30%] flex-col justify-center gap-3 py-5 pl-4 pr-5">
          {[
            { key: "공연 일자", val: dateLabel },
            { key: "팔찌 배부", val: wristbandValue },
            { key: "예매 순번", val: `NO.${queueLabel}` },
          ].map(({ key, val }) => (
            <div key={key}>
              <p className="text-[0.5rem] font-semibold tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.8)" }}>{key}</p>
              <p className={cn(
                "mt-0.5 text-[1.05rem] font-extrabold leading-tight [font-variant-numeric:tabular-nums]",
                key === "예매 순번" ? "font-mono" : ""
              )} style={{ color: "white" }}>
                {val}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
