import type { LucideIcon } from "lucide-react";
import { ArrowRight, ClipboardList, Ticket, TicketCheck } from "lucide-react";
import { Card } from "@/ticketing/components/common/ui/card";
import { TICKETING_CLASSES, TICKETING_MIDDLE_PANEL_CLASS } from "@/ticketing/components/ticketing/ticketingShared";

interface TicketingHomePanelProps {
  onOpenTicketingList: () => void;
  onOpenMyTickets: () => void;
}

const guideItems = [
  {
    step: 1,
    title: "?곗폆???ㅽ뵂 ?쒓컙 ?뺤씤",
    description: "?곗폆 紐⑸줉?먯꽌 媛?怨듭뿰???ㅽ뵂 ?쒓컙???뺤씤?섏꽭?? ?ㅽ뵂 10遺??꾨???移댁슫?몃떎?댁씠 ?쒖옉?⑸땲??",
  },
  {
    step: 2,
    title: "?湲?諛??덈ℓ",
    description: "?ㅽ뵂 ?쒓컖???섎㈃ ?덈ℓ 踰꾪듉???쒖꽦?붾맗?덈떎.",
  },
  {
    step: 3,
    title: "???곗폆 ?뺤씤",
    description: "?덈ℓ媛 ?꾨즺?섎㈃ '???곗폆 ?뺤씤?섍린'?먯꽌 ?덈ℓ???곗폆???뺤씤?섏꽭??",
  },
  {
    step: 4,
    title: "?붿컡 ?섎졊",
    description:
      "怨듭뿰 ?뱀씪 吏?뺣맂 ?μ냼?먯꽌 ?ㅽ깭?꾩뿉寃??곗폆???쒖떆?섏꽭?? ?뺤씤 諛??붿컡 諛곕?媛 ?꾨즺?섎㈃ ???곗폆 ?곹깭媛 '?붿컡 ?섎졊 ?꾨즺'濡??낅뜲?댄듃?⑸땲?? (?붿컡 諛곕? ?꾩튂/?쒓컙? 異뷀썑 珥앺븰?앺쉶 ?몄뒪?洹몃옩 怨듭?)",
  },
  {
    step: 5,
    title: "怨듭뿰 ?낆옣",
    description: "?붿컡瑜?李⑹슜?섍퀬 ?④뎅議댁뿉 ?낆옣?섏꽭??",
  },
];

const noticeItems = [
  "?곗폆? ?덈ℓ ?쒓컙 ?쒖쑝濡??좎갑??諛곗젙?⑸땲??,",
  "1?몃떦 怨듭뿰蹂?理쒕? 1留ㅺ퉴吏 ?덈ℓ 媛?ν빀?덈떎",
  "?덈ℓ???곗폆? 痍⑥냼媛 遺덇??ν빀?덈떎.",
  "?붿컡 誘몄닔?????④뎅議??낆옣??遺덇??섏삤?? ?섎졊 ?쒓컙??留욎텛???낆옣 ?붿컡瑜??섎졊?닿??쒓만 諛붾엻?덈떎.",
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
      title: "怨듭뿰 ?곗폆???섎윭媛湲?,",
      description: "?덈줈??怨듭뿰 ?곗폆???덈ℓ?섏꽭??,",
      cardClassName:
        "relative isolate min-h-[116px] overflow-hidden rounded-[20px] p-4 shadow-[0_8px_20px_var(--shadow-color)] transition-all duration-200 group-hover:-translate-y-[1px] group-hover:shadow-[0_10px_24px_var(--shadow-color)] group-active:translate-y-[1px] group-active:shadow-[0_6px_16px_var(--shadow-color)]",
      icon: Ticket,
      iconStrokeWidth: 2.1,
      onClick: onOpenTicketingList,
    },
    {
      key: "my-ticket",
      title: "???곗폆 ?뺤씤?섍린",
      description: "?덈ℓ???곗폆???뺤씤?섏꽭??,",
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
                  <ActionIcon className="h-[30px] w-[30px]" strokeWidth={action.iconStrokeWidth} />
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
          ?곗폆???댁슜 媛?대뱶
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
                  className={`mt-0.5 flex h-8 w-8 shrink-0 ${TICKETING_CLASSES.badge.iconCircle} text-[length:var(--ticketing-text-step-index)] font-bold`}
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
        <section className="mt-4 border-t border-[var(--border-subtle)] pt-4">
          <h4 className={`${TICKETING_CLASSES.typography.cardSubtitle} text-[var(--accent)]`}>
            ?뮕 ?좎쓽?ы빆
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
