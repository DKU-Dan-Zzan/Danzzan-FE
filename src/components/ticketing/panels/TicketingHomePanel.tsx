// 역할: 티켓팅 홈의 시작 안내, 유의사항, 진입 CTA를 구성하는 첫 화면 패널입니다.
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ClipboardList, Ticket, TicketCheck } from "lucide-react";
import { Card } from "@/components/common/ui/card";
import { TICKETING_CLASSES, TICKETING_MIDDLE_PANEL_CLASS } from "@/components/ticketing/panels/TicketingShared";

interface TicketingHomePanelProps {
  onOpenTicketingList: () => void;
  onOpenMyTickets: () => void;
}

const guideItems = [
  {
    step: 1,
    title: "티켓팅 오픈 시간 확인",
    description: "티켓 목록에서 각 공연의 예매 오픈 시간을 확인하세요. 오픈 10분 전부터 카운트다운이 시작됩니다.",
  },
  {
    step: 2,
    title: "대기 및 예매",
    description: "오픈 시각이 되면 예매 버튼이 활성화됩니다.",
  },
  {
    step: 3,
    title: "내 티켓 확인",
    description: "예매 완료 후 '티켓팅' 페이지에서 예매한 티켓을 확인하세요.",
  },
  {
    step: 4,
    title: "팔찌 수령",
    description:
      "공연 당일 지정된 장소에서 스태프에게 티켓과 웹정보를 제시하세요. 팔찌 수령이 완료되면 내 티켓 상태가 '팔찌 수령 완료'로 변경됩니다. (팔찌 배부 위치 및 시간은 추후 총학생회 인스타그램을 통해 공지됩니다.)",
  },
  {
    step: 5,
    title: "공연 입장",
    description: "팔찌 착용 후 단국존에 입장 가능합니다.",
  },
];

const noticeItems = [
  "티켓은 예매 시간 순으로 선착순 배정됩니다.",
  "1인당 공연별 최대 1매까지 예매 가능합니다.",
  "예매한 티켓은 취소가 불가능합니다.",
  "팔찌 미수령 시 단국존 입장이 불가하오니, 수령 시간에 맞추어 입장 팔찌를 수령해가시길 바랍니다.",
];

interface HomeQuickAction {
  key: string;
  title: string;
  description: string;
  cardClassName: string;
  icon: LucideIcon;
  iconStrokeWidth: number;
  onClick: () => void;
}

export function TicketingHomePanel({
  onOpenTicketingList,
  onOpenMyTickets,
}: TicketingHomePanelProps) {
  const quickActions: HomeQuickAction[] = [
    {
      key: "ticketing-list",
      title: "공연 티켓팅 하러가기",
      description: "새로운 공연 티켓을 예매하세요",
      cardClassName:
        "relative isolate min-h-[116px] overflow-hidden rounded-[20px] p-4 shadow-[0_8px_20px_var(--shadow-color)] transition-all duration-200 group-hover:-translate-y-[1px] group-hover:shadow-[0_10px_24px_var(--shadow-color)] group-active:translate-y-[1px] group-active:shadow-[0_6px_16px_var(--shadow-color)]",
      icon: Ticket,
      iconStrokeWidth: 2.1,
      onClick: onOpenTicketingList,
    },
    {
      key: "my-ticket",
      title: "내 티켓 확인하기",
      description: "예매한 티켓을 확인하세요",
      cardClassName:
        "relative isolate min-h-[116px] overflow-hidden rounded-[20px] p-4 shadow-[0_8px_20px_var(--shadow-color)] transition-all duration-200 group-hover:-translate-y-[1px] group-hover:shadow-[0_10px_24px_var(--shadow-color)] group-active:translate-y-[1px] group-active:shadow-[0_6px_16px_var(--shadow-color)]",
      icon: TicketCheck,
      iconStrokeWidth: 2.2,
      onClick: onOpenMyTickets,
    },
  ];

  return (
    <div className={`${TICKETING_MIDDLE_PANEL_CLASS} bg-[var(--bg-base)]`}>
      {quickActions.map((action) => {
        const ActionIcon = action.icon;
        return (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            aria-label={action.title}
            className="group block w-full text-left focus-visible:outline-none"
          >
            <Card className={action.cardClassName}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 rounded-[20px] border border-[var(--border-emphasis)] bg-[linear-gradient(145deg,var(--surface-tint-emphasis)_0%,var(--surface-tint-strong)_48%,var(--surface-base)_100%)] shadow-[inset_0_1px_0_var(--surface-subtle)]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 rounded-[20px] bg-[linear-gradient(180deg,var(--surface-tint-base)_0%,transparent_72%)]"
              />
              <div className="relative z-10 grid min-h-[84px] grid-cols-[60px_1fr_24px] items-center gap-3.5">
                <div className={`flex h-[60px] w-[60px] shrink-0 ${TICKETING_CLASSES.badge.iconCircle} rounded-[18px]`}>
                  <ActionIcon className="h-[30px] w-[30px] text-[var(--ticketing-quick-action-icon)]" strokeWidth={action.iconStrokeWidth} />
                </div>
                <div className="flex min-h-[56px] flex-col justify-center">
                  <h2 className={`${TICKETING_CLASSES.typography.cardTitle} text-[var(--text)]`}>
                    {action.title}
                  </h2>
                  <p className={`mt-1 ${TICKETING_CLASSES.typography.heroDescription} font-normal text-[var(--text-muted)]`}>
                    {action.description}
                  </p>
                </div>
                <ArrowRight
                  className="h-6 w-6 shrink-0 text-[var(--accent)] opacity-90 transition-transform duration-200 group-active:translate-x-0.5"
                  strokeWidth={2.3}
                />
              </div>
            </Card>
          </button>
        );
      })}

      <Card className="rounded-[24px] border border-[var(--border-base)] bg-[var(--surface-base)] p-5 shadow-[0_10px_20px_-16px_var(--shadow-color)]">
        <h3 className={`flex items-center gap-2 ${TICKETING_CLASSES.typography.cardSubtitle} text-[var(--text)]`}>
          <ClipboardList className="h-[17px] w-[17px] text-[var(--text-muted)]" strokeWidth={2.1} />
          티켓 예매 이용 가이드
        </h3>
        <div className="mt-0 px-2">
          {guideItems.map((item, index) => (
            <section
              key={item.step}
              className={
                index === 0
                  ? "border-b border-[var(--border-subtle)] pt-0 pb-2"
                  : index === guideItems.length - 1
                    ? "pt-3"
                    : "border-b border-[var(--border-subtle)] py-3"
              }
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 ${TICKETING_CLASSES.badge.iconCircle} text-[length:var(--ticketing-text-step-index)] font-bold text-[var(--text-emphasis-vivid)]`}
                >
                  {item.step}
                </div>
                <div>
                  <p className={`${TICKETING_CLASSES.typography.heroDescription} font-bold text-[var(--text)]`}>{item.title}</p>
                  <p className={`mt-1 ${TICKETING_CLASSES.typography.sectionBody} text-[var(--text-muted)]`}>
                    {item.description}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>
        <section className="border-t border-[var(--border-subtle)] pt-4">
          <h4 className={`${TICKETING_CLASSES.typography.cardSubtitle} text-[var(--accent)]`}>
            💡 유의사항
          </h4>
          <ul className={`mt-3 list-disc space-y-2 pl-5 ${TICKETING_CLASSES.typography.sectionBody} text-[var(--accent)]`}>
            {noticeItems.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </section>
      </Card>
    </div>
  );
}
