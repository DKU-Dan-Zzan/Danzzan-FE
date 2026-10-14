import { useState, useSyncExternalStore, type ComponentProps, type CSSProperties } from "react";
import { ArrowLeft, Clock3, Home, Map, Megaphone, Ticket, User } from "lucide-react";
import { cn } from "@/components/common/ui/utils";
import type { ThemeData } from "@/api/app/festival/activeThemeApi";
import type { FestivalBranding } from "@/api/app/festival/festivalBrandingApi";
import { DEFAULT_FESTIVAL_POSTER } from "@/lib/app/festival/brandingImageSource";
import { HomePosterImage } from "@/components/app/home/HomePosterImage";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { FestivalBrandingImage } from "@/components/layout/FestivalBrandingImage";
import { FestivalBrandingContext } from "@/lib/app/festival/festivalBrandingContext";
import FestivalDateTabs from "@/components/app/boothmap/FestivalDateTabs";
import PrimaryFilterChips from "@/components/app/boothmap/PrimaryFilterChips";
import { TicketingEventListPanel } from "@/components/ticketing/panels/TicketingEventListPanel";
import { BOOTHMAP_MARKER_THEME, type BoothmapMarkerType } from "@/utils/app/boothmap/boothmapTheme";
import { THEME_CORE_VARIABLES } from "@/lib/app/festival/activeTheme";
import { createPreviewStyle, getThemeColor, THEME_FIELDS } from "@/routes/admin/themeEditor";

import { useFestivalPortraitBackground } from "@/lib/app/festival/useFestivalPortraitBackground";
import ServiceClosedNotice from "@/routes/common/ServiceClosedNotice";
import { PaperTicketCard } from "@/components/ticketing/panels/PaperTicketCard";
import { getTicketingEnabled, getTicketingBackgroundImageUrl, subscribeFestivalSettings } from "@/lib/app/festival/festivalCalendar";

type PreviewTab = "home" | "map" | "ticketing" | "issued" | "closed" | "mypage";
const previewLabels = { home: "홈", map: "부스맵", ticketing: "티켓팅", issued: "발급 티켓", closed: "OFF 안내", mypage: "내 정보" } as const;

const previewDates = [{ label: "5.14 THU", value: "day1" }, { label: "5.15 FRI", value: "day2" }, { label: "5.16 SAT", value: "day3" }];
const previewNow = Date.parse("2026-05-14T18:00:00+09:00");
const previewEvents: ComponentProps<typeof TicketingEventListPanel>["events"] = [
  { id: "day1", title: "DAY 1 공연 티켓팅", eventDate: "2026-05-14", eventTime: "19:00", ticketOpenAt: "2026-05-14T17:00:00+09:00", status: "open", remainingCount: 120, totalCount: 300 },
  { id: "day2", title: "DAY 2 공연 티켓팅", eventDate: "2026-05-15", eventTime: "19:00", ticketOpenAt: "2026-05-15T17:00:00+09:00", status: "upcoming", remainingCount: 300, totalCount: 300 },
];

const markerSamples: { key: keyof ThemeData["category"]; type: BoothmapMarkerType; label: string; left: string; top: string }[] = [
  { key: "pub", type: "PUB", label: "주점", left: "20%", top: "39%" },
  { key: "foodTruck", type: "FOOD_TRUCK", label: "푸드트럭", left: "63%", top: "36%" },
  { key: "experience", type: "EXPERIENCE", label: "부스", left: "42%", top: "57%" },
  { key: "event", type: "EVENT", label: "이벤트", left: "79%", top: "62%" },
  { key: "restArea", type: "REST_AREA", label: "쉼터", left: "22%", top: "73%" },
  { key: "facility", type: "FACILITY", label: "편의시설", left: "70%", top: "79%" },
];

/** CSS aliases are scoped to the preview; inherited root semantic values are already computed. */
function createScreenStyle(data: ThemeData): CSSProperties {
  const style: Record<string, string> = { ...createPreviewStyle(data) } as Record<string, string>;
  for (const group of THEME_FIELDS) {
    const variables = THEME_CORE_VARIABLES[group.key] as Record<string, string>;
    for (const [key] of group.colors) style[variables[key]] = getThemeColor(data, group.key, key);
  }
  Object.assign(style, {
    "--primary": "var(--theme-brand-primary)",
    "--poster-bg": "color-mix(in srgb, var(--theme-brand-primary) 12%, white)",
    "--poster-navy": "color-mix(in srgb, var(--theme-brand-strong) 45%, var(--ds-neutral-ink))",
    "--accent": "var(--theme-brand-accent)",
    "--text-emphasis-vivid": "var(--theme-brand-strong)",
    "--app-nav-home-highlight": "var(--theme-brand-primary)",
    "--app-header-brand-text": "var(--theme-brand-strong)",
    "--bg-base": "color-mix(in srgb, var(--theme-brand-primary) 3%, white)",
    "--bg-page-soft": "color-mix(in srgb, var(--theme-brand-primary) 3%, white)",
    "--surface-tint-base": "color-mix(in srgb, var(--theme-brand-primary) 14%, transparent)",
    "--surface-tint-strong": "color-mix(in srgb, var(--theme-brand-primary) 18%, transparent)",
    "--card-outline-border": "color-mix(in srgb, var(--theme-brand-primary) 25%, white)",
    "--card-outline-bg": "var(--ds-white)",
    "--card-grad-tint-border": "color-mix(in srgb, var(--theme-brand-primary) 25%, white)",
    "--card-grad-tint-bg": "linear-gradient(150deg, white 0%, color-mix(in srgb, var(--theme-brand-primary) 12%, white) 56%, white 100%)",
    "--app-circle-border": "color-mix(in srgb, var(--theme-brand-primary) 25%, transparent)",
    "--app-circle-bg-start": "color-mix(in srgb, var(--theme-brand-primary) 8%, white)",
    "--app-circle-bg-end": "color-mix(in srgb, var(--theme-brand-primary) 14%, white)",
    "--app-circle-fg": "var(--theme-brand-strong)",
    "--ticketing-action-bg-start": "color-mix(in srgb, var(--theme-brand-strong) 86%, white)",
    "--ticketing-action-bg-end": "color-mix(in srgb, var(--theme-brand-strong) 94%, black)",
    "--ticketing-action-shadow": "0 12px 20px -14px color-mix(in srgb, var(--theme-brand-strong) 42%, transparent)",
    "--status-success": "var(--theme-status-success)",
    "--status-success-border": "color-mix(in srgb, var(--theme-status-success) 28%, transparent)",
    "--status-warning": "var(--theme-status-warning)",
    "--status-warning-border": "color-mix(in srgb, var(--theme-status-warning) 28%, transparent)",
    "--status-danger": "var(--theme-status-danger)",
    "--status-pending": "var(--theme-status-pending)",
    "--boothmap-page-bg": "color-mix(in srgb, var(--theme-brand-primary) 3%, white)",
    "--app-bottom-nav-surface": "var(--ds-white)",
    "--boothmap-panel-bg": "color-mix(in srgb, var(--theme-brand-primary) 5%, white)",
    "--boothmap-panel-border": "color-mix(in srgb, var(--theme-brand-primary) 23%, white)",
    "--boothmap-surface": "color-mix(in srgb, var(--theme-brand-primary) 2%, white)",
    "--boothmap-chip-bg": "color-mix(in srgb, var(--theme-brand-primary) 7%, white)",
    "--boothmap-chip-border": "color-mix(in srgb, var(--theme-brand-primary) 18%, white)",
    "--boothmap-chip-text": "var(--theme-brand-strong)",
    "--boothmap-chip-selected-bg": "var(--theme-brand-strong)",
    "--boothmap-chip-selected-border": "var(--theme-brand-strong)",
    "--boothmap-chip-selected-text": "white",
    "--boothmap-chip-selected-shadow": "0 16px 30px -22px color-mix(in srgb, var(--theme-brand-strong) 38%, transparent)",
    "--boothmap-zone-pub-stroke": "color-mix(in srgb, var(--theme-category-pub) 90%, black)",
    "--boothmap-zone-pub-fill": "color-mix(in srgb, var(--theme-category-pub) 40%, white)",
    "--boothmap-zone-food-truck-stroke": "color-mix(in srgb, var(--theme-category-food-truck) 80%, black)",
    "--boothmap-zone-food-truck-fill": "color-mix(in srgb, var(--theme-category-food-truck) 25%, white)",
  });
  for (const { key } of markerSamples) {
    const suffix = key === "foodTruck" ? "food-truck" : key === "restArea" ? "rest-area" : key;
    style[`--boothmap-marker-${suffix}`] = `var(${THEME_CORE_VARIABLES.category[key]})`;
  }
  return style as CSSProperties;
}

function PreviewHeader({ tab }: { tab: PreviewTab }) {
  if (tab === "map") return <AppTopBar headerClassName="relative z-20 bg-transparent" containerClassName="relative h-[68px] w-full px-4">
    <span className="absolute right-4 top-3 flex items-center gap-2 text-[var(--app-header-brand-text)]"><Ticket className="h-5 w-5" /><User className="h-5 w-5" /></span>
  </AppTopBar>;
  return <AppTopBar showLogo={false} headerClassName="relative z-20 bg-[color:color-mix(in_srgb,var(--surface)_62%,transparent)] backdrop-blur-[24px]" containerClassName="relative h-[68px] w-full px-4">
    <ArrowLeft className="absolute left-4 top-6 h-5 w-5" aria-hidden="true" />
    <FestivalBrandingImage kind="logo" className="absolute left-1/2 top-1/2 h-10 w-[140px] -translate-x-1/2 -translate-y-1/2 object-contain" />
    <User className="absolute right-4 top-6 h-5 w-5" aria-hidden="true" />
  </AppTopBar>;
}

function PreviewBottomNav({ active }: { active: PreviewTab }) {
  const items = [
    { key: "map", label: "부스맵", icon: Map }, { key: "timetable", label: "타임테이블", icon: Clock3 },
    { key: "home", label: "HOME", icon: Home }, { key: "notice", label: "공지사항", icon: Megaphone },
    { key: "ticketing", label: "티켓팅", icon: Ticket },
  ] as const;
  return <nav aria-label="사용자 하단 메뉴 샘플" className="relative z-20 mt-auto h-[var(--app-bottom-nav-height,56px)] rounded-t-[1.75rem] bg-[var(--app-bottom-nav-surface)] shadow-[0_-6px_18px_var(--semantic-shadow-neutral-09)]">
    <div className="grid h-full grid-cols-5 items-end px-3 pb-1">{items.map(({ key, label, icon: Icon }) => <span key={key}
      className={cn("relative flex h-full flex-col items-center justify-center gap-1 text-center text-[10px] font-semibold", key === "home" && "-translate-y-1")}
      style={{ color: key === active ? "var(--theme-brand-strong)" : "var(--app-nav-text)" }}>
      {key === "home" ? <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--app-nav-home-highlight)] text-white"><Icon className="h-5 w-5" /></span>
        : <Icon className="h-5 w-5" />}{label}
    </span>)}</div>
  </nav>;
}

function PreviewMarker({ sample }: { sample: (typeof markerSamples)[number] }) {
  const color = `var(${THEME_CORE_VARIABLES.category[sample.key]})`;
  const iconPath = BOOTHMAP_MARKER_THEME[sample.type].iconPath;
  return <span title={sample.label} aria-label={`${sample.label} 마커 샘플`} className="absolute z-10 h-[48px] w-[38px] -translate-x-1/2 -translate-y-full"
    style={{ left: sample.left, top: sample.top }}>
    <svg viewBox="0 0 48 60" className="h-full w-full drop-shadow-md" aria-hidden="true">
      <path d="M24 59C24 59 45 38.5 45 24C45 12.402 35.598 3 24 3C12.402 3 3 12.402 3 24C3 38.5 24 59 24 59Z"
        fill={color} stroke="rgba(255,255,255,0.92)" strokeWidth="2.5" />
    </svg>
    <span className="absolute left-1/2 top-[29%] h-4 w-4 -translate-x-1/2 bg-white" style={{ mask: `url(${iconPath}) center / contain no-repeat` }} aria-hidden="true" />
  </span>;
}

function PreviewBoothMap() {
  return <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--boothmap-page-bg)]">
    <div aria-label="지도 영역 샘플" className="absolute inset-0 overflow-hidden bg-[linear-gradient(135deg,#e8ebdf_0%,#f1efe4_48%,#e4e9dd_100%)]">
      <span className="absolute -left-8 top-1/3 h-5 w-[125%] -rotate-[22deg] bg-white/90 shadow-sm" />
      <span className="absolute -right-9 top-2/3 h-4 w-[125%] rotate-[29deg] bg-white/90 shadow-sm" />
      <span className="absolute left-[47%] top-0 h-full w-3 rotate-[8deg] bg-white/75" />
      <span className="absolute left-[12%] top-[29%] h-24 w-24 rotate-[-12deg] rounded-2xl border-2 border-[var(--boothmap-zone-pub-stroke)] bg-[var(--boothmap-zone-pub-fill)]" />
      <span className="absolute right-[10%] top-[48%] h-24 w-24 rotate-[17deg] rounded-2xl border-2 border-[var(--boothmap-zone-food-truck-stroke)] bg-[var(--boothmap-zone-food-truck-fill)]" />
      {markerSamples.map((sample) => <PreviewMarker key={sample.key} sample={sample} />)}
    </div>
    <div className="relative z-10 rounded-b-[32px] border-b border-[var(--boothmap-panel-border)] bg-[color:color-mix(in_srgb,var(--boothmap-panel-bg)_72%,transparent)] px-3 pb-3 pt-2 shadow-[var(--boothmap-panel-shadow)] backdrop-blur-xl">
      <div className="pointer-events-none"><FestivalDateTabs dates={previewDates} selectedDate="day1" onChange={() => {}} className="w-full" />
        <div className="mt-2"><PrimaryFilterChips value="ALL" onChange={() => {}} /></div></div>
    </div>
    <div className="relative z-10 mt-auto rounded-t-[30px] border border-b-0 border-[var(--boothmap-panel-border)] bg-[color:color-mix(in_srgb,var(--boothmap-surface)_94%,white)] px-5 pb-4 pt-3 shadow-[var(--boothmap-bottom-sheet-shadow)] backdrop-blur-xl" aria-label="부스맵 목록 샘플">
      <div className="mx-auto mb-3 h-1.5 w-28 rounded-full bg-[var(--boothmap-sheet-handle)]" />
      <p className="text-sm font-bold text-[var(--boothmap-text)]">축제 부스 둘러보기</p>
      <p className="mt-1 text-xs text-[var(--boothmap-text-muted)]">주점 · 푸드트럭 · 체험 부스</p>
    </div>
  </div>;
}

function PreviewTicketing({ backgroundOverride, forceClosed = false }: { backgroundOverride?: string; forceClosed?: boolean }) {
  const enabled = useSyncExternalStore(subscribeFestivalSettings, getTicketingEnabled, getTicketingEnabled);
  const background = useSyncExternalStore(subscribeFestivalSettings, getTicketingBackgroundImageUrl, getTicketingBackgroundImageUrl);
  if (forceClosed || !enabled) return <div className="min-h-0 flex-1 overflow-y-auto">
    <p className="bg-white px-4 py-2 text-xs text-slate-600">{forceClosed ? "OFF 안내 디자인 미리보기 · 실제 ON/OFF 설정은 유지됩니다." : "현재 티켓팅 OFF · 사용자에게 보이는 입장 안내입니다."}</p>
    <div className="pointer-events-none"><ServiceClosedNotice preview backgroundImageUrl={backgroundOverride ?? background}
      titleKey="closed.ticketing.title" descriptionKey="closed.ticketing.description" actionKey="closed.ticketing.action" actionTo="/" /></div>
  </div>;
  return <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--bg-base)] px-4 py-4">
    <div className="pointer-events-none"><TicketingEventListPanel events={previewEvents} loading={false} errorMessage={null}
      now={previewNow} onRefresh={() => {}} onSelectEvent={() => {}} /></div>
  </div>;
}

function PreviewIssuedTicket({ backgroundOverride }: { backgroundOverride?: string }) {
  return <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--bg-base)] px-4 py-6">
    <h3 className="text-lg font-bold">내 티켓</h3>
    <p className="mb-6 mt-2 text-xs text-[var(--text-muted)]">발급 예시 · 배경과 글자 가독성을 확인하세요. 실제 예매가 생성되지는 않습니다.</p>
    <PaperTicketCard backgroundImageUrl={backgroundOverride} ticket={{ id: "preview", status: "issued", eventName: "축제 DAY 1", eventDate: "2026-05-14", issuedAt: "", seat: "", qrCodeUrl: "", queueNumber: 123 }} />
    <p className="mt-5 text-xs leading-6 text-[var(--text-muted)]">추천 배경은 전체 적용 후 반영됩니다. 티켓 설정에서 직접 조정할 수도 있습니다.</p>
  </div>;
}

function PreviewMyPage({ backgroundOverride }: { backgroundOverride?: string }) {
  const background = useFestivalPortraitBackground(backgroundOverride);
  return <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--poster-bg)]">
    <div className="relative h-64 overflow-hidden">
      {background.src && <img src={background.src} onError={background.onError} alt="내 정보 추천 배경" className="absolute inset-0 h-full w-full object-cover object-top" />}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.58), rgba(0,0,0,.62) 50%, var(--poster-bg))" }} />
      <div className="absolute bottom-6 left-5 flex items-end gap-3 text-white"><div className="rounded-full border border-white/30 bg-white/20 p-4"><User size={36} /></div><div><p className="text-2xl font-bold">축제 참여자</p><p className="mt-1 text-sm text-white/80">단국대학교 재학생</p></div></div>
    </div>
    <div className="m-4 rounded-2xl bg-white p-5 text-[var(--poster-navy)]"><h3 className="font-semibold">내 정보</h3><p className="mt-3 text-sm">계정 관리</p><p className="mt-5 text-xs text-[var(--text-muted)]">샘플 프로필입니다. 내 정보 배경은 티켓팅 ON/OFF와 관계없이 적용됩니다.</p></div>
  </div>;
}

export function ThemeScreenPreview({ data, branding = null, embedded = false, backgrounds, homeImageUrl }: { data: ThemeData; branding?: FestivalBranding | null; embedded?: boolean; homeImageUrl?: string | null; backgrounds?: { ticket: string; closed: string } }) {
  const homePreview = homeImageUrl === null ? DEFAULT_FESTIVAL_POSTER : homeImageUrl;
  const [selectedTab, setTab] = useState<PreviewTab>("map");
  const enabled = useSyncExternalStore(subscribeFestivalSettings, getTicketingEnabled, getTicketingEnabled);
  const tabs: PreviewTab[] = enabled ? ["home", "map", "ticketing", "issued", "mypage"] : ["home", "map", "closed", "mypage"];
  const tab = tabs.includes(selectedTab) ? selectedTab : "map";
  return <section aria-label="사용자 화면 미리보기" className={embedded ? "min-w-0" : "rounded-2xl border border-[var(--admin-panel-border)] bg-[var(--admin-panel-bg)] p-5 sm:p-6"} data-testid="theme-screen-preview">
    {!embedded && <><h2 className="text-base font-semibold">실제 사용자 화면 미리보기</h2>
    <p className="mt-1 text-xs text-[var(--text-muted)]">실제 화면 구성요소와 샘플 데이터로 편집 중인 색상을 확인합니다. 서비스에는 적용되지 않습니다.</p></>}
    <div role="tablist" aria-label="미리보기 화면 선택" className={cn("mt-4 grid gap-2", enabled ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4")}>
      {tabs.map((value) => <button key={value} type="button" role="tab" aria-selected={tab === value}
        className={cn("rounded-xl border px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-theme-action-focus)]", tab === value ? "border-[var(--admin-theme-action-outline)] bg-[var(--admin-theme-action-hover)] text-[var(--admin-theme-action-outline)]" : "border-[var(--border-base)] bg-white text-[var(--ds-neutral-ink)] hover:border-[var(--admin-theme-action-outline)]")}
        onClick={() => setTab(value)}>{previewLabels[value]}</button>)}
    </div>
    <div className="mt-4 flex justify-center rounded-2xl bg-[var(--surface-subtle)] p-2 sm:p-5">
      <div data-color-scheme={tab === "map" ? "electric-curator" : "webapp"} role="tabpanel" aria-label={`${previewLabels[tab]} 화면 샘플`}
        className="flex aspect-[430/760] w-full max-w-[430px] flex-col overflow-hidden rounded-[2rem] border-[5px] border-[var(--ds-neutral-ink)] text-[var(--text)] shadow-lg"
        style={createScreenStyle(data)}>
        <FestivalBrandingContext.Provider value={branding}>
          <PreviewHeader tab={tab} />
          {tab === "home" ? <div className="min-h-0 flex-1 bg-[var(--surface)]">
            {homePreview ? <HomePosterImage src={homePreview} alt="홈 대표 이미지 미리보기" />
              : <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[var(--text-muted)]">홈 대표 이미지를 준비하면 여기에 표시됩니다.</div>}
          </div> : tab === "map" ? <PreviewBoothMap /> : tab === "mypage" ? <PreviewMyPage backgroundOverride={backgrounds?.closed} /> : tab === "issued" ? <PreviewIssuedTicket backgroundOverride={backgrounds?.ticket} /> : <PreviewTicketing backgroundOverride={backgrounds?.closed} forceClosed={false} />}
          <PreviewBottomNav active={tab === "issued" ? "ticketing" : tab} />
        </FestivalBrandingContext.Provider>
      </div>
    </div>
  </section>;
}
