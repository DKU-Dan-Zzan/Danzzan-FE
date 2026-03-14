// 부스맵 페이지(전체화면 지도 + 상단 필터 카드 + 우측 상단 지도 토글 + 바텀시트) 최상위 컴포넌트입니다.

import { useMemo, useState, useCallback } from "react";
import type {
  Booth,
  College,
  MapMode,
  PrimaryFilter,
  Pub,
  SelectedMapItem,
  SelectedDetailItem,
  SheetMode,
  SheetSnap,
} from "./types/boothmap.types";
import { mockBooths, mockColleges, mockPubs } from "./data/mockBoothMapData";

import PrimaryFilterChips from "./components/PrimaryFilterChips";
import SecondaryCollegeChips from "./components/SecondaryCollegeChips";
import KakaoMapView from "./components/KakaoMapView";
import BottomSheet from "./components/BottomSheet";
import BoothList from "./components/BoothList";
import PubList from "./components/PubList";
import DetailSheet from "./components/DetailSheet";
import MapFloatingToggle from "./components/MapFloatingToggle";
import Mapbox3DView from "./components/Mapbox3DView";

export default function BoothMap() {
  const [mode, setMode] = useState<MapMode>("2D");
  const [primaryFilter, setPrimaryFilter] = useState<PrimaryFilter>("ALL");
  const [selectedMapItem, setSelectedMapItem] = useState<SelectedMapItem>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<SelectedDetailItem>(null);
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>("LIST");
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("PEEK");

  const colleges: College[] = mockColleges;
  const booths: Booth[] = mockBooths;
  const pubs: Pub[] = mockPubs;

  const frameWidth = 430;
  const bottomNavHeight = 84;

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
    if (!selectedCollegeId) return [];
    return pubs.filter((p) => p.college_id === selectedCollegeId);
  }, [pubs, selectedCollegeId]);

  // ✅ 바텀시트에서 PubList를 보여줄 조건
  const shouldShowPubList =
    primaryFilter === "PUB" || selectedMapItem?.kind === "college";

  // 일반 부스 마커 클릭
  // - 자동으로 시트를 올리지 않음
  const onClickMarkerBooth = useCallback((id: number) => {
    setSelectedMapItem({ kind: "booth", id });
    setSelectedDetailItem({ kind: "booth", id });
    setSelectedCollegeId(null);
    setSheetMode("DETAIL");
    setSheetSnap("PEEK");
  }, []);

  // 단과대(주점) 마커 클릭
  // - 주점 리스트를 보여줘야 하므로 HALF
  const onClickMarkerCollege = useCallback((id: number) => {
    setSelectedCollegeId(id);
    setSelectedMapItem({ kind: "college", id });
    setSelectedDetailItem(null);
    setSheetMode("LIST");
    setSheetSnap("HALF");
  }, []);

  // 일반 부스 리스트에서 선택
  const onSelectBoothFromList = useCallback((id: number) => {
    setSelectedMapItem({ kind: "booth", id });
    setSelectedDetailItem({ kind: "booth", id });
    setSelectedCollegeId(null);
    setSheetMode("DETAIL");
    setSheetSnap("HALF");
  }, []);

  // 주점 리스트에서 선택
  const onSelectPubFromList = useCallback((id: number) => {
    setSelectedDetailItem({ kind: "pub", id });
    setSheetMode("DETAIL");
    setSheetSnap("FULL");
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-white">
      {/* 전체 지도 영역 */}
      <div className="absolute inset-0">
        {mode === "2D" ? (
          <KakaoMapView
            booths={visibleBooths}
            colleges={visibleColleges}
            primaryFilter={primaryFilter}
            selectedMapItem={selectedMapItem}
            sheetSnap={sheetSnap}
            onClickBooth={onClickMarkerBooth}
            onClickCollege={onClickMarkerCollege}
          />
        ) : (
          <Mapbox3DView
            booths={visibleBooths}
            colleges={visibleColleges}
            primaryFilter={primaryFilter}
            selectedMapItem={selectedMapItem}
            sheetSnap={sheetSnap}
            onClickBooth={onClickMarkerBooth}
            onClickCollege={onClickMarkerCollege}
          />
        )}
      </div>

      {/* 상단 로고 + 칩 오버레이 */}
      <div className="absolute left-1/2 top-3 z-[70] w-[calc(100%-24px)] max-w-[430px] -translate-x-1/2">
        <div className="rounded-[28px] border border-white/70 bg-white/92 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
          <PrimaryFilterChips value={primaryFilter} onChange={handlePrimaryChange} />

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

      {/* 바텀시트 */}
      <BottomSheet
        mode={sheetMode}
        snap={sheetSnap}
        onSnapChange={setSheetSnap}
        onBackToList={() => {
          const isPubFlow = selectedDetailItem?.kind === "pub" || selectedMapItem?.kind === "college";

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