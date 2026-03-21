import { useEffect, useMemo, useState, useCallback } from "react";
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
import Mapbox3DView from "@/components/app/boothmap/Mapbox3DView";
import FestivalDateTabs from "@/components/app/boothmap/FestivalDateTabs";

import {
  getBoothMap,
  getPubs,
  type BoothDto,
  type CollegeDto,
  type PubSummaryResponse,
} from "@/api/app/boothmap/boothmapApi";

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
    type: dto.type as Booth["type"],
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
  const [primaryFilter, setPrimaryFilter] = useState<PrimaryFilter>("ALL");
  const [selectedMapItem, setSelectedMapItem] = useState<SelectedMapItem>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<SelectedDetailItem>(null);
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>("LIST");
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("PEEK");
  const [selectedDate, setSelectedDate] = useState("2026-05-12");
  const [mapViewport, setMapViewport] = useState<MapViewport>(DEFAULT_MAP_VIEWPORT);

  const [colleges, setColleges] = useState<College[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
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
    let isMounted = true;

    async function fetchMapData() {
      try {
        setIsLoading(true);
        setIsError(false);

        const [boothMapData, pubsData] = await Promise.all([
          getBoothMap(selectedDate),
          getPubs(selectedDate),
        ]);

        if (!isMounted) return;

        const mappedColleges = boothMapData.colleges.map(mapCollegeDtoToCollege);
        const mappedBooths = boothMapData.booths.map(mapBoothDtoToBooth);
        const mappedPubs = pubsData.map(mapPubSummaryToPub)

        setColleges(mappedColleges);
        setBooths(mappedBooths);
        setPubs(mappedPubs);
      } catch (error) {
        console.error("부스맵 데이터 조회 실패", error);
        if (!isMounted) return;
        setIsError(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchMapData();

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

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
    if (primaryFilter === "ALL") return booths;
    if (primaryFilter === "PUB") return [];
    return booths.filter((b) => b.type === primaryFilter);
  }, [primaryFilter, booths]);

  const visibleColleges = useMemo(() => {
    if (primaryFilter === "ALL") return colleges;
    if (primaryFilter !== "PUB") return [];
    if (!selectedCollegeId) return colleges;
    return colleges.filter((c) => c.id === selectedCollegeId);
  }, [primaryFilter, colleges, selectedCollegeId]);

  const visiblePubs = useMemo(() => {
    if (!selectedCollegeId) return pubs;
    return pubs.filter((p) => p.college_id === selectedCollegeId);
  }, [pubs, selectedCollegeId]);

  const shouldShowPubList =
    primaryFilter === "PUB" || selectedMapItem?.kind === "college";

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-sm font-semibold text-gray-500">
          부스맵을 불러오는 중...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-sm font-semibold text-red-500">
          부스맵 정보를 불러오지 못했어요.
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-white">
      <div className="absolute inset-0">
        {mode === "2D" ? (
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
        ) : (
          <Mapbox3DView
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
        )}
      </div>

      <div
        className={`absolute left-1/2 top-3 w-[calc(100%-24px)] max-w-[430px] -translate-x-1/2 ${
          sheetSnap === "FULL" ? "z-[40]" : "z-[70]"
        }`}
      >
        <div className="rounded-[28px] border border-white/70 bg-white/92 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
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
