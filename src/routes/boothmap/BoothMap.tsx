import { useMemo, useState } from "react";
import type {
  Booth,
  College,
  MapMode,
  PrimaryFilter,
  Pub,
  SelectedItem,
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

export default function BoothMap() {
  const [mode, setMode] = useState<MapMode>("2D");
  const [primaryFilter, setPrimaryFilter] = useState<PrimaryFilter>("ALL");
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>("LIST");
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("PEEK");

  const colleges: College[] = mockColleges;
  const booths: Booth[] = mockBooths;
  const pubs: Pub[] = mockPubs;

  const frameWidth = 430;
  const bottomNavHeight = 84;

  const handlePrimaryChange = (next: PrimaryFilter) => {
    setPrimaryFilter(next);
    setSelectedItem(null);
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
    if (primaryFilter !== "PUB") return [];
    if (!selectedCollegeId) return colleges;
    return colleges.filter((c) => c.id === selectedCollegeId);
  }, [primaryFilter, colleges, selectedCollegeId]);

  const visiblePubs = useMemo(() => {
    if (primaryFilter !== "PUB") return [];
    if (!selectedCollegeId) return [];
    return pubs.filter((p) => p.college_id === selectedCollegeId);
  }, [primaryFilter, pubs, selectedCollegeId]);

  const onClickMarkerBooth = (id: number) => {
    setSelectedItem({ kind: "booth", id });
    setSheetMode("DETAIL");
    setSheetSnap("HALF");
  };

  const onClickMarkerCollege = (id: number) => {
    setSelectedCollegeId(id);
    setSelectedItem({ kind: "college", id });
    setSheetMode("LIST");
    setSheetSnap("HALF");
  };

  const onSelectBoothFromList = (id: number) => {
    setSelectedItem({ kind: "booth", id });
    setSheetMode("DETAIL");
    setSheetSnap("HALF");
  };

  const onSelectPubFromList = (id: number) => {
    setSelectedItem({ kind: "pub", id });
    setSheetMode("DETAIL");
    setSheetSnap("HALF");
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-white">
      {/* 전체 지도 영역 */}
      <div className="absolute inset-0">
          <KakaoMapView
            booths={visibleBooths}
            colleges={visibleColleges}
            primaryFilter={primaryFilter}
            selectedItem={selectedItem}
            onClickBooth={onClickMarkerBooth}
            onClickCollege={onClickMarkerCollege}
          />

          {mode === "3D" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
              <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-600 shadow-lg">
                3D 지도는 준비 중입니다
              </div>
            </div>  
        )}
      </div>

      {/* 상단 로고 + 칩 오버레이 */}
      <div className="absolute left-1/2 top-3 z-30 w-[calc(100%-24px)] max-w-[430px] -translate-x-1/2">
        <div className="rounded-[28px] border border-white/70 bg-white/92 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
          <div className="mb-3 flex justify-center">
            <img
              src="/logo.png"
              alt="단짠 로고"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          <PrimaryFilterChips value={primaryFilter} onChange={handlePrimaryChange} />

          {primaryFilter === "PUB" && (
            <div className="mt-2">
              <SecondaryCollegeChips
                visible={true}
                colleges={colleges}
                selectedCollegeId={selectedCollegeId}
                onSelect={(idOrNull) => {
                  setSelectedCollegeId(idOrNull);
                  setSelectedItem(null);
                  setSheetMode("LIST");
                  setSheetSnap(idOrNull ? "HALF" : "PEEK");
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 2D / 3D 플로팅 토글 */}
      <div className="absolute bottom-[124px] right-4 z-30">
        <MapFloatingToggle mode={mode} onChange={setMode} />
      </div>

      {/* 바텀시트 */}
      <BottomSheet
        mode={sheetMode}
        snap={sheetSnap}
        onSnapChange={setSheetSnap}
        onBackToList={() => {
          setSelectedItem(null);
          setSheetMode("LIST");
          setSheetSnap("HALF");
        }}
        bottomOffset={bottomNavHeight}
        frameWidth={frameWidth}
      >
        {sheetSnap === "PEEK" ? (
          <div className="px-1 py-2 text-sm font-semibold text-gray-400">
            위로 올려서 목록 보기
          </div>
        ) : sheetMode === "LIST" ? (
          primaryFilter === "PUB" ? (
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
            selectedItem={selectedItem}
            booths={booths}
            pubs={pubs}
            colleges={colleges}
            onClose={() => {
              setSelectedItem(null);
              setSheetMode("LIST");
              setSheetSnap("HALF");
            }}
          />
        )}
      </BottomSheet>
    </div>
  );
}