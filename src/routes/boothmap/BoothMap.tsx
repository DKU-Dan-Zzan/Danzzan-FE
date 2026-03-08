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

import MapModeToggle from "./components/MapModeToggle";
import PrimaryFilterChips from "./components/PrimaryFilterChips";
import SecondaryCollegeChips from "./components/SecondaryCollegeChips";
import KakaoMapPlaceholder from "./components/KaKaoMapPlaceholder";
import MapMarkersOverlay from "./components/MapMarkersOverlay";
import BottomSheet from "./components/BottomSheet";
import BoothList from "./components/BoothList";
import PubList from "./components/PubList";
import DetailSheet from "./components/DetailSheet";

export default function BoothMap() {
  const [mode, setMode] = useState<MapMode>("2D");
  const [primaryFilter, setPrimaryFilter] = useState<PrimaryFilter>("ALL");
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>("LIST");
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("PEEK");

  // ✅ 프레임 폭(노트북에서 폰 UI로 가운데 정렬용) — Layout을 이미 프레임으로 묶어놨으면 그대로 둬도 됨
  const frameWidth = 430;

  const colleges: College[] = mockColleges;
  const booths: Booth[] = mockBooths;
  const pubs: Pub[] = mockPubs;

  const handlePrimaryChange = (next: PrimaryFilter) => {
    setPrimaryFilter(next);
    setSelectedItem(null);
    setSheetMode("LIST");
    setSheetSnap("PEEK");
    if (next !== "PUB") setSelectedCollegeId(null);
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

  const bottomNavHeight = 80;

  return (
    <div className="relative h-full min-h-screen w-full">
      {/* 상단 컨트롤 */}
      <div className="mx-auto w-full max-w-[480px] px-4 pt-3">
        <div className="flex flex-col gap-3">
          <div className="flex justify-center">
            <MapModeToggle mode={mode} onChange={setMode} />
          </div>

          <PrimaryFilterChips value={primaryFilter} onChange={handlePrimaryChange} />

          <SecondaryCollegeChips
            visible={primaryFilter === "PUB"}
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
      </div>

      {/* 지도 영역 */}
      <div className="mx-auto mt-3 w-full max-w-[480px] px-4 pb-[96px]">
        <div className="relative h-[58vh] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <KakaoMapPlaceholder mode={mode} />
          <MapMarkersOverlay
            booths={visibleBooths}
            colleges={visibleColleges}
            primaryFilter={primaryFilter}
            selectedItem={selectedItem}
            onClickBooth={onClickMarkerBooth}
            onClickCollege={onClickMarkerCollege}
          />
        </div>
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
            <PubList pubs={visiblePubs} selectedCollegeId={selectedCollegeId} onSelectPub={onSelectPubFromList} />
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

      {/* (참고) BottomNav은 기존 layout/BottomNav.tsx에서 처리한다고 가정 */}
    </div>
  );
}