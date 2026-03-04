import { Button } from "@/ticketing/components/common/ui/button";
import { Card } from "@/ticketing/components/common/ui/card";
import { Checkbox } from "@/ticketing/components/common/ui/checkbox";
import { cn } from "@/ticketing/components/common/ui/utils";
import {
  TICKETING_CLASSES,
  TICKETING_NARROW_PANEL_CLASS,
  TicketingStepTitle,
} from "@/ticketing/components/ticketing/ticketingShared";

interface TicketingReservationPanelProps {
  eventTitle: string;
  agreementChecked: boolean;
  submitting: boolean;
  errorMessage: string | null;
  onAgreementCheckedChange: (checked: boolean) => void;
  onSubmit: () => void;
}

const DEFAULT_CAUTION_ITEMS = [
  "?④뎅??숆탳 二쎌쟾罹좏띁???ы븰??議몄뾽?? ?댄븰???쒖쇅)留??좎껌?????덉뒿?덈떎.",
  "?대쫫, ?숇쾲, ?곕씫泥섍? 媛???뺣낫? ?ㅻⅤ硫??낆옣???쒗븳?????덉뒿?덈떎.",
  "鍮꾩씤媛 ?꾨줈洹몃옩(留ㅽ겕濡??? ?ъ슜 ???대깽??李몄뿬?먯꽌 ?쒖쇅?⑸땲??",
  "?좎껌 ???곗폆 ?묐룄 諛?痍⑥냼??遺덇??⑸땲??",
];

const MAY_13_CAUTION_ITEMS = [
  "?④뎅??숆탳 二쎌쟾罹좏띁???ы븰??議몄뾽?? ?댄븰??遺덇?)留??좎껌?????덉뒿?덈떎.",
  "?대쫫, ?숇쾲, ?숆낵, ?꾪솕踰덊샇 ???덊럹?댁? 媛?????낅젰???뺣낫媛 ?뺥솗?섏? ?딆쓣 寃쎌슦 ?대깽??李몄뿬???쒗븳???덉쓣 ???덉뒿?덈떎.",
  "鍮꾩씤媛 寃쎈줈(罹≪쿂 ?대?吏, ????묐룄 ??瑜??듯븳 ?곗폆 ?ъ슜? 遺덇??⑸땲??",
  "鍮꾩씤媛 ?꾨줈洹몃옩(留ㅽ겕濡??????ъ슜?섏뿬 鍮꾩젙?곸쟻??寃쎈줈濡??곗폆?낆쓣 ?쒕룄??寃쎌슦, ?ъ쟾 怨좎? ?놁씠 ?대깽??李몄뿬?먯꽌 ?쒖쇅?⑸땲??",
  "?좊텇利?誘몄?李??먮뒗 ?뺣낫 遺덉씪移????낆옣???쒗븳?????덉뒿?덈떎.",
  "5??13?? 5??14???묒씪 媛곴컖 ?④뎅議??좎껌??媛?ν븯硫? 1?몃떦 ?덈ℓ 媛?ν븳 ?곗폆 ?섎뒗 媛??쇱옄蹂꾨줈 1??1留ㅼ엯?덈떎.",
  "?곗폆 ?덈ℓ ?쇱젙 諛??몃? ?댁쁺 諛⑹떇? 蹂꾨룄 怨듭?瑜??듯빐 ?덈궡?⑸땲??",
  "怨듭뿰 ?뱀씪 ?꾩옣 ?댁쁺 吏移⑥뿉 ?곕씪 ?낆옣 ?덉감媛 吏꾪뻾?섎ŉ, ?덉쟾?곸쓽 ?ъ쑀濡??낆옣??吏?곕릺嫄곕굹 ?쒗븳?????덉뒿?덈떎.",
  "蹂??덈ℓ??2026??05??13???④뎅議??좎삁留??곗폆?낆엫???뺤씤?덉뒿?덈떎.",
];

const MAY_13_POLICY_INTRO =
  "蹂?怨듭뿰??二쇱턀쨌二쇨?? ?④뎅??숆탳 ??8? LOU:D 珥앺븰?앺쉶?대ŉ, <2026 DANFESTA> ?곗폆? 怨듭떇 ?덈ℓ 寃쎈줈瑜??듯빐?쒕쭔 ?좏슚?⑸땲??";

const MAY_13_POLICY_RISK_INTRO =
  "理쒓렐 ?⑤씪??而ㅻ??덊떚, SNS, 以묎퀬 嫄곕옒 ?뚮옯???깆쓣 ?듯븳 ?곗폆 留ㅻℓ ?쒕룄媛 ?뺤씤?섍퀬 ?덉뒿?덈떎. 鍮꾧났??寃쎈줈瑜??듯븳 嫄곕옒???ㅼ쓬怨?媛숈? 臾몄젣媛 諛쒖깮?????덉뒿?덈떎.";

const MAY_13_POLICY_RISK_ITEMS = [
  "?꽷룸?議??곗폆 ?ъ슜?쇰줈 ?명븳 ?낆옣 嫄곕?",
  "?숈씪 QR肄붾뱶 以묐났 ?ъ슜?쇰줈 ?명븳 臾댄슚 泥섎━",
  "媛쒖씤?뺣낫 ?좎텧 諛?湲덉쟾???쇳빐 諛쒖깮",
];

const MAY_13_POLICY_ACTION_ITEMS = [
  "?곗폆 ?묐룄쨌?ы뙋留ㅒ룸?由?援щℓ ?됱쐞???꾧꺽??湲덉??⑸땲??",
  "遺??嫄곕옒媛 ?뺤씤??寃쎌슦 ?대떦 ?곗폆? ?ъ쟾 ?듬낫 ?놁씠 痍⑥냼?????덉쑝硫? ?ν썑 珥앺븰?앺쉶 二쇨? ?됱궗 李몄뿬媛 ?쒗븳?????덉뒿?덈떎.",
  "遺??嫄곕옒濡??명븳 ?쇳빐 諛쒖깮 ??LOU:D 珥앺븰?앺쉶??梨낆엫吏吏 ?딆뒿?덈떎.",
];

const MAY_13_POLICY_OUTRO =
  "怨듭젙?섍퀬 ?덉쟾??異뺤젣 ?댁쁺???꾪빐 ?숈슦 ?щ윭遺꾩쓽 ?묒“瑜??붿껌?쒕┰?덈떎.";

const DEFAULT_POLICY_ITEMS = [
  "蹂?怨듭뿰 ?곗폆???묐룄쨌?ы뙋留ㅒ룸?由?援щℓ 諛?湲덉쟾 嫄곕옒???꾧꺽??湲덉??⑸땲??",
  "怨듭떇 ?덉감 ??遺?뺥븳 諛⑸쾿?쇰줈 ?뺤씤???곗폆? ?덇퀬 ?놁씠 痍⑥냼?????덉뒿?덈떎.",
];

export function TicketingReservationPanel({
  eventTitle,
  agreementChecked,
  submitting,
  errorMessage,
  onAgreementCheckedChange,
  onSubmit,
}: TicketingReservationPanelProps) {
  const isMay13Ticket = eventTitle.includes("5??13??");
  const isSubmitEnabled = !submitting && agreementChecked;
  const cautionItems = isMay13Ticket ? MAY_13_CAUTION_ITEMS : DEFAULT_CAUTION_ITEMS;

  return (
    <div className={`${TICKETING_NARROW_PANEL_CLASS} space-y-4`}>
      <div>
        <div>
          <h2 className={`${TICKETING_CLASSES.typography.heroTitle} text-[var(--text)]`}>?덈ℓ 吏꾪뻾 以?</h2>
          <p className={`mt-0.5 ${TICKETING_CLASSES.typography.sectionBody} text-[var(--text-muted)]`}>
            二쇱쓽?ы빆怨?諛⑹묠???뺤씤?????숈쓽 泥댄겕 ???덈ℓ瑜??꾨즺?섏꽭??
          </p>
        </div>
      </div>

      <Card className="border-[var(--border-base)] bg-[var(--surface-base)] p-6 shadow-[0_10px_20px_-16px_var(--shadow-color)]">
        <div>
          <section className="space-y-2">
            <TicketingStepTitle step={1} title="二쇱쓽?ы빆" />
            <div className="rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-4 py-3">
              <ul className={`space-y-1.5 ${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--status-warning-text)]`}>
                {cautionItems.map((item) => (
                  <li key={item}>??{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-5 space-y-2 border-t border-[var(--border-subtle)] pt-4">
            <TicketingStepTitle step={2} title="遺?뺢굅??愿??諛⑹묠 ?덈궡" />
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3">
              <div
                className={cn(
                  `max-h-44 space-y-2 overflow-y-scroll pr-2 ${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`,
                  "[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:var(--accent)_var(--surface-tint-subtle)]",
                  "[&::-webkit-scrollbar]:w-2",
                  "[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[var(--surface-tint-subtle)]",
                  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--accent)]",
                )}
              >
                {isMay13Ticket ? (
                  <>
                    <p>{MAY_13_POLICY_INTRO}</p>
                    <p>{MAY_13_POLICY_RISK_INTRO}</p>
                    <ul className="space-y-1.5">
                      {MAY_13_POLICY_RISK_ITEMS.map((item) => (
                        <li key={item}>??{item}</li>
                      ))}
                    </ul>
                    <p>?댁뿉 ?곕씪,</p>
                    <ul className="space-y-1.5">
                      {MAY_13_POLICY_ACTION_ITEMS.map((item) => (
                        <li key={item}>??{item}</li>
                      ))}
                    </ul>
                    <p>{MAY_13_POLICY_OUTRO}</p>
                  </>
                ) : (
                  <ul className="space-y-1.5">
                    {DEFAULT_POLICY_ITEMS.map((item) => (
                      <li key={item}>??{item}</li>
                    ))}
                  </ul>
                )}
              </div>
              <p className={`mt-2 ${TICKETING_CLASSES.typography.helper} text-[var(--text-muted)]`}>?ㅽ겕濡ㅽ븯???꾩껜 諛⑹묠???뺤씤?섏꽭??</p>
            </div>
          </section>

          <section className="mt-5 space-y-3 border-t border-[var(--border-subtle)] pt-4">
            <TicketingStepTitle step={3} title="?숈쓽 ?뺤씤" />
            <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--text-muted)]`}>
              ?꾨옒 ??ぉ??泥댄겕?섎㈃ ?덈ℓ瑜?吏꾪뻾?????덉뒿?덈떎.
            </p>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 py-3">
              <Checkbox
                checked={agreementChecked}
                disabled={submitting}
                onCheckedChange={(checked) => onAgreementCheckedChange(Boolean(checked))}
                className="h-5 w-5 rounded-[6px] border-[var(--border-strong)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)]"
              />
              <span className={`${TICKETING_CLASSES.typography.sectionBodySm} font-semibold text-[var(--text)]`}>
                ???ы빆?ㅼ쓣 ?숈??덉뒿?덈떎.
              </span>
            </label>

            {errorMessage && <p className={`${TICKETING_CLASSES.typography.sectionBodySm} text-[var(--status-danger-text)]`}>{errorMessage}</p>}

            <Button
              className={cn(
                isSubmitEnabled
                  ? TICKETING_CLASSES.button.submitEnabled
                  : TICKETING_CLASSES.button.submitDisabled,
              )}
              onClick={onSubmit}
              disabled={!isSubmitEnabled}
            >
              {submitting ? "?덈ℓ 泥섎━ 以?.." : "?덈ℓ ?꾨즺"}
            </Button>
          </section>
        </div>
      </Card>
    </div>
  );
}
