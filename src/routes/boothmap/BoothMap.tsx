// 역할: 부스맵 메인 라우트에서 2D/3D 지도, 필터, 상세 시트 상태를 통합 제어합니다.
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Booth,
  College,
  MapMode,
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
import MapFloatingToggle from "@/components/app/boothmap/MapFloatingToggle";
import FestivalDateTabs from "@/components/app/boothmap/FestivalDateTabs";

import {
  getBoothMap,
  getPubs,
  type BoothDto,
  type CollegeDto,
  type PubSummaryResponse,
} from "@/api/app/boothmap/boothmapApi";
import { appQueryKeys, useAppQuery } from "@/lib/query";
import {
  getShouldShowPubList,
  getVisibleBooths,
  getVisibleColleges,
  getVisiblePubs,
} from "@/routes/boothmap/boothMapSelectors";
import { cn } from "@/components/common/ui/utils";

const loadMapbox3DView = async () => {
  await import("mapbox-gl/dist/mapbox-gl.css");
  return import("@/components/app/boothmap/Mapbox3DView");
};
const LazyMapbox3DView = lazy(loadMapbox3DView);

const DEFAULT_MAP_VIEWPORT: MapViewport = {
  lat: 37.3201,
  lng: 127.1276,
  kakaoLevel: 3,
  mapboxZoom: 17,
  mapboxPitch: 55,
  mapboxBearing: -20,
};

const FESTIVAL_DATES = [
  { label: "1일차", value: "2026-05-12" },
  { label: "2일차", value: "2026-05-13" },
  { label: "3일차", value: "2026-05-14" },
]
const TOP_PANEL_Z_INDEX_CLASS: Record<SheetSnap, string> = {
  PEEK: "z-[70]",
  HALF: "z-[70]",
  FULL: "z-[40]",
}
const MAP_MODE_TRANSITION_MS = 280;
const MAPBOX_WARMUP_FALLBACK_DELAY_MS = 900;
const MAPBOX_WARMUP_IDLE_TIMEOUT_MS = 1800;

const warmupMapbox3DAssets = async () => {
  await loadMapbox3DView();
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
    location_x: dto.locationX,
    location_y: dto.locationY,
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
  };
}

export default function BoothMap() {
  const [mode, setMode] = useState<MapMode>("2D");
  const [render3DLayer, setRender3DLayer] = useState(mode === "3D");
  const [primaryFilter, setPrimaryFilter] = useState<PrimaryFilter>("ALL");
  const [selectedMapItem, setSelectedMapItem] = useState<SelectedMapItem>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<SelectedDetailItem>(null);
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(null);
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

  useEffect(() => {
    if (mode === "3D") {
      const frameId = window.requestAnimationFrame(() => {
        setRender3DLayer(true);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    const timeoutId = window.setTimeout(() => {
      setRender3DLayer(false);
    }, MAP_MODE_TRANSITION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(
        () => {
          if (cancelled) {
            return;
          }
          void warmupMapbox3DAssets();
        },
        { timeout: MAPBOX_WARMUP_IDLE_TIMEOUT_MS },
      );

      return () => {
        cancelled = true;
        if (typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      void warmupMapbox3DAssets();
    }, MAPBOX_WARMUP_FALLBACK_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
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
    return getVisiblePubs(pubs, selectedCollegeId);
  }, [pubs, selectedCollegeId]);

  const shouldShowPubList = getShouldShowPubList(primaryFilter, selectedMapItem);

  const onClickMarkerBooth = useCallback((id: number) => {
    setSelectedMapItem({ kind: "booth", id });
    setSelectedDetailItem({ kind: "booth", id });
    setSelectedCollegeId(null);
    setSheetMode("DETAIL");
    setSheetSnap("PEEK");
  }, []);

  const onClickMarkerCollege = useCallback((id: number) => {
    setSelectedCollegeId(id);
    setSelectedMapItem({ kind: "college", id });
    setSelectedDetailItem(null);
    setSheetMode("LIST");
    setSheetSnap("HALF");
  }, []);

  const onSelectBoothFromList = useCallback((id: number) => {
    setSelectedMapItem({ kind: "booth", id });
    setSelectedDetailItem({ kind: "booth", id });
    setSelectedCollegeId(null);
    setSheetMode("DETAIL");
    setSheetSnap("HALF");
  }, []);

  const onSelectPubFromList = useCallback((id: number) => {
    setSelectedDetailItem({ kind: "pub", id });
    setSheetMode("DETAIL");
    setSheetSnap("FULL");
  }, []);

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
        <div
          className={cn(
            "absolute inset-0 transition-all duration-300 ease-out",
            mode === "2D"
              ? "opacity-100 translate-x-0 scale-100 pointer-events-auto"
              : "opacity-0 -translate-x-1 scale-[0.985] pointer-events-none",
          )}
        >
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
            onPrimaryFilterChange={handlePrimaryChange}
          />
        </div>

        {render3DLayer && (
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-out",
              mode === "3D"
                ? "opacity-100 translate-x-0 scale-100 pointer-events-auto"
                : "opacity-0 translate-x-1 scale-[0.985] pointer-events-none",
            )}
          >
            <Suspense
              fallback={
                <div className="flex h-full w-full items-center justify-center bg-[var(--boothmap-surface)] text-sm font-semibold text-[var(--boothmap-text-subtle)]">
                  3D 지도를 불러오는 중...
                </div>
              }
            >
              <LazyMapbox3DView
                booths={visibleBooths}
                colleges={visibleColleges}
                primaryFilter={primaryFilter}
                selectedMapItem={selectedMapItem}
                sheetSnap={sheetSnap}
                viewport={mapViewport}
                onViewportChange={setMapViewport}
                onClickBooth={onClickMarkerBooth}
                onClickCollege={onClickMarkerCollege}
                onPrimaryFilterChange={handlePrimaryChange}
              />
            </Suspense>
          </div>
        )}
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
                  setSelectedMapItem(idOrNull ? { kind: "college", id: idOrNull } : null);
                  setSelectedDetailItem(null);
                  setSheetMode("LIST");
                  setSheetSnap(idOrNull ? "HALF" : "PEEK");
                }}
              />
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-end pr-1">
          <MapFloatingToggle mode={mode} onChange={setMode} />
        </div>
      </div>

      <BottomSheet
        mode={sheetMode}
        snap={sheetSnap}
        onSnapChange={setSheetSnap}
        onBackToList={() => {
          const isPubFlow =
            selectedDetailItem?.kind === "pub" || selectedMapItem?.kind === "college";

          setSelectedDetailItem(null);
          setSheetMode("LIST");
          setSheetSnap(isPubFlow ? "HALF" : "PEEK");

          if (!isPubFlow) {
            setSelectedMapItem(null);
          }
        }}
        bottomOffset={bottomNavHeight}
        frameWidth={frameWidth}
      >
        {sheetSnap === "PEEK" ? (
          <div className="py-2" />
        ) : sheetMode === "LIST" ? (
          shouldShowPubList ? (
            <PubList
              pubs={visiblePubs}
              selectedCollegeId={selectedCollegeId}
              onSelectPub={onSelectPubFromList}
            />
          ) : (
            <BoothList booths={visibleBooths} onSelectBooth={onSelectBoothFromList} />
          )
        ) : (
          <DetailSheet
            selectedItem={selectedDetailItem}
            booths={booths}
            pubs={pubs}
            colleges={colleges}
            onClose={() => {
              const isPubDetail = selectedDetailItem?.kind === "pub";

              setSelectedDetailItem(null);
              setSheetMode("LIST");
              setSheetSnap(isPubDetail ? "HALF" : "PEEK");

              if (!isPubDetail) {
                setSelectedMapItem(null);
              }
            }}
          />
        )}
      </BottomSheet>
    </div>
  );
}
