// 역할: 부스맵 메인 라우트에서 2D 지도, 필터, 상세 시트 상태를 통합 제어합니다.
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Booth,
  College,
  MapViewport,
  PrimaryFilter,
  Pub,
  SelectedMapItem,
  SelectedDetailItem,
  SheetMode,
  SheetSnap,
} from "@/types/app/boothmap/boothmap.types";

import PrimaryFilterChips from "@/components/app/boothmap/PrimaryFilterChips";
import SecondaryCollegeChips from "@/components/app/boothmap/SecondaryCollegeChips";
import KakaoMapView from "@/components/app/boothmap/KakaoMapView";
import BottomSheet from "@/components/app/boothmap/BottomSheet";
import BoothList from "@/components/app/boothmap/BoothList";
import PubList from "@/components/app/boothmap/PubList";
import DetailSheet from "@/components/app/boothmap/DetailSheet";
import FestivalDateTabs from "@/components/app/boothmap/FestivalDateTabs";

import {
  getBoothMap,
  getBoothSummary,
  getPubs,
  type BoothDto,
  type CollegeDto,
  type PubSummaryResponse,
} from "@/api/app/boothmap/boothmapApi";
import { appQueryKeys, queryClient, useAppQuery } from "@/lib/query";
import {
  getShouldShowPubList,
  getVisibleBooths,
  getVisibleColleges,
  getVisiblePubs,
} from "@/routes/boothmap/boothMapSelectors";
import { cn } from "@/components/common/ui/utils";
import { formatDescription } from "@/utils/app/boothmap/formatDescription";

const DEFAULT_MAP_VIEWPORT: MapViewport = {
  lat: 37.3201,
  lng: 127.1276,
  kakaoLevel: 3,
};

const FESTIVAL_DATES = [
  { label: "5/12", value: "2026-05-12" },
  { label: "5/13", value: "2026-05-13" },
  { label: "5/14", value: "2026-05-14" },
];
const TOP_PANEL_Z_INDEX_CLASS: Record<SheetSnap, string> = {
  PEEK: "z-[70]",
  HALF: "z-[70]",
  FULL: "z-[40]",
};

function mapCollegeDtoToCollege(dto: CollegeDto): College {
  return {
    id: dto.collegeId,
    name: dto.name,
    location_x: dto.locationX,
    location_y: dto.locationY,
  };
}

function mapBoothDtoToBooth(dto: BoothDto): Booth {
  return {
    id: dto.boothId,
    name: dto.name,
    type: dto.type,
    subType: dto.subType,
    description: dto.description,
    location_x: dto.locationX,
    location_y: dto.locationY,
    startTime: dto.startTime,
    endTime: dto.endTime,
  };
}

function mapPubSummaryToPub(dto: PubSummaryResponse): Pub {
  return {
    id: dto.pubId,
    college_id: dto.collegeId,
    department_id: -1,
    department: dto.department,
    name: dto.name,
    intro: dto.intro,
    description: undefined,
    instagram: undefined,
    images: dto.mainImageUrl ? [dto.mainImageUrl] : [],
    mainImageUrl: dto.mainImageUrl ?? undefined,
    thumbnailUrl: dto.thumbnailUrl ?? undefined,
    startTime: dto.startTime,
    endTime: dto.endTime,
  };
}

function hasBoothDetailContent(description?: string | null) {
  return formatDescription(description).trim().length > 0;
}

function isFoodTruckBooth(booth?: Booth | null) {
  return booth?.type === "FOOD_TRUCK";
}

export default function BoothMap() {
  const [primaryFilter, setPrimaryFilter] = useState<PrimaryFilter>("ALL");
  const [selectedMapItem, setSelectedMapItem] = useState<SelectedMapItem>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<SelectedDetailItem>(null);
  const [boothDetailAvailability, setBoothDetailAvailability] = useState<Record<number, boolean>>({});
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(null);
  const [pubListCollegeId, setPubListCollegeId] = useState<number | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>("LIST");
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("PEEK");
  const [selectedDate, setSelectedDate] = useState("2026-05-12");
  const [mapViewport, setMapViewport] = useState<MapViewport>(DEFAULT_MAP_VIEWPORT);
  const [bottomNavHeight, setBottomNavHeight] = useState(56);

  const frameWidth = 430;

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-app-bottom-nav]");
    if (!nav) return;

    const updateBottomNavHeight = () => {
      setBottomNavHeight(nav.getBoundingClientRect().height);
    };

    updateBottomNavHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateBottomNavHeight();
    });

    resizeObserver.observe(nav);
    window.addEventListener("resize", updateBottomNavHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateBottomNavHeight);
    };
  }, []);

  const mapDataQuery = useAppQuery({
    queryKey: appQueryKeys.boothMapData(selectedDate),
    queryFn: async ({ signal }) => {
      const [boothMapData, pubsData] = await Promise.all([
        getBoothMap(selectedDate, { signal }),
        getPubs(selectedDate, { signal }),
      ]);

      return {
        colleges: boothMapData.colleges.map(mapCollegeDtoToCollege),
        booths: boothMapData.booths.map(mapBoothDtoToBooth),
        pubs: pubsData.map(mapPubSummaryToPub),
      };
    },
    staleTime: 60_000,
  });

  const colleges = useMemo<College[]>(
    () => mapDataQuery.data?.colleges ?? [],
    [mapDataQuery.data?.colleges],
  );
  const booths = useMemo<Booth[]>(
    () => mapDataQuery.data?.booths ?? [],
    [mapDataQuery.data?.booths],
  );
  const pubs = useMemo<Pub[]>(
    () => mapDataQuery.data?.pubs ?? [],
    [mapDataQuery.data?.pubs],
  );

  const handlePrimaryChange = (next: PrimaryFilter) => {
    setPrimaryFilter(next);
    setSelectedMapItem(null);
    setSelectedDetailItem(null);
    setSheetMode("LIST");
    setSheetSnap("PEEK");
    setPubListCollegeId(null);

    if (next !== "PUB") {
      setSelectedCollegeId(null);
    }
  };

  const visibleBooths = useMemo(() => {
    return getVisibleBooths(primaryFilter, booths);
  }, [primaryFilter, booths]);

  const visibleColleges = useMemo(() => {
    return getVisibleColleges(primaryFilter, colleges, selectedCollegeId);
  }, [primaryFilter, colleges, selectedCollegeId]);

  const visiblePubs = useMemo(() => {
    const targetCollegeId =
      primaryFilter === "PUB" ? (selectedCollegeId ?? pubListCollegeId) : pubListCollegeId;
    return getVisiblePubs(pubs, targetCollegeId);
  }, [primaryFilter, pubs, pubListCollegeId, selectedCollegeId]);

  const shouldShowPubList = getShouldShowPubList(primaryFilter, selectedMapItem);
  const selectedBooth = useMemo(() => {
    if (selectedMapItem?.kind !== "booth") {
      return null;
    }

    return booths.find((booth) => booth.id === selectedMapItem.id) ?? null;
  }, [booths, selectedMapItem]);

  useEffect(() => {
    let cancelled = false;

    const initialAvailability = visibleBooths.reduce<Record<number, boolean>>((acc, booth) => {
      acc[booth.id] = hasBoothDetailContent(booth.description);
      return acc;
    }, {});

    setBoothDetailAvailability(initialAvailability);

    const foodTruckBoothsToCheck = visibleBooths.filter((booth) => {
      return booth.type === "FOOD_TRUCK" && !hasBoothDetailContent(booth.description);
    });

    if (foodTruckBoothsToCheck.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    void Promise.all(
      foodTruckBoothsToCheck.map(async (booth) => {
        try {
          const summary = await queryClient.fetchQuery({
            queryKey: appQueryKeys.boothMapBoothDetail(booth.id),
            queryFn: () => getBoothSummary(booth.id),
            staleTime: 5 * 60_000,
          });

          return {
            id: booth.id,
            hasDetail: hasBoothDetailContent(summary.description),
          };
        } catch {
          return {
            id: booth.id,
            hasDetail: false,
          };
        }
      }),
    ).then((results) => {
      if (cancelled) {
        return;
      }

      setBoothDetailAvailability((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          next[result.id] = result.hasDetail;
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [visibleBooths]);

  const resolveBoothSelection = useCallback(async (
    id: number,
    options: {
      detailSnap: SheetSnap;
      fallbackSnap: Extract<SheetSnap, "PEEK" | "HALF">;
    },
  ) => {
    setSelectedMapItem({ kind: "booth", id });
    setSelectedDetailItem(null);
    setSelectedCollegeId(null);
    setPubListCollegeId(null);

    try {
      const summary = await queryClient.fetchQuery({
        queryKey: appQueryKeys.boothMapBoothDetail(id),
        queryFn: () => getBoothSummary(id),
        staleTime: 5 * 60_000,
      });

      if (hasBoothDetailContent(summary.description)) {
        setBoothDetailAvailability((prev) => ({ ...prev, [id]: true }));
        setSelectedDetailItem({ kind: "booth", id });
        setSheetMode("DETAIL");
        setSheetSnap(options.detailSnap);
        return;
      }
    } catch {
      // 상세 조회에 실패해도 목록 흐름은 유지합니다.
    }

    setBoothDetailAvailability((prev) => ({ ...prev, [id]: false }));
    setSelectedDetailItem(null);
    setSheetMode("LIST");
    setSheetSnap(options.fallbackSnap);
  }, []);

  const onClickMarkerBooth = useCallback((id: number) => {
    const booth = booths.find((item) => item.id === id);
    if (isFoodTruckBooth(booth)) {
      void resolveBoothSelection(id, {
        detailSnap: "HALF",
        fallbackSnap: "HALF",
      });
      return;
    }

    setSelectedMapItem({ kind: "booth", id });
    setSelectedDetailItem(null);
    setSelectedCollegeId(null);
    setPubListCollegeId(null);
    setSheetMode("LIST");
  }, [booths, resolveBoothSelection]);

  const onClickMarkerCollege = useCallback((id: number) => {
    setPubListCollegeId(id);
    setSelectedMapItem({ kind: "college", id });
    setSelectedDetailItem(null);
    setSheetMode("LIST");
    setSheetSnap("HALF");
  }, []);

  const onSelectBoothFromList = useCallback((id: number) => {
    const selectedListBooth = booths.find((booth) => booth.id === id) ?? null;
    const shouldSwitchToFoodTruckFilter =
      primaryFilter === "ALL" && isFoodTruckBooth(selectedListBooth);

    if (shouldSwitchToFoodTruckFilter) {
      setPrimaryFilter("FOOD_TRUCK");
    }

    setSelectedMapItem({ kind: "booth", id });
    setSelectedDetailItem(null);
    setSelectedCollegeId(null);
    setPubListCollegeId(null);
    setSheetMode("LIST");
    setSheetSnap("HALF");
  }, [booths, primaryFilter]);

  const onOpenBoothDetailFromList = useCallback((id: number) => {
    void resolveBoothSelection(id, {
      detailSnap: "FULL",
      fallbackSnap: "HALF",
    });
  }, [resolveBoothSelection]);

  const onChangePrimaryFilterFromMap = useCallback((next: PrimaryFilter) => {
    handlePrimaryChange(next);
    if (next === "FOOD_TRUCK") {
      setSheetMode("LIST");
      setSheetSnap("HALF");
    }
  }, []);

  const onSelectPubFromList = useCallback((id: number) => {
    setSelectedDetailItem({ kind: "pub", id });
    setSheetMode("DETAIL");
    setSheetSnap("FULL");
  }, []);

  const handleBottomSheetBackToList = useCallback(() => {
    const isFoodTruckDetail =
      selectedDetailItem?.kind === "booth" && isFoodTruckBooth(selectedBooth);
    const isPubFlow =
      selectedDetailItem?.kind === "pub" ||
      selectedMapItem?.kind === "college" ||
      isFoodTruckDetail;

    setSelectedDetailItem(null);
    setSheetMode("LIST");
    setSheetSnap(isPubFlow ? "HALF" : "PEEK");

    if (!isPubFlow) {
      setSelectedMapItem(null);
    }
  }, [selectedBooth, selectedDetailItem, selectedMapItem]);

  const handleDetailClose = useCallback(() => {
    const isPubDetail = selectedDetailItem?.kind === "pub";
    const isFoodTruckDetail =
      selectedDetailItem?.kind === "booth" && isFoodTruckBooth(selectedBooth);

    setSelectedDetailItem(null);
    setSheetMode("LIST");
    setSheetSnap(isPubDetail || isFoodTruckDetail ? "HALF" : "PEEK");

    if (!isPubDetail && !isFoodTruckDetail) {
      setSelectedMapItem(null);
    }
  }, [selectedBooth, selectedDetailItem]);

  if (mapDataQuery.isPending && !mapDataQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--boothmap-surface)]">
        <div className="text-sm font-semibold text-[var(--boothmap-text-subtle)]">
          부스맵을 불러오는 중...
        </div>
      </div>
    );
  }

  if (mapDataQuery.error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--boothmap-surface)]">
        <div className="rounded-xl border border-[var(--boothmap-danger-border)] bg-[var(--boothmap-danger-bg)] px-4 py-3 text-sm font-semibold text-[var(--boothmap-danger-text)]">
          <div>부스맵 정보를 불러오지 못했어요.</div>
          <button
            type="button"
            onClick={() => {
              void mapDataQuery.refetch();
            }}
            className="mt-2 rounded-md border border-[var(--boothmap-danger-border)] bg-[var(--boothmap-surface)] px-2 py-1 text-xs font-semibold text-[var(--boothmap-danger-text)]"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[var(--boothmap-surface)]">
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          <KakaoMapView
            booths={visibleBooths}
            colleges={visibleColleges}
            primaryFilter={primaryFilter}
            selectedMapItem={selectedMapItem}
            sheetSnap={sheetSnap}
            viewport={mapViewport}
            onViewportChange={setMapViewport}
            onClickBooth={onClickMarkerBooth}
            onClickCollege={onClickMarkerCollege}
            onPrimaryFilterChange={onChangePrimaryFilterFromMap}
          />
        </div>
      </div>

      <div
        className={cn(
          "absolute left-1/2 top-3 w-[calc(100%-24px)] max-w-[var(--app-mobile-shell-max-width)] -translate-x-1/2",
          TOP_PANEL_Z_INDEX_CLASS[sheetSnap],
        )}
      >
        <div className="rounded-[28px] border border-[var(--boothmap-panel-border)] bg-[var(--boothmap-panel-bg)] px-3 py-2 shadow-[var(--boothmap-panel-shadow)] backdrop-blur-md">
          <FestivalDateTabs
            dates={FESTIVAL_DATES}
            selectedDate={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setSelectedMapItem(null);
              setSelectedDetailItem(null);
              setSelectedCollegeId(null);
              setPubListCollegeId(null);
              setSheetMode("LIST");
              setSheetSnap("PEEK");
            }}
          />

          <div className="mt-2">
            <PrimaryFilterChips value={primaryFilter} onChange={handlePrimaryChange} />
          </div>

          {primaryFilter === "PUB" && (
            <div className="mt-2">
              <SecondaryCollegeChips
                visible={true}
                colleges={colleges}
                selectedCollegeId={selectedCollegeId}
                onSelect={(idOrNull) => {
                  setSelectedCollegeId(idOrNull);
                  setPubListCollegeId(idOrNull);
                  setSelectedMapItem(idOrNull ? { kind: "college", id: idOrNull } : null);
                  setSelectedDetailItem(null);
                  setSheetMode("LIST");
                  setSheetSnap(idOrNull ? "HALF" : "PEEK");
                }}
              />
            </div>
          )}
        </div>
      </div>

      <BottomSheet
        mode={sheetMode}
        snap={sheetSnap}
        onSnapChange={setSheetSnap}
        onBackToList={handleBottomSheetBackToList}
        bottomOffset={bottomNavHeight}
        frameWidth={frameWidth}
      >
        {sheetSnap === "PEEK" ? (
          <div className="py-2" />
        ) : sheetMode === "LIST" ? (
          shouldShowPubList ? (
            <PubList
              pubs={visiblePubs}
              selectedCollegeId={
                primaryFilter === "PUB"
                  ? (selectedCollegeId ?? pubListCollegeId)
                  : pubListCollegeId
              }
              onSelectPub={onSelectPubFromList}
            />
          ) : (
            <BoothList
              booths={visibleBooths}
              boothDetailAvailability={boothDetailAvailability}
              onSelectBooth={onSelectBoothFromList}
              onOpenBoothDetail={onOpenBoothDetailFromList}
            />
          )
        ) : (
          <DetailSheet
            selectedItem={selectedDetailItem}
            booths={booths}
            pubs={pubs}
            colleges={colleges}
            onClose={handleDetailClose}
          />
        )}
      </BottomSheet>
    </div>
  );
}
